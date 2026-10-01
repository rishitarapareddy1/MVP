"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/session";
import { getOwnStudent, setResumePath, updateOwnStudentProfile } from "@/lib/db/students";
import { BUCKETS, fileExists, removeFile } from "@/lib/db/storage";
import { isPathInFolder } from "@/lib/storage/paths";
import { formDataToObject, studentProfileSchema } from "@/lib/validation/student";
import { fail, failValidation, ok, type ActionResult } from "@/lib/result";

export async function saveProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const me = await requireStudent();
  const parsed = studentProfileSchema.safeParse(
    formDataToObject(formData, ["interested_categories"]),
  );
  if (!parsed.success) return failValidation(parsed.error);

  await updateOwnStudentProfile(me.id, parsed.data);
  revalidatePath("/student", "layout");
  return ok(undefined);
}

/** Called after the browser has uploaded the PDF to Storage. */
export async function saveResume(path: string): Promise<ActionResult> {
  const me = await requireStudent();
  if (!isPathInFolder(path, me.id) || !(await fileExists(BUCKETS.resumes, path))) {
    return fail("Upload not found. Please try again.");
  }

  const previous = (await getOwnStudent(me.id)).resume_path;
  await setResumePath(me.id, path);
  // Delete the old file only after the new path is saved.
  if (previous && previous !== path) await removeFile(BUCKETS.resumes, previous).catch(() => {});

  revalidatePath("/student/profile");
  return ok(undefined);
}

export async function removeResume(): Promise<ActionResult> {
  const me = await requireStudent();
  const previous = (await getOwnStudent(me.id)).resume_path;
  await setResumePath(me.id, null);
  if (previous) await removeFile(BUCKETS.resumes, previous).catch(() => {});

  revalidatePath("/student/profile");
  return ok(undefined);
}
