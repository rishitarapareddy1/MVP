import "server-only";
import { createClient } from "@/lib/supabase/server";
import { normalizeStudentProject, STUDENT_PROJECT_COLUMNS } from "./offers";

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

/** A project assigned to this student (student-safe columns only). */
export async function getOwnProject(projectId: string, studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_projects")
    .select(STUDENT_PROJECT_COLUMNS)
    .eq("id", projectId)
    .eq("assigned_student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeStudentProject(data) : null;
}

export async function listOwnDeliverables(projectId: string, studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select("id, file_path, url, note, submitted_at")
    .eq("project_id", projectId)
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type StartResult = "started" | "wrong_status" | "not_found";

export async function startProject(projectId: string): Promise<StartResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_project", { p_project_id: projectId });
  if (error) throw error;
  return data as StartResult;
}

export type DeliverResult =
  "delivered" | "wrong_status" | "missing" | "bad_path" | "bad_url" | "not_found";

/** Saves the deliverable and moves the project to 'delivered' atomically. */
export async function submitDeliverable(
  projectId: string,
  work: { file_path: string | null; url: string | null; note: string | null },
): Promise<DeliverResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_deliverable", {
    p_project_id: projectId,
    // The generated types mark these non-null, but the function accepts null.
    p_file_path: work.file_path as string,
    p_url: work.url as string,
    p_note: work.note as string,
  });
  if (error) throw error;
  return data as DeliverResult;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function listProjectDeliverables(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select("id, file_path, url, note, submitted_at")
    .eq("project_id", projectId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data;
}
