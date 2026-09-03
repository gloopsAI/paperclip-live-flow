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
    expect(reasons).toContain("invocation_block");
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
