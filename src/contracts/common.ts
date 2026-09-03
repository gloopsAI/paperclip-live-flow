/** Canonical issue status values displayed unchanged from Paperclip. */
export type CanonicalIssueStatus =
  "todo" | "in_progress" | "in_review" | "blocked" | "done" | "cancelled";

/** Phase rail state for native and software-delivery profiles. */
export type PhaseState =
  "not_started" | "active" | "completed" | "blocked" | "failed" | "not_tracked" | "unavailable";

/** Field-level availability when the installed SDK omits a public fact. */
export type FieldAvailability = "available" | "unavailable" | "not_available";

/** Provenance pointer to an authoritative SDK field. */
export type ProvenanceSource = {
  kind: string;
  entityId: string;
  field: string;
};

export type PhaseFact = {
  key: string;
  label: string;
  state: PhaseState;
  startedAt: string | null;
  completedAt: string | null;
  source: ProvenanceSource[];
  explanation: string;
};

export type PhaseProfile = "native" | "software_delivery";

export type SourceError = {
  source: string;
  message: string;
  recoverable: boolean;
};

export type FreshnessState = {
  fetchedAt: string;
  stale: boolean;
  partial: boolean;
  staleReason: string | null;
};

export type CompatibilityState = {
  compatible: boolean;
  message: string | null;
  missingFields: string[];
};

export type TokenCostScope = "issue" | "subtree" | "loaded_active_roots" | "company";

/** Aggregate token/cost facts preserved exactly from orchestration summaries. */
export type TokenCostFacts = {
  scope: TokenCostScope;
  availability: FieldAvailability;
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  costCents: number | null;
  billingCode: string | null;
  snapshotAt: string | null;
  /** Human label such as "loaded active roots" — never implies all-time company spend. */
  scopeLabel: string;
};

export type RunFact = {
  id: string;
  issueId: string;
  agentId: string | null;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  invocationSource: string | null;
  availability: FieldAvailability;
};

export type IncidentFact = {
  id: string;
  scopeType: string;
  scopeId: string;
  scopeName: string | null;
  status: string;
  availability: FieldAvailability;
};

export type RelationFact = {
  id: string;
  kind: string;
  fromIssueId: string;
  toIssueId: string;
  blockerIssueId: string | null;
  blockerIdentifier: string | null;
  availability: FieldAvailability;
};

export type DocumentFact = {
  id: string;
  issueId: string;
  key: string;
  title: string | null;
  availability: FieldAvailability;
};

export type WorkProductFact = {
  id: string;
  issueId: string;
  type: string;
  status: string;
  url: string | null;
  availability: FieldAvailability;
};

export type AttentionReason =
  | "blocked"
  | "invocation_block"
  | "budget_incident"
  | "failed_run"
  | "pending_review"
  | "pending_approval"
  | "changes_requested";

export type AttentionItem = {
  issueId: string;
  rootIssueId: string;
  identifier: string | null;
  title: string;
  reason: AttentionReason;
  explanation: string;
  source: ProvenanceSource[];
};

export const CONTEXT_WINDOW_UTILIZATION_MESSAGE =
  "Context-window utilization is not exposed by the current Paperclip plugin API." as const;

export const LOADED_ACTIVE_ROOTS_LABEL = "loaded active roots" as const;

/** Native execution policy stage configured on the validated issue. */
export type ExecutionStageFact = {
  id: string;
  type: string;
  availability: FieldAvailability;
};

/** Read-only execution policy facts from the validated issue. */
export type ExecutionPolicyFacts = {
  availability: FieldAvailability;
  stages: ExecutionStageFact[];
};

/** Read-only native execution state facts from the validated issue. */
export type ExecutionStateFacts = {
  availability: FieldAvailability;
  status: string | null;
  currentStageId: string | null;
  currentStageType: string | null;
  currentParticipantAgentId: string | null;
  currentParticipantUserId: string | null;
  currentParticipantLabel: string | null;
  completedStageIds: string[];
  lastDecisionOutcome: string | null;
  changesRequestedCount: number | null;
};

/** Approval summary fact from orchestration — unavailable when orchestration load fails. */
export type ApprovalFact = {
  id: string;
  issueId: string;
  type: string;
  status: string;
  requestedByAgentId: string | null;
  requestedByUserId: string | null;
  decidedByUserId: string | null;
  decidedAt: string | null;
  createdAt: string | null;
  availability: FieldAvailability;
};

/** Invocation block summary fact from orchestration — unavailable when orchestration load fails. */
export type InvocationBlockFact = {
  issueId: string;
  agentId: string;
  scopeType: string;
  scopeId: string;
  scopeName: string | null;
  reason: string;
  availability: FieldAvailability;
};

/** Orchestration-derived collections with collection-level availability. */
export type OrchestrationDerivedFacts = {
  availability: FieldAvailability;
  approvals: ApprovalFact[];
  invocationBlocks: InvocationBlockFact[];
};
