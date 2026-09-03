import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import type { Agent, Company, Issue, Project } from "@paperclipai/shared";
import manifest from "../../src/manifest.js";
import plugin from "../../src/worker.js";
import { sharedHandlerCache } from "../../src/worker/cache.js";
import { ISSUE_NOT_FOUND_MESSAGE } from "../../src/worker/constants.js";
import { invokeRpcGetData } from "./invoke-data.js";

const COMPANY_A = "11111111-1111-1111-1111-111111111111";
const COMPANY_B = "22222222-2222-2222-2222-222222222222";
const PROJECT_A = "33333333-3333-3333-3333-333333333333";
const ISSUE_ROOT = "44444444-4444-4444-4444-444444444444";
const ISSUE_CHILD = "55555555-5555-5555-5555-555555555555";
const ISSUE_FOREIGN = "66666666-6666-6666-6666-666666666666";
const AGENT_A = "77777777-7777-7777-7777-777777777777";
const AGENT_PARTICIPANT = "88888888-8888-8888-8888-888888888888";
const PROJECT_UNKNOWN = "99999999-9999-9999-9999-999999999999";

function baseIssue(overrides: Partial<Issue> & Pick<Issue, "id" | "companyId" | "title">): Issue {
  const now = new Date();
  return {
    projectId: null,
    projectWorkspaceId: null,
    goalId: null,
    parentId: null,
    description: null,
    status: "in_progress",
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
    identifier: "LF-1",
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
    ...overrides
  } as Issue;
}

