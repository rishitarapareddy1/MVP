import type { AssessmentStatus } from "@/lib/db/types";

/** Days a student must wait after failing before retaking (spec section 4). */
export const RETAKE_DAYS = 30;

export type SubmissionSummary = {
  status: AssessmentStatus;
  total_score: number | null;
  graded_at: string | null;
  created_at: string;
};

/** Where a student stands on one assessment. */
export type AssessmentState =
  | { kind: "not_started" }
  | { kind: "pending"; submittedAt: string }
  | { kind: "passed"; score: number | null }
  | { kind: "failed"; score: number | null; retakeAt: Date; canRetake: boolean };

/**
 * Collapses a student's submission history for one assessment into a single
 * state. The database enforces the same rules (can_submit_assessment); this
 * version exists to show the student a clear message and a retake date.
 */
export function assessmentState(
  submissions: SubmissionSummary[],
  now: Date = new Date(),
): AssessmentState {
  const passed = submissions.find((s) => s.status === "passed");
  if (passed) return { kind: "passed", score: passed.total_score };

  const pending = submissions.find((s) => s.status === "submitted");
  if (pending) return { kind: "pending", submittedAt: pending.created_at };

  const failed = submissions
    .filter((s) => s.status === "failed" && s.graded_at)
    .sort((a, b) => b.graded_at!.localeCompare(a.graded_at!))[0];
  if (failed) {
    const retakeAt = new Date(new Date(failed.graded_at!).getTime() + RETAKE_DAYS * 86_400_000);
    return { kind: "failed", score: failed.total_score, retakeAt, canRetake: now >= retakeAt };
  }

  return { kind: "not_started" };
}

export function canSubmit(state: AssessmentState): boolean {
  return state.kind === "not_started" || (state.kind === "failed" && state.canRetake);
}
