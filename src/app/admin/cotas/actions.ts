"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { cancelSubscription } from "@/lib/asaas/client";
import { revalidatePath } from "next/cache";

/**
 * Admin CONFIRMA o cancelamento (só aqui a cobrança é pausada de fato):
 * cancela a assinatura recorrente no Asaas e marca a cota como cancelada.
 */
export async function confirmarCancelamento(cotaId: string) {
  await requireAdmin();
  const db = createAdminClient();

  const { data: cota } = await db
    .from("cotas")
    .select("asaas_subscription_id, pagamento_tipo")
    .eq("id", cotaId)
    .single();
  if (!cota) throw new Error("Cota não encontrada.");

  if (cota.asaas_subscription_id) {
    try {
      await cancelSubscription(cota.asaas_subscription_id);
    } catch (e: any) {
      // não trava o cancelamento no app; registra p/ tratar no Asaas
      console.error("Falha ao cancelar assinatura Asaas:", e?.message ?? e);
    }
  }

  const { error } = await db
    .from("cotas")
    .update({ status: "cancelada" })
    .eq("id", cotaId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cotas");
  revalidatePath("/admin/dashboard");
}

/** Admin NEGA o pedido (a cota segue ativa e a cobrança continua). */
export async function negarCancelamento(cotaId: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("cotas")
    .update({ cancelamento_solicitado_em: null, cancelamento_motivo: null })
    .eq("id", cotaId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cotas");
}
