# Operator commands (pinned upstream)

All commands below match upstream Paperclip at commit
[`da0947d3582ac7779d6bf11851c9938eca6c5c8c`](https://github.com/paperclipai/paperclip/commit/da0947d3582ac7779d6bf11851c9938eca6c5c8c).

**Authoritative sources:**

- [LOCAL_PLUGIN_DEVELOPMENT.md](https://github.com/paperclipai/paperclip/blob/da0947d3582ac7779d6bf11851c9938eca6c5c8c/doc/plugins/LOCAL_PLUGIN_DEVELOPMENT.md)
- [PLUGIN_AUTHORING_GUIDE.md](https://github.com/paperclipai/paperclip/blob/da0947d3582ac7779d6bf11851c9938eca6c5c8c/doc/plugins/PLUGIN_AUTHORING_GUIDE.md)

## Trust and target warnings

- **Plugin UI is trusted same-origin JavaScript** inside the Paperclip host application.
  Manifest capabilities gate worker APIs but **do not sandbox UI code**.
- **Installs are instance-level.** The plugin runs with the trust boundary of the Paperclip
  server you install into.
- **Local-path installs execute trusted code from disk** with no signature check — install
  only code you control.
- **Do not use production Paperclip** for bootstrap verification. Use an **isolated stock
  checkout** on a dedicated port (see [verification-runbook.md](./verification-runbook.md)).
- Always run **`paperclipai plugin target`** (or read install-time health diagnostics)
  before trusting install results.

## CLI target resolution order

Upstream resolves API base URL (highest priority first):

1. `--api-base <url>` on the command
2. `PAPERCLIP_API_URL` environment variable
3. Active CLI context profile `apiBase`
4. Default `http://localhost:3100` (host/port from server config)

## Target diagnostics (required before install)

```bash
paperclipai plugin target
```

Example output (from upstream docs):

```text
Target Paperclip: http://127.0.0.1:3100
  health: status=ok  version=0.1.0  mode=local_trusted  exposure=private
```

For an isolated canary on a non-default port:

```bash
export PAPERCLIP_API_URL=http://127.0.0.1:3120
paperclipai plugin target
# or
paperclipai plugin target --api-base http://127.0.0.1:3120
```

Install and upgrade commands accept the same `--api-base` / `PAPERCLIP_API_URL`.

Pass `--no-verify-target` only when you explicitly accept skipping the health probe.

## Isolated canary Paperclip (development verification)

Use **separate terminals** — `pnpm dev` is a long-running watcher and must not block install.

```bash
# Terminal 1 — stock Paperclip checkout (pinned SHA or compatible release)
PAPERCLIP_SERVER_PORT=3120 pnpm paperclipai run

# Terminal 2 — target, build, install (one-shot)
export PAPERCLIP_API_URL=http://127.0.0.1:3120
paperclipai plugin target
cd /path/to/paperclip-live-flow
pnpm install --frozen-lockfile && pnpm build
paperclipai plugin install /absolute/path/to/paperclip-live-flow

# Terminal 3 (optional) — watch rebuilds after install
cd /path/to/paperclip-live-flow
pnpm dev
```

Relative path from plugin root also works:

```bash
paperclipai plugin install .
```

## Local path install

After `pnpm build` (with `pnpm dev` recommended for reload):

```bash
paperclipai plugin install /absolute/path/to/paperclip-live-flow
# explicit flag (optional — CLI auto-detects local paths):
paperclipai plugin install /absolute/path/to/paperclip-live-flow --local
```

Upstream reload semantics:

- Worker: esbuild → `dist/worker.js` → host debounces ~500ms → worker restart
- Manifest: `dist/manifest.js` re-read on change
- UI: `dist/ui/` reload on next mount; optional `pnpm dev:ui` for HMR

## npm package install

After W7 publish:

```bash
paperclipai plugin install @gloops/paperclip-live-flow
paperclipai plugin install @gloops/paperclip-live-flow@0.1.0
```

Version pin uses npm registry resolution; produces a reproducible install record per upstream.

## Inspect and list

```bash
paperclipai plugin list
paperclipai plugin inspect gloops.live-flow
paperclipai plugin list --json
paperclipai plugin inspect gloops.live-flow --json
```

Expect `ready` status after successful install. Use `inspect` for full last error text.

**Note:** `paperclipai plugin doctor <plugin-id>` appears in upstream spec/roadmap docs but
is **not** documented as implemented in the pinned LOCAL_PLUGIN_DEVELOPMENT guide. Use
`inspect` and general `paperclipai doctor` for diagnostics until upstream documents plugin
doctor.

## Upgrade

```bash
paperclipai plugin upgrade gloops.live-flow
# optional explicit version when published:
paperclipai plugin upgrade gloops.live-flow 0.1.0
```

Upstream upgrade shuts down the old worker, installs the new version, and starts a fresh worker.

## Disable and enable

Pause without removing:

```bash
paperclipai plugin disable gloops.live-flow
paperclipai plugin enable gloops.live-flow
```

## Uninstall and state purge

```bash
paperclipai plugin uninstall gloops.live-flow
```

**Warning:** add `--force` to **purge plugin state and settings immediately**:

```bash
paperclipai plugin uninstall gloops.live-flow --force
```

Without `--force`, upstream retains plugin data for a grace period. Use `--force` only when
you intend to destroy plugin-local state on that Paperclip instance.

## Optional UI dev server (local iteration)

From plugin package (upstream scaffold script):

```bash
pnpm dev:ui
# paperclip-plugin-dev-server --root . --ui-dir dist/ui --port 4177
```

Serves `http://127.0.0.1:4177` with HMR; optional `devUiUrl` in manifest during development.

## Production installation

**Not authorized** under ADR 0040 bootstrap. Production install is a separate operator decision
after W7 release evidence (digest-pinned npm artifact + isolated canary replay). This
document does not advise bootstrap install into long-lived production hosts.
