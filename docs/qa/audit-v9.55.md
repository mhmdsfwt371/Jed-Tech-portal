# Audit record — v9.55 (14–15 November 2026)

Method: a crawl opened every page and everything on it that can be clicked and is not destructive, and inspected every window
that opened — 12 combinations (Arabic, English, Urdu × light, dark × laptop, phone), about 75 states and 220–260 clicks each,
with the WCAG 2.1 A/AA scan inside each window. Seeded with the real October pull (outside the repository), a made-up manager
pull and made-up tenders. A second crawl ran on the fixed code. The crawl is a working tool; what it found is now held by
`tests/browser/audit.py`, the guard and the logic tests. Decision record: ADR-0129. Policy: `docs/qa-policy.md`.

## Found and fixed (each with a test that fails on 9.54)
| Finding | Where it showed | Held by |
|---|---|---|
| Site visit / bid opening read from a document, then dropped | tender after a booklet is read | `tenderDatePatch` test; tender-integration (1) |
| Empty value/fee → 0 after reload-save-reload | tender window | `tenderAmount` test; tender-integration (5) |
| Same study twice → two history lines | tender history | core test; tender-integration (2) |
| Hour for visit/opening kept for one session only | tender window | core test |
| Study's unreadable values silently dropped | study import | core test; tenderflow F15–F16 |
| «final offer» from the window did not move the stage | tender window (the only way on a phone) | tenderflow F18–F19 |
| Study added from the window stored as a plain file | tender window | tenderflow F14 |
| Import result could not be put away | tender page | tender-integration (4); tenderflow F17 |
| Dark-ink text on dark cards: page number, mail links, about line, late rows, pipeline numbers | windows, dark | guard 15b; audit A4/A5 |
| 48+ unnamed controls (weights advanced, rank/week, hint-only inputs) | weights card, team messages, tools, data | audit A3, A10–A11 |
| Scroll boxes unreachable by keyboard; buttons inside a «picture» | day windows, tables on a phone | audit A5, A9 |
| Unscrolled sections printed blank | any long page | audit A12 |
| Arabic name turned an English sentence around | tender result lines | tenderflow F20 |
| Files dropped while busy vanished | tender page | (message; covered by review) |
| Only copy never backed up, no word about it | tender page, Data | `backupDue` test; audit A13–A15 |
| Page explanation filled a phone's first screen | tenders, projects, PST | screenshots; tenderflow F12–F13 for the fold |

## Looked at and left (not defects)
Latin data in Arabic/Urdu pages (type names, team names, tool names, KPI glosses); positions in English in Urdu (`team.json`
has Arabic and English only); wide tables scrolling inside their box on a phone; WCAG 2.2 target-size note on a thin bar;
tour contrast measured mid-fade.

## Test hygiene
- `npm run test:browser` runs all 17 suites; skips are reported apart. The pager and audit suites measure frames and run alone:
  four pager suites at once failed on 9.54 as on 9.55 (load, not a regression).
- `axe-core` 4.10.2 pinned; CI job `browser` runs the suites that need no real pull.

## Final run before release (15 November 2026, real October pull)
`npm run verify` green · `npm run links` green · `npm run test:browser`: 17 suites, 311 checks, nothing failed, nothing skipped.

## Not verified here
MyAFAQY reads of extension 1.0.6 (server systems, first starts) · assignment-panel pilot · a real analyzer study file · date
patterns on real booklets · the new Urdu strings by a native reader.
