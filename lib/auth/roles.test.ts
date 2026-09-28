import { describe, expect, it } from "vitest";
import { isAdminEmail, isAllowedStudentEmail } from "./roles";

describe("isAdminEmail", () => {
  const admins = ["rishi9@illinois.edu"];

  it("matches case-insensitively and ignores whitespace", () => {
    expect(isAdminEmail(" Rishi9@Illinois.edu ", admins)).toBe(true);
  });

  it("rejects emails not in the list", () => {
    expect(isAdminEmail("someone@illinois.edu", admins)).toBe(false);
    expect(isAdminEmail("rishi9@illinois.edu", [])).toBe(false);
  });
});

describe("isAllowedStudentEmail", () => {
  const domains = ["illinois.edu"];

  it("allows exact domain matches, case-insensitively", () => {
    expect(isAllowedStudentEmail("netid@illinois.edu", domains)).toBe(true);
    expect(isAllowedStudentEmail("NetID@ILLINOIS.EDU", domains)).toBe(true);
  });

  it("rejects other domains and lookalikes", () => {
    expect(isAllowedStudentEmail("someone@gmail.com", domains)).toBe(false);
    expect(isAllowedStudentEmail("a@notillinois.edu", domains)).toBe(false);
    expect(isAllowedStudentEmail("a@illinois.edu.evil.com", domains)).toBe(false);
    expect(isAllowedStudentEmail("a@cs.illinois.edu", domains)).toBe(false);
  });
});
