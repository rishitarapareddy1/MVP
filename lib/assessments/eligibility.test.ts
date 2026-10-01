import { describe, expect, it } from "vitest";
import { assessmentState, canSubmit, type SubmissionSummary } from "./eligibility";

const now = new Date("2026-10-01T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
const sub = (over: Partial<SubmissionSummary>): SubmissionSummary => ({
  status: "submitted",
  total_score: null,
  graded_at: null,
  created_at: daysAgo(1),
  ...over,
});

describe("assessmentState", () => {
  it("is not_started with no submissions, and can submit", () => {
    const state = assessmentState([], now);
    expect(state.kind).toBe("not_started");
    expect(canSubmit(state)).toBe(true);
  });

  it("is pending while a submission is ungraded, and cannot submit", () => {
    const state = assessmentState([sub({})], now);
    expect(state.kind).toBe("pending");
    expect(canSubmit(state)).toBe(false);
  });

  it("passed wins over older failures and blocks resubmitting", () => {
    const state = assessmentState(
      [
        sub({ status: "failed", total_score: 50, graded_at: daysAgo(60) }),
        sub({ status: "passed", total_score: 85, graded_at: daysAgo(10) }),
      ],
      now,
    );
    expect(state).toEqual({ kind: "passed", score: 85 });
    expect(canSubmit(state)).toBe(false);
  });

  it("blocks a retake within 30 days of failing and gives the date", () => {
    const state = assessmentState(
      [sub({ status: "failed", total_score: 50, graded_at: daysAgo(12) })],
      now,
    );
    expect(state.kind).toBe("failed");
    if (state.kind === "failed") {
      expect(state.canRetake).toBe(false);
      expect(state.retakeAt.toISOString()).toBe(
        new Date(now.getTime() + 18 * 86_400_000).toISOString(),
      );
    }
  });

  it("allows a retake 30 days after the most recent failure", () => {
    const state = assessmentState(
      [
        sub({ status: "failed", graded_at: daysAgo(31) }),
        sub({ status: "failed", graded_at: daysAgo(90) }),
      ],
      now,
    );
    expect(canSubmit(state)).toBe(true);
  });
});
