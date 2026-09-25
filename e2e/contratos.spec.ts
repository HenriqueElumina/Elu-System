import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado ao tentar acessar /contratos", async ({
  page,
}) => {
  await page.goto("/contratos");
  await expect(page).toHaveURL(/\/login/);
});
