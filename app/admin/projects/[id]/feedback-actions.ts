"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getFeedbackEmailContext, recordFeedbackLinkSent } from "@/lib/db/notifications";
import { sendEmail } from "@/lib/email/send";
import { feedbackRequestEmail } from "@/lib/email/templates";
import { getSiteOrigin } from "@/lib/site";
import { isId } from "@/lib/validation/id";
import { fail, ok, type ActionResult } from "@/lib/result";

/**
 * Admin clicks "Email feedback link": sends the business its private
 * feedback link. Unlike automatic notifications, the email IS the action,
 * so a failed send is reported as a failure.
 */
export async function emailFeedbackLink(projectId: string): Promise<ActionResult<{ to: string }>> {
  const admin = await requireAdmin();
  if (!isId(projectId)) return fail("Unknown project");

  const project = await getFeedbackEmailContext(projectId);
  if (!project) return fail("Project not found");
  if (project.status !== "paid") return fail("The feedback link opens once the project is Paid.");
  if (project.feedback) return fail("This business has already left feedback.");
  const to = project.business?.contact_email;
  if (!to) return fail("This business has no contact email.");

  const origin = await getSiteOrigin();
  try {
    await sendEmail({
      to,
      ...feedbackRequestEmail({
        contactName: project.business!.contact_name,
        projectTitle: project.title,
        studentFirstName: project.student?.profile?.full_name?.split(" ")[0] ?? null,
        url: `${origin}/feedback/${project.feedback_token}`,
      }),
    });
  } catch (error) {
    console.error("feedback email failed", error);
    return fail("The email didn't send. Try again, or copy the link and email it yourself.");
  }

  await recordFeedbackLinkSent(projectId, admin.id, to);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
  return ok({ to });
}
