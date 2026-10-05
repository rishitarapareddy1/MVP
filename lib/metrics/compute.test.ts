import { describe, expect, it } from "vitest";
import { computeMetrics, ratio, weekStart, type MetricsRows } from "./compute";

// Thursday Oct 1, 2026, noon Chicago.
const now = new Date("2026-10-01T17:00:00Z");

const project = (
  over: Partial<MetricsRows["projects"][number]>,
): MetricsRows["projects"][number] => ({
  id: "p",
  business_id: "b1",
  status: "submitted",
  budget_cents: null,
  created_at: "2026-09-30T15:00:00Z",
  assigned_student_id: null,
  ...over,
});

const rows: MetricsRows = {
  projects: [
    project({
      id: "p1",
      business_id: "b1",
      status: "closed",
      budget_cents: 10000,
      assigned_student_id: "s1",
    }),
    project({
      id: "p2",
      business_id: "b1",
      status: "paid",
      budget_cents: 30000,
      assigned_student_id: "s2",
    }),
    project({
      id: "p3",
      business_id: "b2",
      status: "matching",
      created_at: "2026-09-20T15:00:00Z",
    }),
    project({ id: "p4", business_id: "b3", status: "cancelled" }),
    project({ id: "p5", business_id: "b3", status: "cancelled" }),
  ],
  businesses: [
    { id: "b1", source: "linkedin" },
    { id: "b2", source: "walk-in" },
    { id: "b3", source: null },
  ],
  students: [
    { id: "s1", created_at: "2026-09-25T00:00:00Z" },
    { id: "s2", created_at: "2026-06-01T00:00:00Z" },
    { id: "s3", created_at: "2026-09-29T00:00:00Z" },
  ],
  submissions: [
    { student_id: "s1", status: "passed", category: "data_cleanup" },
    { student_id: "s2", status: "failed", category: "data_cleanup" },
    { student_id: "s2", status: "passed", category: "lead_research" },
    { student_id: "s1", status: "submitted", category: "lead_research" },
  ],
  offers: [
    // p1: round one (same timestamp), accepted after 6h
    {
      project_id: "p1",
      status: "accepted",
      created_at: "2026-09-01T00:00:00Z",
      responded_at: "2026-09-01T06:00:00Z",
    },
    {
      project_id: "p1",
      status: "withdrawn",
      created_at: "2026-09-01T00:00:00Z",
      responded_at: null,
    },
    // p2: round one declined, round two accepted after 2h
    {
      project_id: "p2",
      status: "declined",
      created_at: "2026-09-02T00:00:00Z",
      responded_at: "2026-09-02T01:00:00Z",
    },
    {
      project_id: "p2",
      status: "accepted",
      created_at: "2026-09-05T00:00:00Z",
      responded_at: "2026-09-05T02:00:00Z",
    },
    // p3: round one still pending -> excluded from first-round rate
    { project_id: "p3", status: "pending", created_at: "2026-09-30T00:00:00Z", responded_at: null },
    { project_id: "p3", status: "expired", created_at: "2026-09-30T00:00:00Z", responded_at: null },
  ],
  deliverables: [{ project_id: "p1" }, { project_id: "p2" }, { project_id: "p2" }],
  feedback: [
    { rating: 5, would_hire_again: true },
    { rating: 4, would_hire_again: false },
  ],
  outcomes: [
    { student_id: "s1", type: "internship_interview" },
    { student_id: "s1", type: "repeat_project" },
  ],
};

const m = computeMetrics(rows, now);

describe("weekStart", () => {
  it("returns the Monday of the Chicago week", () => {
    expect(weekStart("2026-10-01T17:00:00Z")).toBe("2026-09-28"); // Thu -> Mon
    expect(weekStart("2026-09-28T05:30:00Z")).toBe("2026-09-28"); // Mon 00:30 Chicago
    expect(weekStart("2026-09-28T04:30:00Z")).toBe("2026-09-21"); // still Sunday in Chicago
  });
});

