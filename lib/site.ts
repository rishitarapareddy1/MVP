import "server-only";
import { headers } from "next/headers";

/**
 * This site's origin (e.g. "http://localhost:3000" or the Vercel URL), taken
 * from the current request so links work in every environment without
 * another env var. Used to build the business's feedback link.
 */
export async function getSiteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
