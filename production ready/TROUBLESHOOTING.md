# Troubleshooting

## App Does Not Load

Run from the package root:

```powershell
cd "production ready"
python -m http.server 8080
```

Open `http://localhost:8080`. Do not open `index.html` directly from disk for normal use because browser module loading and capture APIs are more reliable through `localhost` or HTTPS.

If port `8080` is busy:

```powershell
python -m http.server 8090
```

## Blank Page or Unsupported Browser Message

Use Chrome or Edge first. Verbatim checks browser support for speech recognition, media recording, display capture, audio context, microphone access, and secure-context behavior before booting the workspace.

Open DevTools and check the console. Then run:

```powershell
npm test
npm run test:web:smoke
```

## Microphone, Tab Audio, or Screen Capture Fails

- Serve over `localhost` or HTTPS.
- Confirm browser permission prompts were allowed.
- Confirm the browser supports the selected capture mode.
- Try Chrome or Edge for the broadest Web Speech and capture API support.
- Avoid private/incognito profiles if they block media permissions or storage.

## Provider Features Fail

- Confirm the correct provider is selected in API Configuration.
- Confirm the key was entered in the correct field.
- Use the key's provider console to check billing, rate limits, and permissions.
- Do not paste real keys into GitHub issues, screenshots, logs, or Markdown files.

Provider success calls are intentionally not part of the public automated tests because they require owner/user keys and may incur cost.

## Mobile Shell Limits

The Expo package in `apps/mobile/` is a thin shell around the existing web runtime. Mobile WebView support is not equivalent to desktop Chrome/Edge. Run:

```powershell
npm --prefix apps/mobile run check
npm --prefix apps/mobile run start
```

Device-level verification requires Expo Go or a simulator.

## Dependency Audit Notes

The root package audit currently passes:

```powershell
npm audit --audit-level=moderate
```

The Expo shell audit currently reports moderate transitive advisories through Expo dependencies:

```powershell
npm --prefix apps/mobile audit --audit-level=moderate
```

Do not run `npm audit fix --force` blindly; npm proposes a breaking Expo upgrade for the current advisories.
