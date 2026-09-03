# Changelog

All notable changes to `@gloops/paperclip-live-flow` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **W6 verification:** Isolated stock Paperclip browser canary at pin `da0947d` on
  `http://127.0.0.1:3120` (local_trusted); plugin inspect status `ready`; 12 screenshots with
  [`docs/evidence/screenshots/MANIFEST.json`](./docs/evidence/screenshots/MANIFEST.json);
  master receipt [`docs/evidence/MANIFEST.json`](./docs/evidence/MANIFEST.json); four linked JSON
  receipts (network classification, lifecycle non-mutation, plugin inspect, browser
  accessibility).
- **W6 repair:** Bounded public `issues.get` hydration for `company-flow` when stock
  `issues.list` omits `executionPolicy` / `executionState` — restores LIV-9 native review
  stage/participant and `pending_review` attention; regression tests for root, active child,
  thrown/null detail, and foreign-company fail-closed reads.

### Changed

- **W6 documentation:** README screenshots, verification runbook, screenshot inventory, and
  compatibility matrix updated from pending to pass; large HAR/trace/video gitignored as
  release-attachment-only artifacts.

### Added (prior)

- **W5 documentation:** README product overview, operator commands, compatibility matrix,
  evidence/provenance mapping, privacy statement, upstream #2741 mapping, verification runbook,
  and planned screenshot inventory.
- **W4 company surfaces:** Live Flow company page, sidebar, dashboard widget, project sidebar
  entry; situation strip, active flow table, attention lane, client-side filters; foreground
  refresh with exponential backoff; retained-data error banners; orchestration availability
  semantics (`unavailable` vs synthetic zeros).
- **W4 corrections:** Project filter URL sync on location change only; attention dedupe;
  `activeRootIds` gating for issue links; company-page non-link targets.
- **W3 issue vertical slice:** Delivery Flight Deck `detailTab` and `taskDetailView` with phase
  rail, blockers, runs, approvals, token/cost panels, and honest unavailable/not_tracked copy.
- **W2 contracts and worker reads:** Normalized DTOs, domain derivation, pagination, four data
  handlers (`company-flow`, `issue-flow`, `dashboard-summary`, `plugin-about`), host-injected
  `companyId` fail-closed scope, partial failure and compatibility states.
- **W1 scaffold:** Public repository scaffold on upstream pin `da0947d`, manifest
  `gloops.live-flow`, read-only capabilities, CI gates, delivery contract, agent definitions,
  SDK snapshot under `.paperclip-sdk/`.
- UI boundary gate: `pnpm check:ui-boundary`.
- Documentation set under `docs/` (architecture, delivery-contract, compatibility, evidence,
  privacy, issue-2741, operator-commands, verification-runbook, screenshot-inventory).

### Changed

- CONTRIBUTING: full local gate list includes `check:ui-boundary` and `pack:check`.
- SECURITY: expanded read-only scope and trusted-install caveats.

## [0.1.0] — unreleased

Initial public release pending W7 independent review, protected merge, digest-pinned GitHub
release, and npm publish. W6 browser canary and verification evidence are complete. Do not
treat this version as shipped until W7 terminal receipt exists.
