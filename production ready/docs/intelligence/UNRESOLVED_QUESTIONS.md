# Unresolved Questions

Generated: 2026-06-01

| Question | Why It Matters | Evidence | Recommended Decision |
|---|---|---|---|
| Should `production ready/` become the repository root? | GitHub community files, CI, badges, and README screenshots work best from the actual root. | `README.md:184`, `AGENTS.md:14` | Decide before staging a public PR. |
| What is the final hosted URL? | Needed for canonical metadata, README demo, Search Console, and deployment docs. | `README.md:180` | Add after deployment. |
| Should OpenSSF Scorecard workflow be added now? | Useful for OSS security reputation, but root placement should be settled first. | `docs/operations/OPEN_SOURCE_LANDSCAPE.md` | Add after package-root decision. |
| Should provider keys move out of localStorage? | This would improve secret posture but change static UX and likely require a backend or secure native store. | `SECURITY.md:31`, `assets/js/app/state.js:10` | Keep as documented tradeoff unless a security-focused issue changes scope. |
| Can Expo Go be device-verified? | Required before claiming mobile release readiness. | `AGENTS.md:27` | Run with physical device or simulator outside this shell environment. |
