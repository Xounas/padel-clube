import { createAdminClient } from "@/lib/supabase/server";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
  score: number | null;
  cotas: number;
  inadimplente: boolean;
  pago: number;
}

export default async function ClientesPage() {
  const db = createAdminClient();

  const [{ data: cotas }, { data: pagas }] = await Promise.all([
    db
      .from("cotas")
      .select(
        "participante_id, status, profiles(nome, email, telefone, cpf, score_credito)",
      ),
    db
      .from("cobrancas")
      .select("valor_pago, cotas(participante_id)")
      .eq("status", "pago"),
  ]);

  // agrega por participante
  const mapa = new Map<string, Cliente>();
  for (const c of cotas ?? []) {
    const pid = (c as any).participante_id;
    if (!pid) continue;
    const p = (c as any).profiles ?? {};
    const cur =
      mapa.get(pid) ??
      ({
        id: pid,
        nome: p.nome || p.email || "—",
        email: p.email,
        telefone: p.telefone,
        cpf: p.cpf,
        score: p.score_credito,
        cotas: 0,
        inadimplente: false,
        pago: 0,
      } as Cliente);
    cur.cotas += 1;
    if ((c as any).status === "inadimplente") cur.inadimplente = true;
    mapa.set(pid, cur);
  }
  for (const p of pagas ?? []) {
    const pid = (p as any).cotas?.participante_id;
    if (pid && mapa.has(pid))
      mapa.get(pid)!.pago += Number((p as any).valor_pago || 0);
  }

  const clientes = Array.from(mapa.values()).sort((a, b) => b.pago - a.pago);
  const inadimplentes = clientes.filter((c) => c.inadimplente).length;

  return (
    <div className="stack">
      <div>
        <h1 style={{ margin: "0 0 2px" }}>Clientes</h1>
        <p className="muted small" style={{ margin: 0 }}>
          {clientes.length} participante(s) · {inadimplentes} inadimplente(s).
        </p>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Contato</th>
              <th>CPF</th>
              <th>Score</th>
              <th>Cotas</th>
              <th>Total pago</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.nome}</strong>
                </td>
                <td className="small">
                  {c.email && <div>{c.email}</div>}
                  {c.telefone && <div className="muted">{c.telefone}</div>}
                </td>
                <td className="muted">{c.cpf ?? "—"}</td>
                <td>{c.score ?? "—"}</td>
                <td>{c.cotas}</td>
                <td>{brl(c.pago)}</td>
                <td>
                  {c.inadimplente ? (
                    <span className="badge badge-danger">Inadimplente</span>
                  ) : (
                    <span className="badge badge-ok">Em dia</span>
                  )}
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  Nenhum cliente ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
