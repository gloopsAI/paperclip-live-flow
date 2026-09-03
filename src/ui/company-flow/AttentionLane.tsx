import { useHostNavigation } from "@paperclipai/plugin-sdk/ui";
import type { AttentionItem, IncidentFact } from "../../contracts/common.js";
import { card, linkStyle, muted, sectionTitle, stack } from "../styles.js";
import { attentionReasonLabel } from "../issue-flow/status.js";
import {
  attentionItemUsesIssueLink,
  attentionLinkLabel,
  filterDedicatedBudgetAttention
} from "./attention-display.js";
import { issueDeepLinkPath } from "./format.js";

function AttentionListItem({
  item,
  activeRootIds
}: {
  item: AttentionItem;
  activeRootIds: ReadonlySet<string>;
}) {
  const hostNavigation = useHostNavigation();
  const linkable = attentionItemUsesIssueLink(item, activeRootIds);
  const label = attentionLinkLabel(item);

  return (
    <li>
      <strong>{attentionReasonLabel(item.reason)}</strong> —{" "}
      {linkable ? (
        <a
          {...hostNavigation.linkProps(issueDeepLinkPath(item.identifier, item.issueId))}
          style={linkStyle}
          aria-label={`Open issue ${label}`}
        >
          {label}
        </a>
      ) : (
        <span>{label}</span>
      )}
      <div style={muted}>{item.explanation}</div>
    </li>
  );
}

export function AttentionLane({
  attention,
  companyIncidents,
  scopeUnavailableIncidents,
  activeRootIds
}: {
  attention: AttentionItem[];
  companyIncidents: IncidentFact[];
  scopeUnavailableIncidents: IncidentFact[];
  activeRootIds: ReadonlySet<string>;
}) {
  const visibleAttention = filterDedicatedBudgetAttention(
    attention,
    companyIncidents,
    scopeUnavailableIncidents
  );

  return (
    <section aria-labelledby="lf-attention-lane-heading" style={stack}>
      <h2 id="lf-attention-lane-heading" style={sectionTitle}>
        Attention lane
      </h2>
      <div style={card}>
        {visibleAttention.length === 0 ? (
          <p style={{ ...muted, margin: 0 }}>No attention items in the loaded snapshot.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "18px" }}>
            {visibleAttention.map((item) => (
              <AttentionListItem
                key={`${item.issueId}:${item.reason}:${item.explanation}`}
                item={item}
                activeRootIds={activeRootIds}
              />
            ))}
          </ul>
        )}
        {companyIncidents.length > 0 ? (
          <div style={{ marginTop: "12px" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "13px" }}>Company incidents</h3>
            <ul style={{ margin: 0, paddingLeft: "18px" }}>
              {companyIncidents.map((incident) => (
                <li key={incident.id}>
                  {incident.scopeType} {incident.scopeId} — {incident.status}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {scopeUnavailableIncidents.length > 0 ? (
          <div style={{ marginTop: "12px" }} role="note">
            <h3 style={{ margin: "0 0 6px", fontSize: "13px" }}>Scope-unavailable incidents</h3>
            <ul style={{ margin: 0, paddingLeft: "18px" }}>
              {scopeUnavailableIncidents.map((incident) => (
                <li key={incident.id}>{incident.id}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
