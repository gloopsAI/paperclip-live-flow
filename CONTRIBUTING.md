# Contributing

Thank you for your interest in Paperclip Live Flow.

## Scope

This repository ships a **read-only** Paperclip plugin. Contributions must preserve the
boundary in [`docs/delivery-contract.md`](./docs/delivery-contract.md):

- no lifecycle-write capabilities or host mutation;
- no direct Paperclip HTTP/action calls from UI code;
- no Paperclip core patches or private API usage.

## Development setup

Requires Node `24.18.0` and pnpm `9.15.4`.

```bash
pnpm install
pnpm dev            # watch builds
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

The scaffold snapshots `@paperclipai/plugin-sdk` and `@paperclipai/shared` in
`.paperclip-sdk/` for reproducible local installs. Published npm packages contain only
built artifacts listed in `package.json` `files`.

## Pull requests

1. Branch from `main`.
2. Keep changes scoped to the issue or worker packet.
3. Run the full local gate before requesting review:

   ```bash
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm test:coverage
   pnpm build
   pnpm pack:check
   ```

4. Describe upstream/SDK compatibility impact and any honest-evidence limitations.

## Community reference

Live Flow targets
[`paperclipai/paperclip#2741`](https://github.com/paperclipai/paperclip/issues/2741) as a
community reference implementation. Use `Refs #2741` in upstream-facing notes unless a
maintainer directs otherwise.
