import type { IssueRef } from "./types.js";

function buildRootMemo(issues: IssueRef[]): Map<string, string> {
  const byId = new Map(issues.map((issue) => [issue.id, issue]));
  const memo = new Map<string, string>();

  function rootOf(issueId: string, visiting = new Set<string>()): string {
    const cached = memo.get(issueId);
    if (cached) {
      return cached;
    }
    if (visiting.has(issueId)) {
      memo.set(issueId, issueId);
      return issueId;
    }
    visiting.add(issueId);

    const issue = byId.get(issueId);
    if (!issue) {
      memo.set(issueId, issueId);
      return issueId;
    }

    if (issue.rootId) {
      memo.set(issueId, issue.rootId);
      return issue.rootId;
    }

    if (!issue.parentId || !byId.has(issue.parentId)) {
      memo.set(issueId, issue.id);
      return issue.id;
    }

    const parentRoot = rootOf(issue.parentId, visiting);
    memo.set(issueId, parentRoot);
    return parentRoot;
  }

  for (const issue of issues) {
    rootOf(issue.id);
  }

  return memo;
}

/**
 * Resolve each issue to its unique root without double-counting descendants.
 * Uses explicit rootId when present; otherwise walks parentId with memoization.
 */
export function resolveUniqueRoots(issues: IssueRef[]): string[] {
  const memo = buildRootMemo(issues);
  return dedupeIds(issues.map((issue) => memo.get(issue.id) ?? issue.id));
}

/** Group issues by unique root id. */
export function groupIssuesByRoot(issues: IssueRef[]): Map<string, IssueRef[]> {
  const memo = buildRootMemo(issues);
  const groups = new Map<string, IssueRef[]>();

  for (const issue of issues) {
    const rootId = memo.get(issue.id) ?? issue.id;
    const bucket = groups.get(rootId) ?? [];
    bucket.push(issue);
    groups.set(rootId, bucket);
  }

  return groups;
}

/** Deduplicate string ids preserving first-seen order. */
export function dedupeIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

/** Deduplicate records by id preserving first-seen order. */
export function dedupeById<T extends { id: string }>(records: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const record of records) {
    if (!seen.has(record.id)) {
      seen.add(record.id);
      result.push(record);
    }
  }
  return result;
}
