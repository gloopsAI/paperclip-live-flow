import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDir = join(fileURLToPath(new URL(".", import.meta.url)), "../..");
const uiPaths = [
  join(rootDir, "src/ui/issue-flow"),
  join(rootDir, "src/ui/company-flow"),
  join(rootDir, "src/ui/dashboard"),
  join(rootDir, "src/ui/hooks"),
  join(rootDir, "src/ui/index.tsx"),
  join(rootDir, "src/ui/constants.ts")
];

function walkFiles(path: string, out: string[] = []): string[] {
  if (!existsSync(path)) return out;
  const stat = statSync(path);
  if (stat.isFile() && (path.endsWith(".ts") || path.endsWith(".tsx"))) {
    out.push(path);
    return out;
  }
  if (!stat.isDirectory()) return out;
  for (const entry of readdirSync(path)) {
    walkFiles(join(path, entry), out);
  }
  return out;
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("plugin UI read boundary", () => {
  it("does not pass companyId to usePluginData or embed direct company-scoped network routes", () => {
    const files = uiPaths.flatMap((entry) => walkFiles(entry));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const rel = relative(rootDir, file);
      const source = readFileSync(file, "utf8");
      const code = stripComments(source);

      expect(code).not.toMatch(/usePluginData\s*\([^)]*companyId/);
      expect(code).not.toMatch(/\{\s*companyId\s*[:,]/);
      expect(code).not.toMatch(/\/api\/companies\//);
      expect(code).not.toMatch(/\/actions\//);

      if (rel.endsWith("issue-flow/hooks.ts")) {
        expect(code).toContain("{ issueId }");
        expect(code).not.toContain("companyId");
      }
    }
  });
});
