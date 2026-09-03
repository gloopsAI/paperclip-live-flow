import {
  useHostNavigation,
  type PluginPageProps,
  type PluginProjectSidebarItemProps,
  type PluginSidebarProps
} from "@paperclipai/plugin-sdk/ui";
import { useEffect, useMemo, useState } from "react";
import type { CompanyFlowResponse } from "../../contracts/company-flow.js";
import { useCompanyFlowData } from "../hooks/useCompanyFlowData.js";
import { useProjectFilterFromLocation } from "../hooks/useProjectFilterFromLocation.js";
import { card, linkStyle, muted, pageShell, responsiveGrid, stack } from "../styles.js";
import { ActiveFlowTable } from "./ActiveFlowTable.js";
import { AttentionLane } from "./AttentionLane.js";
import { CompanyFreshnessBanners } from "./CompanyFreshnessBanners.js";
import { FilterBar } from "./FilterBar.js";
import { SituationStrip } from "./SituationStrip.js";
import {
  EMPTY_FILTERS,
  applyCompanyFlowFilters,
  collectFilterOptions,
  type CompanyFlowFilters
} from "./filters.js";
import { companyPagePath } from "./format.js";
import { RetainedDataWarning } from "./RetainedDataWarning.js";

function CompanyStatePanels({
  loading,
  error,
  data
}: {
  loading: boolean;
  error: { message: string; code?: string } | null;
  data: CompanyFlowResponse | null;
}) {
  if (loading && !data) {
    return (
      <section aria-busy="true" aria-live="polite" style={card}>
        <p style={{ margin: 0 }}>Loading company Live Flow snapshot…</p>
      </section>
    );
  }
  if (error && !data) {
    return (
      <section role="alert" style={card}>
        <h2 style={{ margin: "0 0 6px", fontSize: "15px" }}>Unable to load Live Flow</h2>
        <p style={{ margin: 0 }}>{error.message}</p>
      </section>
    );
  }
  if (!data) {
    return (
      <section style={card}>
        <p style={{ margin: 0 }}>Live Flow snapshot is empty.</p>
      </section>
    );
  }
  return null;
}

export function CompanyPage(_props: PluginPageProps) {
  const { data, loading, error, refresh } = useCompanyFlowData();
  const urlProjectId = useProjectFilterFromLocation();
  const [filters, setFilters] = useState<CompanyFlowFilters>(() => ({
    ...EMPTY_FILTERS,
    projectId: urlProjectId
  }));

  useEffect(() => {
    setFilters((previous) => ({ ...previous, projectId: urlProjectId }));
  }, [urlProjectId]);

  const snapshot = data;
  const panel = CompanyStatePanels({ loading, error, data: snapshot });
  const filterOptions = useMemo(
    () =>
      snapshot ? collectFilterOptions(snapshot) : { projects: new Map(), assignees: new Map() },
    [snapshot]
  );

  const filteredRows = useMemo(() => {
    if (!snapshot) return [];
    return applyCompanyFlowFilters(snapshot, filters);
  }, [snapshot, filters]);

  const activeRootIds = useMemo(
    () => new Set((snapshot?.roots ?? []).map((row) => row.rootIssueId)),
    [snapshot]
  );

  if (panel) {
    return (
      <main aria-labelledby="lf-company-page-title" style={pageShell} className="lf-company-page">
        <header>
          <h1 id="lf-company-page-title" style={{ margin: 0, fontSize: "20px" }}>
            Live Flow
          </h1>
          <p style={{ ...muted, margin: "4px 0 0" }}>Company delivery flight deck</p>
        </header>
        {panel}
      </main>
    );
  }

  const flow = snapshot!;

  return (
    <main
      aria-labelledby="lf-company-page-title"
      style={pageShell}
      className="lf-company-page lf-reduced-motion-safe"
    >
      <header>
        <h1 id="lf-company-page-title" style={{ margin: 0, fontSize: "20px" }}>
          Live Flow
        </h1>
        <p style={{ ...muted, margin: "4px 0 0" }}>Company delivery flight deck</p>
      </header>

      <CompanyFreshnessBanners freshness={flow.freshness} sourceErrors={flow.sourceErrors} />
      {error ? <RetainedDataWarning message={error.message} /> : null}
      <SituationStrip snapshot={flow} onRefresh={refresh} refreshing={loading} />
      <FilterBar
        filters={filters}
        onChange={setFilters}
        projectOptions={[...filterOptions.projects.entries()]}
        assigneeOptions={[...filterOptions.assignees.entries()]}
        resultCount={filteredRows.length}
        totalCount={flow.roots.length}
      />
      <div style={responsiveGrid}>
        <section aria-labelledby="lf-active-flow-heading" style={stack}>
          <h2 id="lf-active-flow-heading" style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
            Active flow
          </h2>
          <ActiveFlowTable rows={filteredRows} />
        </section>
        <AttentionLane
          attention={flow.attention}
          companyIncidents={flow.companyIncidents}
          scopeUnavailableIncidents={flow.scopeUnavailableIncidents}
          activeRootIds={activeRootIds}
        />
      </div>
    </main>
  );
}

export function SidebarLink(_props: PluginSidebarProps) {
  const hostNavigation = useHostNavigation();
  return (
    <a
      {...hostNavigation.linkProps("/live-flow")}
      aria-label="Open Live Flow company page"
      style={{
        ...linkStyle,
        display: "block",
        padding: "8px 12px",
        fontSize: "13px",
        fontWeight: 600
      }}
    >
      Live Flow
    </a>
  );
}

export function ProjectSidebarItem({ context }: PluginProjectSidebarItemProps) {
  const hostNavigation = useHostNavigation();
  return (
    <a
      {...hostNavigation.linkProps(companyPagePath(context.entityId))}
      aria-label="Open Live Flow filtered to this project"
      style={{ ...linkStyle, display: "block", fontSize: "12px", padding: "4px 0" }}
    >
      Live Flow
    </a>
  );
}
