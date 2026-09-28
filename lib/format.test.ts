import { describe, expect, it } from "vitest";
import { formatCents, formatDate, formatDateTime } from "./format";
import { parseList } from "./env";

describe("formatCents", () => {
  it("formats integer cents as dollars", () => {
    expect(formatCents(12345)).toBe("$123.45");
    expect(formatCents(5000)).toBe("$50.00");
    expect(formatCents(0)).toBe("$0.00");
  });
});

describe("formatDate / formatDateTime", () => {
  it("displays UTC timestamps in America/Chicago", () => {
    // 03:00 UTC on Sep 29 is still Sep 28 in Chicago (UTC-5 during CDT).
    expect(formatDate("2026-09-29T03:00:00Z")).toBe("Sep 28, 2026");
    expect(formatDateTime("2026-09-29T03:00:00Z")).toMatch(/Sep 28, 2026.*10:00\sPM/);
  });
});

describe("parseList", () => {
  it("splits, trims and lowercases comma-separated values", () => {
    expect(parseList(" Admin@X.com, b@y.com ,,")).toEqual(["admin@x.com", "b@y.com"]);
    expect(parseList(undefined)).toEqual([]);
  });
});
