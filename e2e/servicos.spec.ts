import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado ao tentar acessar /servicos", async ({
  page,
}) => {
  await page.goto("/servicos");
  await expect(page).toHaveURL(/\/login$/);
});
