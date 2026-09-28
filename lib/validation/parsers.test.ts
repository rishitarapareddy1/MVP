import { describe, expect, it } from "vitest";
import { centsToDollarInput, parseDollarsToCents, parseSkillTags } from "./parsers";

describe("parseSkillTags", () => {
  it("lowercases, trims, collapses spaces and de-duplicates", () => {
    expect(parseSkillTags("Excel, SQL ,excel,  Data   Cleaning, ")).toEqual([
      "excel",
      "sql",
      "data cleaning",
    ]);
  });

  it("returns an empty list for blank input", () => {
    expect(parseSkillTags("  ")).toEqual([]);
  });
});

describe("parseDollarsToCents", () => {
  it("parses common dollar formats", () => {
    expect(parseDollarsToCents("200")).toBe(20000);
    expect(parseDollarsToCents("$1,250.5")).toBe(125050);
    expect(parseDollarsToCents("19.99")).toBe(1999);
  });

  it("distinguishes blank from invalid", () => {
    expect(parseDollarsToCents("")).toBeNull();
    expect(parseDollarsToCents("abc")).toBeNaN();
    expect(parseDollarsToCents("1.234")).toBeNaN();
    expect(parseDollarsToCents("-5")).toBeNaN();
  });
});

describe("centsToDollarInput", () => {
  it("formats cents for an input field", () => {
    expect(centsToDollarInput(125050)).toBe("1250.50");
    expect(centsToDollarInput(null)).toBe("");
  });
});
