import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { gerarContratoPDF, ContratoSnapshot } from "@/lib/contrato";

/**
 * Gera o PDF (contrato de adesão + nota promissória) da cota.
 * Acesso: dono da cota ou admin.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { cotaId: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const db = createAdminClient();

  const { data: cota } = await db
    .from("cotas")
    .select("id, participante_id, contrato_snapshot")
    .eq("id", params.cotaId)
    .single();
  if (!cota) return NextResponse.json({ error: "cota não encontrada" }, { status: 404 });

  // autorização: dono ou admin
  const { data: me } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isOwner = cota.participante_id === user.id;
  const isAdmin = me?.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  }

  if (!cota.contrato_snapshot) {
    return NextResponse.json(
      { error: "contrato ainda não disponível para esta cota" },
      { status: 409 },
    );
  }

  const pdf = await gerarContratoPDF(cota.contrato_snapshot as ContratoSnapshot);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="contrato-cota-${params.cotaId}.pdf"`,
    },
  });
}
