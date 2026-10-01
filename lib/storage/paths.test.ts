import { describe, expect, it } from "vitest";
import { isPathInFolder } from "./paths";

describe("isPathInFolder", () => {
  const me = "50000000-0000-0000-0000-000000000001";

  it("accepts files in the folder and its subfolders", () => {
    expect(isPathInFolder(`${me}/123-resume.pdf`, me)).toBe(true);
    expect(isPathInFolder(`${me}/assessment-id/123-file.csv`, `${me}/assessment-id`)).toBe(true);
  });

  it("rejects other folders, traversal and the bare folder", () => {
    expect(isPathInFolder(`someone-else/resume.pdf`, me)).toBe(false);
    expect(isPathInFolder(`${me}x/resume.pdf`, me)).toBe(false);
    expect(isPathInFolder(`${me}/../other/resume.pdf`, me)).toBe(false);
    expect(isPathInFolder(`/${me}/resume.pdf`, me)).toBe(false);
    expect(isPathInFolder(`${me}/`, me)).toBe(false);
  });
});
