# ADR-0067 — One definition of a task's source, one engine, and the tasks dashboard

| | |
|---|---|
| **Status** | Accepted (the technical manager: "one place for each thing, no number hitting another") |
| **Date** | 2026-11-04 |
| **Version** | v8.85 |

## What the review found
- «From e-mail» had **two** definitions: the board used the e-mail integration marker (`fromEmail`, module 146), while the
  «Tasks per person» page (ADR-0066, the same day) used the task type «Email Customer Activity». Over the October pull they disagree on
  4 of 1,672 tasks — small, but two definitions under one name.
- Two **bases** for an average: the board averages what was **closed** in the period (older backlog included: one 4-month-old task
  is 2,900 hours), while MyAFAQY's «Assigned on» export — the manager's check — averages what **arrived** in the period.
- The «counted team» (engineers without leads, ADR-0059) and «the whole team» give different totals for the same label.

## Decision
- **One source definition** (`taskSource` in core.js): «email» = made by the e-mail integration; «self» = opened by the person for
  himself (`isSelfLogged`); «other» = assigned by a colleague, a manager, or the system from a request. Every page reads it. The
  type-based split of ADR-0066 is removed.
- **One engine**: the board's `factor1` now also returns, per source, the received count, the done count, the time to close over
  what was done in the period, and the **received cohort's** own closing time (average, median). The board, the dashboard and My KPIs
  all read it; the board's «From email» and «Self-logged» tiles equal the dashboard's received by source by construction.
- **The dashboard** («المهام: المصدر ووقت الإنجاز», under KPIs, manager only) leads with what arrived in the period (the export's
  basis) and prints the board's «everything closed» number on the same card, with the reason the two differ. Default scope = the
  counted team, as on the board. Interactive: count or time view, sort, hover for numbers, click a person to turn the cards to him;
  the chart's scale ignores one outlier (marked «›»); a CSV.
- **My KPIs**: the person's own split from the same engine row as its comparison cards.
- **Overtime**: the tasks behind the Saturdays and evenings, by source, with their average time to close; each task in the details
  says where it came from.

## Where each task number lives (inventory)
| Number | One home | Basis | Engine |
|---|---|---|---|
| Closed in period, New in period, New tasks closed | KPI board strip | closed / arrived / arrived and closed | `factor1` |
| Average time (board tile) | KPI board strip | closed in the period | `factor1.avgHours` |
| From e-mail, Self-logged (counts) | KPI board strip — and the dashboard's «arrived» by source | arrived in the period | `factor1` + `taskSource` |
| Time to close by source (average, median) | Tasks dashboard (team), My KPIs (own) | arrived in the period | `factor1.bySource.cohort*` |
| Out-of-hours days and hours | Overtime page | task events on Saturday / 19:00–24:00 | `overtimeOf` |
| Out-of-hours tasks by source | Overtime page | tasks behind those days | `taskSource` |
| Completed per type | Weights page | completed in the chosen period | `allTasks()` (each task once, ADR-0065) |
| Points, rank, level | Board, person file, My KPIs | completed in the period | the points engine (`taskPoints`) |

## Verification
Hossam's October row equals MyAFAQY's own export for the same 72 tasks, in all four groups: all 72 (14:07), by himself 22 (5:07),
e-mail 24 (23:18), assigned by others 26 (13:15). Every counted-team member's numbers equal an independent count; the board's
«From email» and «Self-logged» tiles (440, 426) equal the dashboard's.
