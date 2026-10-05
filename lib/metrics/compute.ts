import type { OutcomeType, ProjectCategory, ProjectStatus } from "@/lib/db/types";
import { OUTCOME_TYPES } from "@/lib/db/types";
import { todayInChicago } from "@/lib/format";
import { COMPLETED_STATUSES } from "@/lib/matching/stats";

/**
 * MVP metrics (spec section 8). Pure: takes plain rows, returns numbers, so
 * every definition below is unit-tested and easy to change in one place.
 * At MVP scale (tens to hundreds of rows) computing in TypeScript is simpler
 * than a pile of SQL views.
 */

export type MetricsRows = {
  projects: {
    id: string;
    business_id: string;
    status: ProjectStatus;
    budget_cents: number | null;
    created_at: string;
    assigned_student_id: string | null;
  }[];
  businesses: { id: string; source: string | null }[];
  students: { id: string; created_at: string }[];
  submissions: { student_id: string; status: string; category: ProjectCategory }[];
  offers: { project_id: string; status: string; created_at: string; responded_at: string | null }[];
  deliverables: { project_id: string }[];
  feedback: { rating: number; would_hire_again: boolean }[];
  outcomes: { student_id: string; type: OutcomeType }[];
};

/** A fraction that keeps its parts, so the page can show "3 of 12". */
export type Ratio = { num: number; den: number; pct: number | null };

