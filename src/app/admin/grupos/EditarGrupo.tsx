"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { editarGrupo } from "./actions";
import { ImageUpload } from "@/components/ImageUpload";

function SalvarButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

export interface GrupoEdit {
  id: string;
  nome: string;
  bem_modelo: string | null;
  bem_descricao: string | null;
  bem_imagem_url: string | null;
  bem_valor: number;
  bem_custo: number;
}

export function EditarGrupo({ grupo }: { grupo: GrupoEdit }) {
  const [open, setOpen] = useState(false);
  const [imagemUrl, setImagemUrl] = useState(grupo.bem_imagem_url ?? "");

  if (!open) {
    return (
      <button className="btn btn-ghost small" onClick={() => setOpen(true)}>
        Editar
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
        style={{ width: 480, maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0 }}>Editar grupo</h3>
        <form
          action={async (fd) => {
            await editarGrupo(grupo.id, fd);
            setOpen(false);
          }}
          className="stack"
        >
          <input type="hidden" name="bem_imagem_url" value={imagemUrl} />
          <div>
            <label className="label">Nome do grupo</label>
            <input name="nome" className="input" defaultValue={grupo.nome} required />
          </div>
          <div className="grid grid-2">
            <div>
              <label className="label">Modelo da raquete</label>
              <input name="bem_modelo" className="input" defaultValue={grupo.bem_modelo ?? ""} />
            </div>
            <div>
              <label className="label">Descrição</label>
              <input name="bem_descricao" className="input" defaultValue={grupo.bem_descricao ?? ""} />
            </div>
            <div>
              <label className="label">Valor mercado (R$)</label>
              <input name="bem_valor" className="input" type="number" step="0.01" defaultValue={grupo.bem_valor} />
            </div>
            <div>
              <label className="label">Custo (R$)</label>
              <input name="bem_custo" className="input" type="number" step="0.01" defaultValue={grupo.bem_custo} />
            </div>
          </div>
          <div>
            <label className="label">Foto da raquete</label>
            <ImageUpload value={imagemUrl} onChange={setImagemUrl} />
          </div>
          <div className="row">
            <SalvarButton />
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
