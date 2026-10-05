import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CODE_TTL_MINUTES,
  MAX_ATTEMPTS,
  codeMatches,
  hashCode,
  sendBlockedReason,
} from "@/lib/students/verification";

// University email codes. These use the service role because the codes
// table has no browser access at all (RLS on, no policies) and students may
// not write their own verified flag. Callers must already have checked the
// student with requireStudent().

export type StartResult = { ok: true } | { ok: false; error: string };

/**
 * Stores a new code (hashed) for this student, enforcing the rate limit.
 * Returns the plain code only so the caller can email it.
 */
export async function storeVerificationCode(
  studentId: string,
  email: string,
  code: string,
  now: Date = new Date(),
): Promise<StartResult> {
  const supabase = createAdminClient();

  // The same university address can't verify two accounts.
  const { data: taken, error: takenError } = await supabase
    .from("students")
    .select("id")
    .ilike("university_email", email)
    .not("university_email_verified_at", "is", null)
    .neq("id", studentId)
    .limit(1);
  if (takenError) throw takenError;
  if (taken.length > 0) {
    return { ok: false, error: "That email is already verified on another account." };
  }

  const { data: existing, error } = await supabase
    .from("email_verification_codes")
    .select("last_sent_at, window_started_at, sends_in_window")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;

  const blocked = sendBlockedReason(existing, now);
  if (blocked) return { ok: false, error: blocked };

  // Start a new hourly window if the old one is over.
  const windowOver =
    !existing || now.getTime() - Date.parse(existing.window_started_at) >= 3_600_000;

  const { error: upsertError } = await supabase.from("email_verification_codes").upsert({
    student_id: studentId,
    email,
    code_hash: hashCode(code, studentId),
    expires_at: new Date(now.getTime() + CODE_TTL_MINUTES * 60_000).toISOString(),
    attempts: 0,
    last_sent_at: now.toISOString(),
    window_started_at: windowOver ? now.toISOString() : existing!.window_started_at,
    sends_in_window: windowOver ? 1 : existing!.sends_in_window + 1,
  });
  if (upsertError) throw upsertError;
  return { ok: true };
}

/** Checks a code. On success, marks the student's university email verified. */
export async function confirmVerificationCode(
  studentId: string,
  code: string,
  now: Date = new Date(),
): Promise<StartResult> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("email_verification_codes")
    .select("email, code_hash, expires_at, attempts")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return { ok: false, error: "Request a code first." };
  if (Date.parse(row.expires_at) < now.getTime()) {
    return { ok: false, error: "That code has expired. Request a new one." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many wrong tries. Request a new code." };
  }

  if (!codeMatches(code, studentId, row.code_hash)) {
    await supabase
      .from("email_verification_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("student_id", studentId);
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return {
      ok: false,
      error:
        left > 0
          ? `That code isn't right. ${left} tries left.`
          : "Too many wrong tries. Request a new code.",
    };
  }

  const { error: updateError } = await supabase
    .from("students")
    .update({ university_email: row.email, university_email_verified_at: now.toISOString() })
    .eq("id", studentId);
  if (updateError) {
    // Unique index: someone verified this address in the meantime.
    if (updateError.code === "23505") {
      return { ok: false, error: "That email is already verified on another account." };
    }
    throw updateError;
  }
  await supabase.from("email_verification_codes").delete().eq("student_id", studentId);
  return { ok: true };
}
