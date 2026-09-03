import type { PluginContext } from "@paperclipai/plugin-sdk";
import { createCompanyFlowHandler } from "./handlers/company-flow.js";
import { createDashboardSummaryHandler } from "./handlers/dashboard-summary.js";
import { createIssueFlowHandler } from "./handlers/issue-flow.js";
import { handlePluginAbout } from "./handlers/plugin-about.js";

export function registerLiveFlowHandlers(ctx: PluginContext): void {
  ctx.data.register("plugin-about", handlePluginAbout);
  ctx.data.register("company-flow", createCompanyFlowHandler(ctx));
  ctx.data.register("issue-flow", createIssueFlowHandler(ctx));
  ctx.data.register("dashboard-summary", createDashboardSummaryHandler(ctx));
}

export const LIVE_FLOW_DATA_HANDLERS = [
  "plugin-about",
  "company-flow",
  "issue-flow",
  "dashboard-summary"
] as const;
