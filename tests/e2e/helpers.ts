import { expect, type Page } from "@playwright/test";
import path from "node:path";

export const DEMO = { email: "demo@menumint.app", password: "mint-demo-2026" };
export const FIXTURE_IMAGE = path.join(process.cwd(), "public/images/dishes/latte.jpg");

export function uniqueEmail(prefix = "owner") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

export async function signUp(page: Page, opts: { name?: string; email?: string; password?: string } = {}) {
  const email = opts.email ?? uniqueEmail();
  const password = opts.password ?? "Sup3rSecret!";
  await page.goto("/signup");
  await page.getByLabel("Your name").fill(opts.name ?? "Test Owner");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  return { email, password };
}

export async function logIn(page: Page, email = DEMO.email, password = DEMO.password) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Completes the 9-step onboarding wizard and returns the created slug. */
export async function completeOnboarding(page: Page, name: string, opts: { uploadLogo?: boolean } = {}) {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Let's go" }).click();
  await page.getByLabel("Restaurant name").fill(name);
  await expect(page.getByText("Nice — that link is available.")).toBeVisible();
  const slug = await page.getByLabel("Menu link").inputValue();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Add your logo and cover" })).toBeVisible();
  if (opts.uploadLogo) {
    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE_IMAGE);
    await expect(page.getByText("Logo uploaded")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
  } else {
    await page.getByRole("button", { name: "Skip for now" }).click();
  }

  await page.getByRole("radio", { name: "Italian" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Choose a menu template" })).toBeVisible();
  await page.getByRole("radio", { name: /Minimal Café/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Make it yours" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Create your first menu" })).toBeVisible();
  await page.getByLabel("Menu name").fill("Dinner");
  await page.getByLabel("First category").fill("Starters");
  await page.getByLabel("Dish 1 name").fill("Cacio e Pepe");
  await page.getByLabel("Dish 1 price").fill("19");
  await page.getByLabel("Dish 2 name").fill("Arancini");
  await page.getByLabel("Dish 2 price").fill("11.50");
  await page.getByRole("button", { name: "Create menu" }).click();

  await expect(page.getByRole("heading", { name: "Your QR code" })).toBeVisible();
  await page.getByRole("button", { name: "Generate QR code" }).click();
  await expect(page.getByRole("img", { name: /QR code linking to/ })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Publish my menu" }).click();
  await expect(page.getByText("You're live!")).toBeVisible();
  return slug;
}
