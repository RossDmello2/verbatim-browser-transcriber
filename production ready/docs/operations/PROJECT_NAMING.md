# Project Naming

Updated: 2026-06-01

## Canonical Public Name

The product name is **Verbatim**.

Use **Verbatim** in:

- README title and prose.
- App metadata and link previews.
- Screenshots and demo captions.
- Security, contribution, and architecture docs.
- Future release notes and hosted site copy.

## Repository Slug

The current GitHub repository slug is `RossDmello2/Verba-Transcriber`.

This slug can remain as a discoverable historical repository name, but public docs should consistently introduce the project as:

```text
Verbatim
Open-source browser transcription workspace
Repository: RossDmello2/Verba-Transcriber
```

## Internal Package Names

| Package | Name | Reason |
|---|---|---|
| Root static app | `verbatim-static-workspace` | Private npm metadata for tests and static tooling. |
| Expo shell | `verbatim-mobile-shell` | Private npm metadata for the optional mobile wrapper. |

Both packages are marked private. They are not intended as public npm package names.

## Search Terms

Use these terms naturally in docs and metadata:

- browser transcription workspace
- static speech-to-text app
- AI transcription workspace
- live speech capture
- file transcription
- transcript translation
- Groq transcription
- OpenAI-compatible transcription
- Gemini assistant file analysis
- transcript export
- local-first transcript workspace

Do not keyword-stuff the UI or docs. The README and metadata should describe the real product accurately.
