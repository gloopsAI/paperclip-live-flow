# Screenshot inventory (W6 complete)

**Status: 12/12 screenshots captured and tracked in git** with SHA256 digests in
[`MANIFEST.json`](./screenshots/MANIFEST.json). Master receipt:
[`../evidence/MANIFEST.json`](../evidence/MANIFEST.json).

Large browser canary artifacts (HAR, Playwright trace, video) are **release-attachment-only**
and gitignored — digests recorded in the master manifest, not committed.

## Viewports

| ID        | Width × height | Use                 |
| --------- | -------------- | ------------------- |
| `desktop` | 1280 × 800     | Primary layout      |
| `narrow`  | 390 × 844      | Responsive / mobile |

## Themes

| ID      | Host theme           |
| ------- | -------------------- |
| `light` | Paperclip light mode |
| `dark`  | Paperclip dark mode  |

## Captured filenames

Pattern: `{surface}-{viewport}-{theme}-{state}.png`

| Filename                                           | Surface                        | Viewport | Theme | State                                   | Status   | SHA256 (prefix) |
| -------------------------------------------------- | ------------------------------ | -------- | ----- | --------------------------------------- | -------- | --------------- |
| `company-page-desktop-light-default.png`           | Company Live Flow page         | desktop  | light | Default loaded fixture                  | **pass** | `d60a0e9b…`     |
| `company-page-desktop-dark-default.png`            | Company Live Flow page         | desktop  | dark  | Default loaded fixture                  | **pass** | `2ff13d14…`     |
| `company-page-narrow-light-default.png`            | Company Live Flow page         | narrow   | light | Default loaded fixture                  | **pass** | `ae7d5a02…`     |
| `company-page-desktop-light-partial-error.png`     | Company Live Flow page         | desktop  | light | Synthetic partial orchestration fail    | **pass** | `18c7c0de…`     |
| `company-page-desktop-light-empty.png`             | Company Live Flow page         | desktop  | light | Client filter empty / no match          | **pass** | `68350a03…`     |
| `company-page-desktop-light-blocked-attention.png` | Company Live Flow page         | desktop  | light | Blocked + attention lane                | **pass** | `12cdb882…`     |
| `issue-tab-desktop-light-in-progress.png`          | Issue Delivery Flight Deck tab | desktop  | light | In-progress + active run (LIV-1)        | **pass** | `3daefbec…`     |
| `issue-tab-desktop-light-review.png`               | Issue Delivery Flight Deck tab | desktop  | light | Pending review (LIV-9)                  | **pass** | `dead8b99…`     |
| `issue-tab-desktop-light-done-not-tracked.png`     | Issue Delivery Flight Deck tab | desktop  | light | Done — merge/deploy not tracked (LIV-8) | **pass** | `c4b24758…`     |
| `issue-task-detail-desktop-light-compact.png`      | Issue task detail view         | desktop  | light | Compact flight deck (LIV-1, default UI) | **pass** | `daac07fa…`     |
| `dashboard-widget-desktop-light-default.png`       | Dashboard widget               | desktop  | light | Summary counts                          | **pass** | `8812492a…`     |
| `project-sidebar-desktop-light-link.png`           | Project sidebar entry          | desktop  | light | Deep link highlight (Atlas Delivery)    | **pass** | `52306cb2…`     |

Full digests: [`screenshots/MANIFEST.json`](./screenshots/MANIFEST.json).

### Capture notes

- **`company-page-desktop-light-partial-error.png`:** Synthetic visual fixture — browser
  intercepted one real `company-flow` response and modified LIV-6 to
  `orchestrationAvailability: unavailable` with `freshness.partial: true`.
- **`company-page-desktop-light-empty.png`:** Filter-empty / no-match state; the company still
  has active roots — not an empty company.
- **Issue `detailTab` screenshots:** Stock default `enableClassicTaskInterface=false` hides the
  tab; captures used `enableClassicTaskInterface=true`.
- **`project-sidebar-desktop-light-link.png`:** Stock default `enableStreamlinedUi=true` hides
  classic `SidebarProjects`; capture used `enableStreamlinedUi=false`.

## Canary fixture (W6)

Isolated stock Paperclip at pin `da0947d`, local_trusted canary `http://127.0.0.1:3120`, company
slug **LIV**:

- 2 projects, 10 agents, 10 issues
- Overlapping subtrees, blocked issue, in-review issue (LIV-9), failed latest run, budget incidents

## Non-screenshot evidence (W6 pass)

| Artifact                                              | Status | Receipt                                                                                  |
| ----------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Playwright trace / video                              | pass   | Release-attachment-only; digests in [`MANIFEST.json`](../evidence/MANIFEST.json)         |
| Browser console (no plugin errors)                    | pass   | [`browser-network-classification.json`](../evidence/browser-network-classification.json) |
| Browser accessibility (keyboard, status text, motion) | pass   | [`browser-accessibility-check.json`](../evidence/browser-accessibility-check.json)       |
| Classified network HAR                                | pass   | Same + gitignored HAR at `docs/evidence/live-flow-w6-browser-canary.har`                 |
| Lifecycle before/after JSON snapshot (no writes)      | pass   | [`lifecycle-before-after.json`](../evidence/lifecycle-before-after.json)                 |
| `paperclipai plugin inspect gloops.live-flow` output  | pass   | [`plugin-inspect.json`](../evidence/plugin-inspect.json) — status `ready`                |

## W6 completion checklist

- [x] All 12 filenames captured at listed viewport/theme
- [x] SHA256 digest recorded per screenshot in `docs/evidence/screenshots/MANIFEST.json`
- [x] [`verification-runbook.md`](./verification-runbook.md) updated from pending to pass + links
- [x] README screenshots section updated with real paths
- [x] Large HAR/trace/video digests recorded; artifacts gitignored (release-attachment-only)
