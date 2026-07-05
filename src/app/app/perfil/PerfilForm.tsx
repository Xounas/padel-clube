"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { atualizarPerfil } from "./actions";

function SalvarButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

export function PerfilForm({
  nome,
  cpf,
  telefone,
  email,
}: {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}) {
  const [ok, setOk] = useState(false);

  return (
    <form
      action={async (fd) => {
        await atualizarPerfil(fd);
        setOk(true);
      }}
      className="stack"
    >
      <div>
        <label className="label">Nome completo</label>
        <input name="nome" className="input" defaultValue={nome} required />
      </div>
      <div className="grid grid-2">
        <div>
          <label className="label">CPF</label>
          <input name="cpf" className="input" defaultValue={cpf} placeholder="000.000.000-00" />
        </div>
        <div>
          <label className="label">Celular (WhatsApp)</label>
          <input name="telefone" className="input" defaultValue={telefone} placeholder="(00) 00000-0000" />
        </div>
      </div>
      <div>
        <label className="label">E-mail (login — não editável aqui)</label>
        <input className="input" value={email} disabled />
      </div>
      {ok && (
        <div className="badge badge-ok" style={{ padding: "8px 12px", alignSelf: "flex-start" }}>
          Cadastro atualizado ✓
        </div>
      )}
      <div>
        <SalvarButton />
      </div>
    </form>
  );
}
