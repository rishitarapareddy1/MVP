import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { parseList } from "@/lib/env";

/**
 * University email verification for students who log in with another
 * address (e.g. Gmail). Pure helpers, so the rules are unit-tested.
 */

export const CODE_TTL_MINUTES = 15;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_SENDS_PER_HOUR = 5;

/** Domains that prove someone is a student. Defaults to illinois.edu. */
export function universityDomains(): string[] {
  const configured = parseList(process.env.UNIVERSITY_EMAIL_DOMAINS);
  return configured.length ? configured : ["illinois.edu"];
}

export function isUniversityEmail(email: string, domains: string[] = universityDomains()): boolean {
  const domain = email.trim().toLowerCase().split("@").pop() ?? "";
  return domains.includes(domain);
}

/** Verified if they log in with a university address, or confirmed one by code. */
export function isVerifiedStudent(
  loginEmail: string,
  universityEmailVerifiedAt: string | null,
  domains: string[] = universityDomains(),
): boolean {
  return isUniversityEmail(loginEmail, domains) || universityEmailVerifiedAt !== null;
}

/** A random 6-digit code, zero-padded (e.g. "048213"). */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Codes are stored hashed and salted with the student id, never in plain text. */
export function hashCode(code: string, studentId: string): string {
  return createHash("sha256").update(`${studentId}:${code.trim()}`).digest("hex");
}

export function codeMatches(code: string, studentId: string, storedHash: string): boolean {
  const a = Buffer.from(hashCode(code, studentId), "hex");
  const b = Buffer.from(storedHash, "hex");
  // Constant-time comparison so response timing doesn't leak anything.
  return a.length === b.length && timingSafeEqual(a, b);
}

export type SendWindow = {
  last_sent_at: string;
  window_started_at: string;
  sends_in_window: number;
};

/**
 * Rate limit for sending codes: one per minute, five per hour. Returns null
 * if a send is allowed, otherwise a message for the student.
 */
export function sendBlockedReason(
  existing: SendWindow | null,
  now: Date = new Date(),
): string | null {
  if (!existing) return null;
  const sinceLast = (now.getTime() - Date.parse(existing.last_sent_at)) / 1000;
  if (sinceLast < RESEND_COOLDOWN_SECONDS) {
    return `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - sinceLast)} seconds before requesting another code.`;
  }
  const windowAge = (now.getTime() - Date.parse(existing.window_started_at)) / 3_600_000;
  if (windowAge < 1 && existing.sends_in_window >= MAX_SENDS_PER_HOUR) {
    return "Too many codes requested. Please try again in an hour.";
  }
  return null;
}
