# ADR-0032 — Load sustainability: workload signals before burnout or resignation

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-30 |
| **Version** | v8.30 |

## Context
The manager asked for one distinctive, high-impact capability above the KPIs, found in few systems. Market review (Oct 2026): AI
scheduling and predictive maintenance are becoming standard in field-service platforms; early warning of unsustainable workload
appears mainly in specialist workforce-analytics products, built on work-pattern signals (after-hours and weekend activity, load
against capacity, effort rising while output falls), reported to precede burnout weeks before surveys and resignations.
October's own data showed the signal: a team lead closing most of his work outside working hours and on weekends.

## Decision
- For each person over the last four weeks, from task completion times (and, on the manager's device, email reply times):
  the share after hours (outside Sun–Thu 08:00–17:00 Saudi time), on Friday/Saturday, and after 21:00; whether after-hours
  work rose in the last two weeks; and an engineer's load against peers under the same leader.
- Amber: 15% after hours, 5% weekends, 5% late, +10 rise, or ×1.5 load. Red: 30%, 15%, ×2, or three ambers.
  Too few events → "little data"; on leave → skipped.
- Suggested actions: move about N points a week to the lightest peer; review working hours (evening shifts are normal);
  a leader working after hours → delegate.
- **Signals, not a diagnosis. Manager only**: the admin board; never the team link or anyone's profile.
