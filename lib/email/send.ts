import "server-only";
import { BRAND } from "@/lib/brand";
import { getTransporter } from "./transport";

/**
 * Sends app emails (verification codes and notifications) through Gmail
 * SMTP: the same account Supabase uses for login codes. To switch to another
 * provider (e.g. Resend), change lib/email/transport.ts.
 */
export async function sendEmail(message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const info = await getTransporter().sendMail({
    from: { name: BRAND.name, address: process.env.SMTP_USER! },
    ...message,
  });
  // One line per email, so deliverability problems can be traced in the logs.
  // "accepted" means Gmail took it; delivery after that is up to the recipient.
  console.log("email sent", {
    subject: message.subject,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });
  const rejected = info.rejected ?? [];
  if (rejected.length > 0) {
    throw new Error(`Email rejected for: ${rejected.join(", ")}`);
  }
}
