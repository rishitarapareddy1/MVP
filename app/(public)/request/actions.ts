"use server";

import { redirect } from "next/navigation";
import { createIntakeRequest, recentIntakeCounts } from "@/lib/db/intake";
import { HONEYPOT_FIELD, intakeLimitReason, intakeSchema } from "@/lib/validation/intake";
import { fail, failValidation, type ActionResult } from "@/lib/result";
import { reportError } from "@/lib/errors/report";

export async function submitIntake(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // Honeypot filled in = almost certainly a bot. Pretend it worked so the
  // bot gets no signal, but save nothing.
  if (formData.get(HONEYPOT_FIELD)) redirect("/request/thanks");

  const parsed = intakeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failValidation(parsed.error);

  try {
    const limited = intakeLimitReason(await recentIntakeCounts(parsed.data.contact_email));
    if (limited) return fail(limited);
    await createIntakeRequest(parsed.data);
  } catch (error) {
    await reportError("intake form", error);
    return fail("Something went wrong saving your request. Please try again.");
  }
  // Outside the try: redirect() works by throwing.
  redirect("/request/thanks");
}
