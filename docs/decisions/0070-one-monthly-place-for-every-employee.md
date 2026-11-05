# ADR-0070 — One monthly place for every employee; no number in two places

| | |
|---|---|
| **Status** | Accepted (the technical manager: «I want one thing, fixed and correct: go here, open the KPIs, and you get this and this, once, from one place. If any data is repeated, keep it only in its main place.») |
| **Date** | 2026-11-04 |
| **Version** | v8.88 |
| **Supersedes** | the board's per-pull period (ADR-0059), the person file (ADR-0044), the tasks-by-source page (ADR-0067's page — not its engine) |

## Findings
- **The board could not show a month.** Its period list was the pulls themselves: a quarter pull showed the quarter as one number,
  and overlapping pulls (quarter, month, the extension's two months) showed as three periods that overlap.
- **One employee's month was in four places** — the board's row, «tasks: source and time», the person file, and «his page as he
  sees it» — and **two engines** produced it: the person file used `quarterBaseline` (points from tasks only), the board and the
  tasks page used `factor1` + `weightedPoints` (points from tasks and customer activities). The same person's month could show two
  point totals depending on the page.
- Repeated inside the board too: the share of points (a section and the points column), the team level and plans (board tab,
  development page, person file), the engineer PDF (reports tab and person file), the mailbox (board tab and mail page),
  deleting a pull (board period list and data page).
- **A wrong definition still showed** to engineers in «My KPIs» and in the guide: def_4 said «from e-mail» means the
  «Email Customer Activity» type — the definition ADR-0067 replaced with the mail-integration mark.

## Decision
- **«KPIs» is the one place for «who did what in a month».** The month comes from what the pulls cover (a quarter pull gives three
  months), every task counts once across pulls (`allTasks()`, and now `allActivities()` the same way), and the month before is
  compared automatically.
- One engine: `factor1` (the three sources, closed, time to close of what arrived in the month — the «Assigned on» basis verified
  against myafaqy's export in ADR-0067) and `weightedPoints` (points for what was closed in the month, with customer activities).
- One table: from e-mail · opened by himself · assigned by others · total · closed of these · average to close · points, with the
  change from the previous month under total, average and points; the team row and the group bucket under it; CSV.
- **An employee has no page of his own:** his row opens in place — the month against the month before, his share of the team's
  points, his open work, the last six months, his month's PDF, his development plan (the plan's home stays «Development») and his
  page as he sees it. Every name anywhere (`openPerson`) opens that row.
- Removed: the per-pull period list and its delete button (deleting stays on the Data page), the tabs, the donuts, the share
  section, the level section (its home is «Development»), the trend across pulls (replaced by the team's recent months), the
  «tasks: source and time» page and the person page (their old links land on the board).
- Under the table, one fold «More» holds what is not the month's table, once each: the team over recent months, the week at a
  glance, workload, management PDFs (for the chosen month), tickets (read from the pull that covers the month, labelled), rank
  links, and the definitions.
- The Outlook mailbox moved to the mail page, shown with or without a PST file.
- def_4 corrected in three languages; def_6 uses the same name for the self source as everywhere else.

## Found while testing the whole portal (58 browser suites, each compared with v8.87)
- The Outlook sign-in came back to the board and the mailbox redrew the board (7 places) — both now go to the mail page; the
  mailbox also shows before any PST file is loaded.
- «His page as he sees it» was reachable only from a counted person's row; leads and managers have no row — the board's bar now
  has one picker for anyone's page.
- The person file's «reports to · on leave» line is kept, at the top of a person's details; the rank-message copy button was in two
  places and now lives once, in the rank list under «More».
- The year-share code left orphaned by the removed share section was removed; no other function was orphaned (checked).
- Suites that tested the old shape were moved to the new places with the same intent (dev, home, mail, person, rank links,
  rules, team, view-as, weekly); srcdash.py is retired — its numbers are kept in monthly.py.
- 16 suites fail exactly as they did on v8.87 before this change; they are not caused by it and are reviewed separately.

## Tests
`harness/monthly.py` (26 checks, real Chromium): a quarter pull (built from October's real tasks, shifted) and October's real pull
give exactly Oct, Sep, Aug, Jul; every counted person's six numbers equal an independent count for October and for September;
Hossam equals myafaqy's own export (24 · 22 · 26 · 72 · 14:07); team row = sum of the people (tasks and points); the change shown
equals the independent difference; a third, overlapping pull changes nothing; the row opens with both months, four months of
history and the three buttons; CSV = the table; the mailbox is on the mail page with no PST; «More» holds the four months and five
definitions; the development page's button and the control room's «reports» open the board; no raw key in Arabic, Urdu or
English; no page error across the pages that link to the board.
