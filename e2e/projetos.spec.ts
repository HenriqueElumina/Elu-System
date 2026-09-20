import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado ao tentar acessar /projetos", async ({
  page,
}) => {
  await page.goto("/projetos");
  await expect(page).toHaveURL(/\/login$/);
});
