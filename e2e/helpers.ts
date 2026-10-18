import type { BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

/**
 * Logs a browser context in as `email` without sending any email: the
 * service role generates a one-time code, we verify it, and copy the
 * resulting session cookies into the browser.
 */
export async function loginAs(context: BrowserContext, baseURL: string, email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const jar = new Map<string, string>();
  const client = createServerClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) =>
        cookies.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const verified = await client.auth.verifyOtp({
    email,
    token: data.properties.email_otp,
    type: "email",
  });
  if (verified.error) throw verified.error;

  const { hostname, protocol } = new URL(baseURL);
  await context.addCookies(
    [...jar].map(([name, value]) => ({
      name,
      value,
      domain: hostname,
      path: "/",
      secure: protocol === "https:",
    })),
  );
}

/** The first student account that can actually log in (not seed @example.com data). */
export async function anyRealStudentEmail(): Promise<string | null> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data } = await admin
    .from("profiles")
    .select("email")
    .eq("role", "student")
    .not("email", "like", "%@example.com")
    .limit(1)
    .maybeSingle();
  return data?.email ?? null;
}

export const ADMIN_EMAIL = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim() ?? "";
