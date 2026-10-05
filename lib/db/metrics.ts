import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MetricsRows } from "@/lib/metrics/compute";
import type { ProjectCategory } from "./types";

/** Loads every row the metrics need (admin-only under RLS), in parallel. */
export async function loadMetricsRows(): Promise<MetricsRows> {
  const supabase = await createClient();
  const [projects, businesses, students, submissions, offers, deliverables, feedback, outcomes] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, business_id, status, budget_cents, created_at, assigned_student_id"),
      supabase.from("businesses").select("id, source"),
      supabase.from("students").select("id, created_at"),
      supabase
        .from("assessment_submissions")
        .select("student_id, status, assessment:assessments(category)"),
      supabase.from("offers").select("project_id, status, created_at, responded_at"),
      supabase.from("deliverables").select("project_id"),
      supabase.from("feedback").select("rating, would_hire_again"),
      supabase.from("outcomes").select("student_id, type"),
    ]);
  for (const r of [
    projects,
    businesses,
    students,
    submissions,
    offers,
    deliverables,
    feedback,
    outcomes,
  ]) {
    if (r.error) throw r.error;
  }

  return {
    projects: projects.data!,
    businesses: businesses.data!,
    students: students.data!,
    submissions: submissions
      .data!.filter((s) => s.assessment)
      .map((s) => ({
        student_id: s.student_id,
        status: s.status,
        category: s.assessment!.category as ProjectCategory,
      })),
    offers: offers.data!,
    deliverables: deliverables.data!,
    feedback: feedback.data!,
    outcomes: outcomes.data!,
  };
}
