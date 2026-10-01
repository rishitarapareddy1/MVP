"use server";

import { revalidatePath } from "next/cache";
import { isId } from "@/lib/validation/id";
import { assessmentState, canSubmit } from "@/lib/assessments/eligibility";
import { requireStudent } from "@/lib/auth/session";
import { createSubmission, getAssessmentForStudent } from "@/lib/db/assessments";
import { BUCKETS, fileExists } from "@/lib/db/storage";
import { isPathInFolder } from "@/lib/storage/paths";
import { submissionUrlSchema } from "@/lib/validation/student";
import { fail, ok, type ActionResult } from "@/lib/result";

/**
 * Records a submission: either a file already uploaded to Storage by the
 * browser, or a link (Google Doc/Sheet, etc.).
 */
export async function submitAssessment(
  assessmentId: string,
  work: { path: string } | { url: string },
): Promise<ActionResult> {
  const me = await requireStudent();
  if (!isId(assessmentId)) return fail("Unknown assessment");

  const assessment = await getAssessmentForStudent(assessmentId, me.id);
  if (!assessment) return fail("This assessment isn't available.");
  if (!canSubmit(assessmentState(assessment.submissions))) {
    return fail("You can't submit this assessment right now.");
  }

  let file: { submission_path: string } | { submission_url: string };
  if ("path" in work) {
    const folder = `${me.id}/${assessmentId}`;
    if (!isPathInFolder(work.path, folder) || !(await fileExists(BUCKETS.submissions, work.path))) {
      return fail("Upload not found. Please try again.");
    }
    file = { submission_path: work.path };
  } else {
    const url = submissionUrlSchema.safeParse(work.url);
    if (!url.success) return fail(url.error.issues[0].message);
    file = { submission_url: url.data };
  }

  try {
    await createSubmission(me.id, assessmentId, file);
  } catch (error) {
    // Most likely the database's retake rule (e.g. a double click).
    console.error("createSubmission failed", error);
    return fail("We couldn't save your submission. Refresh the page and try again.");
  }

  revalidatePath(`/student/assessments/${assessmentId}`);
  revalidatePath("/student/assessments");
  revalidatePath("/student");
  return ok(undefined);
}
