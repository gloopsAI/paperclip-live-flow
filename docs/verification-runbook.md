# Verification runbook

**W6 verification complete (2026-09-03).** Master receipt:
[`evidence/MANIFEST.json`](./evidence/MANIFEST.json). Screenshot digests:
[`evidence/screenshots/MANIFEST.json`](./evidence/screenshots/MANIFEST.json).

Authority: [`delivery-contract.md`](./delivery-contract.md), upstream pin
[`da0947d3582ac7779d6bf11851c9938eca6c5c8c`](https://github.com/paperclipai/paperclip/commit/da0947d3582ac7779d6bf11851c9938eca6c5c8c).

## Local deterministic gates

Run from plugin repository root on a clean install:

| Gate                   | Command                          | W6 status                                                                  |
| ---------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| Install lockfile       | `pnpm install --frozen-lockfile` | **passed**                                                                 |
| Format                 | `pnpm format:check`              | **passed**                                                                 |
| Lint                   | `pnpm lint`                      | **passed**                                                                 |
| Typecheck              | `pnpm typecheck`                 | **passed**                                                                 |
| Unit/integration tests | `pnpm test`                      | **passed** (155 tests / 23 files; builds `dist/` first for clean checkout) |
| Coverage               | `pnpm test:coverage`             | **passed** (builds `dist/` first for clean checkout)                       |
| Build                  | `pnpm build`                     | **passed** (also invoked by test scripts and `check:ui-boundary`)          |
| UI boundary            | `pnpm check:ui-boundary`         | **passed** (2 tests, built bundle; explicit CI/release step)               |
| Pack dry-run           | `pnpm pack:check`                | **passed** (9 files, 562.8 kB)                                             |

## W6 repair (list vs detail execution state)

During canary, stock `issues.list` returned active records with `executionPolicy` and
`executionState` nulled while public `issues.get` returned full native execution state. Repair:
bounded public `issues.get` hydration in `company-flow` so LIV-9 renders native review
stage/participant and `pending_review` attention. Regression tests cover root row, active child
attention, thrown/null detail reads, and foreign-company fail-closed behavior.

## Upstream harness (W6)

Applicable worker/UI gates executed against vendored `@paperclipai/plugin-sdk` **1.0.0** at pin
`da0947d`. Isolated browser canary used stock Paperclip checkout at the same SHA.

## Isolated browser canary (W6)

**Do not install into production Paperclip.**

### Prerequisites

| Item                                                | Status   | Evidence                                                                          |
| --------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| Stock Paperclip checkout at compatible SHA          | **pass** | `da0947d3582ac7779d6bf11851c9938eca6c5c8c`                                        |
| Dedicated port (`3120`)                             | **pass** | `http://127.0.0.1:3120` — [`plugin-inspect.json`](./evidence/plugin-inspect.json) |
| `paperclipai plugin target` diagnostics recorded    | **pass** | local_trusted isolated canary                                                     |
| Synthetic or seeded company data (W4 fixture cases) | **pass** | Company slug **LIV** — 10 issues, 10 agents, 2 projects                           |

### Canary procedure

1. Start isolated server: `PAPERCLIP_SERVER_PORT=3120 pnpm paperclipai run` — **pass**
2. `export PAPERCLIP_API_URL=http://127.0.0.1:3120` — **pass**
3. `paperclipai plugin target` — **pass** (local_trusted)
4. `pnpm dev` + `paperclipai plugin install <absolute-path>` — **pass**
5. `paperclipai plugin inspect gloops.live-flow` → `ready` — **pass** — [`plugin-inspect.json`](./evidence/plugin-inspect.json)
6. Playwright: dashboard → Live Flow → issue tab → canonical links — **pass**
7. Capture screenshots per [screenshot-inventory.md](./screenshot-inventory.md) — **pass** (12/12)
8. Browser console: no plugin exceptions/errors — **pass** (stock host font/run-log noise only)
9. Network trace: classify requests — **pass** — [`browser-network-classification.json`](./evidence/browser-network-classification.json)
10. Lifecycle snapshot before/after navigation — **pass** — [`lifecycle-before-after.json`](./evidence/lifecycle-before-after.json)
11. Browser accessibility (keyboard, status text, reduced motion, changes-requested UI) — **pass** — [`browser-accessibility-check.json`](./evidence/browser-accessibility-check.json)
12. `paperclipai plugin uninstall gloops.live-flow --force` on canary — **pass** (`plugin list` returned `[]`)

Operator commands: [`operator-commands.md`](./operator-commands.md).

### Network classification summary

| Metric                            | Value |
| --------------------------------- | ----- |
| Pages visited                     | 3     |
| Host requests observed            | 3805  |
| Authorized `usePluginData` bridge | 8     |
| Direct plugin-bundle requests     | 0     |
| Forbidden direct requests         | 0     |
| External network requests         | 0     |

HAR also recorded two stock-host `/api/heartbeat-runs/{id}/log` **404** responses (no plugin
bundle initiator). Full HAR is release-attachment-only (gitignored); SHA256 in
[`evidence/MANIFEST.json`](./evidence/MANIFEST.json).

### Lifecycle non-mutation

Before/after SHA256 identical: `d91d7cd2144b01f3e4058c1af87bc2c5bae50763567da7be28eaeb8c4ffa4c03`.
Counts unchanged: 10 issues, 10 agents, 2 projects, 0 approvals, 27 runs. Bridge calls
`company-flow`, `dashboard-summary`, and `issue-flow` succeeded.

## Acceptance scenarios (from source plan §11)

| #   | Scenario                                             | Automated | Browser canary |
| --- | ---------------------------------------------------- | --------- | -------------- |
| 1   | In-progress issue + active run shows agent + elapsed | yes[^1]   | **pass**       |
| 2   | Native review stage + participant (LIV-9)            | yes       | **pass**       |
| 3   | Changes requested state                              | yes       | **pass**[^3]   |
| 4   | Blocker relations + links                            | yes[^4]   | **pass**       |
| 5   | Failed run vs blocked issue                          | yes[^5]   | **pass**       |
| 6   | Done without merge/deploy → not_tracked              | yes       | **pass**       |
| 7   | Token/cost scope preserved                           | yes       | **pass**       |
| 8   | No double-count overlapping subtrees                 | yes       | **pass**       |
| 9   | Missing SDK field → unavailable                      | yes       | **pass**       |
| 10  | Partial snapshot on summary failure                  | yes       | **pass**       |
| 11  | Host `companyId` override + fail-closed              | yes       | n/a            |
| 12  | Budget incident dedupe/scopes                        | yes       | **pass**       |
| 13  | No false “recent done” claim                         | yes       | **pass**       |
| 14  | UI boundary / network classification                 | yes       | **pass**       |
| 15  | No lifecycle writes on refresh                       | n/a       | **pass**       |
| 16  | Keyboard / non-color status text                     | yes       | **pass**[^16]  |
| 17  | Reduced motion                                       | n/a[^17]  | **pass**[^17]  |
| 18  | Local-path install `ready`                           | n/a       | **pass**[^18]  |
| 19  | Pack contains no secrets/extra files                 | yes       | **pass**       |

[^1]: `tests/ui/issue-flight-deck.spec.tsx` — `loads active build with run, agent context, and semantic landmarks` (fake time at `2026-09-03T12:05:00Z` → `5m 0s`; scoped assignee/participant `Worker`; active `running` run row).

[^4]: `tests/ui/issue-flight-deck.spec.tsx` — `renders blocked relation links through host navigation props` (`/issues/LF-BLOCKER` host link).

[^5]: `tests/ui/issue-flight-deck.spec.tsx` — `distinguishes failed run attention from blocked issue status`.

[^3]: Browser canary used a **synthetic** browser-intercepted `issue-flow` DTO on LIV-9 to render changes-requested outcome/count while Review remained active and phase count stayed 6 (no manufactured phase). Worker/domain/UI automated tests separately prove changes-requested derivation. Receipt: [`browser-accessibility-check.json`](./evidence/browser-accessibility-check.json).

[^16]: Company page: 22 keyboard-focusable plugin controls (all `tabIndex` 0); first eight tab order verified; semantic table/list/headings; visible status labels include non-color text. Receipt: [`browser-accessibility-check.json`](./evidence/browser-accessibility-check.json).

[^17]: `prefers-reduced-motion: reduce` matched; plugin subtree had 0 animations, 0 nonzero animation durations, and 0 nonzero transitions (plugin has no decorative motion). Receipt: [`browser-accessibility-check.json`](./evidence/browser-accessibility-check.json).

[^18]: W6 verified **local-path** install only (`plugin inspect` → `ready`). **Registry install replay remains pending W7** — do not treat npm/packed install as W6-complete.

## W7 release gates (not in W6 scope)

- Independent exact-head review `APPROVE`
- Protected merge + annotated tag `v0.1.0`
- npm publish with provenance when available
- Registry install replay on isolated canary

**Status:** pending W7.

## Model-use disclosure (bootstrap)

| Role              | Declared                 | Recorded                                                |
| ----------------- | ------------------------ | ------------------------------------------------------- |
| Parent            | `gpt-5.6-sol-high`       | per delivery contract                                   |
| W5/W6 docs worker | `composer-2.5`           | checked-in routing                                      |
| Grok medium       | `cursor-grok-4.6-medium` | failed `resource_exhausted` — no implementation         |
| Runtime worker ID | —                        | **unverified** (Cursor did not expose backend identity) |
