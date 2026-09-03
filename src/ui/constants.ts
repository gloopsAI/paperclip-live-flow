/** Plugin manifest id — used for host tab deep links only via public navigation helpers. */
export const PLUGIN_ID = "gloops.live-flow";

export const COMPANY_PAGE_ROUTE = "live-flow";
export const PROJECT_FILTER_QUERY_KEY = "projectId";

export const COMPANY_PAGE_SLOT_ID = "live-flow-page";
export const COMPANY_SIDEBAR_SLOT_ID = "live-flow-sidebar";
export const PROJECT_SIDEBAR_ITEM_SLOT_ID = "live-flow-project-link";

export const ISSUE_DETAIL_TAB_SLOT_ID = "live-flow-issue-tab";
export const TASK_DETAIL_VIEW_SLOT_ID = "live-flow-task-view";
export const DASHBOARD_WIDGET_SLOT_ID = "live-flow-summary";

export const COMPANY_FLOW_HANDLER = "company-flow" as const;
export const ISSUE_FLOW_HANDLER = "issue-flow" as const;
export const DASHBOARD_SUMMARY_HANDLER = "dashboard-summary" as const;
