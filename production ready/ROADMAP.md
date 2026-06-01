# Roadmap

This roadmap is intentionally conservative. It tracks follow-ups that can improve the project without hiding current limitations.

## Near Term

- Keep README, screenshots, deployment notes, and verification evidence current after each user-facing change.
- Resolve Expo dependency advisories through Expo-compatible updates rather than a blind breaking upgrade.
- Add fresh browser screenshots whenever core layout or workflow UI changes.
- Re-run provider documentation checks when endpoint families, model defaults, or API key handling changes.

## Product Follow-Ups

- Improve translation queue stale-result protection with segment/model/target snapshots.
- Add redaction tests before any support-export or diagnostics-export workflow is introduced.
- Document physical-device Expo Go verification once a device/simulator pass is available.
- Consider a backend proxy only through a separate issue that defines server-side key storage, auth, abuse controls, logging, deployment, and cost boundaries.

## Not Planned Without Explicit Scope

- Rewriting the app as a framework SPA.
- Rewriting the mobile shell as a native React Native product.
- Adding a project-owned backend, database, auth system, email workflow, payment workflow, or production telemetry pipeline.
