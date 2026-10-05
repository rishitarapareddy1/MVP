import type { ProjectCategory, ProjectStatus } from "@/lib/db/types";
import type { StudentWithStats } from "./score";

/** A project counts as completed once the business approved the work. */
export const COMPLETED_STATUSES: ProjectStatus[] = ["approved", "paid", "closed"];
/** Spec: "active" = assigned or in_progress. */
export const ACTIVE_STATUSES: ProjectStatus[] = ["assigned", "in_progress"];

export type StatsRows = {
  students: {
    id: string;
    is_active: boolean;
    is_available: boolean;
    is_verified: boolean;
    skills: string[];
    interested_categories: ProjectCategory[];
    hours_per_week: number | null;
  }[];
  passedSubmissions: {
    student_id: string;
    total_score: number | null;
    category: ProjectCategory;
  }[];
  assignedProjects: {
    id: string;
    category: ProjectCategory;
    status: ProjectStatus;
    assigned_student_id: string;
  }[];
  ratings: { rating: number; student_id: string }[];
  offers: { student_id: string; project_id: string }[];
};

/**
 * Turns raw rows into one StudentWithStats per student. Pure, so the
 * counting rules are tested without a database.
 */
export function buildStudentStats(rows: StatsRows): StudentWithStats[] {
  return rows.students.map((s) => {
    // Best score per category (a student may pass the same category twice).
    const best = new Map<ProjectCategory, number>();
    for (const sub of rows.passedSubmissions) {
      if (sub.student_id !== s.id || sub.total_score == null) continue;
      best.set(sub.category, Math.max(best.get(sub.category) ?? 0, sub.total_score));
    }

    const mine = rows.assignedProjects.filter((p) => p.assigned_student_id === s.id);
    const completed = mine.filter((p) => COMPLETED_STATUSES.includes(p.status));
    const completedByCategory: Partial<Record<ProjectCategory, number>> = {};
    for (const p of completed) {
      completedByCategory[p.category] = (completedByCategory[p.category] ?? 0) + 1;
    }

    const myRatings = rows.ratings.filter((r) => r.student_id === s.id).map((r) => r.rating);

    return {
      ...s,
      passedAssessments: [...best].map(([category, score]) => ({ category, score })),
      completedProjects: completed.length,
      completedByCategory,
      averageRating: myRatings.length
        ? myRatings.reduce((a, b) => a + b, 0) / myRatings.length
        : null,
      activeProjects: mine.filter((p) => ACTIVE_STATUSES.includes(p.status)).length,
      offeredProjectIds: rows.offers.filter((o) => o.student_id === s.id).map((o) => o.project_id),
    };
  });
}
