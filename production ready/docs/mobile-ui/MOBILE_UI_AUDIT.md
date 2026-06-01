# Mobile UI Audit

## Project Frontend Identity

Verbatim is a static browser app. `index.html` links the CSS bundle and loads `assets/js/main.js`; `assets/js/main.js` checks runtime capabilities and calls `buildApp()` from `assets/js/app/build-app.js`. The main workspace DOM is generated into `#mainContent`.

The Expo package under `apps/mobile/` is a thin Expo DOM shell. `apps/mobile/components/verbatim-dom.tsx` imports the same root CSS and dynamically imports the same `assets/js/main.js`; `apps/mobile/app/index.tsx` wraps that DOM component in a full-screen React Native `View`.

## Current Route and Layout Map

There are no HTTP routes. The app uses generated workspace views:

- `record`: recording orb, transcript panel, runtime summary, transcript actions.
- `capture`: capture setup guidance plus live capture surface.
- `transcript`: standalone transcript editor and read-mode toolbar.
- `translation`: translated transcript and sentiment panel.
- `ai-output`: AI cleanup, summaries, action items, and transcript Q&A.
- `memory`: memory pack and glossary controls.
- `tools`: export/download, history, and clear tools.
- `settings`: studio settings, diagnostics, and shortcuts.

Navigation is controlled by `.workspace-nav-btn[data-view]` buttons and `setWorkspaceView()` in `assets/js/app/build-app.js`.

## Component and Style Inventory

- Layout shell: `.workspace-command-deck.topbar`, `.workspace-shell.app-shell`, `.workspace-left-rail.sidebar`, `.workspace-main.main-area`.
- Mobile controls: `#workspaceSidebarBtn`, `#topbarControlsBtn`, `#topbarMobileDrawer`, `#workspaceSidebarBackdrop`.
- Fixed or sticky regions: topbar, status bar, sidebar drawer/backdrop, API panel, help modal, assistant shell, bottom action dock.
- Main CSS files: `assets/css/10-core.css`, `assets/css/20-assistant.css`, `assets/css/30-workspace.css`, `assets/css/40-overrides.css`.
- Final app-like responsive rules live mainly in `assets/css/40-overrides.css`, including `max-width: 1023px`, `max-width: 767px`, `max-width: 479px`, landscape, hover, and reduced-motion blocks.

## Mobile Baseline

Planning Browser checks found:

- Desktop render loads with no console errors.
- Narrow and standard phone widths keep document `scrollWidth` equal to viewport width, but the hidden off-canvas sidebar appears in raw overflow element scans because it is translated off-screen by design.
- Current mobile risk is not a single route failure; the risk is the combination of nested fixed-height app shell, `body { overflow: hidden; }`, sticky bottom actions, fixed topbar drawers, assistant sheet, and keyboard-sensitive text inputs.

## Desktop Baseline

Desktop layout renders as a two-column record/transcript workspace with left sidebar, topbar, status bar, and bottom action dock. The initial Browser baseline loaded `http://127.0.0.1:8080/`, title `Verbatim - Production Package`, and no console warnings/errors.

## Known Mobile Defects and Risks

- `body`/`.page` use `height: 100vh` and hidden body overflow in the final override layer, which is risky with mobile browser chrome, mobile keyboards, and Expo WebView height changes.
- Mobile topbar controls, API panel, sidebar, help modal, assistant sheet, and bottom dock all use fixed or sticky positioning and must be checked together for overlap.
- Some touch targets in the baseline measurement were below 44px high or wide, including view toggle buttons, assistant header buttons, and sidebar collapse controls.
- Dense views such as export cards, memory tools, diagnostics, and translation sentiment need explicit one-column/mobile scroll proof.

## Final Findings

- `100dvh` fallbacks and contained workspace scrolling were added in `assets/css/40-overrides.css`.
- Phone sidebar open/closed transforms are explicit and verified after animation settles.
- Phone controls drawer, API sheet, assistant sheet, bottom dock, transcript focus, and assistant focus are covered in Playwright and screenshot evidence.
- The 768px tablet breakpoint now uses a static sidebar to match the existing JS non-mobile breakpoint.
- Dense API rows wrap inside the fixed panel across desktop, tablet, and phone layouts.
- Final screenshot evidence found 0 document/body horizontal overflow findings across 76 screenshots.

## Preservation Constraints

- Preserve the static production runtime under `index.html`, `assets/css/**`, and `assets/js/**`.
- Preserve all existing DOM IDs and storage keys used by tests and browser state.
- Preserve direct client-side provider calls; do not add a backend proxy.
- Preserve the Expo DOM shell shape; do not rewrite the app as React Native.

## Files That Must Not Be Changed Without Reason

- `index.html`
- `assets/js/runtime/**`
- `assets/js/features/**`
- `apps/mobile/**`
- Any real `.env` file
