import type { CanonicalIssueStatus, PhaseState } from "../../contracts/common.js";
import type { StatusBadgeVariant } from "@paperclipai/plugin-sdk/ui";

const STATUS_LABELS: Record<CanonicalIssueStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  in_review: "In review",
  blocked: "Blocked",
  done: "Done",
  cancelled: "Cancelled"
};

const STATUS_ICONS: Record<CanonicalIssueStatus, string> = {
  todo: "○",
  in_progress: "▶",
  in_review: "◑",
  blocked: "⛔",
  done: "✓",
  cancelled: "✕"
};

export function canonicalStatusLabel(status: CanonicalIssueStatus): string {
  return STATUS_LABELS[status];
}

export function canonicalStatusAccessibleLabel(status: CanonicalIssueStatus): string {
  return `Status: ${STATUS_LABELS[status]} (${STATUS_ICONS[status]})`;
}

export function statusBadgeVariant(status: CanonicalIssueStatus): StatusBadgeVariant {
  switch (status) {
    case "blocked":
      return "error";
    case "in_review":
      return "info";
    case "done":
      return "ok";
    case "cancelled":
      return "warning";
    case "todo":
      return "pending";
    default:
      return "info";
  }
}

const PHASE_STATE_LABELS: Record<PhaseState, string> = {
  not_started: "Not started",
  active: "Active",
  completed: "Completed",
  blocked: "Blocked",
  failed: "Failed",
  not_tracked: "Not tracked",
  unavailable: "Unavailable"
};

export function phaseStateLabel(state: PhaseState): string {
  return PHASE_STATE_LABELS[state];
}

export function phaseStateAccessibleLabel(label: string, state: PhaseState): string {
  return `${label}: ${PHASE_STATE_LABELS[state]}`;
}

export function attentionReasonLabel(reason: string): string {
  switch (reason) {
    case "blocked":
      return "Blocked";
    case "invocation_block":
      return "Invocation block";
    case "budget_incident":
      return "Budget incident";
    case "failed_run":
      return "Failed run";
    case "pending_review":
      return "Pending review";
    case "pending_approval":
      return "Pending approval";
    case "changes_requested":
      return "Changes requested";
    default:
      return reason;
  }
}
