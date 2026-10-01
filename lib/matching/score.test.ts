import { describe, expect, it } from "vitest";
import { matchSkills, scoreMatch, type MatchProject, type StudentWithStats } from "./score";

const now = new Date("2026-10-01T12:00:00Z");

const project: MatchProject = {
  id: "p1",
  category: "data_cleanup",
  required_skills: ["excel", "data cleaning"],
  preferred_skills: ["python"],
  estimated_hours: 6,
  deadline: "2026-10-15", // 2 weeks out -> needs 3 h/week
  is_starter: false,
};

const student: StudentWithStats = {
  id: "s1",
  is_active: true,
  is_available: true,
  skills: ["excel", "sql"],
  interested_categories: ["data_cleanup"],
  hours_per_week: 5,
  passedAssessments: [{ category: "data_cleanup", score: 80 }],
  completedProjects: 0,
  completedByCategory: {},
  averageRating: null,
  activeProjects: 0,
  offeredProjectIds: [],
};

const sum = (r: ReturnType<typeof scoreMatch>) => r.breakdown.reduce((a, b) => a + b.points, 0);
const pointsFor = (r: ReturnType<typeof scoreMatch>, startsWith: string) =>
  r.breakdown.find((b) => b.label.startsWith(startsWith))?.points;

describe("hard filters", () => {
  it("a missing assessment makes the student ineligible, with a reason", () => {
    const r = scoreMatch({ project, student: { ...student, passedAssessments: [] }, now });
    expect(r.eligible).toBe(false);
    expect(r.ineligibleReasons).toEqual(["No passed assessment in data cleanup"]);
  });

  it("an assessment in another category doesn't count", () => {
    const r = scoreMatch({
      project,
      student: { ...student, passedAssessments: [{ category: "lead_research", score: 99 }] },
      now,
    });
    expect(r.eligible).toBe(false);
  });

  it("the admin override skips only the assessment filter", () => {
    const noAssessment = { ...student, passedAssessments: [] };
    expect(
      scoreMatch({ project, student: noAssessment, now, overrideAssessment: true }).eligible,
    ).toBe(true);
    const r = scoreMatch({
      project,
      student: { ...noAssessment, is_available: false },
      now,
      overrideAssessment: true,
    });
    expect(r.ineligibleReasons).toEqual(["Marked as unavailable"]);
  });

  it("lists every failed filter", () => {
    const r = scoreMatch({
      project,
      student: { ...student, is_active: false, activeProjects: 2, offeredProjectIds: ["p1"] },
      now,
    });
    expect(r.ineligibleReasons).toHaveLength(3);
  });
});

describe("scoring", () => {
  it("breakdown points sum to the final score (before clamping)", () => {
    const r = scoreMatch({ project, student, now });
    // 24 (assessment 80) + 8 (excel) + 0 (python) + 0 completed + 0 rating + 10 avail + 5 interest
    expect(r.score).toBe(47);
    expect(sum(r)).toBe(r.score);
  });

  it("gives the starter bonus to a zero-experience student on starter projects only", () => {
    const starter = scoreMatch({ project: { ...project, is_starter: true }, student, now });
    const normal = scoreMatch({ project, student, now });
    expect(pointsFor(starter, "Starter project")).toBe(10);
    expect(starter.score - normal.score).toBe(10);
    expect(normal.breakdown.some((b) => b.label.startsWith("Starter"))).toBe(false);

    const experienced = scoreMatch({
      project: { ...project, is_starter: true },
      student: { ...student, completedProjects: 2 },
      now,
    });
    expect(pointsFor(experienced, "Starter project")).toBe(0);
  });

  it("clamps the score at 100", () => {
    const r = scoreMatch({
      project: {
        ...project,
        is_starter: true,
        required_skills: ["a", "b", "c"],
        preferred_skills: ["d", "e", "f"],
      },
      student: {
        ...student,
        skills: ["a", "b", "c", "d", "e", "f"],
        passedAssessments: [{ category: "data_cleanup", score: 100 }],
        completedProjects: 1,
        completedByCategory: { data_cleanup: 3 },
        averageRating: 5,
      },
      now,
    });
    expect(sum(r)).toBe(110); // 30+24+9+12+10+10+10+5
    expect(r.score).toBe(100);
  });

  it("clamps the score at 0", () => {
    const r = scoreMatch({
      project: { ...project, deadline: null },
      student: {
        ...student,
        skills: [],
        interested_categories: [],
        passedAssessments: [],
        averageRating: 1,
      },
      now,
      overrideAssessment: true,
    });
    expect(sum(r)).toBe(-10);
    expect(r.score).toBe(0);
  });

  it("caps each component at its maximum", () => {
    const r = scoreMatch({
      project: {
        ...project,
        required_skills: ["a", "b", "c", "d"],
        preferred_skills: ["e", "f", "g", "h"],
      },
      student: {
        ...student,
        skills: ["a", "b", "c", "d", "e", "f", "g", "h"],
        completedByCategory: { data_cleanup: 10 },
      },
      now,
    });
    expect(pointsFor(r, "Required skills")).toBe(24);
    expect(pointsFor(r, "Preferred skills")).toBe(9);
    expect(pointsFor(r, "Completed")).toBe(12);
  });

  it("maps average rating to -10..+10 around a neutral 3", () => {
    const rating = (avg: number) =>
      pointsFor(
        scoreMatch({ project, student: { ...student, averageRating: avg }, now }),
        "Average rating",
      );
    expect(rating(5)).toBe(10);
    expect(rating(3)).toBe(0);
    expect(rating(1)).toBe(-10);
    expect(rating(4.5)).toBe(8); // 7.5 rounds to 8
  });

  it("checks weekly availability against hours spread to the deadline", () => {
    const avail = (hours: number | null, deadline: string | null) =>
      pointsFor(
        scoreMatch({
          project: { ...project, deadline },
          student: { ...student, hours_per_week: hours },
          now,
        }),
        "Availability",
      );
    expect(avail(3, "2026-10-15")).toBe(10); // 6h over 2 weeks = 3 h/week
    expect(avail(2, "2026-10-15")).toBe(0);
    expect(avail(null, "2026-10-15")).toBe(0);
    expect(avail(40, null)).toBe(0);
    expect(avail(5, "2026-09-01")).toBe(0); // deadline passed: needs 42 h/week
  });

  it("counts days from today in Chicago, not UTC", () => {
    // 02:00 UTC Oct 2 is still Oct 1 in Chicago: 14 days to Oct 15, so 3 h/week.
    const lateEvening = new Date("2026-10-02T02:00:00Z");
    const r = scoreMatch({ project, student: { ...student, hours_per_week: 3 }, now: lateEvening });
    expect(pointsFor(r, "Availability")).toBe(10);
  });
});

describe("skill matching", () => {
  it("is case-insensitive", () => {
    expect(matchSkills(["Excel", "SQL "], ["excel", "sql"])).toEqual(["excel", "sql"]);
    const r = scoreMatch({ project: { ...project, required_skills: ["EXCEL"] }, student, now });
    expect(pointsFor(r, "Required skills")).toBe(8);
  });

  it("is exact, not fuzzy", () => {
    expect(matchSkills(["excel"], ["excel macros", "microsoft excel"])).toEqual([]);
  });
});
