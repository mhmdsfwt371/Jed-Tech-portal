# 0125 — My projects: tenders and upselling, and «delete all shown»

Date: 14 November 2026 · Version 9.51

## Context
The manager wants «My projects» split between tenders (public bids) and upselling (more work for customers we already serve),
and a way to clear a page at once, not one row at a time. Deleting is local to this device (confirmed by the manager).

## Decision
- `projectLine(row)`: the manager's choice (`cat` on the register item) wins. Otherwise a tender-register row, a terms booklet,
  the tenders sender or the «tender» kind make a tender; the «commercial offer» kind makes upselling. Anything else is
  «not sorted» — the portal does not guess. Matching the client against the after-sales accounts was considered and left out:
  the accounts the portal holds carry ids only, never names (ADR-0120), so there is nothing to match a client name with.
- A filter «All · Tenders · Upselling · Not sorted», with counts, sits on every page and applies to every page's rows.
  Each row on the mail and bids pages shows its line; «·» marks a derived line. ✎ Edit offers the choice.
- «Delete all shown» on the mail, bids and follow-up pages: `projectDeletePlan()` removes register items, hides mail threads so
  they do not return with the next pull, and leaves rows that come from the tender register (deleted there). Before anything is
  removed, a backup file `afaqy-projects-backup/v1` with the whole register and mail projects is saved to the device; uploading
  it in «My projects» puts everything back as it was, after a confirmation.
