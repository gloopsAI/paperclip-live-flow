import { describe, expect, it } from "vitest";
import { delayForStreak, MAX_BACKOFF_MS } from "../../src/ui/hooks/useForegroundRefresh.js";

describe("foreground refresh backoff", () => {
  it("derives exponential delays from the configured base interval capped at 60s", () => {
    expect(delayForStreak(15_000, 0)).toBe(15_000);
    expect(delayForStreak(15_000, 1)).toBe(30_000);
    expect(delayForStreak(15_000, 2)).toBe(60_000);
    expect(delayForStreak(15_000, 3)).toBe(MAX_BACKOFF_MS);
  });

  it("scales custom base intervals with the same exponential curve", () => {
    expect(delayForStreak(10_000, 0)).toBe(10_000);
    expect(delayForStreak(10_000, 1)).toBe(20_000);
    expect(delayForStreak(10_000, 2)).toBe(40_000);
    expect(delayForStreak(10_000, 3)).toBe(60_000);
  });
});
