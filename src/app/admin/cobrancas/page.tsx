import { createAdminClient } from "@/lib/supabase/server";
import { brl, dataBR, competenciaBR, statusBadge } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FILTROS = ["todas", "pendente", "pago", "atrasado"] as const;

export default async function CobrancasPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const db = createAdminClient();
  const filtro = searchParams.status ?? "todas";

  let query = db
    .from("cobrancas")
    .select(
      "id, competencia, parcela_num, valor, vencimento, status, dias_atraso, asaas_invoice_url, cotas(numero, profiles(nome)), grupos(nome)",
    )
    .order("vencimento", { ascending: true })
    .limit(300);
  if (filtro !== "todas") query = query.eq("status", filtro);

  const { data: cobrancas } = await query;

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Cobranças</h1>
      <div className="row">
        {FILTROS.map((f) => (
          <Link
            key={f}
            href={`/admin/cobrancas?status=${f}`}
            className={`badge ${filtro === f ? "badge-ok" : "badge-muted"}`}
            style={{ padding: "6px 12px" }}
          >
            {f}
          </Link>
        ))}
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Cota</th>
              <th>Participante</th>
              <th>Competência</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Atraso</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(cobrancas ?? []).map((c: any) => {
              const b = statusBadge(c.status);
              return (
                <tr key={c.id}>
                  <td>{c.grupos?.nome ?? "—"}</td>
                  <td>#{c.cotas?.numero ?? "—"}</td>
                  <td>{c.cotas?.profiles?.nome ?? "—"}</td>
                  <td>{competenciaBR(c.competencia)}</td>
                  <td className="muted">{dataBR(c.vencimento)}</td>
                  <td>{brl(c.valor)}</td>
                  <td className={c.dias_atraso > 0 ? "" : "muted"}>
                    {c.dias_atraso > 0 ? `${c.dias_atraso}d` : "—"}
                  </td>
                  <td>
                    <span className={`badge ${b.cls}`}>{b.label}</span>
                  </td>
                  <td>
                    {c.asaas_invoice_url && (
                      <a
                        href={c.asaas_invoice_url}
                        target="_blank"
                        className="small"
                        style={{ color: "var(--accent)" }}
                      >
                        fatura ↗
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
            {(cobrancas ?? []).length === 0 && (
              <tr>
                <td colSpan={9} className="muted">
                  Nenhuma cobrança neste filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
