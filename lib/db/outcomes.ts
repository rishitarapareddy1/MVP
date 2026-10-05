import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OutcomeInput } from "@/lib/validation/outcome";

// Admin-only (RLS).

export async function listStudentOutcomes(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outcomes")
    .select("id, type, notes, occurred_at, project:projects(id, title), business:businesses(name)")
    .eq("student_id", studentId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Records an outcome. If it's tied to a project, the business comes from that
 * project, and the project must be one this student worked on.
 * Returns false if the project doesn't belong to the student.
 */
export async function createOutcome(studentId: string, input: OutcomeInput): Promise<boolean> {
  const supabase = await createClient();

  let businessId: string | null = null;
  if (input.project_id) {
    const { data: project, error } = await supabase
      .from("projects")
      .select("business_id")
      .eq("id", input.project_id)
      .eq("assigned_student_id", studentId)
      .maybeSingle();
    if (error) throw error;
    if (!project) return false;
    businessId = project.business_id;
  }

  const { error } = await supabase
    .from("outcomes")
    .insert({ student_id: studentId, business_id: businessId, ...input });
  if (error) throw error;
  return true;
}
