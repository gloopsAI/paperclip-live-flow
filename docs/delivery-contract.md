# Live Flow delivery contract

**Version:** 0.1.0 bootstrap

**Authority:** [ADR 0040](https://github.com/gloopsAI/autonomy-strategy/blob/b4e11b0461fccd5df2c01078c6c525027063a219/docs/adr/0040-paperclip-live-flow-cursor-bootstrap-exception.md)

**Source plan:** [2026-09-03 implementation plan](https://github.com/gloopsAI/autonomy-strategy/blob/b4e11b0461fccd5df2c01078c6c525027063a219/docs/program/PAPERCLIP_LIVE_FLOW_PLUGIN_CURSOR_IMPLEMENTATION_PLAN_2026-09-03.md)

This document is the self-contained execution contract for the `@gloops/paperclip-live-flow`
repository. Workers and reviewers use it instead of strategy-repository paths.

## Bootstrap boundary (ADR 0040)

The initial delivery of `gloopsAI/paperclip-live-flow` from repository creation through the
first public `v0.1.0` release and community submission may run under a bounded Cursor CLI
contract outside Paperclip. This exception:

- applies only to this plugin bootstrap;
- expires when `v0.1.0` is published with community submission, Zach abandons the plugin,
  or Zach revokes the exception; and
- does **not** authorize touching an SDLC Paperclip already owns, production Paperclip
  installation, or any lifecycle-write capability.

Subsequent feature work returns to the normal Paperclip-owned path unless Zach records
another explicit decision. GitHub is the delivery ledger for this bootstrap; no synthetic
Paperclip issue or receipt is created.

## Product outcome

Ship a standalone, stock-compatible Paperclip plugin that answers:

1. **Company view:** what work is active, where it is in the native lifecycle, who owns it,
   what is blocked, and what needs attention.
2. **Issue view:** what happened end to end, which native execution stage is current, which
   runs and dependencies support that claim, and which token/cost facts are available.

Missing merge, deploy, or context-window evidence must remain visibly missing. Issue `done`
must never be presented as merged or deployed.

## Product surfaces (v0.1.0 target)

| Surface                                                         | Purpose                                               |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| Company **Live Flow** page + sidebar                            | Situation strip, active flow, attention lane, filters |
| Issue **Delivery Flight Deck** (`detailTab` + `taskDetailView`) | Phase rail, blockers, runs, approvals, costs          |
| Dashboard widget                                                | Active/blocked/review counts and top attention items  |
| Project sidebar item                                            | Deep-link to company page with project filter state   |

Visual prototypes in the source plan are directional only. Match Paperclip host tokens and
components from `@paperclipai/plugin-sdk/ui`.

## Manifest and read boundary

Maximum allowed read/UI capabilities:

```text
issues.read
issues.orchestration.read
issue.subtree.read
issue.relations.read
issue.documents.read
agents.read
projects.read
ui.page.register
ui.sidebar.register
ui.dashboardWidget.register
ui.detailTab.register
```

Allowed UI slots: `page`, `sidebar`, `routeSidebar` (only if used), `dashboardWidget`,
`detailTab` (issue), `taskDetailView` (issue), `projectSidebarItem`.

Forbidden: every `*.write`, `*.create`, `*.update`, `*.checkout`, `*.wakeup`, `*.respond`,
`agents.invoke`, `agents.pause`, `agents.resume`, `jobs.schedule`, `events.emit`,
`http.outbound`, `secrets.read-ref`, `database.namespace.*`, managed resources, tools,
sessions, webhooks, and plugin actions in `0.1.0`.

Manifest capabilities do not sandbox same-origin plugin UI. Enforce read-only UI with source,
lint, built-bundle, and browser-network checks.

### UI data and navigation invariants

- Read Paperclip data only through `usePluginData`.
- Navigate Paperclip-internal routes only through `useHostNavigation()`.
- Do not use `fetch`, `XMLHttpRequest`, `navigator.sendBeacon`, `WebSocket`, `EventSource`,
  form submission to host routes, or HTTP client dependencies for Paperclip APIs.
- Do not construct or embed ordinary Paperclip API/action route strings in plugin UI.

## Worker data handlers and `companyId` invariant

Expose only read handlers (no plugin actions in `0.1.0`):

```text
company-flow({ companyId })
issue-flow({ companyId, issueId })
dashboard-summary({ companyId })
plugin-about({ companyId })
```

The UI does not supply `companyId`. On `ctx.data.register`, the host injects the
authenticated company ID into handler `params` after UI parameters, overriding any
same-named client value. Every handler requires and validates that host-injected
`params.companyId` before reading. Tests invoke the SDK worker RPC path to prove override,
missing-scope failure, and cross-company not-found behavior.

## Evidence and phase truth

- Canonical issue status is displayed unchanged.
- `executionPolicy.stages` and `executionState` are authoritative only for native review and
  approval stages they name.
- **Merge** requires an authoritative merged-PR fact; **Deploy** requires an authoritative
  deployment/receipt fact.
- Display aggregate token/cost fields exactly as returned by orchestration summaries.
- Do not calculate context-window utilization, remaining context, or token efficiency.
- Issue view must state: **"Context-window utilization is not exposed by the current
  Paperclip plugin API."**

Refresh is read-only projection polling (default 15s foreground interval). No scheduled
jobs, host monitors, lifecycle event writers, or persistent caches in `0.1.0`.

## Upstream compatibility pin

Implementation targets unmodified upstream Paperclip at
[`da0947d3582ac7779d6bf11851c9938eca6c5c8c`](https://github.com/paperclipai/paperclip/commit/da0947d3582ac7779d6bf11851c9938eca6c5c8c)
with `@paperclipai/plugin-sdk` `1.0.0` and `@paperclipai/shared` `0.3.1`. No Paperclip core
patch, private route, direct database read, or `gloopsAI/paperclip` runtime dependency.

See `docs/architecture.md` for preflight evidence and scaffold lineage.

## Documentation (W5)

Operator and evidence docs (W6 browser canary **passed**; registry publish **pending W7**):

- [`compatibility.md`](./compatibility.md)
- [`evidence.md`](./evidence.md)
- [`privacy.md`](./privacy.md)
- [`issue-2741.md`](./issue-2741.md)
- [`operator-commands.md`](./operator-commands.md)
- [`verification-runbook.md`](./verification-runbook.md)
- [`screenshot-inventory.md`](./screenshot-inventory.md)

## Verification gates

Local required gates:

```text
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm pack:check
```

Release also requires isolated stock-Paperclip browser canary, independent exact-head review,
protected merge, digest-pinned GitHub release, and npm publish with provenance when available.

## Model roles

| Role                | Model                          | Owns                                                                            |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| Parent              | `gpt-5.6-sol-high`             | Contract, routing, integration, git publication, exact-head acceptance, release |
| Composer            | `composer-2.5`                 | Settled UI, tests, docs, packaging, narrow repairs                              |
| Grok medium         | `cursor-grok-4.6-medium`       | Data aggregation, cross-module wiring, ordinary debugging                       |
| Grok high           | `cursor-grok-4.6-high`         | Hard SDK/correctness problems only                                              |
| Acceptance reviewer | `gpt-5.6-sol-high` (read-only) | Independent exact-head adversarial review                                       |

Only one write-capable worker may edit a shared checkout at a time. Workers record actual
model identity when Cursor exposes it; otherwise report `unverified`.

## Release and stop conditions

Terminal bootstrap completion requires repository verification, independent review `APPROVE`,
protected merge, digest-pinned release/npm artifact, and isolated canary install proof.

Stop and escalate to the parent or Zach when:

- work collides with Paperclip-owned SDLC;
- a write capability, core patch, private API, or direct DB read is required;
- upstream removes a required public read/UI surface;
- production Paperclip installation is proposed; or
- a security or data-exposure issue changes the trust boundary.

Architecture changes require a parent decision delta; only Zach may widen ADR 0040 authority.
