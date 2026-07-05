"use server";

import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Atualiza os dados de cadastro do próprio associado. */
export async function atualizarPerfil(formData: FormData) {
  const profile = await requireProfile();
  const db = createAdminClient();

  const { error } = await db
    .from("profiles")
    .update({
      nome: String(formData.get("nome") || "").slice(0, 120),
      cpf: String(formData.get("cpf") || "") || null,
      telefone: String(formData.get("telefone") || "") || null,
    })
    .eq("id", profile.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/perfil");
}
