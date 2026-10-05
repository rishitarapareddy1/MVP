import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProjectCategory } from "./types";
import type { StatsRows } from "@/lib/matching/stats";
import { isVerifiedStudent } from "@/lib/students/verification";

/**
 * Loads every row the matching stats need, in parallel. Admin-only
 * (RLS returns nothing for other users). At MVP scale (tens of students)
 * loading everything and scoring in TypeScript is simpler than SQL scoring.
 */
export async function loadStatsRows(): Promise<{
  rows: StatsRows;
  people: Map<string, { full_name: string | null; email: string; major: string | null }>;
}> {
  const supabase = await createClient();
  const [students, passed, projects, feedback, offers] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, is_active, is_available, university_email_verified_at, skills, interested_categories, hours_per_week, major, profile:profiles(full_name, email)",
      ),
    supabase
      .from("assessment_submissions")
      .select("student_id, total_score, assessment:assessments(category)")
      .eq("status", "passed"),
    supabase
      .from("projects")
      .select("id, category, status, assigned_student_id")
      .not("assigned_student_id", "is", null),
    supabase.from("feedback").select("rating, project:projects(assigned_student_id)"),
    supabase.from("offers").select("student_id, project_id"),
  ]);
  for (const r of [students, passed, projects, feedback, offers]) if (r.error) throw r.error;

  const people = new Map(
    students.data!.map((s) => [
      s.id,
      { full_name: s.profile?.full_name ?? null, email: s.profile?.email ?? "", major: s.major },
    ]),
  );

  return {
    people,
    rows: {
      students: students.data!.map((s) => ({
        id: s.id,
        is_active: s.is_active,
        is_available: s.is_available,
        is_verified: isVerifiedStudent(s.profile?.email ?? "", s.university_email_verified_at),
        skills: s.skills,
        interested_categories: s.interested_categories,
        hours_per_week: s.hours_per_week,
      })),
      passedSubmissions: passed
        .data!.filter((p) => p.assessment)
        .map((p) => ({
          student_id: p.student_id,
          total_score: p.total_score,
          category: p.assessment!.category as ProjectCategory,
        })),
      assignedProjects: projects.data!.map((p) => ({
        ...p,
        assigned_student_id: p.assigned_student_id!,
      })),
      ratings: feedback
        .data!.filter((f) => f.project?.assigned_student_id)
        .map((f) => ({ rating: f.rating, student_id: f.project!.assigned_student_id! })),
      offers: offers.data!,
    },
  };
}
