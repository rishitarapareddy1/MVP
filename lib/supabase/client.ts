import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

/**
 * Supabase client for Client Components. Uses the anon key, so every query
 * is subject to Row Level Security as the logged-in user.
 */
export function createClient() {
  const env = getPublicEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
