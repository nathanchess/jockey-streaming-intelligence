import { test, expect } from "@playwright/test";

test.describe("live jockey API", () => {
  test("POST /api/jockey/search without API key returns 503 or live", async ({
    request,
  }) => {
    const res = await request.post("/api/jockey/search", {
      data: {
        storeKey: "hells_kitchen",
        query: "totally unique uncached query xyz123",
      },
    });
    expect([200, 502, 503]).toContain(res.status());
    const body = await res.json();
    if (res.status() === 200) {
      expect(body.source).toBe("live");
    }
  });
});
