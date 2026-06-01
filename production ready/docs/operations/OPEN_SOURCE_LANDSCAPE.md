# Open-Source Landscape

Date: 2026-06-01

## Relevant Patterns

- Mature static tools keep the deploy path simple: a static host, a clear README, and no hidden server requirement.
- Browser-only AI tools must be explicit about API-key storage, provider trust boundaries, and CORS/provider limits.
- CI should run repeatable local checks and use least-privilege GitHub Actions permissions.
- Open-source readiness benefits from issue templates, a PR template, license, security policy, Dependabot, and documented verification commands.
- Search discoverability starts with clear titles, useful descriptions, crawlable deployment URLs, structured data where applicable, and documentation that uses the terms users search for.
- Nested package workspaces need dependency automation for each manifest directory, not just the repository root.

## Applied To Verbatim

- Verbatim remains static-first and keeps Netlify/static hosting as the primary deployment path.
- Direct provider API calls stay in browser code and are documented as a deliberate trust-boundary decision.
- `permissions: contents: read` was added to CI to keep the workflow token least-privilege for the current jobs.
- Dependabot already covers npm and GitHub Actions metadata.
- Tests now cover static checks, runtime helper units, browser smoke behavior, and the Expo shell typecheck.
- The root page now includes descriptive title/description metadata, Open Graph/Twitter metadata, a web manifest, and SoftwareApplication JSON-LD.
- Dependabot now covers `/apps/mobile` in addition to `/` and GitHub Actions.
- CodeQL scanning was added for JavaScript/TypeScript with explicit `security-events: write` upload permission.
- The feature architecture guide makes future contributor changes discoverable by domain without forcing a risky rewrite.

## Reference Sources

| Source | URL | Applied Pattern |
|---|---|---|
| Google SEO starter guide | https://developers.google.com/search/docs/fundamentals/seo-starter-guide | Clear titles, meta descriptions, canonical/search-friendly signals, and crawlable content matter more than keyword stuffing. |
| Google SoftwareApplication structured data | https://developers.google.com/search/docs/appearance/structured-data/software-app | Added app-specific JSON-LD with free offer, repository, license, author, and app category metadata. |
| GitHub community health files | https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file | Confirmed repo-local community files and templates are the right OSS baseline. |
| GitHub Actions token permission guidance | https://docs.github.com/en/actions/tutorials/authenticate-with-github_token | Kept least-privilege `contents: read` workflow permissions. |
| GitHub Dependabot options reference | https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference | Added nested npm manifest coverage for `/apps/mobile`. |
| GitHub CodeQL action | https://github.com/github/codeql-action | Added JavaScript/TypeScript code scanning workflow with advanced setup. |
| OpenSSF Scorecard | https://github.com/ossf/scorecard | Maintained CI, dependency update automation, security policy, and follow-up Scorecard guidance. |
| Netlify custom headers | https://docs.netlify.com/manage/routing/headers/ | Used `netlify.toml` header tables for static security/cache headers. |
| Expo DOM components | https://docs.expo.dev/guides/dom-components/ | Preserved thin Expo DOM shell boundary. |
| Expo WebView reference | https://docs.expo.dev/versions/latest/sdk/webview/ | Documented mobile WebView capability limits. |

## Follow-Ups

- Consider pinning third-party GitHub Actions to immutable SHAs.
- Consider adding OpenSSF Scorecard once the project is public in its final repository shape.
- Add a production deployment URL and canonical URL once the final public domain is known.
