import type {
  ApprovalFact,
  AttentionItem,
  CanonicalIssueStatus,
  DocumentFact,
  ExecutionPolicyFacts,
  ExecutionStateFacts,
  FreshnessState,
  IncidentFact,
  InvocationBlockFact,
  OrchestrationDerivedFacts,
  PhaseFact,
  PhaseProfile,
  RelationFact,
  RunFact,
  SourceError,
  TokenCostFacts,
  TokenCostScope
} from "../contracts/common.js";
import type {
  PluginBudgetIncidentSummary,
  PluginIssueApprovalSummary,
  PluginIssueInvocationBlockSummary,
  PluginIssueOrchestrationSummary,
  PluginIssueRunSummary,
  PluginIssueSubtree
} from "@paperclipai/plugin-sdk";
import { deriveAttentionItems } from "../domain/attention.js";
import { deriveBudgetIncidentRelevance } from "../domain/budget-incidents.js";
import { elapsedDurationMs } from "../domain/duration.js";
import {
  deriveCurrentPhaseKey,
  derivePhases,
  NATIVE_PHASES,
  SOFTWARE_DELIVERY_PHASES
} from "../domain/phases/derive.js";
import { resolveUniqueRoots } from "../domain/roots.js";
import { normalizeTokenCostFacts } from "../domain/token-cost.js";
import type {
  BlockerRef,
  DocumentRef,
  ExecutionPolicyRef,
  ExecutionStateRef,
  InvocationBlockRef,
  IssueRef,
  PhaseDerivationInput,
  RunRef,
  BudgetIncidentRelevance,
  IncidentAttentionTarget
} from "../domain/types.js";
import { MISSING_PUBLIC_SDK_FIELDS } from "./constants.js";
import type { CacheLoadResult } from "./cache.js";

type LoadedIssue = NonNullable<
  Awaited<ReturnType<import("@paperclipai/plugin-sdk").PluginContext["issues"]["get"]>>
>;

export function nowIso(): string {
  return new Date().toISOString();
}

export function buildFreshness(cache: CacheLoadResult<unknown>, partial: boolean): FreshnessState {
  return {
    fetchedAt: new Date(cache.fetchedAt).toISOString(),
    stale: cache.stale,
    partial,
    staleReason: cache.staleReason
  };
}

export function buildSourceError(source: string, error: unknown, recoverable = true): SourceError {
  return {
    source,
    message: error instanceof Error ? error.message : String(error),
    recoverable
  };
}

export function toRunRef(run: PluginIssueRunSummary): RunRef {
  return {
    id: run.id,
    issueId: run.issueId ?? "",
    agentId: run.agentId,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    invocationSource: run.invocationSource
  };
}

export function toRunFact(run: PluginIssueRunSummary): RunFact {
  return {
    id: run.id,
    issueId: run.issueId ?? "",
    agentId: run.agentId,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    invocationSource: run.invocationSource,
    availability: "available"
  };
}

export function toIncidentFact(incident: PluginBudgetIncidentSummary): IncidentFact {
  return {
    id: incident.id,
    scopeType: incident.scopeType,
    scopeId: incident.scopeId,
    scopeName: null,
    status: incident.status,
    availability: "available"
  };
}

export function toExecutionPolicy(issue: LoadedIssue): ExecutionPolicyRef | null {
  if (!issue.executionPolicy) return null;
  return {
    stages: issue.executionPolicy.stages.map((stage) => ({
      id: stage.id,
      type: stage.type,
      label: null
    }))
  };
}

export function toExecutionState(issue: LoadedIssue): ExecutionStateRef | null {
  if (!issue.executionState) return null;
  return {
    status: issue.executionState.status,
    currentStageId: issue.executionState.currentStageId,
    currentStageType: issue.executionState.currentStageType,
    currentParticipantAgentId: issue.executionState.currentParticipant?.agentId ?? null,
    currentParticipantUserId: issue.executionState.currentParticipant?.userId ?? null,
    completedStageIds: [...issue.executionState.completedStageIds],
    lastDecisionOutcome: issue.executionState.lastDecisionOutcome,
    changesRequestedCount: issue.executionState.changesRequestedCount
  };
}

export function toExecutionPolicyFacts(issue: LoadedIssue): ExecutionPolicyFacts {
  const policy = toExecutionPolicy(issue);
  if (!policy) {
    return { availability: "not_available", stages: [] };
  }
  return {
    availability: "available",
    stages: policy.stages.map((stage) => ({
      id: stage.id,
      type: stage.type,
      availability: "available" as const
    }))
  };
}

