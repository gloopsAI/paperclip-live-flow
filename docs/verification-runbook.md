# Verification runbook

**Release browser/canary evidence: pending W6.** This runbook lists required gates and canary
steps. Pass/fail fields remain **`pending W6`** until W6 replaces them with links, digests,
and timestamps.

Authority: [`delivery-contract.md`](./delivery-contract.md), upstream pin
[`da0947d3582ac7779d6bf11851c9938eca6c5c8c`](https://github.com/paperclipai/paperclip/commit/da0947d3582ac7779d6bf11851c9938eca6c5c8c).

## Local deterministic gates

Run from plugin repository root on a clean install:

| Gate                   | Command                          | W5 status                |
| ---------------------- | -------------------------------- | ------------------------ |
| Install lockfile       | `pnpm install --frozen-lockfile` | **passed** (W2–W4)       |
| Format                 | `pnpm format:check`              | **passed** (W5 doc pass) |
| Lint                   | `pnpm lint`                      | **passed**               |
| Typecheck              | `pnpm typecheck`                 | **passed**               |
| Unit/integration tests | `pnpm test`                      | **passed** (~150 tests)  |
| Coverage               | `pnpm test:coverage`             | **passed** (~92%)        |
| Build                  | `pnpm build`                     | **passed**               |
| UI boundary            | `pnpm check:ui-boundary`         | **passed**               |
| Pack dry-run           | `pnpm pack:check`                | **passed**               |

## Upstream harness (W6)

Run applicable tests from pinned Paperclip checkout after external package is linked/installed
into canary — **pending W6**.

## Isolated browser canary (W6)

**Do not install into production Paperclip.**

### Prerequisites

| Item                                                | Status         |
| --------------------------------------------------- | -------------- |
| Stock Paperclip checkout at compatible SHA          | **pending W6** |
| Dedicated port (e.g. `3120`)                        | **pending W6** |
| `paperclipai plugin target` diagnostics recorded    | **pending W6** |
| Synthetic or seeded company data (W4 fixture cases) | **pending W6** |

### Canary procedure

1. Start isolated server: `PAPERCLIP_SERVER_PORT=3120 pnpm paperclipai run` — **pending W6**
2. `export PAPERCLIP_API_URL=http://127.0.0.1:3120` — **pending W6**
3. `paperclipai plugin target` — **pending W6**
4. `pnpm dev` + `paperclipai plugin install <absolute-path>` — **pending W6**
5. `paperclipai plugin inspect gloops.live-flow` → expect `ready` — **pending W6**
6. Playwright: dashboard → Live Flow → issue tab → canonical links — **pending W6**
7. Capture screenshots per [screenshot-inventory.md](./screenshot-inventory.md) — **pending W6**
8. Browser console: no unexpected errors — **pending W6**
9. Network trace: classify requests; fail on direct ordinary Paperclip API/action from plugin UI — **pending W6**
10. Lifecycle snapshot before/after navigation — prove no writes — **pending W6**
11. `paperclipai plugin uninstall gloops.live-flow` on canary — **pending W6**

Operator commands: [`operator-commands.md`](./operator-commands.md).

## Acceptance scenarios (from source plan §11)

Automated tests cover many rows; browser canary required for release:

| #   | Scenario                                             | Automated          | Browser canary |
| --- | ---------------------------------------------------- | ------------------ | -------------- |
| 1   | In-progress issue + active run shows agent + elapsed | partial            | **pending W6** |
| 2   | Native review stage + participant                    | partial            | **pending W6** |
| 3   | Changes requested state                              | partial            | **pending W6** |
| 4   | Blocker relations + links                            | partial            | **pending W6** |
| 5   | Failed run vs blocked issue                          | partial            | **pending W6** |
| 6   | Done without merge/deploy → not_tracked              | yes                | **pending W6** |
| 7   | Token/cost scope preserved                           | yes                | **pending W6** |
| 8   | No double-count overlapping subtrees                 | yes                | **pending W6** |
| 9   | Missing SDK field → unavailable                      | yes                | **pending W6** |
| 10  | Partial snapshot on summary failure                  | yes                | **pending W6** |
| 11  | Host `companyId` override + fail-closed              | yes                | n/a            |
| 12  | Budget incident dedupe/scopes                        | yes                | **pending W6** |
| 13  | No false “recent done” claim                         | yes                | **pending W6** |
| 14  | UI boundary / network classification                 | source gate passed | **pending W6** |
| 15  | No lifecycle writes on refresh                       | n/a                | **pending W6** |
| 16  | Keyboard / non-color status text                     | partial            | **pending W6** |
| 17  | Reduced motion                                       | partial            | **pending W6** |
| 18  | Local + packed install `ready`                       | n/a                | **pending W6** |
| 19  | Pack contains no secrets/extra files                 | pack:check passed  | **pending W6** |

## W7 release gates (not in W5 scope)

- Independent exact-head review `APPROVE`
- Protected merge + annotated tag `v0.1.0`
- npm publish with provenance when available
- Registry install replay on isolated canary

**Status:** pending W7.

## Model-use disclosure (bootstrap)

| Role              | Declared                 | Recorded                                                |
| ----------------- | ------------------------ | ------------------------------------------------------- |
| Parent            | `gpt-5.6-sol-high`       | per delivery contract                                   |
| W5 docs worker    | `composer-2.5`           | checked-in routing                                      |
| Grok medium       | `cursor-grok-4.6-medium` | failed `resource_exhausted` — no implementation         |
| Runtime worker ID | —                        | **unverified** (Cursor did not expose backend identity) |

## Evidence replacement (W6 completion)

When W6 finishes, update this file:

- Replace each **`pending W6`** with pass/fail, ISO timestamp, and link to receipt artifact
- Link screenshot digests from [`screenshot-inventory.md`](./screenshot-inventory.md)
- Record canary Paperclip version/SHA/port and install path (local vs packed)

Do not claim canary completion until those replacements exist.
