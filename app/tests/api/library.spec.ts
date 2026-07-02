import { test, expect } from "@playwright/test";

test.describe("library API", () => {
  test("GET /api/library returns 4 stores and 18 assets", async ({ request }) => {
    const res = await request.get("/api/library");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Object.keys(body.stores)).toHaveLength(4);
    expect(Object.keys(body.assets)).toHaveLength(18);
  });

  test("GET /api/library/hells_kitchen includes embed_url", async ({ request }) => {
    const res = await request.get("/api/library/hells_kitchen");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.assets.length).toBeGreaterThan(0);
    expect(body.assets[0].embed_url).toContain("youtube.com/embed");
  });
});
