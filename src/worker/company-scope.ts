import { ISSUE_NOT_FOUND_MESSAGE } from "./constants.js";

export class LiveFlowNotFoundError extends Error {
  constructor(message: string = ISSUE_NOT_FOUND_MESSAGE) {
    super(message);
    this.name = "LiveFlowNotFoundError";
  }
}

export class LiveFlowScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveFlowScopeError";
  }
}

/** Require non-empty host-injected companyId on every data handler. */
export function requireHostCompanyId(params: Record<string, unknown>): string {
  const companyId = typeof params.companyId === "string" ? params.companyId.trim() : "";
  if (!companyId) {
    throw new LiveFlowScopeError("companyId is required");
  }
  return companyId;
}

export function assertEntityCompanyId(
  entityCompanyId: string | null | undefined,
  expectedCompanyId: string
): void {
  if (!entityCompanyId || entityCompanyId !== expectedCompanyId) {
    throw new LiveFlowNotFoundError();
  }
}

/** Validate every entity in a subtree/list carries the authenticated company scope. */
export function validateCompanyEntities<T extends { companyId: string }>(
  entities: T[],
  expectedCompanyId: string
): void {
  for (const entity of entities) {
    assertEntityCompanyId(entity.companyId, expectedCompanyId);
  }
}

export function requireIssueId(params: Record<string, unknown>): string {
  const issueId = typeof params.issueId === "string" ? params.issueId.trim() : "";
  if (!issueId) {
    throw new LiveFlowNotFoundError();
  }
  return issueId;
}

/** Merge host RPC company scope the same way worker-rpc-host handleGetData does. */
export function mergeHostRpcParams(
  hostCompanyId: string | undefined,
  params: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...params,
    ...(hostCompanyId === undefined ? {} : { companyId: hostCompanyId })
  };
}
