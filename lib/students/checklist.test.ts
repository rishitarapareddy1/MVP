import { describe, expect, it } from "vitest";
import { missingProfileFields, onboardingChecklist } from "./checklist";

const complete = {
  major: "Statistics",
  graduation_year: 2027,
  skills: ["excel"],
  interested_categories: ["data_cleanup" as const],
  hours_per_week: 10,
};

describe("missingProfileFields", () => {
  it("is empty for a complete profile", () => {
    expect(missingProfileFields(complete, "Maya")).toEqual([]);
  });

  it("lists every missing required field", () => {
    expect(
      missingProfileFields(
        {
          major: " ",
          graduation_year: null,
          skills: [],
          interested_categories: [],
          hours_per_week: null,
        },
        null,
      ),
    ).toEqual([
      "name",
      "major",
      "graduation year",
      "skills",
      "project interests",
      "weekly availability",
    ]);
  });

  it("treats 0 hours as answered (student is busy, not missing)", () => {
    expect(missingProfileFields({ ...complete, hours_per_week: 0 }, "Maya")).toEqual([]);
  });
});

describe("onboardingChecklist", () => {
  it("marks steps done in order", () => {
    expect(onboardingChecklist(complete, "Maya", []).map((s) => s.done)).toEqual([
      true,
      false,
      false,
    ]);
    expect(onboardingChecklist(complete, "Maya", ["failed", "passed"]).map((s) => s.done)).toEqual([
      true,
      true,
      true,
    ]);
  });

  it("explains a pending grade", () => {
    expect(onboardingChecklist(complete, "Maya", ["submitted"])[2].detail).toBe(
      "Waiting for grading",
    );
  });
});

describe("university email step", () => {
  it("is added first for Gmail students and tracks verification", () => {
    const steps = onboardingChecklist(complete, "Maya", [], { needed: true, verified: false });
    expect(steps[0].label).toBe("Verify your university email");
    expect(steps[0].done).toBe(false);
    expect(
      onboardingChecklist(complete, "Maya", [], { needed: true, verified: true })[0].done,
    ).toBe(true);
  });

  it("is absent for students who log in with a university email", () => {
    expect(onboardingChecklist(complete, "Maya", []).map((s) => s.label)).not.toContain(
      "Verify your university email",
    );
  });
});
