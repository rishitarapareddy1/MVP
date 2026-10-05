"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createOutcome } from "@/lib/db/outcomes";
import { isId } from "@/lib/validation/id";
import { outcomeSchema } from "@/lib/validation/outcome";
import { fail, failValidation, ok, type ActionResult } from "@/lib/result";

export async function recordOutcome(
  studentId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isId(studentId)) return fail("Unknown student");
  const parsed = outcomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failValidation(parsed.error);

  const saved = await createOutcome(studentId, parsed.data);
  if (!saved) return fail("That project isn't one of this student's projects.");

  revalidatePath(`/admin/students/${studentId}`);
  return ok(undefined);
}
