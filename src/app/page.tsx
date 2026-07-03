import Link from "next/link";
import { PLANOS } from "@/lib/planos";

export default function Home() {
  return (
    <main>
      <nav className="nav">
        <div className="container spread" style={{ height: 60 }}>
          <div className="brand">
            Padel<span> Clube</span>
          </div>
          <div className="row">
            <Link href="/login" className="muted small">
              Entrar
            </Link>
            <Link href="/login?signup=1" className="btn">
              Quero minha raquete
            </Link>
          </div>
        </div>
      </nav>

      <section className="container" style={{ paddingTop: 72, paddingBottom: 48 }}>
        <div style={{ maxWidth: 720 }}>
          <span className="badge badge-ok">🎾 Clube de contemplação</span>
          <h1 style={{ fontSize: 46, lineHeight: 1.05, margin: "18px 0 12px" }}>
            Sua raquete de padel dos sonhos,{" "}
            <span style={{ color: "var(--primary)" }}>parcelada em grupo</span>.
          </h1>
          <p className="muted" style={{ fontSize: 18, lineHeight: 1.6 }}>
            Entre num grupo pequeno, pague uma mensalidade que cabe no bolso e
            seja contemplado com sua raquete. Sem juros abusivos — você paga o
            preço de mercado, no seu ritmo, com contemplação por adimplência.
          </p>
          <div className="row" style={{ marginTop: 26 }}>
            <Link href="/login?signup=1" className="btn">
              Entrar num grupo
            </Link>
            <Link href="/login" className="btn btn-ghost">
              Já sou membro
            </Link>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 56 }}>
          <div className="card">
            <div className="kpi" style={{ color: "var(--primary)" }}>
              R$110<span style={{ fontSize: 16 }}>/mês</span>
            </div>
            <div className="kpi-label">Mensalidade acessível em 24x</div>
          </div>
          <div className="card">
            <div className="kpi">100%</div>
            <div className="kpi-label">
              Todos os membros adimplentes recebem sua raquete
            </div>
          </div>
          <div className="card">
            <div className="kpi">Grupos pequenos</div>
            <div className="kpi-label">
              Contemplação mensal por ordem + adimplência
            </div>
          </div>
        </div>

        <div style={{ marginTop: 48 }}>
          <h2 style={{ marginBottom: 6 }}>Escolha seu plano</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Mesma raquete, ritmos diferentes. Todos os membros adimplentes são
            contemplados até o fim do grupo.
          </p>
          <div className="grid grid-3">
            {PLANOS.map((p) => (
              <div key={p.id} className="card stack">
                <div className="spread">
                  <strong style={{ fontSize: 18 }}>{p.nome}</strong>
                  {p.id === "12x" && (
                    <span className="badge badge-ok">mais rápido</span>
                  )}
                </div>
                <div className="kpi" style={{ color: "var(--primary)" }}>
                  R${p.valor_mensal}
                  <span style={{ fontSize: 16 }}>/mês</span>
                </div>
                <p className="muted small" style={{ margin: 0 }}>{p.descricao}</p>
                <div className="grid grid-2 small">
                  <div>
                    <div className="kpi-label">Duração</div>
                    <strong>{p.duracao_meses} meses</strong>
                  </div>
                  <div>
                    <div className="kpi-label">Vagas por grupo</div>
                    <strong>{p.total_cotas} cotas</strong>
                  </div>
                </div>
                <Link href="/login?signup=1" className="btn">
                  Quero o {p.nome.toLowerCase()}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 40 }}>
          <h3 style={{ marginTop: 0 }}>Como funciona</h3>
          <div className="grid grid-3">
            <div>
              <strong>1. Escolha o grupo</strong>
              <p className="muted small">
                Grupos de poucos membros com uma raquete-alvo definida.
              </p>
            </div>
            <div>
              <strong>2. Pague sua mensalidade</strong>
              <p className="muted small">
                Débito automático no cartão. Quem paga em dia sobe na fila.
              </p>
            </div>
            <div>
              <strong>3. Seja contemplado</strong>
              <p className="muted small">
                Todo mês um membro é contemplado e recebe a raquete.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
