"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Processa a entrega de uma contemplação: status (aguardando→comprado→enviado→
 * entregue), custo real, fornecedor, rastreio e a raquete específica do contemplado
 * (modelo/imagem na cota). "entregue" marca o booleano e lança o custo no financeiro.
 */
export async function processarEntrega(
  contemplacaoId: string,
  cotaId: string,
  formData: FormData,
) {
  await requireAdmin();
  const db = createAdminClient();

  const status = String(formData.get("status_entrega") || "aguardando");
  const custoRaw = formData.get("custo_real");
  const entregue = status === "entregue";

  const { error: e1 } = await db
    .from("contemplacoes")
    .update({
      status_entrega: status,
      custo_real: custoRaw ? Number(custoRaw) : null,
      fornecedor: String(formData.get("fornecedor") || "") || null,
      rastreio: String(formData.get("rastreio") || "") || null,
      entregue,
      entregue_em: entregue ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", contemplacaoId);
  if (e1) throw new Error(e1.message);

  // raquete específica do contemplado (opcional) — fica registrada na cota
  const modelo = String(formData.get("raquete_modelo") || "");
  const imagem = String(formData.get("raquete_imagem_url") || "");
  if (modelo || imagem) {
    await db
      .from("cotas")
      .update({
        raquete_modelo: modelo || null,
        raquete_imagem_url: imagem || null,
      })
      .eq("id", cotaId);
  }

  revalidatePath("/admin/entregas");
  revalidatePath("/admin/dashboard");
}
