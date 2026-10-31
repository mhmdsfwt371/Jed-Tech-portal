# ADR-0038 — The board in tabs; two report files; the "Today" card

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-31 |
| **Version** | v8.43 |

## Decision
- The KPI board is four tabs — Overview · Team · Email · Reports — instead of ten sections in one scroll with a quick-links row
  (which had two buttons both called "Reports"). Management reports sit first in the Reports tab, named "Management reports".
- Reports come as two files: a two-page team summary (cover + executive summary) and a full report with a page per employee,
  plus the interactive HTML. A single engineer's PDF stays beside each name.
- One publish path for weights (the one-click publish through the admin page); the old copy-to-GitHub dialog is removed.
- Nothing the team reads mentions GitHub, a key or the repository; the help speaks of the manager approving and publishing.
- The "Today" card opens My KPIs for everyone: greeting by time of day, streak of working days with a completion, yesterday
  against one's own daily average, this week against one's best week, open work with the oldest to start on, and the team's
  weekly points against last week. All from data already on the device.
