import { createAdminClient } from "@/lib/supabase/server";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const db = createAdminClient();

  const { data: fin } = await db
    .from("v_financeiro_grupo")
    .select("*")
    .order("grupo");
  const { data: inad } = await db
    .from("v_inadimplencia")
    .select("*")
    .gt("valor_em_atraso", 0)
    .order("valor_em_atraso", { ascending: false });

  const totais = (fin ?? []).reduce(
    (
      a: { arrecadado: number; lucro: number; projetado: number; raquetes: number },
      g: any,
    ) => ({
      arrecadado: a.arrecadado + Number(g.arrecadado || 0),
      lucro: a.lucro + Number(g.lucro_caixa || 0),
      projetado: a.projetado + Number(g.lucro_projetado || 0),
      raquetes: a.raquetes + Number(g.raquetes_entregues || 0),
    }),
    { arrecadado: 0, lucro: 0, projetado: 0, raquetes: 0 },
  );
  const emAtraso = (inad ?? []).reduce(
    (a: number, r: any) => a + Number(r.valor_em_atraso || 0),
    0,
  );

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Financeiro</h1>

      <div className="grid grid-3">
        <div className="card">
          <div className="kpi" style={{ color: "var(--primary)" }}>
            {brl(totais.lucro)}
          </div>
          <div className="kpi-label">Lucro em caixa (arrecadado − custo entregue)</div>
        </div>
        <div className="card">
          <div className="kpi">{brl(totais.arrecadado)}</div>
          <div className="kpi-label">Total arrecadado</div>
        </div>
        <div className="card">
          <div className="kpi" style={{ color: "var(--danger)" }}>
            {brl(emAtraso)}
          </div>
          <div className="kpi-label">Em atraso (inadimplência)</div>
        </div>
      </div>

      <div className="card">
        <div className="spread">
          <h3 style={{ margin: 0 }}>Por grupo</h3>
          <span className="muted small">
            Lucro projetado total: {brl(totais.projetado)}
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Parcelas pagas</th>
              <th>Arrecadado</th>
              <th>Raquetes entregues</th>
              <th>Lucro caixa</th>
              <th>Lucro projetado</th>
            </tr>
          </thead>
          <tbody>
            {(fin ?? []).map((g: any) => (
              <tr key={g.grupo_id}>
                <td>{g.grupo}</td>
                <td>{g.parcelas_pagas}</td>
                <td>{brl(g.arrecadado)}</td>
                <td>{g.raquetes_entregues}</td>
                <td style={{ color: "var(--primary)" }}>{brl(g.lucro_caixa)}</td>
                <td className="muted">{brl(g.lucro_projetado)}</td>
              </tr>
            ))}
            {(fin ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Nenhum grupo ainda. Crie o primeiro em Grupos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ margin: "0 0 8px" }}>Inadimplência</h3>
        <table>
          <thead>
            <tr>
              <th>Participante</th>
              <th>Cota</th>
              <th>Parcelas atrasadas</th>
              <th>Valor em atraso</th>
              <th>Atraso mais antigo</th>
            </tr>
          </thead>
          <tbody>
            {(inad ?? []).map((r: any) => (
              <tr key={r.cota_id}>
                <td>{r.participante ?? "—"}</td>
                <td>#{r.numero}</td>
                <td>{r.parcelas_atrasadas}</td>
                <td style={{ color: "var(--danger)" }}>
                  {brl(r.valor_em_atraso)}
                </td>
                <td className="muted">{r.atraso_mais_antigo ?? "—"}</td>
              </tr>
            ))}
            {(inad ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Sem inadimplência. 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
