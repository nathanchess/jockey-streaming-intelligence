import { test, expect } from "@playwright/test";

test("overview shows store cards", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("overview-store-card-hells_kitchen")).toBeVisible();
  await expect(page.getByTestId("overview-store-card-lizzie_bennet")).toBeVisible();
  await expect(page.getByTestId("overview-store-card-lizzie_bennet")).toContainText("Coming soon");
});
