import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { BRAND } from "@/lib/brand";

/**
 * Sends app emails (verification codes now, notifications later) through
 * Gmail SMTP: the same account Supabase uses for login codes. To switch to
 * another provider (e.g. Resend), only this file needs to change.
 *
 * Env: SMTP_USER (the Gmail address) and SMTP_PASS (a Gmail app password).
 */
let transporter: Transporter | null = null;

function getTransporter() {
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

export async function sendEmail(message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  await getTransporter().sendMail({
    from: { name: BRAND.name, address: process.env.SMTP_USER! },
    ...message,
  });
}
