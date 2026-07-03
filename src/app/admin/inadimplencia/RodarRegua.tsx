"use client";

import { useState } from "react";
import { rodarReguaManual } from "./actions";

export function RodarRegua() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function rodar() {
    setLoading(true);
    setMsg(null);
    try {
      const r = await rodarReguaManual();
      setMsg(
        `${r.atualizadas} atualizadas · ${r.lembretes} lembretes · ${r.negativadas} negativadas`,
      );
    } catch (e: any) {
      setMsg(e?.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row">
      {msg && <span className="muted small">{msg}</span>}
      <button className="btn btn-ghost" onClick={rodar} disabled={loading}>
        {loading ? "Processando..." : "Rodar régua agora"}
      </button>
    </div>
  );
}
