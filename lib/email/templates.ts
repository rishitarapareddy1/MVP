import { BRAND } from "@/lib/brand";
import { CODE_TTL_MINUTES } from "@/lib/students/verification";

// Email templates. Each returns { subject, text, html }: a plain-text version
// for clients that don't render HTML, and simple inline-styled HTML.
// Anything a user typed (titles, names, notes) goes through escapeHtml so it
// can't break the markup or inject content.

export type EmailContent = { subject: string; text: string; html: string };

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Shared wrapper: brand line, body, optional button, quiet footer. */
function layout(bodyHtml: string, button?: { href: string; label: string }): string {
  const cta = button
    ? `<p style="margin: 24px 0">
         <a href="${escapeHtml(button.href)}"
            style="background:#1e2f5c;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
           ${escapeHtml(button.label)}
         </a>
       </p>`
    : "";
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 520px; color: #1f2937; line-height: 1.5">
      <p style="font-weight: 700; color: #1e2f5c">${escapeHtml(BRAND.name)}</p>
      ${bodyHtml}
      ${cta}
      <p style="color: #6b7280; font-size: 13px; margin-top: 32px">
        You're getting this because of a project on ${escapeHtml(BRAND.name)}.
      </p>
    </div>`;
}

/** Verification code email. Plain and short so it doesn't look like spam. */
export function verificationCodeEmail(code: string): EmailContent {
  const subject = `Your ${BRAND.name} verification code: ${code}`;
  const text = [
    `Your verification code is ${code}`,
    "",
    `Enter it on your ${BRAND.name} profile to confirm this university email. It expires in ${CODE_TTL_MINUTES} minutes.`,
    "",
    "If you didn't request this, you can ignore this email.",
  ].join("\n");
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px">
      <p>Your verification code is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px">${code}</p>
      <p>Enter it on your ${BRAND.name} profile to confirm this university email.
         It expires in ${CODE_TTL_MINUTES} minutes.</p>
      <p style="color: #666">If you didn't request this, you can ignore this email.</p>
    </div>`;
  return { subject, text, html };
}

/** To a student: they've been offered a project. */
export function newOfferEmail(o: {
  firstName: string | null;
  projectTitle: string;
  pay: string | null;
  deadline: string | null;
  respondBy: string;
  note: string | null;
  url: string;
}): EmailContent {
  const greeting = o.firstName ? `Hi ${o.firstName},` : "Hi,";
  const facts = [
    o.pay && `You'd earn: ${o.pay}`,
    o.deadline && `Due: ${o.deadline}`,
    `Respond by: ${o.respondBy}`,
  ].filter(Boolean) as string[];

  const text = [
    greeting,
    "",
    `You've been offered a project: ${o.projectTitle}`,
    "",
    ...facts,
    ...(o.note ? ["", `A note for you: ${o.note}`] : []),
    "",
    "Up to 3 students get each offer, and the first to accept gets the project.",
    `View and respond: ${o.url}`,
  ].join("\n");

  const html = layout(
    `<p>${escapeHtml(greeting)}</p>
     <p>You've been offered a project:</p>
     <p style="font-size: 18px; font-weight: 600">${escapeHtml(o.projectTitle)}</p>
     <ul style="padding-left: 18px">${facts.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
     ${o.note ? `<p style="background:#fef3e2;padding:12px;border-radius:8px"><strong>A note for you:</strong> ${escapeHtml(o.note)}</p>` : ""}
     <p>Up to 3 students get each offer, and the first to accept gets the project.</p>`,
    { href: o.url, label: "View offer" },
  );

  return { subject: `New project offer: ${o.projectTitle}`, text, html };
}

/** To the admin: a student accepted an offer. */
export function offerAcceptedEmail(o: {
  studentName: string;
  projectTitle: string;
  url: string;
}): EmailContent {
  const text = [
    `${o.studentName} accepted "${o.projectTitle}".`,
    "",
    "Any other pending offers for this project were withdrawn automatically.",
    `Open the project: ${o.url}`,
  ].join("\n");
  const html = layout(
    `<p><strong>${escapeHtml(o.studentName)}</strong> accepted
       <strong>${escapeHtml(o.projectTitle)}</strong>.</p>
     <p>Any other pending offers for this project were withdrawn automatically.</p>`,
    { href: o.url, label: "Open project" },
  );
  return { subject: `Offer accepted: ${o.projectTitle}`, text, html };
}

/** To a business: please tell us how the project went. */
export function feedbackRequestEmail(o: {
  contactName: string;
  projectTitle: string;
  studentFirstName: string | null;
  url: string;
}): EmailContent {
  const who = o.studentFirstName ?? "your student";
  const text = [
    `Hi ${o.contactName},`,
    "",
    `Thanks for working with us on "${o.projectTitle}". Could you tell us how ${who} did? It takes about a minute.`,
    "",
    `Leave feedback: ${o.url}`,
    "",
    "Your answers help us match you with great students next time.",
  ].join("\n");
  const html = layout(
    `<p>Hi ${escapeHtml(o.contactName)},</p>
     <p>Thanks for working with us on <strong>${escapeHtml(o.projectTitle)}</strong>.
        Could you tell us how ${escapeHtml(who)} did? It takes about a minute.</p>`,
    { href: o.url, label: "Leave feedback" },
  );
  return { subject: `How did ${who} do on ${o.projectTitle}?`, text, html };
}
