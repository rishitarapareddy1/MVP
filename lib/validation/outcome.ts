import { z } from "zod";
import { OUTCOME_TYPES } from "@/lib/db/types";
import { optionalText, pastOrTodayDate } from "./common";
import { idSchema } from "./id";

/** Admin records a hiring signal for a student (spec section 8). */
export const outcomeSchema = z.object({
  type: z.enum(OUTCOME_TYPES, { error: "Pick an outcome" }),
  project_id: z.union([z.literal(""), idSchema]).transform((v) => v || null),
  notes: optionalText(1000),
  occurred_at: pastOrTodayDate,
});

export type OutcomeInput = z.infer<typeof outcomeSchema>;
