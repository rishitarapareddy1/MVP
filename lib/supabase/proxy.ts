import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

/**
 * Runs on every matched request (see /proxy.ts). Its main job is keeping the
 * Supabase session fresh: getUser() refreshes an expired access token and
 * setAll writes the new cookies onto both the request (for this render) and
 * the response (for the browser). Server Components can't write cookies, so
 * without this, sessions would silently expire.
 *
 * It also does a cheap "are you logged in at all?" redirect for protected
 * areas. The real role checks happen in requireAdmin/requireStudent.
 */
export async function updateSession(request: NextRequest) {
  const env = getPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Don't put code between createServerClient and getUser(): it must run
  // first so the refreshed session is what the rest of the request sees.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/student") || path.startsWith("/admin");
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