export function toExecutionStateFacts(
  issue: LoadedIssue,
  participantLabel: string | null = null
): ExecutionStateFacts {
  const state = toExecutionState(issue);
  if (!state) {
    return {
      availability: "not_available",
      status: null,
      currentStageId: null,
      currentStageType: null,
      currentParticipantAgentId: null,
      currentParticipantUserId: null,
      currentParticipantLabel: null,
      completedStageIds: [],
      lastDecisionOutcome: null,
      changesRequestedCount: null
    };
  }
  return {
    availability: "available",
    status: state.status,
    currentStageId: state.currentStageId,
    currentStageType: state.currentStageType,
    currentParticipantAgentId: state.currentParticipantAgentId,
    currentParticipantUserId: state.currentParticipantUserId,
    currentParticipantLabel: participantLabel,
    completedStageIds: [...state.completedStageIds],
    lastDecisionOutcome: state.lastDecisionOutcome,
    changesRequestedCount: state.changesRequestedCount ?? null
  };
}

export function toApprovalFact(approval: PluginIssueApprovalSummary): ApprovalFact {
  return {
    id: approval.id,
    issueId: approval.issueId,
    type: approval.type,
    status: approval.status,
    requestedByAgentId: approval.requestedByAgentId,
    requestedByUserId: approval.requestedByUserId,
    decidedByUserId: approval.decidedByUserId,
    decidedAt: approval.decidedAt,
    createdAt: approval.createdAt,
    availability: "available"
  };
}

export function toInvocationBlockFact(
  block: PluginIssueInvocationBlockSummary
): InvocationBlockFact {
  return {
    issueId: block.issueId,
    agentId: block.agentId,
    scopeType: block.scopeType,
    scopeId: block.scopeId,
    scopeName: block.scopeName,
    reason: block.reason,
    availability: "available"
  };
}

export function toOrchestrationDerivedFacts(
  orchestration: PluginIssueOrchestrationSummary | null,
  orchestrationFailed: boolean
): OrchestrationDerivedFacts {
  if (orchestrationFailed || !orchestration) {
    return {
      availability: "unavailable",
      approvals: [],
      invocationBlocks: []
    };
  }
  return {
    availability: "available",
    approvals: orchestration.approvals.map(toApprovalFact),
    invocationBlocks: (orchestration.invocationBlocks ?? []).map(toInvocationBlockFact)
  };
}

export function collectBlockers(
  issueId: string,
  relations: PluginIssueOrchestrationSummary["relations"]
): BlockerRef[] {
  const summary = relations[issueId];
  if (!summary) return [];
  return summary.blockedBy.map((blocker) => ({
    issueId,
    blockerIssueId: blocker.id,
    blockerIdentifier: blocker.identifier
  }));
}

export function collectDocuments(subtree: PluginIssueSubtree): DocumentRef[] {
  const docs: DocumentRef[] = [];
  if (!subtree.documents) return docs;
  for (const [issueId, entries] of Object.entries(subtree.documents)) {
    for (const doc of entries) {
      docs.push({
        id: doc.id,
        issueId,
        key: doc.key,
        title: doc.title
      });
    }
  }
  return docs;
}

export function collectDocumentFacts(subtree: PluginIssueSubtree): DocumentFact[] {
  return collectDocuments(subtree).map((doc) => ({
    id: doc.id,
    issueId: doc.issueId,
    key: doc.key,
    title: doc.title ?? null,
    availability: "available" as const
  }));
}

export function collectRelationFacts(
  issueId: string,
  relations: PluginIssueOrchestrationSummary["relations"]
): RelationFact[] {
  const summary = relations[issueId];
  if (!summary) return [];
  return summary.blockedBy.map((blocker) => ({
    id: `${issueId}:${blocker.id}`,
    kind: "blocked_by",
    fromIssueId: issueId,
    toIssueId: blocker.id,
    blockerIssueId: blocker.id,
    blockerIdentifier: blocker.identifier,
    availability: "available"
  }));
}

export function buildPhaseInput(
  issue: LoadedIssue,
  orchestration: PluginIssueOrchestrationSummary,
  subtree: PluginIssueSubtree
): PhaseDerivationInput {
  const runs = dedupeRuns(orchestration.runs).map(toRunRef);
  const blockers = collectBlockers(issue.id, orchestration.relations);
  const documents = collectDocuments(subtree);

  return {
    issueId: issue.id,
    canonicalStatus: issue.status as CanonicalIssueStatus,
    executionPolicy: toExecutionPolicy(issue),
    executionState: toExecutionState(issue),
    runs,
    blockers,
    documents,
    workProducts: [],
    deployReceipts: [],
    sdkCompatible: true,
    missingSdkFields: [...MISSING_PUBLIC_SDK_FIELDS]
  };
}

