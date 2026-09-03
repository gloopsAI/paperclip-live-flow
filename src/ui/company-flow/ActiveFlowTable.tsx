import { useHostNavigation } from "@paperclipai/plugin-sdk/ui";
import type { CompanyFlowRootRow } from "../../contracts/company-flow.js";
import { card, linkStyle, muted, tdStyle, thStyle, tableStyle } from "../styles.js";
import { StatusLabel } from "../issue-flow/StatusLabel.js";
import {
  formatElapsedMs,
  issueDeepLinkPath,
  runSummary,
  tokenCostLabel,
  blockerCountLabel
} from "./format.js";

export function RootRow({ row }: { row: CompanyFlowRootRow }) {
  const hostNavigation = useHostNavigation();
  const issueHref = issueDeepLinkPath(row.identifier, row.deepLinkIssueId);

  return (
    <tr>
      <td style={tdStyle}>
        <a {...hostNavigation.linkProps(issueHref)} style={linkStyle}>
          {row.identifier ?? row.rootIssueId}
        </a>
        <div style={{ fontWeight: 600 }}>{row.title || "Unavailable"}</div>
        {row.rowError ? (
          <p style={{ ...muted, margin: "4px 0 0" }} role="note">
            {row.rowError.message}
          </p>
        ) : null}
      </td>
      <td style={tdStyle}>{row.projectName ?? row.projectId ?? "—"}</td>
      <td style={tdStyle}>{row.assigneeLabel ?? row.assigneeAgentId ?? "Unassigned"}</td>
      <td style={tdStyle}>
        {row.canonicalStatus ? (
          <StatusLabel status={row.canonicalStatus} />
        ) : (
          <span aria-label="Status unavailable">Unavailable</span>
        )}
      </td>
      <td style={tdStyle}>{row.currentStageType ?? "—"}</td>
      <td style={tdStyle}>{row.currentParticipantId ?? "—"}</td>
      <td style={tdStyle}>{blockerCountLabel(row.blockerCount, row.orchestrationAvailability)}</td>
      <td style={tdStyle}>{runSummary(row.latestRun, row.orchestrationAvailability)}</td>
      <td style={tdStyle}>{formatElapsedMs(row.elapsedMs, row.orchestrationAvailability)}</td>
      <td style={tdStyle}>
        {tokenCostLabel(
          row.tokenCost.availability,
          row.tokenCost.inputTokens,
          row.tokenCost.costCents
        )}
      </td>
    </tr>
  );
}

export function ActiveFlowTable({ rows }: { rows: CompanyFlowRootRow[] }) {
  if (rows.length === 0) {
    return <p style={{ ...muted, margin: 0 }}>No active roots match the current filters.</p>;
  }

  return (
    <div style={{ ...card, overflowX: "auto" }}>
      <table style={tableStyle} aria-label="Active flow roots">
        <thead>
          <tr>
            <th scope="col" style={thStyle}>
              Issue
            </th>
            <th scope="col" style={thStyle}>
              Project
            </th>
            <th scope="col" style={thStyle}>
              Assignee
            </th>
            <th scope="col" style={thStyle}>
              Status
            </th>
            <th scope="col" style={thStyle}>
              Stage
            </th>
            <th scope="col" style={thStyle}>
              Participant
            </th>
            <th scope="col" style={thStyle}>
              Blockers
            </th>
            <th scope="col" style={thStyle}>
              Latest run
            </th>
            <th scope="col" style={thStyle}>
              Elapsed
            </th>
            <th scope="col" style={thStyle}>
              Token/cost
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <RootRow key={row.rootIssueId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
