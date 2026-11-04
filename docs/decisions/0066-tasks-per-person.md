# ADR-0066 — Tasks per person: count and average closing time, by month or quarter

| | |
|---|---|
| **Status** | Accepted (requested by the technical manager) |
| **Date** | 2026-11-04 |
| **Version** | v8.84 |

## Decision
A page «عدد المهام» under the KPIs (manager only): the team one under the other; for a month or a quarter, each person's tasks,
done, then manual tasks (count, average time to close), email tasks (count, average), and both together; an «All» row with
weighted averages; the whole team file or everyone in the pull; a CSV.
- Counted by the **assignment date** (`createdAt`, which is what MyAFAQY's export filters with «Assigned on»), in Saudi time,
  every status included.
- Manual = «Manual Task» and «Manual Task - After Sales»; Email = «Email Customer Activity» — the type names MyAFAQY exports.
- Average = calendar hours from assignment to close, over completed tasks only.
- The System User is not a person.

## Verification against MyAFAQY itself
The manager's own export of Hossam's October tasks (73 assigned to him, 22 of them created by himself — the 22 are inside the 73):
the page gives exactly the export's figures — manual 23 at 4:55, email 24 at 23:18, both 47 at 14:19. Every other team member's
count and done match an independent count from the pull. The export also proved the pull's times to the second (72 tasks).
