import { test, expect } from "@playwright/test";

test("discover run discovery shows jockey loading", async ({ page }) => {
  await page.goto("/hells_kitchen/discover");
  await page.getByTestId("discover-run-button").click();
  await expect(page.getByTestId("jockey-search-loading")).toBeVisible();
  await expect(page.getByTestId("discover-rail-card").first()).toBeVisible({ timeout: 15000 });
});

test("discover profile switch updates rail", async ({ page }) => {
  await page.goto("/hells_kitchen/discover");
  await expect(page.getByText("Recommended videos")).toBeVisible();
  await expect(page.getByTestId("personalization-config-table")).toBeVisible();
  await page.getByTestId("personalization-config-toggle").click();
  await expect(page.getByTestId("personalization-clip-length-value")).toContainText("20 min");
  const cards = page.getByTestId("discover-rail-card");
  await expect(cards.first()).toBeVisible();
  await expect(cards).toHaveCount(10);
  await page.getByTestId("discover-profile-suspense_seeker").click();
  await expect(page.getByTestId("personalization-clip-length-value")).toContainText("30 min");
  await expect(cards.first()).toBeVisible();
  await expect(cards).toHaveCount(10);
});
