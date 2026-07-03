/**
 * Estimativas de custos para o DRE. Ajuste conforme seu contrato Asaas e regime
 * tributário. Valores padrão aproximados (2026).
 */
export const TAXA_ASAAS = {
  boleto: 3.49, // por boleto liquidado
  pix: 1.89, // por Pix recebido
  cartao_percent: 0.0299, // % sobre cartão
  cartao_fixo: 0.49, // + fixo por transação de cartão
};

/** Alíquota de imposto sobre a receita (ex.: Simples Nacional). Ajuste conforme seu enquadramento. */
export const IMPOSTO_PERCENT = 0.06;

/** Taxa estimada do Asaas para uma cobrança liquidada, conforme a forma. */
export function taxaAsaasDe(forma: string | null | undefined, valor: number): number {
  switch (forma) {
    case "pix":
      return TAXA_ASAAS.pix;
    case "cartao":
    case "cartao_recorrente":
      return valor * TAXA_ASAAS.cartao_percent + TAXA_ASAAS.cartao_fixo;
    default:
      return TAXA_ASAAS.boleto; // boleto / não definido
  }
}
