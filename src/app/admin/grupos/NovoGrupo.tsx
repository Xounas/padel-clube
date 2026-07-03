"use client";

import { useState } from "react";
import { criarGrupo } from "./actions";
import { PLANOS, planoPorId, lucroPorCota } from "@/lib/planos";

export function NovoGrupo() {
  const [open, setOpen] = useState(false);
  const [planoId, setPlanoId] = useState(PLANOS[0].id);
  const plano = planoPorId(planoId);

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        + Novo grupo
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 20,
      }}
      onClick={() => setOpen(false)}
    >
      <div
        className="card stack"
        style={{ width: 540, maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0 }}>Novo grupo</h3>

        {/* seletor de plano */}
        <div className="row" style={{ gap: 8 }}>
          {PLANOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlanoId(p.id)}
              className={`btn ${planoId === p.id ? "" : "btn-ghost"} small`}
              style={{ flex: 1, flexDirection: "column", alignItems: "flex-start", padding: 10 }}
            >
              <strong>{p.nome}</strong>
              <span className="small" style={{ fontWeight: 400, opacity: 0.85 }}>
                R${p.valor_mensal}/mês · {p.total_cotas} cotas · lucro R$
                {lucroPorCota(p).toLocaleString("pt-BR")}/cota
              </span>
            </button>
          ))}
        </div>

        {/* key força o remount ao trocar de plano, aplicando os defaults */}
        <form action={criarGrupo} className="stack" key={planoId}>
          <input type="hidden" name="plano_id" value={planoId} />
          <div>
            <label className="label">Nome do grupo</label>
            <input
              name="nome"
              className="input"
              defaultValue={`${plano.nome} — Turma 1`}
              required
            />
          </div>
          <div>
            <label className="label">Raquete (descrição)</label>
            <input
              name="bem_descricao"
              className="input"
              placeholder="Ex.: Adidas Metalbone 3.4"
            />
          </div>
          <div className="grid grid-2">
            <div>
              <label className="label">Valor mercado (R$)</label>
              <input name="bem_valor" className="input" type="number" step="0.01" defaultValue={plano.bem_valor} />
            </div>
            <div>
              <label className="label">Custo (R$)</label>
              <input name="bem_custo" className="input" type="number" step="0.01" defaultValue={plano.bem_custo} />
            </div>
            <div>
              <label className="label">Mensalidade (R$)</label>
              <input name="valor_mensal" className="input" type="number" step="0.01" defaultValue={plano.valor_mensal} />
            </div>
            <div>
              <label className="label">Duração (meses)</label>
              <input name="duracao_meses" className="input" type="number" defaultValue={plano.duracao_meses} />
            </div>
            <div>
              <label className="label">Total de cotas</label>
              <input name="total_cotas" className="input" type="number" defaultValue={plano.total_cotas} />
            </div>
            <div>
              <label className="label">Contemplados/mês</label>
              <input name="contemplados_por_mes" className="input" type="number" defaultValue={plano.contemplados_por_mes} />
            </div>
            <div>
              <label className="label">Trava (parcelas p/ contemplar)</label>
              <input name="contemplavel_apos_parcelas" className="input" type="number" defaultValue={plano.contemplavel_apos_parcelas} />
            </div>
            <div>
              <label className="label">Taxa adm (%)</label>
              <input name="taxa_adm_percent" className="input" type="number" step="0.01" defaultValue={plano.taxa_adm_percent} />
            </div>
            <div>
              <label className="label">Data de início (1º venc.)</label>
              <input name="data_inicio" className="input" type="date" />
            </div>
          </div>
          <div className="row">
            <button className="btn" type="submit">
              Criar grupo
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
