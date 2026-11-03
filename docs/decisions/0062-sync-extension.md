# ADR-0062 — A browser extension that pulls by itself, with the same code as the bookmark

| | |
|---|---|
| **Status** | Accepted (the technical manager installs it himself, then for the team; no IT step) |
| **Date** | 2026-11-04 |
| **Version** | v8.80 |

## Context
A pull needed: drag a bookmark once, then every time open MyAFAQY, press the bookmark and return. Numbers were only as fresh as the
last press. The portal itself cannot pull: the MyAFAQY sign-in lives inside myafaqy.com and the browser lets no other site read it.
The manager wants the data to stay in his browser (no server, no shared store).

## Decision
- The manager pull becomes one **recipe** (every value: period, branch, language, report months, file names, whether the late-tasks
  block runs) plus one **body** with no values woven in. The bookmark is "recipe + body" exactly as before (all bookmark tests unchanged).
- A Chrome extension carries the same body as a fixed file (`extension/pull.js`, generated from core.js; the guard fails a release if
  they differ) and runs it inside myafaqy.com. It receives only **data** (the recipe), never text code, so it works whatever page
  policy MyAFAQY sets (a Cloudflare page hid the real one from our tests). A recipe is checked before use (delivery «ext», dates,
  a short branch code, bounded lists); a tampered one is refused and nothing is requested.
- When the portal opens it leaves the recipe: the previous month and the current month, the branch from ADR-0061, the language.
  The extension pulls when MyAFAQY is opened, signed in, at most once every 12 hours. «حدّث الآن» on the Data page pulls in one
  click and the MyAFAQY tab closes itself. The result is kept in the extension's storage in this browser, handed to the portal,
  and validated exactly like a bookmark pull (both files, their schemas, one period, every row); a period running past today is
  recorded as ending today. In a new month the extension waits for the portal to be opened once (the recipe's months are fixed).
- Without the extension the Data page explains it and lists five install steps with the download (assets/afaqy-sync-extension.zip).
- Installed "unpacked" (developer mode); desktop Chrome only. Engineers on phones are served by the personal page link (next).

## Tests
The real extension loaded into Chromium, the portal at its real address, MyAFAQY and crmbackend simulated with the manager-pull
fakes: detection; a pull with no click that lands in the portal; only the ten read endpoints, never a write; no second pull within
12 hours; «Update now» pulls in one click and the tab closes itself; a tampered recipe is refused; recovery on reopening the portal;
without the extension, the steps and a download holding the very file tested. Run three times in a row: a first version passed by
chance once, then showed that «Update now» could open MyAFAQY before its request was stored — the tab now honours a request that
lands in its first 20 seconds.
