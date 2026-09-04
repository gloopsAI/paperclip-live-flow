import type { PluginContext, PluginIssueSubtree } from "@paperclipai/plugin-sdk";
import type { CompanyFlowResponse } from "../../contracts/company-flow.js";
import type { CacheLoadResult } from "../cache.js";
import { sharedHandlerCache } from "../cache.js";
import { assertEntityCompanyId, requireHostCompanyId } from "../company-scope.js";
import { mapWithBoundedConcurrency } from "../concurrency.js";
import { ORCHESTRATION_CONCURRENCY } from "../constants.js";
import {
  aggregateLoadedRootTokenCost,
  buildAttentionForCompany,
  buildFreshness,
  buildPhaseInput,
  buildRootIssueIdMap,
  buildSourceError,
  collectBlockers,
  collectParticipantAgentIds,
  computeUnresolvableScopeIds,
  deriveBudgetIncidentRelevance,
  derivePhases,
  elapsedForRun,
  latestRunForIssue,
  nowIso,
  toIncidentFact,
  toRunFact,
  unavailablePhaseFacts,
  unavailableTokenCost,
  uniqueRootIds
} from "../normalize.js";
import {
  createIssueGetMemo,
  dedupeIncidents,
  enrichIssueRefsWithRoots,
  hydrateListedIssuesExecutionState,
  toIssueRef
} from "../read/issues.js";
import {
  loadActiveIssuesIndependent,
  loadAgentsIndependent,
  loadProjectsIndependent
} from "../read/load-sources.js";

const DEFAULT_PHASE_PROFILE = "software_delivery" as const;

