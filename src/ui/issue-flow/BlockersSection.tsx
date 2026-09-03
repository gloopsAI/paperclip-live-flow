import { useHostNavigation } from "@paperclipai/plugin-sdk/ui";
import type { RelationFact } from "../../contracts/common.js";
import { card, linkStyle, muted, sectionTitle, stack } from "../styles.js";

export function BlockersSection({ blockers }: { blockers: RelationFact[] }) {
  const hostNavigation = useHostNavigation();

  if (blockers.length === 0) {
    return (
      <section aria-labelledby="lf-blockers-heading" style={stack}>
        <h2 id="lf-blockers-heading" style={sectionTitle}>
          Blockers
        </h2>
        <p style={{ ...muted, margin: 0 }}>No blocker relations reported for this issue.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="lf-blockers-heading" style={stack}>
      <h2 id="lf-blockers-heading" style={sectionTitle}>
        Blockers ({blockers.length})
      </h2>
      <ul style={{ ...card, margin: 0, padding: "12px 12px 12px 28px" }}>
        {blockers.map((blocker) => {
          const ref = blocker.blockerIdentifier ?? blocker.blockerIssueId ?? blocker.toIssueId;
          const href = `/issues/${ref}`;
          return (
            <li key={blocker.id} style={{ marginBottom: "8px" }}>
              <a {...hostNavigation.linkProps(href)} style={linkStyle}>
                Blocked by {ref}
              </a>
              <span className="lf-sr-only"> — relation {blocker.kind}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
