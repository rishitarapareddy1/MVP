import "server-only";
import type { User } from "@supabase/supabase-js";
import { ensureStudentRow, promoteToAdmin } from "@/lib/db/users";
import { isAdminEmail, isAllowedStudentEmail } from "./roles";

/**
 * Runs right after a user proves they own their email (login code or link).
 * Decides their role and returns where to send them, or null if their email
 * isn't eligible (the caller must then sign them out).
 *   admin email    -> profiles.role = 'admin', go to /admin
 *   allowed domain -> make sure a students row exists, go to /student
 */
export async function finishLogin(user: User): Promise<"/admin" | "/student" | null> {
  const email = user.email;
  if (!email) return null;

  if (isAdminEmail(email)) {
    await promoteToAdmin(user.id);
    return "/admin";
  }
  if (isAllowedStudentEmail(email)) {
    await ensureStudentRow(user.id);
    return "/student";
  }
  return null;
}
