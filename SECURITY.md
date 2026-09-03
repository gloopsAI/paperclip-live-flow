# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | yes       |

## Reporting a vulnerability

Report security issues privately via
[GitHub Security Advisories](https://github.com/gloopsAI/paperclip-live-flow/security/advisories/new)
or the contact channel on the GLoops GitHub organization profile.

Do **not** open public issues for undisclosed vulnerabilities.

## Scope

Live Flow (`gloops.live-flow`) is a **read-only** Paperclip plugin.

### In scope for this repository

- Cross-company data leakage via worker handlers or UI
- Bypass of host-injected `companyId` scope
- Unauthorized lifecycle mutation through plugin code paths
- Direct ordinary Paperclip API/action calls from plugin UI (trust-boundary violation)
- Secrets or credentials embedded in published tarball
- False claims that misrepresent merge/deploy/review state from incomplete data

### Required boundaries (v0.1.0)

The plugin must **not**:

- request or use lifecycle-write capabilities;
- read Paperclip data outside the public plugin SDK;
- call Paperclip HTTP/action endpoints directly from UI code;
- use `fetch`, XHR, WebSocket, EventSource, or form posts to host routes for Paperclip APIs;
- send telemetry to external services;
- embed secrets in source or published packages;
- persist operator credentials in documentation or evidence artifacts.

See [`docs/privacy.md`](./docs/privacy.md) and [`docs/delivery-contract.md`](./docs/delivery-contract.md).

## Trusted install warning

Paperclip plugin **UI and workers are trusted same-origin code** on the instance where the
plugin is installed. Manifest capabilities gate worker APIs but **do not sandbox UI**.

- **Local-path installs** execute disk code without signature verification.
- **npm installs** pin a package but remain trusted on the host.
- Install only plugins you trust; use isolated canary hosts for verification ([`docs/operator-commands.md`](./docs/operator-commands.md)).

Report issues that could allow an installed plugin to exfiltrate data across companies or
mutate lifecycle state with high priority.

## Out of scope

Vulnerabilities in upstream Paperclip core should be reported to
[`paperclipai/paperclip`](https://github.com/paperclipai/paperclip/security).

Social engineering, operator misconfiguration of production hosts, and vulnerabilities in
third-party Paperclip plugins are out of scope for this repository unless they involve Live
Flow code specifically.

## Security-related verification

| Check                          | Command / doc                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------- |
| UI boundary gate               | `pnpm check:ui-boundary`                                                          |
| Browser network classification | [`docs/verification-runbook.md`](./docs/verification-runbook.md) — **pending W6** |
| Lifecycle non-mutation canary  | **pending W6**                                                                    |
