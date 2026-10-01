import { z } from "zod";

// A rubric is a list of criteria whose max points add up to 100, so the
// total score is directly a percentage (total_score is 0–100).

export const rubricItemSchema = z.object({
  criterion: z.string().trim().min(1).max(60),
  max: z.number().int().positive(),
});
export type RubricItem = z.infer<typeof rubricItemSchema>;

export const rubricSchema = z
  .array(rubricItemSchema)
  .min(1, "Add at least one criterion")
  .refine(
    (items) => new Set(items.map((i) => i.criterion.toLowerCase())).size === items.length,
    "Criteria names must be unique",
  )
  .refine(
    (items) => items.reduce((sum, i) => sum + i.max, 0) === 100,
    "Rubric points must add up to 100",
  );

/**
 * Parses the admin's rubric textarea, one criterion per line:
 *   accuracy: 50
 *   clarity: 30
 * Returns null for any malformed line so the form can say so.
 */
export function parseRubricText(text: string): RubricItem[] | null {
  const items: RubricItem[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^(.+?)\s*:\s*(\d+)$/);
    if (!match) return null;
    items.push({ criterion: match[1].trim(), max: Number(match[2]) });
  }
  return items;
}

export function rubricToText(items: RubricItem[]): string {
  return items.map((i) => `${i.criterion}: ${i.max}`).join("\n");
}

/** Reads the stored jsonb safely; bad data becomes an empty rubric. */
export function readRubric(value: unknown): RubricItem[] {
  const parsed = z.array(rubricItemSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export type ScoreResult =
  | { ok: true; scores: Record<string, number>; total: number }
  | { ok: false; errors: Record<string, string> };

/** Checks each criterion's score is a whole number from 0 to its max. */
export function scoreRubric(
  rubric: RubricItem[],
  raw: Record<string, string | undefined>,
): ScoreResult {
  const scores: Record<string, number> = {};
  const errors: Record<string, string> = {};
  for (const { criterion, max } of rubric) {
    const value = raw[criterion]?.trim() ?? "";
    const n = Number(value);
    if (value === "" || !Number.isInteger(n) || n < 0 || n > max) {
      errors[criterion] = `Enter 0–${max}`;
    } else {
      scores[criterion] = n;
    }
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return { ok: true, scores, total };
}

export function passOrFail(total: number, passThreshold: number): "passed" | "failed" {
  return total >= passThreshold ? "passed" : "failed";
}
