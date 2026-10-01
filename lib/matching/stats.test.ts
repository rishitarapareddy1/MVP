import { describe, expect, it } from "vitest";
import { buildStudentStats, type StatsRows } from "./stats";

const base: StatsRows = {
  students: [
    {
      id: "s1",
      is_active: true,
      is_available: true,
      skills: ["excel"],
      interested_categories: [],
      hours_per_week: 5,
    },
    {
      id: "s2",
      is_active: true,
      is_available: true,
      skills: [],
      interested_categories: [],
      hours_per_week: null,
    },
  ],
  passedSubmissions: [
    { student_id: "s1", total_score: 70, category: "data_cleanup" },
    { student_id: "s1", total_score: 90, category: "data_cleanup" },
    { student_id: "s1", total_score: 80, category: "lead_research" },
    { student_id: "s2", total_score: 60, category: "data_cleanup" },
  ],
  assignedProjects: [
    { id: "p1", category: "data_cleanup", status: "closed", assigned_student_id: "s1" },
    { id: "p2", category: "data_cleanup", status: "paid", assigned_student_id: "s1" },
    { id: "p3", category: "lead_research", status: "approved", assigned_student_id: "s1" },
    { id: "p4", category: "data_cleanup", status: "in_progress", assigned_student_id: "s1" },
    { id: "p5", category: "data_cleanup", status: "delivered", assigned_student_id: "s1" },
    { id: "p6", category: "data_cleanup", status: "assigned", assigned_student_id: "s2" },
  ],
  ratings: [
    { student_id: "s1", rating: 5 },
    { student_id: "s1", rating: 4 },
  ],
  offers: [
    { student_id: "s1", project_id: "p9" },
    { student_id: "s2", project_id: "p9" },
    { student_id: "s2", project_id: "p8" },
  ],
};

describe("buildStudentStats", () => {
  const [s1, s2] = buildStudentStats(base);

  it("keeps the best passed score per category", () => {
    expect(s1.passedAssessments).toEqual([
      { category: "data_cleanup", score: 90 },
      { category: "lead_research", score: 80 },
    ]);
  });

  it("counts completed (approved/paid/closed) overall and per category", () => {
    expect(s1.completedProjects).toBe(3);
    expect(s1.completedByCategory).toEqual({ data_cleanup: 2, lead_research: 1 });
  });

  it("counts only assigned/in_progress as active", () => {
    expect(s1.activeProjects).toBe(1); // delivered isn't active
    expect(s2.activeProjects).toBe(1);
  });

  it("averages ratings, or null when unrated", () => {
    expect(s1.averageRating).toBe(4.5);
    expect(s2.averageRating).toBeNull();
  });

  it("collects every project the student was offered", () => {
    expect(s2.offeredProjectIds).toEqual(["p9", "p8"]);
  });
});
