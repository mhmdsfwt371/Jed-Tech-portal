# ADR-0076 — The mail page shows its classification rules and how it counts before any file is chosen

| | |
|---|---|
| **Status** | Accepted (the technical manager: «where is the part that shows the mail? where are the mail analysis criteria?») |
| **Date** | 2026-11-05 |
| **Version** | v8.93 |

## Finding
- v8.92 added «how these numbers are counted» to the mail page, but the page returns early when no file is loaded — so that box and
  the classification rules were built only after a PST had been read. Opening the page showed a file button alone; the criteria were
  not findable. The ADR-0075 reply even said the box appeared only after reading a file, which was the fault, not a feature.
- The page lives in the menu under «Data and settings», as «Mail from a PST file» (the group is collapsed by default).

## Decision
- The rules box (three categories and their words, first match wins, the rest «Other»; editable, kept on the device) and the
  counting box are built before the early return and shown with the file button — the rules open by default while no file is loaded;
  after a file is read the page is as before.
- The defaults, shown as they are: *extra sales* — new inquiry, inquiry, new request, new requirement, requirement, quotation and
  the Arabic words for new request, inquiry, requirement, price quote; *advanced* — integration, api and the Arabic words for
  linking and integration; *normal* — wasl and its Arabic spelling.

## Tests
`harness/mailfile.py` M1b–M1d, run before any file: the rules box is open with the three categories and their real words; the
counting box has its five lines and says the numbers are not in «Team KPIs»; a rule can be edited before the file and the edit is
kept. The old checks follow: the export how-to is picked among three boxes, and the rules box stays open from before the file.
Full run: 57 of 58 suites clean at once; the PRO suite failed twice under parallel load and passed 17/17 alone.