function seedHarness(options?: { issues?: Issue[]; projects?: Project[]; agents?: Agent[] }) {
  const companyA: Company = {
    id: COMPANY_A,
    name: "Company A",
    slug: "company-a",
    status: "active",
    deploymentMode: "cloud",
    deploymentExposure: "private",
    bindMode: "loopback",
    authBaseUrlMode: "auto",
    budgetMonthlyCents: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as Company;

  const project: Project = {
    id: PROJECT_A,
    companyId: COMPANY_A,
    name: "Project A",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as Project;

  const agent: Agent = {
    id: AGENT_A,
    companyId: COMPANY_A,
    name: "Worker",
    status: "active",
    role: "worker",
    adapterType: "cursor",
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as Agent;

  const participantAgent: Agent = {
    id: AGENT_PARTICIPANT,
    companyId: COMPANY_A,
    name: "Participant",
    status: "active",
    role: "worker",
    adapterType: "cursor",
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as Agent;

  const rootIssue = baseIssue({
    id: ISSUE_ROOT,
    companyId: COMPANY_A,
    title: "Root issue",
    projectId: PROJECT_A,
    assigneeAgentId: AGENT_A,
    status: "done",
    identifier: "LF-ROOT"
  });

  const childIssue = baseIssue({
    id: ISSUE_CHILD,
    companyId: COMPANY_A,
    parentId: ISSUE_ROOT,
    title: "Child issue",
    projectId: PROJECT_A,
    status: "in_progress",
    identifier: "LF-CHILD"
  });

  const foreignIssue = baseIssue({
    id: ISSUE_FOREIGN,
    companyId: COMPANY_B,
    title: "Foreign issue",
    identifier: "LF-FOREIGN"
  });

  const harness = createTestHarness({
    manifest,
    capabilities: [...manifest.capabilities]
  });

  harness.seed({
    companies: [companyA],
    projects: options?.projects ?? [project],
    agents: options?.agents ?? [agent, participantAgent],
    issues: options?.issues ?? [rootIssue, childIssue, foreignIssue]
  });

  return harness;
}

function withAuthoritativeSubtreeRoot(
  harness: ReturnType<typeof seedHarness>,
  authoritativeRootIssueId: string
) {
  const originalGetSubtree = harness.ctx.issues.getSubtree;
  harness.ctx.issues.getSubtree = (async (issueId, companyId, options) => {
    const subtree = await originalGetSubtree(issueId, companyId, options);
    return { ...subtree, rootIssueId: authoritativeRootIssueId };
  }) as typeof harness.ctx.issues.getSubtree;
}

describe("W2B correctness repairs", () => {
  beforeEach(() => {
    sharedHandlerCache.clear();
  });

  it("renders fetched inactive root for active child without placeholder row", async () => {
    const harness = seedHarness();
    const originalList = harness.ctx.issues.list;
    harness.ctx.issues.list = async (input) => {
      if (input.status === "in_progress") {
        return originalList({ ...input, status: "in_progress" });
      }
      return [];
    };

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      roots: Array<{
        rootIssueId: string;
        title: string;
        canonicalStatus: string | null;
        rowError: unknown;
      }>;
    }>(harness, "company-flow", COMPANY_A, {});

    const root = company.roots.find((row) => row.rootIssueId === ISSUE_ROOT);
    expect(root).toBeDefined();
    expect(root?.title).toBe("Root issue");
    expect(root?.canonicalStatus).toBe("done");
    expect(root?.title).not.toBe(ISSUE_ROOT);
  });

  it("does not manufacture status or title when root cannot be fetched", async () => {
    const harness = seedHarness({
      issues: [
        baseIssue({
          id: ISSUE_CHILD,
          companyId: COMPANY_A,
          parentId: ISSUE_ROOT,
          title: "Child only",
          status: "in_progress",
          identifier: "LF-CHILD"
        })
      ]
    });

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      roots: Array<{
        rootIssueId: string;
        title: string;
        canonicalStatus: string | null;
        rowError: { message: string } | null;
      }>;
    }>(harness, "company-flow", COMPANY_A, {});

    const root = company.roots.find((row) => row.rootIssueId === ISSUE_ROOT);
    expect(root).toBeDefined();
    expect(root?.canonicalStatus).toBeNull();
    expect(root?.title).toBe("");
    expect(root?.title).not.toBe(ISSUE_ROOT);
    expect(root?.rowError).toBeTruthy();
  });

  it("keeps issue rows when projects.list fails independently", async () => {
    const harness = seedHarness();
    harness.ctx.projects.list = async () => {
      throw new Error("projects unavailable");
    };

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      roots: unknown[];
      sourceErrors: Array<{ source: string }>;
    }>(harness, "company-flow", COMPANY_A, {});

    expect(company.roots.length).toBeGreaterThan(0);
    expect(company.sourceErrors.some((entry) => entry.source === "projects.list")).toBe(true);
  });

  it("degrades one active status page while keeping other status roots", async () => {
    const harness = seedHarness();
    const originalList = harness.ctx.issues.list;
    harness.ctx.issues.list = async (input) => {
      if (input.status === "todo") {
        throw new Error("todo page failed");
      }
      return originalList(input);
    };

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      roots: unknown[];
      freshness: { partial: boolean };
      sourceErrors: Array<{ source: string }>;
    }>(harness, "company-flow", COMPANY_A, {});

    expect(company.roots.length).toBeGreaterThan(0);
    expect(company.freshness.partial).toBe(true);
    expect(company.sourceErrors.some((entry) => entry.source === "issues.list:todo")).toBe(true);
  });

  it("returns unavailable token cost when orchestration fails instead of zero facts", async () => {
    const harness = seedHarness();
    harness.ctx.issues.summaries.getOrchestration = async () => {
      throw new Error("orchestration down");
    };

    await plugin.definition.setup(harness.ctx);
    const flow = await invokeRpcGetData<{
      tokenCost: { availability: string; costCents: number | null; inputTokens: number | null };
      phases: Array<{ state: string }>;
      compatibility: { compatible: boolean; message: string | null };
    }>(harness, "issue-flow", COMPANY_A, { issueId: ISSUE_ROOT });

    expect(flow.tokenCost.availability).toBe("unavailable");
    expect(flow.tokenCost.costCents).toBeNull();
    expect(flow.tokenCost.inputTokens).toBeNull();
    expect(flow.phases.every((phase) => phase.state === "unavailable")).toBe(true);
    expect(flow.compatibility.compatible).toBe(false);
  });

  it("populates company attention reasons from orchestration facts", async () => {
    const harness = seedHarness({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Review root",
          projectId: PROJECT_A,
          status: "in_review",
          identifier: "LF-ROOT",
          executionState: {
            status: "in_progress",
            currentStageId: "stage-review",
            currentStageType: "review",
            currentParticipant: { agentId: AGENT_A, userId: null },
            completedStageIds: [],
            lastDecisionOutcome: null,
            changesRequestedCount: 0
          }
        } as unknown as Issue)
      ]
    });

    const originalOrchestration = harness.ctx.issues.summaries.getOrchestration;
    harness.ctx.issues.summaries.getOrchestration = (async (
      input: Parameters<typeof originalOrchestration>[0]
    ) => {
      const summary = await originalOrchestration(input);
      return {
        ...summary,
        runs: [
          {
            id: "run-failed",
            issueId: ISSUE_ROOT,
            agentId: AGENT_A,
            status: "failed",
            startedAt: "2026-09-03T12:00:00.000Z",
            finishedAt: "2026-09-03T12:01:00.000Z",
            invocationSource: "manual",
            triggerDetail: null,
            error: null,
            createdAt: "2026-09-03T12:00:00.000Z"
          }
        ],
        invocationBlocks: [
          {
            issueId: ISSUE_ROOT,
            agentId: AGENT_A,
            scopeType: "agent",
            scopeId: AGENT_A,
            scopeName: "Worker",
            reason: "Invocation blocked by policy"
          }
        ]
      };
    }) as unknown as typeof harness.ctx.issues.summaries.getOrchestration;

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      attention: Array<{ reason: string }>;
    }>(harness, "company-flow", COMPANY_A, {});

    const reasons = company.attention.map((item) => item.reason);
    expect(reasons).toContain("pending_review");
    expect(reasons).toContain("failed_run");
    expect(reasons).toContain("invocation_block");
  });

  it("matches participant agent incidents and dedupes issue-flow incidents", async () => {
    const harness = seedHarness({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Root",
          status: "in_progress",
          identifier: "LF-ROOT",
          executionState: {
            status: "in_progress",
            currentStageId: "stage-work",
            currentStageType: "work",
            currentParticipant: { agentId: AGENT_PARTICIPANT, userId: null },
            completedStageIds: [],
            lastDecisionOutcome: null,
            changesRequestedCount: 0
          }
        } as unknown as Issue)
      ]
    });

    const incident = {
      id: "incident-agent",
      scopeType: "agent",
      scopeId: AGENT_PARTICIPANT,
      status: "open"
    };

    harness.ctx.issues.summaries.getOrchestration = (async (input: {
      issueId: string;
      companyId: string;
    }) => ({
      issueId: input.issueId,
      companyId: input.companyId,
      subtreeIssueIds: [ISSUE_ROOT],
      relations: { [ISSUE_ROOT]: { blockedBy: [], blocks: [] } },
      approvals: [],
      runs: [],
      costs: {
        costCents: 0,
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        billingCode: null
      },
      openBudgetIncidents: [incident, incident],
      invocationBlocks: []
    })) as unknown as typeof harness.ctx.issues.summaries.getOrchestration;

    await plugin.definition.setup(harness.ctx);
    const flow = await invokeRpcGetData<{
      incidents: Array<{ id: string }>;
    }>(harness, "issue-flow", COMPANY_A, { issueId: ISSUE_ROOT });

    expect(flow.incidents).toHaveLength(1);
    expect(flow.incidents[0]?.id).toBe("incident-agent");
  });

  it("places unresolvable recognized incident scope in company scope-unavailable fallback", async () => {
    const harness = seedHarness({ projects: [] });
    harness.ctx.issues.summaries.getOrchestration = (async (input: {
      issueId: string;
      companyId: string;
    }) => ({
      issueId: input.issueId,
      companyId: input.companyId,
      subtreeIssueIds: [ISSUE_ROOT, ISSUE_CHILD],
      relations: {
        [ISSUE_ROOT]: { blockedBy: [], blocks: [] },
        [ISSUE_CHILD]: { blockedBy: [], blocks: [] }
      },
      approvals: [],
      runs: [],
      costs: {
        costCents: 0,
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        billingCode: null
      },
      openBudgetIncidents: [
        {
          id: "incident-project-unknown",
          scopeType: "project",
          scopeId: PROJECT_UNKNOWN,
          status: "open"
        }
      ],
      invocationBlocks: []
    })) as unknown as typeof harness.ctx.issues.summaries.getOrchestration;

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      scopeUnavailableIncidents: Array<{ id: string }>;
      companyIncidents: unknown[];
    }>(harness, "company-flow", COMPANY_A, {});

    expect(company.scopeUnavailableIncidents.map((item) => item.id)).toContain(
      "incident-project-unknown"
    );
    expect(company.companyIncidents).toHaveLength(0);
  });

  it("records local project and agent detail failures on issue-flow", async () => {
    const harness = seedHarness({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Root",
          projectId: PROJECT_A,
          assigneeAgentId: AGENT_A,
          status: "in_progress",
          identifier: "LF-ROOT"
        })
      ]
    });

    harness.ctx.projects.get = async () => {
      throw new Error("project read failed");
    };
    harness.ctx.agents.get = async () => {
      throw new Error("agent read failed");
    };

    await plugin.definition.setup(harness.ctx);
    const flow = await invokeRpcGetData<{
      projectName: string | null;
      assigneeLabel: string | null;
      sourceErrors: Array<{ source: string }>;
      freshness: { partial: boolean };
    }>(harness, "issue-flow", COMPANY_A, { issueId: ISSUE_ROOT });

    expect(flow.projectName).toBeNull();
    expect(flow.assigneeLabel).toBeNull();
    expect(flow.sourceErrors.some((entry) => entry.source === "projects.get")).toBe(true);
    expect(flow.sourceErrors.some((entry) => entry.source === "agents.get")).toBe(true);
    expect(flow.freshness.partial).toBe(true);
  });

  it("rejects foreign subtree entities fail-closed", async () => {
    const harness = seedHarness();
    const foreignSubtreeIssue = baseIssue({
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      companyId: COMPANY_B,
      title: "Foreign subtree",
      identifier: "LF-FOREIGN-SUB"
    });

    const originalGetSubtree = harness.ctx.issues.getSubtree;
    harness.ctx.issues.getSubtree = async (issueId, companyId, options) => {
      const subtree = await originalGetSubtree(issueId, companyId, options);
      return {
        ...subtree,
        issues: [...subtree.issues, foreignSubtreeIssue]
      };
    };

    await plugin.definition.setup(harness.ctx);
    await expect(
      invokeRpcGetData(harness, "issue-flow", COMPANY_A, { issueId: ISSUE_ROOT })
    ).rejects.toThrow(ISSUE_NOT_FOUND_MESSAGE);
  });

  it("maps issue-flow child attention to authoritative subtree root", async () => {
    const harness = seedHarness();
    withAuthoritativeSubtreeRoot(harness, ISSUE_ROOT);
    const originalOrchestration = harness.ctx.issues.summaries.getOrchestration;
    harness.ctx.issues.summaries.getOrchestration = (async (
      input: Parameters<typeof originalOrchestration>[0]
    ) => {
      const summary = await originalOrchestration(input);
      return {
        ...summary,
        runs: [
          {
            id: "run-child-failed",
            issueId: ISSUE_CHILD,
            agentId: AGENT_A,
            status: "failed",
            startedAt: "2026-09-03T12:00:00.000Z",
            finishedAt: "2026-09-03T12:01:00.000Z",
            invocationSource: "manual",
            triggerDetail: null,
            error: null,
            createdAt: "2026-09-03T12:00:00.000Z"
          }
        ]
      };
    }) as unknown as typeof harness.ctx.issues.summaries.getOrchestration;

    await plugin.definition.setup(harness.ctx);

    const flow = await invokeRpcGetData<{
      attention: Array<{ issueId: string; rootIssueId: string; reason: string }>;
    }>(harness, "issue-flow", COMPANY_A, { issueId: ISSUE_CHILD });

    expect(flow.attention.some((item) => item.reason === "failed_run")).toBe(true);
    expect(flow.attention.every((item) => item.rootIssueId === ISSUE_ROOT)).toBe(true);
  });

  it("targets project-scoped company attention at root issue not raw project id", async () => {
    const harness = seedHarness();
    harness.ctx.issues.summaries.getOrchestration = (async (input: {
      issueId: string;
      companyId: string;
    }) => ({
      issueId: input.issueId,
      companyId: input.companyId,
      subtreeIssueIds: [ISSUE_ROOT, ISSUE_CHILD],
      relations: {
        [ISSUE_ROOT]: { blockedBy: [], blocks: [] },
        [ISSUE_CHILD]: { blockedBy: [], blocks: [] }
      },
      approvals: [],
      runs: [],
      costs: {
        costCents: 0,
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        billingCode: null
      },
      openBudgetIncidents: [
        {
          id: "incident-project",
          scopeType: "project",
          scopeId: PROJECT_A,
          status: "open"
        }
      ],
      invocationBlocks: []
    })) as unknown as typeof harness.ctx.issues.summaries.getOrchestration;

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      attention: Array<{
        reason: string;
        issueId: string;
        rootIssueId: string;
      }>;
    }>(harness, "company-flow", COMPANY_A, {});

    const incidentAttention = company.attention.filter((item) => item.reason === "budget_incident");
    expect(incidentAttention).toHaveLength(1);
    expect(incidentAttention[0]?.issueId).toBe(ISSUE_ROOT);
    expect(incidentAttention[0]?.rootIssueId).toBe(ISSUE_ROOT);
    expect(incidentAttention[0]?.issueId).not.toBe(PROJECT_A);
  });

  it("targets scope-unavailable company attention at company lane", async () => {
    const harness = seedHarness({ projects: [] });
    harness.ctx.issues.summaries.getOrchestration = (async (input: {
      issueId: string;
      companyId: string;
    }) => ({
      issueId: input.issueId,
      companyId: input.companyId,
      subtreeIssueIds: [ISSUE_ROOT, ISSUE_CHILD],
      relations: {
        [ISSUE_ROOT]: { blockedBy: [], blocks: [] },
        [ISSUE_CHILD]: { blockedBy: [], blocks: [] }
      },
      approvals: [],
      runs: [],
      costs: {
        costCents: 0,
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        billingCode: null
      },
      openBudgetIncidents: [
        {
          id: "incident-project-unknown",
          scopeType: "project",
          scopeId: PROJECT_UNKNOWN,
          status: "open"
        }
      ],
      invocationBlocks: []
    })) as unknown as typeof harness.ctx.issues.summaries.getOrchestration;

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      attention: Array<{ reason: string; issueId: string; rootIssueId: string }>;
    }>(harness, "company-flow", COMPANY_A, {});

    const incidentAttention = company.attention.filter((item) => item.reason === "budget_incident");
    expect(incidentAttention).toHaveLength(1);
    expect(incidentAttention[0]?.issueId).toBe(COMPANY_A);
    expect(incidentAttention[0]?.rootIssueId).toBe(COMPANY_A);
  });

  it("targets issue-flow child incident attention at selected issue and subtree root", async () => {
    const harness = seedHarness({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Root",
          projectId: PROJECT_A,
          status: "done",
          identifier: "LF-ROOT"
        }),
        baseIssue({
          id: ISSUE_CHILD,
          companyId: COMPANY_A,
          parentId: ISSUE_ROOT,
          title: "Child",
          projectId: PROJECT_A,
          status: "in_progress",
          identifier: "LF-CHILD",
          executionState: {
            status: "in_progress",
            currentStageId: "stage-work",
            currentStageType: "work",
            currentParticipant: { agentId: AGENT_PARTICIPANT, userId: null },
            completedStageIds: [],
            lastDecisionOutcome: null,
            changesRequestedCount: 0
          }
        } as unknown as Issue)
      ]
    });
    withAuthoritativeSubtreeRoot(harness, ISSUE_ROOT);

    harness.ctx.issues.summaries.getOrchestration = (async (input: {
      issueId: string;
      companyId: string;
    }) => ({
      issueId: input.issueId,
      companyId: input.companyId,
      subtreeIssueIds: [ISSUE_ROOT, ISSUE_CHILD],
      relations: {
        [ISSUE_ROOT]: { blockedBy: [], blocks: [] },
        [ISSUE_CHILD]: { blockedBy: [], blocks: [] }
      },
      approvals: [],
      runs: [],
      costs: {
        costCents: 0,
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        billingCode: null
      },
      openBudgetIncidents: [
        {
          id: "incident-agent",
          scopeType: "agent",
          scopeId: AGENT_PARTICIPANT,
          status: "open"
        }
      ],
      invocationBlocks: []
    })) as unknown as typeof harness.ctx.issues.summaries.getOrchestration;

    await plugin.definition.setup(harness.ctx);
    const flow = await invokeRpcGetData<{
      attention: Array<{ reason: string; issueId: string; rootIssueId: string }>;
    }>(harness, "issue-flow", COMPANY_A, { issueId: ISSUE_CHILD });

    const incidentAttention = flow.attention.filter((item) => item.reason === "budget_incident");
    expect(incidentAttention).toHaveLength(1);
    expect(incidentAttention[0]?.issueId).toBe(ISSUE_CHILD);
    expect(incidentAttention[0]?.rootIssueId).toBe(ISSUE_ROOT);
  });
});

