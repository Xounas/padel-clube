"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { criarGrupo } from "./actions";
import { PLANOS, planoPorId } from "@/lib/planos";
import { ImageUpload } from "@/components/ImageUpload";
import { brl } from "@/lib/format";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending}>
      {pending ? "Criando..." : "Criar grupo"}
    </button>
  );
}

export function NovoGrupo() {
  const [open, setOpen] = useState(false);
  const [duracaoId, setDuracaoId] = useState(PLANOS[0].id);
  const [imagemUrl, setImagemUrl] = useState("");

  // valor guiado pela RAQUETE — mensalidade deriva do valor de mercado ÷ duração
  const [bemValor, setBemValor] = useState(PLANOS[0].bem_valor);
  const [custo, setCusto] = useState(PLANOS[0].bem_custo);
  const [duracao, setDuracao] = useState(PLANOS[0].duracao_meses);
  const [contemplados, setContemplados] = useState(PLANOS[0].contemplados_por_mes);
  const [mensalidade, setMensalidade] = useState(
    Math.ceil(PLANOS[0].bem_valor / PLANOS[0].duracao_meses),
  );
  const [trava, setTrava] = useState(PLANOS[0].contemplavel_apos_parcelas);
  const [taxaAdm, setTaxaAdm] = useState(PLANOS[0].taxa_adm_percent);

  const totalCotas = Math.max(1, duracao * contemplados);
  const lucroCota = mensalidade * duracao - custo;

  function aplicarDuracao(id: string) {
    const p = planoPorId(id);
    setDuracaoId(id);
    setDuracao(p.duracao_meses);
    setContemplados(p.contemplados_por_mes);
    setTrava(p.contemplavel_apos_parcelas);
    setMensalidade(Math.ceil(bemValor / p.duracao_meses));
  }
  function mudarValor(v: number) {
    setBemValor(v);
    setMensalidade(Math.ceil(v / duracao));
  }
  function mudarDuracao(d: number) {
    const dd = Math.max(1, d);
    setDuracao(dd);
    setMensalidade(Math.ceil(bemValor / dd));
  }

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
        background: "rgba(10,37,64,.5)",
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
        style={{ width: 560, maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0 }}>Novo grupo</h3>
        <p className="muted small" style={{ margin: 0 }}>
          O valor do grupo é definido pela raquete: informe o preço de mercado e a
          mensalidade é calculada pela duração escolhida.
        </p>

        {/* presets de DURAÇÃO */}
        <div className="row" style={{ gap: 8 }}>
          {PLANOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => aplicarDuracao(p.id)}
              className={`btn ${duracaoId === p.id ? "" : "btn-ghost"} small`}
              style={{ flex: 1, flexDirection: "column", alignItems: "center", padding: 10 }}
            >
              <strong>{p.duracao_meses}x</strong>
              <span className="small" style={{ fontWeight: 400, opacity: 0.85 }}>
                {p.duracao_meses} meses
              </span>
            </button>
          ))}
        </div>

        <form
          action={async (fd) => {
            await criarGrupo(fd);
            setImagemUrl("");
            setOpen(false);
          }}
          className="stack"
        >
          <input type="hidden" name="bem_imagem_url" value={imagemUrl} />
          <input type="hidden" name="total_cotas" value={totalCotas} />

          <div>
            <label className="label">Nome do grupo</label>
            <input
              name="nome"
              className="input"
              defaultValue={`Grupo ${duracao}x — Turma 1`}
              required
            />
          </div>
          <div className="grid grid-2">
            <div>
              <label className="label">Modelo da raquete</label>
              <input name="bem_modelo" className="input" placeholder="Ex.: Adidas Metalbone 3.4" />
            </div>
            <div>
              <label className="label">Descrição</label>
              <input name="bem_descricao" className="input" placeholder="Ex.: carbono, formato lágrima" />
            </div>
          </div>
          <div>
            <label className="label">Foto da raquete</label>
            <ImageUpload value={imagemUrl} onChange={setImagemUrl} />
          </div>

          <div className="grid grid-2">
            <div>
              <label className="label">Valor de mercado da raquete (R$)</label>
              <input
                name="bem_valor"
                className="input"
                type="number"
                step="0.01"
                value={bemValor}
                onChange={(e) => mudarValor(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Custo da raquete (R$)</label>
              <input
                name="bem_custo"
                className="input"
                type="number"
                step="0.01"
                value={custo}
                onChange={(e) => setCusto(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Duração (meses)</label>
              <input
                name="duracao_meses"
                className="input"
                type="number"
                value={duracao}
                onChange={(e) => mudarDuracao(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Mensalidade (R$) — calculada</label>
              <input
                name="valor_mensal"
                className="input"
                type="number"
                step="0.01"
                value={mensalidade}
                onChange={(e) => setMensalidade(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Contemplados/mês</label>
              <input
                name="contemplados_por_mes"
                className="input"
                type="number"
                value={contemplados}
                onChange={(e) => setContemplados(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Total de cotas (auto)</label>
              <input className="input" value={totalCotas} disabled />
            </div>
            <div>
              <label className="label">Trava (parcelas p/ contemplar)</label>
              <input
                name="contemplavel_apos_parcelas"
                className="input"
                type="number"
                value={trava}
                onChange={(e) => setTrava(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Taxa adm (%)</label>
              <input
                name="taxa_adm_percent"
                className="input"
                type="number"
                step="0.01"
                value={taxaAdm}
                onChange={(e) => setTaxaAdm(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Data de início (1º venc.)</label>
              <input name="data_inicio" className="input" type="date" />
            </div>
          </div>

          {/* resumo ao vivo */}
          <div
            className="card"
            style={{ background: "var(--bg-soft)", boxShadow: "none", padding: 12 }}
          >
            <div className="small">
              <strong>{totalCotas} cotas</strong> · todos recebem em{" "}
              <strong>{duracao} meses</strong> · cliente paga{" "}
              <strong>{brl(mensalidade)}/mês</strong> ({brl(mensalidade * duracao)}{" "}
              no total por uma raquete de {brl(bemValor)})
            </div>
            <div className="small" style={{ color: "var(--accent)", marginTop: 4 }}>
              Lucro estimado: <strong>{brl(lucroCota)}/cota</strong> ·{" "}
              {brl(lucroCota * totalCotas)}/grupo
            </div>
          </div>

          <div className="row">
            <SubmitButton />
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
