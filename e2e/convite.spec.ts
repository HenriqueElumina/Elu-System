import { test, expect } from "@playwright/test";

test("link de convite inválido/inexistente mostra mensagem amigável, sem exigir login", async ({
  page,
}) => {
  await page.goto("/convite/00000000-0000-0000-0000-000000000000");

  // Não deve redirecionar para /login -- a página é pública.
  await expect(page).toHaveURL(/\/convite\//);
  await expect(
    page.getByText(/não é válido|não foi possível abrir este link/i),
  ).toBeVisible();
});
