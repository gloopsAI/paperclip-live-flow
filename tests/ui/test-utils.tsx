import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import type { PluginDetailTabProps, PluginHostContext } from "@paperclipai/plugin-sdk/ui";
import { ISSUE_ID } from "./fixtures/issue-flow.js";

export function issueTabContext(issueId = ISSUE_ID): PluginDetailTabProps {
  const context: PluginHostContext & { entityId: string; entityType: string } = {
    companyId: "11111111-1111-1111-1111-111111111111",
    companyPrefix: "company-a",
    projectId: null,
    entityId: issueId,
    entityType: "issue",
    userId: "user-1"
  };
  return { context };
}

export function renderIssueUi(ui: ReactElement): RenderResult {
  return render(ui);
}
