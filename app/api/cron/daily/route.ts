import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/errors/report";

/**
 * Daily job, triggered by Vercel Cron (see vercel.json).
 *
 * 1. Keeps Supabase awake: the free plan pauses a project after 7 days with
 *    no activity, which takes the whole site down. One query a day is enough.
 * 2. Expires overdue offers even if nobody loads a page (projects whose
 *    offers all lapse go back to Matching).
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`; anything else is refused.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  // Constant-time comparison so the secret can't be guessed from timing.
  const authorized =
    !!secret &&
    header.length === expected.length &&
    timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const { error: pingError } = await supabase
      .from("assessments")
      .select("id", { count: "exact", head: true });
    if (pingError) throw pingError;

    const { data: expired, error: expireError } = await supabase.rpc("expire_stale_offers");
    if (expireError) throw expireError;

    return NextResponse.json({ ok: true, expiredOffers: expired });
  } catch (error) {
    await reportError("daily cron", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
