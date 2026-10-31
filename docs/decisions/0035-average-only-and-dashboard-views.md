# ADR-0035 — One time measure (the average); task type and points in My KPIs; board and list views

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-31 |
| **Version** | v8.38 |

## Decision (the manager's call)
- Every visible "median" is replaced by "average duration" (mean of creation-to-close hours over tasks completed in the period):
  board table, sort, trend table, summary strip, profile tables and tiles. The definition warns that one long task can lift it.
  Internal comparisons inside the month card and levels keep their robust medians; they are never shown under that name.
- My KPIs tiles: done · weighted points · completion · average duration · open now · from email — for me and for my team.
- Every detail window has two views: an information board (per person, by task type, points by type, by week) and the list
  (person, type, status, created, hours, points), exported as CSV.
- The My KPIs bookmark hands over the task type's name (`y`), the same list for everyone — guard rule updated; older pulls on the
  manager's device take the type from the team data.
