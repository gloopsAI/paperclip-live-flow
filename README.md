# Live Flow

Read-only workflow visibility for Paperclip — a community reference implementation for
[`paperclipai/paperclip#2741`](https://github.com/paperclipai/paperclip/issues/2741).

**Package:** `@gloops/paperclip-live-flow`

**Manifest ID:** `gloops.live-flow`

**License:** MIT

## What it does

Live Flow projects active Paperclip work, native execution stages, blockers, runs, approvals,
and available cost/token facts without leaving the Paperclip UI. It is an additive,
read-only plugin — not a workflow engine, lifecycle writer, or Paperclip fork.

See [`docs/delivery-contract.md`](./docs/delivery-contract.md) for the full product contract
and [`docs/architecture.md`](./docs/architecture.md) for upstream compatibility and preflight
evidence.

## Development

Requires Node `24.18.0` and pnpm `9.15.4`.

```bash
pnpm install
pnpm dev            # watch builds (worker, manifest, UI → dist/)
pnpm dev:ui         # local UI dev server with hot reload
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm pack:check     # inspect publish tarball contents
```

Local installs run trusted code from your checkout. Browser canaries must target an
**isolated** stock Paperclip instance — not production.

## SDK snapshot

This repository vendors the scaffold SDK snapshot under `.paperclip-sdk/` so a clean clone
reproduces the upstream pin documented in `docs/architecture.md`. Published npm packages
exclude that directory.

## Install into Paperclip (local path)

After `pnpm build`:

```bash
paperclipai plugin install .
```

Use an isolated stock Paperclip checkout for verification. Production installation is a
separate operator decision outside the bootstrap contract.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Agents and reviewers start with
[`AGENTS.md`](./AGENTS.md).
