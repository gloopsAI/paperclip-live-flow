import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyCompanyFlowFilters } from "../../src/ui/company-flow/filters.js";
import { baseCompanyFlow, PROJECT_B, ROOT_BLOCKED, ROOT_REVIEW } from "./fixtures/company-flow.js";

describe("company flow filters", () => {
  it("filters by project, status, attention reason, and text client-side", () => {
    const snapshot = baseCompanyFlow();
    const projectBRows = applyCompanyFlowFilters(snapshot, {
      ...EMPTY_FILTERS,
      projectId: PROJECT_B
    });
    expect(projectBRows).toHaveLength(1);
    expect(projectBRows[0]?.rootIssueId).toBe(ROOT_BLOCKED);

    const reviewRows = applyCompanyFlowFilters(snapshot, {
      ...EMPTY_FILTERS,
      canonicalStatus: "in_review"
    });
    expect(reviewRows).toHaveLength(1);
    expect(reviewRows[0]?.rootIssueId).toBe(ROOT_REVIEW);

    const blockedAttention = applyCompanyFlowFilters(snapshot, {
      ...EMPTY_FILTERS,
      attentionReason: "blocked"
    });
    expect(blockedAttention.map((row) => row.rootIssueId)).toEqual([ROOT_BLOCKED]);

    const textRows = applyCompanyFlowFilters(snapshot, { ...EMPTY_FILTERS, text: "LF-REV" });
    expect(textRows).toHaveLength(1);
  });

  it("does not infer project filter from URL — null shows all projects", () => {
    const snapshot = baseCompanyFlow();
    const rows = applyCompanyFlowFilters(snapshot, EMPTY_FILTERS);
    expect(rows).toHaveLength(3);
  });
});
