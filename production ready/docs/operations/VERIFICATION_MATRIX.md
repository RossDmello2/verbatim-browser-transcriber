# Verification Matrix

Date: 2026-06-01

| Gate | Command | Current Result | Notes |
|---|---|---|---|
| Root clean install | `npm ci --ignore-scripts` | PASS | 4 packages installed and 0 vulnerabilities found. |
| Mobile clean install | `npm --prefix apps/mobile ci` | PASS WITH AUDIT WARNINGS | 802 packages installed; npm reported 13 moderate transitive advisories in Expo dependencies. |
| Static + unit checks | `npm test` | PASS | JS syntax passed for 21 files; JSON parse passed for 10 files; HTML links passed for 7 local references; placeholder scan passed for 82 files; secret-pattern scan passed for 110 files; 8 Node unit tests passed. |
| Browser smoke | `npm run test:web:smoke` | PASS | 6 Playwright tests passed: boot/navigation, invalid import rejection, valid import restore, provider timeout UI, responsive layout matrix, mobile drawers/assistant/touch targets. |
| Mobile typecheck | `npm --prefix apps/mobile run check` | PASS | Expo TypeScript check passed. |
| Expo web export smoke | `npx expo export --platform web --output-dir dist-smoke` from `apps/mobile` | NOT RERUN 2026-06-01 | Previous 2026-05-17 run passed. Rerun before claiming mobile release packaging readiness. |
| Root dependency audit | `npm audit --audit-level=moderate` | PASS | 0 vulnerabilities. |
| Mobile dependency audit | `npm --prefix apps/mobile audit --audit-level=moderate` | FAIL: 13 moderate | Advisories flow through Expo dependency chain: `postcss <8.5.10` and `uuid <11.1.1`. `npm audit fix --force` proposes `expo@56.0.8`, a breaking change from the current Expo SDK line, so it was not applied in this non-runtime pass. |
| No tracked `.env` | `git ls-files \| rg '(^\|/)\\.env(\\..*)?$\|\\.env$\|\\.env\\.'` | PASS | No tracked env files were returned. |
| CodeQL workflow | `.github/workflows/codeql.yml` | CONFIGURED | JavaScript/TypeScript CodeQL workflow added. It will run in GitHub after the package-root/community-file placement is resolved. |
| Expo Go device boot | `npm --prefix apps/mobile run start` | Not device-verified | Requires Expo Go/simulator access outside this shell verification. |
| CodeRabbit review | `coderabbit review --agent -t uncommitted` | BLOCKED | `coderabbit --version` was not found. The official install command `curl -fsSL https://cli.coderabbit.ai/install.sh \| sh` failed with `Unsupported operating system: mingw64_nt-10.0-26200`. No CodeRabbit review result is claimed. |
| Repository-root presentation | Root README/community/CI files plus `production ready/` package paths | RESOLVED FOR THIS PUBLICATION | The maintained package remains under `production ready/`; mirrored root files make GitHub README, community health, CI, CodeQL, and Dependabot visible while preserving the existing repository history. |
