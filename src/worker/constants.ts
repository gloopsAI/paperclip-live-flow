/** Active issue statuses loaded for company-flow (no recent-done window). */
export const ACTIVE_ISSUE_STATUSES = ["todo", "in_progress", "in_review", "blocked"] as const;

export const DEFAULT_PAGE_SIZE = 100;

export const ORCHESTRATION_CONCURRENCY = 4;

/** Foreground refresh default; also max in-memory cache TTL. */
export const CACHE_TTL_MS = 15_000;

export const UPSTREAM_PIN = {
  paperclipCommit: "da0947d3582ac7779d6bf11851c9938eca6c5c8c",
  pluginSdkVersion: "1.0.0",
  sharedVersion: "0.3.1"
} as const;

export const PLUGIN_ID = "gloops.live-flow" as const;

export const PLUGIN_VERSION = "0.1.0" as const;

/** Public SDK fields not exposed on the pinned orchestration/subtree surface. */
export const MISSING_PUBLIC_SDK_FIELDS = ["workProducts", "deployReceipts"] as const;

export const ISSUE_NOT_FOUND_MESSAGE = "Not found";
