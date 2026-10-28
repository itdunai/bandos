import { test, expect, type Page } from "@playwright/test";

/** Проверки к открытой бете: ошибки, восстановление пароля, онбординг, удаление аккаунта. */

test.describe("Public pages", () => {
  test("unknown band shows the branded 404", async ({ page }) => {
    // Без входа непубличные пути уводят на /login — берём публичную страницу группы
    const res = await page.goto(`/rider/no-such-band-${Date.now()}`);
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /страница не найдена/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /на главную/i })).toBeVisible();
  });

  test("login links to password recovery", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /забыли пароль/i }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole("heading", { name: /восстановление пароля/i })).toBeVisible();
  });

  test("account, feedback and reset-password require login", async ({ page }) => {
    for (const path of ["/account", "/feedback", "/reset-password"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login\?next=/);
    }
  });

  test("expired recovery link asks for a new one", async ({ page }) => {
    await page.goto("/auth/callback?next=/reset-password&token_hash=invalid&type=recovery");
    await expect(page).toHaveURL(/\/forgot-password\?error=/);
    await expect(page.getByText(/запросите новую/i)).toBeVisible();
  });
});

/**
 * Полный путь нового музыканта. Создаёт и удаляет реального пользователя,
 * поэтому включается явно: E2E_SIGNUP=1 и выключенное «Confirm email» в Supabase.
 */
test.describe("New musician journey", () => {
  test.skip(!process.env.E2E_SIGNUP, "Set E2E_SIGNUP=1 (Confirm email must be off)");

  async function acceptPolicy(page: Page) {
    const consent = page.getByRole("checkbox", { name: /политик/i });
    if (await consent.count()) await consent.check();
  }

  test("register → band with demo content → feedback → delete account", async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e-${stamp}@example.com`;
    const bandName = `E2E Band ${stamp}`;

    await page.goto("/register");
    await page.locator('input[name="display_name"]').fill("E2E Musician");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill("e2e-password-123");
    await acceptPolicy(page);
    await page.getByRole("button", { name: /зарегистрироваться/i }).click();
    await page.waitForURL((url) => url.pathname === "/");

    await page.goto("/new-band");
    await page.locator('input[name="band_name"]').fill(bandName);
    await page.getByRole("button", { name: /создать/i }).click();
    await page.waitForURL((url) => url.pathname !== "/new-band");
    const bandPath = new URL(page.url()).pathname.split("/").slice(0, 2).join("/");

    // Демо-контент
    await page.goto(`${bandPath}/songs`);
    await expect(page.getByText("Ночная трасса (пример)")).toBeVisible();
    await page.goto(`${bandPath}/setlists`);
    await expect(page.getByText("Пример сет-листа")).toBeVisible();
    await page.goto(`${bandPath}/todos`);
    await expect(page.getByText("Добавить свой первый трек")).toBeVisible();

    // Обратная связь
    await page.goto(`/feedback?from=${encodeURIComponent(`${bandPath}/songs`)}`);
    await page.getByRole("textbox", { name: /сообщение/i }).fill("E2E: проверка обратной связи");
    await page.getByRole("button", { name: /отправить/i }).click();
    await expect(page.getByRole("heading", { name: /спасибо/i })).toBeVisible();

    // Удаление аккаунта вместе с созданной группой
    await page.goto("/account");
    await expect(page.getByText(bandName)).toBeVisible();
    const deleteButton = page.getByRole("button", { name: /удалить аккаунт навсегда/i });
    await expect(deleteButton).toBeDisabled();
    await page.locator('input[name="confirm_email"]').fill(email);
    await deleteButton.click();
    await expect(page.getByRole("heading", { name: /аккаунт удалён/i })).toBeVisible();

    // Группы больше нет, войти нельзя
    await page.goto(bandPath);
    await expect(page).toHaveURL(/\/login/);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill("e2e-password-123");
    await acceptPolicy(page);
    await page.getByRole("button", { name: /^войти$/i }).click();
    await expect(page.getByText(/неверный email или пароль/i)).toBeVisible();
  });
});
