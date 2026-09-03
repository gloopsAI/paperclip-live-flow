import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

/** Exact read-only capabilities used by the worker and current UI slots. */
export const MANIFEST_CAPABILITIES = [
  "issues.read",
  "issues.orchestration.read",
  "issue.subtree.read",
  "issue.relations.read",
  "issue.documents.read",
  "agents.read",
  "projects.read",
  "ui.dashboardWidget.register"
] as const;

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
