import { usePluginData } from "@paperclipai/plugin-sdk/ui";
import type { IssueFlowResponse } from "../../contracts/issue-flow.js";
import { ISSUE_FLOW_HANDLER } from "../constants.js";

/** Issue-flow data bridge — never passes companyId; host injects scope. */
export function useIssueFlowData(issueId: string | null | undefined) {
  return usePluginData<IssueFlowResponse>(ISSUE_FLOW_HANDLER, issueId ? { issueId } : {});
}
