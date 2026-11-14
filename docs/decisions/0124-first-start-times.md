# 0124 — When a task was first started, for the last 7 days

Date: 14 November 2026 · Version 9.50

## Context
The daily table (ADR-0121) knows which tasks are still in To-Do at the pull, but not how long a closed task waited before
someone started it. MyAFAQY keeps that in each task's activity log, which the task screen reads with
`GET Task/GetTask/{taskId}` (captured 31 October 2026): rows with `actionId` and `createDate`. One request per task.

## Decision
- The manager pull reads the log only for tasks created in the last 7 days, skips cancelled tasks and tasks still in To-Do
  (they have no start), waits 120 ms between reads and stops at 800 tasks.
- `firstStart(activities)` takes the earliest «Start» (8) or «Complete» (11): a task closed without pressing Start left To-Do
  when it was closed. Times are UTC like every other time in the pull.
- The task carries `startedAt`; missing means «not known», never «not started».
- The daily table adds «Started after the limit» as «late / known» only when some start is known, and the day's window shows
  each task's start beside its deadline. Days outside the window show «—».
- The guard lists the three reads added since v9.44 (two server lists, the task log); a refused read is reported by name.
- Extension 1.0.6 carries the same pull.

## Not checked yet
The read has run only against the test stand-in and the unit tests, not yet against MyAFAQY; the first real manager pull will tell.
