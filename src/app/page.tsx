import Link from "next/link";
import { PLANOS } from "@/lib/planos";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main>
      <nav className="nav">
        <div className="container spread" style={{ height: 62 }}>
          <Logo size={28} />
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

      {/* HERO com faixa de marca */}
      <div
        style={{
          background:
            "linear-gradient(160deg, #0a2540 0%, #0f3d7a 55%, #1570e6 120%)",
          color: "#eaf1fb",
        }}
      >
        <section
          className="container"
          style={{ paddingTop: 72, paddingBottom: 64 }}
        >
          <div style={{ maxWidth: 720 }}>
            <span
              className="badge"
              style={{
                background: "rgba(255,255,255,.12)",
                color: "#dbe8fb",
                border: "1px solid rgba(255,255,255,.25)",
              }}
            >
              🎾 RaqueteClub · clube de compra em grupo
            </span>
            <h1
              style={{
                fontSize: 48,
                lineHeight: 1.05,
                margin: "18px 0 12px",
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              Sua raquete de padel top,{" "}
              <span style={{ color: "#16c07a" }}>sem pesar no bolso</span>.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#c3d4ec" }}>
              Entre num grupo, pague uma mensalidade acessível e seja
              contemplado com a sua raquete. Sem juros de financiamento — você
              paga o preço de mercado, no seu ritmo, por contemplação.
            </p>
            <div className="row" style={{ marginTop: 26 }}>
              <Link
                href="/login?signup=1"
                className="btn"
                style={{ background: "#16c07a" }}
              >
                Entrar num grupo
              </Link>
              <Link
                href="/login"
                className="btn btn-ghost"
                style={{
                  background: "transparent",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.4)",
                }}
              >
                Já sou membro
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 48 }}>
        <div style={{ display: "none" }} />

        <div className="grid grid-3" style={{ marginTop: 56 }}>
          <div className="card">
            <div className="kpi">12x · 18x · 24x</div>
            <div className="kpi-label">Escolha o ritmo que cabe no seu bolso</div>
          </div>
          <div className="card">
            <div className="kpi">100%</div>
            <div className="kpi-label">
              Todos os membros adimplentes recebem sua raquete
            </div>
          </div>
          <div className="card">
            <div className="kpi">Sem juros</div>
            <div className="kpi-label">
              Você paga o preço de mercado, sem juros de financiamento
            </div>
          </div>
        </div>

        <div style={{ marginTop: 48 }}>
          <h2 style={{ marginBottom: 6 }}>Escolha seu ritmo: 12x, 18x ou 24x</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            A mensalidade é montada conforme a raquete de cada grupo — quanto
            mais parcelas, menor a mensalidade. Todos os membros adimplentes são
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
                  {p.duracao_meses}x
                </div>
                <p className="muted small" style={{ margin: 0 }}>{p.descricao}</p>
                <div className="small">
                  <div className="kpi-label">Contemplação</div>
                  <strong>
                    {p.contemplados_por_mes} por mês · até {p.duracao_meses} meses
                  </strong>
                </div>
                <Link href="/login?signup=1" className="btn">
                  Quero {p.duracao_meses}x
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

      <footer
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--bg-soft)",
        }}
      >
        <div
          className="container spread small"
          style={{ padding: "20px", flexWrap: "wrap", gap: 8 }}
        >
          <span className="muted">
            RaqueteClub · JM Soluções LTDA · CNPJ 36.845.130/0001-72
          </span>
          <span className="row" style={{ gap: 16 }}>
            <Link href="/termos" className="muted">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="muted">
              Política de Privacidade
            </Link>
          </span>
        </div>
      </footer>
    </main>
  );
}
