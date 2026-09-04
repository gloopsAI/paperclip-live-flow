// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  DEFAULT_INTERVAL_MS,
  delayForStreak,
  MAX_BACKOFF_MS,
  useForegroundRefresh
} from "../../src/ui/hooks/useForegroundRefresh.js";

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

describe("foreground refresh loading overlap", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible"
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not timer- or visibility-refresh while a bridge request is still loading", () => {
    const refresh = vi.fn();
    const { rerender } = renderHook(
      ({ loading }) => useForegroundRefresh(refresh, { isLoading: loading }),
      { initialProps: { loading: true } }
    );

    act(() => {
      vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
    });
    expect(refresh).not.toHaveBeenCalled();

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(refresh).not.toHaveBeenCalled();

    rerender({ loading: false });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(refresh).toHaveBeenCalledTimes(1);

    refresh.mockClear();
    act(() => {
      vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("resumes scheduled refresh after loading completes", () => {
    const refresh = vi.fn();
    const { rerender } = renderHook(
      ({ loading }) => useForegroundRefresh(refresh, { isLoading: loading }),
      { initialProps: { loading: true } }
    );

    act(() => {
      vi.advanceTimersByTime(DEFAULT_INTERVAL_MS * 2);
    });
    expect(refresh).not.toHaveBeenCalled();

    rerender({ loading: false });
    act(() => {
      vi.advanceTimersByTime(DEFAULT_INTERVAL_MS);
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
