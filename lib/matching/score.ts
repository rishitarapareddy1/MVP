import type { Project, ProjectCategory } from "@/lib/db/types";
import { todayInChicago } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/projects/labels";

/**
 * Match scoring (spec section 5). Pure: no database calls, `now` is passed
 * in, so it's fully unit-testable and the same inputs always give the same
 * score. The system only recommends; the admin makes every decision.
 */

export type MatchProject = Pick<
  Project,
  | "id"
  | "category"
  | "required_skills"
  | "preferred_skills"
  | "estimated_hours"
  | "deadline"
  | "is_starter"
>;

export type StudentWithStats = {
  id: string;
  is_active: boolean;
  is_available: boolean;
  /** Logged in with a university email, or confirmed one by code. */
  is_verified: boolean;
  skills: string[];
  interested_categories: ProjectCategory[];
  hours_per_week: number | null;
  /** Best passed score per category. */
  passedAssessments: { category: ProjectCategory; score: number }[];
  completedProjects: number;
  completedByCategory: Partial<Record<ProjectCategory, number>>;
  /** null when the student has no rated projects yet. */
  averageRating: number | null;
  /** Projects in 'assigned' or 'in_progress'. */
  activeProjects: number;
  /** Projects this student already got an offer for (accepted, declined, expired…). */
  offeredProjectIds: string[];
};

export type MatchInput = {
  project: MatchProject;
  student: StudentWithStats;
  now?: Date;
  /** Admin chose to skip the "passed an assessment" filter for this student. */
  overrideAssessment?: boolean;
};

export type BreakdownItem = { label: string; points: number };

export type MatchResult = {
  eligible: boolean;
  ineligibleReasons: string[];
  score: number; // 0–100, clamped
  breakdown: BreakdownItem[];
};

export const MAX_ACTIVE_PROJECTS = 2;

const lower = (tags: string[]) => tags.map((t) => t.trim().toLowerCase());

/** Case-insensitive exact tag match (no fuzzy/AI matching in the MVP). */
export function matchSkills(wanted: string[], has: string[]): string[] {
  const hasSet = new Set(lower(has));
  return lower(wanted).filter((s) => hasSet.has(s));
}

/** Whole days from today (in Chicago) to a YYYY-MM-DD deadline; negative if past. */
function daysUntil(deadline: string, now: Date): number {
  const toUtcDay = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtcDay(deadline) - toUtcDay(todayInChicago(now))) / 86_400_000);
}

export function scoreMatch({
  project,
  student,
  now = new Date(),
  overrideAssessment = false,
}: MatchInput): MatchResult {
  const category = CATEGORY_LABELS[project.category].toLowerCase();
  const assessment = student.passedAssessments
    .filter((a) => a.category === project.category)
    .sort((a, b) => b.score - a.score)[0];

  // ---- Hard filters
  const ineligibleReasons: string[] = [];
  if (!student.is_active) ineligibleReasons.push("Deactivated by admin");
  if (!student.is_available) ineligibleReasons.push("Marked as unavailable");
  if (!student.is_verified) ineligibleReasons.push("Hasn't verified a university email");
  if (!assessment && !overrideAssessment) {
    ineligibleReasons.push(`No passed assessment in ${category}`);
  }
  if (student.offeredProjectIds.includes(project.id)) {
    ineligibleReasons.push("Already received an offer for this project");
  }
  if (student.activeProjects >= MAX_ACTIVE_PROJECTS) {
    ineligibleReasons.push(`Already has ${student.activeProjects} active projects`);
  }

  // ---- Scoring (each component listed, even at 0 points)
  const breakdown: BreakdownItem[] = [];

  breakdown.push(
    assessment
      ? {
          label: `Assessment score in ${category} (${assessment.score})`,
          points: Math.min(30, Math.round((assessment.score / 100) * 30)),
        }
      : { label: "No assessment in this category (admin override)", points: 0 },
  );

  const required = matchSkills(project.required_skills, student.skills);
  breakdown.push({
    label:
      project.required_skills.length === 0
        ? "Required skills: none listed"
        : `Required skills: ${required.length} of ${project.required_skills.length}` +
          (required.length ? ` (${required.join(", ")})` : ""),
    points: Math.min(24, required.length * 8),
  });

  const preferred = matchSkills(project.preferred_skills, student.skills);
  if (project.preferred_skills.length > 0) {
    breakdown.push({
      label:
        `Preferred skills: ${preferred.length} of ${project.preferred_skills.length}` +
        (preferred.length ? ` (${preferred.join(", ")})` : ""),
      points: Math.min(9, preferred.length * 3),
    });
  }

  const inCategory = student.completedByCategory[project.category] ?? 0;
  breakdown.push({
    label: `Completed ${category} projects: ${inCategory}`,
    points: Math.min(12, inCategory * 4),
  });

  breakdown.push(
    student.averageRating === null
      ? { label: "No ratings yet", points: 0 }
      : {
          label: `Average rating ${student.averageRating.toFixed(1)} / 5`,
          // 3 is neutral: 5★ = +10, 1★ = -10.
          points: Math.max(-10, Math.min(10, Math.round((student.averageRating - 3) * 5))),
        },
  );

  breakdown.push(availability(project, student, now));

  if (project.is_starter) {
    const isNew = student.completedProjects <= 1;
    breakdown.push({
      label: isNew
        ? `Starter project, new student (${student.completedProjects} completed)`
        : "Starter project, but student is experienced",
      points: isNew ? 10 : 0,
    });
  }

  const interested = student.interested_categories.includes(project.category);
  breakdown.push({
    label: interested ? `Interested in ${category}` : `Didn't list ${category} as an interest`,
    points: interested ? 5 : 0,
  });

  const raw = breakdown.reduce((sum, item) => sum + item.points, 0);
  return {
    eligible: ineligibleReasons.length === 0,
    ineligibleReasons,
    score: Math.max(0, Math.min(100, raw)),
    breakdown,
  };
}

/** +10 if weekly availability covers estimated_hours spread over the weeks left. */
function availability(project: MatchProject, student: StudentWithStats, now: Date): BreakdownItem {
  if (!project.estimated_hours || !project.deadline) {
    return { label: "Availability: project hours or deadline not set", points: 0 };
  }
  if (student.hours_per_week == null) {
    return { label: "Availability: student hasn't said", points: 0 };
  }
  // At least one day, so a same-day deadline means "all hours this week, 7x".
  const weeks = Math.max(1, daysUntil(project.deadline, now)) / 7;
  const needed = Math.ceil(project.estimated_hours / weeks);
  const ok = student.hours_per_week >= needed;
  return {
    label: `Availability: ${student.hours_per_week} h/week ${ok ? "≥" : "<"} ${needed} h/week needed`,
    points: ok ? 10 : 0,
  };
}
