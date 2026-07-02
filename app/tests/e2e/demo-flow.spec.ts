import { test, expect } from "@playwright/test";

test("full demo flow", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("overview-store-card-hells_kitchen").click();
  await expect(page).toHaveURL(/hells_kitchen\/library/);

  await page.getByTestId("hydration-toggle-after").click();
  await page.getByTestId("view-metadata-button").first().click();
  await expect(page.getByTestId("metadata-modal")).toBeVisible();
  await expect(page.getByTestId("characters-present")).toBeVisible();
  await page.getByRole("button", { name: "Close metadata" }).click();
  await expect(page.getByTestId("metadata-modal")).not.toBeVisible();

  await page.getByTestId("sidebar-nav-explore").click();
  await expect(page.getByTestId("featured-pick")).toBeVisible({ timeout: 10000 });

  await page.getByTestId("sidebar-nav-discover").click();
  await page.getByTestId("discover-profile-suspense_seeker").click();
  await expect(page.getByTestId("discover-rail-card")).toHaveCount(10);

  await page.getByTestId("sidebar-nav-program").click();
  await expect(page.getByTestId("program-export-json")).toBeEnabled();
  await expect(page.getByTestId("program-lineup-thumb").first()).toBeVisible();

  await page.getByTestId("sidebar-settings").click();
  await expect(page.getByTestId("developer-drawer")).toBeVisible();
});
