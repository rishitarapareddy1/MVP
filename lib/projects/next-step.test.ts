import { describe, expect, it } from "vitest";
import { PROJECT_STATUSES } from "@/lib/db/types";
import { NEXT_STEP, PROGRESS_STEPS, progressIndex } from "./next-step";

describe("next step guidance", () => {
  it("covers every status", () => {
    for (const s of PROJECT_STATUSES) expect(NEXT_STEP[s].title).toBeTruthy();
  });
});

describe("progress steps", () => {
  it("places every status except cancelled on exactly one step", () => {
    for (const s of PROJECT_STATUSES) {
      const hits = PROGRESS_STEPS.filter((step) => step.statuses.includes(s)).length;
      expect(hits).toBe(s === "cancelled" ? 0 : 1);
    }
  });

  it("orders the main path", () => {
    expect(progressIndex("submitted")).toBe(0);
    expect(progressIndex("offered")).toBe(progressIndex("matching"));
    expect(progressIndex("closed")).toBe(PROGRESS_STEPS.length - 1);
    expect(progressIndex("cancelled")).toBe(-1);
  });
});
