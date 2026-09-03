import { StatusBadge } from "@paperclipai/plugin-sdk/ui";
import type { CSSProperties } from "react";
import type { CanonicalIssueStatus } from "../../contracts/common.js";
import {
  canonicalStatusAccessibleLabel,
  canonicalStatusLabel,
  statusBadgeVariant
} from "./status.js";

export function StatusLabel({ status }: { status: CanonicalIssueStatus }) {
  const label = canonicalStatusLabel(status);
  return (
    <span aria-label={canonicalStatusAccessibleLabel(status)}>
      <StatusBadge label={label} status={statusBadgeVariant(status)} />
      <span className="lf-sr-only" style={srOnly}>
        {canonicalStatusAccessibleLabel(status)}
      </span>
    </span>
  );
}

const srOnly: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0
};
