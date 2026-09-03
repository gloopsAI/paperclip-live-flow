import type { RunFact } from "../../contracts/common.js";

export function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function formatDurationMs(
  startedAt: string | null,
  finishedAt: string | null
): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  const ms = Math.max(0, end - start);
  if (ms < 1000) return `${ms} ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (minutes < 60) return `${minutes}m ${rem}s`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hours}h ${remMin}m`;
}

export function formatCostCents(value: number | null): string {
  if (value === null) return "Unavailable";
  return `$${(value / 100).toFixed(2)}`;
}

export function formatTokenCount(value: number | null): string {
  if (value === null) return "Unavailable";
  return value.toLocaleString();
}

export function latestRun(runs: RunFact[]): RunFact | null {
  if (runs.length === 0) return null;
  return [...runs].sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""))[0] ?? null;
}

export function issueRefPath(identifier: string | null, issueId: string): string {
  return `/issues/${identifier ?? issueId}`;
}

export function issueTabPath(
  identifier: string | null,
  issueId: string,
  pluginId: string,
  tabSlotId: string
): string {
  const base = issueRefPath(identifier, issueId);
  return `${base}?tab=plugin:${pluginId}:${tabSlotId}`;
}
