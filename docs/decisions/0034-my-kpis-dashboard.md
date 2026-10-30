# ADR-0034 — My KPIs as a dashboard: tabs for a leader, folding tile blocks, detail windows with export

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-31 |
| **Version** | v8.36 |

## Decision (the manager's choices)
- Anyone with people below them gets three tabs: **Me · My team · Alerts**. Engineers keep the single page.
- "Me" and "My team" each open with a block of six tiles (done, assigned, completion, median, self-logged, from email) that folds
  with an arrow. Every tile opens a window: for me, the task list; for the team, a per-person table plus the task list. Each window
  exports CSV (opens in Excel, Arabic-safe with a BOM).
- "My team" shows a card per person; a card opens that person's six tiles and their open and finished work.
- Team completion = of the tasks assigned in the period, the share done (never summed done ÷ assigned, which exceeds 100%).
- "Alerts" gathers the existing attention/improved notes and open work older than seven days for me and my team.
- The Team page groups people by department (management, after-sales, R&D); the assignment panel lists the after-sales department only.
