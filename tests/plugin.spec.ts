import { describe, expect, it } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest, { MANIFEST_CAPABILITIES } from "../src/manifest.js";
import plugin from "../src/worker.js";

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

describe("Live Flow plugin contract", () => {
  it("declares only the exact allowed read-only capabilities", () => {
    expect([...manifest.capabilities].sort()).toEqual([...MANIFEST_CAPABILITIES].sort());
    expect(manifest.id).toBe("gloops.live-flow");
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
      description: string;
      phase: string;
    }>("plugin-about");
    expect(data.id).toBe("gloops.live-flow");
    expect(data.phase).toBe("scaffold");

    expect(harness.ctx.actions.register).toBeDefined();
    expect(harness.ctx.events.on).toBeDefined();
    expect(harness.ctx.state.set).toBeDefined();
  });
});
