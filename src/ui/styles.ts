import type { CSSProperties } from "react";

export const stack: CSSProperties = {
  display: "grid",
  gap: "var(--lf-gap, 12px)"
};

export const card: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "14px",
  background: "var(--card, transparent)"
};

export const subtleCard: CSSProperties = {
  border: "1px solid color-mix(in srgb, var(--border) 75%, transparent)",
  borderRadius: "10px",
  padding: "12px"
};

export const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "8px"
};

export const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: 600
};

export const muted: CSSProperties = {
  fontSize: "12px",
  color: "var(--muted-foreground, color-mix(in srgb, currentColor 65%, transparent))"
};

export const focusRing =
  "2px solid color-mix(in srgb, var(--ring, var(--foreground)) 70%, transparent)";

export const linkStyle: CSSProperties = {
  color: "inherit",
  textDecoration: "underline",
  textUnderlineOffset: "2px"
};

export const disclosureButton: CSSProperties = {
  appearance: "none",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  background: "transparent",
  color: "inherit",
  padding: "6px 10px",
  fontSize: "12px",
  cursor: "pointer",
  textAlign: "left"
};

export const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px"
};

export const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid var(--border)",
  fontWeight: 600
};

export const tdStyle: CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
  verticalAlign: "top"
};

export const pageShell: CSSProperties = {
  display: "grid",
  gap: "var(--lf-gap, 16px)",
  maxWidth: "1920px",
  margin: "0 auto",
  padding: "12px"
};

export const responsiveGrid: CSSProperties = {
  display: "grid",
  gap: "12px",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))"
};

export const filterBar: CSSProperties = {
  display: "grid",
  gap: "10px",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))"
};

export const controlStyle: CSSProperties = {
  ...disclosureButton,
  width: "100%"
};

export const focusVisibleClass = "lf-focus-visible";
