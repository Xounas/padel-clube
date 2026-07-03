/**
 * Cliente Asaas — cobrança recorrente (assinatura), boleto/PIX/cartão e webhooks.
 * Docs: https://docs.asaas.com/
 *
 * Fluxo do clube:
 *  1) createCustomer  -> cria/recupera cliente (participante) no Asaas
 *  2) createSubscription -> assinatura mensal da COTA (gera parcelas automáticas)
 *  3) webhook PAYMENT_RECEIVED/OVERDUE -> atualiza cobrancas no Supabase
 */

const ASAAS_ENV = process.env.ASAAS_ENV ?? "sandbox";
const BASE_URL =
  ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

const API_KEY = process.env.ASAAS_API_KEY ?? "";

type AsaasBilling = "BOLETO" | "PIX" | "CREDIT_CARD" | "UNDEFINED";

async function asaas<T = any>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: any },
): Promise<T> {
  if (!API_KEY) throw new Error("ASAAS_API_KEY ausente no ambiente");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: API_KEY,
      ...(init?.headers ?? {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.errors?.map((e: any) => e.description).join("; ") ??
      `Asaas ${res.status}`;
    throw new Error(`Asaas erro: ${msg}`);
  }
  return data as T;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
}

/** Cria (ou reusa) o cliente do participante no Asaas. */
export async function createCustomer(params: {
  name: string;
  cpfCnpj: string;
  email?: string;
  mobilePhone?: string;
  externalReference?: string; // profile.id
}): Promise<AsaasCustomer> {
  return asaas<AsaasCustomer>("/customers", { method: "POST", body: params });
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  status: string;
}

export interface CartaoInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}
export interface TitularInput {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

/**
 * Tokeniza um cartão no Asaas (PCI). O número do cartão vai direto ao Asaas e
 * NÃO é armazenado por nós — recebemos apenas um creditCardToken reutilizável.
 */
export async function tokenizarCartao(params: {
  customer: string;
  creditCard: CartaoInput;
  creditCardHolderInfo: TitularInput;
  remoteIp: string;
}): Promise<{ creditCardToken: string; creditCardNumber: string; creditCardBrand: string }> {
  return asaas("/creditCard/tokenizeCreditCard", {
    method: "POST",
    body: params,
  });
}

/**
 * Cria a assinatura mensal da cota. O Asaas gera as parcelas mensais
 * automaticamente e dispara webhooks a cada geração/pagamento/atraso.
 */
export async function createSubscription(params: {
  customer: string; // asaas_customer_id
  value: number; // valor_mensal da cota
  nextDueDate: string; // yyyy-mm-dd (1º vencimento)
  billingType?: AsaasBilling; // default UNDEFINED (cliente escolhe)
  cycle?: "MONTHLY";
  description?: string; // ex.: "Cota 07 — Grupo Raquetes Adidas"
  maxPayments?: number; // = duracao_meses (encerra sozinho)
  externalReference?: string; // cota.id
  fine?: { value: number }; // multa % atraso
  interest?: { value: number }; // juros % a.m.
  creditCardToken?: string; // débito automático: token do cartão tokenizado
}): Promise<AsaasSubscription> {
  return asaas<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: {
      billingType: "UNDEFINED",
      cycle: "MONTHLY",
      ...params,
    },
  });
}

/** Lista as cobranças (parcelas) geradas por uma assinatura. */
export async function listSubscriptionPayments(subscriptionId: string) {
  return asaas(`/subscriptions/${subscriptionId}/payments`);
}

/** Cobrança avulsa (ex.: lance, taxa de adesão). */
export async function createPayment(params: {
  customer: string;
  value: number;
  dueDate: string;
  billingType?: AsaasBilling;
  description?: string;
  externalReference?: string;
}) {
  return asaas("/payments", {
    method: "POST",
    body: { billingType: "UNDEFINED", ...params },
  });
}

/** Busca uma cobrança específica (usado no reconcile via webhook). */
export async function getPayment(paymentId: string) {
  return asaas(`/payments/${paymentId}`);
}

/**
 * Negativação no Serasa (dunning) via Asaas.
 * O Asaas cuida da NOTIFICAÇÃO PRÉVIA obrigatória (Súmula 359 STJ) antes de
 * incluir o devedor. Requer que o cliente tenha endereço/documentos completos.
 * type: 'SERASA' (negativação).
 */
export async function negativarSerasa(params: {
  payment: string; // asaas_payment_id
  type?: "SERASA";
  description?: string;
  customerName?: string;
  customerCpfCnpj?: string;
}) {
  return asaas("/paymentDunnings", {
    method: "POST",
    body: { type: "SERASA", ...params },
  });
}

/** Cancela uma negativação (quando o cliente paga/faz acordo). */
export async function cancelarNegativacao(dunningId: string) {
  return asaas(`/paymentDunnings/${dunningId}/cancel`, { method: "POST" });
}

/** Consulta o status de uma negativação. */
export async function getNegativacao(dunningId: string) {
  return asaas(`/paymentDunnings/${dunningId}`);
}

export { ASAAS_ENV };
