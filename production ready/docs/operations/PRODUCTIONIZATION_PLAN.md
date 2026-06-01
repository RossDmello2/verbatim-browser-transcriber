# Productionization Plan

Date: 2026-06-01

## Goals

- Preserve the static Verbatim runtime as the primary product.
- Add validation and timeout hardening around the highest-risk browser boundaries.
- Add repeatable static, unit, browser smoke, and mobile shell checks.
- Add a thin Expo shell without moving core business logic.
- Refresh open-source readiness docs and CI.
- Improve open-source contribution structure, search metadata, dependency automation, and maintainer guidance without changing runtime behavior.

## Current Mutation Plan

| File | Action | Reason |
|---|---|---|
| `index.html` | Update head metadata only. | Improve search/social/structured-data signals while preserving runtime boot. |
| `site.webmanifest` | Create. | Add a static web-app metadata surface for installability and search context. |
| `README.md` | Expand. | Make clone, run, test, deploy, feature architecture, and security expectations clear to contributors. |
| `docs/README.md` | Create. | Add a top-level documentation map for contributors. |
| `docs/features/README.md` | Create. | Explain that `assets/js/features/**` are ownership maps today. |
| `docs/architecture/features.md` | Create. | Document feature-domain ownership so future contributors can add features safely. |
| `docs/operations/PROJECT_NAMING.md` | Create. | Normalize public product naming, repository slug, package names, and search terms. |
| `.github/workflows/ci.yml` | Harden. | Use deterministic installs, dependency cache metadata, and timeouts. |
| `.github/dependabot.yml` | Expand. | Cover the nested Expo package as well as the root npm package and Actions. |
| `.github/workflows/codeql.yml` | Create. | Add JavaScript/TypeScript code scanning for open-source security posture. |
| `netlify.toml` | Add static security/cache metadata. | Keep static deployment aligned with documented security posture. |
| `package.json`, `apps/mobile/package.json` | Add repository/discovery metadata. | Improve npm/package metadata clarity even though packages remain private. |
| `docs/operations/*` | Refresh. | Record current evidence and verification gates. |

## Implemented Changes

- Added `assets/js/runtime/workspace-validation.js` for workspace JSON version, size, unsafe-key, and collection-size validation.
- Added `assets/js/runtime/request-timeout.js` for typed provider timeout handling.
- Wired workspace import/restore through validation before local storage persistence.
- Wired OpenAI-compatible and Gemini fetch paths through the shared timeout helper.
- Added a **Clear saved keys** API action and removed silent persistence of fallback provider keys.
- Added Node unit tests in `tests/unit/`.
- Added Playwright smoke tests in `tests/web/`.
- Added `apps/mobile/` as an Expo Router package with a DOM host for the existing web app.
- Updated CI to run root checks, browser smoke tests, and mobile typecheck.
- Added SEO/social/SoftwareApplication metadata and a static web manifest.
- Added `docs/architecture/features.md` to clarify feature ownership and future extraction boundaries.
- Added top-level docs and feature-map indexes for contributor navigation.
- Added a project naming contract for Verbatim, the current repository slug, internal package names, and search terms.
- Added a CodeQL workflow for JavaScript/TypeScript security scanning.
- Expanded Dependabot and CI coverage for the nested mobile package.

## Remaining Risk

- Provider keys are still stored in browser/WebView `localStorage` when the user saves them. This is a static-app design tradeoff.
- Translation queue stale-result protection remains a known follow-up.
- Expo Go device verification requires a physical device or simulator outside this shell-only environment.
- CodeRabbit review depends on local CLI installation and authentication.
- The parent git repository is dirty and this package directory is currently untracked from the parent root, so any release PR should be reviewed carefully before staging.
