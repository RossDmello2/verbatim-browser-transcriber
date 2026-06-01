# SA-11: Deployment Config Generation Report

Generated: 2026-06-01

## Generated Review Files

| File | Platform | Location | Status | Notes |
|---|---|---|---|---|
| `.env.example.complete` | All | `docs/intelligence/deploy-configs/.env.example.complete` | Generated | Documentation-only env placeholders. |
| `vercel.json` | Vercel | `docs/intelligence/deploy-configs/vercel.json` | Generated | Review copy for static deployment headers and fallback routing. |
| `render.yaml` | Render | `docs/intelligence/deploy-configs/render.yaml` | Generated | Review copy for Render Static Site setup. |
| `railway.toml` | Railway | `docs/intelligence/deploy-configs/railway.toml` | Generated | Review copy only; Railway is not the recommended target. |

## Existing Config

| File | Existing? | Action |
|---|---|---|
| `netlify.toml` | Yes | Kept in project root and hardened with `X-Frame-Options` and manifest cache metadata. |
| `.github/workflows/ci.yml` | Yes | Updated to deterministic root install and cache metadata. |
| `.github/dependabot.yml` | Yes | Updated for nested mobile npm package. |

## Manual Placement

Do not copy generated review files into the root until the target host is chosen. Netlify already has a root config. For Vercel or Render, place the reviewed config at the repository root only after deciding whether the package stays nested under `production ready/` or becomes the repo root.

## Validation Commands

- `npm test`
- `npm run test:web:smoke`
- `npm --prefix apps/mobile run check`
- `npm audit --audit-level=moderate`
- `npm --prefix apps/mobile audit --audit-level=moderate`
