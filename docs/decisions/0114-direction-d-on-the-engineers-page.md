# ADR-0114 — Direction D on the engineer's own page

| | |
|---|---|
| **Status** | Accepted (the technical manager chose D of four directions, 12 Nov 2026: «D — and make it real, easy, and catch the eye in a dynamic, interactive way»; on the rank: «do both») |
| **Date** | 2026-11-12 |
| **Version** | v9.34 |

## Context
Four directions for the engineer's card were drawn on real October data (A job card, B place in the team, C the month's calendar,
D the day first, then the month). Research read for the choice (Wharton, Barankay; a study of middle-ranked workers; a survey on
rank and pressure) warns that a bare rank can lower output; the design answer is to show the person the next step up, not only
his position. The owner chose D and asked for both the rank and the gap.

## Decision
On the engineer's own page (his link, or the manager viewing as him) the personal view is laid out in D's order:
1. **Needed from you now** — the number of open tasks, the oldest first, and the date the data is from.
2. **Your month against your team's median** — four tiles (closed, closure rate, time to resolve, points), each with a bar that
   carries a tick at the median. Workload and the open count leave the tiles: one is the «of N» under closed, the other is box 1.
3. **Your next step** — the rank and, beside it, the points needed to pass the one above (or the lead held). The rank block
   moves here; it is not repeated lower down.
4. **Your rhythm** — the month as a calendar; each day is a button showing how many tasks were closed; pressing it lists them.
   Weekends are grey; days after the data's last update are marked as not yet.

**Alive, not loud:** bars grow in, headline numbers count up once, calendar days appear in sequence and lift under the pointer.
With «reduce motion» set, none of it moves.

**A correction that came with it:** an open task's age was counted to today's date, so it grew every day the data was not
refreshed (two tasks one and two days old at the pull read «14 d» and «15 d» two weeks later). Ages are now counted to the data's
last update, on every personal view, and the box says which date that is.

## Not in this version
- A personal target beside each number: no target is approved yet (it belongs to the Jeddah proposal's pilot).
- Team KPIs and the manager's own page keep their six tiles.

## Tests
`tests/browser/me.py` (26): the order, the ages against the data's date, the single place of the rank, bars and settled numbers,
the calendar's days, pressing a working day and a weekend day, the summary, the phone width.
