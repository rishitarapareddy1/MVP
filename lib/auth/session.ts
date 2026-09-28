import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, hasStudentRow } from "@/lib/db/users";
import { isAdminEmail, isAllowedStudentEmail } from "./roles";
import type { Profile } from "@/lib/db/types";

/**
 * The current user, verified with Supabase Auth. getUser() checks the token
 * with the auth server instead of trusting the cookie, so it's safe for
 * authorization. cache() dedupes the call within one request, so a layout
 * and page can both call it cheaply.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Call at the top of every admin layout AND page. Layouts don't re-run on
 * client-side navigation, so a layout-only check isn't enough.
 * Admin requires both profiles.role = 'admin' and the email being in ADMIN_EMAILS.
 */
export const requireAdmin = cache(async (): Promise<Profile> => {
  const user = await getCurrentUser();
  if (!user?.email) redirect("/login");

  const profile = await getProfile(user.id);
  if (profile?.role === "admin" && isAdminEmail(user.email)) return profile;

  redirect(profile?.role === "student" ? "/student" : "/login");
});

/** Call at the top of every student layout AND page. */
export const requireStudent = cache(async (): Promise<Profile> => {
  const user = await getCurrentUser();
  if (!user?.email) redirect("/login");

  const profile = await getProfile(user.id);
  if (profile?.role === "admin") redirect("/admin");

  if (
    profile?.role === "student" &&
    isAllowedStudentEmail(user.email) &&
    (await hasStudentRow(user.id))
  ) {
    return profile;
  }

  redirect("/login?error=domain");
});
