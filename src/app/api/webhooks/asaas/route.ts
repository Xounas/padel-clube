import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Webhook do Asaas — recebe eventos de cobrança e sincroniza `cobrancas`.
 * Configure no painel Asaas apontando para: /api/webhooks/asaas
 * e defina o mesmo token em ASAAS_WEBHOOK_TOKEN.
 *
 * Eventos tratados:
 *  PAYMENT_CREATED   -> cria/atualiza parcela (pendente)
 *  PAYMENT_RECEIVED  -> marca paga + reconhece receita de adm
 *  PAYMENT_CONFIRMED -> idem (cartão)
 *  PAYMENT_OVERDUE   -> marca atrasado (dispara inadimplência)
 */
export async function POST(req: NextRequest) {
  // valida token
  const token = req.headers.get("asaas-access-token");
  if (
    process.env.ASAAS_WEBHOOK_TOKEN &&
    token !== process.env.ASAAS_WEBHOOK_TOKEN
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.event || !body?.payment) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const db = createAdminClient();
  const { event, payment } = body;

  // idempotência: registra o evento bruto
  await db.from("webhook_events").insert({
    provider: "asaas",
    event_id: body.id ?? payment.id + ":" + event,
    event_type: event,
    payload: body,
  });

  // localiza a cobrança pela referência do Asaas
  const cotaId = payment.externalReference || null;

  const patch: Record<string, any> = {
    asaas_payment_id: payment.id,
    asaas_invoice_url: payment.invoiceUrl ?? null,
    valor: payment.value,
    vencimento: payment.dueDate,
  };

  switch (event) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED":
      patch.status = "pago";
      patch.data_pagamento = payment.paymentDate ?? payment.clientPaymentDate;
      patch.valor_pago = payment.value;
      patch.forma =
        payment.billingType === "PIX"
          ? "pix"
          : payment.billingType === "CREDIT_CARD"
            ? "cartao"
            : "boleto";
      break;
    case "PAYMENT_OVERDUE":
      patch.status = "atrasado";
      break;
    case "PAYMENT_DELETED":
    case "PAYMENT_REFUNDED":
      patch.status = event === "PAYMENT_REFUNDED" ? "estornado" : "cancelado";
      break;
    default:
      patch.status = "pendente";
  }

  // atualiza pela asaas_payment_id; se não existir, faz upsert por (cota+competencia)
  const { data: existing } = await db
    .from("cobrancas")
    .select("id, cota_id")
    .eq("asaas_payment_id", payment.id)
    .maybeSingle();

  if (existing) {
    await db.from("cobrancas").update(patch).eq("id", existing.id);
    if (patch.status && cotaId) await db.rpc("recalc_pontuacao", { p_cota_id: existing.cota_id });
  } else if (cotaId) {
    const competencia = (payment.dueDate as string).slice(0, 7) + "-01";
    await db.from("cobrancas").upsert(
      { cota_id: cotaId, competencia, ...patch },
      { onConflict: "cota_id,competencia" },
    );
    await db.rpc("recalc_pontuacao", { p_cota_id: cotaId });
  }

  return NextResponse.json({ ok: true });
}
