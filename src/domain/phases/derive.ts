import type {
  PhaseFact,
  PhaseProfile,
  PhaseState,
  ProvenanceSource
} from "../../contracts/common.js";
import type {
  DeployReceiptRef,
  DocumentRef,
  ExecutionStageRef,
  PhaseDerivationInput,
  ResolvedPhaseState,
  RunRef,
  WorkProductRef
} from "../types.js";

export type PhaseDefinition = {
  key: string;
  label: string;
};

export const NATIVE_PHASES: PhaseDefinition[] = [
  { key: "intake", label: "Intake" },
  { key: "work", label: "Work" },
  { key: "review", label: "Review" },
  { key: "approval", label: "Approval" },
  { key: "complete", label: "Complete" }
];

export const SOFTWARE_DELIVERY_PHASES: PhaseDefinition[] = [
  { key: "plan", label: "Plan" },
  { key: "build", label: "Build" },
  { key: "pr_evidence", label: "PR evidence" },
  { key: "review", label: "Review" },
  { key: "merge", label: "Merge" },
  { key: "deploy", label: "Deploy" }
];

function source(kind: string, entityId: string, field: string): ProvenanceSource[] {
  return [{ kind, entityId, field }];
}

function unavailable(explanation: string): ResolvedPhaseState {
  return {
    state: "unavailable",
    source: [],
    explanation,
    startedAt: null,
    completedAt: null
  };
}

function notTracked(explanation: string, prov: ProvenanceSource[] = []): ResolvedPhaseState {
  return {
    state: "not_tracked",
    source: prov,
    explanation,
    startedAt: null,
    completedAt: null
  };
}

function compareRunsNewestFirst(a: RunRef, b: RunRef): number {
  const aTs = runSortTimestamp(a);
  const bTs = runSortTimestamp(b);
  if (aTs !== bTs) return bTs - aTs;
  return b.id.localeCompare(a.id);
}

function runSortTimestamp(run: RunRef): number {
  if (run.startedAt) {
    const started = Date.parse(run.startedAt);
    if (!Number.isNaN(started)) return started;
  }
  if (run.finishedAt) {
    const finished = Date.parse(run.finishedAt);
    if (!Number.isNaN(finished)) return finished;
  }
  return 0;
}

function effectiveLatestRun(input: PhaseDerivationInput): RunRef | null {
  if (input.runs.length === 0) return null;
  return [...input.runs].sort(compareRunsNewestFirst)[0] ?? null;
}

function hasActiveRun(input: PhaseDerivationInput): RunRef | null {
  const latest = effectiveLatestRun(input);
  if (!latest) return null;
  if (latest.status === "running" || latest.status === "in_progress") {
    return latest;
  }
  if (!latest.finishedAt && latest.startedAt) {
    return latest;
  }
  return null;
}

function hasFailedRun(input: PhaseDerivationInput): RunRef | null {
  const latest = effectiveLatestRun(input);
  return latest?.status === "failed" ? latest : null;
}

function mergedPullRequest(input: PhaseDerivationInput): WorkProductRef | undefined {
  return input.workProducts.find(
    (wp: WorkProductRef) => wp.type === "pull_request" && wp.status === "merged"
  );
}

function openPullRequest(input: PhaseDerivationInput): WorkProductRef | undefined {
  return input.workProducts.find(
    (wp: WorkProductRef) =>
      wp.type === "pull_request" &&
      (wp.status === "active" || wp.status === "ready_for_review" || wp.status === "open")
  );
}

function authoritativeDeploy(input: PhaseDerivationInput): DeployReceiptRef | undefined {
  return input.deployReceipts.find(
    (receipt: DeployReceiptRef) => receipt.status === "succeeded" || receipt.status === "deployed"
  );
}

function planDocument(input: PhaseDerivationInput): DocumentRef | undefined {
  return input.documents.find((doc: DocumentRef) => doc.key === "plan");
}

function reviewStage(input: PhaseDerivationInput): ExecutionStageRef | undefined {
  return input.executionPolicy?.stages.find((stage: ExecutionStageRef) => stage.type === "review");
}

function approvalStage(input: PhaseDerivationInput): ExecutionStageRef | undefined {
  return input.executionPolicy?.stages.find(
    (stage: ExecutionStageRef) => stage.type === "approval"
  );
}

function isStageCompleted(input: PhaseDerivationInput, stageId: string): boolean {
  return input.executionState?.completedStageIds.includes(stageId) ?? false;
}

