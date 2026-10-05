"use server";

import { submitFeedback, type FeedbackResult } from "@/lib/db/feedback";
import { HONEYPOT_FIELD } from "@/lib/validation/intake";
import { feedbackSchema, feedbackTokenSchema } from "@/lib/validation/feedback";
import { fail, failValidation, ok, type ActionResult } from "@/lib/result";

const MESSAGES: Record<Exclude<FeedbackResult, "submitted">, string> = {
  not_ready: "This feedback form isn't open yet.",
  already_submitted: "Feedback for this project has already been submitted. Thank you!",
  not_found: "This feedback link isn't valid.",
};

/** Public: the business isn't logged in. The token is the only credential. */
export async function sendFeedback(
  token: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!feedbackTokenSchema.safeParse(token).success) return fail(MESSAGES.not_found);
  // Bot filled the hidden field: pretend success, save nothing.
  if (formData.get(HONEYPOT_FIELD)) return ok(undefined);

  const parsed = feedbackSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failValidation(parsed.error);

  const result = await submitFeedback(token, parsed.data);
  return result === "submitted" ? ok(undefined) : fail(MESSAGES[result]);
}
