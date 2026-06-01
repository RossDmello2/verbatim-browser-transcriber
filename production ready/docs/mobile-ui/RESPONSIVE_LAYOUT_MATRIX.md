# Responsive Layout Matrix

## Layout Principles

- Use device classes as test coverage, not rigid CSS-only breakpoints.
- Let content decide wrapping and panel stacking.
- Keep the production desktop layout intact while improving phone and tablet stability.
- Avoid unintentional horizontal document scroll.
- Prefer one primary scroll container per viewport.

## Device-Class Matrix

| Class | Example viewport | Orientation | Final Layout | Navigation | Result |
|---|---:|---|---|---|---|
| Narrow phone | 320x568 | portrait | single column, compact record/transcript stack | off-canvas sidebar + compact topbar | PASS |
| Standard phone | 360x800 | portrait | single column with readable controls | off-canvas sidebar + controls drawer | PASS |
| Large phone | 412x915 | portrait | relaxed single column | off-canvas sidebar + controls drawer | PASS |
| Phone landscape | 667x375 | landscape | compact height-constrained stack | off-canvas sidebar + controls drawer | PASS |
| Tablet portrait | 768x1024 | portrait | static compact sidebar + main content | sidebar/topbar | PASS |
| Tablet landscape | 1024x768 | landscape | desktop shell with wrapped dense API controls | sidebar/topbar | PASS |
| Desktop | 1366x768 | landscape | desktop app shell | sidebar/topbar | PASS |
| Wide desktop | 1920x1080 | landscape | wide desktop app shell | sidebar/topbar | PASS |

## Content-Driven Breakpoints

- `<= 767px`: mobile drawer navigation, single-column content, safe-area-aware bottom actions, full-screen API sheet, assistant bottom sheet.
- `768-899px`: static tablet sidebar restored to match the existing JS non-mobile breakpoint.
- `768-1100px`: dense API controls wrap inside the fixed panel to avoid viewport overflow.
- `>= 1024px`: desktop app shell behavior with horizontal topbar controls, with API rows still allowed to wrap where needed.

## Overflow and Safe-Area Fixes

PASS. `screenshot-run.json` records 0 document/body horizontal overflow findings across 76 screenshots.

PASS. Sidebar, topbar controls drawer, API panel, assistant sheet, help affordance, and bottom action dock use explicit safe-area-aware layout rules on phone widths.

## Desktop Preservation Notes

- Desktop sidebar remains present.
- Provider controls and workspace view semantics were preserved.
- No backend, auth, provider API, storage-key, workspace JSON, or Expo native API changes were made.
