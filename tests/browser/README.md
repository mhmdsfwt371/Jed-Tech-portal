# Browser suites

They drive the portal in a real browser (Playwright, Chromium). They live here since v9.31: until then they existed only in a
working environment, and were lost when it was reset (ADR-0111). The website publishes app files only (ADR-0107), so nothing here
is served.

| Suite | What it proves | Needs |
|---|---|---|
| `readings.py` | «Monthly readings» equals the proposal's workbook for October 2026, and behaves (names switch, months, export, languages, phone) | The real October pull, outside the repository: `OCT_PULL=/path/to/afaqy-tasks-2026-10-01_2026-10-29.json` |
| `smoke.py` | Every page opens in three languages with no page error, no failed request and no raw text key; the WCAG 2.1 A and AA scan passes on every page; the phone has no sideways scroll | `AXE_JS=/path/to/axe.min.js` for the scan (skipped with a note when absent) |

Run: `python3 tests/browser/readings.py` and `python3 tests/browser/smoke.py` from the repository root. No real pull, name or
customer may be committed: suites read real data from a path outside the repository, or invent it.
