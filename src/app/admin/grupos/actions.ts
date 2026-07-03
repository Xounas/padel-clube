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
    bem_modelo: String(formData.get("bem_modelo") || "") || null,
    bem_imagem_url: String(formData.get("bem_imagem_url") || "") || null,
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

/** Edita os dados da raquete/valores de um grupo (inclui imagem). */
export async function editarGrupo(id: string, formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const num = (k: string, def: number) => Number(formData.get(k) ?? def);
  const { error } = await db
    .from("grupos")
    .update({
      nome: String(formData.get("nome") || ""),
      bem_modelo: String(formData.get("bem_modelo") || "") || null,
      bem_descricao: String(formData.get("bem_descricao") || "") || null,
      bem_imagem_url: String(formData.get("bem_imagem_url") || "") || null,
      bem_valor: num("bem_valor", 2500),
      bem_custo: num("bem_custo", 1399),
    })
    .eq("id", id);
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
 * Exclui um grupo — bloqueado se houver ATIVIDADE REAL (parcela paga ou
 * contemplação), para nunca apagar dados financeiros por engano. Grupos só com
 * cotas não pagas (ex.: duplicata de teste) podem ser excluídos; o cascade
 * remove as cotas/cobranças pendentes. Para grupo com atividade, use 'Cancelar'.
 */
export async function excluirGrupo(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { count: pagas } = await db
    .from("cobrancas")
    .select("id", { count: "exact", head: true })
    .eq("grupo_id", id)
    .eq("status", "pago");
  const { count: contempladas } = await db
    .from("contemplacoes")
    .select("id", { count: "exact", head: true })
    .eq("grupo_id", id);
  if ((pagas ?? 0) > 0 || (contempladas ?? 0) > 0) {
    throw new Error(
      "Grupo com pagamento/contemplação — use 'Cancelar' em vez de excluir.",
    );
  }
  const { error } = await db.from("grupos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/grupos");
}
