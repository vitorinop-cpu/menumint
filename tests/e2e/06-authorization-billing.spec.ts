import { expect, test } from "@playwright/test";
import { FIXTURE_IMAGE, completeOnboarding, logIn, signUp } from "./helpers";
import fs from "node:fs";

test.describe("Authorization", () => {
  test("another owner cannot access the demo restaurant's private data", async ({ browser }) => {
    // Gather the demo restaurant's ids.
    const demoCtx = await browser.newContext();
    const demo = await demoCtx.newPage();
    await logIn(demo);
    await demo.goto("/dashboard/menus");
    const menuHref = await demo.getByRole("link", { name: "Edit Weekend Brunch" }).getAttribute("href");
    // The public page's privacy-friendly view beacon carries the restaurant id.
    const beacon = demo.waitForRequest((r) => r.url().endsWith("/api/track") && r.method() === "POST");
    await demo.goto("/m/saffron-sage");
    const restaurantId = ((await beacon).postDataJSON() as { restaurantId: string }).restaurantId;
    await demoCtx.close();
    expect(menuHref).toMatch(/\/dashboard\/menus\/[0-9a-f-]{36}/);

    // A different owner with their own restaurant.
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUp(page);
    await completeOnboarding(page, `Intruder Diner ${Date.now()}`);

    // Draft menu editor of another restaurant → not found (streamed, so check content).
    await page.goto(menuHref!);
    await expect(page.getByRole("heading", { name: "This page isn't on the menu" })).toBeVisible();
    await expect(page.getByText("Shakshuka")).toHaveCount(0);
    // Draft preview → not found.
    await page.goto(`${menuHref}/preview`);
    await expect(page.getByRole("heading", { name: "This page isn't on the menu" })).toBeVisible();
    await expect(page.getByText("Shakshuka")).toHaveCount(0);
    // Unpublished brunch menu isn't public.
    const pub = await page.goto("/m/saffron-sage/weekend-brunch");
    expect(page.url()).toMatch(/\/m\/saffron-sage$/);
    expect(pub?.ok()).toBeTruthy();
    // Unknown restaurants return a real 404.
    const missing = await page.request.get("/m/does-not-exist-anywhere");
    expect(missing.status()).toBe(404);

    // Uploading into another restaurant's storage is refused.
    {
      const upload = await page.request.post("/api/upload", {
        multipart: {
          restaurantId,
          kind: "item",
          file: { name: "x.jpg", mimeType: "image/jpeg", buffer: fs.readFileSync(FIXTURE_IMAGE) },
        },
      });
      expect(upload.status()).toBe(403);
    }
    await ctx.close();
  });

  test("uploads reject non-images even for members", async ({ page }) => {
    await signUp(page);
    await page.getByRole("button", { name: "Let's go" }).click();
    await page.getByLabel("Restaurant name").fill(`Upload Test ${Date.now()}`);
    await expect(page.getByText("Nice — that link is available.")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Add your logo and cover" })).toBeVisible();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({ name: "evil.png", mimeType: "image/png", buffer: Buffer.from("<script>alert(1)</script>") });
    await expect(page.getByText("Upload a JPG, PNG or WebP image.")).toBeVisible();
  });
});

test.describe("Billing & entitlements", () => {
  test("Stripe is clearly unavailable without keys; demo switcher changes server-side entitlements", async ({ page }) => {
    await signUp(page);
    await completeOnboarding(page, `Upgrade Café ${Date.now()}`);
    await page.goto("/dashboard/billing");
    await expect(page.getByText("Stripe isn't connected in this environment")).toBeVisible();
    await expect(page.getByRole("button", { name: "Upgrade to Pro" })).toBeDisabled();

    // Switch to Pro using the labeled demo switcher (no payment).
    await page.getByRole("button", { name: "Demo: switch to Pro without paying" }).click();
    await expect(page.getByText("Switched to Pro (demo — no payment)")).toBeVisible();
    await expect(page.getByText("Demo · no payment")).toBeVisible();

    // Entitlements now allow more menus and detailed analytics.
    await page.goto("/dashboard/analytics");
    await expect(page.getByRole("heading", { name: "Traffic trend" })).toBeVisible();
    await page.goto("/dashboard/menus");
    await expect(page.getByText(/of unlimited menus used on Pro/)).toBeVisible();
    await page.goto("/dashboard/branding");
    await page.getByRole("radio", { name: /Luxury Dining/ }).click();
    await page.getByRole("button", { name: /Save & publish branding/ }).click();
    await expect(page.getByText("Branding saved")).toBeVisible();
  });

  test("Stripe API endpoints refuse to act without configuration", async ({ request }) => {
    const res = await request.post("/api/stripe/webhook", { data: "{}" });
    expect(res.status()).toBe(503);
  });
});
