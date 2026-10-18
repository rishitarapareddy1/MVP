import type { NextConfig } from "next";

/**
 * Security headers sent with every page.
 * - frame-ancestors / X-Frame-Options: no other site can embed this app in a
 *   frame (stops "clickjacking", e.g. tricking an admin into clicking Approve).
 * - nosniff: browsers must trust our Content-Type (uploads can't be run as scripts).
 * - Referrer-Policy: other sites only see our domain, never full URLs (which
 *   can contain feedback tokens).
 * - Permissions-Policy: we never need camera, microphone or location.
 * (Vercel already sends Strict-Transport-Security for HTTPS.)
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
