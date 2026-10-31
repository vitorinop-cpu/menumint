import { expect, test, type Page } from "@playwright/test";
import { logIn } from "./helpers";

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("Mobile", () => {
  test("landing page and mobile navigation", async ({ page }) => {
    await page.goto("/");
    await noHorizontalOverflow(page);
    const toggle = page.getByRole("button", { name: /menu/i }).first();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("public menu is usable on a phone", async ({ page }) => {
    await page.goto("/m/saffron-sage");
    await noHorizontalOverflow(page);
    await page.getByRole("button", { name: "Desserts" }).click();
    await expect(page.getByRole("heading", { name: "Desserts" })).toBeInViewport();
    await page.getByText("Tiramisu").click();
    await expect(page.getByRole("dialog")).toContainText("Allergens");
    await page.getByRole("button", { name: "Close details" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("dashboard drawer and editor tabs", async ({ page }) => {
    await logIn(page);
    await noHorizontalOverflow(page);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("dialog", { name: "Navigation" }).getByRole("link", { name: "Menus" }).click();
    await expect(page).toHaveURL(/\/dashboard\/menus$/);
    await page.getByRole("link", { name: "Edit Dinner" }).click();
    await page.getByRole("radio", { name: "Preview" }).click();
    await expect(page.getByRole("region", { name: "Live preview" })).toBeVisible();
    await page.getByRole("radio", { name: "Categories" }).click();
    await expect(page.getByRole("button", { name: "Add category" }).first()).toBeVisible();
    await noHorizontalOverflow(page);
  });
});
