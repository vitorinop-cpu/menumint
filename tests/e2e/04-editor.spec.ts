import { expect, test, type Page } from "@playwright/test";
import { logIn } from "./helpers";

async function openDinner(page: Page) {
  await page.goto("/dashboard/menus");
  await page.getByRole("link", { name: "Edit Dinner" }).click();
  await expect(page.getByLabel("Menu name")).toHaveValue("Dinner");
}

const toolbar = (page: Page) => page.getByRole("toolbar", { name: "Menu editor" });

test.describe("Menu builder", () => {
  test.beforeEach(async ({ page }) => logIn(page));

  test("add item → autosave → persists → publish → public", async ({ page, browser }) => {
    await openDinner(page);
    const name = `Truffle Fries ${Date.now() % 100000}`;
    await page.getByRole("button", { name: "Add item" }).last().click();
    await page.getByLabel("Name", { exact: true }).fill(name);
    await page.getByLabel("Price (USD)").fill("9.50");
    await page.getByLabel("Description", { exact: true }).fill("Parmesan, rosemary salt");
    await page.getByRole("button", { name: "Vegetarian", exact: true }).click();
    await page.getByRole("button", { name: "Milk", exact: true }).click();

    // Live preview updates immediately.
    const preview = page.getByRole("region", { name: "Live preview" });
    await expect(preview.getByText(name)).toBeVisible();

    // Autosave.
    await expect(toolbar(page).getByText(/Saved/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Unpublished changes").first()).toBeVisible();

    // Persists across reload.
    await page.reload();
    await expect(page.getByText(name).first()).toBeVisible();

    // Not public until published.
    const guestCtx = await browser.newContext();
    const guest = await guestCtx.newPage();
    await guest.goto("/m/saffron-sage");
    await expect(guest.getByText("Small Plates").first()).toBeVisible();
    await expect(guest.getByText(name)).toHaveCount(0);

    // Draft preview shows it.
    await page.goto(page.url().split("?")[0] + "/preview");
    await expect(page.getByText("Draft preview")).toBeVisible();
    await expect(page.getByText(name)).toBeVisible();
    await page.goBack();

    await toolbar(page).getByRole("button", { name: /Publish/ }).click();
    await expect(page.getByText("Menu published")).toBeVisible();
    await guest.reload();
    await expect(guest.getByText(name)).toBeVisible();

    // Item details sheet shows allergens.
    await guest.getByText(name).click();
    await expect(guest.getByRole("dialog")).toContainText("Contains: Milk");
    await guestCtx.close();
  });

  test("undo / redo, availability, duplicate and archive", async ({ page }) => {
    await openDinner(page);
    const categoryName = page.getByLabel("Category name");
    await categoryName.fill("Small Plates & Snacks");
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await toolbar(page).getByRole("button", { name: "Undo" }).click();
    await expect(categoryName).toHaveValue("Small Plates");
    await toolbar(page).getByRole("button", { name: "Redo" }).click();
    await expect(categoryName).toHaveValue("Small Plates & Snacks");
    await toolbar(page).getByRole("button", { name: "Undo" }).click();

    // Toggle availability → "Sold out" appears in preview.
    await page.getByRole("switch", { name: "Charred Octopus available" }).click();
    const preview = page.getByRole("region", { name: "Live preview" });
    await expect(preview.getByText("Sold out").first()).toBeVisible();

    // Duplicate then archive the copy.
    await page.getByRole("button", { name: "More actions for Charred Octopus" }).click();
    await page.getByRole("menuitem", { name: "Duplicate" }).click();
    await expect(page.getByText("Charred Octopus (copy)").first()).toBeVisible();
    await page.getByRole("button", { name: "More actions for Charred Octopus (copy)" }).click();
    await page.getByRole("menuitem", { name: "Archive" }).click();
    await expect(page.getByRole("button", { name: /Archived \(1\)/ })).toBeVisible();
    await expect(preview.getByText("Charred Octopus (copy)")).toHaveCount(0);

    // Restore availability and save.
    await page.getByRole("switch", { name: "Charred Octopus available" }).click();
    await toolbar(page).getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Draft saved")).toBeVisible();
  });

  test("keyboard reordering of categories", async ({ page }) => {
    await openDinner(page);
    const list = page.getByRole("list", { name: /Categories/ });
    const first = async () => (await list.getByRole("listitem").first().innerText()).split("\n")[0];
    expect(await first()).toContain("Small Plates");
    await page.getByRole("button", { name: "More actions for Small Plates" }).click({ force: true });
    await page.getByRole("menuitem", { name: "Move down" }).click();
    expect(await first()).toContain("Pasta");
    await toolbar(page).getByRole("button", { name: "Undo" }).click();
    expect(await first()).toContain("Small Plates");
  });

  test("validation blocks saving an unnamed item", async ({ page }) => {
    await openDinner(page);
    await page.getByRole("button", { name: "Add item" }).last().click();
    await expect(page.getByText(/needs a name/)).toBeVisible({ timeout: 10_000 });
    await expect(toolbar(page).getByText("Needs attention")).toBeVisible();
    await page.getByLabel("Name", { exact: true }).fill("Named now");
    await expect(toolbar(page).getByText(/Saved/)).toBeVisible({ timeout: 15_000 });
    // Clean up: archive it.
    await page.getByRole("button", { name: "More actions for Named now" }).click();
    await page.getByRole("menuitem", { name: "Archive" }).click();
  });

  test("create, rename, duplicate and archive menus", async ({ page }) => {
    await page.goto("/dashboard/menus");
    await page.getByRole("button", { name: "New menu" }).first().click();
    await page.getByLabel("Menu name").fill("Late Night");
    await page.getByRole("button", { name: "Create menu" }).click();
    await expect(page).toHaveURL(/\/dashboard\/menus\/[0-9a-f-]{36}$/);
    await page.goto("/dashboard/menus");
    await page.getByRole("button", { name: "Actions for Late Night" }).click();
    await page.getByRole("menuitem", { name: "Rename" }).click();
    await page.getByLabel("Menu name").fill("After Hours");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("heading", { name: "After Hours" })).toBeVisible();
    await page.getByRole("button", { name: "Actions for After Hours", exact: true }).click();
    await page.getByRole("menuitem", { name: "Duplicate" }).click();
    await expect(page.getByRole("heading", { name: "After Hours (copy)" })).toBeVisible();
    for (const n of ["After Hours (copy)", "After Hours"]) {
      await page.getByRole("button", { name: `Actions for ${n}`, exact: true }).click();
      await page.getByRole("menuitem", { name: "Archive" }).click();
      await expect(page.getByRole("heading", { name: n, exact: true })).toHaveCount(0);
    }
    await expect(page.getByRole("heading", { name: "Archived" })).toBeVisible();
  });
});
