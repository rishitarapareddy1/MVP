import nodemailer, { type Transporter } from "nodemailer";

/**
 * The Gmail SMTP connection, shared by lib/email/send.ts and the error
 * reporter. Deliberately has no `server-only` import: instrumentation.ts
 * (which reports crashes) runs outside the React server layer, where that
 * guard would throw. Nothing in the browser imports this file.
 *
 * Env: SMTP_USER (the Gmail address) and SMTP_PASS (a Gmail app password).
 */
let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error("SMTP_USER and SMTP_PASS must be set to send email");
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true, // port 465 = TLS from the start
    auth: { user, pass },
  });
  return transporter;
}