describe("demand", () => {
  it("buckets requests into the last 8 weeks, oldest first, zeros included", () => {
    expect(m.demand.perWeek).toHaveLength(8);
    expect(m.demand.perWeek.at(-1)).toEqual({ week: "2026-09-28", count: 4 });
    expect(m.demand.perWeek.at(-2)).toEqual({ week: "2026-09-21", count: 0 });
    expect(m.demand.perWeek[0].week).toBe("2026-08-10");
  });

  it("puts a request on Sep 20 (Sunday) in the week of Sep 14", () => {
    expect(m.demand.perWeek.find((w) => w.week === "2026-09-14")?.count).toBe(1);
  });

  it("computes request -> paid conversion, average budget and sources", () => {
    expect(m.demand.requestToPaid).toEqual(ratio(2, 5));
    expect(m.demand.averageBudgetCents).toBe(20000);
    expect(m.demand.bySource).toEqual([
      { source: "linkedin", count: 2 },
      { source: "unknown", count: 2 },
      { source: "walk-in", count: 1 },
    ]);
  });
});

describe("repeat business", () => {
  it("counts businesses with 2+ non-cancelled projects", () => {
    // b1 has 2; b2 has 1; b3's projects were all cancelled so it isn't counted.
    expect(m.repeatBusiness).toEqual(ratio(1, 2));
  });
});

describe("student supply", () => {
  it("counts signups and assessment takers", () => {
    expect(m.supply.signups).toBe(3);
    expect(m.supply.signupsLast30Days).toBe(2);
    expect(m.supply.tookAssessment).toEqual(ratio(2, 3));
  });

  it("computes pass rate by category from graded submissions only", () => {
    expect(m.supply.passRateByCategory).toEqual([
      { category: "data_cleanup", ...ratio(1, 2) },
      { category: "lead_research", ...ratio(1, 1) },
    ]);
  });
});

describe("offers", () => {
  it("acceptance rate ignores pending and withdrawn offers", () => {
    // answered = 2 accepted + 1 declined + 1 expired
    expect(m.offers.acceptanceRate).toEqual(ratio(2, 4));
  });

  it("median time to accept in hours", () => {
    expect(m.offers.medianHoursToAccept).toBe(4); // median of 6 and 2
  });

  it("ignores impossible negative response times", () => {
    const bad = computeMetrics(
      {
        ...rows,
        offers: [
          ...rows.offers,
          {
            project_id: "p9",
            status: "accepted",
            created_at: "2026-09-10T00:00:00Z",
            responded_at: "2026-09-09T00:00:00Z",
          },
        ],
      },
      now,
    );
    expect(bad.offers.medianHoursToAccept).toBe(4);
  });

  it("first-round fill counts only projects whose first round is resolved", () => {
    expect(m.offers.filledFirstRound).toEqual(ratio(1, 2)); // p1 yes, p2 no, p3 excluded
  });
});

describe("quality", () => {
  it("rating, first-try approval and would-hire-again", () => {
    expect(m.quality.averageRating).toBe(4.5);
    expect(m.quality.approvedWithoutRework).toEqual(ratio(1, 2)); // p2 needed 2 deliverables
    expect(m.quality.wouldHireAgain).toEqual(ratio(1, 2));
  });
});

describe("hiring signal", () => {
  it("counts every outcome type, including zeros", () => {
    expect(m.hiring.outcomeCounts.internship_interview).toBe(1);
    expect(m.hiring.outcomeCounts.job_offer).toBe(0);
  });

  it("share of students who completed a project and got an outcome", () => {
    expect(m.hiring.studentsWithOutcome).toEqual(ratio(1, 2)); // s1 of {s1, s2}
  });
});

describe("empty data", () => {
  it("returns null percentages instead of dividing by zero", () => {
    const empty = computeMetrics(
      {
        projects: [],
        businesses: [],
        students: [],
        submissions: [],
        offers: [],
        deliverables: [],
        feedback: [],
        outcomes: [],
      },
      now,
    );
    expect(empty.repeatBusiness.pct).toBeNull();
    expect(empty.demand.averageBudgetCents).toBeNull();
    expect(empty.offers.medianHoursToAccept).toBeNull();
  });
});
