# ADR-0044 — «ملف الموظف»: everything about one person in one place

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-01 |
| **Version** | v8.60 |

## Context
One person's details appeared in eight places over four pages: My KPIs team cards, the board's level table, workload and share,
the management reports, the team page, Development and the monthly meetings. Understanding one engineer meant visiting all four pages.

## Decision
- A manager-only page per person: a head with role, leader and leave; this month against last (done, points, completion rate,
  average duration) from `quarterBaseline`; level and axes from the level engine; workload and share of the team's points; both
  quarters' plans with progress; the last three monthly meetings read only; open work with titles.
- Actions: view their page as they see it (view-as), their plan in Development, and their PDF report.
- The comparison tables stay where they are — comparing people is their purpose — but every team member's name in the KPI board and
  the team page links to the file (`linkNames`, applied after each redraw by wrapping the two renderers), and Development links back.
  Details are no longer repeated: each table shows the comparison, the file shows the person.
- Reached from the menu (under الفريق), from any name, and from Development. Not on the team link.
