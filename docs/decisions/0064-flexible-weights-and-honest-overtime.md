# ADR-0064 — Every weight is a field; the count has a period; overtime covers the whole team and says when it is a minimum

| | |
|---|---|
| **Status** | Accepted (the technical manager: "everything flexible, nothing I find already set") |
| **Date** | 2026-11-04 |
| **Version** | v8.82 |

## Weights page
- The column «Count, latest period» counted every task of the type (open and cancelled included) in the last stored pull, whatever its
  period — misleading. It is now «Completed in the period»: completed tasks only, in a period the manager picks (all pulled data, this
  month, last month, from — to), with a line stating the dates and the number.
- Each type's method and usual time are fields on the main table, next to the points; the speed bonus (×) is a field above the
  tables. A method the manager switches to starts with **no** usual time and asks for one (until then it counts on completion only —
  the engine applies no multiplier without a usual time); a usual time he types is kept as his ("set"). Values the portal seeded
  (estimates, October medians) stay as they were and are marked, so no team member's points move without his decision.
- The explanation line under a method shows only where it adds something the fields do not already say (speed, custom methods),
  keeping the page under 500 words of reading.
- Rights are unchanged: a lead with rights on one type can edit that type only, in both tables; the speed bonus is the admin's.

## Overtime page
- The team is the whole team file — leads and managers included. The KPI "counted team" (engineers only, ADR-0059) had hidden the
  team lead's three October Saturdays and the manager's Saturday.
- MyAFAQY records when a task is created and closed, not when it is worked on: on 3 October the team lead's six tasks were created by
  the System User at 14:48–14:52 and closed at 14:53–14:54 — six minutes on record for a working Saturday. A day with three or more
  closes within 15 minutes is marked «closed in one batch», the hours are labelled a minimum, and the answer line counts those days.
  Payroll decisions should rest on check-in/check-out or the task start time, not on this estimate.
- Friday stays out by the manager's decision.

## Checks
- The link checker treats 429 (too many requests from the checker) as a site that is up.
- Tests: the overtime test's independent count now covers the whole team and the batch days; new weights checks use the period,
  a new method with no usual time, a typed usual time, and the speed-bonus field; the lead-rights check counts editable types.
