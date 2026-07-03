"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function criarGrupo(formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();

  const num = (k: string, def: number) => Number(formData.get(k) ?? def);

  const { error } = await db.from("grupos").insert({
    nome: String(formData.get("nome") || "Novo grupo"),
    bem_descricao: String(formData.get("bem_descricao") || ""),
    bem_valor: num("bem_valor", 2500),
    bem_custo: num("bem_custo", 1399),
    valor_mensal: num("valor_mensal", 110),
    total_cotas: num("total_cotas", 24),
    duracao_meses: num("duracao_meses", 24),
    contemplados_por_mes: num("contemplados_por_mes", 1),
    contemplavel_apos_parcelas: num("contemplavel_apos_parcelas", 3),
    taxa_adm_percent: num("taxa_adm_percent", 15),
    status: "formando",
    data_inicio: (formData.get("data_inicio") as string) || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/grupos");
}

export async function mudarStatusGrupo(id: string, status: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("grupos").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/grupos");
}

/**
 * Exclui um grupo — só se estiver VAZIO (sem cotas), para não apagar dados de
 * participantes por engano. Grupo com cotas deve ser cancelado, não excluído.
 */
export async function excluirGrupo(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { count } = await db
    .from("cotas")
    .select("id", { count: "exact", head: true })
    .eq("grupo_id", id);
  if ((count ?? 0) > 0) {
    throw new Error(
      "Este grupo tem cotas de participantes — use 'Cancelar' em vez de excluir.",
    );
  }
  const { error } = await db.from("grupos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/grupos");
}
