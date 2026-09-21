import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado ao tentar acessar /financeiro/contas-bancarias", async ({
  page,
}) => {
  await page.goto("/financeiro/contas-bancarias");
  await expect(page).toHaveURL(/\/login$/);
});

test("visitante não autenticado é redirecionado ao tentar acessar /financeiro/contas-bancarias/nova", async ({
  page,
}) => {
  await page.goto("/financeiro/contas-bancarias/nova");
  await expect(page).toHaveURL(/\/login$/);
});
