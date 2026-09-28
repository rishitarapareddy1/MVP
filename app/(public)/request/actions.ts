"use server";

import { redirect } from "next/navigation";
import { createIntakeRequest } from "@/lib/db/intake";
import { HONEYPOT_FIELD, intakeSchema } from "@/lib/validation/intake";
import { fail, failValidation, type ActionResult } from "@/lib/result";

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
    await createIntakeRequest(parsed.data);
  } catch (error) {
    console.error("createIntakeRequest failed", error);
    return fail("Something went wrong saving your request. Please try again.");
  }
  // Outside the try: redirect() works by throwing.
  redirect("/request/thanks");
}
