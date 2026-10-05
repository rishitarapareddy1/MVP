import { BRAND } from "@/lib/brand";
import { CODE_TTL_MINUTES } from "@/lib/students/verification";

/** Verification code email. Plain and short so it doesn't look like spam. */
export function verificationCodeEmail(code: string) {
  const subject = `Your ${BRAND.name} verification code: ${code}`;
  const text = [
    `Your verification code is ${code}`,
    "",
    `Enter it on your ${BRAND.name} profile to confirm this university email. It expires in ${CODE_TTL_MINUTES} minutes.`,
    "",
    "If you didn't request this, you can ignore this email.",
  ].join("\n");
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px">
      <p>Your verification code is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px">${code}</p>
      <p>Enter it on your ${BRAND.name} profile to confirm this university email.
         It expires in ${CODE_TTL_MINUTES} minutes.</p>
      <p style="color: #666">If you didn't request this, you can ignore this email.</p>
    </div>`;
  return { subject, text, html };
}
