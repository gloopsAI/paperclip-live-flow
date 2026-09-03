import { usePluginData } from "@paperclipai/plugin-sdk/ui";
import type { CompanyFlowResponse } from "../../contracts/company-flow.js";
import { COMPANY_FLOW_HANDLER } from "../constants.js";
import { useForegroundRefresh } from "./useForegroundRefresh.js";

/** Company-flow data bridge — never passes companyId; host injects scope. */
export function useCompanyFlowData() {
  const result = usePluginData<CompanyFlowResponse>(COMPANY_FLOW_HANDLER);
  useForegroundRefresh(result.refresh, { hasError: Boolean(result.error) });
  return result;
}
