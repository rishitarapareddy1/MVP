import { describe, expect, it } from "vitest";
import { MAX_ALERTS_PER_HOUR, createThrottleState, shouldSendAlert } from "./throttle";

const MIN = 60_000;

describe("shouldSendAlert", () => {
  it("sends the first alert for an error", () => {
    expect(shouldSendAlert(createThrottleState(), "a", 0)).toBe(true);
  });

  it("suppresses the same error for 15 minutes", () => {
    const s = createThrottleState();
    expect(shouldSendAlert(s, "a", 0)).toBe(true);
    expect(shouldSendAlert(s, "a", 14 * MIN)).toBe(false);
    expect(shouldSendAlert(s, "a", 15 * MIN)).toBe(true);
  });

  it("lets different errors through independently", () => {
    const s = createThrottleState();
    expect(shouldSendAlert(s, "a", 0)).toBe(true);
    expect(shouldSendAlert(s, "b", 1)).toBe(true);
  });

  it("caps total alerts per hour, then recovers", () => {
    const s = createThrottleState();
    for (let i = 0; i < MAX_ALERTS_PER_HOUR; i++) expect(shouldSendAlert(s, `e${i}`, i)).toBe(true);
    expect(shouldSendAlert(s, "one-too-many", 100)).toBe(false);
    expect(shouldSendAlert(s, "later", 61 * MIN)).toBe(true);
  });
});
