"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { processarEntrega } from "./actions";
import { ImageUpload } from "@/components/ImageUpload";

function SalvarButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

export interface EntregaItem {
  id: string;
  cota_id: string;
  status_entrega: string;
  custo_real: number | null;
  fornecedor: string | null;
  rastreio: string | null;
  raquete_modelo: string | null;
  raquete_imagem_url: string | null;
  custo_padrao: number;
}

const STATUS = ["aguardando", "comprado", "enviado", "entregue"];

export function ProcessarEntrega({ item }: { item: EntregaItem }) {
  const [open, setOpen] = useState(false);
  const [imagem, setImagem] = useState(item.raquete_imagem_url ?? "");

  if (!open) {
    return (
      <button className="btn btn-ghost small" onClick={() => setOpen(true)}>
        Processar
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,37,64,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 20,
      }}
      onClick={() => setOpen(false)}
    >
      <div
        className="card stack"
        style={{ width: 460, maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0 }}>Processar entrega</h3>
        <form
          action={async (fd) => {
            await processarEntrega(item.id, item.cota_id, fd);
            setOpen(false);
          }}
          className="stack"
        >
          <input type="hidden" name="raquete_imagem_url" value={imagem} />
          <div>
            <label className="label">Status</label>
            <select
              name="status_entrega"
              className="select"
              defaultValue={item.status_entrega}
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-2">
            <div>
              <label className="label">Custo real (R$)</label>
              <input
                name="custo_real"
                className="input"
                type="number"
                step="0.01"
                defaultValue={item.custo_real ?? item.custo_padrao}
              />
            </div>
            <div>
              <label className="label">Fornecedor</label>
              <input
                name="fornecedor"
                className="input"
                defaultValue={item.fornecedor ?? ""}
              />
            </div>
          </div>
          <div>
            <label className="label">Código de rastreio</label>
            <input
              name="rastreio"
              className="input"
              defaultValue={item.rastreio ?? ""}
            />
          </div>
          <div>
            <label className="label">Modelo da raquete (deste contemplado)</label>
            <input
              name="raquete_modelo"
              className="input"
              defaultValue={item.raquete_modelo ?? ""}
              placeholder="Ex.: Bullpadel Vertex 04"
            />
          </div>
          <div>
            <label className="label">Foto da raquete</label>
            <ImageUpload value={imagem} onChange={setImagem} />
          </div>
          <div className="row">
            <SalvarButton />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
