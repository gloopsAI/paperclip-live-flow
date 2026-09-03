import type { AttentionItem, CanonicalIssueStatus } from "../../contracts/common.js";
import type { CompanyFlowResponse } from "../../contracts/company-flow.js";

export type CompanyFlowFilters = {
  projectId: string | null;
  assigneeAgentId: string | null;
  canonicalStatus: CanonicalIssueStatus | "any";
  attentionReason: string;
  text: string;
};

export const EMPTY_FILTERS: CompanyFlowFilters = {
  projectId: null,
  assigneeAgentId: null,
  canonicalStatus: "any",
  attentionReason: "any",
  text: ""
};

export function attentionByRoot(attention: AttentionItem[]): Map<string, AttentionItem[]> {
  const map = new Map<string, AttentionItem[]>();
  for (const item of attention) {
    const rootId = item.rootIssueId;
    const list = map.get(rootId) ?? [];
    list.push(item);
    map.set(rootId, list);
  }
  return map;
}

export function applyCompanyFlowFilters(
  snapshot: CompanyFlowResponse,
  filters: CompanyFlowFilters
): CompanyFlowResponse["roots"] {
  const attentionMap = attentionByRoot(snapshot.attention);
  const text = filters.text.trim().toLowerCase();

  return snapshot.roots.filter((row) => {
    if (filters.projectId && row.projectId !== filters.projectId) return false;
    if (filters.assigneeAgentId && row.assigneeAgentId !== filters.assigneeAgentId) {
      return false;
    }
    if (filters.canonicalStatus !== "any") {
      if (row.canonicalStatus !== filters.canonicalStatus) return false;
    }
    if (filters.attentionReason !== "any") {
      const items = attentionMap.get(row.rootIssueId) ?? [];
      if (!items.some((item) => item.reason === filters.attentionReason)) return false;
    }
    if (text) {
      const haystack = `${row.identifier ?? ""} ${row.title}`.toLowerCase();
      if (!haystack.includes(text)) return false;
    }
    return true;
  });
}

export function collectFilterOptions(snapshot: CompanyFlowResponse) {
  const projects = new Map<string, string>();
  const assignees = new Map<string, string>();
  for (const row of snapshot.roots) {
    if (row.projectId) {
      projects.set(row.projectId, row.projectName ?? row.projectId);
    }
    if (row.assigneeAgentId) {
      assignees.set(row.assigneeAgentId, row.assigneeLabel ?? row.assigneeAgentId);
    }
  }
  return { projects, assignees };
}
