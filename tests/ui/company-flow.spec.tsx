import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import {
  CompanyPage,
  ProjectSidebarItem,
  SidebarLink
} from "../../src/ui/company-flow/CompanySurfaces.js";
import { DashboardWidget } from "../../src/ui/dashboard/DashboardWidget.js";
import { COMPANY_FLOW_HANDLER, DASHBOARD_SUMMARY_HANDLER } from "../../src/ui/constants.js";
import {
  companySnapshot,
  dashboardSnapshot,
  partialCompanySnapshot,
  COMPANY_ID,
  PROJECT_B
} from "./fixtures/company-flow.js";
import {
  mockRefresh,
  mockUseHostLocation,
  mockUsePluginData,
  resetPluginMocks,
  setPluginDataState
} from "./setup.js";
import { renderIssueUi } from "./test-utils.js";

describe("Company Live Flow UI", () => {
  beforeEach(() => {
    resetPluginMocks();
    mockUseHostLocation.mockReturnValue({ pathname: "/live-flow", search: "", hash: "" });
  });

  it("loads company page with situation strip, rows, and attention lane", () => {
    setPluginDataState({ data: companySnapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );

    expect(screen.getByRole("heading", { name: /^Live Flow$/i, level: 1 })).toBeTruthy();
    expect(screen.getByText("Active:")).toBeTruthy();
    expect(screen.getByText("Failed latest runs:")).toBeTruthy();
    expect(screen.getByRole("table", { name: /active flow roots/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /attention lane/i })).toBeTruthy();
    expect(mockUsePluginData.mock.calls[0]?.[0]).toBe(COMPANY_FLOW_HANDLER);
    expect(mockUsePluginData.mock.calls[0]?.[1]).toBeUndefined();
  });

  it("filters roots client-side and shows result count", () => {
    setPluginDataState({ data: companySnapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Project"), { target: { value: PROJECT_B } });
    expect(screen.getByText(/Showing 1 of 3 loaded roots/i)).toBeTruthy();
    const table = screen.getByRole("table", { name: /active flow roots/i });
    expect(within(table).getByText("LF-BLK")).toBeTruthy();
  });

  it("shows partial and stale banners without crashing", () => {
    setPluginDataState({ data: partialCompanySnapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    expect(screen.getByText(/Refresh degraded/i)).toBeTruthy();
    expect(screen.getByText(/Partial data/i)).toBeTruthy();
  });

  it("manual refresh calls usePluginData refresh", () => {
    setPluginDataState({ data: companySnapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /refresh live flow/i }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("renders sidebar and project deep links via host navigation", () => {
    renderIssueUi(
      <SidebarLink
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    const sidebarLink = screen.getByRole("link", { name: /open live flow company page/i });
    expect(sidebarLink.getAttribute("href")).toBe("/live-flow");

    renderIssueUi(
      <ProjectSidebarItem
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: PROJECT_B,
          entityId: PROJECT_B,
          entityType: "project",
          userId: "u1"
        }}
      />
    );
    const projectLink = screen.getByRole("link", { name: /filtered to this project/i });
    expect(projectLink.getAttribute("href")).toContain(
      `projectId=${encodeURIComponent(PROJECT_B)}`
    );
  });

  it("initializes project filter from host location search params", () => {
    mockUseHostLocation.mockReturnValue({
      pathname: "/live-flow",
      search: `?projectId=${PROJECT_B}`,
      hash: ""
    });
    setPluginDataState({ data: companySnapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    expect(screen.getByText(/Showing 1 of 3 loaded roots/i)).toBeTruthy();
  });

  it("shows status unavailable for null canonical status rows", () => {
    const snapshot = {
      ...companySnapshot,
      roots: [{ ...companySnapshot.roots[0], canonicalStatus: null }]
    };
    setPluginDataState({ data: snapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    expect(screen.getByLabelText("Status unavailable")).toBeTruthy();
  });

  it("allows clearing project filter while URL projectId remains", () => {
    mockUseHostLocation.mockReturnValue({
      pathname: "/live-flow",
      search: `?projectId=${PROJECT_B}`,
      hash: ""
    });
    setPluginDataState({ data: companySnapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    expect(screen.getByText(/Showing 1 of 3 loaded roots/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Project"), { target: { value: "" } });
    expect(screen.getByText(/Showing 3 of 3 loaded roots/i)).toBeTruthy();
  });

  it("renders attention issue links with host navigation", () => {
    setPluginDataState({ data: companySnapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    const lane = screen.getByRole("heading", { name: /attention lane/i }).closest("section");
    const attentionLink = within(lane!).getByText("Blocked by dependency").closest("li")!;
    const link = within(attentionLink).getByRole("link", { name: /open issue lf-blk/i });
    expect(link.getAttribute("href")).toBe("/issues/LF-BLK");
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it("shows retained-data error while rendering the last snapshot", () => {
    setPluginDataState({
      data: companySnapshot,
      loading: false,
      error: { code: "refresh_failed", message: "Network timeout" }
    });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(/Network timeout/i)).toBeTruthy();
    expect(screen.getByRole("table", { name: /active flow roots/i })).toBeTruthy();
  });

  it("shows unavailable orchestration facts instead of zero blockers or None run", () => {
    const snapshot = {
      ...companySnapshot,
      roots: [
        {
          ...companySnapshot.roots[0],
          orchestrationAvailability: "unavailable" as const,
          blockerCount: null,
          latestRun: null,
          elapsedMs: null
        }
      ]
    };
    setPluginDataState({ data: snapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    const unavailableCells = screen.getAllByText("Unavailable");
    expect(unavailableCells.length).toBeGreaterThanOrEqual(3);
  });

  it("links root attention by issue UUID when identifier is null", () => {
    const rootWithoutIdentifier = "88888888-8888-8888-8888-888888888888";
    const snapshot = {
      ...companySnapshot,
      roots: [
        {
          ...companySnapshot.roots[0],
          rootIssueId: rootWithoutIdentifier,
          identifier: null,
          deepLinkIssueId: rootWithoutIdentifier
        }
      ],
      attention: [
        {
          issueId: rootWithoutIdentifier,
          rootIssueId: rootWithoutIdentifier,
          identifier: null,
          title: "Root without identifier",
          reason: "blocked" as const,
          explanation: "Blocked without identifier",
          source: []
        },
        {
          issueId: COMPANY_ID,
          rootIssueId: COMPANY_ID,
          identifier: null,
          title: "incident-company",
          reason: "budget_incident" as const,
          explanation: "Company budget incident",
          source: [{ kind: "budgetIncident", entityId: "incident-company", field: "status" }]
        }
      ],
      companyIncidents: [],
      scopeUnavailableIncidents: []
    };
    setPluginDataState({ data: snapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    const lane = screen.getByRole("heading", { name: /attention lane/i }).closest("section");
    const rootItem = within(lane!).getByText("Blocked without identifier").closest("li")!;
    const rootLink = within(rootItem).getByRole("link", {
      name: new RegExp(`open issue ${rootWithoutIdentifier}`, "i")
    });
    expect(rootLink.getAttribute("href")).toBe(`/issues/${rootWithoutIdentifier}`);
    expect(
      within(lane!).queryByRole("link", { name: new RegExp(`open issue ${COMPANY_ID}`, "i") })
    ).toBeNull();
    const companyItem = within(lane!).getByText("Company budget incident").closest("li")!;
    expect(within(companyItem).getByText(COMPANY_ID).tagName).toBe("SPAN");
  });

  it("lists company and scope-unavailable incidents once without company issue links", () => {
    setPluginDataState({ data: companySnapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    const lane = screen.getByRole("heading", { name: /attention lane/i }).closest("section");
    expect(within(lane!).getByText(/Company incidents/i)).toBeTruthy();
    expect(within(lane!).getByText(/Scope-unavailable incidents/i)).toBeTruthy();
    expect(within(lane!).queryByText("incident-company")).toBeNull();
    expect(within(lane!).getAllByText("incident-unresolved")).toHaveLength(1);
    expect(within(lane!).queryByRole("link", { name: /open issue incident-company/i })).toBeNull();
    expect(
      within(lane!).queryByRole("link", { name: new RegExp(`open issue ${COMPANY_ID}`, "i") })
    ).toBeNull();
    const rootBudgetItem = within(lane!).getByText("Root budget incident").closest("li")!;
    const rootIncidentLink = within(rootBudgetItem).getByRole("link", {
      name: /open issue lf-blk/i
    });
    expect(rootIncidentLink.getAttribute("href")).toBe("/issues/LF-BLK");
    expect(within(lane!).getByText(/Blocked by dependency/i)).toBeTruthy();
  });
});

describe("Dashboard widget", () => {
  beforeEach(() => resetPluginMocks());

  it("does not fabricate zero counts when snapshot is missing", () => {
    setPluginDataState({ data: null, loading: false, error: null });
    renderIssueUi(
      <DashboardWidget
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    expect(screen.getByText(/Summary unavailable/i)).toBeTruthy();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("shows top three attention items and Open Live Flow link", () => {
    setPluginDataState({ data: dashboardSnapshot, loading: false, error: null });
    renderIssueUi(
      <DashboardWidget
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    expect(mockUsePluginData).toHaveBeenCalledWith(DASHBOARD_SUMMARY_HANDLER, undefined);
    expect(screen.getAllByRole("listitem").length).toBeLessThanOrEqual(3);
    expect(screen.getByRole("link", { name: /open live flow/i }).getAttribute("href")).toBe(
      "/live-flow"
    );
  });

  it("discloses retained-data error on dashboard widget", () => {
    setPluginDataState({
      data: dashboardSnapshot,
      loading: false,
      error: { code: "refresh_failed", message: "Summary refresh failed" }
    });
    renderIssueUi(
      <DashboardWidget
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    expect(screen.getByText(/Summary refresh failed/i)).toBeTruthy();
    expect(screen.getByText(/Active roots:/i)).toBeTruthy();
  });
});

describe("foreground refresh hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetPluginMocks();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible"
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible"
    });
  });

  it("does not refresh on hidden timer ticks", () => {
    setPluginDataState({ data: companySnapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    mockRefresh.mockClear();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden"
    });
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(60_000);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("refreshes immediately when document becomes visible again", () => {
    setPluginDataState({ data: companySnapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    mockRefresh.mockClear();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden"
    });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible"
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("uses increasing bounded backoff across consecutive error cycles and resets on success", () => {
    setPluginDataState({
      data: companySnapshot,
      loading: false,
      error: { code: "err", message: "fail" }
    });
    const view = renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    mockRefresh.mockClear();
    vi.advanceTimersByTime(15_000);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    mockRefresh.mockClear();
    vi.advanceTimersByTime(15_000);
    expect(mockRefresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(15_000);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    mockRefresh.mockClear();
    vi.advanceTimersByTime(60_000);
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    setPluginDataState({ data: companySnapshot, loading: false, error: null });
    view.unmount();
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    mockRefresh.mockClear();
    vi.advanceTimersByTime(15_000);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("schedules refresh on manual trigger while visible", () => {
    setPluginDataState({ data: companySnapshot, loading: false, error: null });
    renderIssueUi(
      <CompanyPage
        context={{
          companyId: "co",
          companyPrefix: "co",
          projectId: null,
          entityId: null,
          entityType: null,
          userId: "u1"
        }}
      />
    );
    vi.advanceTimersByTime(15_000);
    expect(mockRefresh.mock.calls.length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /refresh live flow/i }));
    expect(mockRefresh.mock.calls.length).toBeGreaterThan(1);
  });
});
