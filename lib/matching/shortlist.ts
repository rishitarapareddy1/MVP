import "server-only";
import { loadStatsRows } from "@/lib/db/matching";
import { getProjectDetail } from "@/lib/db/projects";
import { scoreMatch, type MatchResult, type StudentWithStats } from "./score";
import { buildStudentStats } from "./stats";

export const SHORTLIST_SIZE = 10;

export type ShortlistEntry = {
  student: StudentWithStats & { full_name: string | null; email: string; major: string | null };
  result: MatchResult;
};

export type Shortlist = {
  /** Top eligible students, best first. */
  eligible: ShortlistEntry[];
  /** Students blocked ONLY by "no passed assessment in this category", scored
   *  as if the admin overrode it. Shown separately so overrides are deliberate. */
  overrideCandidates: ShortlistEntry[];
};

const byScoreThenName = (a: ShortlistEntry, b: ShortlistEntry) =>
  b.result.score - a.result.score ||
  (a.student.full_name ?? a.student.email).localeCompare(b.student.full_name ?? b.student.email);

/**
 * Loads eligible students, scores them, sorts by score descending and
 * returns the top 10 with breakdowns (spec section 5).
 */
export async function getShortlist(projectId: string, now = new Date()): Promise<Shortlist | null> {
  const project = await getProjectDetail(projectId);
  if (!project) return null;

  const { rows, people } = await loadStatsRows();
  const students = buildStudentStats(rows).map((s) => ({ ...s, ...people.get(s.id)! }));

  const eligible: ShortlistEntry[] = [];
  const overrideCandidates: ShortlistEntry[] = [];
  for (const student of students) {
    const result = scoreMatch({ project, student, now });
    if (result.eligible) {
      eligible.push({ student, result });
      continue;
    }
    const withOverride = scoreMatch({ project, student, now, overrideAssessment: true });
    if (withOverride.eligible) overrideCandidates.push({ student, result: withOverride });
  }

  return {
    eligible: eligible.sort(byScoreThenName).slice(0, SHORTLIST_SIZE),
    overrideCandidates: overrideCandidates.sort(byScoreThenName).slice(0, SHORTLIST_SIZE),
  };
}
