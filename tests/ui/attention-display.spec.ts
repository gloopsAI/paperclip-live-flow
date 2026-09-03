import { describe, expect, it } from "vitest";
import {
  attentionItemUsesIssueLink,
  attentionLinkLabel,
  filterDedicatedBudgetAttention,
  provenanceIncidentId
} from "../../src/ui/company-flow/attention-display.js";
import type { AttentionItem } from "../../src/contracts/common.js";
import { COMPANY_ID, ROOT_BLOCKED } from "./fixtures/company-flow.js";

const ACTIVE_ROOTS = new Set([ROOT_BLOCKED, "88888888-8888-8888-8888-888888888888"]);

describe("attention lane display", () => {
  it("filters budget attention already shown in dedicated incident sections", () => {
    const attention: AttentionItem[] = [
      {
        issueId: COMPANY_ID,
        rootIssueId: COMPANY_ID,
        identifier: null,
        title: "incident-company",
        reason: "budget_incident",
        explanation: "Company budget incident",
        source: [{ kind: "budgetIncident", entityId: "incident-company", field: "status" }]
      },
      {
        issueId: ROOT_BLOCKED,
        rootIssueId: ROOT_BLOCKED,
        identifier: "LF-BLK",
        title: "Blocked root",
        reason: "budget_incident",
        explanation: "Root budget incident",
        source: [{ kind: "budgetIncident", entityId: "incident-root", field: "status" }]
      }
    ];

    const filtered = filterDedicatedBudgetAttention(
      attention,
      [
        {
          id: "incident-company",
          scopeType: "company",
          scopeId: COMPANY_ID,
          scopeName: null,
          status: "open",
          availability: "available"
        }
      ],
      []
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.issueId).toBe(ROOT_BLOCKED);
    expect(provenanceIncidentId(attention[0]!)).toBe("incident-company");
  });

  it("links only attention whose rootIssueId is in the loaded active root set", () => {
    const rootItem: AttentionItem = {
      issueId: ROOT_BLOCKED,
      rootIssueId: ROOT_BLOCKED,
      identifier: "LF-BLK",
      title: "Blocked root",
      reason: "budget_incident",
      explanation: "Root budget incident",
      source: [{ kind: "budgetIncident", entityId: "incident-root", field: "status" }]
    };
    const companyItem: AttentionItem = {
      issueId: COMPANY_ID,
      rootIssueId: COMPANY_ID,
      identifier: null,
      title: "incident-company",
      reason: "budget_incident",
      explanation: "Company budget incident",
      source: [{ kind: "budgetIncident", entityId: "incident-company", field: "status" }]
    };
    const rootWithoutIdentifier: AttentionItem = {
      issueId: "88888888-8888-8888-8888-888888888888",
      rootIssueId: "88888888-8888-8888-8888-888888888888",
      identifier: null,
      title: "Root without identifier",
      reason: "blocked",
      explanation: "Missing identifier",
      source: []
    };

    expect(attentionItemUsesIssueLink(rootItem, ACTIVE_ROOTS)).toBe(true);
    expect(attentionItemUsesIssueLink(companyItem, ACTIVE_ROOTS)).toBe(false);
    expect(attentionItemUsesIssueLink(rootWithoutIdentifier, ACTIVE_ROOTS)).toBe(true);
    expect(attentionLinkLabel(rootWithoutIdentifier)).toBe("88888888-8888-8888-8888-888888888888");
  });
});
