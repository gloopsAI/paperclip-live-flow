import type { CompanyFlowResponse } from "../../../src/contracts/company-flow.js";

export const COMPANY_ID = "11111111-1111-1111-1111-111111111111";
export const PROJECT_A = "33333333-3333-3333-3333-333333333333";
export const PROJECT_B = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

export const AGENT_IDS = [
  "77777777-7777-7777-7777-000000000001",
  "77777777-7777-7777-7777-000000000002",
  "77777777-7777-7777-7777-000000000003",
  "77777777-7777-7777-7777-000000000004",
  "77777777-7777-7777-7777-000000000005",
  "77777777-7777-7777-7777-000000000006",
  "77777777-7777-7777-7777-000000000007",
  "77777777-7777-7777-7777-000000000008",
  "77777777-7777-7777-7777-000000000009"
] as const;

const agents = AGENT_IDS.map((id, index) => ({ id, label: `Agent ${index + 1}` }));

export const ROOT_ACTIVE = "44444444-4444-4444-4444-444444444444";
export const ROOT_BLOCKED = "55555555-5555-5555-5555-555555555555";
export const ROOT_REVIEW = "66666666-6666-6666-6666-666666666666";

function baseRow(
  rootIssueId: string,
  overrides: Partial<CompanyFlowResponse["roots"][0]> = {}
): CompanyFlowResponse["roots"][0] {
  return {
    rootIssueId,
    identifier: `LF-${rootIssueId.slice(0, 4)}`,
    title: `Issue ${rootIssueId.slice(0, 4)}`,
    projectId: PROJECT_A,
    projectName: "Project A",
    assigneeAgentId: agents[0].id,
    assigneeLabel: agents[0].label,
    canonicalStatus: "in_progress",
    currentStageType: "work",
    currentParticipantId: agents[1].id,
    orchestrationAvailability: "available",
    blockerCount: 0,
    latestRun: {
      id: `run-${rootIssueId}`,
      issueId: rootIssueId,
      agentId: agents[0].id,
      status: "running",
      startedAt: "2026-09-03T12:00:00.000Z",
      finishedAt: null,
      invocationSource: "checkout",
      availability: "available"
    },
    elapsedMs: 120_000,
    phases: [],
    phaseProfile: "software_delivery",
    tokenCost: {
      scope: "loaded_active_roots",
      availability: "available",
      inputTokens: 100,
      cachedInputTokens: 20,
      outputTokens: 40,
      costCents: 10,
      billingCode: null,
      snapshotAt: "2026-09-03T12:05:00.000Z",
      scopeLabel: "loaded active roots"
    },
    deepLinkIssueId: rootIssueId,
    rowError: null,
    ...overrides
  };
}

export function baseCompanyFlow(overrides: Partial<CompanyFlowResponse> = {}): CompanyFlowResponse {
  return {
    companyId: COMPANY_ID,
    phaseProfile: "software_delivery",
    roots: [
      baseRow(ROOT_ACTIVE),
      baseRow(ROOT_BLOCKED, {
        identifier: "LF-BLK",
        title: "Blocked root",
        canonicalStatus: "blocked",
        blockerCount: 1,
        projectId: PROJECT_B,
        projectName: "Project B",
        assigneeAgentId: agents[2].id,
        assigneeLabel: agents[2].label
      }),
      baseRow(ROOT_REVIEW, {
        identifier: "LF-REV",
        title: "Review root",
        canonicalStatus: "in_review",
        currentStageType: "review",
        latestRun: {
          id: "run-failed",
          issueId: ROOT_REVIEW,
          agentId: agents[3].id,
          status: "failed",
          startedAt: "2026-09-03T11:00:00.000Z",
          finishedAt: "2026-09-03T11:05:00.000Z",
          invocationSource: "manual",
          availability: "available"
        }
      })
    ],
    attention: [
      {
        issueId: ROOT_BLOCKED,
        rootIssueId: ROOT_BLOCKED,
        identifier: "LF-BLK",
        title: "Blocked root",
        reason: "blocked",
        explanation: "Blocked by dependency",
        source: []
      },
      {
        issueId: ROOT_REVIEW,
        rootIssueId: ROOT_REVIEW,
        identifier: "LF-REV",
        title: "Review root",
        reason: "pending_review",
        explanation: "Waiting for reviewer",
        source: []
      },
      {
        issueId: ROOT_REVIEW,
        rootIssueId: ROOT_REVIEW,
        identifier: "LF-REV",
        title: "Review root",
        reason: "failed_run",
        explanation: "Latest run failed",
        source: []
      },
      {
        issueId: COMPANY_ID,
        rootIssueId: COMPANY_ID,
        identifier: null,
        title: "incident-company",
        reason: "budget_incident",
        explanation: "Company budget incident",
        source: [{ kind: "budgetIncident", entityId: "incident-company", field: "status" }]
      },
      {
        issueId: ROOT_BLOCKED,
        rootIssueId: ROOT_BLOCKED,
        identifier: "LF-BLK",
        title: "Blocked root",
        reason: "budget_incident",
        explanation: "Root budget incident",
        source: [{ kind: "budgetIncident", entityId: "incident-root", field: "status" }]
      }
    ],
    companyIncidents: [
      {
        id: "incident-company",
        scopeType: "company",
        scopeId: COMPANY_ID,
        scopeName: null,
        status: "open",
        availability: "available"
      }
    ],
    scopeUnavailableIncidents: [
      {
        id: "incident-unresolved",
        scopeType: "project",
        scopeId: "missing-project",
        scopeName: null,
        status: "open",
        availability: "available"
      }
    ],
    counts: { active: 3, blocked: 1, inReview: 1, failedRuns: 1 },
    tokenCost: {
      scope: "loaded_active_roots",
      availability: "available",
      inputTokens: 500,
      cachedInputTokens: 100,
      outputTokens: 200,
      costCents: 55,
      billingCode: null,
      snapshotAt: "2026-09-03T12:05:00.000Z",
      scopeLabel: "loaded active roots"
    },
    freshness: {
      fetchedAt: "2026-09-03T12:05:00.000Z",
      stale: false,
      partial: false,
      staleReason: null
    },
    sourceErrors: [],
    ...overrides
  };
}

export const companySnapshot = baseCompanyFlow();
export const partialCompanySnapshot = baseCompanyFlow({
  freshness: {
    fetchedAt: "2026-09-02T08:00:00.000Z",
    stale: true,
    partial: true,
    staleReason: "Refresh degraded"
  },
  sourceErrors: [{ source: "orchestration", message: "partial source failure", recoverable: true }]
});

export const dashboardSnapshot = {
  companyId: COMPANY_ID,
  counts: companySnapshot.counts,
  topAttention: companySnapshot.attention.slice(0, 3),
  tokenCost: companySnapshot.tokenCost,
  freshness: companySnapshot.freshness,
  sourceErrors: companySnapshot.sourceErrors
};

export { agents as fixtureAgents };
