import { describe, expect, it } from "vitest";
import type { PhaseFact } from "../../src/contracts/common.js";
import {
  applyPhasePrecedence,
  deriveCurrentPhaseKey,
  derivePhases
} from "../../src/domain/phases/derive.js";
import type { PhaseDerivationInput } from "../../src/domain/types.js";

function phaseFact(key: string, state: PhaseFact["state"]): PhaseFact {
  return {
    key,
    label: key,
    state,
    startedAt: null,
    completedAt: null,
    source: [{ kind: "test", entityId: key, field: "state" }],
    explanation: `${key} is ${state}.`
  };
}

function baseInput(overrides: Partial<PhaseDerivationInput> = {}): PhaseDerivationInput {
  return {
    issueId: "issue-1",
    canonicalStatus: "in_progress",
    executionPolicy: {
      stages: [
        { id: "stage-review", type: "review" },
        { id: "stage-approval", type: "approval" }
      ]
    },
    executionState: {
      status: "in_progress",
      currentStageId: null,
      currentStageType: null,
      currentParticipantAgentId: null,
      currentParticipantUserId: null,
      completedStageIds: [],
      lastDecisionOutcome: null
    },
    runs: [],
    blockers: [],
    documents: [],
    workProducts: [],
    deployReceipts: [],
    sdkCompatible: true,
    ...overrides
  };
}

