export type GuardViolation = {
  rule: string;
  match: string;
  line: number | null;
  column: number | null;
};

export type GuardAttribution = {
  /** Optional path hint used for plugin-owned vs SDK-owned attribution. */
  filePath?: string;
  /**
   * Explicit SDK-owned segment marker for future bundle attribution (W2B/W6).
   * Never excludes plugin-owned UI by itself; requires trustworthy SDK path/build context.
   */
  sdkOwned?: boolean;
  /**
   * @deprecated Ignored for exclusion decisions — marker text in source must not bypass scans.
   */
  excludedMarkers?: string[];
};

const PLUGIN_OWNED_UI_PATH_PREFIXES = ["src/ui/"] as const;

const TRUSTWORTHY_SDK_PATH_MARKERS = ["node_modules/@paperclipai/plugin-sdk"] as const;

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function isPluginOwnedUiPath(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  return PLUGIN_OWNED_UI_PATH_PREFIXES.some((prefix) => normalized.includes(prefix));
}

function isTrustworthySdkPath(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  return TRUSTWORTHY_SDK_PATH_MARKERS.some((marker) => normalized.includes(marker));
}

/**
 * SDK transport may be excluded only with trustworthy path/build attribution.
 * Plugin-owned UI paths are always scanned, even when source embeds bridge marker strings.
 */
function isExcluded(_source: string, attribution?: GuardAttribution): boolean {
  const path = attribution?.filePath ?? "";

  if (path && isPluginOwnedUiPath(path)) {
    return false;
  }

  if (path && isTrustworthySdkPath(path)) {
    return true;
  }

  if (attribution?.sdkOwned === true && path && isTrustworthySdkPath(path)) {
    return true;
  }

  return false;
}

function findViolations(
  source: string,
  patterns: Array<{ rule: string; pattern: RegExp }>,
  attribution?: GuardAttribution
): GuardViolation[] {
  if (isExcluded(source, attribution)) {
    return [];
  }

  const violations: GuardViolation[] = [];
  const lines = source.split("\n");

  for (const { rule, pattern } of patterns) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex] ?? "";
      const match = pattern.exec(line);
      if (match) {
        violations.push({
          rule,
          match: match[0],
          line: lineIndex + 1,
          column: match.index + 1
        });
      }
    }
  }

  return violations;
}

const DIRECT_NETWORK_PATTERNS: Array<{ rule: string; pattern: RegExp }> = [
  { rule: "fetch-call", pattern: /\bfetch\s*\(/ },
  { rule: "xhr-constructor", pattern: /\bnew\s+XMLHttpRequest\s*\(/ },
  { rule: "send-beacon", pattern: /\bnavigator\s*\.\s*sendBeacon\s*\(/ },
  { rule: "websocket", pattern: /\bnew\s+WebSocket\s*\(/ },
  { rule: "eventsource", pattern: /\bnew\s+EventSource\s*\(/ },
  { rule: "axios-import", pattern: /from\s+["']axios["']/ },
  { rule: "axios-call", pattern: /\baxios\s*\.\s*(get|post|put|patch|delete|request)\s*\(/ },
  { rule: "node-fetch-import", pattern: /from\s+["']node-fetch["']/ },
  { rule: "got-import", pattern: /from\s+["']got["']/ },
  { rule: "ky-import", pattern: /from\s+["']ky["']/ },
  { rule: "form-action-host", pattern: /<form[^>]+action\s*=\s*["']\/api\//i },
  { rule: "form-action-action", pattern: /<form[^>]+action\s*=\s*["']\/action\//i }
];

const FORBIDDEN_ROUTE_LITERALS: Array<{ rule: string; pattern: RegExp }> = [
  {
    rule: "api-route-literal",
    pattern: /["'`]\/api\/(?:issues|agents|projects|companies|plugins)/
  },
  {
    rule: "action-route-literal",
    pattern: /["'`]\/action\/(?:issues|agents|projects|companies|plugins)/
  },
  { rule: "plugin-bridge-allowed-marker", pattern: /["'`]\/__paperclip\/plugin-data/ }
];

/** Scan plugin-owned UI source for forbidden direct network / host route usage. */
export function scanPluginSourceForDirectNetwork(
  source: string,
  attribution?: GuardAttribution
): GuardViolation[] {
  return findViolations(source, DIRECT_NETWORK_PATTERNS, attribution);
}

/** Scan plugin-owned source for embedded ordinary Paperclip API/action route literals. */
export function scanPluginSourceForForbiddenRoutes(
  source: string,
  attribution?: GuardAttribution
): GuardViolation[] {
  const violations = findViolations(source, FORBIDDEN_ROUTE_LITERALS, attribution);
  return violations.filter((v) => v.rule !== "plugin-bridge-allowed-marker");
}

/** Scan built UI bundle for forbidden patterns (minified-safe literal scan). */
export function scanBuiltBundleForDirectNetwork(
  bundle: string,
  attribution?: GuardAttribution
): GuardViolation[] {
  return findViolations(bundle, DIRECT_NETWORK_PATTERNS, attribution);
}

export function scanBuiltBundleForForbiddenRoutes(
  bundle: string,
  attribution?: GuardAttribution
): GuardViolation[] {
  const violations = findViolations(bundle, FORBIDDEN_ROUTE_LITERALS, attribution);
  return violations.filter((v) => v.rule !== "plugin-bridge-allowed-marker");
}

/** Combined guard for plugin-owned UI source. */
export function assertPluginUiReadBoundary(
  source: string,
  attribution?: GuardAttribution
): GuardViolation[] {
  return [
    ...scanPluginSourceForDirectNetwork(source, attribution),
    ...scanPluginSourceForForbiddenRoutes(source, attribution)
  ];
}

/** True when attribution identifies trustworthy SDK-owned transport, not plugin UI. */
export function isSdkBridgeAttributed(attribution: GuardAttribution): boolean {
  const path = attribution.filePath ?? "";
  if (path && isPluginOwnedUiPath(path)) {
    return false;
  }
  if (path && isTrustworthySdkPath(path)) {
    return true;
  }
  return attribution.sdkOwned === true && !!path && isTrustworthySdkPath(path);
}

export { isPluginOwnedUiPath, isTrustworthySdkPath };
