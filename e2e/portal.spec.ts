import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado ao tentar acessar /portal", async ({
  page,
}) => {
  await page.goto("/portal");
  await expect(page).toHaveURL(/\/login$/);
});

test("visitante não autenticado é redirecionado ao tentar acessar /clientes/[id]/convidar-login", async ({
  page,
}) => {
  await page.goto(
    "/clientes/00000000-0000-0000-0000-000000000000/convidar-login",
  );
  await expect(page).toHaveURL(/\/login$/);
});

test("link de convite de cliente inválido/inexistente mostra mensagem amigável, sem exigir login", async ({
  page,
}) => {
  await page.goto("/convite-cliente/00000000-0000-0000-0000-000000000000");

  // Não deve redirecionar para /login -- a página é pública.
  await expect(page).toHaveURL(/\/convite-cliente\//);
  await expect(page.getByText(/não é válido/i)).toBeVisible();
});
