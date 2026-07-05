/**
 * Envio de e-mails transacionais via Resend — PLUGGABLE.
 * Sem RESEND_API_KEY, apenas registra no log (não quebra o fluxo).
 * Config: RESEND_API_KEY, EMAIL_FROM (ex.: "RaqueteClub <no-reply@raqueteclub.com.br>").
 * Obs.: em produção, verifique o domínio remetente no Resend.
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "RaqueteClub <onboarding@resend.dev>";

export async function enviarEmail(to: string, subject: string, html: string) {
  if (!to) return;
  if (!RESEND_API_KEY) {
    console.log(`[email] (sem RESEND_API_KEY, não enviado) → ${to}: ${subject}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) console.error("[email] Resend:", res.status, await res.text());
  } catch (e) {
    console.error("[email] falha:", e);
  }
}

function layout(titulo: string, corpo: string) {
  return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;color:#142338">
    <div style="background:#0a2540;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <strong style="font-size:18px">Raquete<span style="color:#16c07a">Club</span></strong>
    </div>
    <div style="border:1px solid #dce4ee;border-top:0;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="margin:0 0 12px;font-size:18px">${titulo}</h2>
      <div style="font-size:15px;line-height:1.6;color:#3b4a60">${corpo}</div>
      <p style="font-size:12px;color:#8896a8;margin-top:24px">
        RaqueteClub · JM Soluções LTDA — clube de compra em grupo de raquetes de padel.
      </p>
    </div>
  </div>`;
}

export const emailBoasVindas = (to: string, nome: string) =>
  enviarEmail(
    to,
    "Recebemos seu cadastro no RaqueteClub 🎾",
    layout(
      `Olá, ${nome}!`,
      `Recebemos seu cadastro. Agora ele passa por <strong>análise e aprovação</strong> — assim que for aprovado, você recebe um aviso e a cobrança no cartão começa. Fique de olho no e-mail!`,
    ),
  );

export const emailAprovado = (to: string, nome: string, grupo: string) =>
  enviarEmail(
    to,
    "Seu cadastro foi aprovado ✅",
    layout(
      `Boas notícias, ${nome}!`,
      `Seu cadastro no grupo <strong>${grupo}</strong> foi <strong>aprovado</strong>. Sua participação está ativa e a cobrança da mensalidade no cartão foi iniciada. Pague em dia para subir na fila de contemplação. 🎾`,
    ),
  );

export const emailContemplado = (to: string, nome: string, grupo: string) =>
  enviarEmail(
    to,
    "Você foi contemplado! 🎾🏆",
    layout(
      `Parabéns, ${nome}!`,
      `Você foi <strong>contemplado</strong> no grupo <strong>${grupo}</strong>! Em breve entraremos em contato para combinar a entrega da sua raquete. Continue com as mensalidades em dia até o fim do grupo.`,
    ),
  );
