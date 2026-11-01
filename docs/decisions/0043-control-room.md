# ADR-0043 — «غرفة المتابعة»: the manager's first page

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-01 |
| **Version** | v8.59 |

## Context
The manager link opened on the tools page; nothing said where the team stands or what needs attention, and the indicators menu was in
build order (data, board, team, weights, development), not work order.

## Decision
- A manager-only page, the manager link's landing page and first menu item (the team link redirects it to «مؤشراتي»).
- Data freshness: the latest pull's last day, task count, pull date and a pull button; amber after two days.
- This month against last month: done, points, open now (with how many are over seven days), team size.
- «محتاج انتباهك», each from an engine other pages already use, each opening the page that handles it: critical workload
  (workload engine), no agreed plan for next quarter (Development), work open over seven days, pending names.
- Shortcuts: KPI board, Development, Team, management reports, view as a team member.
- On the manager link «الرئيسية» is renamed «أدوات الفريق» and the home button points to the control room.
- The indicators menu follows the work: board, development, team, then setup — data, weights.
