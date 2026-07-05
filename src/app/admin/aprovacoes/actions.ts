"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createSubscription,
  createInstallment,
  listSubscriptionPayments,
  listInstallmentPayments,
} from "@/lib/asaas/client";
import { revalidatePath } from "next/cache";

/**
 * Aprova a cota: só aqui a cobrança no cartão começa.
 * - recorrente -> assinatura mensal (CREDIT_CARD)
 * - parcelado  -> parcelamento no cartão (installment)
 */
export async function aprovarCota(cotaId: string) {
  await requireAdmin();
  const db = createAdminClient();

  const { data: cota } = await db
    .from("cotas")
    .select("*, grupos(*), profiles(asaas_customer_id, nome)")
    .eq("id", cotaId)
    .single();
  if (!cota) throw new Error("Cota não encontrada.");
  if (cota.status !== "aguardando")
    throw new Error("Esta cota não está aguardando aprovação.");
  if (!cota.aceite_em)
    throw new Error("O membro ainda não aceitou o contrato online.");
  if (!cota.cartao_token) throw new Error("Cota sem cartão tokenizado.");

  const grupo: any = cota.grupos;
  const customerId = (cota.profiles as any)?.asaas_customer_id;
  if (!customerId) throw new Error("Cliente Asaas ausente no perfil.");

  const hoje = new Date();
  const nextDueDate = (
    grupo.data_inicio
      ? new Date(grupo.data_inicio)
      : new Date(hoje.getTime() + 3 * 86400000)
  )
    .toISOString()
    .slice(0, 10);
  const taxaPct = Number(grupo.taxa_adm_percent) / 100;

  const inserirParcela = async (p: any) => {
    const pago = p.status === "RECEIVED" || p.status === "CONFIRMED";
    await db.from("cobrancas").upsert(
      {
        cota_id: cota.id,
        grupo_id: grupo.id,
        competencia: String(p.dueDate).slice(0, 7) + "-01",
        valor: p.value,
        valor_taxa_adm: Number(p.value) * taxaPct,
        vencimento: p.dueDate,
        status: pago ? "pago" : "pendente",
        forma: "cartao",
        asaas_payment_id: p.id,
        asaas_invoice_url: p.invoiceUrl ?? null,
        data_pagamento: pago ? (p.paymentDate ?? null) : null,
        valor_pago: pago ? p.value : null,
      },
      { onConflict: "cota_id,competencia" },
    );
  };

  try {
    if (cota.pagamento_tipo === "parcelado") {
      const parcelas = Number(cota.parcelas || grupo.duracao_meses);
      const inst: any = await createInstallment({
        customer: customerId,
        installmentCount: parcelas,
        totalValue: Number(grupo.bem_valor),
        dueDate: nextDueDate,
        creditCardToken: cota.cartao_token,
        description: `Cota ${cota.numero} — ${grupo.nome} (parcelado ${parcelas}x)`,
        externalReference: cota.id,
        fine: { value: Number(grupo.multa_atraso_percent) },
        interest: { value: 1 },
      });
      const instId = inst?.installment ?? inst?.id;
      try {
        const pays: any = await listInstallmentPayments(instId);
        for (const p of pays?.data ?? []) await inserirParcela(p);
      } catch {
        /* webhook cobre depois */
      }
    } else {
      const sub: any = await createSubscription({
        customer: customerId,
        value: Number(grupo.valor_mensal),
        nextDueDate,
        billingType: "CREDIT_CARD",
        description: `Cota ${cota.numero} — ${grupo.nome}`,
        maxPayments: Number(grupo.duracao_meses),
        externalReference: cota.id,
        fine: { value: Number(grupo.multa_atraso_percent) },
        interest: { value: 1 },
        creditCardToken: cota.cartao_token,
      });
      await db
        .from("cotas")
        .update({ asaas_subscription_id: sub.id })
        .eq("id", cota.id);
      // garante a 1ª parcela mesmo se o Asaas ainda não gerou
      await db.from("cobrancas").upsert(
        {
          cota_id: cota.id,
          grupo_id: grupo.id,
          competencia: nextDueDate.slice(0, 7) + "-01",
          parcela_num: 1,
          valor: Number(grupo.valor_mensal),
          valor_taxa_adm: Number(grupo.valor_mensal) * taxaPct,
          vencimento: nextDueDate,
          status: "pendente",
          forma: "cartao",
        },
        { onConflict: "cota_id,competencia" },
      );
      try {
        const pays: any = await listSubscriptionPayments(sub.id);
        for (const p of pays?.data ?? []) await inserirParcela(p);
      } catch {
        /* webhook cobre depois */
      }
    }

    await db
      .from("cotas")
      .update({ status: "ativa", aprovada_em: new Date().toISOString() })
      .eq("id", cota.id);
    await db.rpc("recalc_pontuacao", { p_cota_id: cota.id });
  } catch (e: any) {
    throw new Error(`Falha ao ativar a cobrança: ${e?.message ?? e}`);
  }

  revalidatePath("/admin/aprovacoes");
  revalidatePath("/admin/dashboard");
}

/** Recusa a cota (nada foi cobrado). */
export async function recusarCota(cotaId: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("cotas")
    .update({ status: "cancelada" })
    .eq("id", cotaId)
    .eq("status", "aguardando");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/aprovacoes");
}