describe("derivePhases — software delivery profile", () => {
  it("active build with active run", () => {
    const phases = derivePhases(
      "software_delivery",
      baseInput({
        runs: [
          {
            id: "run-1",
            issueId: "issue-1",
            agentId: "agent-1",
            status: "running",
            startedAt: "2026-09-03T12:00:00.000Z",
            finishedAt: null
          }
        ]
      })
    );
    const build = phases.find((p) => p.key === "build");
    expect(build?.state).toBe("active");
    expect(build?.source[0]?.kind).toBe("run");
  });

  it("pending review from execution state", () => {
    const phases = derivePhases(
      "software_delivery",
      baseInput({
        executionState: {
          status: "in_progress",
          currentStageId: "stage-review",
          currentStageType: "review",
          currentParticipantAgentId: "reviewer-1",
          currentParticipantUserId: null,
          completedStageIds: [],
          lastDecisionOutcome: null
        }
      })
    );
    expect(phases.find((p) => p.key === "review")?.state).toBe("active");
  });

  it("changes requested stays on review without new phase", () => {
    const phases = derivePhases(
      "software_delivery",
      baseInput({
        executionState: {
          status: "in_progress",
          currentStageId: "stage-review",
          currentStageType: "review",
          currentParticipantAgentId: "reviewer-1",
          currentParticipantUserId: null,
          completedStageIds: [],
          lastDecisionOutcome: "changes_requested",
          changesRequestedCount: 2
        }
      })
    );
    expect(phases.find((p) => p.key === "review")?.state).toBe("active");
    expect(phases.filter((p) => p.key === "review")).toHaveLength(1);
  });

  it("blocked issue marks build blocked", () => {
    const phases = derivePhases("software_delivery", baseInput({ canonicalStatus: "blocked" }));
    expect(phases.find((p) => p.key === "build")?.state).toBe("blocked");
  });

  it("failed run is distinguishable from blocked issue", () => {
    const phases = derivePhases(
      "software_delivery",
      baseInput({
        canonicalStatus: "in_progress",
        runs: [
          {
            id: "run-fail",
            issueId: "issue-1",
            agentId: "agent-1",
            status: "failed",
            startedAt: "2026-09-03T12:00:00.000Z",
            finishedAt: "2026-09-03T12:01:00.000Z"
          }
        ]
      })
    );
    const build = phases.find((p) => p.key === "build");
    expect(build?.state).toBe("failed");
    expect(build?.source[0]?.entityId).toBe("run-fail");
  });

  it.each([
    {
      label: "older failed + newer succeeded",
      runs: [
        {
          id: "run-old-fail",
          issueId: "issue-1",
          agentId: "agent-1",
          status: "failed",
          startedAt: "2026-09-03T11:00:00.000Z",
          finishedAt: "2026-09-03T11:01:00.000Z"
        },
        {
          id: "run-new-ok",
          issueId: "issue-1",
          agentId: "agent-1",
          status: "succeeded",
          startedAt: "2026-09-03T12:00:00.000Z",
          finishedAt: "2026-09-03T12:05:00.000Z"
        }
      ],
      reviewStage: false,
      expectBuildFailed: false,
      expectReviewFailed: false,
      expectedLatestRunId: "run-new-ok"
    },
    {
      label: "older failed + newer in-progress",
      runs: [
        {
          id: "run-old-fail",
          issueId: "issue-1",
          agentId: "agent-1",
          status: "failed",
          startedAt: "2026-09-03T11:00:00.000Z",
          finishedAt: "2026-09-03T11:01:00.000Z"
        },
        {
          id: "run-new-active",
          issueId: "issue-1",
          agentId: "agent-1",
          status: "running",
          startedAt: "2026-09-03T12:00:00.000Z",
          finishedAt: null
        }
      ],
      reviewStage: false,
      expectBuildFailed: false,
      expectReviewFailed: false,
      expectedLatestRunId: "run-new-active"
    },
    {
      label: "newer failed run",
      runs: [
        {
          id: "run-old-ok",
          issueId: "issue-1",
          agentId: "agent-1",
          status: "succeeded",
          startedAt: "2026-09-03T11:00:00.000Z",
          finishedAt: "2026-09-03T11:05:00.000Z"
        },
        {
          id: "run-new-fail",
          issueId: "issue-1",
          agentId: "agent-1",
          status: "failed",
          startedAt: "2026-09-03T12:00:00.000Z",
          finishedAt: "2026-09-03T12:01:00.000Z"
        }
      ],
      reviewStage: false,
      expectBuildFailed: true,
      expectReviewFailed: false,
      expectedLatestRunId: "run-new-fail"
    },
    {
      label: "review stage ignores older failed when latest succeeded",
      runs: [
        {
          id: "run-old-fail",
          issueId: "issue-1",
          agentId: "agent-1",
          status: "failed",
          startedAt: "2026-09-03T11:00:00.000Z",
          finishedAt: "2026-09-03T11:01:00.000Z"
        },
        {
          id: "run-new-ok",
          issueId: "issue-1",
          agentId: "agent-1",
          status: "succeeded",
          startedAt: "2026-09-03T12:00:00.000Z",
          finishedAt: "2026-09-03T12:05:00.000Z"
        }
      ],
      reviewStage: true,
      expectBuildFailed: false,
      expectReviewFailed: false,
      expectedLatestRunId: "run-new-ok"
    }
  ])(
    "latest run selection: $label",
    ({ label, runs, reviewStage, expectBuildFailed, expectReviewFailed, expectedLatestRunId }) => {
      const phases = derivePhases(
        "software_delivery",
        baseInput({
          canonicalStatus: "in_progress",
          runs,
          executionState: reviewStage
            ? {
                status: "in_progress",
                currentStageId: "stage-review",
                currentStageType: "review",
                currentParticipantAgentId: "reviewer-1",
                currentParticipantUserId: null,
                completedStageIds: [],
                lastDecisionOutcome: null
              }
            : undefined
        })
      );

      const build = phases.find((p) => p.key === "build");
      const review = phases.find((p) => p.key === "review");

      if (expectBuildFailed) {
        expect(build?.state).toBe("failed");
        expect(build?.source[0]?.entityId).toBe(expectedLatestRunId);
        expect(build?.source[0]?.field).toBe("status");
      } else if (label === "older failed + newer in-progress") {
        expect(build?.state).toBe("active");
        expect(build?.source[0]?.entityId).toBe(expectedLatestRunId);
      } else {
        expect(build?.state).not.toBe("failed");
      }

      if (reviewStage) {
        if (expectReviewFailed) {
          expect(review?.state).toBe("failed");
          expect(review?.source[0]?.entityId).toBe(expectedLatestRunId);
        } else {
          expect(review?.state).not.toBe("failed");
        }
      }
    }
  );

  it("done without merge/deploy marks merge and deploy not_tracked", () => {
    const phases = derivePhases(
      "software_delivery",
      baseInput({
        canonicalStatus: "done",
        executionState: {
          status: "completed",
          currentStageId: null,
          currentStageType: null,
          currentParticipantAgentId: null,
          currentParticipantUserId: null,
          completedStageIds: ["stage-approval"],
          lastDecisionOutcome: "approved"
        }
      })
    );
    expect(phases.find((p) => p.key === "merge")?.state).toBe("not_tracked");
    expect(phases.find((p) => p.key === "deploy")?.state).toBe("not_tracked");
  });

  it("authoritative merged PR completes merge phase", () => {
    const phases = derivePhases(
      "software_delivery",
      baseInput({
        workProducts: [
          {
            id: "wp-pr",
            issueId: "issue-1",
            type: "pull_request",
            status: "merged"
          }
        ]
      })
    );
    expect(phases.find((p) => p.key === "merge")?.state).toBe("completed");
  });

  it("plan document only proves artifact exists", () => {
    const phases = derivePhases(
      "software_delivery",
      baseInput({
        documents: [{ id: "doc-plan", issueId: "issue-1", key: "plan", title: "Plan" }]
      })
    );
    const plan = phases.find((p) => p.key === "plan");
    expect(plan?.state).toBe("completed");
    expect(plan?.explanation).toContain("does not prove");
  });

  it("missing SDK field yields unavailable", () => {
    const phases = derivePhases(
      "software_delivery",
      baseInput({
        sdkCompatible: false,
        missingSdkFields: ["workProducts"]
      })
    );
    expect(phases.find((p) => p.key === "pr_evidence")?.state).toBe("unavailable");
    expect(phases.find((p) => p.key === "merge")?.state).toBe("unavailable");
  });
});

