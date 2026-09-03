import { KeyValueList, useHostNavigation } from "@paperclipai/plugin-sdk/ui";
import type { PluginDetailTabProps } from "@paperclipai/plugin-sdk/ui";
import type { IssueFlowResponse } from "../../contracts/issue-flow.js";
import { card, linkStyle, muted, row, sectionTitle, stack } from "../styles.js";
import { ISSUE_DETAIL_TAB_SLOT_ID, PLUGIN_ID } from "../constants.js";
import { FreshnessBanners } from "./Banners.js";
import { BlockersSection } from "./BlockersSection.js";
import { formatTimestamp, issueTabPath } from "./format.js";
import { useIssueFlowData } from "./hooks.js";
import { PhaseRail } from "./PhaseRail.js";
import { RunsSection } from "./RunsSection.js";
import {
  ApprovalsSection,
  AttentionSection,
  DocumentsSection,
  ExecutionPolicyStateSection,
  IncidentsSection,
  InvocationBlocksSection,
  TokenCostSection,
  WorkProductsSection
} from "./Sections.js";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "./StatePanels.js";
import { StatusLabel } from "./StatusLabel.js";

function IssueIdentity({ flow }: { flow: IssueFlowResponse }) {
  const pairs = [
    { label: "Identifier", value: flow.identifier ?? "—" },
    { label: "Project", value: flow.projectName ?? flow.projectId ?? "—" },
    { label: "Assignee", value: flow.assigneeLabel ?? flow.assigneeAgentId ?? "Unassigned" },
    { label: "Created", value: formatTimestamp(flow.createdAt) },
    { label: "Updated", value: formatTimestamp(flow.updatedAt) }
  ];

  return (
    <section aria-labelledby="lf-identity-heading" style={stack}>
      <h2 id="lf-identity-heading" style={sectionTitle}>
        Issue identity
      </h2>
      <div style={card}>
        <div style={{ ...row, marginBottom: "10px" }}>
          <h3 style={{ margin: 0, fontSize: "16px" }}>{flow.title}</h3>
          <StatusLabel status={flow.canonicalStatus} />
        </div>
        <KeyValueList pairs={pairs} />
      </div>
    </section>
  );
}

function resolvePanelState(
  issueId: string | null | undefined,
  loading: boolean,
  error: { code: string; message: string } | null,
  data: IssueFlowResponse | null
) {
  if (!issueId) {
    return (
      <EmptyPanel
        title="No issue selected"
        description="Open an issue to view the Live Flow delivery flight deck."
      />
    );
  }
  if (loading && !data) {
    return <LoadingPanel label="Loading issue delivery flight deck" />;
  }
  if (error?.code === "CAPABILITY_DENIED" || error?.code === "INVOCATION_SCOPE_DENIED") {
    return <ErrorPanel title="Permission denied" description={error.message} code={error.code} />;
  }
  if (error) {
    const notFound = error.message === "Not found";
    return (
      <ErrorPanel
        title={notFound ? "Issue not found" : "Unable to load issue flow"}
        description={error.message}
        code={error.code}
      />
    );
  }
  if (!data) {
    return (
      <EmptyPanel
        title="Issue unavailable"
        description="Live Flow did not return data for this issue."
      />
    );
  }
  return null;
}

export function IssueDetailTab({ context }: PluginDetailTabProps) {
  const issueId = context.entityId;
  const { data, loading, error } = useIssueFlowData(issueId);
  const panel = resolvePanelState(issueId, loading, error, data);
  if (panel) return panel;

  const flow = data!;

  return (
    <article
      aria-labelledby="lf-flight-deck-title"
      style={{ ...stack, maxWidth: "960px" }}
      className="lf-flight-deck lf-reduced-motion-safe"
    >
      <header>
        <h1 id="lf-flight-deck-title" style={{ margin: "0 0 4px", fontSize: "18px" }}>
          Delivery Flight Deck
        </h1>
        <p style={{ ...muted, margin: 0 }}>Read-only issue orchestration view</p>
      </header>

      <FreshnessBanners flow={flow} />
      <IssueIdentity flow={flow} />
      <PhaseRail profile={flow.phaseProfile} phases={flow.phases} />
      <ExecutionPolicyStateSection
        executionPolicy={flow.executionPolicy}
        executionState={flow.executionState}
      />
      <ApprovalsSection orchestration={flow.orchestration} />
      <InvocationBlocksSection orchestration={flow.orchestration} />
      <BlockersSection blockers={flow.blockers} />
      <RunsSection runs={flow.runs} />
      <AttentionSection attention={flow.attention} />
      <IncidentsSection incidents={flow.incidents} />
      <TokenCostSection tokenCost={flow.tokenCost} />
      <DocumentsSection documents={flow.documents} />
      <WorkProductsSection missingFields={flow.compatibility.missingFields} />
    </article>
  );
}

