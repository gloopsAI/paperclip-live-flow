import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { SourceError } from "../../contracts/common.js";
import { ACTIVE_ISSUE_STATUSES, DEFAULT_PAGE_SIZE } from "../constants.js";
import { assertEntityCompanyId } from "../company-scope.js";
import { buildSourceError } from "../normalize.js";
import { paginateToExhaustion } from "../pagination.js";

type LoadedIssue = NonNullable<Awaited<ReturnType<PluginContext["issues"]["get"]>>>;
type LoadedProject = Awaited<ReturnType<PluginContext["projects"]["list"]>>[number];
type LoadedAgent = Awaited<ReturnType<PluginContext["agents"]["list"]>>[number];

export type LoadResult<T> = {
  data: T;
  sourceErrors: SourceError[];
};

export async function loadActiveIssuesIndependent(
  ctx: PluginContext,
  companyId: string
): Promise<LoadResult<LoadedIssue[]>> {
  const byId = new Map<string, LoadedIssue>();
  const sourceErrors: SourceError[] = [];

  for (const status of ACTIVE_ISSUE_STATUSES) {
    try {
      const page = await paginateToExhaustion(
        (offset, limit) => ctx.issues.list({ companyId, status, offset, limit }),
        DEFAULT_PAGE_SIZE
      );
      for (const issue of page) {
        assertEntityCompanyId(issue.companyId, companyId);
        byId.set(issue.id, issue);
      }
    } catch (error) {
      sourceErrors.push(buildSourceError(`issues.list:${status}`, error));
    }
  }

  return { data: [...byId.values()], sourceErrors };
}

export async function loadProjectsIndependent(
  ctx: PluginContext,
  companyId: string
): Promise<LoadResult<LoadedProject[]>> {
  try {
    const data = await paginateToExhaustion(
      (offset, limit) => ctx.projects.list({ companyId, offset, limit }),
      DEFAULT_PAGE_SIZE
    );
    for (const project of data) {
      assertEntityCompanyId(project.companyId, companyId);
    }
    return { data, sourceErrors: [] };
  } catch (error) {
    return { data: [], sourceErrors: [buildSourceError("projects.list", error)] };
  }
}

export async function loadAgentsIndependent(
  ctx: PluginContext,
  companyId: string
): Promise<LoadResult<LoadedAgent[]>> {
  try {
    const data = await paginateToExhaustion(
      (offset, limit) => ctx.agents.list({ companyId, offset, limit }),
      DEFAULT_PAGE_SIZE
    );
    for (const agent of data) {
      assertEntityCompanyId(agent.companyId, companyId);
    }
    return { data, sourceErrors: [] };
  } catch (error) {
    return { data: [], sourceErrors: [buildSourceError("agents.list", error)] };
  }
}