function dedupeRuns(runs: PluginIssueRunSummary[]): PluginIssueRunSummary[] {
  const seen = new Set<string>();
  const out: PluginIssueRunSummary[] = [];
  for (const run of runs) {
    if (seen.has(run.id)) continue;
    seen.add(run.id);
    out.push(run);
  }
  return out;
}

export function buildRootIssueIdMap(refs: IssueRef[]): Map<string, string> {
  const memo = new Map<string, string>();
  for (const ref of refs) {
    memo.set(ref.id, ref.rootId ?? ref.id);
  }
  return memo;
}

/** Map every validated subtree issue to the authoritative subtree root. */
export function buildSubtreeRootMap(
  subtreeIssueIds: string[],
  rootIssueId: string
): Map<string, string> {
  return new Map(subtreeIssueIds.map((issueId) => [issueId, rootIssueId]));
}

export function buildCompanyIncidentTargets(
  incidentRelevance: BudgetIncidentRelevance[],
  allIncidents: PluginBudgetIncidentSummary[],
  issueById: Map<string, LoadedIssue>,
  issueRefs: IssueRef[],
  companyId: string
): Map<string, IncidentAttentionTarget> {
  const targets = new Map<string, IncidentAttentionTarget>();
  const incidentById = new Map(allIncidents.map((incident) => [incident.id, incident]));

  for (const item of incidentRelevance) {
    const incident = incidentById.get(item.incidentId);
    if (!incident || incident.status !== "open") continue;

    if (item.level === "root") {
      const rootIssue = issueById.get(item.rootIssueId);
      const ref = issueRefs.find((entry) => entry.id === item.rootIssueId);
      targets.set(item.incidentId, {
        issueId: item.rootIssueId,
        rootIssueId: item.rootIssueId,
        identifier: rootIssue?.identifier ?? ref?.identifier ?? null,
        title: rootIssue?.title ?? ref?.title ?? incident.id
      });
      continue;
    }

    if (item.level === "company" || item.level === "scope_unavailable") {
      targets.set(item.incidentId, {
        issueId: companyId,
        rootIssueId: companyId,
        identifier: null,
        title: incident.id
      });
    }
  }

  return targets;
}

export function buildIssueFlowIncidentTargets(
  attachedIncidentIds: Set<string>,
  incidents: PluginBudgetIncidentSummary[],
  selectedIssue: LoadedIssue,
  rootIssueId: string
): Map<string, IncidentAttentionTarget> {
  const targets = new Map<string, IncidentAttentionTarget>();
  for (const incident of incidents) {
    if (!attachedIncidentIds.has(incident.id) || incident.status !== "open") continue;
    targets.set(incident.id, {
      issueId: selectedIssue.id,
      rootIssueId,
      identifier: selectedIssue.identifier,
      title: selectedIssue.title
    });
  }
  return targets;
}

export function unavailablePhaseFacts(profile: PhaseProfile, explanation: string): PhaseFact[] {
  const defs = profile === "native" ? NATIVE_PHASES : SOFTWARE_DELIVERY_PHASES;
  return defs.map((definition) => ({
    key: definition.key,
    label: definition.label,
    state: "unavailable" as const,
    startedAt: null,
    completedAt: null,
    source: [],
    explanation
  }));
}

export function unavailableTokenCost(
  scope: TokenCostScope,
  snapshotAt: string | null
): TokenCostFacts {
  return normalizeTokenCostFacts(null, scope, snapshotAt, { sdkFieldMissing: true });
}

export function computeUnresolvableScopeIds(
  incidents: PluginBudgetIncidentSummary[],
  loadedProjectIds: Set<string>,
  loadedAgentIds: Set<string>
): Set<string> {
  const unresolvable = new Set<string>();
  for (const incident of incidents) {
    if (incident.scopeType === "project" && !loadedProjectIds.has(incident.scopeId)) {
      unresolvable.add(incident.scopeId);
    }
    if (incident.scopeType === "agent" && !loadedAgentIds.has(incident.scopeId)) {
      unresolvable.add(incident.scopeId);
    }
  }
  return unresolvable;
}

