# 0143 — One agenda for every date of every open tender, with a notice on this device

Date: 20 November 2026 · Version 9.73 · Builds on ADR-0131 (the hand-over date) and ADR-0084 (the control room's alerts)

## Context
A tender's dates lived inside its card: the platform's dates and the hand-over to the tenders team. Two more internal dates
follow from head office's rules (their mail of 17 November 2026) and were worked out by hand each time, once wrongly: the
guarantee's cost three working days before the closing day, and the inquiries uploaded before their last day. The manager asked
to see all the dates of all tenders on the portal and to be notified of them.

## Decision
- **`tenderMilestones(item)`** lists every date still ahead of an open tender in calendar order: `askUp` (a working day before
  the inquiries' last day), `askDue`, `visit`, `bondCost` (`TENDER_BOND_DAYS` = 3 working days before the closing day, left out
  when the tender says no guarantee is asked), `handover` (ADR-0131), `due`, `openAt`. Work that is done drops its dates: nothing
  internal once handed over, only the opening once submitted, nothing for a closed tender. Working days are Sunday to Thursday.
- **`tenderAgenda(items, today, days)`** is the flat agenda of all open tenders. A platform date that passed is history; an
  internal date that was missed stays on top for a week while its tender is open.
- **The strip** «Upcoming dates» leads the register: a column per day, a button per date, a click opens the tender. 7, 14 or 30
  days, kept in this browser. No strip while no open tender has a date.
- **Notices** use the browser's own Notification, only after the user presses the button and the browser agrees, for dates a day
  away or less, each said once (`tenderNotices()`, remembered in this browser). The portal has no server: nothing can be said
  while it is closed, and the button's note says so. For a reminder on a phone the strip downloads one calendar file of every
  date ahead, each with a reminder the day before.
- No network call is added, and nothing leaves the browser.

## Consequences
- The card's line of dates carries the two internal dates as well.
- The row's countdown chip is unchanged (it keeps the dates it had).
- A notice depends on the portal being open; the calendar file is the route that does not.

## Tests
`tests/core.test.mjs` «v9.73» — failed on 9.72 first. `tests/browser/agenda.py` G1–G12: no empty strip, order, period, opening
a tender, the card's line, the calendar file, notices said once after consent, and the strip in three languages, both themes
and on a phone.
