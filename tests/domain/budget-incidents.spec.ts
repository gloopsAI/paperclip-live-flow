import { describe, expect, it } from "vitest";
import {
  deriveBudgetIncidentRelevance,
  shouldOmitIncidentFromIssue
} from "../../src/domain/budget-incidents.js";

describe("deriveBudgetIncidentRelevance", () => {
  const rootSummaries = [
    {
      rootIssueId: "root-a",
      subtree: {
        issueIds: ["root-a", "child-a"],
        assigneeAgentIds: ["agent-1"],
        participantAgentIds: ["agent-2"],
        projectIds: ["project-a", "project-child"]
      }
    },
    {
      rootIssueId: "root-b",
      subtree: {
        issueIds: ["root-b"],
        assigneeAgentIds: ["agent-9"],
        participantAgentIds: [],
        projectIds: ["project-b"]
      }
    }
  ];

  it("routes company scope to company level once", () => {
    const relevance = deriveBudgetIncidentRelevance({
      incidents: [{ id: "inc-co", scopeType: "company", scopeId: "co-1", status: "open" }],
      rootSummaries
    });
    expect(relevance).toEqual([{ level: "company", incidentId: "inc-co" }]);
  });

  it("attaches project scope when descendant matches exact project id", () => {
    const relevance = deriveBudgetIncidentRelevance({
      incidents: [
        { id: "inc-proj", scopeType: "project", scopeId: "project-child", status: "open" }
      ],
      rootSummaries
    });
    expect(relevance).toEqual([{ level: "root", rootIssueId: "root-a", incidentId: "inc-proj" }]);
  });

  it("attaches agent scope to matching root", () => {
    const relevance = deriveBudgetIncidentRelevance({
      incidents: [{ id: "inc-agent", scopeType: "agent", scopeId: "agent-2", status: "open" }],
      rootSummaries
    });
    expect(relevance).toEqual([{ level: "root", rootIssueId: "root-a", incidentId: "inc-agent" }]);
  });

  it("falls back unknown scope types to scope_unavailable", () => {
    const relevance = deriveBudgetIncidentRelevance({
      incidents: [{ id: "inc-x", scopeType: "workspace", scopeId: "ws-1", status: "open" }],
      rootSummaries
    });
    expect(relevance).toEqual([{ level: "scope_unavailable", incidentId: "inc-x" }]);
  });

  it("falls back unresolvable scope ids to scope_unavailable", () => {
    const relevance = deriveBudgetIncidentRelevance({
      incidents: [{ id: "inc-u", scopeType: "project", scopeId: "missing", status: "open" }],
      rootSummaries,
      unresolvableScopeIds: new Set(["missing"])
    });
    expect(relevance).toEqual([{ level: "scope_unavailable", incidentId: "inc-u" }]);
  });

  it("deduplicates the same incident across root summaries", () => {
    const relevance = deriveBudgetIncidentRelevance({
      incidents: [
        { id: "inc-dup", scopeType: "company", scopeId: "co-1", status: "open" },
        { id: "inc-dup", scopeType: "company", scopeId: "co-1", status: "open" }
      ],
      rootSummaries
    });
    expect(relevance).toHaveLength(1);
  });

  it("omits unrelated project incidents from issue attachment", () => {
    const omit = shouldOmitIncidentFromIssue(
      { id: "inc", scopeType: "project", scopeId: "project-b", status: "open" },
      "project-a",
      ["project-a", "project-child"]
    );
    expect(omit).toBe(true);
  });
});
