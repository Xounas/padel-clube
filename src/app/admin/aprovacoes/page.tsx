import { createAdminClient } from "@/lib/supabase/server";
import { dataBR } from "@/lib/format";
import { AcoesAprovacao } from "./AcoesAprovacao";

export const dynamic = "force-dynamic";

export default async function AprovacoesPage() {
  const db = createAdminClient();

  const { data: cotas } = await db
    .from("cotas")
    .select(
      "id, numero, aceite_em, cartao_ultimos4, cartao_bandeira, pagamento_tipo, parcelas, data_adesao, " +
        "grupos(nome), profiles(nome, email, telefone, cpf, score_credito, analise_credito_status)",
    )
    .eq("status", "aguardando")
    .order("data_adesao", { ascending: true });

  const lista = cotas ?? [];

  return (
    <div className="stack">
      <div>
        <h1 style={{ margin: "0 0 2px" }}>Aprovações de cadastro</h1>
        <p className="muted small" style={{ margin: 0 }}>
          {lista.length} aguardando. A cobrança no cartão só começa após você
          aprovar.
        </p>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Cota</th>
              <th>Candidato</th>
              <th>Score</th>
              <th>Pagamento</th>
              <th>Cartão</th>
              <th>Contrato</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c: any) => {
              const p = c.profiles ?? {};
              const aceitou = !!c.aceite_em;
              return (
                <tr key={c.id}>
                  <td>{c.grupos?.nome ?? "—"}</td>
                  <td>#{c.numero}</td>
                  <td>
                    <strong>{p.nome || p.email || "—"}</strong>
                    <div className="muted small">
                      {p.cpf ?? ""} {p.telefone ? `· ${p.telefone}` : ""}
                    </div>
                  </td>
                  <td>
                    {p.score_credito ?? "—"}
                    {p.analise_credito_status === "recusado" && (
                      <div>
                        <span className="badge badge-danger">crédito baixo</span>
                      </div>
                    )}
                  </td>
                  <td className="small">
                    {c.pagamento_tipo === "parcelado"
                      ? `Parcelado ${c.parcelas ?? ""}x`
                      : "Recorrente"}
                  </td>
                  <td className="small muted">
                    {c.cartao_bandeira} ••{c.cartao_ultimos4}
                  </td>
                  <td>
                    {aceitou ? (
                      <span className="badge badge-ok">
                        Aceito {dataBR(c.aceite_em)}
                      </span>
                    ) : (
                      <span className="badge badge-warn">Pendente</span>
                    )}
                  </td>
                  <td>
                    <AcoesAprovacao cotaId={c.id} podeAprovar={aceitou} />
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  Nenhum cadastro aguardando aprovação.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
