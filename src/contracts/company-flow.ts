import type {
  AttentionItem,
  CanonicalIssueStatus,
  FieldAvailability,
  FreshnessState,
  IncidentFact,
  PhaseFact,
  PhaseProfile,
  RunFact,
  SourceError,
  TokenCostFacts
} from "./common.js";

export type CompanyFlowRootRow = {
  rootIssueId: string;
  identifier: string | null;
  title: string;
  projectId: string | null;
  projectName: string | null;
  assigneeAgentId: string | null;
  assigneeLabel: string | null;
  /** Null when the root entity could not be fetched; never a synthetic sentinel status. */
  canonicalStatus: CanonicalIssueStatus | null;
  currentStageType: string | null;
  currentParticipantId: string | null;
  /** Unavailable when orchestration summary could not be loaded for this root. */
  orchestrationAvailability: FieldAvailability;
  /** Null when orchestration is unavailable — never a synthetic zero. */
  blockerCount: number | null;
  latestRun: RunFact | null;
  elapsedMs: number | null;
  phases: PhaseFact[];
  phaseProfile: PhaseProfile;
  tokenCost: TokenCostFacts;
  deepLinkIssueId: string;
  rowError: SourceError | null;
};

export type CompanyFlowResponse = {
  companyId: string;
  phaseProfile: PhaseProfile;
  roots: CompanyFlowRootRow[];
  attention: AttentionItem[];
  companyIncidents: IncidentFact[];
  scopeUnavailableIncidents: IncidentFact[];
  counts: {
    active: number;
    blocked: number;
    inReview: number;
    failedRuns: number;
  };
  tokenCost: TokenCostFacts;
  freshness: FreshnessState;
  sourceErrors: SourceError[];
};
