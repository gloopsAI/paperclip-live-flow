import { usePluginData, type PluginWidgetProps } from "@paperclipai/plugin-sdk/ui";
import type { DashboardSummaryResponse } from "../contracts/dashboard-summary.js";
import { card, muted, stack } from "./styles.js";

export function DashboardWidget(_props: PluginWidgetProps) {
  const { data, loading, error } = usePluginData<DashboardSummaryResponse>("dashboard-summary");

  if (loading) {
    return (
      <div style={stack} aria-busy="true" aria-live="polite">
        <strong>Live Flow</strong>
        <span style={muted}>Loading summary…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={stack} role="alert">
        <strong>Live Flow</strong>
        <span>{error.message}</span>
      </div>
    );
  }

  const counts = data?.counts;
  return (
    <div style={{ ...stack, ...card }} aria-label="Live Flow dashboard summary">
      <strong>Live Flow</strong>
      <dl style={{ margin: 0, fontSize: "13px", display: "grid", gap: "4px" }}>
        <div>
          <dt style={{ ...muted, display: "inline" }}>Active roots: </dt>
          <dd style={{ display: "inline", margin: 0 }}>{counts?.active ?? 0}</dd>
        </div>
        <div>
          <dt style={{ ...muted, display: "inline" }}>Blocked: </dt>
          <dd style={{ display: "inline", margin: 0 }}>{counts?.blocked ?? 0}</dd>
        </div>
        <div>
          <dt style={{ ...muted, display: "inline" }}>In review: </dt>
          <dd style={{ display: "inline", margin: 0 }}>{counts?.inReview ?? 0}</dd>
        </div>
      </dl>
      {data?.topAttention?.length ? (
        <ul style={{ margin: "8px 0 0", paddingLeft: "18px", fontSize: "12px" }}>
          {data.topAttention.slice(0, 3).map((item) => (
            <li key={`${item.issueId}:${item.reason}`}>{item.title}</li>
          ))}
        </ul>
      ) : (
        <p style={{ ...muted, margin: "8px 0 0" }}>No attention items.</p>
      )}
    </div>
  );
}

export { IssueDetailTab, TaskDetailView } from "./issue-flow/IssueSurfaces.js";
