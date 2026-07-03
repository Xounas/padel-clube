import { createAdminClient } from "@/lib/supabase/server";
import { dataBR, competenciaBR } from "@/lib/format";
import { PainelContemplacao } from "./PainelContemplacao";
import { marcarEntregue } from "./actions";

export const dynamic = "force-dynamic";

export default async function ContemplacaoPage() {
  const db = createAdminClient();

  const { data: grupos } = await db
    .from("grupos")
    .select("id, nome, contemplados_por_mes, contemplavel_apos_parcelas")
    .in("status", ["formando", "ativo"])
    .order("nome");

  const { data: contemplacoes } = await db
    .from("contemplacoes")
    .select(
      "id, competencia, entregue, entregue_em, posicao_fila, cotas(numero, profiles(nome)), grupos(nome)",
    )
    .order("competencia", { ascending: false })
    .limit(100);

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Contemplação</h1>
      <p className="muted" style={{ margin: 0 }}>
        Roda a fila do mês: os membros adimplentes de maior pontuação (que já
        pagaram o mínimo de parcelas) são contemplados.
      </p>

      <PainelContemplacao grupos={grupos ?? []} />

      <div className="card">
        <h3 style={{ margin: "0 0 8px" }}>Contemplados</h3>
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Cota</th>
              <th>Participante</th>
              <th>Competência</th>
              <th>Entrega</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(contemplacoes ?? []).map((c: any) => (
              <tr key={c.id}>
                <td>{c.grupos?.nome ?? "—"}</td>
                <td>#{c.cotas?.numero ?? "—"}</td>
                <td>{c.cotas?.profiles?.nome ?? "—"}</td>
                <td>{competenciaBR(c.competencia)}</td>
                <td>
                  {c.entregue ? (
                    <span className="badge badge-ok">
                      Entregue {dataBR(c.entregue_em)}
                    </span>
                  ) : (
                    <span className="badge badge-warn">Pendente</span>
                  )}
                </td>
                <td>
                  {!c.entregue && (
                    <form action={marcarEntregue.bind(null, c.id)}>
                      <button className="btn btn-ghost small">
                        Marcar entregue
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {(contemplacoes ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Ninguém contemplado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