export function collectParticipantAgentIds(
  subtreeIssueIds: string[],
  issueById: Map<string, LoadedIssue>,
  summary?: PluginIssueOrchestrationSummary
): string[] {
  const ids = new Set<string>();
  for (const issueId of subtreeIssueIds) {
    const issue = issueById.get(issueId);
    if (!issue) continue;
    if (issue.assigneeAgentId) ids.add(issue.assigneeAgentId);
    const participantAgentId = issue.executionState?.currentParticipant?.agentId;
    if (participantAgentId) ids.add(participantAgentId);
  }
  if (summary) {
    for (const run of summary.runs) {
      if (run.agentId) ids.add(run.agentId);
    }
    for (const block of summary.invocationBlocks ?? []) {
      if (block.agentId) ids.add(block.agentId);
    }
  }
  return [...ids];
}

export function buildAttentionForCompany(
  issueRefs: IssueRef[],
  issueById: Map<string, LoadedIssue>,
  orchestrationByRoot: Map<string, PluginIssueOrchestrationSummary>,
  rootMap: Map<string, string>,
  incidentRelevance: BudgetIncidentRelevance[],
  allIncidents: PluginBudgetIncidentSummary[],
  companyId: string
): AttentionItem[] {
  const allRuns: RunRef[] = [];
  const allBlockers: BlockerRef[] = [];
  const allInvocationBlocks: InvocationBlockRef[] = [];
  const incidentIdsForAttention = new Set<string>();

  for (const item of incidentRelevance) {
    incidentIdsForAttention.add(item.incidentId);
  }

  const incidents = allIncidents
    .filter((incident) => incidentIdsForAttention.has(incident.id))
    .map((incident) => ({
      id: incident.id,
      scopeType: incident.scopeType,
      scopeId: incident.scopeId,
      status: incident.status
    }));

  for (const summary of orchestrationByRoot.values()) {
    for (const run of dedupeRuns(summary.runs)) {
      allRuns.push(toRunRef(run));
    }
    for (const block of summary.invocationBlocks ?? []) {
      allInvocationBlocks.push({
        issueId: block.issueId,
        agentId: block.agentId,
        scopeType: block.scopeType,
        scopeId: block.scopeId,
        reason: block.reason
      });
    }
    for (const issueId of summary.subtreeIssueIds) {
      allBlockers.push(...collectBlockers(issueId, summary.relations));
    }
  }

  const executionStates = issueRefs.map((issue) => ({
    issueId: issue.id,
    state: issueById.has(issue.id) ? toExecutionState(issueById.get(issue.id)!) : null
  }));

  const incidentTargets = buildCompanyIncidentTargets(
    incidentRelevance,
    allIncidents,
    issueById,
    issueRefs,
    companyId
  );

  return deriveAttentionItems({
    issues: issueRefs,
    runs: allRuns,
    blockers: allBlockers,
    invocationBlocks: allInvocationBlocks,
    incidents,
    incidentTargets,
    executionStates,
    rootIssueIdByIssueId: rootMap
  });
}

export function aggregateLoadedRootTokenCost(
  summaries: PluginIssueOrchestrationSummary[],
  snapshotAt: string | null,
  options?: { orchestrationUnavailable?: boolean }
): TokenCostFacts {
  if (options?.orchestrationUnavailable) {
    return unavailableTokenCost("loaded_active_roots", snapshotAt);
  }

  if (summaries.length === 0) {
    return normalizeTokenCostFacts(null, "loaded_active_roots", snapshotAt);
  }

  let inputTokens = 0;
  let cachedInputTokens = 0;
  let outputTokens = 0;
  let costCents = 0;
  let billingCode: string | null = null;

  for (const summary of summaries) {
    inputTokens += summary.costs.inputTokens;
    cachedInputTokens += summary.costs.cachedInputTokens;
    outputTokens += summary.costs.outputTokens;
    costCents += summary.costs.costCents;
    billingCode = summary.costs.billingCode ?? billingCode;
  }

  return normalizeTokenCostFacts(
    { inputTokens, cachedInputTokens, outputTokens, costCents, billingCode },
    "loaded_active_roots",
    snapshotAt
  );
}

export function uniqueRootIds(refs: IssueRef[]): string[] {
  return resolveUniqueRoots(refs);
}

export function latestRunForIssue(runs: PluginIssueRunSummary[], issueId: string) {
  return dedupeRuns(runs.filter((run) => run.issueId === issueId)).sort((a, b) =>
    (b.startedAt ?? "").localeCompare(a.startedAt ?? "")
  )[0];
}

export function elapsedForRun(
  run: PluginIssueRunSummary | undefined,
  nowMs: number
): number | null {
  if (!run) return null;
  return elapsedDurationMs(run.startedAt, run.finishedAt, nowMs);
}

export { derivePhases, deriveCurrentPhaseKey, deriveBudgetIncidentRelevance };