export function ratio(num: number, den: number): Ratio {
  return { num, den, pct: den === 0 ? null : num / den };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const DAY = 86_400_000;
const utcDay = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Monday (YYYY-MM-DD) of the Chicago-calendar week containing this instant. */
export function weekStart(instant: string | Date): string {
  const day = utcDay(todayInChicago(new Date(instant)));
  const dow = new Date(day).getUTCDay(); // 0 = Sunday
  return ymd(day - ((dow + 6) % 7) * DAY);
}

export const WEEKS_SHOWN = 8;

export function computeMetrics(rows: MetricsRows, now: Date = new Date()) {
  const { projects, businesses, students, submissions, offers } = rows;

  // ---- Demand
  const thisWeek = weekStart(now);
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) =>
    ymd(utcDay(thisWeek) - (WEEKS_SHOWN - 1 - i) * 7 * DAY),
  );
  const perWeek = new Map(weeks.map((w) => [w, 0]));
  for (const p of projects) {
    const w = weekStart(p.created_at);
    if (perWeek.has(w)) perWeek.set(w, perWeek.get(w)! + 1);
  }

  const budgets = projects.map((p) => p.budget_cents).filter((b): b is number => b != null);
  const sourceOf = new Map(businesses.map((b) => [b.id, b.source ?? "unknown"]));
  const bySource = new Map<string, number>();
  for (const p of projects) {
    const s = sourceOf.get(p.business_id) ?? "unknown";
    bySource.set(s, (bySource.get(s) ?? 0) + 1);
  }

  // ---- Repeat business: businesses with 2+ (non-cancelled) projects
  const perBusiness = new Map<string, number>();
  for (const p of projects) {
    if (p.status === "cancelled") continue;
    perBusiness.set(p.business_id, (perBusiness.get(p.business_id) ?? 0) + 1);
  }
  const repeatBusinesses = [...perBusiness.values()].filter((n) => n >= 2).length;

  // ---- Student supply
  const thirtyDaysAgo = now.getTime() - 30 * DAY;
  const studentsWithSubmission = new Set(submissions.map((s) => s.student_id));
  const byCategory = new Map<ProjectCategory, { passed: number; graded: number }>();
  for (const s of submissions) {
    if (s.status === "submitted") continue; // not graded yet
    const c = byCategory.get(s.category) ?? { passed: 0, graded: 0 };
    c.graded += 1;
    if (s.status === "passed") c.passed += 1;
    byCategory.set(s.category, c);
  }

  // ---- Offers
  const answered = offers.filter((o) => ["accepted", "declined", "expired"].includes(o.status));
  const accepted = offers.filter((o) => o.status === "accepted");
  const hoursToAccept = accepted
    .filter((o) => o.responded_at)
    .map((o) => (Date.parse(o.responded_at!) - Date.parse(o.created_at)) / 3_600_000)
    // A response can't come before the offer; skip any such (bad) rows.
    .filter((h) => h >= 0);

  // A "round" is one send_offers call; its offers share a created_at
  // timestamp (same transaction). Filled on round one = the accepted offer
  // came from the project's earliest round. Only projects whose first round
  // is fully resolved (nothing pending) count.
  const offersByProject = new Map<string, typeof offers>();
  for (const o of offers) {
    offersByProject.set(o.project_id, [...(offersByProject.get(o.project_id) ?? []), o]);
  }
  let roundOneResolved = 0;
  let roundOneFilled = 0;
  for (const list of offersByProject.values()) {
    const first = list.reduce(
      (min, o) => (o.created_at < min ? o.created_at : min),
      list[0].created_at,
    );
    const round = list.filter((o) => o.created_at === first);
    if (round.some((o) => o.status === "pending")) continue;
    roundOneResolved += 1;
    if (round.some((o) => o.status === "accepted")) roundOneFilled += 1;
  }

  // ---- Quality
  const finished = projects.filter((p) => COMPLETED_STATUSES.includes(p.status));
  const deliverableCount = new Map<string, number>();
  for (const d of rows.deliverables) {
    deliverableCount.set(d.project_id, (deliverableCount.get(d.project_id) ?? 0) + 1);
  }
  const finishedWithWork = finished.filter((p) => (deliverableCount.get(p.id) ?? 0) > 0);
  const firstTry = finishedWithWork.filter((p) => deliverableCount.get(p.id) === 1);
  const ratings = rows.feedback.map((f) => f.rating);

  // ---- Hiring signal
  const outcomeCounts = Object.fromEntries(OUTCOME_TYPES.map((t) => [t, 0])) as Record<
    OutcomeType,
    number
  >;
  for (const o of rows.outcomes) outcomeCounts[o.type] += 1;
  const completedStudents = new Set(
    finished.map((p) => p.assigned_student_id).filter((id): id is string => id !== null),
  );
  const withOutcome = new Set(rows.outcomes.map((o) => o.student_id));

  return {
    demand: {
      perWeek: weeks.map((week) => ({ week, count: perWeek.get(week)! })),
      totalRequests: projects.length,
      requestToPaid: ratio(
        projects.filter((p) => p.status === "paid" || p.status === "closed").length,
        projects.length,
      ),
      averageBudgetCents: budgets.length
        ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
        : null,
      bySource: [...bySource]
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
    },
    repeatBusiness: ratio(repeatBusinesses, perBusiness.size),
    supply: {
      signups: students.length,
      signupsLast30Days: students.filter((s) => Date.parse(s.created_at) >= thirtyDaysAgo).length,
      tookAssessment: ratio(
        students.filter((s) => studentsWithSubmission.has(s.id)).length,
        students.length,
      ),
      passRateByCategory: [...byCategory]
        .map(([category, c]) => ({ category, ...ratio(c.passed, c.graded) }))
        .sort((a, b) => b.den - a.den),
    },
    offers: {
      acceptanceRate: ratio(accepted.length, answered.length),
      medianHoursToAccept: median(hoursToAccept),
      filledFirstRound: ratio(roundOneFilled, roundOneResolved),
    },
    quality: {
      averageRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      ratingCount: ratings.length,
      approvedWithoutRework: ratio(firstTry.length, finishedWithWork.length),
      wouldHireAgain: ratio(
        rows.feedback.filter((f) => f.would_hire_again).length,
        rows.feedback.length,
      ),
    },
    hiring: {
      outcomeCounts,
      studentsWithOutcome: ratio(
        [...completedStudents].filter((id) => withOutcome.has(id)).length,
        completedStudents.size,
      ),
    },
  };
}

export type Metrics = ReturnType<typeof computeMetrics>;
