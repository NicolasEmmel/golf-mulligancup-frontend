import { expect, test } from "@playwright/test";

test("home shows navigation entry points", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Mulligan-Cup 2026" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Scoring starten/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Rangliste anzeigen/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Verwaltung/i }),
  ).toBeVisible();
});
