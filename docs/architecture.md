# Architecture and preflight

## Authorized bootstrap boundary

Paperclip Live Flow is an additive, read-only plugin. It is not a Paperclip
fork, core patch, lifecycle controller, or production installation. The
one-time Cursor-led bootstrap is authorized by
[ADR 0040](https://github.com/gloopsAI/autonomy-strategy/blob/b4e11b0461fccd5df2c01078c6c525027063a219/docs/adr/0040-paperclip-live-flow-cursor-bootstrap-exception.md).
The source delivery contract is the
[2026-09-03 implementation plan](https://github.com/gloopsAI/autonomy-strategy/blob/b4e11b0461fccd5df2c01078c6c525027063a219/docs/program/PAPERCLIP_LIVE_FLOW_PLUGIN_CURSOR_IMPLEMENTATION_PLAN_2026-09-03.md).
The target repository carries a self-contained copy of the applicable contract
in `docs/delivery-contract.md`.

## Preflight evidence

Preflight was refreshed on 2026-09-03 before repository creation:

- Read-only queries against the live stock Paperclip control plane found zero
  exact `paperclip-live-flow`, `live-flow`, or quoted `Paperclip Live Flow`
  issue matches. The company execution-workspace summaries, active live runs,
  and projects also contained no matching plugin work. No Paperclip state was
  changed.
- GitHub had no `gloopsAI/paperclip-live-flow` repository and no open GLoops PR
  matching `paperclip-live-flow`. The target repository was then created
  publicly as authorized.
- [paperclipai/paperclip#2741](https://github.com/paperclipai/paperclip/issues/2741)
  remained open and was not an owned implementation workspace.
- `@gloops/paperclip-live-flow` was absent from npm. The check did not reserve
  or publish the package.
- Cursor CLI `2026.09.02-c22c1a3` was authenticated. Required local model IDs
  were available: `gpt-5.6-sol-high`, `composer-2.5`,
  `cursor-grok-4.6-medium`, and `cursor-grok-4.6-high`.

## Upstream compatibility pin

- Paperclip source:
  [`da0947d3582ac7779d6bf11851c9938eca6c5c8c`](https://github.com/paperclipai/paperclip/commit/da0947d3582ac7779d6bf11851c9938eca6c5c8c)
- `@paperclipai/plugin-sdk`: `1.0.0`
- `@paperclipai/shared`: `0.3.1`
- The relevant SDK, worker RPC, bridge route, shared issue type, authoring
  guide, local-development guide, and roadmap files had no diff from the plan
  pin at scaffold time.
- The official CLI scaffold was run with Node `24.18.0` and the exact checked
  out SDK path:

  ```text
  paperclipai plugin init @gloops/paperclip-live-flow
    --category ui
    --display-name "Live Flow"
    --description "Read-only workflow visibility for Paperclip"
    --author "GLoops"
    --sdk-path <exact-upstream-checkout>/packages/plugins/sdk
  ```

W1 adapted the scaffold to the read-only contract: manifest id `gloops.live-flow`, no
lifecycle-write capabilities, a `plugin-about` read handler, and a dashboard widget that
uses only `usePluginData`. SDK tarballs are tracked under `.paperclip-sdk/` for clean-clone
installs and excluded from the published npm package via `package.json` `files`.

Paperclip's authenticated plugin bridge establishes company scope before
worker invocation. The SDK worker RPC host then writes that host value into
data-handler parameters after UI parameters. Live Flow requires that value,
uses it for every SDK read, rejects foreign entities, and verifies override and
missing-scope behavior through the worker RPC path.

## Trust and data flow

The worker reads stock public plugin SDK surfaces and returns normalized DTOs.
The trusted same-origin UI reads only through `usePluginData` and navigates
through `useHostNavigation`. It has no direct ordinary Paperclip API/action
path. Static, built-bundle, browser-network, and before/after lifecycle checks
are release gates.

Browser installation and packed-package canaries run only against an isolated
stock Paperclip checkout. Production Paperclip installation remains outside
this bootstrap's authority.

## Documentation index (W5)

| Document                                               | Purpose                            |
| ------------------------------------------------------ | ---------------------------------- |
| [`delivery-contract.md`](./delivery-contract.md)       | Product and manifest contract      |
| [`compatibility.md`](./compatibility.md)               | Pin, toolchain, tested vs targeted |
| [`evidence.md`](./evidence.md)                         | UI fact → SDK provenance           |
| [`privacy.md`](./privacy.md)                           | Data handling and trusted install  |
| [`issue-2741.md`](./issue-2741.md)                     | Upstream issue mapping             |
| [`operator-commands.md`](./operator-commands.md)       | Pinned upstream CLI reference      |
| [`verification-runbook.md`](./verification-runbook.md) | Gates and canary procedure         |
| [`screenshot-inventory.md`](./screenshot-inventory.md) | Planned W6 captures                |

Browser/canary and screenshot evidence remain **pending W6** — see verification runbook.

## Model use (bootstrap W5 disclosure)

| Pass                    | Declared route           | Outcome                                                                      |
| ----------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| Execution parent        | `gpt-5.6-sol-high`       | Contract, integration, release authority                                     |
| W5 documentation worker | `composer-2.5`           | Per checked-in agent routing in strategy/target repo                         |
| Grok medium attempts    | `cursor-grok-4.6-medium` | Failed with `resource_exhausted` — **no Grok implementation claimed**        |
| Runtime worker identity | —                        | Cursor did not expose backend model ID; route known, identity **unverified** |

Do not attribute W2–W5 implementation to Grok unless a future pass records successful execution
with exposed identity.
