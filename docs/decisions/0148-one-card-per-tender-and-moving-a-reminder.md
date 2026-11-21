# 0148 — The strip: one card per tender, and a reminder moved to another day

Date: 21 November 2026 · Version 9.78 · Builds on ADR-0143 (the agenda) and ADR-0146 (one notice for the inquiries)

## Context
v9.76 folded the inquiries' upload day and deadline into one notice and one calendar entry, but kept both on the strip. The manager
reads the strip's cards as his notices: the same tender still showed on two (or four) days. He asked that it does not, and to drag a
card from one day to another — «take tomorrow's and put it on Monday» — fixing a wrong date himself in the card.

## Decision
- **A tender once.** `agendaByTender()` keeps the agenda's order (a missed internal date first, then nearest first) and shows each
  tender on its first date; the dates after it ride inside that card as lines («then Monday: Inquiries deadline»).
- **Every day of the period is a column**, empty ones too, so there is somewhere to drop.
- **Moving a reminder.** A card, or a line inside it, dragged onto a day moves that reminder there (HTML drag and drop); the card's
  date box does the same on a phone and from the keyboard. The move is stored on the tender (`agendaMoves`: the key, the day it was
  and the day it reminds on — `tenderAgendaMove()`), applied in `tenderMilestones()` only while the date it was moved from is still
  the date, so an extension drops a stale move. **The platform's own dates never change by a move**; they are edited in the card.
  The card says «moved from …» with «Back to its own day»; the notice and the calendar file follow the moved day. Dragging near
  either edge of the strip scrolls it, so a day out of view can be reached.
- `agendaMoves` is kept by `cleanTenderDetails()` (anything malformed is dropped) and travels in the backup with the tender.

## Tests
`tests/core.test.mjs` «v9.78» (failed on 9.77 first: no `agendaByTender`). `tests/browser/agenda.py` G3b and G13–G17, failed on 9.77
first: one card per tender with its later dates, a column for every day, a card dragged by its title onto another day (the deadline
unmoved), the move kept after reopening, the day picked on the card, «Back to its own day».
