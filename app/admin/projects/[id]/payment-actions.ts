"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { deletePayment, recordPayment } from "@/lib/db/payments";
import { isId } from "@/lib/validation/id";
import { paymentSchema } from "@/lib/validation/payment";
import { fail, failValidation, ok, type ActionResult } from "@/lib/result";

export async function recordPaymentAction(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isId(projectId)) return fail("Unknown project");
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failValidation(parsed.error);

  await recordPayment(projectId, parsed.data);
  revalidatePath(`/admin/projects/${projectId}`);
  return ok(undefined);
}

/** For fixing mistakes. Payments are records of money that moved outside the app. */
export async function deletePaymentAction(
  projectId: string,
  paymentId: string,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isId(projectId) || !isId(paymentId)) return fail("Unknown payment");
  await deletePayment(paymentId);
  revalidatePath(`/admin/projects/${projectId}`);
  return ok(undefined);
}
