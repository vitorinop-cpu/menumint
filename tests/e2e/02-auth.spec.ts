import { expect, test } from "@playwright/test";
import { logIn, signUp } from "./helpers";

test.describe("Authentication", () => {
  test("protected routes redirect to login", async ({ page }) => {
    await page.goto("/dashboard/menus");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fmenus/);
  });

  test("sign up, sign out and sign back in", async ({ page }) => {
    const { email, password } = await signUp(page, { name: "Ada Lovelace" });
    await expect(page.getByRole("heading", { name: /Hi Ada/ })).toBeVisible();
    // Log out via the auth action (no restaurant yet, so use the endpoint flow).
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    // No restaurant yet → onboarding.
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("validation and wrong password errors", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Work email").fill("not-an-email");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page.getByText("Tell us your name")).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@menumint.app");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password-1");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });

  test("duplicate email is rejected", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Your name").fill("Someone");
    await page.getByLabel("Work email").fill("demo@menumint.app");
    await page.getByLabel("Password", { exact: true }).fill("Another1pass");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("An account with this email already exists.").first()).toBeVisible();
  });

  test("password reset flow (demo mode link)", async ({ page }) => {
    const { email } = await signUp(page);
    await page.context().clearCookies();
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Demo mode: no email is sent")).toBeVisible();
    await page.getByRole("link", { name: "Reset password" }).click();
    await page.getByLabel("New password").fill("Brand1NewPass");
    await page.getByLabel("Confirm password").fill("Brand1NewPass");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page).toHaveURL(/\/onboarding|\/dashboard/);
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Brand1NewPass");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("demo user can log in and log out", async ({ page }) => {
    await logIn(page);
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login\?signedOut=1/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
