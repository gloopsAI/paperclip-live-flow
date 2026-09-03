import type { IssueFlowResponse } from "../../../src/contracts/issue-flow.js";
import { CONTEXT_WINDOW_UTILIZATION_MESSAGE } from "../../../src/contracts/common.js";

export const ISSUE_ID = "44444444-4444-4444-4444-444444444444";
export const COMPANY_ID = "11111111-1111-1111-1111-111111111111";

const basePhases: IssueFlowResponse["phases"] = [
  {
    key: "build",
    label: "Build",
    state: "active",
    startedAt: "2026-09-03T12:00:00.000Z",
    completedAt: null,
    source: [{ kind: "issue", entityId: ISSUE_ID, field: "status" }],
    explanation: "Issue is in progress with an active agent run."
  },
  {
    key: "review",
    label: "Review",
    state: "not_started",
    startedAt: null,
    completedAt: null,
    source: [{ kind: "executionPolicy", entityId: ISSUE_ID, field: "stages.review" }],
    explanation: "Review stage not started."
  },
  {
    key: "merge",
    label: "Merge",
    state: "not_tracked",
    startedAt: null,
    completedAt: null,
    source: [],
    explanation: "Merge evidence is not tracked by the current public SDK."
  },
  {
    key: "deploy",
    label: "Deploy",
    state: "not_tracked",
    startedAt: null,
    completedAt: null,
    source: [],
    explanation: "Deploy evidence is not tracked by the current public SDK."
  }
];

const baseExecutionPolicy: IssueFlowResponse["executionPolicy"] = {
  availability: "available",
  stages: [
    { id: "stage-build", type: "work", availability: "available" },
    { id: "stage-review", type: "review", availability: "available" }
  ]
};

const baseExecutionState: IssueFlowResponse["executionState"] = {
  availability: "available",
  status: "in_progress",
  currentStageId: "stage-build",
  currentStageType: "work",
  currentParticipantAgentId: "77777777-7777-7777-7777-777777777777",
  currentParticipantUserId: null,
  currentParticipantLabel: "Worker",
  completedStageIds: [],
  lastDecisionOutcome: null,
  changesRequestedCount: 0
};

const baseOrchestration: IssueFlowResponse["orchestration"] = {
  availability: "available",
  approvals: [],
  invocationBlocks: []
};

