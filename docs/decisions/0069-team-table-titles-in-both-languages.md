# ADR-0069 — The team table: both titles editable, real people only, cells that line up

| | |
|---|---|
| **Status** | Accepted (the technical manager: "I want to edit all the titles, and the table set right") |
| **Date** | 2026-11-04 |
| **Version** | v8.87 |

## Findings
- The title field showed and saved the Arabic title only (`position`), even on the English page; the English title (`positionEn`)
  existed in the file but had no field.
- «Add» accepted any number, so a number no pull knows (5) entered the team on the manager's device and showed as «5 | 5».
- The «reports to» cell carried `display: flex` itself, so it stopped behaving as a table cell and the column drifted.
- Long team names spilled into the next column.

## Decision
- While editing, each person has two title fields — Arabic and English — both saved; otherwise the title shows in the page's language.
- «Add» picks a real person from the pulled data (not yet in the team) and takes an Arabic and/or English title.
- A number that matches no one in the pulled data is flagged in red so it can be removed or corrected.
- The flex layout sits in a div inside the cell; long names wrap.

## Tests
A team file holding a stray «5» is flagged; every cell is a table cell that fills its row and nothing spills; the English page shows
English titles; editing both titles saves them on the right person only (rows are found by id — in edit mode each row's «reports to»
menu lists every name); «Add» offers pulled people only and refuses without one; the stray number can be removed.
