import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado ao tentar acessar /projetos", async ({
  page,
}) => {
  await page.goto("/projetos");
  await expect(page).toHaveURL(/\/login$/);
});

test("visitante não autenticado é redirecionado ao tentar acessar /projetos/[id]", async ({
  page,
}) => {
  await page.goto("/projetos/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/\/login$/);
});

test("visitante não autenticado é redirecionado ao tentar acessar /projetos/workflow", async ({
  page,
}) => {
  await page.goto("/projetos/workflow");
  await expect(page).toHaveURL(/\/login$/);
});

test("visitante não autenticado é redirecionado ao tentar acessar /projetos/workflow/[id]", async ({
  page,
}) => {
  await page.goto("/projetos/workflow/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/\/login$/);
});
