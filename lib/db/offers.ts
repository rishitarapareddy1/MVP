import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "./database.types";
import type { BreakdownItem } from "@/lib/matching/score";

/**
 * Marks overdue pending offers as expired (and sends projects with nothing
 * left pending back to matching). The MVP has no cron job, so pages that
 * show offers call this first (spec: "check on page load").
 */
export async function expireStaleOffers(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("expire_stale_offers");
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export type NewOffer = {
  student_id: string;
  match_score: number;
  match_breakdown: BreakdownItem[];
  admin_note: string | null;
};

/** Sends offers atomically (send_offers locks the project and enforces max 3). */
export async function sendOffers(projectId: string, offers: NewOffer[]): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("send_offers", {
    p_project_id: projectId,
    p_offers: offers as unknown as Json,
  });
  if (error) throw error;
}

export async function listProjectOffers(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .select(
      "id, status, match_score, match_breakdown, admin_note, expires_at, responded_at, created_at, student:students(id, profile:profiles(full_name, email))",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Student. Project details come from the student_projects view, which never
// includes budget, business or token columns.
// ---------------------------------------------------------------------------

const STUDENT_PROJECT_COLUMNS =
  "id, title, scoped_description, deliverable, category, required_skills, preferred_skills, estimated_hours, student_pay_cents, deadline, is_starter, status, assigned_student_id";

type StudentProjectViewRow = Database["public"]["Views"]["student_projects"]["Row"];

/**
 * Postgres reports every view column as nullable, so the generated types do
 * too. These columns are NOT NULL in the projects table, so restore that here
 * once instead of sprinkling `!` across pages.
 */
function normalizeStudentProject(row: StudentProjectViewRow) {
  return {
    ...row,
    id: row.id!,
    title: row.title!,
    category: row.category!,
    status: row.status!,
    required_skills: row.required_skills ?? [],
    preferred_skills: row.preferred_skills ?? [],
    is_starter: row.is_starter ?? false,
  };
}

export async function listOwnOffers(studentId: string) {
  const supabase = await createClient();
  const { data: offers, error } = await supabase
    .from("offers")
    .select("id, project_id, status, expires_at, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (offers.length === 0) return [];

  const { data: projects, error: pError } = await supabase
    .from("student_projects")
    .select(STUDENT_PROJECT_COLUMNS)
    .in(
      "id",
      offers.map((o) => o.project_id),
    );
  if (pError) throw pError;

  return offers.map((o) => ({
    ...o,
    project: (() => {
      const row = projects.find((p) => p.id === o.project_id);
      return row ? normalizeStudentProject(row) : null;
    })(),
  }));
}

export async function getOwnOffer(offerId: string, studentId: string) {
  const supabase = await createClient();
  const { data: offer, error } = await supabase
    .from("offers")
    .select("id, project_id, status, admin_note, expires_at, responded_at, created_at")
    .eq("id", offerId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  if (!offer) return null;

  const { data: project, error: pError } = await supabase
    .from("student_projects")
    .select(STUDENT_PROJECT_COLUMNS)
    .eq("id", offer.project_id)
    .maybeSingle();
  if (pError) throw pError;

  return { ...offer, project: project ? normalizeStudentProject(project) : null };
}

/** Projects assigned to this student that aren't finished yet. */
export async function listOwnActiveProjects(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_projects")
    .select(STUDENT_PROJECT_COLUMNS)
    .eq("assigned_student_id", studentId)
    .in("status", ["assigned", "in_progress", "delivered"])
    .order("deadline", { ascending: true });
  if (error) throw error;
  return data.map(normalizeStudentProject);
}

export type OfferResponse =
  | "accepted"
  | "declined"
  | "filled"
  | "expired"
  | "not_pending"
  | "too_many_projects"
  | "not_found";

export async function respondToOffer(
  offerId: string,
  response: "accept" | "decline",
): Promise<OfferResponse> {
  const supabase = await createClient();
  const { data, error } =
    response === "accept"
      ? await supabase.rpc("accept_offer", { p_offer_id: offerId })
      : await supabase.rpc("decline_offer", { p_offer_id: offerId });
  if (error) throw error;
  return data as OfferResponse;
}
