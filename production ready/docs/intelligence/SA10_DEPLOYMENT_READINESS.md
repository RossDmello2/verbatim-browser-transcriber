# SA-10: Deployment Readiness

Generated: 2026-06-01

## Recommended Topology

Primary topology: static site hosting that publishes the package root over HTTPS.

## Platform Compatibility

| Platform | Readiness | Evidence | Notes |
|---|---|---|---|
| Netlify | High | `netlify.toml:2` publishes `.`, `netlify.toml:4` and `netlify.toml:11` define headers. | Best current fit because config exists. |
| GitHub Pages | Medium | Static files exist at `index.html:56`. | Needs repo-root or Pages publish-path decision. |
| Vercel | Medium | Static files exist; generated review config in `deploy-configs/vercel.json`. | Needs project root set to package folder or repo flattened. |
| Render Static Site | Medium | Static files exist; generated review config in `deploy-configs/render.yaml`. | Needs static-site service setup and package-root alignment. |
| Railway | Low | Static app has no long-running server except local `package.json:46`. | Use only with an explicit static server container/service decision. |
| Expo | Development only | `apps/mobile/package.json:12` defines `expo start`. | Device/simulator verification remains external. |

## Blocking Issues Before Public Release

1. Repository-root decision: GitHub community files and CI must live at the actual repository root or the package must be promoted to root.
2. Canonical production URL: add canonical URL metadata and README demo link after final deployment URL exists.
3. Mobile dependency advisory: mobile audit may report transitive PostCSS advisory through Expo/Metro; do not force a breaking downgrade without Expo validation.
4. Mobile audit currently reports 13 moderate advisories through Expo dependencies; `npm audit fix --force` proposes `expo@56.0.8`, so this needs an Expo-aware upgrade pass.

## Environment Variables

No server env vars are required at runtime. `.env.example` documents that provider keys are configured in the UI and that hosting URL placeholders are documentation-only.
