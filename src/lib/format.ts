/** Helpers de formatação BR compartilhados. */

export const brl = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dataBR = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("pt-BR");
};

export const competenciaBR = (d: string | null | undefined) => {
  if (!d) return "—";
  const [y, m] = d.split("-");
  return `${m}/${y}`;
};

/** Rótulo e classe de badge por status de cobrança/cota. */
export function statusBadge(status: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    pago: { label: "Pago", cls: "badge-ok" },
    pendente: { label: "Pendente", cls: "badge-muted" },
    atrasado: { label: "Atrasado", cls: "badge-danger" },
    cancelado: { label: "Cancelado", cls: "badge-muted" },
    estornado: { label: "Estornado", cls: "badge-warn" },
    ativa: { label: "Ativa", cls: "badge-ok" },
    aguardando: { label: "Aguardando aprovação", cls: "badge-warn" },
    contemplada: { label: "Contemplada", cls: "badge-ok" },
    inadimplente: { label: "Inadimplente", cls: "badge-danger" },
    quitada: { label: "Quitada", cls: "badge-ok" },
    formando: { label: "Formando", cls: "badge-warn" },
    ativo: { label: "Ativo", cls: "badge-ok" },
    encerrado: { label: "Encerrado", cls: "badge-muted" },
  };
  return map[status] ?? { label: status, cls: "badge-muted" };
}
