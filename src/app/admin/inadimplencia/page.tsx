import { createAdminClient } from "@/lib/supabase/server";
import { brl, dataBR } from "@/lib/format";
import {
  negativarManual,
  registrarProtesto,
  registrarAcordo,
} from "./actions";
import { RodarRegua } from "./RodarRegua";

export const dynamic = "force-dynamic";

function estagio(c: any): { label: string; cls: string } {
  if (c.protestado_em) return { label: "Protestado", cls: "badge-danger" };
  if (c.negativado_em) return { label: "Negativado", cls: "badge-danger" };
  if (c.notificado_em) return { label: "Notificado", cls: "badge-warn" };
  if (c.dias_atraso > 0) return { label: "Atrasado", cls: "badge-warn" };
  return { label: "Em dia", cls: "badge-ok" };
}

export default async function InadimplenciaPage() {
  const db = createAdminClient();

  const { data: atrasadas } = await db
    .from("cobrancas")
    .select(
      "id, competencia, valor, vencimento, dias_atraso, notificado_em, negativado_em, protestado_em, cotas(numero, profiles(nome, cpf)), grupos(nome)",
    )
    .eq("status", "atrasado")
    .order("dias_atraso", { ascending: false })
    .limit(200);

  const { data: acoes } = await db
    .from("cobranca_acoes")
    .select("id, tipo, canal, resultado, detalhe, criado_em")
    .order("criado_em", { ascending: false })
    .limit(30);

  return (
    <div className="stack">
      <div className="spread">
        <h1 style={{ margin: 0 }}>Inadimplência</h1>
        <RodarRegua />
      </div>

      <div className="card" style={{ borderColor: "color-mix(in srgb, var(--warn) 30%, var(--border))" }}>
        <p className="small muted" style={{ margin: 0 }}>
          ⚖️ A escalada respeita a lei: multa ≤ 2%, juros ≤ 1% a.m., notificação
          prévia antes de negativar (Súmula 359 STJ, feita pelo Asaas), e nada de
          cobrança vexatória. A negativação automática dispara aos 30 dias.
        </p>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Cota</th>
              <th>Devedor</th>
              <th>Venc.</th>
              <th>Atraso</th>
              <th>Valor</th>
              <th>Estágio</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(atrasadas ?? []).map((c: any) => {
              const e = estagio(c);
              return (
                <tr key={c.id}>
                  <td>{c.grupos?.nome ?? "—"}</td>
                  <td>#{c.cotas?.numero ?? "—"}</td>
                  <td>{c.cotas?.profiles?.nome ?? "—"}</td>
                  <td className="muted">{dataBR(c.vencimento)}</td>
                  <td style={{ color: "var(--danger)" }}>{c.dias_atraso}d</td>
                  <td>{brl(c.valor)}</td>
                  <td>
                    <span className={`badge ${e.cls}`}>{e.label}</span>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                      {!c.negativado_em && (
                        <form action={negativarManual.bind(null, c.id)}>
                          <button className="btn btn-ghost small">Negativar</button>
                        </form>
                      )}
                      {!c.protestado_em && (
                        <form action={registrarProtesto.bind(null, c.id)}>
                          <button className="btn btn-ghost small">Protesto</button>
                        </form>
                      )}
                      <form action={registrarAcordo.bind(null, c.id)}>
                        <button className="btn btn-ghost small">Acordo</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(atrasadas ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  Sem inadimplência no momento. 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ margin: "0 0 8px" }}>Últimas ações de cobrança</h3>
        <table>
          <thead>
            <tr>
              <th>Quando</th>
              <th>Tipo</th>
              <th>Canal</th>
              <th>Resultado</th>
              <th>Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {(acoes ?? []).map((a: any) => (
              <tr key={a.id}>
                <td className="muted">{dataBR(a.criado_em)}</td>
                <td>{a.tipo}</td>
                <td>{a.canal}</td>
                <td>{a.resultado}</td>
                <td className="muted small">{a.detalhe}</td>
              </tr>
            ))}
            {(acoes ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Nenhuma ação registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
