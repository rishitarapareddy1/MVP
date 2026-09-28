import { z } from "zod";

// Env vars are read lazily (inside functions) rather than at import time,
// so `npm run dev` and tests still work before Supabase is configured.

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export function getPublicEnv() {
  // NEXT_PUBLIC_* vars must be referenced by their full literal name so
  // Next.js can inline them into the browser bundle.
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/** Parses a comma-separated env value into a trimmed, lowercased list. */
export function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
