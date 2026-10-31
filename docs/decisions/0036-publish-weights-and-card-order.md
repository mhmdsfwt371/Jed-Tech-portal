# ADR-0036 — Publish the weights from the portal; activities in points; card order by drag

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-31 |
| **Version** | v8.40 |

## Decision
- The main page still calls no outside address (rule 4). "Publish the weights to the team" hands the draft to the links admin page
  (same origin, localStorage), which validates it (schema; every base equals its factors) and writes `weights.json` through the
  GitHub contents API with the manager's key. Everyone's points then follow — the board and every profile recompute on load.
- Points in My KPIs count Done activities from the activity log (reports on the device) by their category's weight, beside tasks.
- Person cards and the team's month cards can be dragged into any order; the order is kept per list on the device.
- "Weighted points" is called "points"; the one-to-one is "the monthly meeting".
- team.json may carry `covers` — department keys (after-sales, presales, R&D, projects) a person oversees — shown on the profile
  instead of myafaqy's team list. Keys only, no names (rule 20 updated).
