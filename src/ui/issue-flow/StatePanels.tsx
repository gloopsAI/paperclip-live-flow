import { Spinner } from "@paperclipai/plugin-sdk/ui";
import { card, muted, stack } from "../styles.js";

export function LoadingPanel({ label }: { label: string }) {
  return (
    <section aria-busy="true" aria-live="polite" aria-label={label} style={stack}>
      <div style={{ ...card, ...stack }}>
        <Spinner label={label} />
        <p style={{ ...muted, margin: 0 }}>{label}</p>
      </div>
    </section>
  );
}

export function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <section aria-label={title} style={stack}>
      <div style={card} role="status">
        <h2 style={{ margin: "0 0 6px", fontSize: "15px" }}>{title}</h2>
        <p style={{ ...muted, margin: 0 }}>{description}</p>
      </div>
    </section>
  );
}

export function ErrorPanel({
  title,
  description,
  code
}: {
  title: string;
  description: string;
  code?: string;
}) {
  return (
    <section aria-label={title} style={stack}>
      <div style={card} role="alert">
        <h2 style={{ margin: "0 0 6px", fontSize: "15px" }}>{title}</h2>
        <p style={{ margin: "0 0 4px" }}>{description}</p>
        {code ? <p style={{ ...muted, margin: 0 }}>Code: {code}</p> : null}
      </div>
    </section>
  );
}
