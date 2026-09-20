import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado ao tentar acessar /financeiro", async ({
  page,
}) => {
  await page.goto("/financeiro");
  await expect(page).toHaveURL(/\/login$/);
});
