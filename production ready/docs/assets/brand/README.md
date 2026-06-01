# Brand and Preview Assets

These images are supporting public-presentation assets. They are not product screenshots.

## Assets

| File | Type | Use | Notes |
|---|---|---|---|
| `hero.png` | Generated conceptual artwork | README supporting visual | Not a real screenshot. Do not use as proof of runtime behavior. |
| `social-preview.png` | Generated conceptual artwork with deterministic text overlay | README hero and GitHub social-preview candidate | Text was added locally after generation so it is readable and exact. |

## Real Product Screenshots

Use real screenshots from `../screenshots/` for product proof:

- `../screenshots/home.png`
- `../screenshots/main-workflow.png`
- `../screenshots/settings.png`
- `../screenshots/mobile.png`

## Social Preview Prompt

The generated background for `social-preview.png` used this prompt:

```text
Create a premium, professional open-source GitHub README visual for Verbatim, a static browser transcription workspace. Show a browser workspace with a microphone, waveform, transcript panes, generic export tiles, and a privacy boundary. Use a restrained navy, graphite, off-white, teal, and muted blue palette. Make it a conceptual editorial product illustration, not a fake screenshot. Avoid fake UI metrics, dashboards, charts, company logos, GitHub stars, private data, emails, human faces, watermarks, readable generated text, and excessive neon styling.
```

Final overlay text:

```text
Verbatim
Browser speech-to-text workspace
Live/file transcription | translation | BYOK assistant | export
Static HTML/CSS/JS | MIT open source
```