describe("W6 execution state hydration", () => {
  beforeEach(() => {
    sharedHandlerCache.clear();
  });

  function stripListExecutionFields(harness: ReturnType<typeof seedHarness>) {
    const originalList = harness.ctx.issues.list;
    harness.ctx.issues.list = async (input) => {
      const page = await originalList(input);
      return page.map((issue) => ({
        ...issue,
        executionState: null,
        executionPolicy: null
      }));
    };
  }

  it("hydrates pending review stage and participant when list omits execution state", async () => {
    const harness = seedHarness({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Review root",
          projectId: PROJECT_A,
          status: "in_review",
          identifier: "LF-ROOT",
          executionState: {
            status: "in_progress",
            currentStageId: "stage-review",
            currentStageType: "review",
            currentParticipant: { agentId: AGENT_PARTICIPANT, userId: null },
            completedStageIds: [],
            lastDecisionOutcome: null,
            changesRequestedCount: 0
          }
        } as unknown as Issue)
      ]
    });
    stripListExecutionFields(harness);

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      roots: Array<{
        rootIssueId: string;
        currentStageType: string | null;
        currentParticipantId: string | null;
      }>;
      attention: Array<{ reason: string; issueId: string }>;
    }>(harness, "company-flow", COMPANY_A, {});

    const root = company.roots.find((row) => row.rootIssueId === ISSUE_ROOT);
    expect(root?.currentStageType).toBe("review");
    expect(root?.currentParticipantId).toBe(AGENT_PARTICIPANT);

    const reasons = company.attention.map((item) => item.reason);
    expect(reasons).toContain("pending_review");
    expect(company.attention.some((item) => item.issueId === ISSUE_ROOT)).toBe(true);
  });

  it("degrades honestly when issues.get fails without fabricating execution state", async () => {
    const harness = seedHarness({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Review root",
          projectId: PROJECT_A,
          status: "in_review",
          identifier: "LF-ROOT",
          executionState: {
            status: "in_progress",
            currentStageId: "stage-review",
            currentStageType: "review",
            currentParticipant: { agentId: AGENT_PARTICIPANT, userId: null },
            completedStageIds: [],
            lastDecisionOutcome: null,
            changesRequestedCount: 0
          }
        } as unknown as Issue)
      ]
    });
    stripListExecutionFields(harness);

    const originalGet = harness.ctx.issues.get;
    harness.ctx.issues.get = async (issueId, companyId) => {
      if (issueId === ISSUE_ROOT) {
        throw new Error("detail read failed");
      }
      return originalGet(issueId, companyId);
    };

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      roots: Array<{
        rootIssueId: string;
        currentStageType: string | null;
        currentParticipantId: string | null;
      }>;
      attention: Array<{ reason: string }>;
      sourceErrors: Array<{ source: string; message: string }>;
      freshness: { partial: boolean };
    }>(harness, "company-flow", COMPANY_A, {});

    const root = company.roots.find((row) => row.rootIssueId === ISSUE_ROOT);
    expect(root?.currentStageType).toBeNull();
    expect(root?.currentParticipantId).toBeNull();
    expect(company.attention.map((item) => item.reason)).not.toContain("pending_review");
    expect(company.sourceErrors.some((entry) => entry.source === `issues.get:${ISSUE_ROOT}`)).toBe(
      true
    );
    expect(company.freshness.partial).toBe(true);
  });

  it("reports recoverable source error when issues.get returns null for a list record", async () => {
    const harness = seedHarness({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Review root",
          projectId: PROJECT_A,
          status: "in_review",
          identifier: "LF-ROOT",
          executionState: {
            status: "in_progress",
            currentStageId: "stage-review",
            currentStageType: "review",
            currentParticipant: { agentId: AGENT_PARTICIPANT, userId: null },
            completedStageIds: [],
            lastDecisionOutcome: null,
            changesRequestedCount: 0
          }
        } as unknown as Issue)
      ]
    });
    stripListExecutionFields(harness);

    const originalGet = harness.ctx.issues.get;
    harness.ctx.issues.get = async (issueId, companyId) => {
      if (issueId === ISSUE_ROOT) {
        return null;
      }
      return originalGet(issueId, companyId);
    };

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      roots: Array<{
        rootIssueId: string;
        currentStageType: string | null;
        currentParticipantId: string | null;
        title: string;
      }>;
      sourceErrors: Array<{ source: string; message: string; recoverable: boolean }>;
      freshness: { partial: boolean };
    }>(harness, "company-flow", COMPANY_A, {});

    const root = company.roots.find((row) => row.rootIssueId === ISSUE_ROOT);
    expect(root?.currentStageType).toBeNull();
    expect(root?.currentParticipantId).toBeNull();
    expect(root?.title).toBe("Review root");
    const detailError = company.sourceErrors.find(
      (entry) => entry.source === `issues.get:${ISSUE_ROOT}`
    );
    expect(detailError).toBeDefined();
    expect(detailError?.recoverable).toBe(true);
    expect(detailError?.message).toMatch(/unavailable/i);
    expect(company.freshness.partial).toBe(true);
  });

  it("hydrates child pending review attention when list omits execution state", async () => {
    const harness = seedHarness({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Root issue",
          projectId: PROJECT_A,
          status: "done",
          identifier: "LF-ROOT"
        }),
        baseIssue({
          id: ISSUE_CHILD,
          companyId: COMPANY_A,
          parentId: ISSUE_ROOT,
          title: "Child in review",
          projectId: PROJECT_A,
          status: "in_review",
          identifier: "LF-CHILD",
          executionState: {
            status: "in_progress",
            currentStageId: "stage-review",
            currentStageType: "review",
            currentParticipant: { agentId: AGENT_PARTICIPANT, userId: null },
            completedStageIds: [],
            lastDecisionOutcome: null,
            changesRequestedCount: 0
          }
        } as unknown as Issue)
      ]
    });
    stripListExecutionFields(harness);

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      roots: Array<{
        rootIssueId: string;
        currentStageType: string | null;
        currentParticipantId: string | null;
      }>;
      attention: Array<{ reason: string; issueId: string; rootIssueId: string }>;
    }>(harness, "company-flow", COMPANY_A, {});

    const root = company.roots.find((row) => row.rootIssueId === ISSUE_ROOT);
    expect(root?.currentStageType).toBeNull();
    expect(root?.currentParticipantId).toBeNull();

    const pendingReview = company.attention.filter((item) => item.reason === "pending_review");
    expect(pendingReview).toHaveLength(1);
    expect(pendingReview[0]?.issueId).toBe(ISSUE_CHILD);
    expect(pendingReview[0]?.rootIssueId).toBe(ISSUE_ROOT);
  });

  it("rejects foreign-company detail reads without leaking execution state", async () => {
    const harness = seedHarness({
      issues: [
        baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_A,
          title: "Review root",
          projectId: PROJECT_A,
          status: "in_review",
          identifier: "LF-ROOT",
          executionState: {
            status: "in_progress",
            currentStageId: "stage-review",
            currentStageType: "review",
            currentParticipant: { agentId: AGENT_PARTICIPANT, userId: null },
            completedStageIds: [],
            lastDecisionOutcome: null,
            changesRequestedCount: 0
          }
        } as unknown as Issue)
      ]
    });
    stripListExecutionFields(harness);

    const originalGet = harness.ctx.issues.get;
    harness.ctx.issues.get = async (issueId, companyId) => {
      if (issueId === ISSUE_ROOT) {
        return baseIssue({
          id: ISSUE_ROOT,
          companyId: COMPANY_B,
          title: "Foreign detail",
          status: "in_review",
          identifier: "LF-FOREIGN",
          executionState: {
            status: "in_progress",
            currentStageId: "stage-review",
            currentStageType: "review",
            currentParticipant: { agentId: AGENT_PARTICIPANT, userId: null },
            completedStageIds: [],
            lastDecisionOutcome: null,
            changesRequestedCount: 0
          }
        } as unknown as Issue);
      }
      return originalGet(issueId, companyId);
    };

    await plugin.definition.setup(harness.ctx);
    const company = await invokeRpcGetData<{
      roots: Array<{
        rootIssueId: string;
        currentStageType: string | null;
        currentParticipantId: string | null;
        title: string;
      }>;
      sourceErrors: Array<{ source: string }>;
    }>(harness, "company-flow", COMPANY_A, {});

    const root = company.roots.find((row) => row.rootIssueId === ISSUE_ROOT);
    expect(root?.currentStageType).toBeNull();
    expect(root?.currentParticipantId).toBeNull();
    expect(root?.title).toBe("Review root");
    expect(company.sourceErrors.some((entry) => entry.source === `issues.get:${ISSUE_ROOT}`)).toBe(
      true
    );
  });
});

