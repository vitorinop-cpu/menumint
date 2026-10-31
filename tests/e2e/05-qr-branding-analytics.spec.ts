import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { logIn } from "./helpers";

test.describe("QR studio", () => {
  test.beforeEach(async ({ page }) => logIn(page));

  test("codes render, pass the scan test and download as PNG/SVG", async ({ page }) => {
    await page.goto("/dashboard/qr");
    await expect(page.getByText("Scan test passed")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Contrast \d+\.\d:1/)).toBeVisible();

    const [png] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "PNG" }).click()]);
    expect(png.suggestedFilename()).toMatch(/\.png$/);
    const pngBytes = fs.readFileSync((await png.path())!);
    expect(pngBytes.subarray(1, 4).toString()).toBe("PNG");
    expect(pngBytes.length).toBeGreaterThan(2000);

    const [svg] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "SVG" }).click()]);
    expect(svg.suggestedFilename()).toMatch(/\.svg$/);
    expect(fs.readFileSync((await svg.path())!, "utf8")).toContain("<svg");
  });

  test("low-contrast colours are blocked; destination changes keep the same code", async ({ page, request }) => {
    await page.goto("/dashboard/qr");
    await page.getByRole("button", { name: /Bar — drinks list/ }).click();
    await page.getByLabel("Foreground", { exact: true }).fill("#EEEEEE");
    await expect(page.getByText(/Too low/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await page.getByRole("button", { name: "Discard" }).click();

    await page.getByLabel("Opens").selectOption({ label: "Dinner" });
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("QR code saved")).toBeVisible();
    const res = await request.get("/q/sgdrink1", { maxRedirects: 0 });
    expect(res.headers()["location"]).toContain("/m/saffron-sage/dinner");
    // Restore.
    await page.getByLabel("Opens").selectOption({ label: "Drinks" });
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("QR code saved").first()).toBeVisible();
  });

  test("print-ready sheet renders four cards", async ({ page }) => {
    await page.goto("/dashboard/qr");
    const popup = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Print-ready table cards" }).click();
    const print = await popup;
    await expect(print.getByRole("button", { name: "Print" })).toBeVisible();
    expect(await print.locator("svg").count()).toBeGreaterThanOrEqual(4);
  });

  test("scans are recorded and visible in analytics", async ({ page, request }) => {
    await page.goto("/dashboard/analytics?range=7");
    const before = Number((await page.getByText("QR scans").locator("..").locator("..").locator("p.font-display").innerText()).replace(/\D/g, ""));
    await request.get("/q/sgtable1", { maxRedirects: 0 });
    await request.get("/q/sgtable1", { maxRedirects: 0 });
    await page.reload();
    const after = Number((await page.getByText("QR scans").locator("..").locator("..").locator("p.font-display").innerText()).replace(/\D/g, ""));
    expect(after).toBeGreaterThanOrEqual(before + 2);
    // Preview links do not count.
    await request.get("/q/sgtable1?preview=1", { maxRedirects: 0 });
    await expect(page.getByRole("heading", { name: "Popular dishes" })).toBeVisible();
  });
});

test.describe("Branding studio", () => {
  test.beforeEach(async ({ page }) => logIn(page));

  test("template + colour changes publish to the public menu", async ({ page }) => {
    await page.goto("/dashboard/branding");
    await page.getByRole("radio", { name: /Luxury Dining/ }).click();
    await expect(page.getByText("Unsaved")).toBeVisible();
    await page.getByRole("button", { name: /Save & publish branding/ }).click();
    await expect(page.getByText("Branding saved")).toBeVisible();

    await page.goto("/m/saffron-sage");
    await expect(page.locator("[data-theme]").first()).toHaveAttribute("data-theme", "dark");

    // Restore the original template.
    await page.goto("/dashboard/branding");
    await page.getByRole("radio", { name: /Modern Bistro/ }).click();
    await page.getByRole("tab", { name: "Colours" }).click();
    await page.getByLabel("Primary", { exact: true }).fill("#2F6B4F");
    await page.getByRole("button", { name: /Save & publish branding/ }).click();
    await expect(page.getByText("Branding saved")).toBeVisible();
    await page.goto("/m/saffron-sage");
    await expect(page.locator("[data-theme]").first()).toHaveAttribute("data-theme", "light");
    const primary = await page.locator("[data-theme]").first().evaluate((el) => getComputedStyle(el).getPropertyValue("--mm-primary").trim());
    expect(primary.toUpperCase()).toBe("#2F6B4F");
  });
});

test.describe("Public analytics ingestion", () => {
  test("views are tracked privately and validated", async ({ request }) => {
    const bad = await request.post("/api/track", { data: { type: "menu_view", restaurantId: "00000000-0000-4000-8000-000000000000", menuId: "00000000-0000-4000-8000-000000000000" } });
    expect(bad.status()).toBe(404);
    const invalid = await request.post("/api/track", { data: { type: "hack" } });
    expect(invalid.status()).toBe(400);
    const dnt = await request.post("/api/track", { data: {}, headers: { DNT: "1" } });
    expect(dnt.status()).toBe(204);
  });
});
