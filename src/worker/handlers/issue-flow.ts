import type { PluginContext, PluginIssueOrchestrationSummary } from "@paperclipai/plugin-sdk";
import type { IssueFlowResponse } from "../../contracts/issue-flow.js";
import { deriveAttentionItems } from "../../domain/attention.js";
import { deriveBudgetIncidentRelevance } from "../../domain/budget-incidents.js";
import { normalizeTokenCostFacts } from "../../domain/token-cost.js";
import type { CacheLoadResult } from "../cache.js";
import { sharedHandlerCache } from "../cache.js";
import {
  LiveFlowNotFoundError,
  assertEntityCompanyId,
  requireHostCompanyId,
  requireIssueId,
  validateCompanyEntities
} from "../company-scope.js";
import { MISSING_PUBLIC_SDK_FIELDS } from "../constants.js";
import {
  buildFreshness,
  buildIssueFlowIncidentTargets,
  buildPhaseInput,
  buildSubtreeRootMap,
  buildSourceError,
  collectDocumentFacts,
  collectRelationFacts,
  deriveCurrentPhaseKey,
  derivePhases,
  nowIso,
  toExecutionPolicyFacts,
  toExecutionStateFacts,
  toOrchestrationDerivedFacts,
  toExecutionState,
  toIncidentFact,
  toRunFact,
  unavailablePhaseFacts,
  unavailableTokenCost
} from "../normalize.js";
import { dedupeIncidents, toIssueRef } from "../read/issues.js";

const DEFAULT_PHASE_PROFILE = "software_delivery" as const;

