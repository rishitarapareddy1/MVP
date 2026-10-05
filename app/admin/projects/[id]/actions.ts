"use server";

import { revalidatePath } from "next/cache";
import { isId } from "@/lib/validation/id";
import { requireAdmin } from "@/lib/auth/session";
import { listProjectPayments } from "@/lib/db/payments";
import { getProjectDetail, setProjectStatus, updateProjectScope } from "@/lib/db/projects";
import { canTransition, isScopeEditable } from "@/lib/projects/transitions";
import { STATUS_LABELS } from "@/lib/projects/labels";
import { scopeSchema, statusChangeSchema } from "@/lib/validation/project";
import { fail, failValidation, ok, type ActionResult } from "@/lib/result";

// Server actions are public HTTP endpoints, so each one re-checks admin
// access itself instead of trusting that the page already did.

export async function saveScope(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isId(projectId)) return fail("Unknown project");

  const parsed = scopeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failValidation(parsed.error);

  const project = await getProjectDetail(projectId);
  if (!project) return fail("Project not found");
  if (!isScopeEditable(project.status)) {
    return fail(
      `Scope is locked once a project is ${STATUS_LABELS[project.status].toLowerCase()}.`,
    );
  }

  await updateProjectScope(projectId, parsed.data);
  revalidatePath(`/admin/projects/${projectId}`);
  return ok(undefined);
}

export async function changeStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = statusChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid status change");
  const { project_id, to } = parsed.data;

  const project = await getProjectDetail(project_id);
  if (!project) return fail("Project not found");

  const payments = to === "paid" ? await listProjectPayments(project_id) : [];
  const check = canTransition(project, to, {
    manual: true,
    paymentDirections: payments.map((p) => p.direction),
  });
  if (!check.ok) return fail(check.reasons.join(". "));

  const changed = await setProjectStatus(project_id, project.status, to);
  if (!changed)
    return fail("This project changed while you were viewing it. Refresh and try again.");

  revalidatePath(`/admin/projects/${project_id}`);
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  return ok(undefined);
}
