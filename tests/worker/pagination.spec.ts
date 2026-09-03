import { describe, expect, it } from "vitest";
import { paginateToExhaustion } from "../../src/worker/pagination.js";

describe("paginateToExhaustion", () => {
  it("loads all pages until a short page", async () => {
    const calls: Array<[number, number]> = [];
    const pages = await paginateToExhaustion(async (offset, limit) => {
      calls.push([offset, limit]);
      if (offset === 0) return ["a", "b"];
      if (offset === 2) return ["c"];
      return [];
    }, 2);

    expect(pages).toEqual(["a", "b", "c"]);
    expect(calls).toEqual([
      [0, 2],
      [2, 2]
    ]);
  });
});
