import { createAdminClient } from "@/lib/supabase/server";
import { statusBadge, dataBR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CotasPage() {
  const db = createAdminClient();
  const { data: cotas } = await db
    .from("cotas")
    .select(
      "id, numero, status, pontuacao, data_adesao, grupos(nome), profiles(nome, email, analise_credito_status, score_credito)",
    )
    .order("pontuacao", { ascending: false });

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Cotas (fila de contemplação)</h1>
      <p className="muted" style={{ margin: 0 }}>
        Ordenadas por pontuação — quem paga em dia sobe na fila e é contemplado
        primeiro.
      </p>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Cota</th>
              <th>Participante</th>
              <th>Pontuação</th>
              <th>Adesão</th>
              <th>Status</th>
              <th>Contrato</th>
            </tr>
          </thead>
          <tbody>
            {(cotas ?? []).map((c: any) => {
              const b = statusBadge(c.status);
              return (
                <tr key={c.id}>
                  <td>{c.grupos?.nome ?? "—"}</td>
                  <td>#{c.numero}</td>
                  <td>
                    {c.profiles?.nome || c.profiles?.email || "—"}
                    {c.profiles?.analise_credito_status === "pendente" && (
                      <span
                        className="badge badge-warn"
                        style={{ marginLeft: 6 }}
                      >
                        ⚠ revisar crédito
                      </span>
                    )}
                    {c.profiles?.analise_credito_status === "aprovado" &&
                      c.profiles?.score_credito > 0 && (
                        <span className="muted small" style={{ marginLeft: 6 }}>
                          score {c.profiles.score_credito}
                        </span>
                      )}
                  </td>
                  <td>
                    <strong>{Number(c.pontuacao).toFixed(1)}</strong>
                  </td>
                  <td className="muted">{dataBR(c.data_adesao)}</td>
                  <td>
                    <span className={`badge ${b.cls}`}>{b.label}</span>
                  </td>
                  <td>
                    <a
                      href={`/api/contrato/${c.id}`}
                      target="_blank"
                      className="small"
                      style={{ color: "var(--accent)" }}
                    >
                      PDF ↗
                    </a>
                  </td>
                </tr>
              );
            })}
            {(cotas ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  Nenhuma cota ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
