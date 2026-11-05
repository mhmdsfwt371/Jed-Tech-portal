# ADR-0072 — «My KPIs» is me; «Team KPIs» is the team without me; one personal view; the structure file shown as uploaded

| | |
|---|---|
| **Status** | Accepted (the technical manager: «As simple as you can, clear and plain. My KPIs shows my data only — not the team's. Team KPIs shows the whole team — not mine. On Team KPIs, clicking a person shows his things. One place.» And: «Make me a place to upload the team structure HTML — I will upload my own part only.») |
| **Date** | 2026-11-05 |
| **Version** | v8.89 |
| **Revises** | ADR-0071 (the planner's cut and «pick yourself») |

## Findings
- «My KPIs» showed team data in two places — «compared with the team average» and «my team» (a leader's table and tab) — and the
  sources twice (cards and a donut), with a quarterly history unlike a team row's.
- It ran a **third calculation** of a person's numbers (meDashboard's own done / points / rate / average / open / e-mail).
- **A real error, older than this release:** a person's page built from the manager's pulls (view-as, and the manager's own
  «My KPIs») set `own` = «assigned to him», while `own` means «he opened it himself». Every task others assigned him counted as
  «opened by himself»: for one engineer in October, 32 tasks (row: e-mail 101 · self 120 · others 32; his page: 101 · 152 · 0).
- The planner page would have refused the file the manager intends to upload: it always dropped the largest plan as «the whole
  branch» — with only his part, that is his own plan, and a single-plan file was refused.
- While pruning orphaned code, the tool ended a function at the first lone «}» after it; one function closed on its own last line,
  so 10 lines after it were eaten (`mailQ` and `periodPicker`, used by the mailbox). Found by the mail suite, restored verbatim from
  v8.88, and the whole set of top-level names was compared with v8.88: nothing else missing.

## Decision
- **Two pages, named plainly:** «My KPIs» (مؤشراتي) and «Team KPIs» (مؤشرات الفريق).
- **One personal view** (`personMonthView`): the month against the month before (from e-mail · opened by himself · assigned by
  others · total · closed of these · average to close · points), open work now, the last six months — the very view a row opens on
  «Team KPIs» and the whole of «My KPIs», from the same engine (factor1 + weightedPoints). The third calculation is gone.
- «My KPIs» carries no team data: no team average, no «my team», no team tab — for engineers, leaders and the manager alike. It
  keeps the header, «your place and progress» (what the rank link carries: his own numbers and level, no colleague), the manager's
  own projects on his own page, and setup. Removed with the old dashboard: openable tiles and their source lines, the Today card,
  the month card, the level section, the meetings export (the device backup carries the meetings).
- «Team KPIs» never shows the person using the portal, even when the team choice includes him.
- `meFromPulls` keeps the pulled tasks as they are (who created each), so «own» keeps its meaning.
- **The structure file is shown exactly as uploaded:** any HTML page; no cut, no «pick yourself»; still kept on this device only,
  carried by the backup, not on the team link, and isolated in a sandbox with an in-memory storage.

## Tests
`harness/mykpis.py` (14): the engineer's and the leader's «My KPIs» equal independent counts (253/251; 53/52) with no team data,
the engineer's three sources equal an independent split (101 · 120 · 32); the manager's «My KPIs» is his own (222/200); «Team KPIs»
excludes him even when chosen; **his row on «Team KPIs» = his own «My KPIs» = «his page as he sees it»**, number for number.
`harness/planner.py` (17): a file with his part only and a single-plan file show at once, exactly as uploaded; isolation proven from
inside the frame; reload, backup and restore; team link; three languages; removal. Full run: 40 of 56 suites clean plus mail
17/17 alone; the other 16 fail exactly as on v8.87 with no new failure line. Suites that tested removed parts were moved to the new
view with independent counts (me, view-as, rules, progress, perf) or retired with a note (src, card).
