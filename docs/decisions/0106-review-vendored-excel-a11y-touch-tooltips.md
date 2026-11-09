# ADR-0106 — Review of 2026-11-09: the Excel library brought current and local, accessibility guarded, touch tooltips made robust

| | |
|---|---|
| **Status** | Accepted (the technical manager: «review the system … and see what you can update based on the new technology») |
| **Date** | 2026-11-10 |
| **Version** | v9.26 |

## What was measured
| Area | Result |
|---|---|
| Cold load, phone, CPU slowed 4× | 1.4 s; about 340 KB compressed over 16 files |
| Drawing with ~12,000 tasks (7 months), same phone | control room 0.4 s · Team KPIs 1.9 s · Development 1.4 s · reload with data 5.4 s |
| axe scan, WCAG 2.1 A + AA, 11 pages, light and dark | 17 real findings of 3 kinds; 1 false alarm |
| AI model calls in the repository | none — there is no model string to upgrade |
| Scripts from other sites at run time | one: SheetJS 0.18.5 from cdnjs |
| Access keys in the repository | none |
| Checks run by the repository on publish | 3 unit-test files and the guard (the mail unit tests were not among them) |

## Decisions
- **SheetJS 0.20.3, vendored** under `assets/vendor/` with its source and SHA-256 (`assets/vendor/README.md`). 0.18.5 — the last
  version on npm and cdnjs — carries CVE-2023-30533 (prototype pollution, fixed in 0.19.3) and CVE-2024-22363 (ReDoS, fixed in
  0.20.2); newer versions are published only on cdn.sheetjs.com. The portal now loads no script from another site: the guard refuses
  one, and refuses an Excel library older than 0.20.
- **Offline:** the Excel and PST libraries are cached after their first use (not at install — they are about 1.6 MB together).
- **Accessibility:** every dropdown and date field has a name; on Team KPIs the name is a real button carrying «expanded» (a table
  row cannot), 36 px high. `harness/a11y.py` keeps the scan: no violation on 11 pages, light and dark. The credit line's contrast
  finding is a measured false alarm (light text on the dark menu, scrolled below the fold) and is excluded with that reason.
- **Touch tooltips:** on a screen with no real pointer, «mouse left» no longer closes a tooltip. It is synthetic there and fires
  when the page shifts under the finger, which closed a tapped definition 10 ms after it opened. Found because the row change
  shifted the layout; the weakness predates it.
- **`npm run verify`** now runs the mail unit tests too.

## Left for a decision (not done)
1. Move the browser suites into the repository with synthetic data (they use the real October pull; the repository is private but
   the published site is public). 2. Rotate the publishing key. 3. Store each month's totals to speed up a reload with data.
4. Let the installed app open a sync file directly (browser support not yet verified). 5. An on-device AI experiment for mail
   classification: Chrome's status table lists the Prompt API for web pages from Chrome 148 and extensions from 138; Arabic quality
   unverified, desktop Chrome only — to be measured on the real October file against the keyword rules before anything is adopted.

## Tests
`a11y.py` (4, run alone), `tips.py` 23/23 three times, the six Excel suites on 0.20.3, `mobile.py` 15/15. Full run 76/76.
