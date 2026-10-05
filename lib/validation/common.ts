import { z } from "zod";
import { todayInChicago } from "@/lib/format";

/** Blank form fields arrive as "" — treat them as "not provided" (null). */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

/** A YYYY-MM-DD date that isn't in the future (Chicago calendar). */
export const pastOrTodayDate = z.iso
  .date("Enter a valid date")
  // YYYY-MM-DD strings compare correctly as plain strings.
  .refine((v) => v <= todayInChicago(), "Date can't be in the future");
