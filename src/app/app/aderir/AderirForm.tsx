"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AderirForm({
  grupo,
}: {
  grupo: { id: string; nome: string; duracao?: number };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aceite, setAceite] = useState(false);
  const [pagamentoTipo, setPagamentoTipo] = useState<"recorrente" | "parcelado">(
    "recorrente",
  );

  const [holderName, setHolderName] = useState("");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
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
      const res = await fetch("/api/adesao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grupo_id: grupo.id,
          cpf,
          telefone,
          aceite_contrato: aceite,
          pagamento_tipo: pagamentoTipo,
          cartao: {
            holderName,
            number,
            expiryMonth: mm,
            expiryYear: aa?.length === 2 ? `20${aa}` : aa,
            ccv,
          },
          endereco: { cep, numero: numeroEnd },
        }),
      });
      const data = await res.json().catch(() => ({
        error: `Erro ${res.status} no servidor. Tente novamente.`,
      }));
      if (!res.ok) {
        setMsg({ tipo: "danger", texto: data.error ?? "Erro na adesão" });
      } else {
        setMsg({
          tipo: "ok",
          texto: `Cadastro recebido (cota nº ${data.cota})! Aceite o contrato na próxima etapa — depois passa por aprovação e a cobrança começa.`,
        });
        setTimeout(() => router.push(`/app/contrato/${data.cota_id}`), 1600);
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

      <div>
        <label className="label">Forma de pagamento (cartão de crédito)</label>
        <div className="row" style={{ gap: 8 }}>
          <button
            type="button"
            onClick={() => setPagamentoTipo("recorrente")}
            className={`btn ${pagamentoTipo === "recorrente" ? "" : "btn-ghost"} small`}
            style={{ flex: 1 }}
          >
            Recorrente (mensal)
          </button>
          <button
            type="button"
            onClick={() => setPagamentoTipo("parcelado")}
            className={`btn ${pagamentoTipo === "parcelado" ? "" : "btn-ghost"} small`}
            style={{ flex: 1 }}
          >
            Parcelado no cartão
          </button>
        </div>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        <div>
          <label className="label">Nome impresso no cartão</label>
          <input
            className="input"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Número do cartão de crédito</label>
          <input
            className="input"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            required
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
              required
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
              required
            />
          </div>
          <div>
            <label className="label">CEP</label>
            <input
              className="input"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              placeholder="00000-000"
              required
            />
          </div>
          <div>
            <label className="label">Nº do endereço</label>
            <input
              className="input"
              value={numeroEnd}
              onChange={(e) => setNumeroEnd(e.target.value)}
              required
            />
          </div>
        </div>
        <span className="muted small">
          🔒 Use um <strong>cartão de crédito</strong> (não pré-pago/temporário).
          Os dados vão direto e criptografados para o Asaas (PCI-DSS); guardamos
          apenas os 4 últimos dígitos.
        </span>
      </div>

      <label className="row small" style={{ alignItems: "flex-start", gap: 8 }}>
        <input
          type="checkbox"
          checked={aceite}
          onChange={(e) => setAceite(e.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span className="muted">
          Autorizo a análise de crédito e a cobrança no cartão após a aprovação.
          Na próxima etapa vou <strong>ler e aceitar o contrato online</strong>.
        </span>
      </label>

      {msg && (
        <div className={`badge badge-${msg.tipo}`} style={{ padding: "8px 12px" }}>
          {msg.texto}
        </div>
      )}

      <div className="row">
        <button className="btn" disabled={loading || !aceite}>
          {loading ? "Enviando..." : "Enviar cadastro"}
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
