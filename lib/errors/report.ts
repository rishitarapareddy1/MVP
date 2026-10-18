import { BRAND } from "@/lib/brand";
import { parseList } from "@/lib/env";
import { getTransporter } from "@/lib/email/transport";
import { createThrottleState, shouldSendAlert } from "./throttle";

// No `server-only` import here: instrumentation.ts uses this too (see
// lib/email/transport.ts for why). It's still server code only.

const throttle = createThrottleState();

function describe(error: unknown): { message: string; stack?: string; digest?: string } {
  if (error instanceof Error) {
    const digest = "digest" in error ? String((error as { digest?: unknown }).digest) : undefined;
    return { message: error.message, stack: error.stack, digest };
  }
  // Supabase errors are plain objects with a message.
  if (error && typeof error === "object" && "message" in error) {
    return { message: String((error as { message: unknown }).message) };
  }
  return { message: String(error) };
}

/**
 * Logs an error and, in production, emails the admins about it (throttled).
 * Never throws, so it's safe to call from any catch block.
 *
 * @param where short label for where it happened, e.g. "intake form"
 */
export async function reportError(
  where: string,
  error: unknown,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const { message, stack, digest } = describe(error);
  console.error(`[${where}]`, message, { digest, ...extra }, stack ?? "");

  // Only the live site sends alerts; local development just logs.
  if (process.env.VERCEL_ENV !== "production") return;
  const to = parseList(process.env.ALERT_EMAILS ?? process.env.ADMIN_EMAILS);
  if (to.length === 0) return;
  if (!shouldSendAlert(throttle, `${where}:${message}`)) return;

  try {
    const details = [
      `Where: ${where}`,
      `When: ${new Date().toISOString()}`,
      `Error: ${message}`,
      digest ? `Digest: ${digest} (search for it in Vercel's logs)` : null,
      ...Object.entries(extra).map(
        ([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`,
      ),
      "",
      stack ? stack.split("\n").slice(0, 8).join("\n") : "",
    ]
      .filter((l) => l !== null)
      .join("\n");
    await getTransporter().sendMail({
      from: { name: `${BRAND.name} alerts`, address: process.env.SMTP_USER! },
      to: to.join(", "),
      subject: `[${BRAND.name}] Error in ${where}: ${message.slice(0, 80)}`,
      text: `Something went wrong on the live site.\n\n${details}\n\nRepeats of this error are muted for 15 minutes.`,
    });
  } catch (sendError) {
    // Never let alerting break anything; just log that it failed.
    console.error("[reportError] couldn't send alert email", sendError);
  }
}
