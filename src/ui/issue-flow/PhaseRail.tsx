import type { PhaseFact, PhaseProfile } from "../../contracts/common.js";
import { card, muted, sectionTitle, stack } from "../styles.js";
import { phaseStateAccessibleLabel, phaseStateLabel } from "./status.js";

export function PhaseRail({ profile, phases }: { profile: PhaseProfile; phases: PhaseFact[] }) {
  const profileLabel = profile === "native" ? "Native lifecycle" : "Software delivery";

  return (
    <section aria-labelledby="lf-phase-rail-heading" style={stack}>
      <h2 id="lf-phase-rail-heading" style={sectionTitle}>
        Phase rail — {profileLabel}
      </h2>
      <ol
        aria-label={`${profileLabel} phases`}
        style={{
          ...card,
          display: "grid",
          gap: "10px",
          listStyle: "none",
          margin: 0,
          padding: "12px"
        }}
      >
        {phases.map((phase) => (
          <li key={phase.key}>
            <article aria-label={phaseStateAccessibleLabel(phase.label, phase.state)}>
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "baseline" }}
              >
                <strong>{phase.label}</strong>
                <span aria-hidden="true">·</span>
                <span>{phaseStateLabel(phase.state)}</span>
              </div>
              <p style={{ ...muted, margin: "4px 0 0" }}>{phase.explanation}</p>
              {phase.source.length > 0 ? (
                <details style={{ marginTop: "6px" }}>
                  <summary style={{ cursor: "pointer", fontSize: "12px" }}>Provenance</summary>
                  <ul style={{ ...muted, margin: "6px 0 0", paddingLeft: "18px" }}>
                    {phase.source.map((entry) => (
                      <li key={`${entry.kind}:${entry.entityId}:${entry.field}`}>
                        {entry.kind} / {entry.field} ({entry.entityId})
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
