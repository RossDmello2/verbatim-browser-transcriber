# Support

Use GitHub issues for public support:

- Bug reports should include browser, operating system, app commit/version, capture mode, expected result, actual result, and console errors when relevant.
- Feature requests should describe the workflow problem first, then the proposed solution.
- Security reports should follow [SECURITY.md](SECURITY.md). Do not post exploitable details publicly.

Useful first checks:

```powershell
npm test
npm run test:web:smoke
npm --prefix apps/mobile run check
```

Do not attach private transcripts, provider keys, recordings, browser profiles, exported workspaces, or customer/user data to public issues.
