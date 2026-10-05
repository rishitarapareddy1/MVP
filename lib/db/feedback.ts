import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { FeedbackInput } from "@/lib/validation/feedback";

// ---------------------------------------------------------------------------
// Public feedback page. The business has no account, so these use the
// service role, looking the project up only by its unguessable token, and
// return just what the page needs.
// ---------------------------------------------------------------------------

export async function getFeedbackPageContext(token: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, status, business:businesses(name), student:students(profile:profiles(full_name)), feedback(id)",
    )
    .eq("feedback_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const fullName = data.student?.profile?.full_name ?? null;
  return {
    title: data.title,
    status: data.status,
    businessName: data.business?.name ?? null,
    // First name only: enough for "How did Maya do?", nothing more.
    studentFirstName: fullName?.split(" ")[0] ?? null,
    alreadySubmitted: data.status === "closed" || data.feedback !== null,
  };
}

export type FeedbackResult = "submitted" | "not_ready" | "already_submitted" | "not_found";

/** Saves feedback and closes the project in one transaction (submit_feedback). */
export async function submitFeedback(token: string, input: FeedbackInput): Promise<FeedbackResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("submit_feedback", {
    p_token: token,
    p_rating: input.rating,
    p_quality_notes: input.quality_notes as string,
    p_would_hire_again: input.would_hire_again,
    p_interested: input.interested_in_internship_or_job,
  });
  if (error) throw error;
  return data as FeedbackResult;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function getProjectFeedback(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Businesses interested in hiring their student, not yet followed up on. */
export async function listHiringFollowUps() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select(
      "id, rating, submitted_at, project:projects(id, title, business:businesses(name, contact_name, contact_email), student:students(id, profile:profiles(full_name)))",
    )
    .eq("interested_in_internship_or_job", true)
    .is("followed_up_at", null)
    .order("submitted_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function markFollowedUp(feedbackId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("feedback")
    .update({ followed_up_at: new Date().toISOString() })
    .eq("id", feedbackId);
  if (error) throw error;
}
