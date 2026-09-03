import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

/** Read-only capability ceiling for v0.1.0; expand only with matching worker/UI use. */
export const MANIFEST_CAPABILITIES = ["ui.dashboardWidget.register"] as const;

const manifest: PaperclipPluginManifestV1 = {
  id: "gloops.live-flow",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Live Flow",
  description: "Read-only workflow visibility for Paperclip",
  author: "GLoops",
  categories: ["ui"],
  capabilities: [...MANIFEST_CAPABILITIES],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui"
  },
  ui: {
    slots: [
      {
        type: "dashboardWidget",
        id: "live-flow-summary",
        displayName: "Live Flow",
        exportName: "DashboardWidget"
      }
    ]
  }
};

export default manifest;
