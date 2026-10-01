import { describe, expect, it } from "vitest";
import {
  parseRubricText,
  passOrFail,
  readRubric,
  rubricSchema,
  rubricToText,
  scoreRubric,
} from "./rubric";

const rubric = [
  { criterion: "accuracy", max: 50 },
  { criterion: "consistency", max: 30 },
  { criterion: "summary", max: 20 },
];

describe("parseRubricText / rubricToText", () => {
  it("round-trips and ignores blank lines", () => {
    const text = "accuracy: 50\n\n consistency : 30\nsummary:20\n";
    expect(parseRubricText(text)).toEqual(rubric);
    expect(parseRubricText(rubricToText(rubric))).toEqual(rubric);
  });

  it("returns null for a malformed line", () => {
    expect(parseRubricText("accuracy 50")).toBeNull();
    expect(parseRubricText("accuracy: lots")).toBeNull();
  });
});

describe("rubricSchema", () => {
  it("requires points to sum to 100 and names to be unique", () => {
    expect(rubricSchema.safeParse(rubric).success).toBe(true);
    expect(rubricSchema.safeParse([{ criterion: "a", max: 90 }]).success).toBe(false);
    expect(
      rubricSchema.safeParse([
        { criterion: "A", max: 50 },
        { criterion: "a", max: 50 },
      ]).success,
    ).toBe(false);
  });
});

describe("readRubric", () => {
  it("falls back to an empty rubric for bad stored data", () => {
    expect(readRubric(rubric)).toEqual(rubric);
    expect(readRubric({ nope: true })).toEqual([]);
  });
});

describe("scoreRubric", () => {
  it("totals valid scores", () => {
    expect(scoreRubric(rubric, { accuracy: "45", consistency: "25", summary: "10" })).toEqual({
      ok: true,
      scores: { accuracy: 45, consistency: 25, summary: 10 },
      total: 80,
    });
  });

  it("flags missing, fractional and out-of-range scores per criterion", () => {
    const result = scoreRubric(rubric, { accuracy: "51", consistency: "2.5" });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual(rubric.map((r) => r.criterion));
  });
});

describe("passOrFail", () => {
  it("passes at exactly the threshold", () => {
    expect(passOrFail(70, 70)).toBe("passed");
    expect(passOrFail(69, 70)).toBe("failed");
  });
});
