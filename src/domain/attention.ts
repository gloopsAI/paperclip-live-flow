import type { AttentionItem, AttentionReason } from "../contracts/common.js";
import type {
  BlockerRef,
  ExecutionStateRef,
  IncidentAttentionTarget,
  IncidentRef,
  InvocationBlockRef,
  IssueRef,
  RunRef
} from "./types.js";
import { dedupeById } from "./roots.js";

export type AttentionInput = {
  issues: IssueRef[];
  runs: RunRef[];
  blockers: BlockerRef[];
  invocationBlocks?: InvocationBlockRef[];
  incidents: IncidentRef[];
  /** Maps incident id → authoritative issue/root attention target. */
  incidentTargets?: Map<string, IncidentAttentionTarget>;
  executionStates: Array<{ issueId: string; state: ExecutionStateRef | null }>;
  rootIssueIdByIssueId: Map<string, string>;
};

function pushAttention(
  items: AttentionItem[],
  seen: Set<string>,
  item: Omit<AttentionItem, "source"> & { source?: AttentionItem["source"] }
): void {
  const key = `${item.issueId}:${item.reason}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  items.push({
    ...item,
    source: item.source ?? [{ kind: "issue", entityId: item.issueId, field: "status" }]
  });
}

export function deriveAttentionItems(input: AttentionInput): AttentionItem[] {
  const items: AttentionItem[] = [];
  const seen = new Set<string>();

  for (const issue of input.issues) {
    const rootIssueId = input.rootIssueIdByIssueId.get(issue.id) ?? issue.id;

    if (issue.status === "blocked") {
      pushAttention(items, seen, {
        issueId: issue.id,
        rootIssueId,
        identifier: issue.identifier,
        title: issue.title,
        reason: "blocked",
        explanation: "Issue status is blocked.",
        source: [{ kind: "issue", entityId: issue.id, field: "status" }]
      });
    }

    const exec = input.executionStates.find((entry) => entry.issueId === issue.id)?.state;
    if (exec?.currentStageType === "review") {
      pushAttention(items, seen, {
        issueId: issue.id,
        rootIssueId,
        identifier: issue.identifier,
        title: issue.title,
        reason: "pending_review",
        explanation: "Native review stage is active.",
        source: [{ kind: "executionState", entityId: issue.id, field: "currentStageType" }]
      });
    }
    if (exec?.currentStageType === "approval") {
      pushAttention(items, seen, {
        issueId: issue.id,
        rootIssueId,
        identifier: issue.identifier,
        title: issue.title,
        reason: "pending_approval",
        explanation: "Native approval stage is active.",
        source: [{ kind: "executionState", entityId: issue.id, field: "currentStageType" }]
      });
    }
    if (exec?.lastDecisionOutcome === "changes_requested") {
      pushAttention(items, seen, {
        issueId: issue.id,
        rootIssueId,
        identifier: issue.identifier,
        title: issue.title,
        reason: "changes_requested",
        explanation: "Review returned changes requested.",
        source: [{ kind: "executionState", entityId: issue.id, field: "lastDecisionOutcome" }]
      });
    }
  }

  for (const blocker of input.blockers) {
    const issue = input.issues.find((entry) => entry.id === blocker.issueId);
    if (!issue) continue;
    pushAttention(items, seen, {
      issueId: issue.id,
      rootIssueId: input.rootIssueIdByIssueId.get(issue.id) ?? issue.id,
      identifier: issue.identifier,
      title: issue.title,
      reason: "blocked",
      explanation: `Blocked by ${blocker.blockerIdentifier ?? blocker.blockerIssueId}.`,
      source: [{ kind: "relation", entityId: blocker.blockerIssueId, field: "blockedBy" }]
    });
  }

  for (const block of input.invocationBlocks ?? []) {
    const issue = input.issues.find((entry) => entry.id === block.issueId);
    if (!issue) continue;
    pushAttention(items, seen, {
      issueId: issue.id,
      rootIssueId: input.rootIssueIdByIssueId.get(issue.id) ?? issue.id,
      identifier: issue.identifier,
      title: issue.title,
      reason: "invocation_block",
      explanation: block.reason,
      source: [{ kind: "invocationBlock", entityId: block.issueId, field: "reason" }]
    });
  }

  const latestRunByIssue = new Map<string, RunRef>();
  for (const run of input.runs) {
    const existing = latestRunByIssue.get(run.issueId);
    if (!existing || (run.startedAt ?? "") > (existing.startedAt ?? "")) {
      latestRunByIssue.set(run.issueId, run);
    }
  }

  for (const [issueId, run] of latestRunByIssue) {
    if (run.status !== "failed") continue;
    const issue = input.issues.find((entry) => entry.id === issueId);
    if (!issue) continue;
    pushAttention(items, seen, {
      issueId,
      rootIssueId: input.rootIssueIdByIssueId.get(issueId) ?? issueId,
      identifier: issue.identifier,
      title: issue.title,
      reason: "failed_run",
      explanation: "Latest run failed.",
      source: [{ kind: "run", entityId: run.id, field: "status" }]
    });
  }

  for (const incident of dedupeById(input.incidents)) {
    if (incident.status !== "open") continue;
    const target = input.incidentTargets?.get(incident.id);
    if (!target) continue;
    pushAttention(items, seen, {
      issueId: target.issueId,
      rootIssueId: target.rootIssueId,
      identifier: target.identifier,
      title: target.title,
      reason: "budget_incident",
      explanation: `Open budget incident (${incident.scopeType}).`,
      source: [{ kind: "budgetIncident", entityId: incident.id, field: "status" }]
    });
  }

  return items;
}

export function isFailedRunDistinctFromBlockedIssue(
  runStatus: string,
  issueStatus: string
): boolean {
  return runStatus === "failed" && issueStatus !== "blocked";
}

export const ATTENTION_REASONS: AttentionReason[] = [
  "blocked",
  "invocation_block",
  "budget_incident",
  "failed_run",
  "pending_review",
  "pending_approval",
  "changes_requested"
];
