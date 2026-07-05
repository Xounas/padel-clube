import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { brl, dataBR, competenciaBR, statusBadge } from "@/lib/format";
import { SolicitarCancelamento } from "./SolicitarCancelamento";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MinhasCotasPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: cotas } = await supabase
    .from("cotas")
    .select(
      "id, numero, grupo_id, status, pontuacao, data_adesao, aceite_em, cancelamento_solicitado_em, cartao_ultimos4, cartao_bandeira, grupos(nome, bem_descricao, valor_mensal, duracao_meses, total_cotas, contemplados_por_mes, bem_valor, multa_cancelamento_percent)",
    )
    .eq("participante_id", profile.id)
    .order("data_adesao", { ascending: false });

  return (
    <div className="stack">
      <div className="spread">
        <div>
          <h1 style={{ margin: "0 0 4px" }}>Minhas cotas</h1>
          <p className="muted" style={{ margin: 0 }}>
            Acompanhe suas parcelas e sua posição na fila de contemplação.
          </p>
        </div>
        <Link href="/app/aderir" className="btn">
          + Entrar em outro grupo
        </Link>
      </div>

      {(cotas ?? []).length === 0 && (
        <div className="card muted">
          Você ainda não tem cotas.{" "}
          <Link href="/app/aderir" style={{ color: "var(--primary)" }}>
            Entre num grupo
          </Link>{" "}
          para começar.
        </div>
      )}

      {(cotas ?? []).map((c: any) => (
        <CotaCard key={c.id} cota={c} />
      ))}
    </div>
  );
}

async function CotaCard({ cota }: { cota: any }) {
  const supabase = createClient();

  const { data: parcelas } = await supabase
    .from("cobrancas")
    .select("id, competencia, valor, vencimento, status, asaas_invoice_url")
    .eq("cota_id", cota.id)
    .order("vencimento", { ascending: true });

  // posição na fila (quantas cotas do MESMO grupo têm pontuação maior)
  const { count: aFrente } = await supabase
    .from("cotas")
    .select("id", { count: "exact", head: true })
    .eq("grupo_id", cota.grupo_id)
    .eq("status", "ativa")
    .gt("pontuacao", cota.pontuacao);

  const pagas = (parcelas ?? []).filter((p: any) => p.status === "pago").length;
  const total = cota.grupos?.duracao_meses ?? 0;
  const b = statusBadge(cota.status);

  return (
    <div className="card stack">
      <div className="spread">
        <div>
          <strong style={{ fontSize: 18 }}>{cota.grupos?.nome}</strong>
          <div className="muted small">
            Cota #{cota.numero} · {cota.grupos?.bem_descricao || "Raquete"}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {cota.aceite_em ? (
            <a
              href={`/api/contrato/${cota.id}`}
              target="_blank"
              className="btn btn-ghost small"
            >
              📄 Contrato + promissória
            </a>
          ) : (
            <Link href={`/app/contrato/${cota.id}`} className="btn small">
              ⚠ Aceitar contrato
            </Link>
          )}
          <span className={`badge ${b.cls}`}>{b.label}</span>
          {!["cancelada", "contemplada", "quitada"].includes(cota.status) && (
            <SolicitarCancelamento
              cotaId={cota.id}
              jaSolicitado={!!cota.cancelamento_solicitado_em}
              multaPercent={Number(cota.grupos?.multa_cancelamento_percent ?? 30)}
            />
          )}
        </div>
      </div>

      {cota.cartao_ultimos4 && (
        <span className="badge badge-ok" style={{ alignSelf: "flex-start" }}>
          💳 Débito automático · {cota.cartao_bandeira} final {cota.cartao_ultimos4}
        </span>
      )}

      <div className="grid grid-3">
        <div>
          <div className="kpi-label">Parcelas pagas</div>
          <strong>
            {pagas}/{total}
          </strong>
        </div>
        <div>
          <div className="kpi-label">Sua posição na fila</div>
          <strong style={{ color: "var(--primary)" }}>
            {cota.status === "contemplada" ? "Contemplado 🎾" : `${(aFrente ?? 0) + 1}º`}
          </strong>
        </div>
        <div>
          <div className="kpi-label">Pontuação</div>
          <strong>{Number(cota.pontuacao).toFixed(1)}</strong>
        </div>
      </div>

      <details>
        <summary className="small muted" style={{ cursor: "pointer" }}>
          Ver parcelas ({(parcelas ?? []).length})
        </summary>
        <table style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Competência</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(parcelas ?? []).map((p: any) => {
              const pb = statusBadge(p.status);
              return (
                <tr key={p.id}>
                  <td>{competenciaBR(p.competencia)}</td>
                  <td className="muted">{dataBR(p.vencimento)}</td>
                  <td>{brl(p.valor)}</td>
                  <td>
                    <span className={`badge ${pb.cls}`}>{pb.label}</span>
                  </td>
                  <td>
                    {p.status !== "pago" && p.asaas_invoice_url && (
                      <a
                        href={p.asaas_invoice_url}
                        target="_blank"
                        className="small"
                        style={{ color: "var(--accent)" }}
                      >
                        pagar ↗
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
            {(parcelas ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="muted small">
                  Aguardando geração das parcelas pelo Asaas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </details>
    </div>
  );
}
