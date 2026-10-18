import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, anyRealStudentEmail, loginAs } from "./helpers";

// Smoke tests: every main page loads, the important guards hold, and nothing
// scrolls sideways on a phone. Read-only: nothing here writes to the database.

async function noHorizontalScroll(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page should not scroll sideways").toBeLessThanOrEqual(1);
}

test.describe("public pages", () => {
  test("landing page loads with security headers", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    const headers = response!.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Real work");
    await noHorizontalScroll(page);
  });

  for (const [path, heading] of [
    ["/request", "Tell us about your project"],
    ["/login", "Log in"],
    ["/privacy", "Privacy"],
  ] as const) {
    test(`${path} loads`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
      await noHorizontalScroll(page);
    });
  }

  test("the request form shows errors instead of submitting when empty", async ({ page }) => {
    await page.goto("/request");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText("Enter your business name")).toBeVisible();
    await expect(page).toHaveURL(/\/request$/);
  });

  test("a made-up feedback link is a 404", async ({ page }) => {
    const response = await page.goto(`/feedback/${"0".repeat(64)}`);
    expect(response?.status()).toBe(404);
  });
});

test.describe("guards", () => {
  for (const path of ["/admin", "/student", "/admin/projects", "/student/profile"]) {
    test(`${path} redirects to login when signed out`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("the cron endpoint refuses calls without the secret", async ({ request }) => {
    const response = await request.get("/api/cron/daily");
    expect(response.status()).toBe(401);
  });
});

test.describe("admin", () => {
  test.skip(!process.env.SUPABASE_SERVICE_ROLE_KEY || !ADMIN_EMAIL, "needs .env.local");

  test("main admin pages load", async ({ page, context, baseURL }) => {
    await loginAs(context, baseURL!, ADMIN_EMAIL);
    for (const [path, text] of [
      ["/admin", "Good"],
      ["/admin/projects", "Projects"],
      ["/admin/projects?view=board", "Projects"],
      ["/admin/students", "Students"],
      ["/admin/submissions", "Grading queue"],
      ["/admin/assessments", "Assessments"],
      ["/admin/metrics", "Metrics"],
    ] as const) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(text);
      await noHorizontalScroll(page);
    }
  });
});

test.describe("student", () => {
  test("main student pages load and admin stays off-limits", async ({ page, context, baseURL }) => {
    const email = process.env.SUPABASE_SERVICE_ROLE_KEY ? await anyRealStudentEmail() : null;
    test.skip(!email, "needs .env.local and a real student account");
    await loginAs(context, baseURL!, email!);
    for (const path of ["/student", "/student/assessments", "/student/profile"]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await noHorizontalScroll(page);
    }
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin/);
  });
});
