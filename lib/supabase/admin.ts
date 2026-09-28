import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

/**
 * Service-role client that BYPASSES Row Level Security.
 *
 * Only use it where there is no logged-in user but a trusted server write is
 * needed: the public intake form and the business feedback form. The
 * `server-only` import makes the build fail if this file is ever pulled into
 * client code, so the service role key can't leak to the browser.
 */
export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    // No user session here: don't persist or refresh auth tokens.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
