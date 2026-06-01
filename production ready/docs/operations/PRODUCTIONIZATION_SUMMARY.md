# Productionization Summary

Date: 2026-06-01

## What Changed

- Preserved the static browser app as the primary product.
- Added strict workspace import validation before restore.
- Added typed provider timeout handling for OpenAI-compatible and Gemini fetch paths.
- Added a clear saved keys action and avoided silent persistence of rotated fallback keys.
- Added Node unit tests and Playwright smoke tests.
- Added a thin Expo mobile shell under `apps/mobile/`.
- Updated CI to run static/unit checks, browser smoke tests, and mobile typecheck.
- Added root `AGENTS.md` and current operations documentation.
- Added richer SEO/social/SoftwareApplication metadata and `site.webmanifest`.
- Added feature-domain architecture guidance for future contributors.
- Added documentation and screenshot indexes that make existing evidence visible to GitHub users.
- Added a naming contract so public docs use **Verbatim** consistently while private package slugs remain descriptive.
- Expanded CI and Dependabot infrastructure for deterministic installs and nested mobile dependency updates.
- Added CodeQL JavaScript/TypeScript code scanning workflow for GitHub security posture.

## Files Preserved

The static app entrypoint and runtime remain in place:

- `index.html`
- `assets/css/**`
- `assets/js/**`

No backend, database, or server API was added.

## Verification Snapshot

See `docs/operations/VERIFICATION_MATRIX.md` for command-level evidence. The final local verification run should be refreshed before merge or release.

## Known Remaining Issues

- Saved provider keys still live in browser/WebView `localStorage` when the user chooses to save them.
- Translation queue stale-result protection is still a follow-up.
- CodeRabbit review is blocked locally because the official CLI installer rejects this Windows/MINGW environment.
- `npm --prefix apps/mobile audit --audit-level=moderate` reports 13 moderate advisories through Expo dependencies, including `postcss <8.5.10` and `uuid <11.1.1`; npm's suggested forced fix is a breaking Expo SDK change to `expo@56.0.8`, so it was not applied.
- Expo Go device boot was not verified because this environment does not provide a physical mobile device or simulator.
- The package directory currently appears as untracked from the dirty parent git repository, so staging should be deliberate and scoped.

## Recommended Next Actions

1. Run CodeRabbit after CLI installation and authentication.
2. Add translation queue snapshot/stale-result tests.
3. Add a canonical production URL once the deployment domain is final.
4. Consider OpenSSF Scorecard once this folder is the final GitHub repository root.

PRODUCTIONIZATION COMPLETE
