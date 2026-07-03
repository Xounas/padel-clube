"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { aceitarContrato } from "./actions";

export function AceiteBox({ cotaId, nome }: { cotaId: string; nome: string }) {
  const router = useRouter();
  const [marcado, setMarcado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aceitar() {
    setLoading(true);
    setErro(null);
    try {
      await aceitarContrato(cotaId);
      router.refresh();
    } catch (e: any) {
      setErro(e?.message ?? "Falha ao registrar aceite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card stack" style={{ borderColor: "var(--primary)" }}>
      <label className="row" style={{ alignItems: "flex-start", gap: 10 }}>
        <input
          type="checkbox"
          checked={marcado}
          onChange={(e) => setMarcado(e.target.checked)}
          style={{ marginTop: 4 }}
        />
        <span className="small">
          Declaro que li e compreendi integralmente o contrato de adesão e a nota
          promissória acima, e <strong>ACEITO</strong> seus termos, como {nome}.
          Estou ciente de que este aceite será registrado com data e IP.
        </span>
      </label>
      {erro && (
        <div className="badge badge-danger" style={{ padding: "8px 12px" }}>
          {erro}
        </div>
      )}
      <button className="btn" disabled={!marcado || loading} onClick={aceitar}>
        {loading ? "Registrando aceite..." : "Li e aceito o contrato"}
      </button>
    </div>
  );
}
