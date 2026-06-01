# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest `main` branch | Yes |
| Older snapshots | No |

## Reporting a Vulnerability

Do not post exploitable security details in public issues.

Use GitHub private vulnerability reporting if it is available on this repository. If private reporting is unavailable, open a minimal public issue asking for a private contact path without posting exploit details.

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix, if available

Response and fix timing depends on maintainer availability and issue severity. No public disclosure timeline is promised in this repository.

## Security Best Practices for Deployment

- Serve the app over HTTPS or `localhost` so browser capture APIs work as intended.
- Do not hardcode provider API keys in source files, HTML, JavaScript, Markdown, or deployment configuration.
- Provider keys entered in the UI may be saved in browser or WebView `localStorage`; use a dedicated browser profile and use **Clear saved keys** before sharing a machine or device.
- Treat exported workspace JSON, transcripts, assistant attachments, memory packs, and diagnostics as potentially sensitive user data.
- Treat imported workspace JSON as untrusted input. The app validates imported workspaces before restore, but users should still import only files they intended to load.
- Do not commit `.env`, copied provider keys, exported workspaces, transcripts, recordings, or generated files containing private meeting content.
- Review [docs/security/security-quality.md](docs/security/security-quality.md) before changing storage, import, assistant rendering, or provider request behavior.
