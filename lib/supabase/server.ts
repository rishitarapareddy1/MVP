import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/db/database.types";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads the user's session from cookies, so queries run under RLS as that user.
 * Create a new one per request; never share it between requests.
 */
export async function createClient() {
  // Read cookies first: it marks the route as dynamic (per-request) before
  // anything else can fail during a build-time prerender.
  const cookieStore = await cookies();
  const env = getPublicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies. This is safe to ignore
            // because the session refresh in proxy.ts (Phase 1) will
            // write the refreshed cookies instead.
          }
        },
      },
    },
  );
}
