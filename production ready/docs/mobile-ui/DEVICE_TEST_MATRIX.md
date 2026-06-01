# Device Test Matrix

| Viewport/Class | Orientation | Primary Flow | Overflow | Overlap | Console | Result |
|---|---|---|---|---|---|---|
| 320x568 narrow phone | portrait | PASS | PASS | PASS | PASS | PASS |
| 360x800 standard phone | portrait | PASS | PASS | PASS | PASS | PASS |
| 412x915 large phone | portrait | PASS | PASS | PASS | PASS | PASS |
| 667x375 phone landscape | landscape | PASS | PASS | PASS | PASS | PASS |
| 768x1024 tablet portrait | portrait | PASS | PASS | PASS | PASS | PASS |
| 1024x768 tablet landscape | landscape | PASS | PASS | PASS | PASS | PASS |
| 1366x768 desktop | landscape | PASS | PASS | PASS | PASS | PASS |
| 1920x1080 wide desktop | landscape | PASS | PASS | PASS | PASS | PASS |

Evidence:

- `npm run test:web:smoke`: 6 tests passed.
- `docs/mobile-ui/screenshots/screenshot-run.json`: 76 screenshots, 0 console warnings/errors, 0 document/body overflow findings, 0 screenshot state issues.
