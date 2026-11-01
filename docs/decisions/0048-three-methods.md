# ADR-0048 — Three clear methods per task type; «against the usual time» in steps

| | |
|---|---|
| **Status** | Accepted (decided by the technical manager) |
| **Date** | 2026-11-02 |
| **Version** | v8.64 |

## Decision
Each task type shows its point, its usual time and one of three methods:
- **On completion (بالإنجاز):** the full point on closing; time does not matter.
- **By speed (بالسرعة):** × the speed multiplier (1.5) when closed within the usual time, else the point.
- **Against the usual time (بالمقارنة بالمعتاد):** from start to finish, in three steps — up to 50% of the usual → ×1.5; up to 200%
  → ×1; more → ×0.5. Steps were chosen over a graded scale to be easy to explain. Limits and multipliers are scoring rules.
- The old «time spent» method (more points for longer) is retired: it rewards delay on repair work. The five types that used it
  (training request, TSU request, wrong sensor reading, CAN readings problem, bulk requests) move to «against the usual time»
  with their existing usual times; old files read «time» as «compare». Their points change by this decision.
- The usual time is set by the manager per type. Beside it the page shows how long half that type's tasks really took
  (the median, with the count) — not the mean, which a few tasks left open for months distort (manual task: mean 10.8 h,
  median 12 minutes, slowest 2015 working hours). A first value from the data is filled when a type moves to a timed method,
  marked an estimate.
- Arabic uses one term: «الوقت المعتاد».
