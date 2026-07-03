import { createAdminClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { montarContrato, ContratoSnapshot } from "@/lib/contrato";
import { dataBR } from "@/lib/format";
import { AceiteBox } from "./AceiteBox";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ContratoPage({
  params,
}: {
  params: { cotaId: string };
}) {
  const profile = await requireProfile();
  const db = createAdminClient();

  const { data: cota } = await db
    .from("cotas")
    .select("id, participante_id, aceite_em, aceite_ip, contrato_snapshot")
    .eq("id", params.cotaId)
    .single();

  if (!cota || !cota.contrato_snapshot) notFound();
  const isOwner = cota.participante_id === profile.id;
  const isAdmin = profile.role === "admin";
  if (!isOwner && !isAdmin) notFound();

  const c = montarContrato(cota.contrato_snapshot as ContratoSnapshot);
  const aceito = !!cota.aceite_em;

  return (
    <div className="stack" style={{ maxWidth: 780, margin: "0 auto" }}>
      <div className="spread">
        <h1 style={{ margin: 0 }}>Contrato de adesão</h1>
        <Link href={`/api/contrato/${cota.id}`} target="_blank" className="btn btn-ghost small">
          📄 Baixar PDF
        </Link>
      </div>

      {aceito ? (
        <div className="badge badge-ok" style={{ padding: "10px 14px", alignSelf: "flex-start" }}>
          ✓ Aceito em {dataBR(cota.aceite_em)} · IP {cota.aceite_ip}
        </div>
      ) : (
        <div className="badge badge-warn" style={{ padding: "10px 14px", alignSelf: "flex-start" }}>
          ⚠ Aguardando seu aceite online
        </div>
      )}

      <article className="card stack" style={{ lineHeight: 1.6 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>{c.tituloDoc}</h2>
          <p className="muted small" style={{ margin: 0 }}>{c.subtitulo}</p>
        </div>

        {c.secoes.map((sec, i) => (
          <section key={i}>
            {sec.titulo && (
              <h3 style={{ margin: "0 0 6px", fontSize: 14 }}>{sec.titulo}</h3>
            )}
            {sec.paragrafos.map((p, j) => (
              <p key={j} className="small" style={{ margin: "0 0 6px" }}>
                {p}
              </p>
            ))}
          </section>
        ))}

        <hr style={{ border: 0, borderTop: "1px solid var(--border)", width: "100%" }} />

        <section>
          <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>{c.promissoria.titulo}</h3>
          <p className="small muted" style={{ margin: "0 0 6px" }}>{c.promissoria.numero}</p>
          <p style={{ margin: "0 0 8px", fontWeight: 700 }}>{c.promissoria.valorLinha}</p>
          <p className="small" style={{ margin: "0 0 6px" }}>{c.promissoria.corpo}</p>
          <p className="small" style={{ margin: 0 }}>{c.promissoria.emitente}</p>
          <p className="small muted" style={{ margin: 0 }}>{c.promissoria.emissao}</p>
        </section>
      </article>

      {isOwner && !aceito && <AceiteBox cotaId={cota.id} nome={c.assinaturas[0]} />}

      {aceito && (
        <Link href="/app/minhas-cotas" className="btn" style={{ alignSelf: "flex-start" }}>
          Ir para minhas cotas
        </Link>
      )}
    </div>
  );
}
