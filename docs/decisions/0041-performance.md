# ADR-0041 — Performance: remembered results, partial redraws, paged lists, lighter fonts

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-31 |
| **Version** | v8.54 |

## Context
A review against a common web-performance checklist. Server items (load balancer, indexes, N+1, pooling, server caching, payload
compression) do not apply: the portal is a static site computing on the device. Measured with October's 1,697 tasks and a simulated
year (20,364 tasks).

## Decision
- **Remembered results:** the level engine, the workload engine and the monthly team cards keep their results per task list until the
  weights, the team file or the mail rows change; `allTasks()` returns the same list until the datasets change; Saudi-day conversion
  remembers converted instants (bounded at 200,000).
- **Partial redraws:** an edit in a Development plan redraws that plan and its card's ring and hint only.
- **Paged lists:** long tables draw 200 rows with “show N more — M left”, replacing silent cuts at 400 (KPI windows) and 300 (clients).
- **Fonts:** Noto Sans Arabic served as WOFF2 (234 → 75 KB and 242 → 77 KB raw); TTF files removed; an unused 600 KB PDF removed.
- **Not done:** minifying JS/CSS — the host already gzips (app.js 276 → 82 KB) and the guard reads the source.

## Result (simulated year)
Editing a goal 1,074 → 0 ms frozen; reopening Development 650 → 0 ms; reopening the KPI board 385 → 161 ms.
