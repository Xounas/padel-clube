"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { solicitarCancelamento } from "./actions";

export function SolicitarCancelamento({
  cotaId,
  jaSolicitado,
  multaPercent,
}: {
  cotaId: string;
  jaSolicitado: boolean;
  multaPercent: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (jaSolicitado) {
    return (
      <span className="badge badge-warn">Cancelamento solicitado</span>
    );
  }

  async function solicitar() {
    // aviso de multa (percentual, dentro do limite legal / CDC)
    const ok = window.confirm(
      `ATENÇÃO: ao cancelar, poderá incidir multa de ${multaPercent}% sobre os valores já pagos, ` +
        `a título de compensação, conforme o contrato e nos limites do Código de Defesa do Consumidor. ` +
        `Deseja continuar com a solicitação de cancelamento?`,
    );
    if (!ok) return;
    const motivo = window.prompt(
      "Você pode informar o motivo do cancelamento (opcional). O pedido será analisado pela administração.",
    );
    if (motivo === null) return; // cancelou o prompt
    setLoading(true);
    try {
      await solicitarCancelamento(cotaId, motivo);
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "Falha ao solicitar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="btn btn-ghost small" disabled={loading} onClick={solicitar}>
      {loading ? "..." : "Solicitar cancelamento"}
    </button>
  );
}
