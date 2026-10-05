"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/session";
import { startProject, submitDeliverable } from "@/lib/db/delivery";
import { BUCKETS, fileExists } from "@/lib/db/storage";
import { isPathInFolder } from "@/lib/storage/paths";
import { isId } from "@/lib/validation/id";
import { submissionUrlSchema } from "@/lib/validation/student";
import { fail, ok, type ActionResult } from "@/lib/result";

export async function markStarted(projectId: string): Promise<ActionResult> {
  await requireStudent();
  if (!isId(projectId)) return fail("Project not found.");

  const result = await startProject(projectId);
  if (result !== "started") {
    return fail(
      result === "wrong_status" ? "This project has already started." : "Project not found.",
    );
  }
  revalidatePath(`/student/projects/${projectId}`);
  revalidatePath("/student");
  return ok(undefined);
}

const DELIVER_ERRORS: Record<string, string> = {
  wrong_status: "This project isn't accepting a deliverable right now.",
  missing: "Attach a file or a link.",
  bad_path: "Upload not found. Please try again.",
  bad_url: "Links must start with http:// or https://.",
  not_found: "Project not found.",
};

/** Called after any file upload to Storage has finished in the browser. */
export async function deliver(
  projectId: string,
  work: { path?: string; url?: string; note: string },
): Promise<ActionResult> {
  const me = await requireStudent();
  if (!isId(projectId)) return fail("Project not found.");

  let filePath: string | null = null;
  let url: string | null = null;
  if (work.path) {
    if (
      !isPathInFolder(work.path, `${me.id}/${projectId}`) ||
      !(await fileExists(BUCKETS.deliverables, work.path))
    ) {
      return fail("Upload not found. Please try again.");
    }
    filePath = work.path;
  } else {
    const parsed = submissionUrlSchema.safeParse(work.url ?? "");
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    url = parsed.data;
  }

  const note = work.note.trim().slice(0, 2000) || null;
  const result = await submitDeliverable(projectId, { file_path: filePath, url, note });
  if (result !== "delivered") return fail(DELIVER_ERRORS[result]);

  revalidatePath(`/student/projects/${projectId}`);
  revalidatePath("/student");
  return ok(undefined);
}
