import { z } from "zod";
import { optionalText } from "./common";
import { PROJECT_CATEGORIES } from "@/lib/db/types";
import { BUDGET_RANGES, SOURCES } from "@/lib/projects/labels";
import { todayInChicago } from "@/lib/format";

// Name of the hidden honeypot field. Real people never see or fill it;
// naive spam bots fill every input. Deliberately boring so bots don't skip it.
export const HONEYPOT_FIELD = "company_fax";

export const intakeSchema = z.object({
  business_name: z.string().trim().min(1, "Enter your business name").max(200),
  // Accept "example.com" as well as full URLs; store with a scheme.
  website: optionalText(300).pipe(
    z
      .string()
      .nullable()
      // Add https:// only when there's no scheme at all, so "ftp://..."
      // stays as-is and is rejected below instead of becoming "https://ftp://...".
      .transform((v) => (v && !/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? `https://${v}` : v))
      // http(s) only: the admin sees this as a clickable link.
      .pipe(
        z
          .url({ protocol: /^https?$/, message: "Enter a valid website, like example.com" })
          .nullable(),
      ),
  ),
  contact_name: z.string().trim().min(1, "Enter your name").max(120),
  contact_email: z.email("Enter a valid email address").trim().toLowerCase(),
  contact_phone: optionalText(30),
  description: z
    .string()
    .trim()
    .min(20, "Please describe the task in at least a sentence or two")
    .max(5000),
  // "not_sure" is stored as 'other'; the admin sets the real category while scoping.
  category: z.enum([...PROJECT_CATEGORIES, "not_sure"], { error: "Pick a category" }),
  budget_range: z.enum(BUDGET_RANGES, { error: "Pick a budget range" }),
  deadline: z
    .union([z.literal(""), z.iso.date("Enter a valid date")])
    .transform((v) => v || null)
    // YYYY-MM-DD strings compare correctly as plain strings.
    .refine((v) => v === null || v >= todayInChicago(), "Pick a date that isn't in the past"),
  source: z.enum(SOURCES, { error: "Let us know how you heard about us" }),
});

export type IntakeInput = z.infer<typeof intakeSchema>;

/** Flood limits for the public form (on top of the honeypot). */
export const INTAKE_LIMITS = { perEmailPerDay: 3, totalPerHour: 30 } as const;

/** Returns a message if this submission should be refused, otherwise null. */
export function intakeLimitReason(counts: {
  sameEmailLastDay: number;
  allLastHour: number;
}): string | null {
  if (counts.sameEmailLastDay >= INTAKE_LIMITS.perEmailPerDay) {
    return "We already have a few requests from you today. We'll be in touch soon, or email us if it's urgent.";
  }
  if (counts.allLastHour >= INTAKE_LIMITS.totalPerHour) {
    return "We're getting a lot of requests right now. Please try again in an hour.";
  }
  return null;
}
