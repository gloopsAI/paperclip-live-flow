# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | yes       |

## Reporting a vulnerability

Please report security issues privately to the repository maintainers through
[GitHub Security Advisories](https://github.com/gloopsAI/paperclip-live-flow/security/advisories/new)
or the contact channel listed on the GLoops GitHub organization profile.

Do not open public issues for undisclosed vulnerabilities.

## Scope

Live Flow is a read-only Paperclip plugin. It must not:

- request or use lifecycle-write capabilities;
- read Paperclip data outside the public plugin SDK;
- call Paperclip HTTP/action endpoints directly from UI code;
- send telemetry to external services; or
- embed secrets in the repository or published package.

Report issues that could cause cross-company data leakage, unauthorized lifecycle mutation,
or trust-boundary bypass through the plugin data bridge with high priority.

## Out of scope

Vulnerabilities in upstream Paperclip itself should be reported to
[`paperclipai/paperclip`](https://github.com/paperclipai/paperclip/security).
