import { requireProfile } from "@/lib/auth";
import { PerfilForm } from "./PerfilForm";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const profile = await requireProfile();

  return (
    <div className="stack" style={{ maxWidth: 560 }}>
      <div>
        <h1 style={{ margin: "0 0 2px" }}>Meu cadastro</h1>
        <p className="muted small" style={{ margin: 0 }}>
          Mantenha seus dados atualizados — eles são usados no contrato e na cobrança.
        </p>
      </div>
      <div className="card">
        <PerfilForm
          nome={profile.nome || ""}
          cpf={profile.cpf || ""}
          telefone={profile.telefone || ""}
          email={profile.email || ""}
        />
      </div>
    </div>
  );
}
