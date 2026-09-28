import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finishLogin } from "@/lib/auth/finish-login";

/**
 * Handles login *links* (PKCE `code`). The main login flow now uses emailed
 * codes instead (see app/(auth)/login/actions.ts), because university email
 * scanners open links before the user does and use them up. This route stays
 * for link-based emails Supabase may still send, e.g. with a custom template.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const redirectTo = (path: string) => NextResponse.redirect(`${origin}${path}`);

  if (!code) return redirectTo("/login?error=link");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return redirectTo("/login?error=link");

  const destination = await finishLogin(data.user);
  if (destination) return redirectTo(destination);

  await supabase.auth.signOut();
  return redirectTo("/login?error=domain");
}
