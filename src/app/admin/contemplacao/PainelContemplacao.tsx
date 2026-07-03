"use client";

import { useState } from "react";
import { rodarContemplacao } from "./actions";

export function PainelContemplacao({
  grupos,
}: {
  grupos: { id: string; nome: string; contemplados_por_mes: number }[];
}) {
  const hoje = new Date();
  const compPadrao = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;

  const [grupoId, setGrupoId] = useState(grupos[0]?.id ?? "");
  const [competencia, setCompetencia] = useState(compPadrao);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tipo: string; texto: string } | null>(null);

  async function rodar() {
    if (!grupoId) return;
    setLoading(true);
    setMsg(null);
    try {
      const r = await rodarContemplacao(grupoId, competencia);
      setMsg({
        tipo: r.contemplados > 0 ? "ok" : "warn",
        texto:
          r.contemplados > 0
            ? `${r.contemplados} membro(s) contemplado(s)! 🎾`
            : "Nenhum elegível (verifique adimplência e trava de parcelas mínimas).",
      });
    } catch (e: any) {
      setMsg({ tipo: "danger", texto: e?.message ?? "Erro" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card stack">
      <h3 style={{ margin: 0 }}>Rodar contemplação do mês</h3>
      <div className="grid grid-3">
        <div>
          <label className="label">Grupo</label>
          <select
            className="select"
            value={grupoId}
            onChange={(e) => setGrupoId(e.target.value)}
          >
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome} ({g.contemplados_por_mes}/mês)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Competência</label>
          <input
            type="date"
            className="input"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="btn" onClick={rodar} disabled={loading || !grupoId}>
            {loading ? "Sorteando fila..." : "Contemplar agora"}
          </button>
        </div>
      </div>
      {msg && (
        <div className={`badge badge-${msg.tipo}`} style={{ padding: "8px 12px" }}>
          {msg.texto}
        </div>
      )}
    </div>
  );
}
