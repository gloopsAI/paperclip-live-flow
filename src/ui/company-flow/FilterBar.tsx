import type { CanonicalIssueStatus } from "../../contracts/common.js";
import type { CompanyFlowFilters } from "./filters.js";
import { filterBar, controlStyle, muted, row, stack } from "../styles.js";

const STATUS_OPTIONS: Array<CanonicalIssueStatus | "any"> = [
  "any",
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "done",
  "cancelled"
];

const ATTENTION_OPTIONS = [
  "any",
  "blocked",
  "invocation_block",
  "budget_incident",
  "failed_run",
  "pending_review",
  "pending_approval",
  "changes_requested"
] as const;

export function FilterBar({
  filters,
  onChange,
  projectOptions,
  assigneeOptions,
  resultCount,
  totalCount
}: {
  filters: CompanyFlowFilters;
  onChange: (next: CompanyFlowFilters) => void;
  projectOptions: Array<[string, string]>;
  assigneeOptions: Array<[string, string]>;
  resultCount: number;
  totalCount: number;
}) {
  return (
    <section aria-labelledby="lf-filters-heading" style={stack}>
      <div style={row}>
        <h2 id="lf-filters-heading" style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
          Filters
        </h2>
        <p style={{ ...muted, margin: 0 }} aria-live="polite">
          Showing {resultCount} of {totalCount} loaded roots
        </p>
      </div>
      <div style={filterBar}>
        <label style={stack} htmlFor="lf-filter-project">
          <span style={muted}>Project</span>
          <select
            id="lf-filter-project"
            aria-label="Project"
            style={controlStyle}
            value={filters.projectId ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                projectId: event.target.value ? event.target.value : null
              })
            }
          >
            <option value="">All projects</option>
            {projectOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label style={stack} htmlFor="lf-filter-assignee">
          <span style={muted}>Assignee</span>
          <select
            id="lf-filter-assignee"
            aria-label="Assignee"
            style={controlStyle}
            value={filters.assigneeAgentId ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                assigneeAgentId: event.target.value ? event.target.value : null
              })
            }
          >
            <option value="">All assignees</option>
            {assigneeOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label style={stack} htmlFor="lf-filter-status">
          <span style={muted}>Status</span>
          <select
            id="lf-filter-status"
            aria-label="Status"
            style={controlStyle}
            value={filters.canonicalStatus}
            onChange={(event) =>
              onChange({
                ...filters,
                canonicalStatus: event.target.value as CompanyFlowFilters["canonicalStatus"]
              })
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "any" ? "Any status" : status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label style={stack} htmlFor="lf-filter-attention">
          <span style={muted}>Attention</span>
          <select
            id="lf-filter-attention"
            aria-label="Attention"
            style={controlStyle}
            value={filters.attentionReason}
            onChange={(event) => onChange({ ...filters, attentionReason: event.target.value })}
          >
            {ATTENTION_OPTIONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason === "any" ? "Any attention" : reason.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label style={stack} htmlFor="lf-filter-search">
          <span style={muted}>Search</span>
          <input
            id="lf-filter-search"
            aria-label="Search"
            style={controlStyle}
            type="search"
            value={filters.text}
            onChange={(event) => onChange({ ...filters, text: event.target.value })}
            placeholder="Identifier or title"
          />
        </label>
      </div>
    </section>
  );
}
