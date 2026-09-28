"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canLogIn } from "@/lib/auth/roles";
import { finishLogin } from "@/lib/auth/finish-login";
import { loginSchema, verifyCodeSchema } from "@/lib/validation/auth";
import { fail, ok, type ActionResult } from "@/lib/result";

/** Step 1: email the user a one-time login code. */
export async function sendLoginCode(
  _prev: ActionResult<{ email: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  const parsed = loginSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { email } = parsed.data;

  // Check the domain before Supabase creates an account or sends an email.
  if (!canLogIn(email)) {
    return fail("Please use your @illinois.edu email address.");
  }

  // The same email may also contain a link if the template has one; point it
  // at our callback. Server actions are POSTs from our own pages, so Origin
  // is our site URL.
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    console.error("signInWithOtp failed", error);
    return fail(
      error.status === 429
        ? "Too many login emails were requested. Please wait a minute and try again."
        : "We couldn't send a login code. Please try again.",
    );
  }
  return ok({ email });
}

/** Step 2: check the code. On success the session cookie is set and we redirect. */
export async function verifyLoginCode(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = verifyCodeSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const supabase = await createClient();
  // type 'email' covers both first-time signups and returning users.
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: "email",
  });
  if (error || !data.user) {
    return fail(
      "That code is incorrect or has expired. Check the latest email or request a new code.",
    );
  }

  const destination = await finishLogin(data.user);
  if (!destination) {
    await supabase.auth.signOut();
    return fail("Please use your @illinois.edu email address.");
  }
  // redirect() throws, so it must be outside any try/catch.
  redirect(destination);
}
