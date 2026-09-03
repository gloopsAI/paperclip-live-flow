import { usePluginData } from "@paperclipai/plugin-sdk/ui";
import type { DashboardSummaryResponse } from "../../contracts/dashboard-summary.js";
import { DASHBOARD_SUMMARY_HANDLER } from "../constants.js";

/** Dashboard summary bridge — never passes companyId; uses shared worker cache. */
export function useDashboardSummaryData() {
  return usePluginData<DashboardSummaryResponse>(DASHBOARD_SUMMARY_HANDLER);
}
