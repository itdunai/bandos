import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const bandSlug = process.env.E2E_BAND_SLUG;

test.describe("BandOS musician flow", () => {
  test.skip(
    !email || !password || !bandSlug,
    "Set E2E_EMAIL, E2E_PASSWORD, E2E_BAND_SLUG to run"
  );

  test("login → create track → add to setlist → open play", async ({ page }) => {
    const songTitle = `E2E Song ${Date.now()}`;
    const setlistName = `E2E Set ${Date.now()}`;

    await page.goto("/login");
    await page.getByLabel(/email|почта/i).fill(email!);
    await page.getByLabel(/пароль|password/i).fill(password!);
    await page.getByRole("button", { name: /войти|login/i }).click();

    await page.waitForURL(`**/${bandSlug}**`);

    await page.goto(`/${encodeURIComponent(bandSlug!)}/songs/new`);
    await page.getByLabel(/название/i).fill(songTitle);
    await page.getByRole("button", { name: /создать трек/i }).click();
    await expect(page.getByRole("heading", { name: songTitle })).toBeVisible();

    await page.goto(`/${encodeURIComponent(bandSlug!)}/setlists/new`);
    await page.getByLabel(/название/i).fill(setlistName);
    await page.getByRole("button", { name: /создать/i }).click();
    await expect(page.getByText(setlistName)).toBeVisible();

    await page.goto(`/${encodeURIComponent(bandSlug!)}/play`);
    await expect(page.getByRole("heading", { name: /играем/i })).toBeVisible();
    await expect(page.getByText(setlistName)).toBeVisible();
  });
});
