"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { setStudentActive } from "@/lib/db/students";
import { isId } from "@/lib/validation/id";
import { fail, ok, type ActionResult } from "@/lib/result";

export async function toggleStudentActive(
  studentId: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isId(studentId)) return fail("Unknown student");
  await setStudentActive(studentId, isActive);
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
  return ok(undefined);
}
