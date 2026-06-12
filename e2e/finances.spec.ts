import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const bandSlug = process.env.E2E_BAND_SLUG;

test.describe("BandOS finances", () => {
  test.skip(
    !email || !password || !bandSlug,
    "Set E2E_EMAIL, E2E_PASSWORD, E2E_BAND_SLUG to run"
  );

  test("login → add expense", async ({ page }) => {
    const expenseTitle = `E2E расход ${Date.now()}`;

    await page.goto("/login");
    await page.getByLabel(/email|почта/i).fill(email!);
    await page.getByLabel(/пароль|password/i).fill(password!);
    await page.getByRole("button", { name: /войти|login/i }).click();
    await page.waitForURL(`**/${bandSlug}**`);

    await page.goto(`/${encodeURIComponent(bandSlug!)}/finances`);
    await expect(page.getByRole("heading", { name: "Финансы" })).toBeVisible();

    await page.getByRole("button", { name: /добавить расход/i }).click();
    await page.locator('input[name="amount"]').fill("500");
    await page.locator('input[name="title"]').fill(expenseTitle);
    await page.getByRole("button", { name: /^сохранить$/i }).click();

    await expect(page.getByText(expenseTitle)).toBeVisible({ timeout: 15000 });
  });
});
