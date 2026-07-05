import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Termos de Uso — RaqueteClub" };

export default function TermosPage() {
  return (
    <main className="container" style={{ maxWidth: 820, paddingBottom: 60 }}>
      <nav className="nav" style={{ margin: "0 -20px 24px", padding: "0 20px" }}>
        <div className="spread" style={{ height: 62 }}>
          <Logo size={26} />
          <Link href="/" className="muted small">
            Voltar
          </Link>
        </div>
      </nav>

      <h1>Termos de Uso — RaqueteClub</h1>
      <p className="muted small">
        Administradora: <strong>JM Soluções LTDA</strong>, CNPJ 36.845.130/0001-72
        (marca “RaqueteClub”). Última atualização: 2026.
      </p>

      <div className="card stack" style={{ lineHeight: 1.7, marginTop: 16 }}>
        <p className="small">
          <strong>Aviso:</strong> este documento é um modelo inicial e deve ser
          revisado por um advogado antes do uso comercial.
        </p>

        <h3>1. Objeto</h3>
        <p className="small">
          O RaqueteClub é um clube de compra programada em grupo de raquetes de
          padel. O associado adere a um grupo, paga uma mensalidade e é
          contemplado com o bem por critério objetivo de pontuação (antiguidade e
          adimplência). NÃO se trata de consórcio regulado pelo Banco Central, de
          título de capitalização ou de sorteio/loteria.
        </p>

        <h3>2. Adesão e aprovação</h3>
        <p className="small">
          A adesão está sujeita a análise e à aprovação da Administradora. O
          cadastro só é efetivado após aprovação e aceite eletrônico do contrato de
          adesão e da nota promissória, com registro de data e IP.
        </p>

        <h3>3. Pagamento</h3>
        <p className="small">
          O pagamento é realizado exclusivamente por cartão de crédito, na
          modalidade recorrente (mensalidade) ou parcelada, processado pelo
          provedor de pagamentos (Asaas). A cobrança inicia somente após a
          aprovação do cadastro.
        </p>

        <h3>4. Contemplação e entrega</h3>
        <p className="small">
          A cada período, os associados adimplentes de maior pontuação são
          contemplados, até que todos os adimplentes recebam o bem ao término do
          grupo. A entrega ocorre após a contemplação, conforme disponibilidade.
        </p>

        <h3>5. Inadimplência</h3>
        <p className="small">
          O atraso sujeita o associado a multa de até 2% e juros de até 1% ao mês,
          suspensão da elegibilidade à contemplação e, após notificação prévia, à
          negativação junto aos órgãos de proteção ao crédito e ao protesto do
          título, garantido pela nota promissória.
        </p>

        <h3>6. Cancelamento</h3>
        <p className="small">
          As condições de cancelamento e eventual devolução seguem o previsto no
          contrato de adesão e na legislação aplicável (CDC).
        </p>

        <h3>7. Foro</h3>
        <p className="small">
          Fica eleito o foro do domicílio do consumidor para dirimir controvérsias.
        </p>

        <p className="small muted">
          Dúvidas: jonas_1706@hotmail.com · Veja também a{" "}
          <Link href="/privacidade" style={{ color: "var(--primary)" }}>
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