async function loadCompanyFlow(
  ctx: PluginContext,
  companyId: string
): Promise<CompanyFlowResponse> {
  const fetchedAt = nowIso();
  const sourceErrors: CompanyFlowResponse["sourceErrors"] = [];
  const phaseProfile = DEFAULT_PHASE_PROFILE;

  const issuesResult = await loadActiveIssuesIndependent(ctx, companyId);
  const projectsResult = await loadProjectsIndependent(ctx, companyId);
  const agentsResult = await loadAgentsIndependent(ctx, companyId);
  sourceErrors.push(
    ...issuesResult.sourceErrors,
    ...projectsResult.sourceErrors,
    ...agentsResult.sourceErrors
  );

  const issues = issuesResult.data;
  const projects = projectsResult.data;
  const agents = agentsResult.data;

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));
  const agentNameById = new Map(agents.map((agent) => [agent.id, agent.name]));
  const loadedProjectIds = new Set(projects.map((project) => project.id));
  const loadedAgentIds = new Set(agents.map((agent) => agent.id));

  const getIssue = createIssueGetMemo(ctx, companyId);
  const { hydrated, sourceErrors: hydrationErrors } = await hydrateListedIssuesExecutionState(
    issues,
    getIssue,
    ORCHESTRATION_CONCURRENCY
  );
  sourceErrors.push(...hydrationErrors);

  const issueById = new Map(issues.map((issue) => [issue.id, issue]));
  for (const [issueId, hydratedIssue] of hydrated) {
    assertEntityCompanyId(hydratedIssue.companyId, companyId);
    issueById.set(issueId, hydratedIssue);
  }

  const {
    refs: issueRefs,
    fetchedIssues,
    sourceErrors: enrichErrors
  } = await enrichIssueRefsWithRoots(
    [...issueById.values()].map((issue) => toIssueRef(issue)),
    getIssue
  );
  sourceErrors.push(...enrichErrors);

  for (const [issueId, fetchedIssue] of fetchedIssues) {
    assertEntityCompanyId(fetchedIssue.companyId, companyId);
    issueById.set(issueId, fetchedIssue);
  }

  const rootIds = uniqueRootIds(issueRefs);
  const rootMap = buildRootIssueIdMap(issueRefs);

  const orchestrationResults = await mapWithBoundedConcurrency(
    rootIds,
    ORCHESTRATION_CONCURRENCY,
    async (rootIssueId) => {
      try {
        const summary = await ctx.issues.summaries.getOrchestration({
          issueId: rootIssueId,
          companyId,
          includeSubtree: true
        });
        assertEntityCompanyId(summary.companyId, companyId);
        return { rootIssueId, summary, error: null as Error | null };
      } catch (error) {
        return {
          rootIssueId,
          summary: null,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    }
  );

  const orchestrationByRoot = new Map<
    string,
    NonNullable<(typeof orchestrationResults)[0]["summary"]>
  >();
  const successfulSummaries = [];
  for (const result of orchestrationResults) {
    if (result.summary) {
      orchestrationByRoot.set(result.rootIssueId, result.summary);
      successfulSummaries.push(result.summary);
    } else if (result.error) {
      sourceErrors.push(buildSourceError(`orchestration:${result.rootIssueId}`, result.error));
    }
  }

  const rootSummaries = rootIds.map((rootIssueId) => {
    const summary = orchestrationByRoot.get(rootIssueId);
    const subtreeIssues = issueRefs.filter((ref) => (ref.rootId ?? ref.id) === rootIssueId);
    const subtreeIssueIds = summary?.subtreeIssueIds ?? subtreeIssues.map((issue) => issue.id);
    return {
      rootIssueId,
      subtree: {
        issueIds: subtreeIssueIds,
        assigneeAgentIds: subtreeIssues
          .map((issue) => issue.assigneeAgentId)
          .filter((id): id is string => Boolean(id)),
        participantAgentIds: collectParticipantAgentIds(subtreeIssueIds, issueById, summary),
        projectIds: [
          ...new Set(
            subtreeIssues.map((issue) => issue.projectId).filter((id): id is string => Boolean(id))
          )
        ]
      }
    };
  });

  const allIncidents = dedupeIncidents(
    successfulSummaries.flatMap((summary) => summary.openBudgetIncidents)
  );
  const unresolvableScopeIds = computeUnresolvableScopeIds(
    allIncidents,
    loadedProjectIds,
    loadedAgentIds
  );
  const incidentRelevance = deriveBudgetIncidentRelevance({
    incidents: allIncidents.map((incident) => ({
      id: incident.id,
      scopeType: incident.scopeType,
      scopeId: incident.scopeId,
      status: incident.status
    })),
    rootSummaries,
    unresolvableScopeIds
  });

  const companyIncidents = allIncidents
    .filter((incident) =>
      incidentRelevance.some((item) => item.level === "company" && item.incidentId === incident.id)
    )
    .map(toIncidentFact);

  const scopeUnavailableIncidents = allIncidents
    .filter((incident) =>
      incidentRelevance.some(
        (item) => item.level === "scope_unavailable" && item.incidentId === incident.id
      )
    )
    .map(toIncidentFact);

  const attention = buildAttentionForCompany(
    issueRefs,
    issueById,
    orchestrationByRoot,
    rootMap,
    incidentRelevance,
    allIncidents,
    companyId
  );

  const nowMs = Date.now();
  const roots: CompanyFlowResponse["roots"] = rootIds.map((rootIssueId) => {
    const issue = issueById.get(rootIssueId) ?? null;
    const summary = orchestrationByRoot.get(rootIssueId);
    const orchestrationFailed = !summary;
    const rowError = summary
      ? null
      : (sourceErrors.find((entry) => entry.source === `orchestration:${rootIssueId}`) ?? {
          source: `issues.get:${rootIssueId}`,
          message: issue ? "Orchestration summary unavailable" : "Root issue unavailable",
          recoverable: true
        });

    if (!issue) {
      return {
        rootIssueId,
        identifier: null,
        title: "",
        projectId: null,
        projectName: null,
        assigneeAgentId: null,
        assigneeLabel: null,
        canonicalStatus: null,
        currentStageType: null,
        currentParticipantId: null,
        orchestrationAvailability: "unavailable",
        blockerCount: null,
        latestRun: null,
        elapsedMs: null,
        phases: unavailablePhaseFacts(phaseProfile, rowError?.message ?? "Root issue unavailable"),
        phaseProfile,
        tokenCost: unavailableTokenCost("loaded_active_roots", fetchedAt),
        deepLinkIssueId: rootIssueId,
        rowError
      };
    }

    const subtreeStub: PluginIssueSubtree = {
      rootIssueId: issue.id,
      companyId,
      issueIds: summary?.subtreeIssueIds ?? [issue.id],
      issues: [issue]
    };
    const phases = orchestrationFailed
      ? unavailablePhaseFacts(phaseProfile, "Orchestration summary unavailable")
      : derivePhases(phaseProfile, buildPhaseInput(issue, summary, subtreeStub));
    const runs = summary?.runs ?? [];
    const latestRun = latestRunForIssue(runs, issue.id);

    return {
      rootIssueId,
      identifier: issue.identifier,
      title: issue.title,
      projectId: issue.projectId,
      projectName: issue.projectId ? (projectNameById.get(issue.projectId) ?? null) : null,
      assigneeAgentId: issue.assigneeAgentId,
      assigneeLabel: issue.assigneeAgentId
        ? (agentNameById.get(issue.assigneeAgentId) ?? issue.assigneeAgentId)
        : null,
      canonicalStatus: issue.status as CompanyFlowResponse["roots"][0]["canonicalStatus"],
      currentStageType: issue.executionState?.currentStageType ?? null,
      currentParticipantId:
        issue.executionState?.currentParticipant?.agentId ??
        issue.executionState?.currentParticipant?.userId ??
        null,
      orchestrationAvailability: orchestrationFailed ? "unavailable" : "available",
      blockerCount: orchestrationFailed
        ? null
        : collectBlockers(issue.id, summary?.relations ?? {}).length,
      latestRun: orchestrationFailed ? null : latestRun ? toRunFact(latestRun) : null,
      elapsedMs: orchestrationFailed ? null : elapsedForRun(latestRun, nowMs),
      phases,
      phaseProfile,
      tokenCost: orchestrationFailed
        ? unavailableTokenCost("loaded_active_roots", fetchedAt)
        : aggregateLoadedRootTokenCost([summary], fetchedAt),
      deepLinkIssueId: issue.id,
      rowError
    };
  });

  const failedRuns = roots.filter((row) => row.latestRun?.status === "failed").length;
  const counts = {
    active: roots.length,
    blocked: roots.filter((row) => row.canonicalStatus === "blocked").length,
    inReview: roots.filter((row) => row.canonicalStatus === "in_review").length,
    failedRuns
  };

  const companyTokenCost =
    successfulSummaries.length > 0
      ? aggregateLoadedRootTokenCost(successfulSummaries, fetchedAt)
      : orchestrationResults.some((result) => result.error)
        ? unavailableTokenCost("loaded_active_roots", fetchedAt)
        : aggregateLoadedRootTokenCost([], fetchedAt);

  return {
    companyId,
    phaseProfile,
    roots,
    attention,
    companyIncidents,
    scopeUnavailableIncidents,
    counts,
    tokenCost: companyTokenCost,
    freshness: {
      fetchedAt,
      stale: false,
      partial: sourceErrors.length > 0,
      staleReason: null
    },
    sourceErrors
  };
}

export function createCompanyFlowHandler(ctx: PluginContext) {
  return async (params: Record<string, unknown>): Promise<CompanyFlowResponse> => {
    const companyId = requireHostCompanyId(params);
    const cacheParams = { handler: "company-flow" };
    const cacheResult: CacheLoadResult<CompanyFlowResponse> = await sharedHandlerCache.load(
      sharedHandlerCache.cacheKey(companyId, "company-flow", cacheParams),
      () => loadCompanyFlow(ctx, companyId)
    );

    const response = {
      ...cacheResult.value,
      freshness: buildFreshness(cacheResult, cacheResult.value.sourceErrors.length > 0)
    };
    return response;
  };
}
