# ADR-0031 — The basis of a task type's points: four factors, three methods

| | |
|---|---|
| **Status** | Accepted — the standards marked "estimate" are to be adjusted by the manager |
| **Date** | 2026-10-30 |
| **Version** | v8.29 |

## Context
The manager wants each 1–5 weight to show what it rests on, and some types valued by time, some by completion, some by both,
according to the work and its importance. myafaqy's time runs from opening to closing and includes waiting, so raw time would
reward leaving tickets open.

## Decision
- **Base 1–5 from four stated factors**, each 0, 1 or 2: technical depth, outside party, field work, business impact.
  Sum of 8 → 0–1 = 1, 2–3 = 2, 4–5 = 3, 6 = 4, 7–8 = 5. The stored weight must equal what the factors give (guard rule 22).
- **Three methods:** *on completion* (the base; time ignored — routine work whose time is waiting); *completion + speed*
  (×1.5 if closed within the type's standard time — customer work where speed is the service); *by time* (the base × working
  hours ÷ standard, clamped to ×0.5–×2 — work whose size varies, never rewarding slowness beyond double).
- **Working hours** are Sunday–Thursday 08:00–17:00 Saudi time. Standards come from October's team medians where there was data,
  otherwise an estimate marked as such; the manager edits them on the Weights page.
- One function, `taskPoints()`, turns every task into points everywhere (board, cards, levels, shares, goals).
- WASL linking: base 2, on completion (the manager's call).
