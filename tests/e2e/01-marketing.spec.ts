import { expect, test } from "@playwright/test";

test.describe("Marketing site", () => {
  test("landing page renders key sections without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Beautiful menus.");
    await expect(page.locator("h1")).toHaveCount(1);
    for (const id of ["features", "templates", "qr", "pricing", "faq"]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
    await expect(page.getByRole("link", { name: /Get started/ }).first()).toHaveAttribute("href", /\/signup/);
    await expect(page.getByRole("link", { name: /View live demo/ })).toHaveAttribute("href", "/m/saffron-sage");
    expect(errors).toEqual([]);
  });

  test("every internal link resolves", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page.$$eval("a[href^='/']", (as) => [...new Set(as.map((a) => a.getAttribute("href")!.split("#")[0]))]);
    for (const href of hrefs.filter(Boolean)) {
      const res = await request.get(href, { maxRedirects: 5 });
      expect(res.status(), href).toBeLessThan(400);
    }
  });

  test("legal pages load", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("FAQ accordion is keyboard accessible", async ({ page }) => {
    await page.goto("/#faq");
    const first = page.locator("#faq").getByRole("button").first();
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-expanded", "true");
  });
});
