"use client";

import { useState } from "react";
import { confirmarCancelamento, negarCancelamento } from "./actions";

export function AcoesCancelamento({ cotaId }: { cotaId: string }) {
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
    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
      <button
        className="btn btn-danger small"
        disabled={loading}
        onClick={() =>
          run(
            () => confirmarCancelamento(cotaId),
            "Confirmar o cancelamento? A assinatura no cartão será pausada e a cota encerrada.",
          )
        }
      >
        Confirmar cancel.
      </button>
      <button
        className="btn btn-ghost small"
        disabled={loading}
        onClick={() =>
          run(
            () => negarCancelamento(cotaId),
            "Negar o pedido? A cota segue ativa e a cobrança continua.",
          )
        }
      >
        Negar
      </button>
      {msg && (
        <span className="badge badge-danger" style={{ padding: "4px 8px" }}>
          {msg}
        </span>
      )}
    </div>
  );
}
