# ADR-0102 — Every card filters (mouse and finger); one place for each number; tasks and hours never share an axis

| | |
|---|---|
| **Status** | Accepted (the technical manager: «a card in a pop-up should filter its data — green on touch or mouse — and clear on a second press, in every page, module and pop-up»; «review all the work with a quality eye: make unclear data clear, and where places give the same value, keep it in one place»; «the May point is wrong»). Supersedes the answer line of ADR-0059 on the control room, Team KPIs and the tender register. |
| **Date** | 2026-11-08 |
| **Version** | v9.21 |

## Cards that filter
- Number windows (done, points, open, team, a pulse day, one person's mail): a tile with a filter, or a person's bar, narrows the
  list, the bars, the count and Excel; it turns green; a second press clears it; a line says what is shown, with «Show all» (drawn
  only while something is filtered, so no second close-like button). Done: last 7 days. Points: at or above the average; the top.
  Open: older than 7 days; the oldest. Team: closed something this month; on leave. Mail: each category.
- Tender register: «Arrived in the period» shows all; «Awaiting a decision», «Submission due within 7 days» and «Win rate» (the
  decided) filter the table. A card and a stage never stack.
- Team KPIs: a tile shows only the people with that number, sorted by it (average: those who closed, fastest first).
- The person dashboard's tiles have no list to filter: a tap shows the definition (ADR-0101).

## One place for each number
| Page | Was repeated | Now |
|---|---|---|
| Person (Team KPIs, My KPIs) | tiles + «numbers in detail» + «recent periods» | tiles (⚑ on each, R&D when pulled), the ring (change per source), the chart; open work inside its card; the table kept for screen readers only |
| Control room | sentence + tiles + «older than 7» twice | tiles; «older than 7» only in «Needs your attention»; «Open now» shows the oldest age |
| Team KPIs | sentence + tiles; the bar's legend + source tiles | tiles; each source tile carries its share |
| Tender register | sentence + cards; «Won» card = «Won» stage | stage line counts stages; cards: in the period (all stages), awaiting, due soon, win rate |

## Clearer
- The month chart: tasks on top with closed/total on each bar; the average time in its own strip below with its value at each point.
- `td_col_readyOn` showed raw — now «Offer ready on (technical + financial)». `harness/rawkeys.py` opens every page in three
  languages, rows and folds open, and fails on any raw label key (proved on this fault before the fix).
- The closed-share ring had no room on a phone and covered the average's text: room beside it on wide screens, below it on a phone.

## Tests
`cardf.py` (20, desktop and phone taps), `dedup.py` (15), `rawkeys.py` (3). Eleven suites moved to the new places for the same
checks. Full run 73/73.
