# ADR-0028 — Workload share for the manager: day, week, month, quarter

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-30 |
| **Version** | v8.23 |

## Context
The manager wants to see, per person, their percentage of the team's work, filtered by day, week, month or quarter.

## Decision
- A "share" section leads the KPI board (admin link only). Calendar windows ending on the last day in the data: the day, the
  Sunday-to-Saturday week (the Saudi work week), the month, the quarter. If the loaded data does not cover the whole window, it says so.
- Each person's share of the completed work, three ways: weighted points (effort, the default), task count, and email tasks
  alone (myafaqy module 146). The even share is shown; 1.5× or more is marked red, half or less grey.
- Computed by `shareWindow()` and `workloadShare()` in core.js from the data already pulled — no new reads from myafaqy.

## Not covered
Outlook replies and sends per person — a separate decision, pending how the team sends (own address or the shared mailbox).
