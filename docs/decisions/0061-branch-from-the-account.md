# ADR-0061 — The pull's branch comes from the manager's own MyAFAQY row

| | |
|---|---|
| **Status** | Accepted (another branch's manager must pull his own branch) |
| **Date** | 2026-11-04 |
| **Version** | v8.79 |

## Context
Both shortcuts (the manager pull and «أنواع الفرق») filtered teams by the Jeddah branch code («2»), and also accepted any team whose name
contains "Jeddah". A Riyadh manager would have pulled Jeddah's teams and types.

## Decision
- The portal builds both shortcuts with the branch of the chosen manager's own row in the employee list (ADR-0060): the manager the team
  file names, or the one picked under «الفريق حسب ماي أفاقي», or the top of the tree. Until a pull carries the list, the branch stays
  Jeddah.
- The rule "a team whose name says Jeddah counts as Jeddah" now applies only when the branch is Jeddah.
- The Data page states the branch and where it came from; when the branch changes, the pull buttons are rebuilt at once and the page
  asks to drag the button again once (a bookmark keeps the code it was dragged with).

## Tests
Unit: the shortcut for branch «1» filters by «1» without the name rule; Jeddah keeps both; the hierarchy returns a manager's branch.
Browser: a Jeddah manager's buttons carry «2»; a Riyadh-style manager's two pull buttons and the «Team types» button carry «1» without
the name rule, right after the pull that brings the list (a first version left one button on the old branch until reload; fixed).
