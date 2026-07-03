import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { consultarCredito } from "@/lib/credito";
import {
  createCustomer,
  createSubscription,
  listSubscriptionPayments,
  tokenizarCartao,
} from "@/lib/asaas/client";

/**
 * Adesão de um participante a um grupo.
 * Orquestra: análise de crédito -> cliente Asaas -> aloca cota -> assinatura recorrente.
 *
 * body: { grupo_id, cpf, telefone, aceite_contrato: boolean,
 *         cartao?: {holderName, number, expiryMonth, expiryYear, ccv},
 *         endereco?: {cep, numero} }   // cartão => débito automático
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { grupo_id, cpf, telefone, aceite_contrato, cartao, endereco } = body;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (!grupo_id || !cpf) {
    return NextResponse.json(
      { error: "grupo_id e cpf são obrigatórios" },
      { status: 400 },
    );
  }
  if (!aceite_contrato) {
    return NextResponse.json(
      { error: "É necessário aceitar o contrato e a nota promissória." },
      { status: 400 },
    );
  }

  const db = createAdminClient(); // writes de cota/assinatura exigem service role

  // perfil + dados básicos
  const { data: profile } = await db
    .from("profiles")
    .select("id, nome, email, cpf, asaas_customer_id")
    .eq("id", user.id)
    .single();

  // grupo aberto e com vaga
  const { data: grupo } = await db
    .from("grupos")
    .select("*")
    .eq("id", grupo_id)
    .single();
  if (!grupo || grupo.status === "encerrado" || grupo.status === "cancelado") {
    return NextResponse.json({ error: "grupo indisponível" }, { status: 400 });
  }
  const { count: usadas } = await db
    .from("cotas")
    .select("id", { count: "exact", head: true })
    .eq("grupo_id", grupo_id);
  if ((usadas ?? 0) >= grupo.total_cotas) {
    return NextResponse.json({ error: "grupo lotado" }, { status: 400 });
  }

  // 1) análise de crédito
  const credito = await consultarCredito(cpf);
  const statusCredito = credito.aprovado
    ? "aprovado"
    : credito.pendente
      ? "pendente"
      : "recusado";
  await db
    .from("profiles")
    .update({
      cpf,
      telefone: telefone ?? null,
      score_credito: credito.score,
      analise_credito_status: statusCredito,
      analise_credito_em: new Date().toISOString(),
    })
    .eq("id", user.id);

  // recusa só bloqueia quando o bureau reprova explicitamente.
  // 'pendente' (provider sem credencial/falha) segue para revisão manual do admin.
  if (statusCredito === "recusado") {
    return NextResponse.json(
      { aprovado: false, motivo: credito.motivo },
      { status: 200 },
    );
  }

  // 2) cliente Asaas (reusa se já existir) — erros do Asaas viram JSON legível
  let customerId = profile?.asaas_customer_id ?? null;
  if (!customerId) {
    try {
      const customer = await createCustomer({
        name: profile?.nome || profile?.email || "Membro Padel Clube",
        cpfCnpj: cpf.replace(/\D/g, ""),
        email: profile?.email ?? undefined,
        mobilePhone: telefone ?? undefined,
        externalReference: user.id,
      });
      customerId = customer.id;
      await db
        .from("profiles")
        .update({ asaas_customer_id: customerId })
        .eq("id", user.id);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message ?? "Falha ao criar cliente no Asaas" },
        { status: 400 },
      );
    }
  }

  // 3) aloca a próxima cota livre (numero sequencial)
  const numero = (usadas ?? 0) + 1;
  const { data: cota, error: cotaErr } = await db
    .from("cotas")
    .insert({
      grupo_id,
      participante_id: user.id,
      numero,
      status: "ativa",
      data_adesao: new Date().toISOString().slice(0, 10),
    })
    .select("id, numero")
    .single();
  if (cotaErr || !cota) {
    return NextResponse.json(
      { error: "não foi possível alocar a cota (tente novamente)" },
      { status: 409 },
    );
  }

  // 4) assinatura recorrente no Asaas (gera as parcelas mensais)
  const hoje = new Date();
  const primeiroVenc = grupo.data_inicio
    ? new Date(grupo.data_inicio)
    : new Date(hoje.getTime() + 3 * 86400000); // +3 dias
  const nextDueDate = primeiroVenc.toISOString().slice(0, 10);

  try {
    // 4a) débito automático: tokeniza o cartão (nº do cartão NÃO fica conosco)
    let cartaoInfo: {
      token: string;
      ultimos4: string;
      bandeira: string;
    } | null = null;
    if (cartao?.number) {
      const tk = await tokenizarCartao({
        customer: customerId!,
        creditCard: {
          holderName: cartao.holderName,
          number: String(cartao.number).replace(/\s/g, ""),
          expiryMonth: cartao.expiryMonth,
          expiryYear: cartao.expiryYear,
          ccv: cartao.ccv,
        },
        creditCardHolderInfo: {
          name: profile?.nome || cartao.holderName,
          email: profile?.email || "",
          cpfCnpj: cpf.replace(/\D/g, ""),
          postalCode: (endereco?.cep ?? "").replace(/\D/g, ""),
          addressNumber: endereco?.numero ?? "",
          phone: (telefone ?? "").replace(/\D/g, ""),
        },
        remoteIp: ip,
      });
      cartaoInfo = {
        token: tk.creditCardToken,
        ultimos4: tk.creditCardNumber,
        bandeira: tk.creditCardBrand,
      };
    }

    // 4b) assinatura recorrente (débito automático se houver token)
    const sub = await createSubscription({
      customer: customerId!,
      value: Number(grupo.valor_mensal),
      nextDueDate,
      billingType: cartaoInfo
        ? "CREDIT_CARD"
        : ((process.env.ASAAS_BILLING as any) ?? "UNDEFINED"),
      description: `Cota ${cota.numero} — ${grupo.nome}`,
      maxPayments: Number(grupo.duracao_meses),
      externalReference: cota.id,
      fine: { value: Number(grupo.multa_atraso_percent) },
      interest: { value: 1 }, // 1% a.m. (teto legal)
      creditCardToken: cartaoInfo?.token,
    });

    // snapshot do contrato + aceite (validade jurídica da promissória)
    const valorTotal = Number(grupo.valor_mensal) * Number(grupo.duracao_meses);
    const snapshot = {
      nome: profile?.nome || profile?.email || "Aderente",
      cpf,
      grupo_nome: grupo.nome,
      bem_descricao: grupo.bem_descricao || "Raquete de padel",
      cota_numero: cota.numero,
      valor_mensal: Number(grupo.valor_mensal),
      duracao_meses: Number(grupo.duracao_meses),
      valor_total: valorTotal,
      bem_valor: Number(grupo.bem_valor),
      promissoria_valor: valorTotal,
      multa_percent: Number(grupo.multa_atraso_percent),
      juros_am_percent: 1,
      aceite_em: "", // preenchido no ACEITE ONLINE do portal
      aceite_ip: "",
    };

    // liga a assinatura à cota e guarda a minuta; ACEITE fica pendente no portal
    await db
      .from("cotas")
      .update({
        asaas_subscription_id: sub.id,
        contrato_snapshot: snapshot,
        cartao_token: cartaoInfo?.token ?? null,
        cartao_ultimos4: cartaoInfo?.ultimos4 ?? null,
        cartao_bandeira: cartaoInfo?.bandeira ?? null,
      })
      .eq("id", cota.id);

    // insere já em `cobrancas` as parcelas que o Asaas gerou (não depender só do
    // webhook). As parcelas futuras chegam depois via webhook PAYMENT_CREATED.
    let payUrl: string | null = null;
    try {
      const pays: any = await listSubscriptionPayments(sub.id);
      const lista: any[] = pays?.data ?? [];
      payUrl = lista[0]?.invoiceUrl ?? null;
      for (const p of lista) {
        const pago = p.status === "RECEIVED" || p.status === "CONFIRMED";
        await db.from("cobrancas").upsert(
          {
            cota_id: cota.id,
            grupo_id,
            competencia: String(p.dueDate).slice(0, 7) + "-01",
            valor: p.value,
            valor_taxa_adm:
              Number(p.value) * (Number(grupo.taxa_adm_percent) / 100),
            vencimento: p.dueDate,
            status: pago ? "pago" : "pendente",
            asaas_payment_id: p.id,
            asaas_invoice_url: p.invoiceUrl ?? null,
            data_pagamento: pago ? (p.paymentDate ?? null) : null,
            valor_pago: pago ? p.value : null,
          },
          { onConflict: "cota_id,competencia" },
        );
      }
      await db.rpc("recalc_pontuacao", { p_cota_id: cota.id });
    } catch {
      /* fatura pode ainda não ter sido gerada — webhook cobre depois */
    }

    return NextResponse.json({
      aprovado: true,
      cota: cota.numero,
      cota_id: cota.id,
      subscription_id: sub.id,
      debito_automatico: !!cartaoInfo,
      cartao: cartaoInfo
        ? { ultimos4: cartaoInfo.ultimos4, bandeira: cartaoInfo.bandeira }
        : null,
      pay_url: payUrl,
    });
  } catch (e: any) {
    // rollback da cota se a assinatura falhar
    await db.from("cotas").delete().eq("id", cota.id);
    return NextResponse.json(
      { error: `Falha ao criar assinatura: ${e?.message ?? e}` },
      { status: 502 },
    );
  }
}
