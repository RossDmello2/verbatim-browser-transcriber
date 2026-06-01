# Security Policy

## Reporting a Vulnerability

Do not post exploitable security details in public issues.

Use GitHub private vulnerability reporting if it is available on this repository. If private reporting is unavailable, open a minimal public issue asking for a private contact path without including exploit details.

## Current Security Model

Verbatim is a static browser app. It has no server-side account system, backend route layer, database, webhook receiver, or server-side secret store. Provider calls are made directly from the browser or the optional Expo DOM/WebView host when the user configures their own keys.

Important boundaries:

- Provider keys may be saved in browser/WebView `localStorage` only when the user chooses to save them.
- Exported workspaces, transcripts, assistant attachments, memory packs, and diagnostics may contain sensitive user data.
- Workspace JSON import is treated as untrusted input and validated before restore.
- Hosting providers should not receive Groq, OpenAI, Gemini, or other provider secrets for this static app.

See [`production ready/SECURITY.md`](production%20ready/SECURITY.md) and [`production ready/docs/security/security-quality.md`](production%20ready/docs/security/security-quality.md).
