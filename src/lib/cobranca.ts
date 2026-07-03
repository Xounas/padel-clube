/**
 * Régua de cobrança / escalada de inadimplência.
 *
 * Fluxo legal (respeitado automaticamente):
 *  - Multa ≤ 2% e juros ≤ 1% a.m. (definidos no grupo/assinatura Asaas).
 *  - Régua amigável antes do vencimento e nos primeiros dias (lembretes).
 *  - Aos 30 dias de atraso: NEGATIVAÇÃO no Serasa via Asaas — que faz a
 *    NOTIFICAÇÃO PRÉVIA obrigatória (Súmula 359 STJ) antes de incluir.
 *  - Protesto em cartório: registrado como ação (acionado manualmente no painel).
 *  - Nunca há cobrança vexatória: tudo no canal do próprio devedor.
 *  - Inadimplente perde a vez na fila (cota -> 'inadimplente').
 */

import { negativarSerasa } from "@/lib/asaas/client";

const DIAS_NEGATIVAR = Number(process.env.DIAS_NEGATIVAR ?? 30);

function diasEntre(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / 86400000);
}

async function jaTemAcao(db: any, cobrancaId: string, tipo: string) {
  const { count } = await db
    .from("cobranca_acoes")
    .select("id", { count: "exact", head: true })
    .eq("cobranca_id", cobrancaId)
    .eq("tipo", tipo);
  return (count ?? 0) > 0;
}

async function logAcao(
  db: any,
  cobrancaId: string,
  cotaId: string | null,
  tipo: string,
  canal: string,
  resultado: string,
  detalhe?: string,
) {
  await db.from("cobranca_acoes").insert({
    cobranca_id: cobrancaId,
    cota_id: cotaId,
    tipo,
    canal,
    resultado,
    detalhe,
  });
}

/**
 * Processa toda a inadimplência: recalcula dias de atraso, dispara régua e
 * escala para negativação aos 30 dias. Idempotente (checa ações já feitas).
 */
export async function processarReguaCobranca(db: any) {
  const hoje = new Date();
  const resumo = { atualizadas: 0, lembretes: 0, negativadas: 0, erros: [] as string[] };

  const { data: atrasadas } = await db
    .from("cobrancas")
    .select(
      "id, cota_id, status, vencimento, dias_atraso, negativado_em, asaas_payment_id, cotas(numero, participante_id, profiles(nome, cpf))",
    )
    .eq("status", "atrasado")
    .limit(500);

  for (const c of atrasadas ?? []) {
    const dias = Math.max(0, diasEntre(hoje, new Date(c.vencimento)));

    // 1) atualiza dias de atraso + marca cota inadimplente
    await db.from("cobrancas").update({ dias_atraso: dias }).eq("id", c.id);
    if (c.cota_id) {
      await db
        .from("cotas")
        .update({ status: "inadimplente" })
        .eq("id", c.cota_id)
        .eq("status", "ativa");
    }
    resumo.atualizadas++;

    // 2) régua amigável (uma vez)
    if (dias >= 1 && !(await jaTemAcao(db, c.id, "lembrete"))) {
      await logAcao(db, c.id, c.cota_id, "lembrete", "email", "enviado",
        `Lembrete de atraso (${dias}d). Asaas notifica automaticamente.`);
      resumo.lembretes++;
    }

    // 3) escalada: negativação aos 30 dias (uma vez)
    if (
      dias >= DIAS_NEGATIVAR &&
      !c.negativado_em &&
      c.asaas_payment_id
    ) {
      try {
        const nome = c.cotas?.profiles?.nome ?? undefined;
        const cpf = c.cotas?.profiles?.cpf ?? undefined;
        const dunning: any = await negativarSerasa({
          payment: c.asaas_payment_id,
          description: `Inadimplência ${dias} dias — cota #${c.cotas?.numero ?? ""}`,
          customerName: nome,
          customerCpfCnpj: cpf,
        });
        await db
          .from("cobrancas")
          .update({ negativado_em: hoje.toISOString() })
          .eq("id", c.id);
        await logAcao(db, c.id, c.cota_id, "negativacao", "serasa", "agendado",
          `Negativação Serasa via Asaas (dunning ${dunning?.id ?? "?"}). Notificação prévia legal em curso.`);
        resumo.negativadas++;
      } catch (e: any) {
        resumo.erros.push(`cobranca ${c.id}: ${e?.message ?? e}`);
        await logAcao(db, c.id, c.cota_id, "negativacao", "serasa", "falhou",
          e?.message ?? String(e));
      }
    }
  }

  return resumo;
}

export { DIAS_NEGATIVAR };
