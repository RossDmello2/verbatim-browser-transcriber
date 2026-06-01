# SA-8: Open-Source Landscape

Generated: 2026-06-01

## Applied Patterns

| Pattern | Applied In |
|---|---|
| Clear project README with purpose, setup, tests, deployment, security, and contribution path. | `README.md` |
| Community health files. | `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md` |
| CI with least-privilege token. | `.github/workflows/ci.yml:9` |
| JavaScript/TypeScript code scanning. | `.github/workflows/codeql.yml:1` |
| Dependency update automation for root and nested package. | `.github/dependabot.yml:3`, `.github/dependabot.yml:13`, `.github/dependabot.yml:24` |
| Search metadata and structured data for app discoverability. | `index.html:6` through `index.html:48` |
| Contributor architecture guide. | `docs/architecture/features.md` |

## Sources Inspected

The current pass used official/source-adjacent references and recorded them in `RESEARCH_SOURCES.md`:

- Google SEO starter guide.
- Google SoftwareApplication structured data.
- GitHub community health file docs.
- GitHub Actions GITHUB_TOKEN permission docs.
- GitHub Dependabot options reference.
- GitHub CodeQL action.
- OpenSSF Scorecard repository.
- Netlify custom headers docs.

## What Was Not Copied

No framework template, backend scaffold, hosted database, auth service, landing page, or UI component system was copied into the project because the correct product shape remains a static browser workspace.
