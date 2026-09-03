/** Elapsed milliseconds between ISO timestamps; null when start is missing. */
export function elapsedDurationMs(
  startedAt: string | null,
  finishedAt: string | null,
  nowMs: number
): number | null {
  if (!startedAt) {
    return null;
  }
  const start = Date.parse(startedAt);
  if (Number.isNaN(start)) {
    return null;
  }
  const end = finishedAt ? Date.parse(finishedAt) : nowMs;
  if (Number.isNaN(end)) {
    return null;
  }
  return Math.max(0, end - start);
}
