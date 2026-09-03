# Mapping to upstream issue #2741

Upstream issue: [`paperclipai/paperclip#2741`](https://github.com/paperclipai/paperclip/issues/2741)

**Disclaimer:** `@gloops/paperclip-live-flow` is a **community reference implementation**
published by GLoops. It does **not** imply Paperclip maintainer endorsement, adoption, issue
closure, or **full fulfillment** of #2741. Upstream-facing notes should use **`Refs #2741`**
unless a maintainer directs otherwise.

## What #2741 actually requests

From the verified issue body, #2741 asks for a **visual workflow status overlay** showing who
is doing what and how work flows between agents in real time:

1. **Active task arrows on the org chart** — animated arrows between agents (e.g. Architect →
   Implementer with issue id), color-coded by status (in progress / in review / blocked).
2. **Agent activity badges on org-chart cards** — current task title/identifier, status
   (idle / running / blocked / error), elapsed time on current task.
3. **Pipeline progress bar** — for workflow-configured issues, highlight the active stage
   (Research → Design → Implement → Review → Test → Report).
4. **Dedicated live-flow view** — Kanban or **Sankey-style** diagram of active issues in the
   pipeline, agents per issue, and blocked items highlighted.

The issue explicitly positions the **org chart** as the natural surface for much of this.

## What v0.1.0 implements (partial overlap)

Live Flow is a **read-only plugin** with a **dedicated company Live Flow page** (not an org-chart
overlay). Overlap with #2741 is **partial by design**:

| #2741 theme                            | v0.1.0 delivery                                            | Gap vs #2741                                                                       |
| -------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| See active work across the company     | Company **Live Flow** page + sidebar + dashboard widget    | **Not** on org chart; list/table not Sankey/Kanban diagram                         |
| Agent ↔ agent handoff visualization    | Attention lane + issue links                               | **No** animated inter-agent arrows                                                 |
| Agent card badges (idle/error/elapsed) | Assignee + run elapsed on rows                             | **No** org-chart badges; **no** full idle/error badge model (no public slot/facts) |
| Pipeline stage highlight               | Issue **phase rail** (native or software-delivery profile) | **Not** the org-chart progress bar #2741 describes                                 |
| Blocked / active issues at a glance    | Situation strip + attention lane                           | Same information, different visual idiom                                           |
| Issue-level flow detail                | **Delivery Flight Deck** tab + compact task view           | Deeper than #2741’s org-chart mockup, different surface                            |

**Extensions beyond #2741 asks (useful, not requested):** orchestration approval summaries,
invocation-block lists, budget-incident lanes, and scoped token/cost panels. These are **not**
claims of completing #2741.

## Intentionally omitted (SDK / scope)

| #2741 element                        | Omission                                                   |
| ------------------------------------ | ---------------------------------------------------------- |
| Org-chart overlay                    | No public org-chart UI slot at pin                         |
| Animated arrows between agents       | No authoritative handoff graph API; not implemented        |
| Agent idle/error badges on org cards | No suitable public facts + slot for full badge model       |
| Sankey / Kanban dedicated diagram    | Company page uses an accessible **list/table**, not Sankey |
| Lifecycle mutation                   | Read-only reference — no checkout/invoke/approve           |

Also omitted per delivery contract: merge/deploy/context-window claims without SDK receipts;
all-time spend; recent-done company window; production bootstrap install.

## Public SDK gaps (for upstream consideration)

Observed at pin
[`da0947d`](https://github.com/paperclipai/paperclip/commit/da0947d3582ac7779d6bf11851c9938eca6c5c8c):

- No **org-chart plugin slot** for workflow overlays.
- No **inter-agent active-flow arrow** model on a shared graph API.
- No **agent idle/error badge** fields on org-chart entities.
- `workProducts` / `deployReceipts` not on pinned public read surface (see `plugin-about` omissions).

Maintainers may extend SDK/UI; that is an **upstream decision**, not an endorsement of this repo.

## Community handoff (W8 — not done)

After W7 release: awesome-paperclip plugin entry + #2741 comment with repo, npm, screenshots,
pin SHA, and **honest partial mapping**. **Status:** pending W7.

## Related documents

- [`evidence.md`](./evidence.md) — field-level provenance
- [`delivery-contract.md`](./delivery-contract.md) — product contract
- [`compatibility.md`](./compatibility.md) — pin and support matrix
