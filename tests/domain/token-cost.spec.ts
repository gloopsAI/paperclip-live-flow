import { describe, expect, it } from "vitest";
import {
  assertNoContextWindowUtilization,
  normalizeTokenCostFacts
} from "../../src/domain/token-cost.js";
import { CONTEXT_WINDOW_UTILIZATION_MESSAGE } from "../../src/contracts/common.js";

describe("normalizeTokenCostFacts", () => {
  it("preserves input/cached/output/cost exactly", () => {
    const facts = normalizeTokenCostFacts(
      {
        inputTokens: 1000,
        cachedInputTokens: 200,
        outputTokens: 300,
        costCents: 42,
        billingCode: "alpha"
      },
      "subtree",
      "2026-09-03T12:00:00.000Z"
    );
    expect(facts.inputTokens).toBe(1000);
    expect(facts.cachedInputTokens).toBe(200);
    expect(facts.outputTokens).toBe(300);
    expect(facts.costCents).toBe(42);
    expect(facts.billingCode).toBe("alpha");
    expect(facts.availability).toBe("available");
  });

  it("labels loaded active roots scope", () => {
    const facts = normalizeTokenCostFacts(null, "loaded_active_roots", null);
    expect(facts.scopeLabel).toBe("loaded active roots");
    expect(facts.availability).toBe("not_available");
  });

  it("returns unavailable when SDK field missing", () => {
    const facts = normalizeTokenCostFacts({ inputTokens: 1 }, "issue", null, {
      sdkFieldMissing: true
    });
    expect(facts.availability).toBe("unavailable");
    expect(facts.inputTokens).toBeNull();
  });

  it("does not infer context-window utilization", () => {
    const facts = normalizeTokenCostFacts({ inputTokens: 999999, outputTokens: 1 }, "issue", null);
    expect(assertNoContextWindowUtilization(facts)).toBe(true);
    expect(CONTEXT_WINDOW_UTILIZATION_MESSAGE).toContain("not exposed");
  });
});
