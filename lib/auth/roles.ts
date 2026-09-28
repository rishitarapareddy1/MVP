import { parseList } from "@/lib/env";

// Pure role checks. The lists default to env vars but can be passed in, which
// keeps these functions easy to unit test.

function emailDomain(email: string): string {
  return email.trim().toLowerCase().split("@").pop() ?? "";
}

export function isAdminEmail(
  email: string,
  adminEmails: string[] = parseList(process.env.ADMIN_EMAILS),
): boolean {
  return adminEmails.includes(email.trim().toLowerCase());
}

/** Exact domain match: "illinois.edu" allows "a@illinois.edu", not "a@cs.illinois.edu". */
export function isAllowedStudentEmail(
  email: string,
  allowedDomains: string[] = parseList(process.env.ALLOWED_STUDENT_EMAIL_DOMAINS),
): boolean {
  return allowedDomains.includes(emailDomain(email));
}

/** Who may request a magic link at all: admins plus allowed student domains. */
export function canLogIn(email: string): boolean {
  return isAdminEmail(email) || isAllowedStudentEmail(email);
}
