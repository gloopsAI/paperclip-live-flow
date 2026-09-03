# Privacy and data handling

Live Flow `@gloops/paperclip-live-flow` is a read-only Paperclip plugin. This document
describes what data the plugin accesses, how it moves, and what it does **not** do.

## Summary

| Topic                            | v0.1.0 behavior                                         |
| -------------------------------- | ------------------------------------------------------- |
| Telemetry / analytics            | **None** — no external analytics SDKs                   |
| Outbound HTTP from worker        | **None** — no `http.outbound` capability                |
| Direct UI HTTP to Paperclip APIs | **Prohibited** — UI uses `usePluginData` bridge only    |
| Database / private API access    | **None** — no `database.namespace.*`, no private routes |
| Data leaving Paperclip           | **No** — shown only inside authenticated host UI        |
| Persistent plugin storage        | **None** in v0.1.0 — no plugin DB migrations            |
| Company scope                    | Host-injected `companyId` on every worker handler       |

## Trusted install caveat

Paperclip treats plugin **workers and UI as trusted same-origin code** (upstream
[PLUGIN_AUTHORING_GUIDE — Current reality](https://github.com/paperclipai/paperclip/blob/da0947d3582ac7779d6bf11851c9938eca6c5c8c/doc/plugins/PLUGIN_AUTHORING_GUIDE.md)).

- Manifest capabilities **gate worker host APIs** but **do not sandbox UI**.
- Installing a plugin grants it the trust level of the **target Paperclip instance**.
- **Local-path installs** execute code from disk without signature verification — use only
  on isolated development/canary hosts you control.
- **npm installs** pin a published artifact; still trusted code on the instance.

Operators should run `paperclipai plugin target` before install and avoid production hosts
for untrusted packages.

## Data accessed (read-only)

Through public `PluginContext` SDK only:

| SDK surface                               | Purpose                                          |
| ----------------------------------------- | ------------------------------------------------ |
| `ctx.issues.list` / `get` / `getSubtree`  | Active and issue-detail views                    |
| `ctx.issues.summaries.getOrchestration`   | Runs, costs, approvals, blocks, incidents        |
| `ctx.projects.list` / `get`               | Project labels and filters                       |
| `ctx.agents.list` / `get`                 | Assignee and participant labels                  |
| Issue relations, documents, work products | Blockers, links, merge/deploy facts when present |

No direct SQL, filesystem reads of Paperclip data dirs, or undocumented HTTP endpoints.

## Company scope and authentication

- The Paperclip host authenticates the board session.
- On `ctx.data.register` handlers, the host injects **`params.companyId`** after UI parameters,
  overriding any client-supplied value.
- Handlers reject missing scope and cross-company entities before returning DTOs.
- The UI **does not send `companyId`** in plugin data requests.

## UI bridge state and refresh

| Mechanism                             | Behavior                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------- |
| Worker `HandlerCache`                 | In-memory per company+handler+args; TTL **≤ 15s**; not persisted           |
| `usePluginData`                       | Current bridge payload per mount; may show last success on refresh error   |
| Foreground refresh timer              | Polls while tab visible — **15s** base, **30s** first backoff, **60s** cap |
| Hidden tab                            | Timers stop — no background polling                                        |
| Disk / localStorage / plugin state DB | **Not used** in v0.1.0                                                     |

No TTL persistence across browser sessions beyond normal Paperclip host session.

## What is not collected

- No cookies sent to third parties
- No crash reporting endpoints
- No license phone-home
- No embedding of operator credentials in the repository or published tarball

## Operator responsibilities

- Do not commit API keys, session tokens, or canary screenshots with private data to public
  branches (W6 evidence hygiene).
- Use isolated canary instances for browser verification ([verification-runbook.md](./verification-runbook.md)).
- Report cross-company leakage or trust-boundary bypass via [`SECURITY.md`](../SECURITY.md).

## Related documents

- [`delivery-contract.md`](./delivery-contract.md) — manifest boundary
- [`evidence.md`](./evidence.md) — honest unavailable semantics
- [`operator-commands.md`](./operator-commands.md) — install trust warnings
