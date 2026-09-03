import { describe, expect, it } from "vitest";
import {
  deriveAttentionItems,
  isFailedRunDistinctFromBlockedIssue
} from "../../src/domain/attention.js";
import type { AttentionInput } from "../../src/domain/attention.js";

describe("deriveAttentionItems", () => {
  const rootMap = new Map([
    ["issue-1", "root-1"],
    ["issue-2", "root-2"]
  ]);

  it("distinguishes blocker relations (blocked) from orchestration invocation blocks", () => {
    const input: AttentionInput = {
      issues: [
        {
          id: "issue-1",
          parentId: null,
          projectId: "p1",
          assigneeAgentId: "agent-1",
          identifier: "GL-1",
          title: "Blocked issue",
          status: "in_progress"
        }
      ],
      runs: [],
      blockers: [{ issueId: "issue-1", blockerIssueId: "blocker-1", blockerIdentifier: "GL-B" }],
      invocationBlocks: [
        {
          issueId: "issue-1",
          agentId: "agent-1",
          scopeType: "agent",
          scopeId: "agent-1",
          reason: "Invocation blocked by policy"
        }
      ],
      incidents: [],
      executionStates: [{ issueId: "issue-1", state: null }],
      rootIssueIdByIssueId: new Map([["issue-1", "root-1"]])
    };

    const items = deriveAttentionItems(input);
    const relationItem = items.find(
      (item) => item.reason === "blocked" && item.explanation.includes("GL-B")
    );
    const invocationItem = items.find(
      (item) =>
        item.reason === "invocation_block" && item.explanation.includes("Invocation blocked")
    );
    expect(relationItem).toBeDefined();
    expect(invocationItem).toBeDefined();
    expect(relationItem?.reason).not.toBe("invocation_block");
  });

  it("includes orchestration invocation blocks as invocation_block attention", () => {
    const input: AttentionInput = {
      issues: [
        {
          id: "issue-1",
          parentId: null,
          projectId: "p1",
          assigneeAgentId: "agent-1",
          identifier: "GL-1",
          title: "Blocked issue",
          status: "in_progress"
        }
      ],
      runs: [],
      blockers: [],
      invocationBlocks: [
        {
          issueId: "issue-1",
          agentId: "agent-1",
          scopeType: "agent",
          scopeId: "agent-1",
          reason: "Invocation blocked by policy"
        }
      ],
      incidents: [],
      executionStates: [{ issueId: "issue-1", state: null }],
      rootIssueIdByIssueId: new Map([["issue-1", "issue-1"]])
    };

    const items = deriveAttentionItems(input);
    expect(items.some((item) => item.reason === "invocation_block")).toBe(true);
    expect(items.some((item) => item.explanation.includes("Invocation blocked"))).toBe(true);
  });

  it("uses explicit incident targets instead of raw scope ids", () => {
    const input: AttentionInput = {
      issues: [
        {
          id: "root-1",
          parentId: null,
          projectId: "project-x",
          assigneeAgentId: null,
          identifier: "GL-R",
          title: "Root issue",
          status: "in_progress"
        }
      ],
      runs: [],
      blockers: [],
      incidents: [{ id: "inc-1", scopeType: "project", scopeId: "project-x", status: "open" }],
      incidentTargets: new Map([
        [
          "inc-1",
          {
            issueId: "root-1",
            rootIssueId: "root-1",
            identifier: "GL-R",
            title: "Root issue"
          }
        ]
      ]),
      executionStates: [{ issueId: "root-1", state: null }],
      rootIssueIdByIssueId: new Map([["root-1", "root-1"]])
    };

    const items = deriveAttentionItems(input);
    const incidentItem = items.find((item) => item.reason === "budget_incident");
    expect(incidentItem?.issueId).toBe("root-1");
    expect(incidentItem?.rootIssueId).toBe("root-1");
    expect(incidentItem?.issueId).not.toBe("project-x");
  });

  it("includes blocked, review, approval, changes requested, failed run, and incidents", () => {
    const input: AttentionInput = {
      issues: [
        {
          id: "issue-1",
          parentId: null,
          projectId: "p1",
          assigneeAgentId: "agent-1",
          identifier: "GL-1",
          title: "Blocked issue",
          status: "blocked"
        },
        {
          id: "issue-2",
          parentId: null,
          projectId: "p2",
          assigneeAgentId: "agent-2",
          identifier: "GL-2",
          title: "Review issue",
          status: "in_review"
        }
      ],
      runs: [
        {
          id: "run-fail",
          issueId: "issue-2",
          agentId: "agent-2",
          status: "failed",
          startedAt: "2026-09-03T12:00:00.000Z",
          finishedAt: "2026-09-03T12:01:00.000Z"
        }
      ],
      blockers: [{ issueId: "issue-1", blockerIssueId: "blocker-1", blockerIdentifier: "GL-B" }],
      incidents: [{ id: "inc-1", scopeType: "company", scopeId: "co-1", status: "open" }],
      incidentTargets: new Map([
        ["inc-1", { issueId: "co-1", rootIssueId: "co-1", identifier: null, title: "inc-1" }]
      ]),
      executionStates: [
        {
          issueId: "issue-2",
          state: {
            status: "in_progress",
            currentStageId: "stage-review",
            currentStageType: "review",
            currentParticipantAgentId: "reviewer-1",
            currentParticipantUserId: null,
            completedStageIds: ["stage-plan"],
            lastDecisionOutcome: "changes_requested",
            changesRequestedCount: 1
          }
        }
      ],
      rootIssueIdByIssueId: rootMap
    };

    const items = deriveAttentionItems(input);
    const reasons = items.map((item) => item.reason);
    expect(reasons).toContain("blocked");
    expect(reasons).toContain("failed_run");
    expect(reasons).toContain("pending_review");
    expect(reasons).toContain("changes_requested");
    expect(reasons).toContain("budget_incident");
  });
});

describe("isFailedRunDistinctFromBlockedIssue", () => {
  it("distinguishes failed run from blocked issue", () => {
    expect(isFailedRunDistinctFromBlockedIssue("failed", "in_progress")).toBe(true);
    expect(isFailedRunDistinctFromBlockedIssue("failed", "blocked")).toBe(false);
  });
});
