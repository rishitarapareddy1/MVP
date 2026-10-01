import { describe, expect, it } from "vitest";
import { formDataToObject, studentProfileSchema, submissionUrlSchema } from "./student";

const base = {
  full_name: "Maya Patel",
  major: "Statistics",
  graduation_year: "2027",
  bio: "",
  skills: "Excel, SQL",
  interested_categories: ["data_cleanup"],
  hours_per_week: "10",
  portfolio_links: "github.com/maya\n\nhttps://maya.dev",
};

describe("studentProfileSchema", () => {
  it("normalizes a valid profile", () => {
    const p = studentProfileSchema.parse(base);
    expect(p.graduation_year).toBe(2027);
    expect(p.bio).toBeNull();
    expect(p.skills).toEqual(["excel", "sql"]);
    expect(p.is_available).toBe(false); // unchecked checkbox is absent
    expect(p.portfolio_links).toEqual(["https://github.com/maya", "https://maya.dev"]);
  });

  it("rejects a long bio, bad year and too many links", () => {
    const result = studentProfileSchema.safeParse({
      ...base,
      bio: "x".repeat(501),
      graduation_year: "1999",
      portfolio_links: Array.from({ length: 6 }, (_, i) => `site${i}.com`).join("\n"),
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(["bio", "graduation_year", "portfolio_links"]),
    );
  });
});

describe("formDataToObject", () => {
  it("keeps checkbox groups as arrays", () => {
    const fd = new FormData();
    fd.append("interested_categories", "data_cleanup");
    fd.append("interested_categories", "lead_research");
    fd.append("major", "Stats");
    expect(formDataToObject(fd, ["interested_categories"])).toEqual({
      major: "Stats",
      interested_categories: ["data_cleanup", "lead_research"],
    });
  });
});

describe("submissionUrlSchema", () => {
  it("adds a scheme and rejects junk", () => {
    expect(submissionUrlSchema.parse("docs.google.com/x")).toBe("https://docs.google.com/x");
    expect(submissionUrlSchema.safeParse("not a link").success).toBe(false);
    expect(submissionUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(submissionUrlSchema.safeParse("ftp://files.example.com/x").success).toBe(false);
  });
});
