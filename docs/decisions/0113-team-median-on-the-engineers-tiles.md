# ADR-0113 — The team's median beside the engineer's own numbers

| | |
|---|---|
| **Status** | Accepted (the technical manager, 12 Nov 2026: «yes, let him see it, so that competition grows») |
| **Date** | 2026-11-12 |
| **Version** | v9.33 |

## Context
ADR-0112 left one gap on the engineer's page: his numbers had no yardstick. «7:20 to resolve» says nothing until it stands beside
something. The rule so far was that an engineer sees no team figure at all.

## Decision
- Five tiles on the engineer's own page (tasks closed, workload, closure rate, time to resolve, points) carry the **median of his
  team** for the same period, said as a comparison: above, below, at, faster than or slower than the team median, with the value.
  Workload is shown without a judgement: more work is neither better nor worse.
- **His team** = those under the same team lead in the team file who have work in the period — the same people his rank counts.
- **Never a person:** the median appears only when at least three of them have work in the period; no name and no colleague's own
  number is shown. A line under the tiles says what the median is.
- It appears on the engineer's link and when the manager views a page as the engineer; not on the manager's own page.

## Recovering the lost suites (ADR-0111)
`recover_harness.py` (kept outside the repository) replays the saved session records and rebuilt 70 suite files. On v9.32, 9 of 63
browser suites pass as recovered; the others are earlier versions or lack fixtures and are being repaired in batches before they
move into `tests/browser/`.

## Tests
`tests/browser/me.py` (18): the median lines and their direction, their agreement with the rank, the explaining line, the phone
width, and their absence on the manager's own page.
