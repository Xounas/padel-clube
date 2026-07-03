"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Roda a contemplação do mês para um grupo (usa a função SQL contemplar_grupo). */
export async function rodarContemplacao(grupoId: string, competencia: string) {
  await requireAdmin();
  const db = createAdminClient();
  const comp = competencia || new Date().toISOString().slice(0, 8) + "01";

  const { data, error } = await db.rpc("contemplar_grupo", {
    p_grupo_id: grupoId,
    p_competencia: comp,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/contemplacao");
  return { contemplados: (data ?? []).length };
}

/** Marca a raquete como entregue. */
export async function marcarEntregue(contemplacaoId: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("contemplacoes")
    .update({ entregue: true, entregue_em: new Date().toISOString().slice(0, 10) })
    .eq("id", contemplacaoId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/contemplacao");
}
