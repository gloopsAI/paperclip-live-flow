import type { BudgetIncidentRelevance, IncidentRef, RootSummaryContext } from "./types.js";
import { dedupeById } from "./roots.js";

const KNOWN_SCOPE_TYPES = new Set(["company", "project", "agent"]);

export type BudgetIncidentContext = {
  incidents: IncidentRef[];
  rootSummaries: RootSummaryContext[];
  /** When a scope id cannot be resolved to a known entity. */
  unresolvableScopeIds?: Set<string>;
};

/**
 * Determine authoritative attachment level for budget incidents.
 * Company scope attaches once at company level; project/agent attach to matching roots;
 * unknown scopes and unresolvable ids fall back to scope_unavailable (company lane).
 */
export function deriveBudgetIncidentRelevance(
  ctx: BudgetIncidentContext
): BudgetIncidentRelevance[] {
  const results: BudgetIncidentRelevance[] = [];
  const seenIncidentIds = new Set<string>();

  for (const incident of dedupeById(ctx.incidents)) {
    if (seenIncidentIds.has(incident.id)) continue;
    seenIncidentIds.add(incident.id);

    if (!KNOWN_SCOPE_TYPES.has(incident.scopeType)) {
      results.push({ level: "scope_unavailable", incidentId: incident.id });
      continue;
    }

    if (ctx.unresolvableScopeIds?.has(incident.scopeId)) {
      results.push({ level: "scope_unavailable", incidentId: incident.id });
      continue;
    }

    if (incident.scopeType === "company") {
      results.push({ level: "company", incidentId: incident.id });
      continue;
    }

    if (incident.scopeType === "project") {
      const matchingRoots = ctx.rootSummaries.filter((summary) =>
        summary.subtree.projectIds.includes(incident.scopeId)
      );
      if (matchingRoots.length === 0) {
        continue;
      }
      for (const summary of matchingRoots) {
        results.push({
          level: "root",
          rootIssueId: summary.rootIssueId,
          incidentId: incident.id
        });
      }
      continue;
    }

    if (incident.scopeType === "agent") {
      const matchingRoots = ctx.rootSummaries.filter((summary) => {
        const agents = new Set([
          ...summary.subtree.assigneeAgentIds,
          ...summary.subtree.participantAgentIds
        ]);
        return agents.has(incident.scopeId);
      });
      if (matchingRoots.length === 0) {
        continue;
      }
      for (const summary of matchingRoots) {
        results.push({
          level: "root",
          rootIssueId: summary.rootIssueId,
          incidentId: incident.id
        });
      }
    }
  }

  return dedupeRelevance(results);
}

function dedupeRelevance(items: BudgetIncidentRelevance[]): BudgetIncidentRelevance[] {
  const seen = new Set<string>();
  const out: BudgetIncidentRelevance[] = [];
  for (const item of items) {
    const key =
      item.level === "root"
        ? `${item.level}:${item.rootIssueId}:${item.incidentId}`
        : `${item.level}:${item.incidentId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Incidents that should appear on an issue view (root-attached only). */
export function incidentsForIssueView(
  _issueId: string,
  rootIssueId: string,
  relevance: BudgetIncidentRelevance[]
): string[] {
  return relevance
    .filter((item) => item.level === "root" && item.rootIssueId === rootIssueId)
    .map((item) => item.incidentId);
}

/** True when an incident must not attach to a specific issue row (unrelated project). */
export function shouldOmitIncidentFromIssue(
  incident: IncidentRef,
  issueProjectId: string | null,
  subtreeProjectIds: string[]
): boolean {
  if (incident.scopeType !== "project") {
    return false;
  }
  if (subtreeProjectIds.includes(incident.scopeId)) {
    return false;
  }
  return issueProjectId !== incident.scopeId;
}
