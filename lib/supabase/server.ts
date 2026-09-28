import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads the user's session from cookies, so queries run under RLS as that user.
 * Create a new one per request; never share it between requests.
 */
export async function createClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't set cookies. This is safe to ignore
          // because the session refresh in proxy.ts (Phase 1) will
          // write the refreshed cookies instead.
        }
      },
    },
  });
}
