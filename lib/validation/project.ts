import { z } from "zod";
import { PROJECT_CATEGORIES, PROJECT_STATUSES } from "@/lib/db/types";
import { idSchema } from "./id";
import { parseDollarsToCents, parseSkillTags } from "./parsers";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

/** Dollar input ("250", "$1,250.50") -> integer cents, or null if blank. */
const dollarsToCents = (label: string) =>
  z
    .string()
    .transform(parseDollarsToCents)
    .refine((v) => v === null || Number.isFinite(v), `Enter ${label} as a dollar amount`);

/** Admin scope editor. Fields may be blank while scoping; the transition to
 *  'matching' is what requires them (see lib/projects/transitions.ts). */
export const scopeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  category: z.enum(PROJECT_CATEGORIES),
  scoped_description: optionalText(5000),
  deliverable: optionalText(2000),
  required_skills: z.string().transform(parseSkillTags),
  preferred_skills: z.string().transform(parseSkillTags),
  estimated_hours: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine(
      (v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 200),
      "Hours must be a whole number from 1 to 200",
    ),
  budget_cents: dollarsToCents("the budget"),
  student_pay_cents: dollarsToCents("student pay"),
  deadline: z.union([z.literal(""), z.iso.date("Enter a valid date")]).transform((v) => v || null),
  // Unchecked checkboxes aren't sent at all, so a missing value means false.
  is_starter: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export type ScopeInput = z.infer<typeof scopeSchema>;

export const statusChangeSchema = z.object({
  project_id: idSchema,
  to: z.enum(PROJECT_STATUSES),
});
