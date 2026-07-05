import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";

/**
 * Snapshot dos valores congelados na adesão — base legal do contrato.
 * Guardado em cotas.contrato_snapshot (jsonb) para o conteúdo ser reproduzível.
 * `aceite_em`/`aceite_ip` ficam vazios até o ACEITE ONLINE no portal.
 */
export interface ContratoSnapshot {
  nome: string;
  cpf: string;
  grupo_nome: string;
  bem_descricao: string;
  cota_numero: number;
  valor_mensal: number;
  duracao_meses: number;
  valor_total: number;
  bem_valor: number;
  promissoria_valor: number;
  multa_percent: number;
  juros_am_percent: number;
  aceite_em: string; // ISO ou "" enquanto pendente
  aceite_ip: string; // "" enquanto pendente
  admin_nome?: string;
  admin_doc?: string;
}

export interface SecaoContrato {
  titulo?: string;
  paragrafos: string[];
}
export interface ConteudoContrato {
  tituloDoc: string;
  subtitulo: string;
  secoes: SecaoContrato[];
  assinaturas: string[];
  promissoria: {
    titulo: string;
    numero: string;
    valorLinha: string;
    corpo: string;
    emitente: string;
    praca: string;
    emissao: string;
  };
  aceito: boolean;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataExtenso = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "____/____/______";

/**
 * Monta o conteúdo do contrato + promissória (dados estruturados) —
 * usado tanto pelo PDF quanto pela renderização HTML no portal.
 */
export function montarContrato(s: ContratoSnapshot): ConteudoContrato {
  const admin = s.admin_nome || "RAQUETECLUB ADMINISTRAÇÃO DE GRUPOS";
  const aceito = !!s.aceite_em;

  const aceiteTexto = aceito
    ? `Este contrato foi aceito eletronicamente por ${s.nome} em ${dataExtenso(s.aceite_em)}, a partir do IP ${s.aceite_ip}, com plena validade jurídica nos termos do art. 10, §2º, da MP 2.200-2/2001.`
    : `Ao clicar em "Li e aceito" no portal, ${s.nome} manifestará aceite eletrônico, com registro de data e IP, com plena validade jurídica nos termos do art. 10, §2º, da MP 2.200-2/2001.`;

  return {
    tituloDoc: "CONTRATO DE ADESÃO A GRUPO DE COMPRA PROGRAMADA",
    subtitulo:
      "Clube de contemplação de raquetes de padel — compra programada em grupo, com contemplação por ordem de pontuação e adimplência.",
    secoes: [
      {
        titulo: "PARTES",
        paragrafos: [
          `ADMINISTRADORA: ${admin}${s.admin_doc ? `, inscrita no CNPJ ${s.admin_doc}` : ""}, doravante denominada ADMINISTRADORA.`,
          `ADERENTE: ${s.nome}, inscrito(a) no CPF ${s.cpf}, doravante denominado(a) ADERENTE, titular da cota nº ${s.cota_numero} do grupo "${s.grupo_nome}".`,
        ],
      },
      {
        titulo: "CLÁUSULA 1 — OBJETO",
        paragrafos: [
          `1.1. Adesão do ADERENTE a grupo de compra programada visando à aquisição de ${s.bem_descricao || "01 (uma) raquete de padel"}, com valor de mercado de referência de ${brl(s.bem_valor)}.`,
          "1.2. A contemplação (entrega do bem) ocorre por critério objetivo de pontuação (antiguidade e adimplência), NÃO por sorteio, até que todos os aderentes adimplentes sejam contemplados ao término do grupo.",
        ],
      },
      {
        titulo: "CLÁUSULA 2 — VALORES E PRAZO",
        paragrafos: [
          `2.1. Mensalidade: ${brl(s.valor_mensal)}.`,
          `2.2. Prazo: ${s.duracao_meses} parcelas mensais e sucessivas.`,
          `2.3. Valor total do contrato: ${brl(s.valor_total)}.`,
          "2.4. O ADERENTE permanece obrigado ao pagamento das parcelas até o encerramento do grupo, inclusive após ser contemplado.",
        ],
      },
      {
        titulo: "CLÁUSULA 3 — CONTEMPLAÇÃO E ELEGIBILIDADE",
        paragrafos: [
          "3.1. Somente aderentes adimplentes e que tenham quitado o número mínimo de parcelas definido para o grupo participam da fila de contemplação.",
          "3.2. O atraso no pagamento suspende a elegibilidade e reduz a pontuação do ADERENTE na fila.",
        ],
      },
      {
        titulo: "CLÁUSULA 4 — INADIMPLÊNCIA",
        paragrafos: [
          `4.1. O atraso sujeita o ADERENTE a multa de ${s.multa_percent}% e juros de ${s.juros_am_percent}% ao mês sobre o valor em atraso, nos limites da legislação.`,
          "4.2. Persistindo o inadimplemento, a ADMINISTRADORA poderá, após notificação prévia, promover a negativação junto aos órgãos de proteção ao crédito e o protesto do título, bem como a cobrança judicial.",
          "4.3. Em caso de inadimplemento após a contemplação, o saldo devedor total torna-se imediatamente exigível, garantido pela NOTA PROMISSÓRIA vinculada a este contrato.",
        ],
      },
      { titulo: "CLÁUSULA 5 — ACEITE ELETRÔNICO", paragrafos: [`5.1. ${aceiteTexto}`] },
    ],
    assinaturas: [`ADERENTE — ${s.nome}`, `ADMINISTRADORA — ${admin}`],
    promissoria: {
      titulo: "NOTA PROMISSÓRIA",
      numero: `Nº ${s.cota_numero}/${s.grupo_nome}`,
      valorLinha: `Valor: ${brl(s.promissoria_valor)}`,
      corpo: `Aos seus vencimentos, pagarei(emos) por esta NOTA PROMISSÓRIA à ${admin} ou à sua ordem, a quantia de ${brl(s.promissoria_valor)}, em moeda corrente nacional, correspondente ao saldo garantido do contrato de adesão da cota nº ${s.cota_numero} do grupo "${s.grupo_nome}".`,
      emitente: `EMITENTE: ${s.nome} — CPF ${s.cpf}`,
      praca: "Praça de pagamento: domicílio da ADMINISTRADORA.",
      emissao: aceito
        ? `Emitida eletronicamente em ${dataExtenso(s.aceite_em)} (IP ${s.aceite_ip}).`
        : "Emissão condicionada ao aceite eletrônico no portal.",
    },
    aceito,
  };
}

// ---------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------
function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph === "") {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(" ")) {
      const tent = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(tent, size) > maxW && line) {
        out.push(line);
        line = word;
      } else line = tent;
    }
    if (line) out.push(line);
  }
  return out;
}

