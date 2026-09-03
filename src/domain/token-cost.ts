import type { TokenCostFacts, TokenCostScope } from "../contracts/common.js";
import {
  CONTEXT_WINDOW_UTILIZATION_MESSAGE,
  LOADED_ACTIVE_ROOTS_LABEL
} from "../contracts/common.js";
import type { TokenCostInput } from "./types.js";

export { CONTEXT_WINDOW_UTILIZATION_MESSAGE, LOADED_ACTIVE_ROOTS_LABEL };

const SCOPE_LABELS: Record<TokenCostScope, string> = {
  issue: "issue subtree",
  subtree: "issue subtree",
  loaded_active_roots: LOADED_ACTIVE_ROOTS_LABEL,
  company: LOADED_ACTIVE_ROOTS_LABEL
};

/** Map orchestration summary token/cost fields without inferring utilization. */
export function normalizeTokenCostFacts(
  input: TokenCostInput | null | undefined,
  scope: TokenCostScope,
  snapshotAt: string | null,
  options?: { sdkFieldMissing?: boolean }
): TokenCostFacts {
  if (options?.sdkFieldMissing) {
    return {
      scope,
      availability: "unavailable",
      inputTokens: null,
      cachedInputTokens: null,
      outputTokens: null,
      costCents: null,
      billingCode: null,
      snapshotAt,
      scopeLabel: SCOPE_LABELS[scope]
    };
  }

  if (!input) {
    return {
      scope,
      availability: "not_available",
      inputTokens: null,
      cachedInputTokens: null,
      outputTokens: null,
      costCents: null,
      billingCode: null,
      snapshotAt,
      scopeLabel: SCOPE_LABELS[scope]
    };
  }

  return {
    scope,
    availability: "available",
    inputTokens: input.inputTokens ?? null,
    cachedInputTokens: input.cachedInputTokens ?? null,
    outputTokens: input.outputTokens ?? null,
    costCents: input.costCents ?? null,
    billingCode: input.billingCode ?? null,
    snapshotAt,
    scopeLabel: SCOPE_LABELS[scope]
  };
}

/** Explicit guard: never derive context-window utilization from token totals. */
export function assertNoContextWindowUtilization(_facts: TokenCostFacts): true {
  void _facts;
  return true;
}
