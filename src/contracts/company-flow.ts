import type {
  AttentionItem,
  CanonicalIssueStatus,
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
  canonicalStatus: CanonicalIssueStatus;
  currentStageType: string | null;
  currentParticipantId: string | null;
  blockerCount: number;
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
