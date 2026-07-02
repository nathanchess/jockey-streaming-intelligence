import { test, expect } from "@playwright/test";

test("explore browse loads featured carousel and match reasoning", async ({ page }) => {
  await page.goto("/hells_kitchen/explore");
  await expect(page.getByTestId("featured-pick")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Most important scenes from Hell's Kitchen")).toBeVisible();
  await expect(page.getByTestId("category-rail-signature-moments")).toBeVisible();

  const activeSlide = page.getByTestId("featured-carousel-active-slide");
  await activeSlide.getByTestId("match-reasoning-button").click();
  await expect(page.getByTestId("match-reasoning-modal")).toBeVisible();
  await page.getByRole("button", { name: "Close match reasoning" }).click();

  await activeSlide.getByRole("button", { name: /Watch clip/i }).click();
  await expect(page.getByTestId("clip-player-modal")).toBeVisible();
});

test("suggested prompt switches explore to search results", async ({ page }) => {
  await page.goto("/hells_kitchen/explore");
  await page.getByTestId("explore-search-chip-heated-argument").click();
  await expect(page.getByTestId("jockey-search-loading")).toBeVisible();
  await expect(page.getByTestId("featured-pick")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Kitchen confrontations that boil over")).toBeVisible();
  await expect(page.getByTestId("category-rail-peak-tension")).toBeVisible();
});

test("featured carousel advances with arrow controls", async ({ page }) => {
  await page.goto("/hells_kitchen/explore");
  await expect(page.getByTestId("featured-carousel-active-slide")).toBeVisible({ timeout: 10000 });

  const firstTitle = await page
    .getByTestId("featured-carousel-active-slide")
    .locator("h3")
    .textContent();

  await page.getByTestId("featured-carousel-next").click();
  await expect(page.getByTestId("featured-carousel-active-slide").locator("h3")).not.toHaveText(
    firstTitle ?? "",
  );
});
