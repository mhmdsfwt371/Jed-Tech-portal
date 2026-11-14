# Browser suites

They drive the portal in a real browser (Playwright, Chromium). They live here since v9.31: until then they existed only in a
working environment, and were lost when it was reset (ADR-0111). The website publishes app files only (ADR-0107), so nothing here
is served.

| Suite | What it proves | Needs |
|---|---|---|
| `readings.py` | «Monthly readings» equals the proposal's workbook for October 2026, and behaves (names switch, months, export, languages, phone) | The real October pull, outside the repository: `OCT_PULL=/path/to/afaqy-tasks-2026-10-01_2026-10-29.json` |
| `me.py` | The engineer's own page on a phone: fits the screen, the rank is of the month shown and agrees with the achievements, plain wording, open work first | The real October pull (`OCT_PULL`) |
| `owner.py` | Whose device this is on the manager link (ADR-0115): a lead's pull shows the lead's own page and rights, not the manager's | The real October pull (`OCT_PULL`) |
| `ownerteam.py` | «Team KPIs» follows the device's owner (ADR-0116): a lead sees exactly the people under him, from MyAFAQY's employees list or the team file | The real October pull (`OCT_PULL`) |
| `assign.py` | The assignment panel inside a stand-in for MyAFAQY: each account once, MyAFAQY’s reply per account, a lock after an unasked removal, a stop after five refusals | Nothing — the stand-in answers like the 14 Nov 2026 log |
| `pager.py` | A window with a long scroll turns into pages (ADR-0119): built windows measured page by page, then the portal’s real windows | The real October pull (`OCT_PULL`) for the last part |
| `weights.py` | The Weights page names each type once, in the reader’s language, and no table scrolls sideways on a laptop or a phone, advanced settings included | The real October pull (`OCT_PULL`), with type names added the way MyAFAQY sends them |
| `accounts.py` | The after-sales accounts board on the Team page: totals, systems counted by customer, families, accounts per engineer, a part-read server list showing no system figure — three languages, laptop and phone | The real October pull (`OCT_PULL`) plus a made-up manager pull built inside the test |
| `daily.py` | «Tasks per day» on the control room: every day adds up, «past the limit» never exceeds «not started», a day opens its own tasks, the late line opens the late list — three languages, laptop and phone | The real October pull (`OCT_PULL`) |
| `tenderwrap.py` | A long tender subject wraps inside its cell and never runs over the date column — wide screen, laptop and phone | Made-up tenders built inside the test |
| `tenderwin.py` | A tender’s details open in a window; fields still to fill are marked and counted; filling one keeps the window open and focus in place — laptop and phone | A made-up tender built inside the test |
| `kpicards.py` | Team KPIs: the fold is gone, every section card opens its window with content and closes — three languages, laptop and phone; the control-room alert opens the week card | The real October pull (`OCT_PULL`) |
| `projlines.py` | My projects: tenders / upselling / not sorted counts and filter, line chosen in Edit, «Delete all shown» saves a backup then deletes only the shown rows, the backup restores them | A made-up register built inside the test |
| `smoke.py` | Every page opens in three languages with no page error, no failed request and no raw text key; the WCAG 2.1 A and AA scan passes on every page; the phone has no sideways scroll | `AXE_JS=/path/to/axe.min.js` for the scan (skipped with a note when absent) |

Run: `python3 tests/browser/readings.py` and `python3 tests/browser/smoke.py` from the repository root. No real pull, name or
customer may be committed: suites read real data from a path outside the repository, or invent it.
