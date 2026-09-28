import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed middleware.ts to proxy.ts; same behavior.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets and images; everything else refreshes the session.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
