# ADR-0090 — Control-room numbers open their detail in a window; the portal names its author

| | |
|---|---|
| **Status** | Accepted (the technical manager: «a popup with the details, dashboard and list, with export» and «write powered by, and what proves the system is mine») |
| **Date** | 2026-11-07 |
| **Version** | v9.07 |

## Number windows
The four numbers (done this month, points, open now, on the team) are buttons; each opens a window on the control room itself:
summary tiles, an animated bar per engineer, the full list (late rows in red, from the very list the «older than 7 days» count
uses), and Excel with every row. The windows read the same lists as the tiles, so their numbers match the tiles.

## Authorship — not ownership
- Written: «تصميم وتطوير: محمد صفوت / Designed & built by Mohamed Safwat» under the menu and at the foot of every page; an About
  window with his role, the version, the version history since v5.0 (2026-10-29, the first entry in this repository), and the
  numbers of versions and decided designs, counted from the site's own CHANGELOG and decision index when it opens; the author in
  every Excel file's properties; `meta name="author"` in the page.
- Not written: a copyright or ownership claim. The portal was built for AFAQY's work with AFAQY's data; in most employment
  contracts that work belongs to the employer unless agreed otherwise. Authorship is a fact; ownership needs a written agreement.
  The strongest proof of authorship is the dated commit history on GitHub.
- The guard exempts the author's own name words from the captured-names rule (every other name still stops a release), and
  allows About to read the site's CHANGELOG and decision index.

## Found on the way
- The decision index missed 13 records (0000–0009, 0024–0026); they are now listed. About counts distinct decision numbers and
  leaves out 0000 (the template): 88. Versions are counted by version number: 131.

## Tests
`harness/crm.py` (10): four buttons; «done» window matches its tile with bars and a list; its Excel holds every row and names the
author; the red rows equal the «older than 7 days» tile (found a mismatch: the tile counted by the hour, the rows by rounded days —
now one list); per-engineer points add up; About's facts; the authorship line on every page; the night date field; the isolated
Arabic phrase. `home.py` H-num updated. Full run clean.
