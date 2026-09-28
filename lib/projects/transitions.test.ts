import { describe, expect, it } from "vitest";
import { PROJECT_STATUSES } from "@/lib/db/types";
import {
  TRANSITIONS,
  canTransition,
  manualTransitionsFrom,
  missingScopeFields,
} from "./transitions";

const scoped = {
  status: "scoping" as const,
  scoped_description: "Clean the list",
  deliverable: "CSV",
  required_skills: ["excel"],
  estimated_hours: 4,
  budget_cents: 20000,
  student_pay_cents: 15000,
  deadline: "2026-10-15",
};

describe("TRANSITIONS", () => {
  it("covers every status and only targets real statuses", () => {
    for (const s of PROJECT_STATUSES) {
      expect(TRANSITIONS[s]).toBeDefined();
      for (const to of TRANSITIONS[s]) expect(PROJECT_STATUSES).toContain(to);
    }
  });

  it("makes closed and cancelled terminal", () => {
    expect(TRANSITIONS.closed).toEqual([]);
    expect(TRANSITIONS.cancelled).toEqual([]);
  });
});

describe("canTransition", () => {
  it("allows a fully scoped project to go to matching", () => {
    expect(canTransition(scoped, "matching", { manual: true })).toEqual({ ok: true });
  });

  it("blocks matching and lists every missing scope field", () => {
    const result = canTransition(
      { ...scoped, deliverable: " ", required_skills: [], deadline: null },
      "matching",
      { manual: true },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons).toHaveLength(3);
  });

  it("blocks student pay above budget", () => {
    const result = canTransition({ ...scoped, student_pay_cents: 30000 }, "matching", {
      manual: true,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects transitions not in the graph", () => {
    expect(canTransition({ ...scoped, status: "submitted" }, "paid", { manual: true }).ok).toBe(
      false,
    );
    expect(canTransition({ ...scoped, status: "closed" }, "cancelled", { manual: true }).ok).toBe(
      false,
    );
  });

  it("rejects system-only transitions from a button but allows them as side effects", () => {
    const matching = { ...scoped, status: "matching" as const };
    expect(canTransition(matching, "offered", { manual: true }).ok).toBe(false);
    expect(canTransition(matching, "offered", { manual: false }).ok).toBe(true);
  });
});

describe("manualTransitionsFrom", () => {
  it("hides system-only transitions", () => {
    expect(manualTransitionsFrom("matching")).toEqual(["scoping", "cancelled"]);
    expect(manualTransitionsFrom("offered")).toEqual(["cancelled"]);
  });
});

describe("missingScopeFields", () => {
  it("returns nothing for a complete scope", () => {
    expect(missingScopeFields(scoped)).toEqual([]);
  });
});