/** Compact task detail surface with link to the full Live Flow tab. */
export function TaskDetailView({ context }: PluginDetailTabProps) {
  const issueId = context.entityId;
  const { data, loading, error } = useIssueFlowData(issueId);
  const hostNavigation = useHostNavigation();
  const panel = resolvePanelState(issueId, loading, error, data);
  if (panel) return panel;

  const flow = data!;
  const { executionState } = flow;
  const stageLabel =
    executionState.currentStageType ??
    executionState.currentStageId ??
    (executionState.availability === "not_available" ? "No native stage" : "No active stage");
  const participantLabel =
    executionState.currentParticipantLabel ??
    executionState.currentParticipantAgentId ??
    executionState.currentParticipantUserId ??
    "Unassigned";

  const latestRun = [...flow.runs].sort((a, b) =>
    (b.startedAt ?? "").localeCompare(a.startedAt ?? "")
  )[0];
  const tabPath = issueTabPath(flow.identifier, flow.issueId, PLUGIN_ID, ISSUE_DETAIL_TAB_SLOT_ID);

  return (
    <section
      aria-labelledby="lf-task-view-heading"
      style={{ ...stack }}
      className="lf-task-detail lf-reduced-motion-safe"
    >
      <div style={card}>
        <div style={row}>
          <h2 id="lf-task-view-heading" style={{ margin: 0, fontSize: "14px" }}>
            Live Flow
          </h2>
          <StatusLabel status={flow.canonicalStatus} />
        </div>
        <p style={{ margin: "8px 0 4px", fontWeight: 600 }}>
          {flow.identifier ? `${flow.identifier} · ` : ""}
          {flow.title}
        </p>
        <dl style={{ ...stack, margin: "8px 0", fontSize: "12px" }}>
          <div>
            <dt style={{ ...muted, display: "inline" }}>Owner: </dt>
            <dd style={{ display: "inline", margin: 0 }}>
              {flow.assigneeLabel ?? flow.assigneeAgentId ?? "Unassigned"}
            </dd>
          </div>
          <div>
            <dt style={{ ...muted, display: "inline" }}>Current stage: </dt>
            <dd style={{ display: "inline", margin: 0 }}>{stageLabel}</dd>
          </div>
          <div>
            <dt style={{ ...muted, display: "inline" }}>Current participant: </dt>
            <dd style={{ display: "inline", margin: 0 }}>{participantLabel}</dd>
          </div>
          <div>
            <dt style={{ ...muted, display: "inline" }}>Blockers: </dt>
            <dd style={{ display: "inline", margin: 0 }}>{flow.blockers.length}</dd>
          </div>
          <div>
            <dt style={{ ...muted, display: "inline" }}>Latest run: </dt>
            <dd style={{ display: "inline", margin: 0 }}>
              {latestRun
                ? `${latestRun.status}${latestRun.status === "failed" ? " (failed run)" : ""}`
                : "None"}
            </dd>
          </div>
        </dl>
        <a {...hostNavigation.linkProps(tabPath)} style={linkStyle}>
          Open full Delivery Flight Deck tab
        </a>
      </div>
      {(flow.freshness.partial || flow.freshness.stale || !flow.compatibility.compatible) && (
        <FreshnessBanners flow={flow} />
      )}
    </section>
  );
}
