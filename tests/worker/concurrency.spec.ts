import { describe, expect, it } from "vitest";
import { mapWithBoundedConcurrency } from "../../src/worker/concurrency.js";

describe("mapWithBoundedConcurrency", () => {
  it("preserves order with bounded parallelism", async () => {
    let active = 0;
    let maxActive = 0;
    const items = [1, 2, 3, 4, 5];

    const results = await mapWithBoundedConcurrency(items, 2, async (value) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return value * 2;
    });

    expect(results).toEqual([2, 4, 6, 8, 10]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
