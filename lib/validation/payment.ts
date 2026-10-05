import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/projects/labels";
import { optionalText, pastOrTodayDate } from "./common";
import { parseDollarsToCents } from "./parsers";

/** Admin records a payment that happened outside the app (spec: manual). */
export const paymentSchema = z.object({
  direction: z.enum(["business_to_us", "us_to_student"], { error: "Pick a direction" }),
  amount_cents: z
    .string()
    .transform(parseDollarsToCents)
    .refine((v): v is number => v !== null && Number.isFinite(v) && v > 0, "Enter an amount"),
  method: z.enum(PAYMENT_METHODS, { error: "Pick a method" }),
  // Stored as noon US Central (17:00 UTC) so the date never shifts when shown in Chicago.
  paid_at: pastOrTodayDate.transform((d) => `${d}T17:00:00Z`),
  reference: optionalText(200),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
