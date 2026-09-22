import { test, expect } from "@playwright/test";

test("página de redefinir senha é pública e mostra link inválido sem código", async ({
  page,
}) => {
  await page.goto("/redefinir-senha");

  // Não deve redirecionar para /login -- a página é pública.
  await expect(page).toHaveURL(/\/redefinir-senha$/);
  await expect(page.getByText(/não é válido ou expirou/i)).toBeVisible();
});

test("login mostra formulário de 'esqueci minha senha'", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /esqueci minha senha/i }).click();
  await expect(page.getByRole("heading", { name: /redefinir senha/i })).toBeVisible();
});
