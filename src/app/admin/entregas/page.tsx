import { createAdminClient } from "@/lib/supabase/server";
import { brl, competenciaBR, dataBR } from "@/lib/format";
import { ProcessarEntrega } from "./ProcessarEntrega";

export const dynamic = "force-dynamic";

function statusEntregaBadge(s: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    aguardando: { label: "Aguardando compra", cls: "badge-warn" },
    comprado: { label: "Comprado", cls: "badge-muted" },
    enviado: { label: "Enviado", cls: "badge-muted" },
    entregue: { label: "Entregue", cls: "badge-ok" },
  };
  return map[s] ?? { label: s, cls: "badge-muted" };
}

export default async function EntregasPage() {
  const db = createAdminClient();

  const { data: itens } = await db
    .from("contemplacoes")
    .select(
      "id, competencia, status_entrega, custo_real, fornecedor, rastreio, entregue, entregue_em, " +
        "cota_id, cotas(numero, raquete_modelo, raquete_imagem_url, profiles(nome, telefone)), " +
        "grupos(nome, bem_modelo, bem_descricao, bem_custo)",
    )
    .order("entregue", { ascending: true })
    .order("competencia", { ascending: true })
    .limit(200);

  const lista = itens ?? [];
  const pendentes = lista.filter((i: any) => !i.entregue).length;

  return (
    <div className="stack">
      <div>
        <h1 style={{ margin: "0 0 2px" }}>Entregas</h1>
        <p className="muted small" style={{ margin: 0 }}>
          Compra e entrega das raquetes aos contemplados. {pendentes} pendente(s).
        </p>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Cota</th>
              <th>Contemplado</th>
              <th>Raquete</th>
              <th>Custo</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((i: any) => {
              const b = statusEntregaBadge(i.status_entrega ?? "aguardando");
              const modelo =
                i.cotas?.raquete_modelo ||
                i.grupos?.bem_modelo ||
                i.grupos?.bem_descricao ||
                "Raquete";
              return (
                <tr key={i.id}>
                  <td>{i.grupos?.nome ?? "—"}</td>
                  <td>#{i.cotas?.numero ?? "—"}</td>
                  <td>
                    {i.cotas?.profiles?.nome ?? "—"}
                    {i.cotas?.profiles?.telefone && (
                      <div className="muted small">
                        {i.cotas.profiles.telefone}
                      </div>
                    )}
                  </td>
                  <td className="muted">{modelo}</td>
                  <td>
                    {i.custo_real != null ? (
                      brl(i.custo_real)
                    ) : (
                      <span className="muted">
                        {brl(i.grupos?.bem_custo)} (padrão)
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${b.cls}`}>{b.label}</span>
                    {i.entregue_em && (
                      <div className="muted small">{dataBR(i.entregue_em)}</div>
                    )}
                  </td>
                  <td>
                    <ProcessarEntrega
                      item={{
                        id: i.id,
                        cota_id: i.cota_id,
                        status_entrega: i.status_entrega ?? "aguardando",
                        custo_real: i.custo_real,
                        fornecedor: i.fornecedor,
                        rastreio: i.rastreio,
                        raquete_modelo: i.cotas?.raquete_modelo ?? null,
                        raquete_imagem_url: i.cotas?.raquete_imagem_url ?? null,
                        custo_padrao: Number(i.grupos?.bem_custo ?? 0),
                      }}
                    />
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  Nenhuma contemplação ainda. As entregas aparecem aqui após
                  contemplar em /admin/contemplacao.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
