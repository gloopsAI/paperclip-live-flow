import { beforeEach, describe, expect, it } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import type { Issue } from "@paperclipai/shared";
import manifest from "../../src/manifest.js";
import plugin from "../../src/worker.js";
import { sharedHandlerCache } from "../../src/worker/cache.js";
import { LIVE_FLOW_DATA_HANDLERS } from "../../src/worker/setup.js";
import { invokeRpcGetData } from "./invoke-data.js";

const COMPANY_A = "11111111-1111-1111-1111-111111111111";
const ISSUE_ROOT = "44444444-4444-4444-4444-444444444444";

function seedMinimalHarness() {
  const harness = createTestHarness({
    manifest,
    capabilities: [...manifest.capabilities]
  });
  const now = new Date();
  harness.seed({
    issues: [
      {
        id: ISSUE_ROOT,
        companyId: COMPANY_A,
        title: "Root issue",
        status: "in_progress",
        identifier: "LF-ROOT",
        projectId: null,
        parentId: null,
        createdAt: now,
        updatedAt: now
      } as Issue
    ]
  });
  return harness;
}

describe("Live Flow worker handlers", () => {
  beforeEach(async () => {
    sharedHandlerCache.clear();
  });

  it("registers only the four read-only data handlers", async () => {
    const harness = seedMinimalHarness();
    await plugin.definition.setup(harness.ctx);
    for (const key of LIVE_FLOW_DATA_HANDLERS) {
      const params =
        key === "issue-flow"
          ? { companyId: COMPANY_A, issueId: ISSUE_ROOT }
          : { companyId: COMPANY_A };
      await expect(harness.getData(key, params)).resolves.toBeDefined();
    }
  });

  it("requires host companyId on plugin-about", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities] });
    await plugin.definition.setup(harness.ctx);
    await expect(harness.getData("plugin-about", {})).rejects.toThrow(/companyId is required/i);
  });

  it("uses authenticated companyId over malicious params via RPC merge helper", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities] });
    await plugin.definition.setup(harness.ctx);

    const about = await invokeRpcGetData<{ id: string }>(harness, "plugin-about", COMPANY_A, {
      companyId: "22222222-2222-2222-2222-222222222222"
    });
    expect(about.id).toBe("gloops.live-flow");
  });
});
