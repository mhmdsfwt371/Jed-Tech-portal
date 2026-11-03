# ADR-0057 — Every reading says where it comes from

| | |
|---|---|
| **Status** | Accepted (the technical manager found the readings misleading without their source) |
| **Date** | 2026-11-03 |
| **Version** | v8.74 |

## Context
A number on «مؤشراتي» did not say which pull it came from, which state and dates it counted, or which task types were behind it.

## Decision
- A source box at the top of «مؤشراتي», in bold: where the data came from (his own pull with its date and task count; on view-as «من
  سحب مديرك»; on the manager's own page «من سحبك»), what counts («المهام المكتملة فقط» with this period's types and the count of each),
  and what does not (open or cancelled tasks; customer activities and reports when they are not in the pull, or how many activities
  count in the points when the reports file is present).
- Every tile's detail sheet opens with a bold «المصدر:» line worded from that reading's real definition in `listFor`/`stats`:
  completed = tasks closed between the two dates; points = the same tasks × their type's points from the published weights; rate =
  tasks created in the period except cancelled, completed ÷ total; average = creation to closing in official working hours, then the
  mean; open = open right now whatever the date; from email = the «Email Customer Activity» type created in the period. The types
  behind the list follow, with counts.
- The engineer's pull holds tasks only, so for him customer activities never count; on the manager's board they count in the points
  when the reports file is uploaded. The box says which applies.
- Tested: the box's counts match an independent count from the raw October data (117 of the top type, 11 types, 180 completed).
