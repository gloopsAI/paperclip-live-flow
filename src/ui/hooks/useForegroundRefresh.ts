import { useEffect, useRef } from "react";

export const DEFAULT_INTERVAL_MS = 15_000;
export const MAX_BACKOFF_MS = 60_000;

export function delayForStreak(baseIntervalMs: number, streak: number): number {
  if (streak <= 0) return baseIntervalMs;
  return Math.min(baseIntervalMs * 2 ** streak, MAX_BACKOFF_MS);
}

/** Foreground polling via usePluginData.refresh — timers stop while document is hidden. */
export function useForegroundRefresh(
  refresh: () => void,
  options?: { intervalMs?: number; hasError?: boolean }
) {
  const baseIntervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS;
  const errorStreakRef = useRef(0);
  const hasErrorRef = useRef(Boolean(options?.hasError));

  useEffect(() => {
    hasErrorRef.current = Boolean(options?.hasError);
    if (!options?.hasError) {
      errorStreakRef.current = 0;
    }
  }, [options?.hasError]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = () => {
      clearTimer();
      if (typeof document === "undefined" || document.visibilityState !== "visible") {
        return;
      }
      const delay = delayForStreak(baseIntervalMs, errorStreakRef.current);
      timer = setTimeout(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          refresh();
          if (hasErrorRef.current) {
            errorStreakRef.current += 1;
          } else {
            errorStreakRef.current = 0;
          }
        }
        schedule();
      }, delay);
    };

    const onVisibility = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        refresh();
        schedule();
      } else {
        clearTimer();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
      if (document.visibilityState === "visible") {
        schedule();
      }
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
      clearTimer();
    };
  }, [baseIntervalMs, refresh]);
}
