"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isId } from "@/lib/validation/id";
import { requireAdmin } from "@/lib/auth/session";
import {
  createAssessment,
  getAssessment,
  setAssessmentResource,
  updateAssessment,
} from "@/lib/db/assessments";
import { BUCKETS, fileExists, removeFile } from "@/lib/db/storage";
import { isPathInFolder } from "@/lib/storage/paths";
import { assessmentSchema } from "@/lib/validation/assessment";
import { fail, failValidation, ok, type ActionResult } from "@/lib/result";

/** Create (id = null) or update an assessment template. */
export async function saveAssessment(
  id: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  if (id !== null && !isId(id)) return fail("Unknown assessment");

  const parsed = assessmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failValidation(parsed.error);

  if (id === null) {
    const newId = await createAssessment(parsed.data);
    revalidatePath("/admin/assessments");
    // Go to the edit page so the admin can attach a starter file.
    redirect(`/admin/assessments/${newId}`);
  }

  await updateAssessment(id, parsed.data);
  revalidatePath("/admin/assessments");
  revalidatePath(`/admin/assessments/${id}`);
  return ok(undefined);
}

/** Called after the browser has uploaded the starter file to Storage. */
export async function saveResource(assessmentId: string, path: string): Promise<ActionResult> {
  await requireAdmin();
  const assessment = await getAssessment(assessmentId);
  if (!assessment) return fail("Unknown assessment");
  if (
    !isPathInFolder(path, assessmentId) ||
    !(await fileExists(BUCKETS.assessmentResources, path))
  ) {
    return fail("Upload not found. Please try again.");
  }

  await setAssessmentResource(assessmentId, path);
  if (assessment.resource_path && assessment.resource_path !== path) {
    await removeFile(BUCKETS.assessmentResources, assessment.resource_path).catch(() => {});
  }
  revalidatePath(`/admin/assessments/${assessmentId}`);
  return ok(undefined);
}

export async function removeResource(assessmentId: string): Promise<ActionResult> {
  await requireAdmin();
  const assessment = await getAssessment(assessmentId);
  if (!assessment) return fail("Unknown assessment");

  await setAssessmentResource(assessmentId, null);
  if (assessment.resource_path) {
    await removeFile(BUCKETS.assessmentResources, assessment.resource_path).catch(() => {});
  }
  revalidatePath(`/admin/assessments/${assessmentId}`);
  return ok(undefined);
}
