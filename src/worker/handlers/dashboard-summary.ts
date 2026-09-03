import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { DashboardSummaryResponse } from "../../contracts/dashboard-summary.js";
import { sharedHandlerCache } from "../cache.js";
import { requireHostCompanyId } from "../company-scope.js";
import { buildFreshness } from "../normalize.js";
import { createCompanyFlowHandler } from "./company-flow.js";

export function createDashboardSummaryHandler(ctx: PluginContext) {
  const companyFlow = createCompanyFlowHandler(ctx);

  return async (params: Record<string, unknown>): Promise<DashboardSummaryResponse> => {
    const companyId = requireHostCompanyId(params);
    const cacheParams = { handler: "dashboard-summary" };

    const cacheResult = await sharedHandlerCache.load(
      sharedHandlerCache.cacheKey(companyId, "dashboard-summary", cacheParams),
      async () => {
        const company = await companyFlow({ companyId });
        return {
          companyId,
          counts: company.counts,
          topAttention: company.attention.slice(0, 3),
          tokenCost: company.tokenCost,
          freshness: company.freshness,
          sourceErrors: company.sourceErrors
        } satisfies DashboardSummaryResponse;
      }
    );

    return {
      ...cacheResult.value,
      freshness: buildFreshness(cacheResult, cacheResult.value.sourceErrors.length > 0)
    };
  };
}
