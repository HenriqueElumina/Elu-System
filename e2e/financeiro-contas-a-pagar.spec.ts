import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado ao tentar acessar /financeiro/contas-a-pagar", async ({
  page,
}) => {
  await page.goto("/financeiro/contas-a-pagar");
  await expect(page).toHaveURL(/\/login$/);
});
