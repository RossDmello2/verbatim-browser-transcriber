# Security and Quality Report

Updated: 2026-06-01

## Current Security Model

Verbatim is a client-only static app. It has no server-side account system, database, OAuth/OIDC flow, backend route table, webhook receiver, or server-side secrets.

Provider calls are made directly from the browser or Expo DOM/WebView host. User-owned provider keys are entered in the UI and are stored in browser/WebView `localStorage` only when the user saves them.

## Current Mitigations

| Area | Status | Evidence |
|---|---|---|
| Workspace import | Mitigated for import/restore | `parseWorkspacePayload()` validates version, byte size, unsafe prototype keys, segment counts, memory pack counts, and translation result shape before persistence. |
| Provider request hangs | Mitigated | `fetchWithTimeout()` wraps OpenAI-compatible and Gemini fetch paths with typed timeout errors. |
| Secret scanning | Active | `npm test` runs `scripts/check-secrets.mjs`; latest run scanned 110 files with no secret-pattern failures. |
| Browser smoke coverage | Active | Playwright covers boot, navigation, invalid workspace import rejection, valid import restore, provider timeout UI, responsive layout, mobile drawers, assistant, and touch targets. |
| Key clearing | Added | API Configuration includes **Clear saved keys** to remove saved provider keys from browser storage. |
| Code scanning | Configured | `.github/workflows/codeql.yml` adds JavaScript/TypeScript CodeQL analysis for GitHub code scanning. |

## Accepted Risks

| ID | Severity | Risk | Current Position |
|---|---|---|---|
| R1 | High | Saved provider keys live in browser/WebView `localStorage`. | Accepted static-app tradeoff. Documented in README and SECURITY.md; users can clear saved keys. |
| R2 | Medium | Translation queue can still stale-apply provider results if state changes while work is in flight. | Follow-up recommended with segment/model/target snapshots. |
| R3 | Medium | Mobile WebView browser API support is not equivalent to desktop Chrome/Edge. | Documented. Desktop remains the full-support capture runtime. |
| R4 | Medium | `apps/mobile` dependency audit reports 13 moderate advisories through Expo dependencies, including `postcss <8.5.10` and `uuid <11.1.1`. | Not force-fixed because npm proposes a breaking Expo upgrade to `expo@56.0.8`. Track for Expo-compatible updates. |
| R5 | Low | Diagnostics are session-local and not structured for support exports. | Follow-up recommended with redaction tests before export. |
| R6 | Medium | The package directory currently appears untracked from the parent git root. | Resolve repository-root strategy before relying on GitHub community files, CI, Dependabot, or CodeQL. |

## Dependency Status

| Scope | Command | Result |
|---|---|---|
| Root static app | `npm audit --audit-level=moderate` | PASS, 0 vulnerabilities. |
| Expo shell | `npm --prefix apps/mobile audit --audit-level=moderate` | FAIL, 13 moderate advisories through Expo dependency chain. |

The mobile audit was not force-fixed because `npm audit fix --force` proposed installing `expo@56.0.8`, which is a breaking Expo SDK change from the current generated mobile package.

## Verification Commands

```powershell
npm test
npm run test:web:smoke
npm --prefix apps/mobile run check
npm audit --audit-level=moderate
npm audit --audit-level=moderate --prefix apps/mobile
```

## Review Gate

CodeRabbit review is blocked locally. `coderabbit --version` is not available, and the official shell installer failed with `Unsupported operating system: mingw64_nt-10.0-26200`. No CodeRabbit findings are claimed.
