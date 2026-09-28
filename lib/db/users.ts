import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "./types";

/** The logged-in user's own profile (read under RLS). */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, email, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

/** True if this user has a `students` row (i.e. passed the domain check at login). */
export async function hasStudentRow(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

// The two functions below use the service role because users can't change
// their own role or create their own students row (see the RLS migration).
// Only call them from the auth callback, after the email has been checked.

export async function promoteToAdmin(userId: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);
  if (error) throw error;
}

export async function ensureStudentRow(userId: string): Promise<void> {
  // ignoreDuplicates: a returning student keeps their existing row untouched.
  const { error } = await createAdminClient()
    .from("students")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}
