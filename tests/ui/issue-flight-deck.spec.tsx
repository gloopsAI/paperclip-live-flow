import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within, fireEvent } from "@testing-library/react";
import { IssueDetailTab, TaskDetailView } from "../../src/ui/issue-flow/IssueSurfaces.js";
import { ISSUE_FLOW_HANDLER } from "../../src/ui/constants.js";
import { CONTEXT_WINDOW_UTILIZATION_MESSAGE } from "../../src/contracts/common.js";
import {
  activeBuildFlow,
  blockedRelationFlow,
  changesRequestedFlow,
  doneWithoutMergeDeployFlow,
  failedRunFlow,
  incompatibleSdkFlow,
  partialStaleFlow,
  invocationBlockedFlow,
  orchestrationUnavailableFlow,
  pendingReviewFlow
} from "./fixtures/issue-flow.js";
import { mockUsePluginData, resetPluginMocks, setPluginDataState } from "./setup.js";
import { issueTabContext, renderIssueUi } from "./test-utils.js";

describe("Issue Delivery Flight Deck UI", () => {
  beforeEach(() => {
    resetPluginMocks();
  });

  it("loads active build with run, agent context, and semantic landmarks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-03T12:05:00.000Z"));
    try {
      setPluginDataState({ data: activeBuildFlow, loading: false, error: null });
      renderIssueUi(<IssueDetailTab {...issueTabContext()} />);

      expect(screen.getByRole("article", { name: /delivery flight deck/i })).toBeTruthy();
      expect(screen.getByRole("heading", { name: /issue identity/i })).toBeTruthy();
      expect(screen.getByText("Root delivery issue")).toBeTruthy();
      expect(screen.getByLabelText(/status: in progress/i)).toBeTruthy();
      expect(screen.getByRole("table", { name: undefined })).toBeTruthy();
      expect(screen.getByText("checkout")).toBeTruthy();
      expect(mockUsePluginData).toHaveBeenCalledWith(ISSUE_FLOW_HANDLER, {
        issueId: activeBuildFlow.issueId
      });

      const identitySection = screen
        .getByRole("heading", { name: /issue identity/i })
        .closest("section");
      expect(identitySection).toBeTruthy();
      expect(within(identitySection!).getByText("Worker")).toBeTruthy();

      const executionSection = screen
        .getByRole("heading", { name: /execution policy and state/i })
        .closest("section");
      expect(executionSection).toBeTruthy();
      expect(within(executionSection!).getByText("Worker")).toBeTruthy();

      const runsSection = screen.getByRole("heading", { name: /run history/i }).closest("section");
      expect(runsSection).toBeTruthy();
      const runsScope = within(runsSection!);
      expect(runsScope.getByLabelText(/^Run running$/i)).toBeTruthy();
      expect(runsScope.getByText("5m 0s")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows pending review participant and approval summaries from execution facts", () => {
    setPluginDataState({ data: pendingReviewFlow, loading: false, error: null });
    renderIssueUi(<IssueDetailTab {...issueTabContext()} />);

    expect(screen.getByText("Reviewer Agent")).toBeTruthy();
    expect(screen.getByText(/Completed stage ids/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /approvals/i })).toBeTruthy();
    expect(screen.getByText("pending")).toBeTruthy();
    expect(screen.getByText("user-reviewer-1")).toBeTruthy();
  });

  it("shows changes requested count and decision outcome from execution state facts", () => {
    setPluginDataState({ data: changesRequestedFlow, loading: false, error: null });
    renderIssueUi(<IssueDetailTab {...issueTabContext()} />);

    expect(screen.getByText("changes_requested")).toBeTruthy();
    expect(screen.getByText(/Changes requested count/i)).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("renders blocked relation links through host navigation props", () => {
    setPluginDataState({ data: blockedRelationFlow, loading: false, error: null });
    renderIssueUi(<IssueDetailTab {...issueTabContext()} />);

    const blockerLink = screen.getByRole("link", { name: /blocked by LF-BLOCKER/i });
    expect(blockerLink.getAttribute("href")).toBe("/issues/LF-BLOCKER");
    fireEvent.click(blockerLink);
    expect(screen.getByLabelText(/status: blocked/i)).toBeTruthy();
  });

  it("distinguishes failed run attention from blocked issue status", () => {
    setPluginDataState({ data: failedRunFlow, loading: false, error: null });
    renderIssueUi(<IssueDetailTab {...issueTabContext()} />);

    expect(screen.getByLabelText(/status: in progress/i)).toBeTruthy();
    expect(screen.getByText(/Latest agent run failed with worker error/i)).toBeTruthy();
    expect(
      screen.getByLabelText(/Run failed \(distinct from blocked issue status\)/i)
    ).toBeTruthy();
  });

  it("shows done issue with merge/deploy not tracked and missing work products copy", () => {
    setPluginDataState({ data: doneWithoutMergeDeployFlow, loading: false, error: null });
    renderIssueUi(<IssueDetailTab {...issueTabContext()} />);

    expect(screen.getByLabelText(/status: done/i)).toBeTruthy();
    expect(screen.getAllByText(/Not tracked/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Merge and deploy evidence/i)).toBeTruthy();
    expect(screen.getByText(/workProducts, deployReceipts/i)).toBeTruthy();
  });

  it("shows incompatible SDK banner and unavailable token fields", () => {
    setPluginDataState({ data: incompatibleSdkFlow, loading: false, error: null });
    renderIssueUi(<IssueDetailTab {...issueTabContext()} />);

    expect(screen.getByText(/Installed SDK is missing orchestration cost fields/i)).toBeTruthy();
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThanOrEqual(4);
  });

  it("shows partial, stale, and source error banners without crashing", () => {
    setPluginDataState({ data: partialStaleFlow, loading: false, error: null });
    renderIssueUi(<IssueDetailTab {...issueTabContext()} />);

    expect(screen.getByText(/Background refresh failed/i)).toBeTruthy();
    expect(screen.getByText(/Partial data/i)).toBeTruthy();
    expect(screen.getByText(/agents.get: Agent lookup timed out/i)).toBeTruthy();
  });

  it("shows loading, permission, not-found, and worker error panels", () => {
    setPluginDataState({ data: null, loading: true, error: null });
    const { rerender } = renderIssueUi(<IssueDetailTab {...issueTabContext()} />);
    expect(
      screen.getByRole("region", { name: /loading issue delivery flight deck/i })
    ).toBeTruthy();

    setPluginDataState({
      data: null,
      loading: false,
      error: { code: "CAPABILITY_DENIED", message: "Missing issues.read" }
    });
    rerender(<IssueDetailTab {...issueTabContext()} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(/Permission denied/i)).toBeTruthy();

    setPluginDataState({
      data: null,
      loading: false,
      error: { code: "WORKER_ERROR", message: "Not found" }
    });
    rerender(<IssueDetailTab {...issueTabContext()} />);
    expect(screen.getByText(/Issue not found/i)).toBeTruthy();

    setPluginDataState({
      data: null,
      loading: false,
      error: { code: "WORKER_ERROR", message: "Unexpected worker failure" }
    });
    rerender(<IssueDetailTab {...issueTabContext()} />);
    expect(screen.getByText(/Unable to load issue flow/i)).toBeTruthy();
  });

  it("shows explicit context-window-unavailable sentence and token field distinctions", () => {
    setPluginDataState({ data: activeBuildFlow, loading: false, error: null });
    renderIssueUi(<IssueDetailTab {...issueTabContext()} />);

    expect(screen.getByText(CONTEXT_WINDOW_UTILIZATION_MESSAGE)).toBeTruthy();
    const tokenSection = screen
      .getByRole("heading", { name: /token and cost facts/i })
      .closest("section");
    expect(tokenSection).toBeTruthy();
    const scoped = within(tokenSection!);
    expect(scoped.getByText("1,200")).toBeTruthy();
    expect(scoped.getByText("300")).toBeTruthy();
    expect(scoped.getByText("450")).toBeTruthy();
    expect(scoped.getByText("$0.42")).toBeTruthy();
  });

  it("shows invocation block scope and reason from orchestration facts", () => {
    setPluginDataState({ data: invocationBlockedFlow, loading: false, error: null });
    renderIssueUi(<IssueDetailTab {...issueTabContext()} />);

    expect(screen.getByRole("heading", { name: /invocation blocks/i })).toBeTruthy();
    expect(screen.getByText("Invocation blocked by policy")).toBeTruthy();
    expect(screen.getByText("agent")).toBeTruthy();
  });

  it("keeps issue execution facts while marking orchestration approvals/blocks unavailable", () => {
    setPluginDataState({ data: orchestrationUnavailableFlow, loading: false, error: null });
    renderIssueUi(<IssueDetailTab {...issueTabContext()} />);

    expect(screen.getAllByText(/Collection availability: Unavailable/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Approval summaries are unavailable/i)).toBeTruthy();
    expect(screen.getByText(/Invocation block summaries are unavailable/i)).toBeTruthy();
    expect(screen.getByText(/Current stage type/i)).toBeTruthy();
  });

  it("uses execution state for compact task view stage and participant", () => {
    setPluginDataState({ data: pendingReviewFlow, loading: false, error: null });
    renderIssueUi(<TaskDetailView {...issueTabContext()} />);

    expect(screen.getByText(/Current stage:/)).toBeTruthy();
    expect(screen.getByText("review")).toBeTruthy();
    expect(screen.getByText(/Current participant:/)).toBeTruthy();
    expect(screen.getByText("Reviewer Agent")).toBeTruthy();
  });

  it("shows host navigation tab link in task view", () => {
    setPluginDataState({ data: activeBuildFlow, loading: false, error: null });
    renderIssueUi(<TaskDetailView {...issueTabContext()} />);

    const tabLink = screen.getByRole("link", { name: /open full delivery flight deck tab/i });
    expect(tabLink.getAttribute("href")).toContain(
      "tab=plugin:gloops.live-flow:live-flow-issue-tab"
    );
    tabLink.focus();
    expect(document.activeElement).toBe(tabLink);
  });

  it("exposes keyboard-focusable provenance disclosure", () => {
    setPluginDataState({ data: pendingReviewFlow, loading: false, error: null });
    renderIssueUi(<IssueDetailTab {...issueTabContext()} />);
    const provenance = screen.getAllByText("Provenance")[0];
    expect(provenance.tagName.toLowerCase()).toBe("summary");
    provenance.focus();
    expect(document.activeElement).toBe(provenance);
  });

  it("renders compact task detail view with blocker count and latest run", () => {
    setPluginDataState({ data: blockedRelationFlow, loading: false, error: null });
    renderIssueUi(<TaskDetailView {...issueTabContext()} />);

    expect(screen.getByRole("heading", { name: /live flow/i })).toBeTruthy();
    expect(screen.getByText(/Blockers:/)).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText(/Latest run:/)).toBeTruthy();
  });
});

import { createTestHarness } from "@paperclipai/plugin-sdk/testing";

describe("Issue UI harness gap note", () => {
  it("documents that upstream plugin-sdk testing harness lacks external plugin UI render entry", async () => {
    expect(createTestHarness).toBeTypeOf("function");
    const testingModule = await import("@paperclipai/plugin-sdk/testing");
    const exports = Object.keys(testingModule);
    expect(exports.some((name) => /render|mount|ui/i.test(name))).toBe(false);
  });
});
