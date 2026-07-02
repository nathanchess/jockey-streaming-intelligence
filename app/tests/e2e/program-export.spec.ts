import { test, expect } from "@playwright/test";

test("program export downloads json", async ({ page }) => {
  await page.goto("/hells_kitchen/program");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("program-export-json").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("lineup.json");
});
