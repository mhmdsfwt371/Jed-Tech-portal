# 0122 — Tender details in a window, with what is still to fill

Date: 14 November 2026 · Version 9.47

## Context
A tender's details unfolded under its row: nineteen fields, the documents' key points, the files and the history. With a few
tenders open the page became very long, and the manager could not tell which of the nineteen fields were his to fill.

## Decision
- The details open in one window over the list (`dialog.td-dlg`). It stays open while a field saves and the list behind
  redraws; focus returns to the field the manager moved to. A long window pages itself like every other (ADR-0119).
- `tenderNeeds(item)` names what a tender still needs at its stage: owner, Etimad number and submission deadline before a
  decision; value and guarantee from preparation on; submission date and number once submitted; nothing for a declined or
  cancelled tender. The window marks those fields and counts them; the row shows the count.
- A date the portal read itself says whether it came from the email or the booklet.
- The site-visit deadline and the bid opening are read by the same reader as the two existing dates (`TENDER_DATE_FIELDS`):
  a labelled line with a date; exactly one clear date fills the field; several stay for review; a value typed by hand —
  including one typed before this version — is never replaced.

## Not decided here
Reading the booklet fee, the guarantee, the estimated value and the Etimad number from the booklet waits for real booklets:
the wording differs between entities, and many booklets say «as stated on the Etimad platform» instead of the value.
