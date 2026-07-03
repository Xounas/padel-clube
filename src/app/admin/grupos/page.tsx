import { createAdminClient } from "@/lib/supabase/server";
import { brl, dataBR, statusBadge } from "@/lib/format";
import { NovoGrupo } from "./NovoGrupo";
import { AcoesGrupo } from "./AcoesGrupo";
import { EditarGrupo } from "./EditarGrupo";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const db = createAdminClient();
  const { data: grupos } = await db
    .from("grupos")
    .select("*")
    .order("criado_em", { ascending: false });

  // vagas + atividade real (pago/contemplado) por grupo
  const vagas: Record<string, number> = {};
  const temAtividade: Record<string, boolean> = {};
  for (const g of grupos ?? []) {
    const { count } = await db
      .from("cotas")
      .select("id", { count: "exact", head: true })
      .eq("grupo_id", g.id);
    vagas[g.id] = count ?? 0;
    const { count: pagas } = await db
      .from("cobrancas")
      .select("id", { count: "exact", head: true })
      .eq("grupo_id", g.id)
      .eq("status", "pago");
    const { count: cont } = await db
      .from("contemplacoes")
      .select("id", { count: "exact", head: true })
      .eq("grupo_id", g.id);
    temAtividade[g.id] = (pagas ?? 0) > 0 || (cont ?? 0) > 0;
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
                    <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                      {g.bem_imagem_url ? (
                        <img
                          src={g.bem_imagem_url}
                          alt={g.bem_modelo ?? "Raquete"}
                          style={{
                            width: 44,
                            height: 44,
                            objectFit: "contain",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "var(--bg-soft)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            border: "1px dashed var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                          }}
                        >
                          🎾
                        </div>
                      )}
                      <div>
                        <strong>{g.nome}</strong>
                        <div className="muted small">
                          {g.bem_modelo || g.bem_descricao || "Raquete"}
                        </div>
                        <div className="muted small">
                          #{String(g.id).slice(0, 8)} · criado {dataBR(g.criado_em)}
                          {temAtividade[g.id] && " · com pagamento"}
                        </div>
                      </div>
                    </div>
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
                    <div className="row" style={{ gap: 6 }}>
                      <EditarGrupo
                        grupo={{
                          id: g.id,
                          nome: g.nome,
                          bem_modelo: g.bem_modelo,
                          bem_descricao: g.bem_descricao,
                          bem_imagem_url: g.bem_imagem_url,
                          bem_valor: Number(g.bem_valor),
                          bem_custo: Number(g.bem_custo),
                        }}
                      />
                      <AcoesGrupo
                        id={g.id}
                        temAtividade={temAtividade[g.id] ?? false}
                        status={g.status}
                      />
                    </div>
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
