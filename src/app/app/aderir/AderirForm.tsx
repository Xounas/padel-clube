"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AderirForm({ grupo }: { grupo: { id: string; nome: string } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aceite, setAceite] = useState(false);
  const [usarCartao, setUsarCartao] = useState(true);

  // cartão + endereço (exigidos pela tokenização do Asaas)
  const [holderName, setHolderName] = useState("");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState(""); // MM/AA
  const [ccv, setCcv] = useState("");
  const [cep, setCep] = useState("");
  const [numeroEnd, setNumeroEnd] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tipo: string; texto: string } | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const [mm, aa] = exp.split("/").map((s) => s.trim());
      const payload: any = {
        grupo_id: grupo.id,
        cpf,
        telefone,
        aceite_contrato: aceite,
      };
      if (usarCartao) {
        payload.cartao = {
          holderName,
          number,
          expiryMonth: mm,
          expiryYear: aa?.length === 2 ? `20${aa}` : aa,
          ccv,
        };
        payload.endereco = { cep, numero: numeroEnd };
      }

      const res = await fetch("/api/adesao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({
        error: `Erro ${res.status} no servidor. Tente novamente.`,
      }));
      if (!res.ok) {
        setMsg({ tipo: "danger", texto: data.error ?? "Erro na adesão" });
      } else if (data.aprovado === false) {
        setMsg({
          tipo: "warn",
          texto: `Análise de crédito não aprovada: ${data.motivo}`,
        });
      } else {
        // adesão criada — próximo passo obrigatório: ACEITE ONLINE do contrato
        const extra = data.debito_automatico
          ? ` · débito automático ${data.cartao?.bandeira ?? ""} final ${data.cartao?.ultimos4 ?? ""}`
          : "";
        setMsg({
          tipo: "ok",
          texto: `Adesão criada (cota nº ${data.cota}${extra}). Leia e aceite o contrato para concluir...`,
        });
        setTimeout(() => router.push(`/app/contrato/${data.cota_id}`), 1500);
      }
    } catch (err: any) {
      setMsg({ tipo: "danger", texto: err?.message ?? "Erro" });
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        Aderir a este grupo
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="stack" style={{ marginTop: 4 }}>
      <div className="grid grid-2">
        <div>
          <label className="label">CPF</label>
          <input
            className="input"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="000.000.000-00"
            required
          />
        </div>
        <div>
          <label className="label">Celular (WhatsApp)</label>
          <input
            className="input"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <label className="row small" style={{ gap: 8 }}>
        <input
          type="checkbox"
          checked={usarCartao}
          onChange={(e) => setUsarCartao(e.target.checked)}
        />
        <span>
          Pagar no <strong>cartão em débito automático</strong> (recomendado —
          cobra sozinho todo mês)
        </span>
      </label>

      {usarCartao && (
        <div className="stack" style={{ gap: 10 }}>
          <div>
            <label className="label">Nome impresso no cartão</label>
            <input
              className="input"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              required={usarCartao}
            />
          </div>
          <div>
            <label className="label">Número do cartão</label>
            <input
              className="input"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              required={usarCartao}
            />
          </div>
          <div className="grid grid-2">
            <div>
              <label className="label">Validade (MM/AA)</label>
              <input
                className="input"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                placeholder="12/29"
                required={usarCartao}
              />
            </div>
            <div>
              <label className="label">CVV</label>
              <input
                className="input"
                value={ccv}
                onChange={(e) => setCcv(e.target.value)}
                placeholder="123"
                inputMode="numeric"
                required={usarCartao}
              />
            </div>
            <div>
              <label className="label">CEP</label>
              <input
                className="input"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                required={usarCartao}
              />
            </div>
            <div>
              <label className="label">Nº do endereço</label>
              <input
                className="input"
                value={numeroEnd}
                onChange={(e) => setNumeroEnd(e.target.value)}
                required={usarCartao}
              />
            </div>
          </div>
          <span className="muted small">
            🔒 Os dados do cartão vão direto e criptografados para o Asaas
            (PCI-DSS). Nós guardamos apenas os 4 últimos dígitos.
          </span>
        </div>
      )}

      <label className="row small" style={{ alignItems: "flex-start", gap: 8 }}>
        <input
          type="checkbox"
          checked={aceite}
          onChange={(e) => setAceite(e.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span className="muted">
          Autorizo a análise de crédito e a cobrança recorrente. Na próxima etapa
          vou <strong>ler e aceitar o contrato + nota promissória online</strong>.
        </span>
      </label>

      {msg && (
        <div className={`badge badge-${msg.tipo}`} style={{ padding: "8px 12px" }}>
          {msg.texto}
        </div>
      )}

      <div className="row">
        <button className="btn" disabled={loading || !aceite}>
          {loading ? "Processando..." : "Confirmar adesão"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
