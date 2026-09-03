import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  assertPluginUiReadBoundary,
  isSdkBridgeAttributed,
  scanBuiltBundleForDirectNetwork,
  scanBuiltBundleForForbiddenRoutes,
  scanPluginSourceForDirectNetwork,
  scanPluginSourceForForbiddenRoutes
} from "../../src/domain/policy/ui-read-boundary.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}

describe("ui read boundary guards", () => {
  it("rejects plugin-owned fetch in source fixtures", () => {
    const bad = readFixture("bad-ui-fetch.ts.fixture");
    const violations = scanPluginSourceForDirectNetwork(bad);
    expect(violations.some((v) => v.rule === "fetch-call")).toBe(true);
  });

  it("rejects XMLHttpRequest, sendBeacon, WebSocket, EventSource", () => {
    const bad = readFixture("bad-ui-transports.ts.fixture");
    const violations = scanPluginSourceForDirectNetwork(bad);
    const rules = new Set(violations.map((v) => v.rule));
    expect(rules.has("xhr-constructor")).toBe(true);
    expect(rules.has("send-beacon")).toBe(true);
    expect(rules.has("websocket")).toBe(true);
    expect(rules.has("eventsource")).toBe(true);
  });

  it("rejects common HTTP client imports and calls", () => {
    const bad = readFixture("bad-ui-http-clients.ts.fixture");
    const violations = scanPluginSourceForDirectNetwork(bad);
    const rules = new Set(violations.map((v) => v.rule));
    expect(rules.has("axios-import")).toBe(true);
    expect(rules.has("axios-call")).toBe(true);
    expect(rules.has("node-fetch-import")).toBe(true);
  });

  it("rejects host API/action route literals", () => {
    const bad = readFixture("bad-ui-routes.ts.fixture");
    const violations = scanPluginSourceForForbiddenRoutes(bad);
    expect(violations.some((v) => v.rule === "api-route-literal")).toBe(true);
    expect(violations.some((v) => v.rule === "action-route-literal")).toBe(true);
  });

  it("rejects form actions to host routes", () => {
    const bad = readFixture("bad-ui-form-action.html.fixture");
    const violations = scanPluginSourceForDirectNetwork(bad);
    expect(violations.some((v) => v.rule.startsWith("form-action"))).toBe(true);
  });

  it("excludes SDK bridge/runtime transport by trustworthy SDK path attribution", () => {
    const sdkBridge = readFixture("sdk-bridge-transport.ts.fixture");
    const violations = scanPluginSourceForDirectNetwork(sdkBridge, {
      filePath: "node_modules/@paperclipai/plugin-sdk/ui/bridge.ts"
    });
    expect(violations).toHaveLength(0);
    expect(
      isSdkBridgeAttributed({
        filePath: "node_modules/@paperclipai/plugin-sdk/ui/bridge.ts"
      })
    ).toBe(true);
  });

  it("rejects plugin-owned fetch even when source embeds bridge marker text", () => {
    const bad = readFixture("bad-ui-fetch-with-bridge-marker.ts.fixture");
    const violations = scanPluginSourceForDirectNetwork(bad, {
      filePath: "src/ui/BadWidget.tsx",
      excludedMarkers: ["__paperclip/plugin-data", "plugin-sdk"]
    });
    expect(violations.some((v) => v.rule === "fetch-call")).toBe(true);
    expect(
      isSdkBridgeAttributed({
        filePath: "src/ui/BadWidget.tsx",
        excludedMarkers: ["__paperclip/plugin-data"]
      })
    ).toBe(false);
  });

  it("still flags plugin-owned fetch when path is not SDK-attributed", () => {
    const sdkBridge = readFixture("sdk-bridge-transport.ts.fixture");
    const violations = scanPluginSourceForDirectNetwork(sdkBridge, {
      filePath: "src/ui/Widget.tsx"
    });
    expect(violations.length).toBeGreaterThan(0);
  });

  it("scans built bundle fixtures", () => {
    const bundle = readFixture("bad-ui-bundle.js.fixture");
    const network = scanBuiltBundleForDirectNetwork(bundle);
    const routes = scanBuiltBundleForForbiddenRoutes(bundle);
    expect(network.length).toBeGreaterThan(0);
    expect(routes.length).toBeGreaterThan(0);
  });

  it("assertPluginUiReadBoundary aggregates violations", () => {
    const bad = readFixture("bad-ui-fetch.ts.fixture");
    expect(assertPluginUiReadBoundary(bad).length).toBeGreaterThan(0);
  });

  it("allows usePluginData-only compliant fixture", () => {
    const good = readFixture("good-ui-use-plugin-data.tsx.fixture");
    expect(assertPluginUiReadBoundary(good)).toHaveLength(0);
  });
});
