import type { FieldAvailability, RunFact } from "../../contracts/common.js";

export function formatElapsedMs(
  value: number | null,
  orchestrationAvailability: FieldAvailability = "available"
): string {
  if (orchestrationAvailability !== "available") return "Unavailable";
  if (value === null) return "—";
  if (value < 1000) return `${value} ms`;
  const seconds = Math.floor(value / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (minutes < 60) return `${minutes}m ${rem}s`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hours}h ${remMin}m`;
}

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function issueDeepLinkPath(identifier: string | null, issueId: string): string {
  return `/issues/${identifier ?? issueId}`;
}

export function companyPagePath(projectId?: string | null): string {
  if (!projectId) return "/live-flow";
  return `/live-flow?projectId=${encodeURIComponent(projectId)}`;
}

export function tokenCostLabel(
  availability: string,
  inputTokens: number | null,
  costCents: number | null
): string {
  if (availability !== "available") return "Unavailable";
  const tokens = inputTokens === null ? "—" : inputTokens.toLocaleString();
  const cost = costCents === null ? "—" : `$${(costCents / 100).toFixed(2)}`;
  return `${tokens} in / ${cost}`;
}

export function blockerCountLabel(
  count: number | null,
  orchestrationAvailability: FieldAvailability
): string {
  if (orchestrationAvailability !== "available" || count === null) return "Unavailable";
  return String(count);
}

export function runSummary(
  run: RunFact | null,
  orchestrationAvailability: FieldAvailability = "available"
): string {
  if (orchestrationAvailability !== "available") return "Unavailable";
  if (!run) return "None";
  return `${run.status}${run.agentId ? ` · ${run.agentId.slice(0, 8)}` : ""}`;
}
