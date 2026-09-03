import type {
  AttentionItem,
  CanonicalIssueStatus,
  CompatibilityState,
  DocumentFact,
  FreshnessState,
  IncidentFact,
  PhaseFact,
  PhaseProfile,
  RelationFact,
  RunFact,
  SourceError,
  TokenCostFacts,
  WorkProductFact
} from "./common.js";

export type IssueFlowResponse = {
  companyId: string;
  issueId: string;
  identifier: string | null;
  title: string;
  projectId: string | null;
  projectName: string | null;
  assigneeAgentId: string | null;
  assigneeLabel: string | null;
  canonicalStatus: CanonicalIssueStatus;
  createdAt: string | null;
  updatedAt: string | null;
  phaseProfile: PhaseProfile;
  phases: PhaseFact[];
  blockers: RelationFact[];
  runs: RunFact[];
  incidents: IncidentFact[];
  documents: DocumentFact[];
  workProducts: WorkProductFact[];
  tokenCost: TokenCostFacts;
  attention: AttentionItem[];
  compatibility: CompatibilityState;
  freshness: FreshnessState;
  sourceErrors: SourceError[];
};
