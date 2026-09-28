import { z } from "zod";

const email = z.email("Enter a valid email address").trim().toLowerCase();

export const loginSchema = z.object({ email });

// Supabase's code length is a project setting (6–10 digits; ours is 8), so
// accept any length in that range rather than hard-coding one.
export const verifyCodeSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .regex(/^\d{6,10}$/, "Enter the code from your email"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
