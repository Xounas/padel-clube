"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [signup, setSignup] = useState(params.get("signup") === "1");
  const next = params.get("next") ?? "/app/minhas-cotas";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (signup) {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nome } },
        });
        if (error) throw error;
        setOk(
          "Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa. Depois faça login.",
        );
        setSignup(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err: any) {
      setErro(err?.message ?? "Falha na autenticação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="container"
      style={{ maxWidth: 420, paddingTop: 72, paddingBottom: 48 }}
    >
      <Link href="/" className="brand" style={{ display: "block", marginBottom: 24 }}>
        Padel<span> Clube</span>
      </Link>
      <div className="card stack">
        <h2 style={{ margin: 0 }}>{signup ? "Criar conta" : "Entrar"}</h2>
        <form onSubmit={handleSubmit} className="stack">
          {signup && (
            <div>
              <label className="label">Nome completo</label>
              <input
                className="input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label className="label">E-mail</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {erro && (
            <div className="badge badge-danger" style={{ padding: "8px 12px" }}>
              {erro}
            </div>
          )}
          {ok && (
            <div className="badge badge-ok" style={{ padding: "8px 12px" }}>
              {ok}
            </div>
          )}

          <button className="btn" disabled={loading}>
            {loading ? "..." : signup ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <button
          className="btn btn-ghost small"
          onClick={() => {
            setSignup(!signup);
            setErro(null);
          }}
        >
          {signup ? "Já tenho conta — entrar" : "Não tenho conta — criar"}
        </button>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
