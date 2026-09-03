import { Spinner, useHostNavigation } from "@paperclipai/plugin-sdk/ui";
import type { PluginWidgetProps } from "@paperclipai/plugin-sdk/ui";
import { useDashboardSummaryData } from "../hooks/useDashboardSummaryData.js";
import { RetainedDataWarning } from "../company-flow/RetainedDataWarning.js";
import { COMPANY_PAGE_ROUTE } from "../constants.js";
import { card, linkStyle, muted, stack } from "../styles.js";
import { attentionReasonLabel } from "../issue-flow/status.js";

function countLabel(value: number | undefined): string {
  return value === undefined ? "—" : String(value);
}

export function DashboardWidget(_props: PluginWidgetProps) {
  const { data, loading, error } = useDashboardSummaryData();
  const hostNavigation = useHostNavigation();

  if (loading && !data) {
    return (
      <div style={stack} aria-busy="true" aria-live="polite">
        <strong>Live Flow</strong>
        <Spinner label="Loading Live Flow summary" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={stack} role="alert">
        <strong>Live Flow</strong>
        <span>{error.message}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={stack} role="status">
        <strong>Live Flow</strong>
        <span style={muted}>Summary unavailable</span>
      </div>
    );
  }

  const counts = data.counts;
  return (
    <div style={{ ...stack, ...card }} aria-label="Live Flow dashboard summary">
      <strong>Live Flow</strong>
      {error ? <RetainedDataWarning message={error.message} /> : null}
      <dl style={{ margin: 0, fontSize: "13px", display: "grid", gap: "4px" }}>
        <div>
          <dt style={{ ...muted, display: "inline" }}>Active roots: </dt>
          <dd style={{ display: "inline", margin: 0 }}>{countLabel(counts?.active)}</dd>
        </div>
        <div>
          <dt style={{ ...muted, display: "inline" }}>Blocked: </dt>
          <dd style={{ display: "inline", margin: 0 }}>{countLabel(counts?.blocked)}</dd>
        </div>
        <div>
          <dt style={{ ...muted, display: "inline" }}>In review: </dt>
          <dd style={{ display: "inline", margin: 0 }}>{countLabel(counts?.inReview)}</dd>
        </div>
      </dl>
      {data.topAttention.length > 0 ? (
        <ul style={{ margin: "8px 0 0", paddingLeft: "18px", fontSize: "12px" }}>
          {data.topAttention.slice(0, 3).map((item) => (
            <li key={`${item.issueId}:${item.reason}`}>
              {attentionReasonLabel(item.reason)} — {item.title}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ ...muted, margin: "8px 0 0" }}>No attention items.</p>
      )}
      <a
        {...hostNavigation.linkProps(`/${COMPANY_PAGE_ROUTE}`)}
        style={{ ...linkStyle, marginTop: "8px", display: "inline-block" }}
      >
        Open Live Flow
      </a>
    </div>
  );
}
