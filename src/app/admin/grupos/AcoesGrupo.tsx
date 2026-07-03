"use client";

import { useState } from "react";
import { excluirGrupo, mudarStatusGrupo } from "./actions";

export function AcoesGrupo({
  id,
  usadas,
  status,
}: {
  id: string;
  usadas: number;
  status: string;
}) {
  const [loading, setLoading] = useState(false);

  async function run(fn: () => Promise<void>, pergunta: string) {
    if (!confirm(pergunta)) return;
    setLoading(true);
    try {
      await fn();
    } catch (e: any) {
      alert(e?.message ?? "Falha na operação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row" style={{ gap: 6 }}>
      {usadas === 0 ? (
        <button
          className="btn btn-ghost small"
          disabled={loading}
          onClick={() =>
            run(
              () => excluirGrupo(id),
              "Excluir este grupo vazio? Esta ação não pode ser desfeita.",
            )
          }
        >
          Excluir
        </button>
      ) : status !== "cancelado" && status !== "encerrado" ? (
        <button
          className="btn btn-ghost small"
          disabled={loading}
          onClick={() =>
            run(
              () => mudarStatusGrupo(id, "cancelado"),
              "Cancelar este grupo? Ele deixa de aceitar novas adesões.",
            )
          }
        >
          Cancelar
        </button>
      ) : (
        <span className="muted small">—</span>
      )}
    </div>
  );
}
