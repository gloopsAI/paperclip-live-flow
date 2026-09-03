# Compatibility and support matrix

## Upstream Paperclip pin

| Artifact                         | Pin                                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Paperclip source commit**      | [`da0947d3582ac7779d6bf11851c9938eca6c5c8c`](https://github.com/paperclipai/paperclip/commit/da0947d3582ac7779d6bf11851c9938eca6c5c8c) |
| **`@paperclipai/plugin-sdk`**    | **1.0.0** (vendored in `.paperclip-sdk/paperclipai-plugin-sdk-1.0.0.tgz`)                                                              |
| **`@paperclipai/shared`**        | **0.3.1** (vendored in `.paperclip-sdk/paperclipai-shared-0.3.1.tgz`)                                                                  |
| **Plugin manifest `apiVersion`** | `1`                                                                                                                                    |
| **Plugin package version**       | `0.1.0` (unreleased)                                                                                                                   |

Upstream authoring references (immutable links at pin):

- [PLUGIN_AUTHORING_GUIDE.md](https://github.com/paperclipai/paperclip/blob/da0947d3582ac7779d6bf11851c9938eca6c5c8c/doc/plugins/PLUGIN_AUTHORING_GUIDE.md)
- [LOCAL_PLUGIN_DEVELOPMENT.md](https://github.com/paperclipai/paperclip/blob/da0947d3582ac7779d6bf11851c9938eca6c5c8c/doc/plugins/LOCAL_PLUGIN_DEVELOPMENT.md)
- [packages/plugins/sdk/src/types.ts](https://github.com/paperclipai/paperclip/blob/da0947d3582ac7779d6bf11851c9938eca6c5c8c/packages/plugins/sdk/src/types.ts)
- [packages/shared/src/types/issue.ts](https://github.com/paperclipai/paperclip/blob/da0947d3582ac7779d6bf11851c9938eca6c5c8c/packages/shared/src/types/issue.ts)

If upstream `master` advances beyond the pin, re-read SDK surfaces, update this document and
the static `plugin-about` pin constants, and confirm the running host with
`paperclipai plugin target` before claiming compatibility.

## Node and package manager

| Tool             | Requirement | Source                            |
| ---------------- | ----------- | --------------------------------- |
| **Node.js**      | `>=24.11.0` | `package.json` `engines`          |
| **pnpm**         | `9.15.4`    | `package.json` `packageManager`   |
| **React (peer)** | `>=18`      | `package.json` `peerDependencies` |

Scaffold preflight recorded Node **24.18.0** for `paperclipai plugin init` (see
[`architecture.md`](./architecture.md)).

## Tested versus merely targeted

| Layer                                   | Status                    | Evidence                                        |
| --------------------------------------- | ------------------------- | ----------------------------------------------- |
| Unit/domain normalization               | **Tested locally**        | `pnpm test`, table-driven phase/attention tests |
| Worker RPC + company scope              | **Tested locally**        | Worker handler tests via SDK RPC path           |
| UI components + a11y patterns           | **Tested locally**        | Vitest + Testing Library                        |
| UI boundary (no direct HTTP)            | **Tested locally**        | `pnpm check:ui-boundary`                        |
| Coverage gate                           | **Tested locally**        | `pnpm test:coverage` (~92% at W4 completion)    |
| Build + pack contents                   | **Tested locally**        | `pnpm build`, `pnpm pack:check`                 |
| Isolated stock Paperclip browser canary | **Targeted — pending W6** | No receipt yet                                  |
| npm registry install smoke              | **Targeted — pending W7** | Package unpublished                             |
| Production Paperclip host               | **Out of scope**          | ADR 0040 bootstrap boundary                     |

“Targeted” means designed and documented against upstream behavior; “tested” means executed
with recorded pass/fail in this repository or W6 canary.

## Dynamic install limitations

- **Local-path install** requires the Paperclip server to read the absolute filesystem path;
  the server must run where that path is visible.
- **npm install** requires registry publish (W7) and matching SDK/host version band.
- **No autocompat** with arbitrary future Paperclip commits — after host upgrade, confirm
  target with `paperclipai plugin target` and re-run local gates; `plugin-about` does **not**
  runtime-detect host/SDK version mismatch.
- **Branch-only host routes:** installing into a long-lived host on older code produces false
  “missing route” failures; use isolated branch/canary server per upstream
  [LOCAL_PLUGIN_DEVELOPMENT.md — Targeting a branch](https://github.com/paperclipai/paperclip/blob/da0947d3582ac7779d6bf11851c9938eca6c5c8c/doc/plugins/LOCAL_PLUGIN_DEVELOPMENT.md#targeting-a-branch--issue-workspace-runtime).

## Fail-closed behavior

| Condition                                 | Behavior                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| Missing host-injected `params.companyId`  | Handler error; no reads                                                        |
| UI-supplied `companyId` (same param name) | Overridden by host; tests assert override                                      |
| Cross-company `issueId`                   | Non-disclosing not-found                                                       |
| Entity with foreign `companyId`           | Rejected before response assembly                                              |
| Orchestration summary failure             | `orchestrationAvailability: unavailable`; nullable counts; no synthetic zeros  |
| SDK field absent on installed host        | `not_available` / `unavailable` — no inference                                 |
| Partial list pagination failure           | `freshness.partial: true` + per-source errors                                  |
| Per-handler SDK read failure              | Per-source errors; `unavailable` / partial freshness — no global version probe |

## UI slots and capabilities (v0.1.0)

Registered read capabilities (exact manifest list):

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

Registered UI slots: `page`, `sidebar`, `projectSidebarItem`, `dashboardWidget`, `detailTab`,
`taskDetailView`.

**Not registered:** `routeSidebar`, org chart, plugin actions, write capabilities, outbound HTTP.

## Support policy

| Version | Support                                 |
| ------- | --------------------------------------- |
| `0.1.x` | Best-effort community reference; no SLA |

Report defects via [GitHub Issues](https://github.com/gloopsAI/paperclip-live-flow/issues).
Security issues via [`SECURITY.md`](../SECURITY.md).

Upstream Paperclip defects: [paperclipai/paperclip](https://github.com/paperclipai/paperclip/issues).

## Refresh and cache (compatibility note)

**Foreground refresh (UI):** **15s** base interval; first error backoff **30s**
(`base × 2^1`); **60s** cap (`useForegroundRefresh` / `MAX_BACKOFF_MS`).

**Worker cache:** in-memory `HandlerCache` keyed by **company + handler + args**;
**TTL ≤ 15s** (`CACHE_TTL_MS` / `sharedHandlerCache`). Not persisted to disk or plugin DB.

**UI hook state:** `usePluginData` holds the current bridge payload per mount; may retain the
last successful snapshot when a refresh errors. **No** persistent UI cache, localStorage, or
plugin database namespace in `0.1.0`.
