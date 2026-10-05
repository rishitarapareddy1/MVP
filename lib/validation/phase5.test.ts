import { describe, expect, it } from "vitest";
import { feedbackSchema, feedbackTokenSchema } from "./feedback";
import { outcomeSchema } from "./outcome";
import { paymentSchema } from "./payment";

describe("paymentSchema", () => {
  const base = {
    direction: "business_to_us",
    amount_cents: "$250",
    method: "zelle",
    paid_at: "2026-09-30",
    reference: "",
  };

  it("converts dollars to cents and pins the date to Chicago noon", () => {
    const p = paymentSchema.parse(base);
    expect(p.amount_cents).toBe(25000);
    expect(p.paid_at).toBe("2026-09-30T17:00:00Z");
    expect(p.reference).toBeNull();
  });

  it("rejects zero, blank and future-dated payments", () => {
    expect(paymentSchema.safeParse({ ...base, amount_cents: "0" }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...base, amount_cents: "" }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...base, paid_at: "2999-01-01" }).success).toBe(false);
  });
});

describe("outcomeSchema", () => {
  it("allows an outcome without a project", () => {
    const o = outcomeSchema.parse({
      type: "job_interview",
      project_id: "",
      notes: "",
      occurred_at: "2026-09-01",
    });
    expect(o.project_id).toBeNull();
  });

  it("rejects unknown types", () => {
    expect(
      outcomeSchema.safeParse({
        type: "promotion",
        project_id: "",
        notes: "",
        occurred_at: "2026-09-01",
      }).success,
    ).toBe(false);
  });
});

describe("feedbackSchema", () => {
  it("parses yes/no answers into booleans", () => {
    const f = feedbackSchema.parse({
      rating: "4",
      quality_notes: "",
      would_hire_again: "yes",
      interested_in_internship_or_job: "no",
    });
    expect(f).toEqual({
      rating: 4,
      quality_notes: null,
      would_hire_again: true,
      interested_in_internship_or_job: false,
    });
  });

  it("requires a 1–5 rating and both answers", () => {
    const r = feedbackSchema.safeParse({ rating: "", quality_notes: "" });
    expect(r.success).toBe(false);
    expect(r.error!.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(["rating", "would_hire_again", "interested_in_internship_or_job"]),
    );
    expect(
      feedbackSchema.safeParse({
        rating: "6",
        would_hire_again: "yes",
        interested_in_internship_or_job: "yes",
        quality_notes: "",
      }).success,
    ).toBe(false);
  });
});

describe("feedbackTokenSchema", () => {
  it("accepts only 64 lowercase hex characters", () => {
    expect(feedbackTokenSchema.safeParse("a".repeat(64)).success).toBe(true);
    expect(feedbackTokenSchema.safeParse("a".repeat(63)).success).toBe(false);
    expect(feedbackTokenSchema.safeParse("' or 1=1 --").success).toBe(false);
  });
});
