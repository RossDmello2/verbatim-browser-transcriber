# Mobile UI Plan

Status: Implemented

## Mobile UX and Navigation Plan

### Primary Mobile Tasks

- Start or stop recording from the record orb.
- Navigate to Transcript, Translation, Export, Memory, and Settings.
- Open/close the sidebar drawer.
- Open/close the topbar controls drawer.
- Open/close API configuration without covering unreachable content.
- Edit transcript text and assistant prompt text without keyboard-covered controls.
- Open Verba assistant and prepare a prompt.

### Navigation Model

- Existing topbar menu button controls the phone sidebar.
- Existing off-canvas sidebar pattern remains under `max-width: 767px`.
- Secondary controls stay in the topbar controls drawer on phone widths.
- The sidebar closes after phone navigation; tablet and desktop retain static navigation.
- `768px` and wider stay aligned with the existing JS non-mobile sidebar breakpoint.

### Action Placement

- Primary mode controls remain in the topbar.
- Transcript actions remain in the bottom action dock on mobile.
- API configuration is a full-screen mobile sheet only while open and a wrapped fixed panel on larger widths.
- Assistant remains a bottom sheet on phones and a panel on larger screens.

### State Handling

- `state.workspaceView`, `state.sidebarMobileOpen`, `state.sidebarCollapsed`, assistant state, translation state, and existing local/session storage keys are preserved.
- Provider call behavior and imported workspace validation are unchanged.

### Desktop Coexistence

- Desktop remains a constrained app shell with sidebar, topbar, status bar, record/transcript split, and wide-desktop content limits.
- Mobile-only corrections are wrapped in scoped media queries inside `assets/css/40-overrides.css`.

## Responsive Layout Implementation

- Dynamic viewport sizing now uses `100dvh` fallbacks where needed.
- Phone layouts use a single scrollable workspace view body with safe-area-aware bottom padding.
- Sidebar, API panel, assistant sheet, topbar drawer, and bottom dock are explicitly contained on phone widths.
- Dense API rows wrap globally inside the fixed panel to avoid desktop and tablet overflow.
- Assistant phone controls use a compact grid and 46px control boxes to survive fractional rendering while meeting the 44px target.

## Verification

- `npm test`: PASS
- `npm run test:web:smoke`: PASS
- `npm --prefix apps/mobile run check`: PASS
- Screenshot matrix: PASS, 76 screenshots, 0 console warnings/errors, 0 overflow findings.