async function loadIssueFlow(
  ctx: PluginContext,
  companyId: string,
  issueId: string
): Promise<IssueFlowResponse> {
  const fetchedAt = nowIso();
  const sourceErrors: IssueFlowResponse["sourceErrors"] = [];

  const issue = await ctx.issues.get(issueId, companyId);
  if (!issue || issue.companyId !== companyId) {
    throw new LiveFlowNotFoundError();
  }
  assertEntityCompanyId(issue.companyId, companyId);

  let subtree;
  try {
    subtree = await ctx.issues.getSubtree(issueId, companyId, {
      includeRoot: true,
      includeRelations: true,
      includeDocuments: true,
      includeActiveRuns: true,
      includeAssignees: true
    });
  } catch (error) {
    sourceErrors.push(buildSourceError("subtree", error));
    subtree = {
      rootIssueId: issue.id,
      companyId,
      issueIds: [issue.id],
      issues: [issue]
    };
  }

  assertEntityCompanyId(subtree.companyId, companyId);
  validateCompanyEntities(subtree.issues, companyId);

  let orchestration: PluginIssueOrchestrationSummary | null = null;
  let orchestrationFailed = false;
  try {
    orchestration = await ctx.issues.summaries.getOrchestration({
      issueId,
      companyId,
      includeSubtree: true
    });
    assertEntityCompanyId(orchestration.companyId, companyId);
  } catch (error) {
    orchestrationFailed = true;
    sourceErrors.push(buildSourceError("orchestration", error));
  }

  const phaseProfile = DEFAULT_PHASE_PROFILE;
  const phases = orchestrationFailed
    ? unavailablePhaseFacts(phaseProfile, "Orchestration summary unavailable")
    : derivePhases(phaseProfile, buildPhaseInput(issue, orchestration!, subtree));
  void deriveCurrentPhaseKey(phases);

  const relations = orchestration?.relations ?? subtree.relations ?? {};
  const runs = orchestrationFailed ? [] : (orchestration?.runs ?? []).map(toRunFact);
  const blockers = collectRelationFacts(issue.id, relations);
  const documents = collectDocumentFacts(subtree);

  const issueRef = toIssueRef(issue);
  const rootIssueId = subtree.rootIssueId;
  const rootMap = buildSubtreeRootMap(subtree.issueIds, rootIssueId);

  const dedupedIncidents = dedupeIncidents(orchestration?.openBudgetIncidents ?? []);
  const relevance = deriveBudgetIncidentRelevance({
    incidents: dedupedIncidents.map((incident) => ({
      id: incident.id,
      scopeType: incident.scopeType,
      scopeId: incident.scopeId,
      status: incident.status
    })),
    rootSummaries: [
      {
        rootIssueId,
        subtree: {
          issueIds: subtree.issueIds,
          assigneeAgentIds: subtree.issues
            .map((entry) => entry.assigneeAgentId)
            .filter((id): id is string => Boolean(id)),
          participantAgentIds: subtree.issues
            .map((entry) => entry.executionState?.currentParticipant?.agentId)
            .filter((id): id is string => Boolean(id)),
          projectIds: [
            ...new Set(
              subtree.issues
                .map((entry) => entry.projectId)
                .filter((id): id is string => Boolean(id))
            )
          ]
        }
      }
    ]
  });

  const attachedIncidentIds = new Set(
    relevance
      .filter((item) => item.level === "root" && item.rootIssueId === rootIssueId)
      .map((item) => item.incidentId)
  );

  const incidents = dedupedIncidents
    .filter((incident) => attachedIncidentIds.has(incident.id))
    .map(toIncidentFact);

  const incidentTargets = buildIssueFlowIncidentTargets(
    attachedIncidentIds,
    dedupedIncidents,
    issue,
    rootIssueId
  );

  const attention = deriveAttentionItems({
    issues: [issueRef],
    runs: (orchestration?.runs ?? []).map((run) => ({
      id: run.id,
      issueId: run.issueId ?? issue.id,
      agentId: run.agentId,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt
    })),
    blockers: blockers.map((relation) => ({
      issueId: relation.fromIssueId,
      blockerIssueId: relation.blockerIssueId ?? relation.toIssueId,
      blockerIdentifier: relation.blockerIdentifier
    })),
    invocationBlocks: (orchestration?.invocationBlocks ?? []).map((block) => ({
      issueId: block.issueId,
      agentId: block.agentId,
      scopeType: block.scopeType,
      scopeId: block.scopeId,
      reason: block.reason
    })),
    incidents: dedupedIncidents.filter((incident) => attachedIncidentIds.has(incident.id)),
    incidentTargets,
    executionStates: [
      {
        issueId: issue.id,
        state: toExecutionState(issue)
      }
    ],
    rootIssueIdByIssueId: rootMap
  });

  let projectName: string | null = null;
  if (issue.projectId) {
    try {
      const project = await ctx.projects.get(issue.projectId, companyId);
      if (project) {
        assertEntityCompanyId(project.companyId, companyId);
        projectName = project.name;
      }
    } catch (error) {
      sourceErrors.push(buildSourceError("projects.get", error));
    }
  }

  let assigneeLabel: string | null = null;
  if (issue.assigneeAgentId) {
    try {
      const agent = await ctx.agents.get(issue.assigneeAgentId, companyId);
      if (agent) {
        assertEntityCompanyId(agent.companyId, companyId);
        assigneeLabel = agent.name;
      }
    } catch (error) {
      sourceErrors.push(buildSourceError("agents.get", error));
    }
  }

  let participantLabel: string | null = null;
  const participantAgentId = issue.executionState?.currentParticipant?.agentId ?? null;
  if (participantAgentId) {
    try {
      const agent = await ctx.agents.get(participantAgentId, companyId);
      if (agent) {
        assertEntityCompanyId(agent.companyId, companyId);
        participantLabel = agent.name;
      }
    } catch (error) {
      sourceErrors.push(buildSourceError("agents.get.participant", error));
    }
  }

  const executionPolicy = toExecutionPolicyFacts(issue);
  const executionState = toExecutionStateFacts(issue, participantLabel);
  const orchestrationFacts = toOrchestrationDerivedFacts(orchestration, orchestrationFailed);

  return {
    companyId,
    issueId: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    projectId: issue.projectId,
    projectName,
    assigneeAgentId: issue.assigneeAgentId,
    assigneeLabel,
    canonicalStatus: issue.status as IssueFlowResponse["canonicalStatus"],
    createdAt: issue.createdAt ? new Date(issue.createdAt).toISOString() : null,
    updatedAt: issue.updatedAt ? new Date(issue.updatedAt).toISOString() : null,
    phaseProfile,
    phases,
    executionPolicy,
    executionState,
    orchestration: orchestrationFacts,
    blockers,
    runs,
    incidents,
    documents,
    workProducts: [],
    tokenCost: orchestrationFailed
      ? unavailableTokenCost("subtree", fetchedAt)
      : normalizeTokenCostFacts(orchestration!.costs, "subtree", fetchedAt),
    attention,
    compatibility: {
      compatible: !orchestrationFailed,
      message: orchestrationFailed ? "Orchestration summary unavailable" : null,
      missingFields: [...MISSING_PUBLIC_SDK_FIELDS]
    },
    freshness: {
      fetchedAt,
      stale: false,
      partial: sourceErrors.length > 0,
      staleReason: null
    },
    sourceErrors
  };
}

export function createIssueFlowHandler(ctx: PluginContext) {
  return async (params: Record<string, unknown>): Promise<IssueFlowResponse> => {
    const companyId = requireHostCompanyId(params);
    const issueId = requireIssueId(params);
    const cacheParams = { handler: "issue-flow", issueId };

    const cacheResult: CacheLoadResult<IssueFlowResponse> = await sharedHandlerCache.load(
      sharedHandlerCache.cacheKey(companyId, "issue-flow", cacheParams),
      () => loadIssueFlow(ctx, companyId, issueId)
    );

    return {
      ...cacheResult.value,
      freshness: buildFreshness(cacheResult, cacheResult.value.sourceErrors.length > 0)
    };
  };
}
