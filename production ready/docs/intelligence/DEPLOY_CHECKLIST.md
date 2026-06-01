# Deployment Checklist

Generated: 2026-06-01
Project: Verbatim
Recommended target: Netlify or equivalent static host

## Pre-Deploy

1. Decide repository root:
   - Option A: publish `production ready/` as the root package.
   - Option B: move this package's root files to the GitHub repository root.
2. Run local verification:
   - `npm test`
   - `npm run test:web:smoke`
   - `npm --prefix apps/mobile run check`
   - `npm audit --audit-level=moderate`
   - `npm --prefix apps/mobile audit --audit-level=moderate`
3. Confirm no real `.env`, provider keys, transcripts, recordings, or workspace exports are staged.
4. Confirm README quick start matches the final public path.
5. Add the final deployed URL to README and canonical metadata when known.

## Netlify

1. Create a Netlify site from the GitHub repository.
2. Set the base directory to `production ready` if the package remains nested.
3. Keep publish directory as `.`.
4. Leave build command empty unless a future build step is added.
5. Verify headers from `netlify.toml`.

## GitHub Pages

1. Either flatten the package to repo root or configure Pages to publish the correct package output.
2. Serve `index.html` over HTTPS.
3. Verify module loading and browser capture APIs.

## Vercel / Render

1. Set project root to this package directory if nested.
2. Use review configs under `docs/intelligence/deploy-configs/` only after manual review.
3. Do not configure provider secrets in the hosting dashboard.

## Post-Deploy Verification

- [ ] App loads over HTTPS.
- [ ] Browser console has no boot errors.
- [ ] `assets/js/main.js` loads successfully.
- [ ] Record, transcript, translation, assistant, export, and settings views render.
- [ ] Workspace import rejection still works.
- [ ] Provider key UI still warns that keys are local.
- [ ] README demo link and screenshots render on GitHub.
