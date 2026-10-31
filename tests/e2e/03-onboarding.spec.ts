import { expect, test } from "@playwright/test";
import { completeOnboarding, signUp } from "./helpers";

test.describe("Onboarding → publish → public menu", () => {
  test("new owner completes onboarding and the menu is public", async ({ page, request }) => {
    await signUp(page, { name: "Marco Rossi" });
    const slug = await completeOnboarding(page, `Trattoria ${Date.now()}`, { uploadLogo: true });

    // Public menu works without an account.
    const anon = await page.context().browser()!.newContext();
    const guest = await anon.newPage();
    await guest.goto(`/m/${slug}`);
    await expect(guest.getByRole("heading", { level: 1 })).toContainText("Trattoria");
    await expect(guest.getByText("Cacio e Pepe")).toBeVisible();
    await expect(guest.getByText("$11.50")).toBeVisible();
    // Uploaded logo is served.
    const logo = guest.getByRole("img", { name: /logo/ });
    await expect(logo).toBeVisible();
    // Search filters items.
    await guest.getByLabel("Search the menu").fill("aranc");
    await expect(guest.getByText("Arancini")).toBeVisible();
    await expect(guest.getByText("Cacio e Pepe")).toHaveCount(0);
    // SEO metadata.
    await expect(guest).toHaveTitle(/Trattoria/);
    expect(await guest.locator('script[type="application/ld+json"]').count()).toBe(1);
    await anon.close();

    // Finish → dashboard welcome.
    await page.getByRole("button", { name: /Go to dashboard/ }).click();
    await expect(page).toHaveURL(/\/dashboard\?welcome=1/);
    await expect(page.getByText("Welcome to your dashboard!")).toBeVisible();

    // QR code exists and redirects through the stable link.
    await page.goto("/dashboard/qr");
    const link = await page.locator("span.font-mono").first().innerText();
    const code = link.split("/q/")[1];
    const res = await request.get(`/q/${code}`, { maxRedirects: 0 });
    expect(res.status()).toBe(302);
    expect(res.headers()["location"]).toContain(`/m/${slug}/dinner`);
  });

  test("free plan limits are enforced", async ({ page }) => {
    await signUp(page);
    await completeOnboarding(page, `Limits Café ${Date.now()}`);
    await page.goto("/dashboard/menus");
    await expect(page.getByText("1 of 1 menu used on Free")).toBeVisible();
    await page.getByRole("button", { name: "New menu" }).first().click();
    await expect(page.getByText("You've reached the menu limit on Free.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create menu" })).toBeDisabled();
    await page.keyboard.press("Escape");

    // Premium templates are locked in the branding studio.
    await page.goto("/dashboard/branding");
    await page.getByRole("radio", { name: /Luxury Dining/ }).click();
    await expect(page.getByText("Luxury Dining is available on Pro.")).toBeVisible();

    // Analytics is gated.
    await page.goto("/dashboard/analytics");
    await expect(page.getByText("Analytics is available on Starter and above")).toBeVisible();
  });

  test("progress is saved and resumes after reload", async ({ page }) => {
    await signUp(page);
    await page.getByRole("button", { name: "Let's go" }).click();
    await page.getByLabel("Restaurant name").fill(`Resume Bistro ${Date.now()}`);
    await expect(page.getByText("Nice — that link is available.")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Add your logo and cover" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Add your logo and cover" })).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByLabel("Restaurant name")).toHaveValue(/Resume Bistro/);
  });
});
