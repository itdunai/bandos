import { test, expect } from "@playwright/test";

test.describe("Privacy policy and cookie consent", () => {
  test("public policy page and first-visit cookie banner", async ({ page }) => {
    await page.goto("/privacy");

    await expect(
      page.getByRole("heading", { name: /политик/i })
    ).toBeVisible();

    const banner = page.getByRole("region", {
      name: /согласие на использование cookie/i,
    });
    await expect(banner).toBeVisible();
    await expect(
      banner.getByRole("link", { name: /политик/i })
    ).toBeVisible();

    await banner.getByRole("button", { name: /принять/i }).click();
    await expect(banner).toHaveCount(0);

    await page.reload();
    await expect(
      page.getByRole("region", { name: /согласие на использование cookie/i })
    ).toHaveCount(0);
  });
});