export async function gerarContratoPDF(s: ContratoSnapshot): Promise<Uint8Array> {
  const c = montarContrato(s);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const A4 = { w: 595.28, h: 841.89 };
  const margin = 56;
  const maxW = A4.w - margin * 2;
  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - margin;

  const novaPagina = () => {
    page = doc.addPage([A4.w, A4.h]);
    y = A4.h - margin;
  };
  const escreve = (
    text: string,
    { size = 10, f = font, gap = 4 } = {},
  ) => {
    for (const ln of wrap(text, f, size, maxW)) {
      if (y < margin + 40) novaPagina();
      page.drawText(ln, { x: margin, y, size, font: f, color: rgb(0.12, 0.12, 0.14) });
      y -= size + gap;
    }
  };
  const espaco = (v = 8) => (y -= v);

  if (!c.aceito) {
    escreve("*** MINUTA — AGUARDANDO ACEITE ELETRÔNICO NO PORTAL ***", {
      size: 10,
      f: bold,
      gap: 8,
    });
  }
  escreve(c.tituloDoc, { size: 14, f: bold, gap: 8 });
  escreve(c.subtitulo, { size: 9 });
  espaco();

  for (const sec of c.secoes) {
    if (sec.titulo) {
      espaco(6);
      escreve(sec.titulo, { size: 12, f: bold, gap: 6 });
    }
    for (const p of sec.paragrafos) escreve(p);
    espaco();
  }

  espaco(18);
  for (const a of c.assinaturas) {
    escreve("_______________________________________\n" + a, { size: 9 });
    espaco(6);
  }

  // promissória
  novaPagina();
  escreve(c.promissoria.titulo, { size: 16, f: bold, gap: 10 });
  escreve(c.promissoria.numero, { size: 10, f: bold });
  espaco(10);
  escreve(c.promissoria.valorLinha, { size: 12, f: bold });
  espaco(10);
  escreve(c.promissoria.corpo);
  espaco(8);
  escreve(c.promissoria.emitente, { size: 10, f: bold });
  escreve(c.promissoria.praca);
  escreve(c.promissoria.emissao);
  espaco(24);
  escreve("_______________________________________\nAssinatura do EMITENTE", {
    size: 9,
  });

  return doc.save();
}
