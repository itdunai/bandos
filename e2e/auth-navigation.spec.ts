import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const bandSlug = process.env.E2E_BAND_SLUG;

test.describe("BandOS auth & navigation", () => {
  test.skip(
    !email || !password || !bandSlug,
    "Set E2E_EMAIL, E2E_PASSWORD, E2E_BAND_SLUG to run"
  );

  test("login and open create band page", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email|почта/i).fill(email!);
    await page.getByLabel(/пароль|password/i).fill(password!);
    await page.getByRole("button", { name: /войти|login/i }).click();
    await page.waitForURL(`**/${bandSlug}**`);

    await page.goto("/new-band");
    await expect(page.getByRole("heading", { name: /создать группу/i })).toBeVisible();
  });

  test("band switcher shows create group link", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email|почта/i).fill(email!);
    await page.getByLabel(/пароль|password/i).fill(password!);
    await page.getByRole("button", { name: /войти|login/i }).click();
    await page.waitForURL(`**/${bandSlug}**`);

    await page.getByRole("button", { name: new RegExp(bandSlug!, "i") }).click();
    await expect(page.getByRole("link", { name: /создать группу/i })).toBeVisible();
  });
});
