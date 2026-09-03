import type { AttentionItem, IncidentFact } from "../../contracts/common.js";

export function provenanceIncidentId(item: AttentionItem): string | null {
  return item.source.find((entry) => entry.kind === "budgetIncident")?.entityId ?? null;
}

/** Drop budget-attention rows already rendered in dedicated incident sections. */
export function filterDedicatedBudgetAttention(
  attention: AttentionItem[],
  companyIncidents: IncidentFact[],
  scopeUnavailableIncidents: IncidentFact[]
): AttentionItem[] {
  const dedicatedIncidentIds = new Set([
    ...companyIncidents.map((incident) => incident.id),
    ...scopeUnavailableIncidents.map((incident) => incident.id)
  ]);

  return attention.filter((item) => {
    if (item.reason !== "budget_incident") return true;
    const incidentId = provenanceIncidentId(item);
    return !(incidentId && dedicatedIncidentIds.has(incidentId));
  });
}

/** Link only when the attention root is one of the loaded active root rows. */
export function attentionItemUsesIssueLink(
  item: AttentionItem,
  activeRootIds: ReadonlySet<string>
): boolean {
  return activeRootIds.has(item.rootIssueId);
}

export function attentionLinkLabel(item: AttentionItem): string {
  return item.identifier ?? item.issueId;
}
