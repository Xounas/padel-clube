import { createClient } from "@/lib/supabase/server";
import { brl } from "@/lib/format";
import { AderirForm } from "./AderirForm";

export const dynamic = "force-dynamic";

export default async function AderirPage() {
  const supabase = createClient();

  const { data: grupos } = await supabase
    .from("grupos")
    .select("*")
    .in("status", ["formando", "ativo"])
    .order("criado_em", { ascending: false });

  // vagas por grupo
  const comVagas = [];
  for (const g of grupos ?? []) {
    const { count } = await supabase
      .from("cotas")
      .select("id", { count: "exact", head: true })
      .eq("grupo_id", g.id);
    const usadas = count ?? 0;
    if (usadas < g.total_cotas)
      comVagas.push({ ...g, vagas: g.total_cotas - usadas });
  }

  return (
    <div className="stack">
      <div>
        <h1 style={{ margin: "0 0 4px" }}>Entrar num grupo</h1>
        <p className="muted" style={{ margin: 0 }}>
          Escolha um grupo com vaga, faça sua análise e comece a pagar sua
          raquete em parcelas.
        </p>
      </div>

      {comVagas.length === 0 && (
        <div className="card muted">
          Nenhum grupo com vaga no momento. Volte em breve — novos grupos abrem
          toda semana.
        </div>
      )}

      <div className="grid grid-2">
        {comVagas.map((g) => (
          <div key={g.id} className="card stack">
            {g.bem_imagem_url && (
              <img
                src={g.bem_imagem_url}
                alt={g.bem_modelo ?? "Raquete"}
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "contain",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--bg-soft)",
                }}
              />
            )}
            <div className="spread">
              <strong style={{ fontSize: 18 }}>{g.nome}</strong>
              <span className="badge badge-ok">{g.vagas} vaga(s)</span>
            </div>
            {g.bem_modelo && <strong>{g.bem_modelo}</strong>}
            <p className="muted small" style={{ margin: 0 }}>
              {g.bem_descricao || "Raquete de padel"}
            </p>
            <div className="grid grid-2 small">
              <div>
                <div className="kpi-label">Mensalidade</div>
                <strong style={{ color: "var(--primary)" }}>
                  {brl(g.valor_mensal)}/mês
                </strong>
              </div>
              <div>
                <div className="kpi-label">Duração</div>
                <strong>{g.duracao_meses} meses</strong>
              </div>
              <div>
                <div className="kpi-label">Valor da raquete</div>
                <strong>{brl(g.bem_valor)}</strong>
              </div>
              <div>
                <div className="kpi-label">Contemplados/mês</div>
                <strong>{g.contemplados_por_mes}</strong>
              </div>
            </div>
            <AderirForm grupo={{ id: g.id, nome: g.nome }} />
          </div>
        ))}
      </div>
    </div>
  );
}
