import type { CompatibilityState } from "./common.js";

export type PluginAboutResponse = {
  id: string;
  version: string;
  description: string;
  phase: string;
  upstreamPin: {
    paperclipCommit: string;
    pluginSdkVersion: string;
    sharedVersion: string;
  };
  compatibility: CompatibilityState;
};
