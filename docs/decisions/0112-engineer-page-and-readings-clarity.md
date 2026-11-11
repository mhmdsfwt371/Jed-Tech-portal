# ADR-0112 — The engineer's page and «Monthly readings», judged by the people who use them

| | |
|---|---|
| **Status** | Accepted (the technical manager: «consider yourself a team leader and an engineer who will use the portal — what do we change to make it easier for them and make all the readings clear») |
| **Date** | 2026-11-12 |
| **Version** | v9.32 |

## What the walk-through found
The engineer's page was opened on a phone with the real October pull, for a mid-ranked engineer, through «view as».

1. **A wrong rank.** The rank block ranked today's calendar month, not the month on screen. With October pulled and the date in
   November, every engineer read «Rank 1 of 7 — in the lead by 0 points», his real October rank appeared as «last month», and the
   achievement «First place in a month — not yet» contradicted it on the same page.
2. **A page wider than the screen** (441 px on a 390 px phone): the grid column took the width of its longest line.
3. The chart's legend cut to one letter («F. 28», «O 90»), because the chart and the open-work card stayed side by side.
4. Six lines of notices before the first number; the missing month said twice; «hover» on a touch screen; «pull it on the Data
   page» on a link that has no Data page.
5. Doubled labels in English («Workload / Workload»); the engineer's own page speaking of him as «he».
6. The one thing he can act on — his open tasks — below a chart; the calculation notes always open.

For the team lead on «Monthly readings»: a tile gave a number but not its meaning without hovering; «Open (over 7 days): 5 (2)»
was cryptic; nothing marked the member who needs attention.

## Decision
- **Rank:** of the month on screen, and only of months a pull covers; the block names the month («in your team, October 2026»).
  The month before is quoted only when it is pulled. A tie reads «level with the next colleague»; a month with no closed work
  shows no rank.
- **Phone:** nothing wider than the screen; chart and open work stack, open work first; legends wrap instead of being cut.
- **Words:** the missing month is said once; «tap» on touch screens, «hover» elsewhere; on the engineer's link the notices speak
  of «your data» and never of the Data page; his own page addresses him.
- **Labels:** the second (industry) label shows only when it adds something to the first.
- **«How it is calculated»** folds away, like «Refresh and setup».
- **Monthly readings:** three tiles carry a plain line on what the number means; open and overdue are separate columns and an
  overdue count is marked.

## Not done, on purpose
- A yardstick on each of the engineer's tiles (the team's median beside his number). It needs a decision on what an engineer may
  see of the team; it is a separate proposal.
- The larger redesign of the engineer's card (directions A, B, C) still waits for the owner's choice.

## Tests
`tests/browser/me.py` (13, on the real October pull): width, the rank's month and its agreement with the achievements, the notice,
touch and desktop wording, labels, order, legend, folded notes. `tests/browser/readings.py` (20). `tests/browser/smoke.py` (11).
