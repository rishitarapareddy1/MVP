import type { Project, ProjectStatus } from "@/lib/db/types";

/**
 * The single source of truth for project status changes (spec section 7).
 * Every status change must pass canTransition() on the server.
 */
export const TRANSITIONS: Record<ProjectStatus, readonly ProjectStatus[]> = {
  submitted: ["scoping", "cancelled"],
  scoping: ["matching", "cancelled"],
  matching: ["scoping", "offered", "cancelled"], // back to scoping if the scope needs rework
  offered: ["matching", "assigned", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["delivered", "cancelled"],
  delivered: ["approved", "in_progress", "cancelled"], // back to in_progress = rework
  approved: ["paid"], // money is moving; no cancelling from here on
  paid: ["closed"],
  closed: [],
  cancelled: [],
};

/**
 * Transitions that only happen as a side effect of another action, never
 * from a plain status button:
 *   matching -> offered      sending offers (Phase 4)
 *   offered  -> assigned     a student accepts (Phase 4)
 *   offered  -> matching     all offers declined or expired (Phase 4)
 *   in_progress -> delivered the student uploads a deliverable (Phase 5)
 */
const SYSTEM_ONLY = new Set<string>([
  "matching>offered",
  "offered>assigned",
  "offered>matching",
  "in_progress>delivered",
]);

export function isManualTransition(from: ProjectStatus, to: ProjectStatus): boolean {
  return TRANSITIONS[from].includes(to) && !SYSTEM_ONLY.has(`${from}>${to}`);
}

/** Status buttons the admin should see for a project in this status. */
export function manualTransitionsFrom(from: ProjectStatus): ProjectStatus[] {
  return TRANSITIONS[from].filter((to) => isManualTransition(from, to));
}

type ScopeFields = Pick<
  Project,
  | "scoped_description"
  | "deliverable"
  | "required_skills"
  | "estimated_hours"
  | "budget_cents"
  | "student_pay_cents"
  | "deadline"
>;

/** Scope fields that must be filled in before a project can go to matching. */
export function missingScopeFields(p: ScopeFields): string[] {
  const missing: string[] = [];
  if (!p.scoped_description?.trim()) missing.push("scoped description");
  if (!p.deliverable?.trim()) missing.push("deliverable");
  if (p.required_skills.length === 0) missing.push("at least one required skill");
  if (!p.estimated_hours) missing.push("estimated hours");
  if (p.budget_cents == null) missing.push("budget");
  if (p.student_pay_cents == null) missing.push("student pay");
  if (!p.deadline) missing.push("deadline");
  return missing;
}

export type TransitionCheck = { ok: true } | { ok: false; reasons: string[] };

/**
 * Can this project move to `to`? Checks the transition graph plus any
 * preconditions. `manual` = triggered by a status button (vs. a side effect).
 */
export function canTransition(
  project: ScopeFields & Pick<Project, "status">,
  to: ProjectStatus,
  { manual }: { manual: boolean },
): TransitionCheck {
  const from = project.status;
  if (!TRANSITIONS[from].includes(to)) {
    return { ok: false, reasons: [`Can't move from ${from} to ${to}`] };
  }
  if (manual && !isManualTransition(from, to)) {
    return { ok: false, reasons: [`${from} → ${to} happens automatically, not by hand`] };
  }

  if (to === "matching") {
    const missing = missingScopeFields(project);
    if (missing.length > 0) return { ok: false, reasons: missing.map((m) => `Missing ${m}`) };
    if (project.student_pay_cents! > project.budget_cents!) {
      return { ok: false, reasons: ["Student pay can't be more than the budget"] };
    }
  }
  // Phase 5 adds: approved -> paid requires both payments recorded.

  return { ok: true };
}

/** Scope can be edited until offers go out; after that students have seen it. */
export function isScopeEditable(status: ProjectStatus): boolean {
  return status === "submitted" || status === "scoping" || status === "matching";
}
