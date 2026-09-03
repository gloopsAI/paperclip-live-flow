import type { AttentionItem, FreshnessState, SourceError, TokenCostFacts } from "./common.js";

export type DashboardSummaryResponse = {
  companyId: string;
  counts: {
    active: number;
    blocked: number;
    inReview: number;
    failedRuns: number;
  };
  topAttention: AttentionItem[];
  tokenCost: TokenCostFacts;
  freshness: FreshnessState;
  sourceErrors: SourceError[];
};
