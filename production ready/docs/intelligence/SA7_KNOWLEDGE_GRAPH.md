# SA-7: Knowledge Graph

Generated: 2026-06-01

## Route Index

No HTTP routes are present. Provider endpoint families are assembled in browser code and documented in `docs/api/provider-integrations.md`.

## Function/Class Index

| Symbol | File | Role |
|---|---|---|
| `buildApp` | `assets/js/app/build-app.js:16` | Builds and wires the app. |
| `detectRuntimeCapabilities` | `assets/js/runtime/capabilities.js:4` | Detects browser API support. |
| `renderUnsupportedBrowser` | `assets/js/runtime/capabilities.js:58` | Renders unsupported-browser fallback. |
| `RequestTimeoutError` | `assets/js/runtime/request-timeout.js:3` | Typed timeout error. |
| `fetchWithTimeout` | `assets/js/runtime/request-timeout.js:31` | Timeout wrapper for provider fetches. |
| `WorkspaceValidationError` | `assets/js/runtime/workspace-validation.js:9` | Typed workspace import error. |
| `validateWorkspacePayload` | `assets/js/runtime/workspace-validation.js:83` | Workspace payload validation. |
| `parseWorkspacePayload` | `assets/js/runtime/workspace-validation.js:115` | Raw workspace JSON parser and size gate. |

## Storage Index

| Domain | File |
|---|---|
| Local storage keys | `assets/js/app/state.js:6` |
| Session storage keys | `assets/js/app/state.js:34` |
| Workspace restore | `assets/js/app/build-app.js:9648` |
| Workspace import rejection | `assets/js/app/build-app.js:9029` |

## Test Index

| Test | Purpose |
|---|---|
| `tests/unit/workspace-validation.test.mjs` | Workspace import schema and unsafe input checks. |
| `tests/unit/request-timeout.test.mjs` | Provider timeout helper behavior. |
| `tests/web/verbatim.spec.js` | Browser boot, navigation, import, provider timeout UI, responsive containment, touch targets. |

## Deployment Index

| File | Role |
|---|---|
| `netlify.toml` | Primary static host config. |
| `.github/workflows/ci.yml` | Root and mobile checks in GitHub Actions. |
| `.github/workflows/codeql.yml` | JavaScript/TypeScript code scanning. |
| `.github/dependabot.yml` | Root npm, mobile npm, and Actions dependency updates. |
| `docs/intelligence/deploy-configs/*` | Review-only configs for alternate static platforms. |

## Blocker Index

| ID | Blocker | Fix |
|---|---|---|
| B1 | Package is nested/untracked from parent git root. | Decide whether to publish package as repo root or keep nested path and move community files to actual root. |
| B2 | Final deployment URL unknown. | Add canonical URL, README demo link, and hosting metadata after deployment. |
| B3 | Device-level Expo verification unavailable. | Test with Expo Go or simulator before claiming native/mobile release parity. |
