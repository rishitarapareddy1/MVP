import { z } from "zod";
import { optionalText } from "./common";
import { PROJECT_CATEGORIES } from "@/lib/db/types";
import { parseSkillTags } from "./parsers";

const optionalInt = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= max), message);

/** http(s) only: these are rendered as links, so no javascript:/data: URLs. */
const webUrl = (message: string) => z.url({ protocol: /^https?$/, message });

/**
 * "example.com" -> "https://example.com". Anything that already has a scheme
 * ("ftp://...") is left alone so webUrl() can reject non-http(s) links.
 */
const withScheme = (v: string) => (/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`);

export const studentProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Enter your name").max(120),
  major: optionalText(100),
  graduation_year: optionalInt(2024, 2035, "Enter a year from 2024 to 2035"),
  bio: z
    .string()
    .trim()
    .max(500, "Keep your bio under 500 characters")
    .transform((v) => v || null),
  skills: z
    .string()
    .transform(parseSkillTags)
    .refine((tags) => tags.length <= 20, "List at most 20 skills")
    .refine(
      (tags) => tags.every((t) => t.length <= 40),
      "Each skill should be under 40 characters",
    ),
  interested_categories: z.array(z.enum(PROJECT_CATEGORIES)),
  hours_per_week: optionalInt(0, 40, "Enter 0 to 40 hours"),
  is_available: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  // One link per line in the form.
  portfolio_links: z
    .string()
    .transform((s) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map(withScheme),
    )
    .pipe(z.array(webUrl("Each link must be a valid URL")).max(5, "Add at most 5 links")),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

/** FormData -> plain object, keeping repeated fields (checkbox groups) as arrays. */
export function formDataToObject(formData: FormData, arrayFields: string[] = []) {
  const obj: Record<string, unknown> = Object.fromEntries(formData);
  for (const field of arrayFields) obj[field] = formData.getAll(field);
  return obj;
}

export const submissionUrlSchema = z
  .string()
  .trim()
  .min(1, "Paste a link to your work")
  .transform(withScheme)
  .pipe(webUrl("Enter a valid link"));
