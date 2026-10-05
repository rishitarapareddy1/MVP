"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { markFollowedUp } from "@/lib/db/feedback";
import { isId } from "@/lib/validation/id";
import { fail, ok, type ActionResult } from "@/lib/result";

export async function markFollowedUpAction(feedbackId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isId(feedbackId)) return fail("Unknown feedback");
  await markFollowedUp(feedbackId);
  revalidatePath("/admin");
  return ok(undefined);
}
