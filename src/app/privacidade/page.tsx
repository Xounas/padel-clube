import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Política de Privacidade — RaqueteClub" };

export default function PrivacidadePage() {
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

      <h1>Política de Privacidade — RaqueteClub</h1>
      <p className="muted small">
        Controladora: <strong>JM Soluções LTDA</strong>, CNPJ 36.845.130/0001-72.
        Encarregado/contato: jonas_1706@hotmail.com. Conforme a LGPD (Lei
        13.709/2018). Última atualização: 2026.
      </p>

      <div className="card stack" style={{ lineHeight: 1.7, marginTop: 16 }}>
        <p className="small">
          <strong>Aviso:</strong> modelo inicial; revise com um advogado/DPO antes
          do uso comercial.
        </p>

        <h3>1. Dados que coletamos</h3>
        <p className="small">
          Cadastro: nome, e-mail, telefone, CPF e endereço. Pagamento: os dados do
          cartão são enviados diretamente ao provedor (Asaas) e tokenizados —{" "}
          <strong>não armazenamos o número do cartão</strong>, apenas os 4 últimos
          dígitos e a bandeira. Também registramos dados de adesão (data, IP do
          aceite) e informações de análise de crédito.
        </p>

        <h3>2. Para que usamos</h3>
        <p className="small">
          Executar o contrato (adesão, cobrança, contemplação e entrega), fazer
          análise de crédito e prevenção à inadimplência, cumprir obrigações legais
          e nos comunicar com você.
        </p>

        <h3>3. Com quem compartilhamos</h3>
        <p className="small">
          Provedor de pagamentos (Asaas), provedor de hospedagem/banco de dados
          (Supabase/Vercel) e, em caso de inadimplência, órgãos de proteção ao
          crédito e cartórios de protesto. Não vendemos seus dados.
        </p>

        <h3>4. Seus direitos (LGPD)</h3>
        <p className="small">
          Você pode solicitar acesso, correção, portabilidade, informação sobre
          compartilhamentos e, quando cabível, a eliminação dos seus dados, pelo
          e-mail de contato. Dados necessários ao cumprimento de obrigações legais
          e contratuais podem ser retidos pelo prazo exigido em lei.
        </p>

        <h3>5. Segurança</h3>
        <p className="small">
          Adotamos medidas técnicas e organizacionais para proteger seus dados
          (criptografia em trânsito, tokenização de cartão, controle de acesso).
        </p>

        <p className="small muted">
          Veja também os{" "}
          <Link href="/termos" style={{ color: "var(--primary)" }}>
            Termos de Uso
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
