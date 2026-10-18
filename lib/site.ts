import "server-only";
import { headers } from "next/headers";

/**
 * This site's origin, used for links in emails (offers, feedback).
 * On the live site SITE_URL pins it (e.g. "https://mvp123-blond.vercel.app"),
 * so a spoofed Host header can never change where email links point. Without
 * it (local development) it falls back to the current request's host.
 */
export async function getSiteOrigin(): Promise<string> {
  const pinned = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (pinned) return pinned;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
