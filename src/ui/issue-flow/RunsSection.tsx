import type { RunFact } from "../../contracts/common.js";
import { card, muted, sectionTitle, stack, tableStyle, tdStyle, thStyle } from "../styles.js";
import { formatDurationMs, formatTimestamp } from "./format.js";

export function RunsSection({ runs }: { runs: RunFact[] }) {
  if (runs.length === 0) {
    return (
      <section aria-labelledby="lf-runs-heading" style={stack}>
        <h2 id="lf-runs-heading" style={sectionTitle}>
          Run history
        </h2>
        <p style={{ ...muted, margin: 0 }}>No runs recorded for this issue subtree.</p>
      </section>
    );
  }

  const sorted = [...runs].sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));

  return (
    <section aria-labelledby="lf-runs-heading" style={stack}>
      <h2 id="lf-runs-heading" style={sectionTitle}>
        Run history
      </h2>
      <div style={{ ...card, overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th scope="col" style={thStyle}>
                Status
              </th>
              <th scope="col" style={thStyle}>
                Duration
              </th>
              <th scope="col" style={thStyle}>
                Invocation
              </th>
              <th scope="col" style={thStyle}>
                Started
              </th>
              <th scope="col" style={thStyle}>
                Finished
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((run) => {
              const duration = formatDurationMs(run.startedAt, run.finishedAt);
              const statusLabel = `Run ${run.status}${run.status === "failed" ? " (distinct from blocked issue status)" : ""}`;
              return (
                <tr key={run.id}>
                  <td style={tdStyle}>
                    <span aria-label={statusLabel}>{run.status}</span>
                  </td>
                  <td style={tdStyle}>{duration ?? "—"}</td>
                  <td style={tdStyle}>{run.invocationSource ?? "—"}</td>
                  <td style={tdStyle}>{formatTimestamp(run.startedAt)}</td>
                  <td style={tdStyle}>{formatTimestamp(run.finishedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
