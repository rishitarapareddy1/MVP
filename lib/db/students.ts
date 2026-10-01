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

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/** Everything the admin student page shows, in parallel. */
export async function getStudentForAdmin(id: string) {
  const supabase = await createClient();
  const [student, submissions, offers, projects] = await Promise.all([
    supabase
      .from("students")
      .select("*, profile:profiles(full_name, email, created_at)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("assessment_submissions")
      .select(
        "id, status, total_score, created_at, graded_at, assessment:assessments(title, category)",
      )
      .eq("student_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("offers")
      .select("id, status, match_score, created_at, project:projects(id, title)")
      .eq("student_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, title, status, category, deadline")
      .eq("assigned_student_id", id)
      .order("created_at", { ascending: false }),
  ]);
  for (const r of [student, submissions, offers, projects]) if (r.error) throw r.error;
  if (!student.data) return null;

  return {
    ...student.data,
    submissions: submissions.data!,
    offers: offers.data!,
    projects: projects.data!,
  };
}

/** Admin can deactivate a student (e.g. missed deadlines); RLS allows only admins. */
export async function setStudentActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("students").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}
