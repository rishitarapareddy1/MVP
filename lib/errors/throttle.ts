/**
 * Decides whether an error alert email should go out, so one bug can't flood
 * the inbox. Rules: the same error at most once per 15 minutes, and at most
 * 10 alerts per hour in total. State lives in memory per server instance,
 * which is plenty for a low-traffic app (each Vercel instance has its own).
 */

export const SAME_ERROR_WINDOW_MS = 15 * 60_000;
export const MAX_ALERTS_PER_HOUR = 10;

export type ThrottleState = { lastSentByKey: Map<string, number>; sentTimes: number[] };

export function createThrottleState(): ThrottleState {
  return { lastSentByKey: new Map(), sentTimes: [] };
}

/** Returns true (and records the send) if an alert for `key` may go out now. */
export function shouldSendAlert(
  state: ThrottleState,
  key: string,
  now: number = Date.now(),
): boolean {
  const last = state.lastSentByKey.get(key);
  if (last !== undefined && now - last < SAME_ERROR_WINDOW_MS) return false;

  state.sentTimes = state.sentTimes.filter((t) => now - t < 3_600_000);
  if (state.sentTimes.length >= MAX_ALERTS_PER_HOUR) return false;

  state.lastSentByKey.set(key, now);
  state.sentTimes.push(now);
  return true;
}
