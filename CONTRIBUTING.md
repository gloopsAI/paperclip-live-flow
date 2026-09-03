# Contributing

Thank you for your interest in Paperclip Live Flow.

## Scope

This repository ships a **read-only** Paperclip plugin. Contributions must preserve the
boundary in [`docs/delivery-contract.md`](./docs/delivery-contract.md):

- no lifecycle-write capabilities or host mutation;
- no direct Paperclip HTTP/action calls from UI code;
- no Paperclip core patches or private API usage;
- no telemetry or external data exfiltration.

## Development setup

Requires Node **≥24.11.0** and pnpm **9.15.4** (see `package.json`).

```bash
pnpm install
pnpm dev            # watch builds → dist/
pnpm dev:ui         # optional UI HMR on :4177
```

The scaffold snapshots `@paperclipai/plugin-sdk` and `@paperclipai/shared` in
`.paperclip-sdk/` for reproducible local installs. Published npm packages contain only built
artifacts listed in `package.json` `files`.

## Pull requests

1. Branch from `main`.
2. Keep changes scoped to the agreed worker packet or issue.
3. Run the **full local gate** before requesting review:

   ```bash
   pnpm install --frozen-lockfile
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm test:coverage
   pnpm build
   pnpm check:ui-boundary
   pnpm pack:check
   ```

4. Describe upstream/SDK compatibility impact and honest-evidence limitations.
5. Do not claim browser canary or release completion — cite [`docs/verification-runbook.md`](./docs/verification-runbook.md).

## Documentation

When changing behavior visible to operators, update the matching doc:

| Topic               | Document                                                   |
| ------------------- | ---------------------------------------------------------- |
| Product contract    | [`docs/delivery-contract.md`](./docs/delivery-contract.md) |
| SDK pin / preflight | [`docs/architecture.md`](./docs/architecture.md)           |
| Compatibility       | [`docs/compatibility.md`](./docs/compatibility.md)         |
| Field provenance    | [`docs/evidence.md`](./docs/evidence.md)                   |
| Privacy             | [`docs/privacy.md`](./docs/privacy.md)                     |
| #2741 mapping       | [`docs/issue-2741.md`](./docs/issue-2741.md)               |
| CLI install         | [`docs/operator-commands.md`](./docs/operator-commands.md) |

Agents and reviewers start with [`AGENTS.md`](./AGENTS.md).

## Community reference

Live Flow targets
[`paperclipai/paperclip#2741`](https://github.com/paperclipai/paperclip/issues/2741) as a
community reference implementation. Use `Refs #2741` in upstream-facing notes unless a
maintainer directs otherwise.

## Model roles (bootstrap)

| Role            | Declared model                                             |
| --------------- | ---------------------------------------------------------- |
| Parent          | `gpt-5.6-sol-high`                                         |
| Composer worker | `composer-2.5`                                             |
| Grok medium     | `cursor-grok-4.6-medium` (diagnostics only when available) |

Record actual runtime model identity when Cursor exposes it; otherwise report **unverified**.