function resolveReviewState(input: PhaseDerivationInput): ResolvedPhaseState {
  const stage = reviewStage(input);
  const state = input.executionState;

  if (!input.sdkCompatible || input.missingSdkFields?.includes("executionState")) {
    return unavailable("executionState is unavailable on the installed SDK.");
  }

  if (!stage || !state) {
    return notTracked("No native review stage configured.");
  }

  if (input.canonicalStatus === "blocked" || input.blockers.length > 0) {
    return {
      state: "blocked",
      source: source("issue", input.issueId, "status"),
      explanation: "Blocked while review stage exists.",
      startedAt: null,
      completedAt: null
    };
  }

  const failedRun = hasFailedRun(input);
  if (failedRun && state.currentStageType === "review") {
    return {
      state: "failed",
      source: source("run", failedRun.id, "status"),
      explanation: "Failed run during review stage.",
      startedAt: failedRun.startedAt,
      completedAt: failedRun.finishedAt
    };
  }

  if (state.currentStageType === "review") {
    return {
      state: "active",
      source: source("executionState", input.issueId, "currentStageType"),
      explanation: "Native review stage is active.",
      startedAt: null,
      completedAt: null
    };
  }

  if (state.lastDecisionOutcome === "changes_requested") {
    return {
      state: "active",
      source: source("executionState", input.issueId, "lastDecisionOutcome"),
      explanation: "Review returned changes requested.",
      startedAt: null,
      completedAt: null
    };
  }

  if (isStageCompleted(input, stage.id)) {
    return {
      state: "completed",
      source: source("executionState", input.issueId, "completedStageIds"),
      explanation: "Native review stage completed.",
      startedAt: null,
      completedAt: null
    };
  }

  return {
    state: "not_started",
    source: source("executionPolicy", input.issueId, "stages"),
    explanation: "Review stage not started.",
    startedAt: null,
    completedAt: null
  };
}

function resolveApprovalState(input: PhaseDerivationInput): ResolvedPhaseState {
  const stage = approvalStage(input);
  const state = input.executionState;

  if (!input.sdkCompatible || input.missingSdkFields?.includes("executionState")) {
    return unavailable("executionState is unavailable on the installed SDK.");
  }

  if (!stage || !state) {
    return notTracked("No native approval stage configured.");
  }

  if (input.canonicalStatus === "blocked") {
    return {
      state: "blocked",
      source: source("issue", input.issueId, "status"),
      explanation: "Issue blocked during approval.",
      startedAt: null,
      completedAt: null
    };
  }

  if (state.currentStageType === "approval") {
    return {
      state: "active",
      source: source("executionState", input.issueId, "currentStageType"),
      explanation: "Native approval stage is active.",
      startedAt: null,
      completedAt: null
    };
  }

  if (isStageCompleted(input, stage.id)) {
    return {
      state: "completed",
      source: source("executionState", input.issueId, "completedStageIds"),
      explanation: "Native approval stage completed.",
      startedAt: null,
      completedAt: null
    };
  }

  return {
    state: "not_started",
    source: source("executionPolicy", input.issueId, "stages"),
    explanation: "Approval stage not started.",
    startedAt: null,
    completedAt: null
  };
}

function resolveBuildState(input: PhaseDerivationInput): ResolvedPhaseState {
  const activeRun = hasActiveRun(input);
  const failedRun = hasFailedRun(input);

  if (input.canonicalStatus === "blocked") {
    return {
      state: "blocked",
      source: source("issue", input.issueId, "status"),
      explanation: "Issue is blocked.",
      startedAt: null,
      completedAt: null
    };
  }

  if (failedRun) {
    return {
      state: "failed",
      source: source("run", failedRun.id, "status"),
      explanation: "Latest run failed; distinguish from blocked issue status.",
      startedAt: failedRun.startedAt,
      completedAt: failedRun.finishedAt
    };
  }

  if (activeRun || input.canonicalStatus === "in_progress") {
    return {
      state: "active",
      source: activeRun
        ? source("run", activeRun.id, "status")
        : source("issue", input.issueId, "status"),
      explanation: "Build/execution is active.",
      startedAt: activeRun?.startedAt ?? null,
      completedAt: null
    };
  }

  if (input.canonicalStatus === "done") {
    return {
      state: "completed",
      source: source("issue", input.issueId, "status"),
      explanation: "Work completed per canonical status.",
      startedAt: null,
      completedAt: null
    };
  }

  return {
    state: "not_started",
    source: source("issue", input.issueId, "status"),
    explanation: "Build not started.",
    startedAt: null,
    completedAt: null
  };
}

function resolveNativePhase(key: string, input: PhaseDerivationInput): ResolvedPhaseState {
  switch (key) {
    case "intake":
      if (input.canonicalStatus === "todo") {
        return {
          state: "active",
          source: source("issue", input.issueId, "status"),
          explanation: "Intake active for todo issue.",
          startedAt: null,
          completedAt: null
        };
      }
      if (input.canonicalStatus === "cancelled") {
        return notTracked("Issue cancelled.");
      }
      return {
        state: "completed",
        source: source("issue", input.issueId, "status"),
        explanation: "Intake completed.",
        startedAt: null,
        completedAt: null
      };

    case "work":
      return resolveBuildState(input);

    case "review":
      return resolveReviewState(input);

    case "approval":
      return resolveApprovalState(input);

    case "complete":
      if (input.canonicalStatus === "done") {
        return {
          state: "completed",
          source: source("issue", input.issueId, "status"),
          explanation: "Issue marked done.",
          startedAt: null,
          completedAt: null
        };
      }
      if (input.canonicalStatus === "cancelled") {
        return notTracked("Issue cancelled.");
      }
      return {
        state: "not_started",
        source: source("issue", input.issueId, "status"),
        explanation: "Not complete.",
        startedAt: null,
        completedAt: null
      };

    default:
      return unavailable(`Unknown native phase ${key}.`);
  }
}

