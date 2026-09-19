import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado ao tentar acessar /leads", async ({
  page,
}) => {
  await page.goto("/leads");
  await expect(page).toHaveURL(/\/login$/);
});
