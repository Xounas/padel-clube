"use server";

import { headers } from "next/headers";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Aceite ONLINE do contrato pelo portal. Registra data + IP no servidor
 * (não confia no cliente) e carimba o snapshot — validade jurídica.
 */
export async function aceitarContrato(cotaId: string) {
  const profile = await requireProfile();
  const db = createAdminClient();

  const { data: cota } = await db
    .from("cotas")
    .select("id, participante_id, aceite_em, contrato_snapshot")
    .eq("id", cotaId)
    .single();

  if (!cota) throw new Error("Cota não encontrada.");
  if (cota.participante_id !== profile.id)
    throw new Error("Você só pode aceitar o seu próprio contrato.");
  if (cota.aceite_em) return { ok: true, jaAceito: true };
  if (!cota.contrato_snapshot) throw new Error("Contrato indisponível.");

  const h = headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "127.0.0.1";
  const agora = new Date().toISOString();

  const snapshot = {
    ...(cota.contrato_snapshot as any),
    aceite_em: agora,
    aceite_ip: ip,
  };

  const { error } = await db
    .from("cotas")
    .update({ aceite_em: agora, aceite_ip: ip, contrato_snapshot: snapshot })
    .eq("id", cotaId);
  if (error) throw new Error(error.message);

  revalidatePath(`/app/contrato/${cotaId}`);
  revalidatePath("/app/minhas-cotas");
  return { ok: true };
}
