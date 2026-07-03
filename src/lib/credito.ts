/**
 * Análise de crédito na adesão — arquitetura PLUGÁVEL.
 *
 * Troca-se o provider só por env, sem tocar no resto do sistema:
 *   CREDIT_PROVIDER   = stub | bigdatacorp | idwall | serasa   (default: stub)
 *   CREDIT_MIN_SCORE  = 500                                     (nota p/ aprovar)
 *   CREDIT_API_KEY / CREDIT_API_TOKEN ...                       (do provider)
 *
 * Para ligar um provider real: implemente `consultar()` no adaptador
 * correspondente (há um esqueleto pronto de BigDataCorp abaixo) e defina
 * CREDIT_PROVIDER + as credenciais. O contrato de retorno não muda.
 */

export interface ResultadoCredito {
  score: number; // 0–1000
  aprovado: boolean;
  motivo: string;
  /** true quando não deu p/ decidir automaticamente (revisar manualmente). */
  pendente?: boolean;
  bruto?: unknown; // resposta crua do provider (auditoria)
}

export interface CreditoProvider {
  nome: string;
  consultar(cpf: string): Promise<ResultadoCredito>;
}

const MIN_SCORE = Number(process.env.CREDIT_MIN_SCORE ?? 500);
const soDigitos = (cpf: string) => cpf.replace(/\D/g, "");

// ---------------------------------------------------------------------
// STUB (dev/sandbox) — score pseudo-determinístico a partir do CPF.
// NÃO é análise real; serve para testar o fluxo ponta a ponta.
// ---------------------------------------------------------------------
const stubProvider: CreditoProvider = {
  nome: "stub",
  async consultar(cpf) {
    const d = soDigitos(cpf);
    let h = 0;
    for (const c of d) h = (h * 31 + Number(c)) % 1000;
    const score = 300 + (h % 701); // 300–1000
    return {
      score,
      aprovado: score >= MIN_SCORE,
      motivo:
        score >= MIN_SCORE
          ? `Aprovado (score ${score}, STUB dev)`
          : `Recusado por score baixo (${score} < ${MIN_SCORE}, STUB dev)`,
    };
  },
};

// ---------------------------------------------------------------------
// ESQUELETO: BigDataCorp (exemplo de provider REST moderno).
// Preencha o endpoint/campos conforme o contrato do seu plano e ligue com
// CREDIT_PROVIDER=bigdatacorp + CREDIT_API_TOKEN/CREDIT_API_ACCESS.
// Enquanto sem credencial, retorna PENDENTE (revisão manual) — não bloqueia.
// ---------------------------------------------------------------------
const bigDataCorpProvider: CreditoProvider = {
  nome: "bigdatacorp",
  async consultar(cpf) {
    const token = process.env.CREDIT_API_TOKEN;
    const access = process.env.CREDIT_API_ACCESS;
    if (!token || !access) {
      return {
        score: 0,
        aprovado: false,
        pendente: true,
        motivo: "BigDataCorp sem credencial — revisar manualmente",
      };
    }
    // TODO: ajustar ao seu contrato. Exemplo ilustrativo:
    const res = await fetch("https://plataforma.bigdatacorp.com.br/pessoas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        AccessToken: token,
        TokenId: access,
      },
      body: JSON.stringify({
        Datasets: "basic_data,financial_risk",
        q: `doc{${soDigitos(cpf)}}`,
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    // Mapeie o score do dataset de risco para 0–1000:
    const score = Number(
      data?.Result?.[0]?.FinancialRisk?.Score ?? 0,
    );
    return {
      score,
      aprovado: score >= MIN_SCORE,
      motivo:
        score >= MIN_SCORE
          ? `Aprovado (score ${score})`
          : `Recusado (score ${score} < ${MIN_SCORE})`,
      bruto: data,
    };
  },
};

// Registro de providers. Adicione idwall/serasa no mesmo formato.
const PROVIDERS: Record<string, CreditoProvider> = {
  stub: stubProvider,
  bigdatacorp: bigDataCorpProvider,
};

function getProvider(): CreditoProvider {
  const nome = process.env.CREDIT_PROVIDER ?? "stub";
  return PROVIDERS[nome] ?? stubProvider;
}

/** Ponto de entrada usado pela adesão. */
export async function consultarCredito(cpf: string): Promise<ResultadoCredito> {
  if (soDigitos(cpf).length !== 11) {
    return { score: 0, aprovado: false, motivo: "CPF inválido" };
  }
  try {
    return await getProvider().consultar(cpf);
  } catch (e: any) {
    // falha do provider não deve derrubar a adesão — vira revisão manual
    return {
      score: 0,
      aprovado: false,
      pendente: true,
      motivo: `Falha na consulta de crédito (${e?.message ?? e}) — revisar manualmente`,
    };
  }
}

export { MIN_SCORE };
