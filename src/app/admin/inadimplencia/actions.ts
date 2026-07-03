"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { processarReguaCobranca } from "@/lib/cobranca";
import { negativarSerasa } from "@/lib/asaas/client";
import { revalidatePath } from "next/cache";

/** Roda a régua de cobrança manualmente (mesmo que o cron). */
export async function rodarReguaManual() {
  await requireAdmin();
  const db = createAdminClient();
  const r = await processarReguaCobranca(db);
  revalidatePath("/admin/inadimplencia");
  return r;
}

async function contexto(cobrancaId: string) {
  const db = createAdminClient();
  const { data } = await db
    .from("cobrancas")
    .select("id, cota_id, asaas_payment_id, cotas(numero, profiles(nome, cpf))")
    .eq("id", cobrancaId)
    .single();
  return { db, c: data as any };
}

/** Negativação manual no Serasa via Asaas. */
export async function negativarManual(cobrancaId: string) {
  await requireAdmin();
  const { db, c } = await contexto(cobrancaId);
  if (!c?.asaas_payment_id) throw new Error("Cobrança sem pagamento Asaas.");
  const dunning: any = await negativarSerasa({
    payment: c.asaas_payment_id,
    customerName: c.cotas?.profiles?.nome,
    customerCpfCnpj: c.cotas?.profiles?.cpf,
    description: `Negativação manual — cota #${c.cotas?.numero ?? ""}`,
  });
  await db
    .from("cobrancas")
    .update({ negativado_em: new Date().toISOString() })
    .eq("id", cobrancaId);
  await db.from("cobranca_acoes").insert({
    cobranca_id: cobrancaId,
    cota_id: c.cota_id,
    tipo: "negativacao",
    canal: "serasa",
    resultado: "agendado",
    detalhe: `Manual (dunning ${dunning?.id ?? "?"})`,
  });
  revalidatePath("/admin/inadimplencia");
}

/** Registra protesto em cartório (ação externa via cartório/Asaas). */
export async function registrarProtesto(cobrancaId: string) {
  await requireAdmin();
  const { db, c } = await contexto(cobrancaId);
  await db
    .from("cobrancas")
    .update({ protestado_em: new Date().toISOString() })
    .eq("id", cobrancaId);
  await db.from("cobranca_acoes").insert({
    cobranca_id: cobrancaId,
    cota_id: c?.cota_id ?? null,
    tipo: "protesto",
    canal: "cartorio",
    resultado: "registrado",
    detalhe: "Protesto da nota promissória/boleto encaminhado ao cartório.",
  });
  revalidatePath("/admin/inadimplencia");
}

/** Registra acordo (pausa a escalada). */
export async function registrarAcordo(cobrancaId: string) {
  await requireAdmin();
  const { db, c } = await contexto(cobrancaId);
  await db.from("cobranca_acoes").insert({
    cobranca_id: cobrancaId,
    cota_id: c?.cota_id ?? null,
    tipo: "acordo",
    canal: "manual",
    resultado: "registrado",
    detalhe: "Acordo de pagamento registrado com o devedor.",
  });
  revalidatePath("/admin/inadimplencia");
}
