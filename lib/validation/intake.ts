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
      .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
      .pipe(z.url("Enter a valid website, like example.com").nullable()),
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
