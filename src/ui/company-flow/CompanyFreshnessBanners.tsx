import type { FreshnessState, SourceError } from "../../contracts/common.js";
import { card, muted, stack } from "../styles.js";

export function CompanyFreshnessBanners({
  freshness,
  sourceErrors
}: {
  freshness: FreshnessState;
  sourceErrors: SourceError[];
}) {
  const banners: Array<{ tone: string; text: string }> = [];
  if (freshness.stale) {
    banners.push({
      tone: "stale",
      text: freshness.staleReason ?? "Snapshot is stale; showing last successful load."
    });
  }
  if (freshness.partial) {
    banners.push({
      tone: "partial",
      text: "Partial data: one or more sources failed while loading the company snapshot."
    });
  }
  if (sourceErrors.length > 0) {
    banners.push({
      tone: "source",
      text: sourceErrors.map((entry) => `${entry.source}: ${entry.message}`).join("; ")
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
