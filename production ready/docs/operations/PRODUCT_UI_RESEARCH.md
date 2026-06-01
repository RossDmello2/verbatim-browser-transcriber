# Product UI Research

Date: 2026-06-01

## Current UI Direction

Verbatim is an operational workspace, not a marketing site. The UI should stay dense, scannable, and task-oriented around recording, capture, transcript editing, translation, memory, assistant output, diagnostics, and exports.

## Applied Decisions

- No landing page was added.
- No decorative redesign was introduced.
- The new key-management action is placed inside the existing API Configuration surface.
- The mobile shell preserves the existing UI and capability gate rather than adding a second mobile-specific interface.
- Search metadata was added in the document head without changing the first-screen workspace experience.
- Contributor-facing feature guidance was added in docs rather than adding in-app instructional text.

## Mobile Limits

The mobile shell should make the existing app reachable on mobile, but desktop remains the full-fidelity workflow for browser speech, tab audio, and screen capture. Any future native mobile parity work should start with native media/file/storage bridges and separate acceptance tests.

## Follow-Ups

- Re-check mobile viewport scaling and fixed toolbars after any visual mobile changes.
- Keep provider and key-storage warnings close to key-entry controls.
- Add user-facing diagnostics export only after redaction rules are tested.
