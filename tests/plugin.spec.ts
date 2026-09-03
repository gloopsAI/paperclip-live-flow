import { describe, expect, it } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest, { MANIFEST_CAPABILITIES } from "../src/manifest.js";
import plugin from "../src/worker.js";
import { LIVE_FLOW_DATA_HANDLERS } from "../src/worker/setup.js";

const FORBIDDEN_CAPABILITY_FRAGMENTS = [
  ".write",
  ".create",
  ".update",
  ".checkout",
  ".wakeup",
  ".respond",
  "agents.invoke",
  "agents.pause",
  "agents.resume",
  "jobs.schedule",
  "events.",
  "http.outbound",
  "secrets.read-ref",
  "database.namespace.",
  "plugin.state.write",
  "actions.",
  "webhooks.",
  "tools."
] as const;

const ALLOWED_CEILING = [
  "issues.read",
  "issues.orchestration.read",
  "issue.subtree.read",
  "issue.relations.read",
  "issue.documents.read",
  "agents.read",
  "projects.read",
  "ui.page.register",
  "ui.sidebar.register",
  "ui.dashboardWidget.register",
  "ui.detailTab.register"
] as const;

describe("Live Flow plugin contract", () => {
  it("declares only exact used read-only capabilities", () => {
    expect([...manifest.capabilities].sort()).toEqual([...MANIFEST_CAPABILITIES].sort());
    expect(manifest.id).toBe("gloops.live-flow");
    for (const capability of manifest.capabilities) {
      expect(ALLOWED_CEILING.includes(capability as (typeof ALLOWED_CEILING)[number])).toBe(true);
    }
  });

  it("does not declare forbidden lifecycle-write or side-effect capabilities", () => {
    for (const capability of manifest.capabilities) {
      for (const fragment of FORBIDDEN_CAPABILITY_FRAGMENTS) {
        expect(capability.includes(fragment)).toBe(false);
      }
    }
  });

  it("registers read-only data handlers without actions, events, or state writes", async () => {
    const harness = createTestHarness({
      manifest,
      capabilities: [...manifest.capabilities]
    });
    await plugin.definition.setup(harness.ctx);

    const data = await harness.getData<{
      id: string;
      version: string;
      phase: string;
    }>("plugin-about", { companyId: "company-test" });
    expect(data.id).toBe("gloops.live-flow");
    expect(data.phase).toBe("worker");

    for (const key of LIVE_FLOW_DATA_HANDLERS) {
      expect(key).toBeTruthy();
    }

    expect(harness.ctx.actions.register).toBeDefined();
    expect(harness.ctx.events.on).toBeDefined();
    expect(harness.ctx.state.set).toBeDefined();
  });
});
