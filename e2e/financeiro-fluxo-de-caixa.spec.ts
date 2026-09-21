import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado ao tentar acessar /financeiro/fluxo-de-caixa", async ({
  page,
}) => {
  await page.goto("/financeiro/fluxo-de-caixa");
  await expect(page).toHaveURL(/\/login$/);
});
