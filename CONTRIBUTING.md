# Contributing to Verbatim

Thanks for considering a contribution.

The maintained app package lives in `production ready/`. Run commands from that folder unless a workflow explicitly says otherwise.

```powershell
git clone https://github.com/RossDmello2/verbatim-browser-transcriber.git
cd verbatim-browser-transcriber
cd "production ready"
npm ci
python -m http.server 8080
```

Before opening a pull request:

```powershell
npm test
npm run test:web:smoke
npm --prefix apps/mobile run check
```

Do not commit provider keys, transcripts, recordings, browser profile data, exported workspaces, local databases, dependency folders, build output, or local tool state.

See [`production ready/CONTRIBUTING.md`](production%20ready/CONTRIBUTING.md).
