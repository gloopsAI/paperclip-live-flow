# Evidence derivation and provenance

This document maps **UI facts** to **public Paperclip plugin SDK** sources. Live Flow never
infers merge, deploy, context utilization, token efficiency, or all-time spend without an
authoritative SDK field.

Upstream type references at pin
[`da0947d3582ac7779d6bf11851c9938eca6c5c8c`](https://github.com/paperclipai/paperclip/commit/da0947d3582ac7779d6bf11851c9938eca6c5c8c):

- SDK worker context: [`packages/plugins/sdk/src/types.ts`](https://github.com/paperclipai/paperclip/blob/da0947d3582ac7779d6bf11851c9938eca6c5c8c/packages/plugins/sdk/src/types.ts)
- Shared issue types: [`packages/shared/src/types/issue.ts`](https://github.com/paperclipai/paperclip/blob/da0947d3582ac7779d6bf11851c9938eca6c5c8c/packages/shared/src/types/issue.ts)

## Status vocabulary

| UI label                | Meaning                               | SDK source                                    |
| ----------------------- | ------------------------------------- | --------------------------------------------- |
| **Available**           | Field loaded from SDK                 | Normalized DTO with `availability: available` |
| **Unavailable**         | Load failed or orchestration missing  | `FieldAvailability: unavailable`              |
| **Not available**       | Installed SDK omits public field      | `not_available`                               |
| **Not tracked**         | No authoritative receipt/work-product | Phase derivation `not_tracked`                |
| **Unavailable** (phase) | SDK shape missing for phase key       | Phase derivation `unavailable`                |

Runs, `done` status, and approvals **never substitute** for merge/deploy/work-product facts.

## Company flow (`company-flow` handler)

| UI fact                                    | Worker read           | Provenance / rule                                                                                                                                                             |
| ------------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue identifier, title, status            | Root row              | `ctx.issues.list` / `ctx.issues.get` → issue fields                                                                                                                           |
| Project name                               | Root row              | `ctx.projects.list` + issue `projectId`                                                                                                                                       |
| Assignee label                             | Root row              | `ctx.agents.list` + issue assignee fields                                                                                                                                     |
| Canonical status                           | Unchanged display     | Issue `status` enum                                                                                                                                                           |
| Current execution stage type / participant | Root row              | Issue `executionState` when available                                                                                                                                         |
| Blocker count                              | Root row              | Subtree relations via orchestration / relations                                                                                                                               |
| Latest run summary                         | Root row              | Orchestration summary runs                                                                                                                                                    |
| Elapsed ms                                 | Derived               | Run timestamps when orchestration available                                                                                                                                   |
| Token/cost columns                         | Root row              | Orchestration aggregate token/cost fields                                                                                                                                     |
| `counts.active`                            | Situation strip       | **`roots.length`** — loaded active roots only; not recent-done sample                                                                                                         |
| `counts.blocked`                           | Situation strip       | Roots with **`canonicalStatus === "blocked"`**                                                                                                                                |
| `counts.inReview`                          | Situation strip       | Roots with **`canonicalStatus === "in_review"`**                                                                                                                              |
| `counts.failedRuns`                        | Situation strip       | Roots whose **`latestRun.status === "failed"`** per loaded root row                                                                                                           |
| Attention lane items                       | Deduped list          | Domain attention rules + orchestration approvals/blocks/incidents                                                                                                             |
| Budget incidents                           | Company + scope lanes | Orchestration budget incidents; scope rules in `budget-incidents.ts`                                                                                                          |
| Scope-unavailable incidents                | Company lane only     | Unknown scope or unresolvable scope ID                                                                                                                                        |
| Deep links                                 | Host navigation       | `useHostNavigation().linkProps(path)` — paths from public conventions (`/issues/{identifier}`, `/live-flow`, query params) in [`format.ts`](../src/ui/company-flow/format.ts) |
| Partial/stale banner                       | Freshness DTO         | Per-source errors from pagination/orchestration failures                                                                                                                      |
| Retained snapshot on error                 | UI hook               | Last good `usePluginData` snapshot + error banner                                                                                                                             |

**Explicit omission — recent done window:** `company-flow` paginates only
`todo`, `in_progress`, `in_review`, `blocked`. No authoritative completion-date filter exists
on public `issues.list` at pin; a bounded “recent done” sample would mislead.

## Issue flow (`issue-flow` handler)

| UI fact                                 | Worker read         | Provenance / rule                                                                     |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| Issue identity                          | Header              | `ctx.issues.get`                                                                      |
| Subtree issues                          | Blocker list/table  | `ctx.issues.getSubtree` (relations, documents, runs, assignees)                       |
| Phase rail (native / software delivery) | Phase facts         | `executionPolicy.stages` + `executionState` + documents/work products                 |
| Blocker relations                       | Blocker section     | Subtree relations                                                                     |
| Run history                             | Runs section        | Subtree runs + orchestration                                                          |
| Approvals                               | Review section      | `orchestration.approvals` (display only — **do not** complete Review/Approval phases) |
| Invocation blocks                       | Attention           | `orchestration.invocationBlocks`                                                      |
| Budget incidents                        | Scoped list         | Orchestration incidents filtered to issue relevance                                   |
| Token/cost panel                        | Costs section       | Orchestration subtree aggregates                                                      |
| Context utilization                     | Fixed message       | **Not exposed** — `CONTEXT_WINDOW_UTILIZATION_MESSAGE` in contracts                   |
| Documents                               | Links section       | Subtree documents                                                                     |
| Work products                           | Only if SDK exposes | `WorkProductFact` when present — no fabrication                                       |

### Phase keys — software delivery profile

Matches [`src/domain/phases/derive.ts`](../src/domain/phases/derive.ts) exactly:

| Phase           | Derivation rule                                                          | States                                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plan**        | **`plan` document existence only** (`documents` key `"plan"`)            | `completed` if plan doc exists; `not_tracked` if none; `unavailable` if `documents` missing on installed SDK                                                                                  |
| **Build**       | **Canonical issue `status` + current/failed runs** (`resolveBuildState`) | `blocked` if status blocked; `failed` if a failed run exists; `active` if active run or `in_progress`; `completed` if `done`; else `not_started`                                              |
| **PR evidence** | **PR work-product only** (`type === "pull_request"`, open or merged)     | `active`/`completed` from work product; `not_tracked` if none; `unavailable` if `workProducts` missing on SDK — **never synthesized**                                                         |
| **Review**      | **Configured native `executionPolicy` review stage + `executionState`**  | `resolveReviewState` — stage type, `currentStageType`, `completedStageIds`, `changes_requested`; **orchestration approval rows are shown in UI but do not by themselves complete this phase** |
| **Approval**    | **Configured native approval stage + `executionState`**                  | `resolveApprovalState` — same separation from approval summary list                                                                                                                           |
| **Merge**       | **Merged PR work-product only** (`pull_request` + `status === "merged"`) | `completed` only with merged fact; `not_tracked` otherwise (including `done` without merge fact) — **never synthesized**                                                                      |
| **Deploy**      | **Deploy receipt only** (`deployReceipts` with `succeeded` / `deployed`) | `completed` only with receipt; `not_tracked` without; `unavailable` if `deployReceipts` missing on SDK — **never synthesized**                                                                |

At the pinned SDK, `workProducts` and `deployReceipts` are **not exposed** on the public
orchestration/subtree surface (`MISSING_PUBLIC_SDK_FIELDS`). PR-evidence, Merge, and Deploy
phases therefore return **`unavailable`** from derivation — never fabricated from runs,
`done`, or approvals.

## Dashboard summary (`dashboard-summary` handler)

| UI fact                          | Source                                       |
| -------------------------------- | -------------------------------------------- |
| Active / blocked / review counts | Aggregated from company-flow snapshot subset |
| Top attention items (max 3)      | Attention derivation                         |
| Open Live Flow link              | Host navigation to company page              |
| Summary unavailable              | Handler error or per-source partial failure  |

## Plugin about (`plugin-about` handler)

| Handler fact                            | Source                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| Plugin id, version, description         | Manifest + package metadata                                                                   |
| Upstream pin SHA / SDK tarball versions | Static `UPSTREAM_PIN` constants                                                               |
| Known public SDK omissions at pin       | Static `MISSING_PUBLIC_SDK_FIELDS` (`workProducts`, `deployReceipts`)                         |
| Host Paperclip version                  | **Not exposed** on public `PluginContext` — operators verify with `paperclipai plugin target` |
| Runtime SDK shape / host version probe  | **None** — handler does not auto-detect mismatch                                              |

Per-handler responses (for example `issue-flow`) may set `compatibility.compatible: false` when
orchestration or required inputs fail for that call. That is **per-source degradation**, not
automatic Paperclip version detection. Future SDK field gaps surface as call failures or
`unavailable`/`not_tracked` facts — not via a global host compatibility probe.

## Token and cost semantics

| Display                        | Rule                                              |
| ------------------------------ | ------------------------------------------------- |
| Input / cached / output tokens | Copied from orchestration summary when present    |
| Cost cents / billing code      | Copied when present                               |
| Scope label                    | `issue`, `subtree`, or **`loaded active roots`**  |
| All-time company spend         | **Not shown** — no authoritative aggregate at pin |
| Token efficiency / savings     | **Not shown** — not computable from totals alone  |

## Intentionally omitted prototype elements

The source plan prototypes suggested additional panels. These are **omitted in v0.1.0** for
lack of authoritative public SDK data:

| Prototype idea                                  | Omission reason                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| Work-product / PR merge receipts as merge proof | Only shown when SDK returns work products; never inferred from runs  |
| Deploy receipts                                 | Same — `not_tracked` / `unavailable` without deploy receipt on SDK   |
| Context-window utilization / remaining context  | Fixed API-not-exposed message                                        |
| Token efficiency / “useful context”             | Not derivable from token totals                                      |
| All-time company spend                          | Orchestration scope labels exclude company-wide historical aggregate |
| Recent-done company window                      | No public list filter — would truncate or mislabel                   |
| Branch / workspace facts                        | Omitted unless exposed on issue/project SDK records                  |
| Org chart overlay                               | No SDK UI slot at pin                                                |

## Orchestration failure degradation

When `ctx.issues.summaries.getOrchestration` fails:

- `orchestrationAvailability` → `unavailable`
- `blockerCount` → `null` (UI: “Unavailable”, not `0`)
- Phase facts → `unavailablePhaseFacts` with explanation
- Token/cost → `unavailableTokenCost`
- Approvals / invocation blocks collections → collection-level `unavailable`

Other roots/sections remain usable (partial snapshot).

## Provenance DTO shape

Each derived phase/attention item includes `source: ProvenanceSource[]`:

```typescript
{
  kind: string;
  entityId: string;
  field: string;
}
```

See [`src/contracts/common.ts`](../src/contracts/common.ts).

## Evidence receipts (W6+)

Browser canary screenshots, network classification, lifecycle before/after snapshots, and
browser accessibility checks **passed at W6**. Linked receipts:
[`evidence/MANIFEST.json`](./evidence/MANIFEST.json). npm registry install replay remains
**pending W7**.

### Foreground refresh (UI)

Company-flow polling uses `useForegroundRefresh` with host bridge `refresh()`. While
`usePluginData` reports `loading: true`, timer and visibility refreshes are suppressed to avoid
overlapping bridge calls; refresh resumes when loading completes.
