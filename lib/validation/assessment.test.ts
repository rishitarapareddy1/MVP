import { describe, expect, it } from "vitest";
import { assessmentSchema } from "./assessment";

const base = {
  title: "Clean a list",
  category: "data_cleanup",
  instructions: "Do the thing",
  time_limit_minutes: "",
  rubric: "accuracy: 60\nclarity: 40",
  pass_threshold: "70",
  is_active: "on",
};

describe("assessmentSchema", () => {
  it("parses the rubric text into items", () => {
    const a = assessmentSchema.parse(base);
    expect(a.rubric).toEqual([
      { criterion: "accuracy", max: 60 },
      { criterion: "clarity", max: 40 },
    ]);
    expect(a.time_limit_minutes).toBeNull();
    expect(a.is_active).toBe(true);
  });

  it("explains malformed and non-100 rubrics", () => {
    const bad = assessmentSchema.safeParse({ ...base, rubric: "accuracy sixty" });
    expect(bad.error?.issues[0].message).toMatch(/one criterion per line/);
    const short = assessmentSchema.safeParse({ ...base, rubric: "accuracy: 60" });
    expect(short.error?.issues[0].message).toMatch(/add up to 100/);
  });
});
