import { describe, expect, it } from "vitest";
import { elapsedDurationMs } from "../../src/domain/duration.js";

describe("elapsedDurationMs", () => {
  const now = Date.parse("2026-09-03T12:10:00.000Z");

  const cases: Array<{
    name: string;
    startedAt: string | null;
    finishedAt: string | null;
    expected: number | null;
  }> = [
    {
      name: "active run uses now",
      startedAt: "2026-09-03T12:00:00.000Z",
      finishedAt: null,
      expected: 600_000
    },
    {
      name: "finished run uses finishedAt",
      startedAt: "2026-09-03T12:00:00.000Z",
      finishedAt: "2026-09-03T12:05:00.000Z",
      expected: 300_000
    },
    {
      name: "missing start returns null",
      startedAt: null,
      finishedAt: "2026-09-03T12:05:00.000Z",
      expected: null
    },
    {
      name: "invalid start returns null",
      startedAt: "not-a-date",
      finishedAt: null,
      expected: null
    }
  ];

  it.each(cases)("$name", ({ startedAt, finishedAt, expected }) => {
    expect(elapsedDurationMs(startedAt, finishedAt, now)).toBe(expected);
  });
});
