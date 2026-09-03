import { afterEach, describe, expect, it, vi } from "vitest";
import { HandlerCache } from "../../src/worker/cache.js";

describe("HandlerCache", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("coalesces in-flight requests for the same key", async () => {
    const cache = new HandlerCache(15_000);
    let loads = 0;
    const loader = vi.fn(async () => {
      loads += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { ok: true };
    });

    const key = cache.cacheKey("co-1", "company-flow", { handler: "company-flow" });
    const [a, b] = await Promise.all([cache.load(key, loader), cache.load(key, loader)]);

    expect(loads).toBe(1);
    expect(a.value).toEqual({ ok: true });
    expect(b.value).toEqual({ ok: true });
  });

  it("returns cached value within TTL", async () => {
    vi.useFakeTimers();
    const cache = new HandlerCache(15_000);
    const key = cache.cacheKey("co-1", "probe", {});
    let loads = 0;

    await cache.load(key, async () => {
      loads += 1;
      return "first";
    });
    vi.advanceTimersByTime(5_000);
    const second = await cache.load(key, async () => {
      loads += 1;
      return "second";
    });

    expect(second.value).toBe("first");
    expect(second.fromCache).toBe(true);
    expect(loads).toBe(1);
  });

  it("isolates cache entries by company id", async () => {
    const cache = new HandlerCache(15_000);
    const loaderA = vi.fn(async () => "a");
    const loaderB = vi.fn(async () => "b");

    const keyA = cache.cacheKey("co-a", "issue-flow", { issueId: "i1" });
    const keyB = cache.cacheKey("co-b", "issue-flow", { issueId: "i1" });

    const a = await cache.load(keyA, loaderA);
    const b = await cache.load(keyB, loaderB);

    expect(a.value).toBe("a");
    expect(b.value).toBe("b");
    expect(loaderA).toHaveBeenCalledTimes(1);
    expect(loaderB).toHaveBeenCalledTimes(1);
  });

  it("returns stale last success when refresh fails", async () => {
    vi.useFakeTimers();
    const cache = new HandlerCache(15_000);
    const key = cache.cacheKey("co-1", "company-flow", {});

    await cache.load(key, async () => ({ count: 1 }));
    vi.advanceTimersByTime(16_000);

    const stale = await cache.load(key, async () => {
      throw new Error("refresh failed");
    });

    vi.useRealTimers();
    expect(stale.value).toEqual({ count: 1 });
    expect(stale.stale).toBe(true);
    expect(stale.staleReason).toContain("refresh failed");
  });
});
