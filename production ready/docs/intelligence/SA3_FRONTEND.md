# SA-3: Frontend / UI

Generated: 2026-06-01

## UI Surface

Verbatim opens directly into the usable workspace. It is not a marketing landing page.

## Main UI Areas

| Area | Evidence |
|---|---|
| Navigation workspace shell | `assets/js/app/build-app.js:348` through `assets/js/app/build-app.js:411` |
| Capture controls | `assets/js/app/build-app.js:416` through `assets/js/app/build-app.js:462` |
| AI output panel | `assets/js/app/build-app.js:481` through `assets/js/app/build-app.js:518` |
| Transcript and translation panels | `assets/js/app/build-app.js:612` through `assets/js/app/build-app.js:650` |
| Memory/workspace tools | `assets/js/app/build-app.js:660` through `assets/js/app/build-app.js:741` |
| Diagnostics panel | `assets/js/app/build-app.js:750` through `assets/js/app/build-app.js:761` |
| Export cards | `assets/js/app/build-app.js:815` through `assets/js/app/build-app.js:867` |
| Assistant shell | `assets/js/app/build-app.js:901` through `assets/js/app/build-app.js:1000` |

## Responsive Evidence

Playwright coverage includes viewport containment, mobile drawers, assistant state, API panel state, transcript focus, translation view, and export view. See `tests/web/verbatim.spec.js:216` and `tests/web/verbatim.spec.js:265`.

## Visual Evidence

Screenshot evidence is already present under `docs/mobile-ui/screenshots/`, and the README now links representative screenshots from the manifest.

## UI Decision

No decorative redesign was introduced in this pass. The UI remains an operational workspace, and metadata changes were limited to the document head and documentation surfaces.
