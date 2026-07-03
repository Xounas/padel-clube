import { createAdminClient } from "@/lib/supabase/server";
import { brl, competenciaBR } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = createAdminClient();

  const [{ data: grupos }, { data: cotas }, { data: fin }, { data: inad }] =
    await Promise.all([
      db.from("grupos").select("id, nome, total_cotas, valor_mensal, status"),
      db.from("cotas").select("id, status, grupo_id"),
      db.from("v_financeiro_grupo").select("*"),
      db.from("v_inadimplencia").select("*").gt("valor_em_atraso", 0),
    ]);

  const { data: aEntregar } = await db
    .from("contemplacoes")
    .select(
      "id, competencia, cotas(numero, profiles(nome)), grupos(nome, bem_descricao)",
    )
    .eq("entregue", false)
    .order("competencia", { ascending: true });

  const gruposList = grupos ?? [];
  const cotasList = cotas ?? [];
  const valorPorGrupo = new Map<string, number>(
    gruposList.map((g: any): [string, number] => [g.id, Number(g.valor_mensal)]),
  );

  // MRR = cotas ainda pagando (ativa/contemplada/inadimplente) × mensalidade do grupo
  const pagando = cotasList.filter((c: any) =>
    ["ativa", "contemplada", "inadimplente"].includes(c.status),
  );
  const mrr = pagando.reduce(
    (s: number, c: any) => s + (valorPorGrupo.get(c.grupo_id) ?? 0),
    0,
  );

  const capacidade = gruposList.reduce(
    (s: number, g: any) => s + Number(g.total_cotas),
    0,
  );
  const gruposAtivos = gruposList.filter((g: any) =>
    ["ativo", "formando"].includes(g.status),
  ).length;
  const inadimplentes = cotasList.filter(
    (c: any) => c.status === "inadimplente",
  ).length;

  const arrecadado = (fin ?? []).reduce(
    (s: number, g: any) => s + Number(g.arrecadado || 0),
    0,
  );
  const lucroCaixa = (fin ?? []).reduce(
    (s: number, g: any) => s + Number(g.lucro_caixa || 0),
    0,
  );
  const emAtraso = (inad ?? []).reduce(
    (s: number, r: any) => s + Number(r.valor_em_atraso || 0),
    0,
  );
  const pctInad = cotasList.length
    ? Math.round((inadimplentes / cotasList.length) * 100)
    : 0;

  return (
    <div className="stack">
      <div className="spread">
        <div>
          <h1 style={{ margin: "0 0 2px" }}>Painel</h1>
          <p className="muted small" style={{ margin: 0 }}>
            Visão geral do negócio em tempo real.
          </p>
        </div>
        <Link href="/admin/grupos" className="btn">
          + Novo grupo
        </Link>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-3">
        <div className="card">
          <div className="kpi-label">Receita recorrente (MRR)</div>
          <div className="kpi" style={{ color: "var(--accent)" }}>{brl(mrr)}</div>
          <div className="muted small">{pagando.length} cotas ativas pagando/mês</div>
        </div>
        <div className="card">
          <div className="kpi-label">Caixa (lucro acumulado)</div>
          <div className="kpi">{brl(lucroCaixa)}</div>
          <div className="muted small">{brl(arrecadado)} arrecadado no total</div>
        </div>
        <div className="card">
          <div className="kpi-label">Inadimplência</div>
          <div
            className="kpi"
            style={{ color: emAtraso > 0 ? "var(--danger)" : "var(--text)" }}
          >
            {pctInad}%
          </div>
          <div className="muted small">{brl(emAtraso)} em atraso</div>
        </div>
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-3">
        <div className="card">
          <div className="kpi-label">Cotas vendidas</div>
          <div className="kpi">
            {cotasList.length}
            <span style={{ fontSize: 16, color: "var(--muted)" }}>
              {" "}
              / {capacidade}
            </span>
          </div>
          <div className="muted small">vagas ocupadas / capacidade total</div>
        </div>
        <div className="card">
          <div className="kpi-label">Grupos ativos</div>
          <div className="kpi">{gruposAtivos}</div>
          <div className="muted small">{gruposList.length} no total</div>
        </div>
        <div className="card">
          <div className="kpi-label">Raquetes a entregar</div>
          <div
            className="kpi"
            style={{
              color: (aEntregar ?? []).length ? "var(--warn)" : "var(--text)",
            }}
          >
            {(aEntregar ?? []).length}
          </div>
          <div className="muted small">contemplados aguardando entrega</div>
        </div>
      </div>

      {/* Raquetes a entregar */}
      <div className="card">
        <div className="spread">
          <h3 style={{ margin: 0 }}>Raquetes a entregar</h3>
          <Link href="/admin/contemplacao" className="small" style={{ color: "var(--primary)" }}>
            ir para contemplação →
          </Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Cota</th>
              <th>Contemplado</th>
              <th>Raquete</th>
              <th>Competência</th>
            </tr>
          </thead>
          <tbody>
            {(aEntregar ?? []).map((c: any) => (
              <tr key={c.id}>
                <td>{c.grupos?.nome ?? "—"}</td>
                <td>#{c.cotas?.numero ?? "—"}</td>
                <td>{c.cotas?.profiles?.nome ?? "—"}</td>
                <td className="muted">{c.grupos?.bem_descricao ?? "Raquete"}</td>
                <td className="muted">{competenciaBR(c.competencia)}</td>
              </tr>
            ))}
            {(aEntregar ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Nada pendente de entrega. 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Formação dos grupos */}
      <div className="card">
        <h3 style={{ margin: "0 0 12px" }}>Formação dos grupos</h3>
        <div className="stack" style={{ gap: 12 }}>
          {gruposList.map((g: any) => {
            const usadas = cotasList.filter(
              (c: any) => c.grupo_id === g.id,
            ).length;
            const pct = Math.min(
              100,
              Math.round((usadas / Number(g.total_cotas)) * 100),
            );
            return (
              <div key={g.id}>
                <div className="spread small" style={{ marginBottom: 4 }}>
                  <span>{g.nome}</span>
                  <span className="muted">
                    {usadas}/{g.total_cotas} cotas ({pct}%)
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: "var(--bg)",
                    borderRadius: 999,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background:
                        pct >= 100 ? "var(--accent)" : "var(--primary)",
                    }}
                  />
                </div>
              </div>
            );
          })}
          {gruposList.length === 0 && (
            <p className="muted small" style={{ margin: 0 }}>
              Nenhum grupo ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
