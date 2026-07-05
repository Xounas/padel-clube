import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { consultarCredito } from "@/lib/credito";
import { createCustomer, tokenizarCartao } from "@/lib/asaas/client";

/**
 * Adesão de um participante a um grupo.
 * Pagamento é SEMPRE no cartão (recorrente ou parcelado). A cota fica
 * "aguardando" aprovação manual do admin — NENHUMA cobrança é criada aqui.
 * A análise de crédito é apenas informativa (o admin decide).
 *
 * body: { grupo_id, cpf, telefone, aceite_contrato,
 *         cartao: {holderName, number, expiryMonth, expiryYear, ccv},
 *         endereco: {cep, numero},
 *         pagamento_tipo: 'recorrente'|'parcelado', parcelas?: number }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { grupo_id, cpf, telefone, aceite_contrato, cartao, endereco } = body;
  const pagamentoTipo = body.pagamento_tipo === "parcelado" ? "parcelado" : "recorrente";

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
  // pagamento SÓ no cartão de crédito
  if (!cartao?.number || !cartao?.ccv || !cartao?.expiryMonth) {
    return NextResponse.json(
      { error: "O pagamento é no cartão de crédito. Preencha os dados do cartão." },
      { status: 400 },
    );
  }

  const db = createAdminClient(); // writes de cota exigem service role

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

  // 1) análise de crédito — APENAS INFORMATIVA (o admin aprova manualmente depois)
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

  // 2) cliente Asaas (reusa se já existir) — erros do Asaas viram JSON legível
  let customerId = profile?.asaas_customer_id ?? null;
  if (!customerId) {
    try {
      const customer = await createCustomer({
        name: profile?.nome || profile?.email || "Membro RaqueteClub",
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

  // 3) tokeniza o cartão (obrigatório) — nº do cartão NÃO fica conosco
  let cartaoInfo: { token: string; ultimos4: string; bandeira: string };
  try {
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
  } catch (e: any) {
    return NextResponse.json(
      { error: `Cartão recusado: ${e?.message ?? e}` },
      { status: 400 },
    );
  }

  // 4) aloca a cota como AGUARDANDO aprovação (sem cobrança ainda)
  const valorTotal = Number(grupo.valor_mensal) * Number(grupo.duracao_meses);
  const snapshot = {
    nome: profile?.nome || profile?.email || "Aderente",
    cpf,
    grupo_nome: grupo.nome,
    bem_descricao: grupo.bem_descricao || "Raquete de padel",
    cota_numero: (usadas ?? 0) + 1,
    valor_mensal: Number(grupo.valor_mensal),
    duracao_meses: Number(grupo.duracao_meses),
    valor_total: valorTotal,
    bem_valor: Number(grupo.bem_valor),
    promissoria_valor: valorTotal,
    multa_percent: Number(grupo.multa_atraso_percent),
    juros_am_percent: 1,
    aceite_em: "",
    aceite_ip: "",
  };

  const { data: cota, error: cotaErr } = await db
    .from("cotas")
    .insert({
      grupo_id,
      participante_id: user.id,
      numero: (usadas ?? 0) + 1,
      status: "aguardando", // aguardando aprovação do admin
      data_adesao: new Date().toISOString().slice(0, 10),
      contrato_snapshot: snapshot,
      cartao_token: cartaoInfo.token,
      cartao_ultimos4: cartaoInfo.ultimos4,
      cartao_bandeira: cartaoInfo.bandeira,
      pagamento_tipo: pagamentoTipo,
      parcelas:
        pagamentoTipo === "parcelado"
          ? Number(body.parcelas || grupo.duracao_meses)
          : null,
    })
    .select("id, numero")
    .single();
  if (cotaErr || !cota) {
    return NextResponse.json(
      { error: "não foi possível alocar a cota (tente novamente)" },
      { status: 409 },
    );
  }

  return NextResponse.json({
    aguardando: true,
    cota: cota.numero,
    cota_id: cota.id,
    pagamento_tipo: pagamentoTipo,
    cartao: { ultimos4: cartaoInfo.ultimos4, bandeira: cartaoInfo.bandeira },
  });
}
