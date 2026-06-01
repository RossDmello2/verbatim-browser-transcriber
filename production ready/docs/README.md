# Documentation Index

Updated: 2026-06-01

Use this index when reviewing the project or planning a contribution.

## Start Here

| Document | Purpose |
|---|---|
| `../README.md` | Product overview, screenshots, setup, test commands, deployment notes, and security summary. |
| `../AGENTS.md` | Coding-agent guardrails, protected runtime paths, safety rules, and verification commands. |
| `architecture/overview.md` | Current runtime shape and browser/mobile boundaries. |
| `architecture/features.md` | Feature ownership map and contribution rules for adding or extracting feature logic. |

## Architecture

| Document | Purpose |
|---|---|
| `architecture/README.md` | Architecture sub-index. |
| `architecture/architecture.md` | Runtime ownership and module map from the earlier intelligence pass. |
| `architecture/client-api-boundary.md` | Direct browser provider-call boundary and API trust assumptions. |
| `architecture/data-layer.md` | Browser storage and workspace data model. |
| `architecture/frontend.md` | Workspace UI and component surface map. |
| `architecture/knowledge-graph.md` | Historical lookup graph of files, symbols, state, and risks. |
| `architecture/discovery.md` | Earlier source discovery report. |

## Product Guides

| Document | Purpose |
|---|---|
| `guides/live-translate.md` | Live translation behavior and usage guidance. |
| `reference/models.md` | Provider/model reference notes. |
| `api/provider-integrations.md` | Groq/OpenAI-compatible/Gemini endpoint inventory and failure behavior. |
| `../TROUBLESHOOTING.md` | First-run, browser, provider, mobile, and audit troubleshooting. |
| `deployment.md` | Static-host deployment settings and caveats. |

## Security and Operations

| Document | Purpose |
|---|---|
| `../SECURITY.md` | Vulnerability reporting policy and deployment security guidance. |
| `../PRIVACY.md` | Local storage, provider-flow, and user-data privacy notes. |
| `../SUPPORT.md` | Public support paths and safe issue-reporting guidance. |
| `../ROADMAP.md` | Conservative follow-up roadmap and explicit non-goals. |
| `security/security-quality.md` | Static-app security posture, risks, and mitigation notes. |
| `operations/PRODUCT_SHAPE_DECISION.md` | Source-grounded product shape decision. |
| `operations/PROJECT_NAMING.md` | Canonical product name, repository slug, internal package names, and search terms. |
| `operations/PRODUCTIONIZATION_PLAN.md` | Productionization plan and current mutation map. |
| `operations/PRODUCTIONIZATION_SUMMARY.md` | Productionization summary, blockers, and next actions. |
| `operations/VERIFICATION_MATRIX.md` | Command-level verification evidence. |
| `operations/OPEN_SOURCE_LANDSCAPE.md` | OSS, SEO, CI, and supply-chain patterns applied. |
| `operations/PRODUCT_UI_RESEARCH.md` | UI/product-surface decisions and follow-ups. |

## Mobile UI Evidence

| Document | Purpose |
|---|---|
| `mobile-ui/SCREENSHOT_MANIFEST.md` | Screenshot inventory for desktop, tablet, and phone states. |
| `mobile-ui/MOBILE_VERIFICATION_REPORT.md` | Mobile/responsive verification report. |
| `mobile-ui/DEVICE_TEST_MATRIX.md` | Device and viewport coverage expectations. |
| `mobile-ui/RESPONSIVE_LAYOUT_MATRIX.md` | Responsive layout state matrix. |
| `mobile-ui/TOUCH_AND_FORMS_AUDIT.md` | Touch target and form usability audit. |

## Repository-Root Note

This package currently lives under `production ready/` inside the existing `Verba-Transcriber` repository. Root-level community files and workflows mirror the package docs so GitHub can display the project correctly while the app package remains nested.
