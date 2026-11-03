# ADR-0060 — The team from MyAFAQY's own hierarchy

| | |
|---|---|
| **Status** | Accepted (requested by the technical manager so that every manager, including other branches, gets his team from MyAFAQY) |
| **Date** | 2026-11-04 |
| **Version** | v8.78 |

## Context
The counted team came only from the hand-written team file (`team.json`). MyAFAQY holds each employee's manager (User management →
Employees), so another branch's manager could not get a correct team without someone writing a file for him.

## Evidence
A capture on the Employees page showed one read request, `POST EmployeeIC/GetAllEmployeesGrid` (the standard grid body; the response
rows are in `data.data`; paging by `pageNumber` from 0, `data.totalPages` and `data.listCount`). A row holds `id`, `nameEn`, `nameAr`,
`phoneNumber`, `identityNumber`, `department`, `manager`, `branch`, `status`, `branchCode`. `manager` is the manager's NAME, not an id.

## Decision
- The manager shortcut reads that request after the teams, page by page with the page's own body (pageSize 10), and keeps a fixed
  whitelist of eight fields: `id`, `nameEn`, `nameAr`, `department`, `manager`, `branch`, `branchCode`, `status`. It never reads or
  copies `phoneNumber` or `identityNumber`; the guard fails the release if either name appears in the shortcut. A failed request (no
  permission, a changed path) never fails the pull: the list is simply empty.
- The list travels in the tasks file beside `teamTypes`; the parser re-applies the whitelist and caps (3,000 rows); a newer list
  replaces an older one.
- Employees are tied to the portal's people by **name** (English, then Arabic, normalised): the employee ID No. is not the user id the
  tasks carry. Employees that match nobody are listed, never guessed.
- The Team page shows «الفريق حسب ماي أفاقي»: the chosen manager (default: the one the team file names as covering the departments,
  else the top of the tree), how many engineers sit under him, the differences from the team file (a different manager, under him in
  MyAFAQY but not in the file, in the file but not in the list, inactive in MyAFAQY, in MyAFAQY but matching nobody), a preview of
  what the counted team would become, and a switch. The switch is OFF until the manager presses it; pressing it clears a saved manual
  team; a manual choice made later still wins. Nothing changes by itself.
- Engineers = matched, active people under the manager who have no active reports of their own (managers and leads stay out, as in ADR-0059).
- With the hierarchy on, the people counted are still limited to those the team file covers when a team file applies to that team.
  A team with no team file at all (another branch) takes the hierarchy as its only source, and raises no «differences».
- The control room lists the number of differences when a team file applies.

## Not in this version
The shortcut still keeps the Jeddah branch code for its team filter; taking the branch from the manager's own row, and per-branch
weights, come next.

## Tests
A simulated MyAFAQY serves 23 employees over three pages with phone and identity numbers in the rows: three requests, all 23 employees
in the tasks file, no personal number anywhere; a refused request still completes the pull. A portal test with four planted
differences (a different manager, a person missing from the file, an inactive person, a person matching nobody) finds exactly those
four against an independent count, stores no personal number, previews 8 instead of 10, switches, survives a reload and switches
back; a Riyadh-style manager with no team file gets his four engineers and no false alert.
