"use server";

import { revalidatePath } from "next/cache";
import { isId } from "@/lib/validation/id";
import { passOrFail, readRubric, scoreRubric } from "@/lib/assessments/rubric";
import { requireAdmin } from "@/lib/auth/session";
import { getPendingSubmission, gradeSubmission } from "@/lib/db/assessments";
import { fail, ok, type ActionResult } from "@/lib/result";

/** Score inputs are named "score:<criterion>" so any rubric shape works. */
const SCORE_PREFIX = "score:";

export async function grade(
  submissionId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isId(submissionId)) return fail("Unknown submission");

  const submission = await getPendingSubmission(submissionId);
  if (!submission?.assessment) return fail("Submission not found");
  if (submission.status !== "submitted") return fail("This submission was already graded.");

  const rubric = readRubric(submission.assessment.rubric);
  const raw: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (key.startsWith(SCORE_PREFIX)) raw[key.slice(SCORE_PREFIX.length)] = String(value);
  }

  const scored = scoreRubric(rubric, raw);
  if (!scored.ok) {
    // Re-key errors to the input names so the form can highlight them.
    const fieldErrors = Object.fromEntries(
      Object.entries(scored.errors).map(([criterion, msg]) => [SCORE_PREFIX + criterion, msg]),
    );
    return fail("Fix the highlighted scores.", fieldErrors);
  }

  const notes = String(formData.get("grader_notes") ?? "")
    .trim()
    .slice(0, 2000);
  // Pass/fail comes from the threshold, never picked by hand, so every
  // decision is explainable from the rubric scores.
  const saved = await gradeSubmission(submissionId, {
    rubric_scores: scored.scores,
    total_score: scored.total,
    status: passOrFail(scored.total, submission.assessment.pass_threshold),
    grader_notes: notes || null,
  });
  if (!saved) return fail("Someone already graded this submission.");

  revalidatePath("/admin/submissions");
  revalidatePath("/admin");
  return ok(undefined);
}