describe("Live Flow worker handlers", () => {
  beforeEach(async () => {
    sharedHandlerCache.clear();
  });

  it("loads issue-flow with subtree orchestration facts", async () => {
    const harness = seedHarness();
    await plugin.definition.setup(harness.ctx);

    const flow = await invokeRpcGetData<{
      issueId: string;
      canonicalStatus: string;
      runs: unknown[];
      compatibility: { missingFields: string[] };
    }>(harness, "issue-flow", COMPANY_A, { issueId: ISSUE_ROOT });

    expect(flow.issueId).toBe(ISSUE_ROOT);
    expect(flow.canonicalStatus).toBe("done");
    expect(flow.compatibility.missingFields).toContain("workProducts");
    expect(flow.compatibility.missingFields).toContain("deployReceipts");
  });

  it("deduplicates overlapping active roots on company-flow", async () => {
    const harness = seedHarness();
    await plugin.definition.setup(harness.ctx);

    const company = await invokeRpcGetData<{ roots: Array<{ rootIssueId: string }> }>(
      harness,
      "company-flow",
      COMPANY_A,
      {}
    );

    expect(company.roots.map((row) => row.rootIssueId)).toEqual([ISSUE_ROOT]);
  });

  it("marks partial snapshot when a forced refresh degrades all issue status pages", async () => {
    vi.useFakeTimers();
    const harness = seedHarness();
    await plugin.definition.setup(harness.ctx);

    await invokeRpcGetData(harness, "company-flow", COMPANY_A, {});
    const originalList = harness.ctx.issues.list;
    harness.ctx.issues.list = async () => {
      throw new Error("list refresh failed");
    };

    vi.advanceTimersByTime(16_000);
    const stale = await invokeRpcGetData<{
      freshness: { stale: boolean; partial: boolean };
      sourceErrors: Array<{ source: string }>;
    }>(harness, "company-flow", COMPANY_A, {});

    harness.ctx.issues.list = originalList;
    vi.useRealTimers();
    expect(stale.freshness.partial).toBe(true);
    expect(stale.sourceErrors.length).toBeGreaterThan(0);
  });
});
