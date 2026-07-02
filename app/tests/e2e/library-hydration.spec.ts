import { test, expect } from "@playwright/test";

test("library hydration toggle reveals metadata modal", async ({ page }) => {
  await page.goto("/hells_kitchen/library");
  await page.getByTestId("hydration-toggle-after").click();
  await page.getByTestId("view-metadata-button").first().click();
  await expect(page.getByTestId("metadata-modal")).toBeVisible();
  await expect(page.getByTestId("characters-present")).toBeVisible();
  await expect(page.getByTestId("episode-timeline")).toBeVisible();
  await expect(page.getByTestId("most-important-scene")).toBeVisible();
});
