import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { processarReguaCobranca } from "@/lib/cobranca";

/**
 * Job diário de cobrança (Vercel Cron).
 * Protegido por CRON_SECRET (header Authorization: Bearer <secret>).
 * Recalcula atrasos, dispara régua e escala negativação aos 30 dias.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const resumo = await processarReguaCobranca(db);
  return NextResponse.json({ ok: true, ...resumo });
}
