import { z } from "zod";
import { PROJECT_CATEGORIES } from "@/lib/db/types";
import { parseRubricText, rubricSchema } from "@/lib/assessments/rubric";

/** Admin form for creating/editing an assessment template. */
export const assessmentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  category: z.enum(PROJECT_CATEGORIES),
  instructions: z.string().trim().min(1, "Write the instructions").max(10000),
  time_limit_minutes: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine(
      (v) => v === null || (Number.isInteger(v) && v >= 5 && v <= 600),
      "Enter 5 to 600 minutes, or leave blank",
    ),
  // Textarea "criterion: points" lines -> validated rubric array.
  rubric: z
    .string()
    .transform((text, ctx) => {
      const items = parseRubricText(text);
      if (!items) {
        ctx.addIssue({
          code: "custom",
          message: 'Write one criterion per line, like "accuracy: 50"',
        });
        return z.NEVER;
      }
      return items;
    })
    .pipe(rubricSchema),
  pass_threshold: z.coerce
    .number({ error: "Enter a number" })
    .int()
    .min(0)
    .max(100, "Pass threshold is 0 to 100"),
  is_active: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;
