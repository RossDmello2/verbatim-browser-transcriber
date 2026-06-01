# SA-10: Platform Compatibility Matrix

Generated: 2026-06-01

| Platform | Mode | Score | Compatible? | Required Setup | Main Blocker |
|---|---|---:|---|---|---|
| Netlify | Static | 85/100 | Yes | Publish `production ready/` as root or flatten package; keep `netlify.toml`. | Final repo-root/publish-root decision. |
| GitHub Pages | Static | 75/100 | Yes | Publish package folder or flatten to root; configure Pages source. | Nested package path. |
| Vercel | Static | 70/100 | Yes | Set project root to package folder; use generated review config if needed. | Root path and canonical URL. |
| Render | Static site | 65/100 | Yes | Create Static Site service with package root and publish path `.`. | Root path and exact Render service config. |
| Railway | Static server | 45/100 | Possible but not recommended | Add explicit static server service command and hosting config. | No native static-site config in current project. |
| Expo Go | Mobile development | 55/100 | Development only | Run `npm --prefix apps/mobile run start` with device/simulator. | Physical device/simulator verification unavailable here. |

## Recommended Platform

Netlify is the best current web target because a static config already exists and the app requires no server runtime. GitHub Pages and Vercel are also reasonable after the package-root decision.
