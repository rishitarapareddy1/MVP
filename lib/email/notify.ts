import "server-only";
import { parseList } from "@/lib/env";
import { formatCents, formatDateOnly, formatDateTime } from "@/lib/format";
import { getSiteOrigin } from "@/lib/site";
import { listPendingOffersForEmail } from "@/lib/db/notifications";
import { sendEmail } from "./send";
import { newOfferEmail, offerAcceptedEmail } from "./templates";
import { reportError } from "@/lib/errors/report";

/**
 * Automatic notifications. These never throw: the action that triggered them
 * (sending offers, accepting) has already succeeded, so a failed email is
 * logged and reported back as a count instead of undoing anything.
 */

/** Emails every student with a pending offer on this project. Returns how many failed. */
export async function notifyOffersSent(
  projectId: string,
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  try {
    const origin = await getSiteOrigin();
    const offers = await listPendingOffersForEmail(projectId);
    // Send in parallel; one bad address shouldn't hold up the others.
    const results = await Promise.allSettled(
      // async so a missing address becomes one rejected promise, not a crash.
      offers.map(async (o) => {
        const email = o.student?.profile?.email;
        if (!email || !o.project) throw new Error("missing student email or project");
        return sendEmail({
          to: email,
          ...newOfferEmail({
            firstName: o.student?.profile?.full_name?.split(" ")[0] ?? null,
            projectTitle: o.project.title,
            pay:
              o.project.student_pay_cents != null ? formatCents(o.project.student_pay_cents) : null,
            deadline: o.project.deadline ? formatDateOnly(o.project.deadline) : null,
            respondBy: formatDateTime(o.expires_at),
            note: o.admin_note,
            url: `${origin}/student/offers/${o.id}`,
          }),
        });
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled") sent++;
      else {
        failed++;
        await reportError("offer email", r.reason, { projectId });
      }
    }
  } catch (error) {
    await reportError("offer emails", error, { projectId });
    failed++;
  }
  return { sent, failed };
}

/** Emails the admins that a student accepted a project. */
export async function notifyOfferAccepted(details: {
  studentName: string;
  projectTitle: string;
  projectId: string;
}): Promise<void> {
  const admins = parseList(process.env.ADMIN_EMAILS);
  if (admins.length === 0) return;
  try {
    const origin = await getSiteOrigin();
    await sendEmail({
      to: admins.join(", "),
      ...offerAcceptedEmail({
        studentName: details.studentName,
        projectTitle: details.projectTitle,
        url: `${origin}/admin/projects/${details.projectId}`,
      }),
    });
  } catch (error) {
    await reportError("offer accepted email", error, { projectId: details.projectId });
  }
}
