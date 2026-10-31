# ADR-0040 — «التطوير»: one page for quarter development plans

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-31 |
| **Version** | v8.50 |

## Context
Development pieces were spread out: the development plan inside the level table, next month's plan cards and the team map on the board,
and the monthly meeting on the person cards in My KPIs. The manager wants each person's plan for the next quarter, set from past work and
followed against current work, in one place.

## Decision
- A manager-only page «التطوير» (never reachable from the team link), under المؤشرات.
- Per quarter (next by default, or this one) and per person: a baseline from the previous quarter (done, points, average duration,
  completion rate, top task types, the four level axes), goals (points, done, average duration — lower is better, completion rate, a task
  type, or a custom goal with its own percentage) with target and weight 1–5, live progress from the quarter's work, a weighted plan
  progress, a reference colleague, development actions, notes, and draft/agreed.
- «اقترح من شغله» suggests goals: points and done +10% (+20% when volume is the weakest axis), average duration −10% (−20% when speed is),
  completion rate at least 90%, and the most frequent task type; the reference colleague comes from the existing development plan.
- The quarter's three monthly meetings sit inside the plan; this month's plan cards and the team map moved here from the board.
  The board and My KPIs keep links to the page (the team link keeps the meeting on leaders' cards, since it has no Development page).
- Plans live on the device (IndexedDB key `devplans`) and ride in the full backup. Team Excel; signed PDF per person.
- Engine in core.js (quarterRange, quarterOf, quarterBaseline, quarterGoalProgress, planProgress, suggestQuarterGoals) with unit tests.
