# Privacy Notes

Verbatim is a static browser app. It does not include a project-owned backend, account system, database, analytics pipeline, or server-side transcript store.

## Where Data Lives

| Data | Storage/Flow |
|---|---|
| Transcript text and workspace state | Browser `localStorage` and `sessionStorage` |
| Provider keys | Browser/WebView `localStorage` only when the user saves them |
| Uploaded files and assistant attachments | Browser memory/Object URLs and provider upload flows when the user sends them |
| Exported transcripts/workspaces | User-downloaded local files |
| Provider requests | Direct HTTPS requests from the browser to the selected provider |

## User Responsibilities

- Use a dedicated browser profile when testing provider keys or private transcripts.
- Use **Clear saved keys** before sharing a device, browser profile, recording, or screenshot.
- Treat exported workspaces and transcripts as sensitive files.
- Review provider terms, retention, billing, and privacy policies before sending data to Groq, OpenAI-compatible providers, Gemini, or any configured endpoint.

## What This Repository Does Not Claim

- No hosted production privacy policy is provided because there is no deployed production service in this repository.
- No claim is made that third-party providers avoid logging or retaining submitted content.
- No server-side encryption, account isolation, or organization-level access control exists in this static app.
