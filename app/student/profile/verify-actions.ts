"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudent } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/send";
import { verificationCodeEmail } from "@/lib/email/templates";
import { confirmVerificationCode, storeVerificationCode } from "@/lib/db/verification";
import { generateCode, isUniversityEmail, universityDomains } from "@/lib/students/verification";
import { fail, ok, type ActionResult } from "@/lib/result";

const emailSchema = z.email("Enter a valid email address").trim().toLowerCase();

/** Step 1: email a 6-digit code to the student's university address. */
export async function sendUniversityCode(
  rawEmail: string,
): Promise<ActionResult<{ email: string }>> {
  const me = await requireStudent();
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const email = parsed.data;

  if (!isUniversityEmail(email)) {
    return fail(
      `Use your university email (${universityDomains()
        .map((d) => `@${d}`)
        .join(" or ")}).`,
    );
  }
  if (isUniversityEmail(me.email)) return fail("You're already verified through your login email.");

  const code = generateCode();
  const stored = await storeVerificationCode(me.id, email, code);
  if (!stored.ok) return fail(stored.error);

  try {
    await sendEmail({ to: email, ...verificationCodeEmail(code) });
  } catch (error) {
    console.error("sending verification code failed", error);
    return fail("We couldn't send the email. Please try again in a minute.");
  }
  return ok({ email });
}

/** Step 2: check the code; on success the student is verified. */
export async function confirmUniversityCode(code: string): Promise<ActionResult> {
  const me = await requireStudent();
  if (!/^\d{6}$/.test(code.trim())) return fail("Enter the 6-digit code from the email.");

  const result = await confirmVerificationCode(me.id, code);
  if (!result.ok) return fail(result.error);

  revalidatePath("/student", "layout");
  return ok(undefined);
}
