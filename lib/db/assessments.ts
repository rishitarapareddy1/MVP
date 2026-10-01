import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AssessmentInput } from "@/lib/validation/assessment";
import type { AssessmentStatus } from "./types";

// ---------------------------------------------------------------------------
// Student side. RLS limits students to active assessments and their own
// submissions, so these never return anyone else's data.
// ---------------------------------------------------------------------------

/** Active assessments, each with the current student's submissions. */
export async function listAssessmentsForStudent(studentId: string) {
  const supabase = await createClient();
  const [assessments, submissions] = await Promise.all([
    supabase
      .from("assessments")
      .select("id, title, category, time_limit_minutes, pass_threshold")
      .eq("is_active", true)
      .order("title"),
    supabase
      .from("assessment_submissions")
      .select("assessment_id, status, total_score, graded_at, created_at")
      .eq("student_id", studentId),
  ]);
  if (assessments.error) throw assessments.error;
  if (submissions.error) throw submissions.error;

  return assessments.data.map((a) => ({
    ...a,
    submissions: submissions.data.filter((s) => s.assessment_id === a.id),
  }));
}

export async function getAssessmentForStudent(id: string, studentId: string) {
  const supabase = await createClient();
  const { data: assessment, error } = await supabase
    .from("assessments")
    .select(
      "id, title, category, instructions, resource_path, time_limit_minutes, pass_threshold, rubric",
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!assessment) return null;

  const { data: submissions, error: subError } = await supabase
    .from("assessment_submissions")
    .select(
      "id, status, total_score, grader_notes, graded_at, created_at, submission_url, submission_path",
    )
    .eq("assessment_id", id)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (subError) throw subError;

  return { ...assessment, submissions };
}

/** Statuses of all the student's submissions (for the onboarding checklist). */
export async function listOwnSubmissionStatuses(studentId: string): Promise<AssessmentStatus[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_submissions")
    .select("status")
    .eq("student_id", studentId);
  if (error) throw error;
  return data.map((s) => s.status);
}

export async function createSubmission(
  studentId: string,
  assessmentId: string,
  file: { submission_path: string } | { submission_url: string },
) {
  const supabase = await createClient();
  // The insert policy re-checks the retake rules (can_submit_assessment).
  const { error } = await supabase
    .from("assessment_submissions")
    .insert({ assessment_id: assessmentId, student_id: studentId, ...file });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Admin side
// ---------------------------------------------------------------------------

export async function listAllAssessments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select(
      "id, title, category, is_active, pass_threshold, submissions:assessment_submissions(status)",
    )
    .order("title");
  if (error) throw error;
  return data;
}

export async function getAssessment(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("assessments").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createAssessment(input: AssessmentInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("assessments").insert(input).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updateAssessment(id: string, input: AssessmentInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("assessments").update(input).eq("id", id);
  if (error) throw error;
}

export async function setAssessmentResource(id: string, path: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("assessments").update({ resource_path: path }).eq("id", id);
  if (error) throw error;
}

/** Ungraded submissions, oldest first (first in, first graded). */
export async function listPendingSubmissions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_submissions")
    .select(
      "id, created_at, submission_url, submission_path, assessment:assessments(id, title, category, rubric, pass_threshold), student:students(id, profile:profiles(full_name, email))",
    )
    .eq("status", "submitted")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function countPendingSubmissions(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("assessment_submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "submitted");
  if (error) throw error;
  return count ?? 0;
}

export async function getPendingSubmission(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_submissions")
    .select("id, status, assessment:assessments(rubric, pass_threshold)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Saves a grade only if the submission is still ungraded, so two graders
 * can't overwrite each other. Returns false if it was already graded.
 * The DB trigger logs the grade to activity_log.
 */
export async function gradeSubmission(
  id: string,
  grade: {
    rubric_scores: Record<string, number>;
    total_score: number;
    status: "passed" | "failed";
    grader_notes: string | null;
  },
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_submissions")
    .update({ ...grade, graded_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "submitted")
    .select("id");
  if (error) throw error;
  return data.length === 1;
}
