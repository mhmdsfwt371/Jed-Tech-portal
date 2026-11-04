# ADR-0065 — Every task counts once across overlapping pulls

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-04 |
| **Version** | v8.83 |

## Context
A new pull replaces a stored one only when it covers it whole (`supersede`). A year pull followed by a month pull — or by the sync
extension's two months (ADR-0062) — therefore leaves both stored, and `allTasks()` chained every stored pull's tasks. Every page that
reads `allTasks()` (the board, the person file, ranks, development, overtime, the weights counts) counted the shared tasks twice.
Measured on the October data with a second pull covering 15–29 October: the completed total went from 1,642 to 2,481 (839 tasks
twice) and the overtime changed.

## Decision
`allTasks()` keeps each task once, by its id, in its copy from the most recent pull (latest `extractedAt`), which holds its newest
status. The stored pulls themselves are unchanged.

## Test
The same scenario after the fix: 1,642 → 1,643 (exactly the task completed since), overtime unchanged. The test is kept (dedup.py),
and was run on the code before the fix to show it fails there.
