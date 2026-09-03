import type { CanonicalIssueStatus, PhaseState, ProvenanceSource } from "../contracts/common.js";

/** Minimal issue record for pure derivations (no I/O). */
export type IssueRef = {
  id: string;
  parentId: string | null;
  rootId?: string | null;
  projectId: string | null;
  assigneeAgentId: string | null;
  identifier: string | null;
  title: string;
  status: CanonicalIssueStatus;
};

export type RunRef = {
  id: string;
  issueId: string;
  agentId: string | null;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  invocationSource?: string | null;
};

export type IncidentRef = {
  id: string;
  scopeType: string;
  scopeId: string;
  scopeName?: string | null;
  status: string;
};

export type ExecutionStageRef = {
  id: string;
  type: string;
  label?: string | null;
};

export type ExecutionStateRef = {
  status: string;
  currentStageId: string | null;
  currentStageType: string | null;
  currentParticipantAgentId: string | null;
  currentParticipantUserId: string | null;
  completedStageIds: string[];
  lastDecisionOutcome: string | null;
  changesRequestedCount?: number;
};

export type ExecutionPolicyRef = {
  stages: ExecutionStageRef[];
};

export type BlockerRef = {
  issueId: string;
  blockerIssueId: string;
  blockerIdentifier: string | null;
};

export type DocumentRef = {
  id: string;
  issueId: string;
  key: string;
  title?: string | null;
};

export type WorkProductRef = {
  id: string;
  issueId: string;
  type: string;
  status: string;
  url?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type DeployReceiptRef = {
  id: string;
  issueId: string;
  status: string;
  url?: string | null;
};

export type PhaseDerivationInput = {
  issueId: string;
  canonicalStatus: CanonicalIssueStatus;
  executionPolicy: ExecutionPolicyRef | null;
  executionState: ExecutionStateRef | null;
  runs: RunRef[];
  blockers: BlockerRef[];
  documents: DocumentRef[];
  workProducts: WorkProductRef[];
  deployReceipts: DeployReceiptRef[];
  /** When false, fields that require newer SDK shapes return unavailable. */
  sdkCompatible: boolean;
  /** Fields the installed SDK is known to omit. */
  missingSdkFields?: string[];
};

export type ResolvedPhaseState = {
  state: PhaseState;
  source: ProvenanceSource[];
  explanation: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type SubtreeContext = {
  issueIds: string[];
  assigneeAgentIds: string[];
  participantAgentIds: string[];
  projectIds: string[];
};

export type RootSummaryContext = {
  rootIssueId: string;
  subtree: SubtreeContext;
};

export type BudgetIncidentRelevance =
  | { level: "company"; incidentId: string }
  | { level: "root"; rootIssueId: string; incidentId: string }
  | { level: "scope_unavailable"; incidentId: string };

export type TokenCostInput = {
  inputTokens?: number | null;
  cachedInputTokens?: number | null;
  outputTokens?: number | null;
  costCents?: number | null;
  billingCode?: string | null;
};
