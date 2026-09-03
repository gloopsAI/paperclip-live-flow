import type { PluginAboutResponse } from "../../contracts/plugin-about.js";
import {
  MISSING_PUBLIC_SDK_FIELDS,
  PLUGIN_ID,
  PLUGIN_VERSION,
  UPSTREAM_PIN
} from "../constants.js";
import { requireHostCompanyId } from "../company-scope.js";

export async function handlePluginAbout(
  params: Record<string, unknown>
): Promise<PluginAboutResponse> {
  requireHostCompanyId(params);
  return {
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    description: "Read-only workflow visibility for Paperclip",
    phase: "worker",
    upstreamPin: { ...UPSTREAM_PIN },
    compatibility: {
      compatible: true,
      message: null,
      missingFields: [...MISSING_PUBLIC_SDK_FIELDS]
    }
  };
}
