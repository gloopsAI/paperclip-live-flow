import { beforeEach, describe, expect, it } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import type { Issue } from "@paperclipai/shared";
import manifest from "../../src/manifest.js";
import plugin from "../../src/worker.js";
import { sharedHandlerCache } from "../../src/worker/cache.js";
import { invokeRpcGetData } from "./invoke-data.js";

const COMPANY_A = "11111111-1111-1111-1111-111111111111";
const ISSUE_ROOT = "44444444-4444-4444-4444-444444444444";
const AGENT_REVIEWER = "88888888-8888-8888-8888-888888888888";

function baseIssue(overrides: Partial<Issue> & Pick<Issue, "id" | "companyId" | "title">): Issue {
  const now = new Date();
  return {
    projectId: null,
    projectWorkspaceId: null,
    goalId: null,
    parentId: null,
    description: null,
    status: "in_review",
    workMode: "autonomous",
    priority: "medium",
    reviewPolicy: null,
    assigneeAgentId: null,
    assigneeUserId: null,
    checkoutRunId: null,
    executionRunId: null,
    executionAgentNameKey: null,
    executionLockedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    responsibleUserId: null,
    issueNumber: 1,
    identifier: "LF-ROOT",
    requestDepth: 0,
    billingCode: null,
    assigneeAdapterOverrides: null,
    executionWorkspaceId: null,
    executionWorkspacePreference: null,
    executionWorkspaceSettings: null,
    startedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    executionPolicy: {
      mode: "native",
      commentRequired: false,
      stages: [
        { id: "stage-build", type: "work", approvalsNeeded: 1, participants: [] },
        { id: "stage-review", type: "review", approvalsNeeded: 1, participants: [] }
      ]
    },
    executionState: {
      status: "in_progress",
      currentStageId: "stage-review",
      currentStageIndex: 1,
      currentStageType: "review",
      currentParticipant: { agentId: AGENT_REVIEWER, userId: null },
      returnAssignee: null,
      reviewRequest: null,
      completedStageIds: ["stage-build"],
      lastDecisionId: null,
      lastDecisionOutcome: null,
      changesRequestedCount: 0
    },
    ...overrides
  } as Issue;
}

describe("issue-flow execution facts", () => {
  beforeEach(() => {
    sharedHandlerCache.clear();
  });

  it("returns execution policy/state from validated issue and orchestration approvals/blocks when available", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities] });
    harness.seed({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Review issue",
          identifier: "LF-ROOT"
        })
      ],
      agents: [
        {
          id: AGENT_REVIEWER,
          companyId: COMPANY_A,
          name: "Reviewer Agent",
          status: "active",
          role: "worker",
          adapterType: "cursor",
          createdAt: new Date(),
          updatedAt: new Date()
        } as never
      ]
    });

    const original = harness.ctx.issues.summaries.getOrchestration;
    harness.ctx.issues.summaries.getOrchestration = (async (input) => {
      const summary = await original(input);
      return {
        ...summary,
        approvals: [
          {
            issueId: ISSUE_ROOT,
            id: "approval-1",
            type: "review",
            status: "pending",
            requestedByAgentId: null,
            requestedByUserId: "user-reviewer",
            decidedByUserId: null,
            decidedAt: null,
            createdAt: "2026-09-03T12:00:00.000Z"
          }
        ],
        invocationBlocks: [
          {
            issueId: ISSUE_ROOT,
            agentId: AGENT_REVIEWER,
            scopeType: "agent",
            scopeId: AGENT_REVIEWER,
            scopeName: "Reviewer Agent",
            reason: "Blocked by budget policy"
          }
        ]
      };
    }) as typeof harness.ctx.issues.summaries.getOrchestration;

    await plugin.definition.setup(harness.ctx);
    const flow = await invokeRpcGetData<{
      executionPolicy: { availability: string; stages: Array<{ id: string }> };
      executionState: {
        currentStageType: string | null;
        currentParticipantLabel: string | null;
        completedStageIds: string[];
      };
      orchestration: {
        availability: string;
        approvals: Array<{ id: string; status: string }>;
        invocationBlocks: Array<{ reason: string; scopeType: string }>;
      };
    }>(harness, "issue-flow", COMPANY_A, { issueId: ISSUE_ROOT });

    expect(flow.executionPolicy.availability).toBe("available");
    expect(flow.executionPolicy.stages.map((stage) => stage.id)).toEqual([
      "stage-build",
      "stage-review"
    ]);
    expect(flow.executionState.currentStageType).toBe("review");
    expect(flow.executionState.currentParticipantLabel).toBe("Reviewer Agent");
    expect(flow.executionState.completedStageIds).toContain("stage-build");
    expect(flow.orchestration.availability).toBe("available");
    expect(flow.orchestration.approvals[0]?.status).toBe("pending");
    expect(flow.orchestration.invocationBlocks[0]?.reason).toBe("Blocked by budget policy");
  });

  it("marks orchestration approvals and invocation blocks unavailable without fabricating rows when orchestration fails", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities] });
    harness.seed({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Review issue",
          identifier: "LF-ROOT"
        })
      ]
    });

    harness.ctx.issues.summaries.getOrchestration = (async () => {
      throw new Error("orchestration unavailable");
    }) as typeof harness.ctx.issues.summaries.getOrchestration;

    await plugin.definition.setup(harness.ctx);
    const flow = await invokeRpcGetData<{
      executionPolicy: { availability: string };
      executionState: { availability: string; currentStageType: string | null };
      orchestration: {
        availability: string;
        approvals: unknown[];
        invocationBlocks: unknown[];
      };
    }>(harness, "issue-flow", COMPANY_A, { issueId: ISSUE_ROOT });

    expect(flow.executionPolicy.availability).toBe("available");
    expect(flow.executionState.availability).toBe("available");
    expect(flow.executionState.currentStageType).toBe("review");
    expect(flow.orchestration.availability).toBe("unavailable");
    expect(flow.orchestration.approvals).toEqual([]);
    expect(flow.orchestration.invocationBlocks).toEqual([]);
  });

  it("preserves changes-requested count and last decision outcome on execution state facts", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities] });
    harness.seed({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Review issue",
          executionState: {
            status: "in_progress",
            currentStageId: "stage-review",
            currentStageIndex: 1,
            currentStageType: "review",
            currentParticipant: { agentId: AGENT_REVIEWER, userId: null },
            returnAssignee: null,
            reviewRequest: null,
            completedStageIds: ["stage-build"],
            lastDecisionId: "decision-1",
            lastDecisionOutcome: "changes_requested",
            changesRequestedCount: 3
          }
        } as unknown as Issue)
      ]
    });

    await plugin.definition.setup(harness.ctx);
    const flow = await invokeRpcGetData<{
      executionState: {
        lastDecisionOutcome: string | null;
        changesRequestedCount: number | null;
      };
    }>(harness, "issue-flow", COMPANY_A, { issueId: ISSUE_ROOT });

    expect(flow.executionState.lastDecisionOutcome).toBe("changes_requested");
    expect(flow.executionState.changesRequestedCount).toBe(3);
  });
});
