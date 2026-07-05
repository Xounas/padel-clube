"use server";

import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * O associado SOLICITA o cancelamento no portal. Nada é cancelado automaticamente
 * — apenas registra o pedido. O admin confirma manualmente depois.
 */
export async function solicitarCancelamento(cotaId: string, motivo: string) {
  const profile = await requireProfile();
  const db = createAdminClient();

  const { data: cota } = await db
    .from("cotas")
    .select("participante_id, status")
    .eq("id", cotaId)
    .single();
  if (!cota || cota.participante_id !== profile.id)
    throw new Error("Cota não encontrada.");
  if (cota.status === "cancelada")
    throw new Error("Esta cota já está cancelada.");

  const { error } = await db
    .from("cotas")
    .update({
      cancelamento_solicitado_em: new Date().toISOString(),
      cancelamento_motivo: (motivo || "").slice(0, 500) || null,
    })
    .eq("id", cotaId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/minhas-cotas");
}
