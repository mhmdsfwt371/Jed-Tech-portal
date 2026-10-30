# ADR-0030 — The engineer's level, trend and forecast; the plan is the manager's

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-30 |
| **Version** | v8.28 |

## Decision
- Per quarter, four axes as percentiles **among peers under the same leader** (leaders are not levelled; people on leave are
  neither judged nor used as a yardstick): volume (weighted points), difficulty (integration and multi-stage share; on the manager's
  device also the hard-email share), speed (median completion time; on the manager's device also the first-reply time), reliability
  (completion of what was assigned). Axes need enough work (10 points / 5 tasks); otherwise "too little to judge".
- Score = the average of the axes available (two at least). Level: 4 Reference (80+, difficulty 60+), 3 Specialist (60+),
  2 Practitioner (35+), 1 Starter. Trend against the previous quarter (±8). Forecast from three quarters or more (linear).
- **The engineer sees** their level, score, axes, trend and forecast. **Only the manager sees** the development plan: the two weakest
  axes under 50, each with a concrete action and the peer strongest on that axis as reference.
- Quality from PRO joins as a fifth axis once repairs are linked to tickets.

## Also in this release
Static explanations were removed from every page by the manager's request; the interactive help ("?" and the step-by-step guide)
remains. Empty-state messages, action steps, data lines and the one-write warning stay.
