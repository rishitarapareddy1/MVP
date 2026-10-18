import type { Instrumentation } from "next";

/**
 * Next.js calls this for every server error nobody caught (pages, server
 * actions, route handlers). We forward it to reportError, which logs it and,
 * on the live site, emails the admins (throttled).
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  // The mailer needs Node.js APIs; skip the Edge runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportError } = await import("./lib/errors/report");
  await reportError(`${context.routeType} ${request.method} ${request.path}`, err, {
    route: context.routePath,
  });
};
