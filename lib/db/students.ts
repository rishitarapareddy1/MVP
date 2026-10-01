import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfileInput } from "@/lib/validation/student";

/** The logged-in student's own row plus their name (both read under RLS). */
export async function getOwnStudent(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*, profile:profiles(full_name, email)")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export type OwnStudent = Awaited<ReturnType<typeof getOwnStudent>>;

export async function updateOwnStudentProfile(userId: string, input: StudentProfileInput) {
  const supabase = await createClient();
  const { full_name, ...studentFields } = input;

  // Two tables: name lives on profiles, everything else on students.
  // RLS + the column-protection triggers keep students to their own,
  // non-privileged fields.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name })
    .eq("id", userId);
  if (profileError) throw profileError;

  const { error } = await supabase.from("students").update(studentFields).eq("id", userId);
  if (error) throw error;
}

export async function setResumePath(userId: string, path: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("students").update({ resume_path: path }).eq("id", userId);
  if (error) throw error;
}
