import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  assertPluginUiReadBoundary,
  scanBuiltBundleForDirectNetwork,
  scanBuiltBundleForForbiddenRoutes
} from "../../src/domain/policy/ui-read-boundary.js";

const rootDir = join(fileURLToPath(new URL(".", import.meta.url)), "../..");

function walkFiles(dir: string, extensions: Set<string>, out: string[] = []): string[] {
  if (!existsSync(dir)) {
    return out;
  }
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkFiles(fullPath, extensions, out);
      continue;
    }
    if ([...extensions].some((ext) => fullPath.endsWith(ext))) {
      out.push(fullPath);
    }
  }
  return out;
}

describe("ui boundary release gate", () => {
  it("scans plugin-owned src/ui sources with path attribution", () => {
    const sourceFiles = walkFiles(join(rootDir, "src/ui"), new Set([".ts", ".tsx"]));
    expect(sourceFiles.length).toBeGreaterThan(0);

    for (const file of sourceFiles) {
      const rel = relative(rootDir, file);
      const source = readFileSync(file, "utf8");
      expect(assertPluginUiReadBoundary(source, { filePath: rel })).toEqual([]);
    }
  });

  it("scans built UI bundles after build without SDK suppression", () => {
    const bundleFiles = walkFiles(join(rootDir, "dist/ui"), new Set([".js"]));
    expect(bundleFiles.length).toBeGreaterThan(0);

    for (const file of bundleFiles) {
      const rel = relative(rootDir, file);
      const bundle = readFileSync(file, "utf8");
      expect(scanBuiltBundleForDirectNetwork(bundle, { filePath: rel })).toEqual([]);
      expect(scanBuiltBundleForForbiddenRoutes(bundle, { filePath: rel })).toEqual([]);
    }
  });
});
