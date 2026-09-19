import { test, expect } from "@playwright/test";

test("visitante não autenticado é redirecionado para o login", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Elu System" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
});

test("login com credenciais inválidas mostra erro e não navega", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("naoexiste@elumina.com.br");
  await page.getByLabel("Senha").fill("senha-errada-123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
