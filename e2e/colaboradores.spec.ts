import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado ao tentar acessar /colaboradores", async ({
  page,
}) => {
  await page.goto("/colaboradores");
  await expect(page).toHaveURL(/\/login$/);
});

test("visitante não autenticado é redirecionado ao tentar acessar /colaboradores/convidar", async ({
  page,
}) => {
  await page.goto("/colaboradores/convidar");
  await expect(page).toHaveURL(/\/login$/);
});

test("link de convite de colaborador inválido/inexistente mostra mensagem amigável, sem exigir login", async ({
  page,
}) => {
  await page.goto("/convite-colaborador/00000000-0000-0000-0000-000000000000");

  // Não deve redirecionar para /login -- a página é pública.
  await expect(page).toHaveURL(/\/convite-colaborador\//);
  await expect(page.getByText(/não é válido/i)).toBeVisible();
});
