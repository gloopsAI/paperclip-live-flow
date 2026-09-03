# AGENTS.md — Paperclip Live Flow plugin

This repository delivers `@gloops/paperclip-live-flow`, a read-only Paperclip plugin governed
by a bounded Cursor bootstrap exception. **Read the contract before editing.**

## Start here

1. [`docs/delivery-contract.md`](./docs/delivery-contract.md) — bootstrap boundary, product
   surfaces, manifest/read boundary, worker invariants, verification, model roles, stop
   conditions.
2. [`docs/architecture.md`](./docs/architecture.md) — upstream pin, preflight evidence,
   trust and data flow.
3. [ADR 0040](https://github.com/gloopsAI/autonomy-strategy/blob/b4e11b0461fccd5df2c01078c6c525027063a219/docs/adr/0040-paperclip-live-flow-cursor-bootstrap-exception.md) —
   owner authorization for this one-time bootstrap.

## Model routing

Project-scoped workers live in [`.cursor/agents/`](./.cursor/agents/). The parent runs
`gpt-5.6-sol-high` and delegates bounded packets by task class:

| Worker                          | Use for                                            |
| ------------------------------- | -------------------------------------------------- |
| `live-flow-composer`            | Settled UI, tests, docs, packaging, narrow repairs |
| `live-flow-grok-medium`         | Data aggregation, integration, ordinary debugging  |
| `live-flow-grok-high`           | Hard SDK/correctness problems only                 |
| `live-flow-acceptance-reviewer` | Read-only exact-head acceptance                    |

Only one write-capable worker may edit a shared checkout at a time.

## Hard invariants

- Additive read-only plugin only; no lifecycle writes, schedulers, or shadow queues.
- UI reads Paperclip data only through `usePluginData`; navigates only through
  `useHostNavigation`.
- Stock upstream Paperclip SDK only; no core patch, private route, or direct DB read.
- Missing authoritative facts stay visibly unavailable; never infer merge, deploy, or
  context-window utilization.

## Done for this bootstrap

Full SDLC completion for `v0.1.0` means merged PR on protected `main`, required CI,
independent exact-head review, digest-pinned GitHub release, npm package, and isolated
stock-Paperclip canary — not an open branch or local-only install.
