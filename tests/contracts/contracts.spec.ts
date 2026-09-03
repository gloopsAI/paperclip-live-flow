import { describe, expect, it } from "vitest";
import type {
  CompanyFlowResponse,
  DashboardSummaryResponse,
  IssueFlowResponse,
  PhaseFact,
  PluginAboutResponse,
  TokenCostFacts
} from "../../src/contracts/index.js";

describe("contracts shape", () => {
  it("accepts plugin-about response with compatibility", () => {
    const response: PluginAboutResponse = {
      id: "gloops.live-flow",
      version: "0.1.0",
      description: "Read-only workflow visibility for Paperclip",
      phase: "contracts",
      upstreamPin: {
        paperclipCommit: "da0947d3582ac7779d6bf11851c9938eca6c5c8c",
        pluginSdkVersion: "1.0.0",
        sharedVersion: "0.3.1"
      },
      compatibility: {
        compatible: true,
        message: null,
        missingFields: []
      }
    };
    expect(response.compatibility.compatible).toBe(true);
  });

  it("requires provenance on phase facts", () => {
    const phase: PhaseFact = {
      key: "review",
      label: "Review",
      state: "active",
      startedAt: null,
      completedAt: null,
      source: [{ kind: "executionState", entityId: "issue-1", field: "currentStageType" }],
      explanation: "Native review stage is active."
    };
    expect(phase.source).toHaveLength(1);
  });

  it("labels loaded active roots token scope", () => {
    const tokenCost: TokenCostFacts = {
      scope: "loaded_active_roots",
      availability: "available",
      inputTokens: 100,
      cachedInputTokens: 20,
      outputTokens: 40,
      costCents: 12,
      billingCode: "mission:alpha",
      snapshotAt: "2026-09-03T12:00:00.000Z",
      scopeLabel: "loaded active roots"
    };
    expect(tokenCost.scopeLabel).toBe("loaded active roots");
  });

  it("models company-flow snapshot with per-row errors and freshness", () => {
    const response: CompanyFlowResponse = {
      companyId: "co-1",
      phaseProfile: "software_delivery",
      roots: [],
      attention: [],
      companyIncidents: [],
      scopeUnavailableIncidents: [],
      counts: { active: 0, blocked: 0, inReview: 0, failedRuns: 0 },
      tokenCost: {
        scope: "loaded_active_roots",
        availability: "not_available",
        inputTokens: null,
        cachedInputTokens: null,
        outputTokens: null,
        costCents: null,
        billingCode: null,
        snapshotAt: null,
        scopeLabel: "loaded active roots"
      },
      freshness: {
        fetchedAt: "2026-09-03T12:00:00.000Z",
        stale: false,
        partial: true,
        staleReason: null
      },
      sourceErrors: [{ source: "orchestration", message: "partial", recoverable: true }]
    };
    expect(response.freshness.partial).toBe(true);
  });

  it("models issue-flow with canonical status unchanged", () => {
    const response: IssueFlowResponse = {
      companyId: "co-1",
      issueId: "issue-1",
      identifier: "GL-1",
      title: "Slice",
      projectId: null,
      projectName: null,
      assigneeAgentId: "agent-1",
      assigneeLabel: "Worker",
      canonicalStatus: "done",
      createdAt: null,
      updatedAt: null,
      phaseProfile: "software_delivery",
      phases: [],
      blockers: [],
      runs: [],
      incidents: [],
      documents: [],
      workProducts: [],
      tokenCost: {
        scope: "subtree",
        availability: "available",
        inputTokens: 1,
        cachedInputTokens: 0,
        outputTokens: 2,
        costCents: 3,
        billingCode: null,
        snapshotAt: "2026-09-03T12:00:00.000Z",
        scopeLabel: "issue subtree"
      },
      attention: [],
      compatibility: { compatible: true, message: null, missingFields: [] },
      freshness: {
        fetchedAt: "2026-09-03T12:00:00.000Z",
        stale: false,
        partial: false,
        staleReason: null
      },
      sourceErrors: []
    };
    expect(response.canonicalStatus).toBe("done");
  });

  it("models dashboard summary top attention", () => {
    const response: DashboardSummaryResponse = {
      companyId: "co-1",
      counts: { active: 2, blocked: 1, inReview: 1, failedRuns: 1 },
      topAttention: [],
      tokenCost: {
        scope: "loaded_active_roots",
        availability: "not_available",
        inputTokens: null,
        cachedInputTokens: null,
        outputTokens: null,
        costCents: null,
        billingCode: null,
        snapshotAt: null,
        scopeLabel: "loaded active roots"
      },
      freshness: {
        fetchedAt: "2026-09-03T12:00:00.000Z",
        stale: false,
        partial: false,
        staleReason: null
      },
      sourceErrors: []
    };
    expect(response.counts.active).toBe(2);
  });
});
