# 0123 — A long page's sections as cards that open in a window

Date: 14 November 2026 · Version 9.48

## Context
The manager does not want to scroll down long pages to reach details. Team KPIs kept seven sections (the team over recent months,
the week, workload, the management report, tickets and accounts, team messages, definitions) in one fold under the board; opened,
it ran for several screens.

## Decision
- `secCards(page, sections)` draws each section as a card: its title, its headline number where one exists, and one line saying
  what is inside. A click opens the section in one shared window (`dialog.sec-dlg`), which pages itself when long (ADR-0119).
- The sections are built with the page, as before, so nothing is computed twice. When the page redraws while the window is open,
  the window takes the fresh nodes of the same section, so sorting or toggling inside it keeps working.
- A link from another page opens a card on arrival (`secWant = 'kpi:week'`): the control room's «open more than 7 days» alert
  opens the week, «Management reports» opens the report.
- Inside a window nothing fades in on scroll; it is shown whole at once.

## v9.49 — the other long pages
- Team: the assignment panel stays on the page (it is an action, not a detail). The team file, the accounts board and the
  comparison with MyAFAQY are cards; signatures are a card only while editing the team, as they were only shown then. The
  read-only pass that turns the team list into text works on the team file's own node, wherever it is shown.
- Weights: the advanced settings are one card; the rules and types boxes are added into that node (`wAdvNode`) after drawing.
- My KPIs: «Update my numbers» and the definitions are cards. The top «Set up again» fold had been empty since its nodes were
  appended again further down; it now opens the update card.
