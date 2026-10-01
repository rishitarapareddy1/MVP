import { describe, expect, it } from "vitest";
import { isId } from "./id";

describe("isId", () => {
  it("accepts random and seed-style ids", () => {
    expect(isId("9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")).toBe(true);
    expect(isId("a5500000-0000-0000-0000-000000000001")).toBe(true);
  });

  it("rejects non-ids", () => {
    expect(isId("not-a-uuid")).toBe(false);
    expect(isId("a5500000-0000-0000-0000-00000000000")).toBe(false);
    expect(isId(undefined)).toBe(false);
  });
});
