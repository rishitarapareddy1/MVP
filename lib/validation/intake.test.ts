import { describe, expect, it } from "vitest";
import { intakeSchema } from "./intake";

const valid = {
  business_name: "Green Street Bakery",
  website: "",
  contact_name: "Dana",
  contact_email: "Dana@Example.com",
  contact_phone: "",
  description: "We need a comparison of five nearby bakeries.",
  category: "not_sure",
  budget_range: "100_250",
  deadline: "",
  source: "linkedin",
};

describe("intakeSchema", () => {
  it("accepts a minimal valid request and normalizes it", () => {
    const result = intakeSchema.parse(valid);
    expect(result.contact_email).toBe("dana@example.com");
    expect(result.website).toBeNull();
    expect(result.contact_phone).toBeNull();
    expect(result.deadline).toBeNull();
  });

  it("adds https:// to bare website domains", () => {
    expect(intakeSchema.parse({ ...valid, website: "greenstreet.com" }).website).toBe(
      "https://greenstreet.com",
    );
  });

  it("rejects a past deadline and a too-short description", () => {
    const result = intakeSchema.safeParse({
      ...valid,
      deadline: "2020-01-01",
      description: "help",
    });
    expect(result.success).toBe(false);
    const fields = result.error!.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["deadline", "description"]));
  });

  it("rejects unknown enum values", () => {
    expect(intakeSchema.safeParse({ ...valid, budget_range: "1_million" }).success).toBe(false);
    expect(intakeSchema.safeParse({ ...valid, source: "tiktok" }).success).toBe(false);
  });
});
