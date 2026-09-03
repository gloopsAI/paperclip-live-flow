import { card, muted } from "../styles.js";

export function RetainedDataWarning({ message }: { message: string }) {
  return (
    <section role="alert" aria-live="assertive" style={card}>
      <h2 style={{ margin: "0 0 6px", fontSize: "14px" }}>Refresh failed</h2>
      <p style={{ ...muted, margin: 0 }}>{message} Showing last loaded snapshot.</p>
    </section>
  );
}
