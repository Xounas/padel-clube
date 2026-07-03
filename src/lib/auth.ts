import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface Profile {
  id: string;
  role: "admin" | "participante";
  nome: string;
  email: string | null;
  cpf: string | null;
  telefone: string | null;
  asaas_customer_id: string | null;
  analise_credito_status: string;
}

/** Retorna o profile do usuário logado, ou redireciona para /login. */
export async function requireProfile(): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, role, nome, email, cpf, telefone, asaas_customer_id, analise_credito_status",
    )
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  return profile as Profile;
}

/** Exige admin, senão manda para a área do participante. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/app/minhas-cotas");
  return profile;
}