describe("derivePhases — native profile", () => {
  it("includes Intake, Work, Review, Approval, Complete", () => {
    const phases = derivePhases("native", baseInput());
    expect(phases.map((p) => p.key)).toEqual(["intake", "work", "review", "approval", "complete"]);
  });

  it("preserves canonical status in complete phase when done", () => {
    const phases = derivePhases("native", baseInput({ canonicalStatus: "done" }));
    expect(phases.find((p) => p.key === "complete")?.state).toBe("completed");
  });
});

describe("applyPhasePrecedence", () => {
  const cases: Array<{ candidates: string[]; expected: string }> = [
    { candidates: ["active", "failed"], expected: "failed" },
    { candidates: ["completed", "blocked"], expected: "blocked" },
    { candidates: ["not_tracked", "completed"], expected: "completed" },
    { candidates: ["not_started", "not_tracked"], expected: "not_tracked" }
  ];

  it.each(cases)("precedence $expected over others", ({ candidates, expected }) => {
    expect(
      applyPhasePrecedence(
        candidates as Array<
          | "not_started"
          | "active"
          | "completed"
          | "blocked"
          | "failed"
          | "not_tracked"
          | "unavailable"
        >
      )
    ).toBe(expected);
  });
});

describe("deriveCurrentPhaseKey", () => {
  const conflictCases: Array<{
    name: string;
    phases: PhaseFact[];
    expected: string | null;
  }> = [
    {
      name: "failed beats active on different keys",
      phases: [phaseFact("build", "failed"), phaseFact("review", "active")],
      expected: "build"
    },
    {
      name: "blocked beats active on different keys",
      phases: [phaseFact("build", "active"), phaseFact("review", "blocked")],
      expected: "review"
    },
    {
      name: "failed beats blocked beats active",
      phases: [
        phaseFact("plan", "active"),
        phaseFact("build", "blocked"),
        phaseFact("review", "failed")
      ],
      expected: "review"
    },
    {
      name: "returns null when no current fact states",
      phases: [phaseFact("merge", "not_tracked"), phaseFact("deploy", "completed")],
      expected: null
    }
  ];

  it.each(conflictCases)("$name", ({ phases, expected }) => {
    expect(deriveCurrentPhaseKey(phases)).toBe(expected);
  });

  it("derives blocked review before active build when blockers mark review blocked", () => {
    const phases = derivePhases(
      "software_delivery",
      baseInput({
        canonicalStatus: "in_progress",
        blockers: [{ issueId: "issue-1", blockerIssueId: "blocker-1", blockerIdentifier: "GL-B" }],
        runs: [
          {
            id: "run-active",
            issueId: "issue-1",
            agentId: "agent-1",
            status: "running",
            startedAt: "2026-09-03T12:00:00.000Z",
            finishedAt: null
          }
        ],
        executionState: {
          status: "in_progress",
          currentStageId: "stage-review",
          currentStageType: "review",
          currentParticipantAgentId: "reviewer-1",
          currentParticipantUserId: null,
          completedStageIds: [],
          lastDecisionOutcome: null
        }
      })
    );
    expect(phases.find((p) => p.key === "build")?.state).toBe("active");
    expect(phases.find((p) => p.key === "review")?.state).toBe("blocked");
    expect(deriveCurrentPhaseKey(phases)).toBe("review");
  });
});
