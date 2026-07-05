"use client";

import { useState } from "react";
import { aprovarCota, recusarCota } from "./actions";

export function AcoesAprovacao({
  cotaId,
  podeAprovar,
}: {
  cotaId: string;
  podeAprovar: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(fn: () => Promise<void>, pergunta: string) {
    if (!confirm(pergunta)) return;
    setLoading(true);
    setMsg(null);
    try {
      await fn();
    } catch (e: any) {
      setMsg(e?.message ?? "Falha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="row" style={{ gap: 6 }}>
        <button
          className="btn small"
          disabled={loading || !podeAprovar}
          title={podeAprovar ? "" : "Aguardando o membro aceitar o contrato"}
          onClick={() =>
            run(
              () => aprovarCota(cotaId),
              "Aprovar este cadastro? A cobrança no cartão será iniciada.",
            )
          }
        >
          Aprovar
        </button>
        <button
          className="btn btn-ghost small"
          disabled={loading}
          onClick={() =>
            run(() => recusarCota(cotaId), "Recusar este cadastro?")
          }
        >
          Recusar
        </button>
      </div>
      {msg && (
        <span className="badge badge-danger" style={{ padding: "4px 8px" }}>
          {msg}
        </span>
      )}
    </div>
  );
}