function resolveSoftwarePhase(key: string, input: PhaseDerivationInput): ResolvedPhaseState {
  switch (key) {
    case "plan": {
      const plan = planDocument(input);
      if (!input.sdkCompatible || input.missingSdkFields?.includes("documents")) {
        return unavailable("Documents unavailable on installed SDK.");
      }
      if (plan) {
        return {
          state: "completed",
          source: source("document", plan.id, "key"),
          explanation: "Plan artifact exists; does not prove implementation followed it.",
          startedAt: null,
          completedAt: null
        };
      }
      return notTracked("No plan document returned by SDK.");
    }

    case "build":
      return resolveBuildState(input);

    case "pr_evidence": {
      if (!input.sdkCompatible || input.missingSdkFields?.includes("workProducts")) {
        return unavailable("Work products unavailable on installed SDK.");
      }
      const pr = openPullRequest(input) ?? mergedPullRequest(input);
      if (pr) {
        return {
          state: mergedPullRequest(input) ? "completed" : "active",
          source: source("workProduct", pr.id, "type"),
          explanation: "PR work product returned by public SDK.",
          startedAt: null,
          completedAt: null
        };
      }
      return notTracked("No PR work product returned by SDK.");
    }

    case "review":
      return resolveReviewState(input);

    case "merge": {
      const merged = mergedPullRequest(input);
      if (!input.sdkCompatible || input.missingSdkFields?.includes("workProducts")) {
        return unavailable("Work products unavailable on installed SDK.");
      }
      if (merged) {
        return {
          state: "completed",
          source: source("workProduct", merged.id, "status"),
          explanation: "Authoritative merged PR fact.",
          startedAt: null,
          completedAt: null
        };
      }
      if (
        input.canonicalStatus === "done" ||
        input.executionState?.lastDecisionOutcome === "approved"
      ) {
        return notTracked(
          "Done or approval without authoritative merge fact.",
          source("issue", input.issueId, "status")
        );
      }
      return notTracked("Merge requires authoritative merged-PR fact.");
    }

    case "deploy": {
      const deploy = authoritativeDeploy(input);
      if (!input.sdkCompatible || input.missingSdkFields?.includes("deployReceipts")) {
        return unavailable("Deploy receipts unavailable on installed SDK.");
      }
      if (deploy) {
        return {
          state: "completed",
          source: source("deployReceipt", deploy.id, "status"),
          explanation: "Authoritative deployment/receipt fact.",
          startedAt: null,
          completedAt: null
        };
      }
      if (input.canonicalStatus === "done") {
        return notTracked(
          "Issue done without authoritative deploy fact.",
          source("issue", input.issueId, "status")
        );
      }
      return notTracked("Deploy requires authoritative deployment/receipt fact.");
    }

    default:
      return unavailable(`Unknown software-delivery phase ${key}.`);
  }
}

/** Apply conflict precedence: failed/blocked > active > completed > not_tracked. */
export const PHASE_STATE_PRECEDENCE: PhaseState[] = [
  "failed",
  "blocked",
  "active",
  "completed",
  "unavailable",
  "not_tracked",
  "not_started"
];

/** States that can represent the current phase among concurrent facts. */
export const CURRENT_PHASE_STATE_PRECEDENCE: PhaseState[] = ["failed", "blocked", "active"];

/** Apply conflict precedence: failed/blocked > active > completed > not_tracked. */
export function applyPhasePrecedence(candidates: PhaseState[]): PhaseState {
  for (const state of PHASE_STATE_PRECEDENCE) {
    if (candidates.includes(state)) {
      return state;
    }
  }
  return "not_started";
}

function toPhaseFact(def: PhaseDefinition, resolved: ResolvedPhaseState): PhaseFact {
  return {
    key: def.key,
    label: def.label,
    state: resolved.state,
    startedAt: resolved.startedAt,
    completedAt: resolved.completedAt,
    source: resolved.source,
    explanation: resolved.explanation
  };
}

export function derivePhases(profile: PhaseProfile, input: PhaseDerivationInput): PhaseFact[] {
  const defs = profile === "native" ? NATIVE_PHASES : SOFTWARE_DELIVERY_PHASES;
  const resolver = profile === "native" ? resolveNativePhase : resolveSoftwarePhase;
  return defs.map((def) => toPhaseFact(def, resolver(def.key, input)));
}

export function deriveCurrentPhaseKey(phases: PhaseFact[]): string | null {
  for (const state of CURRENT_PHASE_STATE_PRECEDENCE) {
    const match = phases.find((phase) => phase.state === state);
    if (match) {
      return match.key;
    }
  }
  return null;
}
