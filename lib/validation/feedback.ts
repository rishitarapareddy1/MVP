import { z } from "zod";
import { optionalText } from "./common";

const yesNo = (message: string) =>
  z.enum(["yes", "no"], { error: message }).transform((v) => v === "yes");

/** Business feedback form (public, via the project's feedback token). */
export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5, "Pick a rating"),
  quality_notes: optionalText(2000),
  would_hire_again: yesNo("Please answer this question"),
  interested_in_internship_or_job: yesNo("Please answer this question"),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

/** Feedback tokens are 64 hex characters; check before touching the database. */
export const feedbackTokenSchema = z.string().regex(/^[0-9a-f]{64}$/);
