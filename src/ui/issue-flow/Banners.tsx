import type { IssueFlowResponse } from "../../contracts/issue-flow.js";
import { card, muted, stack } from "../styles.js";

export function FreshnessBanners({ flow }: { flow: IssueFlowResponse }) {
  const banners: Array<{ tone: string; text: string }> = [];

  if (flow.freshness.stale) {
    banners.push({
      tone: "stale",
      text: flow.freshness.staleReason ?? "Snapshot is stale; showing last successful load."
    });
  }
  if (flow.freshness.partial) {
    banners.push({
      tone: "partial",
      text: "Partial data: one or more sources failed while loading this issue view."
    });
  }
  if (!flow.compatibility.compatible) {
    banners.push({
      tone: "compatibility",
      text:
        flow.compatibility.message ??
        `Installed SDK is missing fields: ${flow.compatibility.missingFields.join(", ")}`
    });
  }
  if (flow.sourceErrors.length > 0) {
    banners.push({
      tone: "source",
      text: flow.sourceErrors.map((entry) => `${entry.source}: ${entry.message}`).join("; ")
    });
  }

  if (banners.length === 0) return null;

  return (
    <div style={stack} aria-label="Data quality notices">
      {banners.map((banner) => (
        <div key={`${banner.tone}:${banner.text}`} style={card} role="status">
          <strong style={{ fontSize: "12px", textTransform: "capitalize" }}>{banner.tone}</strong>
          <p style={{ ...muted, margin: "4px 0 0" }}>{banner.text}</p>
        </div>
      ))}
    </div>
  );
}
