# ADR-0068 — One place to read a PST; every page named; the guard reports last

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-04 |
| **Version** | v8.86 |

## Findings
- The Data page («بريد أوتلوك — ملف PST») and the mail page («البريد من ملف PST») both read a PST with the same `mfLoadFile`
  into the same memory (`mfState`); the only difference was that the Data page then opened the mail page. One function, two places.
- The mail page was missing from the top bar's names since v8.75, so the bar read «undefined».
- The guard (`scripts/check.mjs`) printed its result and exited on line 408; four rules written below it since the morning
  (the extension file matches the core and its zip exists; the service worker fetches fresh; the unit-test position; this ADR's
  rules) added problems nobody printed. They held anyway, but enforced nothing.

## Decision
- A PST is read in one place: the mail page, where its result appears. The Data page keeps a short box that opens it.
- The mail page is named in the top bar.
- The guard's report is the last statement of the file, with a comment saying so. New rules: every page in `views` has a top-bar
  name; a PST is read from one place.
- Every rule written today was proven by a deliberate mistake that it now catches: a missing page name, a second PST reader,
  a cache fetched without reload, a unit test after the runner, a hand-edited extension file.
