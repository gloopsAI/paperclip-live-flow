import { Spinner } from "@paperclipai/plugin-sdk/ui";
import type { CompanyFlowResponse } from "../../contracts/company-flow.js";
import { card, disclosureButton, muted, row, sectionTitle, stack } from "../styles.js";
import { formatTimestamp } from "./format.js";

export function SituationStrip({
  snapshot,
  onRefresh,
  refreshing
}: {
  snapshot: CompanyFlowResponse | null;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const counts = snapshot?.counts;
  const fetchedAt = snapshot?.freshness.fetchedAt ?? null;

  return (
    <section aria-labelledby="lf-situation-heading" style={stack}>
      <div style={{ ...row, justifyContent: "space-between" }}>
        <h2 id="lf-situation-heading" style={sectionTitle}>
          Situation
        </h2>
        <button
          type="button"
          style={disclosureButton}
          onClick={onRefresh}
          aria-label="Refresh Live Flow"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div style={card} aria-live="polite">
        {counts ? (
          <dl style={{ ...row, margin: 0, fontSize: "13px" }}>
            <div>
              <dt style={{ ...muted, display: "inline" }}>Active: </dt>
              <dd style={{ display: "inline", margin: 0 }}>{counts.active}</dd>
            </div>
            <div>
              <dt style={{ ...muted, display: "inline" }}>Blocked: </dt>
              <dd style={{ display: "inline", margin: 0 }}>{counts.blocked}</dd>
            </div>
            <div>
              <dt style={{ ...muted, display: "inline" }}>In review: </dt>
              <dd style={{ display: "inline", margin: 0 }}>{counts.inReview}</dd>
            </div>
            <div>
              <dt style={{ ...muted, display: "inline" }}>Failed latest runs: </dt>
              <dd style={{ display: "inline", margin: 0 }}>{counts.failedRuns}</dd>
            </div>
          </dl>
        ) : (
          <p style={{ margin: 0 }}>Counts unavailable until data loads.</p>
        )}
        <p style={{ ...muted, margin: "8px 0 0" }}>
          Snapshot: {formatTimestamp(fetchedAt)}
          {snapshot?.freshness.stale ? " · stale" : ""}
          {snapshot?.freshness.partial ? " · partial" : ""}
        </p>
        {refreshing ? <Spinner label="Refreshing company flow" /> : null}
      </div>
    </section>
  );
}
