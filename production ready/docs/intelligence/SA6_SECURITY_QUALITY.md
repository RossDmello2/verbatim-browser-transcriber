# SA-6: Security and Quality

Generated: 2026-06-01

## Security Posture

| Area | Status | Evidence |
|---|---|---|
| Real `.env` tracking | No tracked `.env` found in this package pass. | `.gitignore:2`, `.gitignore:4`, `.env.example:1` |
| Provider key handling | User-entered, browser/WebView-local when saved. | `README.md:61`, `README.md:171`, `SECURITY.md:31` |
| Workspace import | Validated before restore. | `assets/js/runtime/workspace-validation.js:83`, `assets/js/app/build-app.js:9657` |
| Provider timeout | Typed timeout helper. | `assets/js/runtime/request-timeout.js:31`, `tests/unit/request-timeout.test.mjs:10` |
| Static secret scan | Project script exists. | `scripts/check-secrets.mjs:1`, `package.json:41` |
| CI token permissions | Least-privilege read token. | `.github/workflows/ci.yml:9` |
| CodeQL scanning | JavaScript/TypeScript workflow added. | `.github/workflows/codeql.yml:1` |
| Security policy | Present. | `SECURITY.md:1` |

## Main Remaining Risks

| Risk | Severity | Notes |
|---|---|---|
| Saved provider keys in localStorage | High | Accepted static-app tradeoff; users can clear saved keys. |
| Sensitive transcripts/exports | High | `.gitignore` excludes common generated transcript/recording files. |
| Direct provider CORS/rate-limit policy changes | Medium | No backend fallback by design. |
| Mobile dependency advisories | Medium | `npm --prefix apps/mobile audit --audit-level=moderate` reports 13 moderate advisories through Expo dependencies. |
| Mobile WebView API gaps | Medium | Expo shell depends on exposed browser APIs. |
| Parent repository nesting | Medium | GitHub community files may not apply until package root is resolved. |

## Quality Gates

Required local gates remain:

- `npm test`
- `npm run test:web:smoke`
- `npm --prefix apps/mobile run check`
- `npm audit --audit-level=moderate`
- `npm --prefix apps/mobile audit --audit-level=moderate`

## Current Verification

- `npm test`: PASS on 2026-06-01.
- `npm run test:web:smoke`: PASS, 6 Playwright tests.
- `npm --prefix apps/mobile run check`: PASS.
- `npm audit --audit-level=moderate`: PASS, 0 vulnerabilities.
- `npm --prefix apps/mobile audit --audit-level=moderate`: FAIL, 13 moderate transitive advisories through Expo dependencies.
