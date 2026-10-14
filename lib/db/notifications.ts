import "server-only";
import { createClient } from "@/lib/supabase/server";

// Data needed to send notification emails. Admin-side queries run under the
// admin's RLS; the offer-accepted lookup runs as the student (own data only).

/** Pending offers for a project (the ones just sent), with each student's contact. */
export async function listPendingOffersForEmail(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .select(
      "id, admin_note, expires_at, student:students(profile:profiles(full_name, email)), project:projects(title, student_pay_cents, deadline)",
    )
    .eq("project_id", projectId)
    .eq("status", "pending");
  if (error) throw error;
  return data;
}

/** The project, business contact and student name for the feedback request email. */
export async function getFeedbackEmailContext(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, status, feedback_token, business:businesses(contact_name, contact_email), student:students(profile:profiles(full_name)), feedback(id)",
    )
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Records that the feedback link was emailed, so the Today list can drop it. */
export async function recordFeedbackLinkSent(projectId: string, actorId: string, to: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("activity_log").insert({
    actor_id: actorId,
    entity_type: "project",
    entity_id: projectId,
    action: "feedback_link_sent",
    metadata: { to },
  });
  if (error) throw error;
}

/** Projects whose feedback link has already been emailed. */
export async function projectsWithFeedbackLinkSent(projectIds: string[]): Promise<Set<string>> {
  if (projectIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("entity_id")
    .eq("action", "feedback_link_sent")
    .in("entity_id", projectIds);
  if (error) throw error;
  return new Set(data.map((r) => r.entity_id));
}
