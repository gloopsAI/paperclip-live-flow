import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { SourceError } from "../../contracts/common.js";
import { dedupeById } from "../../domain/roots.js";
import type { IssueRef } from "../../domain/types.js";
import { ACTIVE_ISSUE_STATUSES, DEFAULT_PAGE_SIZE } from "../constants.js";
import { assertEntityCompanyId } from "../company-scope.js";
import { mapWithBoundedConcurrency } from "../concurrency.js";
import { buildSourceError } from "../normalize.js";
import { paginateToExhaustion } from "../pagination.js";

type LoadedIssue = NonNullable<Awaited<ReturnType<PluginContext["issues"]["get"]>>>;

export function toIssueRef(issue: NonNullable<LoadedIssue>): IssueRef {
  return {
    id: issue.id,
    parentId: issue.parentId,
    projectId: issue.projectId,
    assigneeAgentId: issue.assigneeAgentId,
    identifier: issue.identifier,
    title: issue.title,
    status: issue.status as IssueRef["status"]
  };
}

export async function loadActiveIssues(
  ctx: PluginContext,
  companyId: string
): Promise<NonNullable<LoadedIssue>[]> {
  const byId = new Map<string, NonNullable<LoadedIssue>>();

  for (const status of ACTIVE_ISSUE_STATUSES) {
    const page = await paginateToExhaustion(
      (offset, limit) => ctx.issues.list({ companyId, status, offset, limit }),
      DEFAULT_PAGE_SIZE
    );

    for (const issue of page) {
      assertEntityCompanyId(issue.companyId, companyId);
      byId.set(issue.id, issue);
    }
  }

  return [...byId.values()];
}

/** Upstream list records omit native execution fields; detail reads restore them. */
export function listIssueNeedsExecutionHydration(issue: LoadedIssue): boolean {
  return issue.executionState == null || issue.executionPolicy == null;
}

export type HydrateExecutionStateResult = {
  hydrated: Map<string, NonNullable<LoadedIssue>>;
  sourceErrors: SourceError[];
};

/** Hydrate list-loaded issues through public issues.get with bounded concurrency. */
export async function hydrateListedIssuesExecutionState(
  issues: LoadedIssue[],
  getIssue: (issueId: string) => Promise<NonNullable<LoadedIssue> | null>,
  concurrency: number
): Promise<HydrateExecutionStateResult> {
  const hydrated = new Map<string, NonNullable<LoadedIssue>>();
  const sourceErrors: SourceError[] = [];
  const candidates = issues.filter(listIssueNeedsExecutionHydration);

  await mapWithBoundedConcurrency(candidates, concurrency, async (issue) => {
    try {
      const detailed = await getIssue(issue.id);
      if (detailed) {
        hydrated.set(issue.id, detailed);
        return;
      }
      sourceErrors.push(
        buildSourceError(`issues.get:${issue.id}`, new Error("Issue detail unavailable"))
      );
    } catch (error) {
      sourceErrors.push(buildSourceError(`issues.get:${issue.id}`, error));
    }
  });

  return { hydrated, sourceErrors };
}

export function createIssueGetMemo(ctx: PluginContext, companyId: string) {
  const memo = new Map<string, NonNullable<LoadedIssue> | null>();

  return async function memoizedIssueGet(
    issueId: string
  ): Promise<NonNullable<LoadedIssue> | null> {
    if (memo.has(issueId)) {
      return memo.get(issueId) ?? null;
    }
    const issue = await ctx.issues.get(issueId, companyId);
    if (issue) {
      assertEntityCompanyId(issue.companyId, companyId);
    }
    memo.set(issueId, issue);
    return issue;
  };
}

/** Resolve missing parent/root through issues.get with request memoization. */
export type EnrichIssueRefsResult = {
  refs: IssueRef[];
  fetchedIssues: Map<string, NonNullable<LoadedIssue>>;
  sourceErrors: SourceError[];
};

export async function enrichIssueRefsWithRoots(
  refs: IssueRef[],
  getIssue: (issueId: string) => Promise<NonNullable<LoadedIssue> | null>
): Promise<EnrichIssueRefsResult> {
  const byId = new Map(refs.map((ref) => [ref.id, { ...ref }]));
  const fetchedIssues = new Map<string, NonNullable<LoadedIssue>>();
  const sourceErrors: SourceError[] = [];
  const parentFetchErrors = new Set<string>();
  const rootMemo = new Map<string, string>();

  function recordParentFetchFailure(parentId: string, error: unknown): void {
    if (parentFetchErrors.has(parentId)) return;
    parentFetchErrors.add(parentId);
    sourceErrors.push(buildSourceError(`issues.get:${parentId}`, error));
  }

  async function fetchMissingParent(parentId: string): Promise<void> {
    if (byId.has(parentId) || parentFetchErrors.has(parentId)) return;
    try {
      const parent = await getIssue(parentId);
      if (parent) {
        byId.set(parent.id, toIssueRef(parent));
        fetchedIssues.set(parent.id, parent);
        return;
      }
      recordParentFetchFailure(parentId, new Error("Issue detail unavailable"));
    } catch (error) {
      recordParentFetchFailure(parentId, error);
    }
  }

  async function rootOf(issueId: string, visiting = new Set<string>()): Promise<string> {
    const cached = rootMemo.get(issueId);
    if (cached) return cached;
    if (visiting.has(issueId)) return issueId;
    visiting.add(issueId);

    const ref = byId.get(issueId);
    if (!ref) {
      rootMemo.set(issueId, issueId);
      return issueId;
    }

    if (!ref.parentId) {
      rootMemo.set(issueId, ref.id);
      return ref.id;
    }

    if (!byId.has(ref.parentId)) {
      await fetchMissingParent(ref.parentId);
    }

    const parentRef = byId.get(ref.parentId);
    if (!parentRef) {
      if (ref.parentId) {
        const parentRoot = await rootOf(ref.parentId, visiting);
        rootMemo.set(issueId, parentRoot);
        return parentRoot;
      }
      rootMemo.set(issueId, ref.id);
      return ref.id;
    }

    const parentRoot = await rootOf(parentRef.id, visiting);
    rootMemo.set(issueId, parentRoot);
    return parentRoot;
  }

  for (const issueId of byId.keys()) {
    const ref = byId.get(issueId);
    if (ref) {
      ref.rootId = await rootOf(issueId);
    }
  }

  return { refs: [...byId.values()], fetchedIssues, sourceErrors };
}

export async function loadProjects(ctx: PluginContext, companyId: string) {
  return paginateToExhaustion(
    (offset, limit) => ctx.projects.list({ companyId, offset, limit }),
    DEFAULT_PAGE_SIZE
  );
}

export async function loadAgents(ctx: PluginContext, companyId: string) {
  return paginateToExhaustion(
    (offset, limit) => ctx.agents.list({ companyId, offset, limit }),
    DEFAULT_PAGE_SIZE
  );
}

export function dedupeRuns<T extends { id: string }>(runs: T[]): T[] {
  return dedupeById(runs);
}

export function dedupeIncidents<T extends { id: string }>(incidents: T[]): T[] {
  return dedupeById(incidents);
}
