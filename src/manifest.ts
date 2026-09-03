import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
import {
  DASHBOARD_WIDGET_SLOT_ID,
  ISSUE_DETAIL_TAB_SLOT_ID,
  TASK_DETAIL_VIEW_SLOT_ID
} from "./ui/constants.js";

/** Exact read-only capabilities used by the worker and current UI slots. */
export const MANIFEST_CAPABILITIES = [
  "issues.read",
  "issues.orchestration.read",
  "issue.subtree.read",
  "issue.relations.read",
  "issue.documents.read",
  "agents.read",
  "projects.read",
  "ui.dashboardWidget.register",
  "ui.detailTab.register"
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
        id: DASHBOARD_WIDGET_SLOT_ID,
        displayName: "Live Flow",
        exportName: "DashboardWidget"
      },
      {
        type: "detailTab",
        id: ISSUE_DETAIL_TAB_SLOT_ID,
        displayName: "Live Flow",
        exportName: "IssueDetailTab",
        entityTypes: ["issue"]
      },
      {
        type: "taskDetailView",
        id: TASK_DETAIL_VIEW_SLOT_ID,
        displayName: "Live Flow",
        exportName: "TaskDetailView",
        entityTypes: ["issue"]
      }
    ]
  }
};

export default manifest;