export function baseIssueFlow(overrides: Partial<IssueFlowResponse> = {}): IssueFlowResponse {
  return {
    companyId: COMPANY_ID,
    issueId: ISSUE_ID,
    identifier: "LF-ROOT",
    title: "Root delivery issue",
    projectId: "33333333-3333-3333-3333-333333333333",
    projectName: "Project A",
    assigneeAgentId: "77777777-7777-7777-7777-777777777777",
    assigneeLabel: "Worker",
    canonicalStatus: "in_progress",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-03T12:05:00.000Z",
    phaseProfile: "software_delivery",
    phases: basePhases,
    executionPolicy: baseExecutionPolicy,
    executionState: baseExecutionState,
    orchestration: baseOrchestration,
    blockers: [],
    runs: [
      {
        id: "run-1",
        issueId: ISSUE_ID,
        agentId: "77777777-7777-7777-7777-777777777777",
        status: "running",
        startedAt: "2026-09-03T12:00:00.000Z",
        finishedAt: null,
        invocationSource: "checkout",
        availability: "available"
      }
    ],
    incidents: [],
    documents: [
      {
        id: "doc-1",
        issueId: ISSUE_ID,
        key: "plan",
        title: "Delivery plan",
        availability: "available"
      }
    ],
    workProducts: [],
    tokenCost: {
      scope: "subtree",
      availability: "available",
      inputTokens: 1200,
      cachedInputTokens: 300,
      outputTokens: 450,
      costCents: 42,
      billingCode: "LF-ROOT",
      snapshotAt: "2026-09-03T12:05:00.000Z",
      scopeLabel: "issue subtree"
    },
    attention: [],
    compatibility: {
      compatible: true,
      message: null,
      missingFields: ["workProducts", "deployReceipts"]
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

export const activeBuildFlow = baseIssueFlow();

export const pendingReviewFlow = baseIssueFlow({
  canonicalStatus: "in_review",
  executionState: {
    availability: "available",
    status: "in_progress",
    currentStageId: "stage-review",
    currentStageType: "review",
    currentParticipantAgentId: "88888888-8888-8888-8888-888888888888",
    currentParticipantUserId: null,
    currentParticipantLabel: "Reviewer Agent",
    completedStageIds: ["stage-build"],
    lastDecisionOutcome: null,
    changesRequestedCount: 0
  },
  orchestration: {
    availability: "available",
    approvals: [
      {
        id: "approval-review-1",
        issueId: ISSUE_ID,
        type: "review",
        status: "pending",
        requestedByAgentId: null,
        requestedByUserId: "user-reviewer-1",
        decidedByUserId: null,
        decidedAt: null,
        createdAt: "2026-09-03T11:30:00.000Z",
        availability: "available"
      }
    ],
    invocationBlocks: []
  },
  phases: basePhases.map((phase) =>
    phase.key === "build"
      ? { ...phase, state: "completed", completedAt: "2026-09-03T11:00:00.000Z" }
      : phase.key === "review"
        ? { ...phase, state: "active", explanation: "Waiting for reviewer assignment." }
        : phase
  ),
  attention: [
    {
      issueId: ISSUE_ID,
      rootIssueId: ISSUE_ID,
      identifier: "LF-ROOT",
      title: "Root delivery issue",
      reason: "pending_review",
      explanation: "Review participant agent-2 has not approved.",
      source: [{ kind: "executionState", entityId: ISSUE_ID, field: "review.pending" }]
    }
  ],
  runs: []
});

export const changesRequestedFlow = baseIssueFlow({
  canonicalStatus: "in_review",
  executionState: {
    ...baseExecutionState,
    availability: "available",
    currentStageId: "stage-review",
    currentStageType: "review",
    currentParticipantAgentId: "88888888-8888-8888-8888-888888888888",
    currentParticipantLabel: "Reviewer Agent",
    completedStageIds: ["stage-build"],
    lastDecisionOutcome: "changes_requested",
    changesRequestedCount: 2
  },
  attention: [
    {
      issueId: ISSUE_ID,
      rootIssueId: ISSUE_ID,
      identifier: "LF-ROOT",
      title: "Root delivery issue",
      reason: "changes_requested",
      explanation: "Reviewer requested changes on the latest diff.",
      source: [{ kind: "executionState", entityId: ISSUE_ID, field: "review.changesRequested" }]
    }
  ]
});

export const blockedRelationFlow = baseIssueFlow({
  canonicalStatus: "blocked",
  phases: basePhases.map((phase) =>
    phase.key === "build" ? { ...phase, state: "blocked" } : phase
  ),
  blockers: [
    {
      id: "rel-1",
      kind: "blocks",
      fromIssueId: ISSUE_ID,
      toIssueId: "55555555-5555-5555-5555-555555555555",
      blockerIssueId: "55555555-5555-5555-5555-555555555555",
      blockerIdentifier: "LF-BLOCKER",
      availability: "available"
    }
  ],
  attention: [
    {
      issueId: ISSUE_ID,
      rootIssueId: ISSUE_ID,
      identifier: "LF-ROOT",
      title: "Root delivery issue",
      reason: "blocked",
      explanation: "Blocked by LF-BLOCKER.",
      source: [{ kind: "relation", entityId: "rel-1", field: "blocks" }]
    }
  ]
});

export const failedRunFlow = baseIssueFlow({
  canonicalStatus: "in_progress",
  runs: [
    {
      id: "run-failed",
      issueId: ISSUE_ID,
      agentId: "77777777-7777-7777-7777-777777777777",
      status: "failed",
      startedAt: "2026-09-03T10:00:00.000Z",
      finishedAt: "2026-09-03T10:05:00.000Z",
      invocationSource: "manual",
      availability: "available"
    }
  ],
  attention: [
    {
      issueId: ISSUE_ID,
      rootIssueId: ISSUE_ID,
      identifier: "LF-ROOT",
      title: "Root delivery issue",
      reason: "failed_run",
      explanation: "Latest agent run failed with worker error.",
      source: [{ kind: "run", entityId: "run-failed", field: "status" }]
    }
  ]
});

export const doneWithoutMergeDeployFlow = baseIssueFlow({
  canonicalStatus: "done",
  phases: basePhases.map((phase) => {
    if (phase.key === "build" || phase.key === "review") {
      return { ...phase, state: "completed", completedAt: "2026-09-03T11:30:00.000Z" };
    }
    return phase;
  }),
  runs: [],
  attention: []
});

export const incompatibleSdkFlow = baseIssueFlow({
  orchestration: {
    availability: "unavailable",
    approvals: [],
    invocationBlocks: []
  },
  compatibility: {
    compatible: false,
    message: "Installed SDK is missing orchestration cost fields.",
    missingFields: ["workProducts", "deployReceipts", "orchestration.costs"]
  },
  tokenCost: {
    scope: "subtree",
    availability: "unavailable",
    inputTokens: null,
    cachedInputTokens: null,
    outputTokens: null,
    costCents: null,
    billingCode: null,
    snapshotAt: null,
    scopeLabel: "issue subtree"
  }
});

export const partialStaleFlow = baseIssueFlow({
  freshness: {
    fetchedAt: "2026-09-02T08:00:00.000Z",
    stale: true,
    partial: true,
    staleReason: "Background refresh failed; showing cached snapshot."
  },
  sourceErrors: [{ source: "agents.get", message: "Agent lookup timed out", recoverable: true }]
});

export const orchestrationUnavailableFlow = baseIssueFlow({
  orchestration: {
    availability: "unavailable",
    approvals: [],
    invocationBlocks: []
  },
  executionPolicy: baseExecutionPolicy,
  executionState: baseExecutionState,
  tokenCost: {
    scope: "subtree",
    availability: "unavailable",
    inputTokens: null,
    cachedInputTokens: null,
    outputTokens: null,
    costCents: null,
    billingCode: null,
    snapshotAt: null,
    scopeLabel: "issue subtree"
  },
  compatibility: {
    compatible: false,
    message: "Orchestration summary unavailable",
    missingFields: ["workProducts", "deployReceipts"]
  }
});

export const invocationBlockedFlow = baseIssueFlow({
  orchestration: {
    availability: "available",
    approvals: [],
    invocationBlocks: [
      {
        issueId: ISSUE_ID,
        agentId: "77777777-7777-7777-7777-777777777777",
        scopeType: "agent",
        scopeId: "77777777-7777-7777-7777-777777777777",
        scopeName: "Worker",
        reason: "Invocation blocked by policy",
        availability: "available"
      }
    ]
  }
});

export { CONTEXT_WINDOW_UTILIZATION_MESSAGE };
