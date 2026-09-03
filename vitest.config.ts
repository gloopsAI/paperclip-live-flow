import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx"],
    environment: "node",
    environmentMatchGlobs: [["tests/ui/**/*.spec.tsx", "happy-dom"]],
    setupFiles: ["./tests/ui/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.d.ts", "src/worker.ts"]
    }
  }
});
