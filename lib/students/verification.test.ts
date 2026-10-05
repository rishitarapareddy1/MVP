import { describe, expect, it } from "vitest";
import {
  codeMatches,
  generateCode,
  hashCode,
  isUniversityEmail,
  isVerifiedStudent,
  sendBlockedReason,
} from "./verification";

const domains = ["illinois.edu"];

describe("isUniversityEmail / isVerifiedStudent", () => {
  it("recognizes university addresses case-insensitively", () => {
    expect(isUniversityEmail("NetID@Illinois.edu", domains)).toBe(true);
    expect(isUniversityEmail("someone@gmail.com", domains)).toBe(false);
    expect(isUniversityEmail("a@cs.illinois.edu", domains)).toBe(false);
  });

  it("treats university logins as verified, Gmail only after confirming", () => {
    expect(isVerifiedStudent("netid@illinois.edu", null, domains)).toBe(true);
    expect(isVerifiedStudent("me@gmail.com", null, domains)).toBe(false);
    expect(isVerifiedStudent("me@gmail.com", "2026-10-05T00:00:00Z", domains)).toBe(true);
  });
});

describe("codes", () => {
  it("are 6 digits", () => {
    for (let i = 0; i < 50; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it("match only the right code for the right student", () => {
    const hash = hashCode("123456", "student-a");
    expect(codeMatches("123456", "student-a", hash)).toBe(true);
    expect(codeMatches(" 123456 ", "student-a", hash)).toBe(true);
    expect(codeMatches("123457", "student-a", hash)).toBe(false);
    expect(codeMatches("123456", "student-b", hash)).toBe(false);
  });
});

describe("sendBlockedReason", () => {
  const now = new Date("2026-10-05T12:00:00Z");
  const ago = (s: number) => new Date(now.getTime() - s * 1000).toISOString();

  it("allows the first send", () => {
    expect(sendBlockedReason(null, now)).toBeNull();
  });

  it("enforces a one-minute cooldown", () => {
    expect(
      sendBlockedReason(
        { last_sent_at: ago(20), window_started_at: ago(20), sends_in_window: 1 },
        now,
      ),
    ).toMatch(/wait 40 seconds/);
    expect(
      sendBlockedReason(
        { last_sent_at: ago(61), window_started_at: ago(61), sends_in_window: 1 },
        now,
      ),
    ).toBeNull();
  });

  it("allows at most 5 sends per hour", () => {
    expect(
      sendBlockedReason(
        { last_sent_at: ago(120), window_started_at: ago(1800), sends_in_window: 5 },
        now,
      ),
    ).toMatch(/an hour/);
    expect(
      sendBlockedReason(
        { last_sent_at: ago(120), window_started_at: ago(3700), sends_in_window: 5 },
        now,
      ),
    ).toBeNull();
  });
});
