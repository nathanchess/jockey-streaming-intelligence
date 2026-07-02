import { test, expect } from "@playwright/test";

test.describe("cache API", () => {
  test("preset search returns cache source", async ({ request }) => {
    const res = await request.get("/api/cache/hells_kitchen/search/heated-argument");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.source).toBe("cache");
    expect(body.resolved_clips.length).toBeGreaterThan(0);
  });

  test("discover profile returns rail", async ({ request }) => {
    const res = await request.get("/api/cache/hells_kitchen/discover/feel_good_family");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.source).toBe("cache");
    expect(body.resolved_clips.length).toBeGreaterThan(0);
  });

  test("program default returns lineup", async ({ request }) => {
    const res = await request.get("/api/cache/hells_kitchen/program/default");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.source).toBe("cache");
    expect(body.response.lineup.length).toBeGreaterThan(0);
    const total = body.response.total_runtime_minutes as number;
    expect(total).toBeGreaterThanOrEqual(81);
    expect(total).toBeLessThanOrEqual(99);
  });
});
