# ADR-0111 — «Monthly readings»: the proposal's measurement basis, for any pulled month

| | |
|---|---|
| **Status** | Accepted (the technical manager: «implement it on the portal — something excellent and complete with which I can show October's figures and every month's») |
| **Date** | 2026-11-12 |
| **Version** | v9.31 |

## Context
Jeddah's proposal on after-sales points and the scorecard (a document and an evidence workbook, 11 Nov 2026) rests on readings taken
from the October pull. The same readings are needed every month, by the same definitions, without rebuilding a workbook by hand.

## Decision
- A page under KPIs, «Monthly readings» (`#readings`, manager link only), computed by `monthReadings()` in core.js:
  - **Scope:** the accounts MyAFAQY lists in the team «Jeddah After sales Team» (the system account excluded). This is the proposal's
    scope; Team KPIs keeps its own (the roster in scope), and the page states its scope in a line under the controls.
  - **Month:** tasks created in the month, Saudi time. Only months a pull covers from their first day are listed: a pull of one
    month also carries older tasks that are still open, and those do not make a month.
  - **Origin:** e-mail (the mail module), self (creator = assignee), others. **Time:** creation to closure, clock hours.
  - **Points:** the effort tier of the type, from the Weights page (1, 2, 3, 5). **Dammam-equivalent:** `DAMMAM_MAP`, the nearest
    item of Dammam's proposal per type; per working day (Sunday to Thursday, to the last day pulled), against a target of 60.
  - **Automatic score (of 65):** output against the median member's points, capped at 110% (30) · system-stamped tasks closed within
    8 h (25) · no task open over 7 days, 25 points lost per task (10).
- Six headline tiles (each with the month before when it is pulled, and its definition on hover or tap), tables by task type and by
  member, the other readings with how each is measured, month by month, and an Excel export (Readings, Types, Members).
- Members are numbered by tasks closed; «Show names» is off by default, for showing the page outside the branch.
- Each number sits in one place on the page. Every table that scrolls sideways is a named region the keyboard can reach.

## A correction this work produced
Building the page exposed an error in the proposal's first workbook: times MyAFAQY had already written in Saudi time (+03:00) were
shifted three hours again, so one task of 30 Sep 21:52 was counted in October, and «open over 7 days» was counted in whole days.
The portal was right (1,134 tasks, not 1,135). The workbook and the document were corrected to version 1.1; the unit test carries
that boundary case.

## Lost working environment, 12 Nov 2026
The working environment was reset before this version was published: the unpublished changes and the browser suites that lived only
there were lost (the risk recorded in ADR-0106). The page was re-applied from the session's own record on a fresh clone of v9.30.
The suites written again for this release now live in the repository under `tests/browser/` (the site publishes app files only,
ADR-0107), so they cannot be lost the same way. The older suites are still to be rebuilt.

## Tests
`tests/core.test.mjs` (invented data): scope, origin, the Saudi-time month boundary both ways, times, tier and Dammam points, backlog,
the capped score. `tests/browser/readings.py` on the real October pull (kept outside the repository): every reading and the members'
points and scores equal the workbook; numbered members and the names switch; only pulled months; the Excel export; a second month;
three languages; the engineers' link blocked; the phone. `tests/browser/smoke.py`: every page in three languages without an error or
a raw key, and the WCAG 2.1 A and AA scan on every page.
