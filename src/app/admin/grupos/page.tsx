import { createAdminClient } from "@/lib/supabase/server";
import { brl } from "@/lib/format";
import { statusBadge } from "@/lib/format";
import { NovoGrupo } from "./NovoGrupo";
import { AcoesGrupo } from "./AcoesGrupo";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const db = createAdminClient();
  const { data: grupos } = await db
    .from("grupos")
    .select("*")
    .order("criado_em", { ascending: false });

  // vagas por grupo
  const vagas: Record<string, number> = {};
  for (const g of grupos ?? []) {
    const { count } = await db
      .from("cotas")
      .select("id", { count: "exact", head: true })
      .eq("grupo_id", g.id);
    vagas[g.id] = (count ?? 0);
  }

  return (
    <div className="stack">
      <div className="spread">
        <h1 style={{ margin: 0 }}>Grupos</h1>
        <NovoGrupo />
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Mensalidade</th>
              <th>Cotas</th>
              <th>Config</th>
              <th>Lucro/cota</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(grupos ?? []).map((g: any) => {
              const usadas = vagas[g.id] ?? 0;
              const lucroCota =
                Number(g.valor_mensal) * Number(g.duracao_meses) -
                Number(g.bem_custo);
              const b = statusBadge(g.status);
              return (
                <tr key={g.id}>
                  <td>
                    <strong>{g.nome}</strong>
                    <div className="muted small">{g.bem_descricao}</div>
                  </td>
                  <td>{brl(g.valor_mensal)}</td>
                  <td>
                    {usadas}/{g.total_cotas}
                  </td>
                  <td className="muted small">
                    {g.contemplados_por_mes}/mês · {g.duracao_meses}m · trava{" "}
                    {g.contemplavel_apos_parcelas}p
                  </td>
                  <td style={{ color: "var(--primary)" }}>{brl(lucroCota)}</td>
                  <td>
                    <span className={`badge ${b.cls}`}>{b.label}</span>
                  </td>
                  <td>
                    <AcoesGrupo id={g.id} usadas={usadas} status={g.status} />
                  </td>
                </tr>
              );
            })}
            {(grupos ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  Nenhum grupo. Crie o primeiro com o botão acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
