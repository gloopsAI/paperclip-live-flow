# Screenshot inventory (planned W6)

**Status: all entries pending W6.** No files in `docs/evidence/screenshots/` exist yet. W6
must capture, commit (or attach to release), and replace `pending W6` with path + SHA256
digest.

Storage plan (W6): `docs/evidence/screenshots/` (gitignored until capture — or release-attached
only per operator policy).

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

## Planned filenames

Pattern: `{surface}-{viewport}-{theme}-{state}.png`

| Filename                                           | Surface                        | Viewport | Theme | State                                | Status         |
| -------------------------------------------------- | ------------------------------ | -------- | ----- | ------------------------------------ | -------------- |
| `company-page-desktop-light-default.png`           | Company Live Flow page         | desktop  | light | Default loaded fixture               | **pending W6** |
| `company-page-desktop-dark-default.png`            | Company Live Flow page         | desktop  | dark  | Default loaded fixture               | **pending W6** |
| `company-page-narrow-light-default.png`            | Company Live Flow page         | narrow   | light | Default loaded fixture               | **pending W6** |
| `company-page-desktop-light-partial-error.png`     | Company Live Flow page         | desktop  | light | Partial orchestration failure banner | **pending W6** |
| `company-page-desktop-light-empty.png`             | Company Live Flow page         | desktop  | light | No active roots                      | **pending W6** |
| `company-page-desktop-light-blocked-attention.png` | Company Live Flow page         | desktop  | light | Blocked + attention lane             | **pending W6** |
| `issue-tab-desktop-light-in-progress.png`          | Issue Delivery Flight Deck tab | desktop  | light | In-progress + active run             | **pending W6** |
| `issue-tab-desktop-light-review.png`               | Issue Delivery Flight Deck tab | desktop  | light | Pending review stage                 | **pending W6** |
| `issue-tab-desktop-light-done-not-tracked.png`     | Issue Delivery Flight Deck tab | desktop  | light | Done — merge/deploy not tracked      | **pending W6** |
| `issue-task-detail-desktop-light-compact.png`      | Issue task detail view         | desktop  | light | Compact flight deck                  | **pending W6** |
| `dashboard-widget-desktop-light-default.png`       | Dashboard widget               | desktop  | light | Summary counts                       | **pending W6** |
| `project-sidebar-desktop-light-link.png`           | Project sidebar entry          | desktop  | light | Deep link highlight                  | **pending W6** |

## Capture states (W6 fixture requirements)

Canary data must include at minimum (source plan W4/W6):

- ≥2 projects, ≥9 agents
- Overlapping subtrees
- One blocked issue
- One in-review issue
- One failed latest run
- Relevant and unrelated budget incidents

## Non-screenshot evidence (same W6 pass)

| Artifact                                             | Status         |
| ---------------------------------------------------- | -------------- |
| Playwright trace / video                             | **pending W6** |
| Browser console log (clean)                          | **pending W6** |
| Classified network HAR (plugin-initiated only)       | **pending W6** |
| Lifecycle before/after JSON snapshot (no writes)     | **pending W6** |
| `paperclipai plugin inspect gloops.live-flow` output | **pending W6** |

## W6 completion checklist

- [ ] All filenames above captured at listed viewport/theme
- [ ] SHA256 digest recorded per file in release receipt or `docs/evidence/screenshots/MANIFEST.json`
- [ ] [`verification-runbook.md`](./verification-runbook.md) updated from pending to pass + links
- [ ] README screenshots section updated with real paths (not “pending W6”)

Until then, README and release materials must **not** imply screenshots exist.
