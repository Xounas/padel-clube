/**
 * Planos (presets) do clube. A matemática é fixa: para financiar a raquete,
 * mensalidade × duração ≈ preço de mercado. O lucro/cota (~R$1.241) se mantém;
 * muda o ritmo (12x contempla mais rápido, 24x tem mensalidade menor).
 *
 * O admin ainda pode editar qualquer campo ao criar o grupo — estes são só
 * pontos de partida coerentes.
 */
export interface Plano {
  id: string;
  nome: string;
  descricao: string;
  valor_mensal: number;
  duracao_meses: number;
  total_cotas: number;
  contemplados_por_mes: number;
  contemplavel_apos_parcelas: number;
  bem_valor: number;
  bem_custo: number;
  taxa_adm_percent: number;
}

export const PLANOS: Plano[] = [
  {
    id: "24x",
    nome: "Plano 24 meses",
    descricao: "Mensalidade menor, contemplação ao longo de 24 meses.",
    valor_mensal: 110,
    duracao_meses: 24,
    total_cotas: 24,
    contemplados_por_mes: 1,
    contemplavel_apos_parcelas: 3,
    bem_valor: 2500,
    bem_custo: 1399,
    taxa_adm_percent: 15,
  },
  {
    id: "18x",
    nome: "Plano 18 meses",
    descricao: "Meio-termo: mensalidade acessível e contemplação em 18 meses.",
    valor_mensal: 150,
    duracao_meses: 18,
    total_cotas: 18,
    contemplados_por_mes: 1,
    contemplavel_apos_parcelas: 3,
    bem_valor: 2500,
    bem_custo: 1399,
    taxa_adm_percent: 15,
  },
  {
    id: "12x",
    nome: "Plano 12 meses",
    descricao: "Contemplação mais rápida (12 meses), mensalidade maior.",
    valor_mensal: 220,
    duracao_meses: 12,
    total_cotas: 12,
    contemplados_por_mes: 1,
    contemplavel_apos_parcelas: 2,
    bem_valor: 2500,
    bem_custo: 1399,
    taxa_adm_percent: 15,
  },
];

/** Lucro por cota do plano = total pago − custo da raquete. */
export const lucroPorCota = (p: Plano) =>
  p.valor_mensal * p.duracao_meses - p.bem_custo;

export const planoPorId = (id: string) =>
  PLANOS.find((p) => p.id === id) ?? PLANOS[0];
