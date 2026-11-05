# ADR-0078 — The weekly message, the personal phone link, and «this number looks wrong»

| | |
|---|---|
| **Status** | Accepted (the technical manager: «build 3 (the weekly message and the phone link) and do 4 (the wrong-number button)») |
| **Date** | 2026-11-05 |
| **Version** | v8.95 |

## Decision
- **One place for messages to the team**: the rank-links section under «More» on «Team KPIs» becomes «Team messages». Per engineer:
  his month rank (as before), his week (Sunday to Saturday; last week or this week so far) with the change against the week before,
  and two buttons — the month rank message and the week message. Both carry the same link.
- **The link (snapshot v2)** carries his rank as before plus his month and his week, each with the period before, as seven numbers
  (from e-mail, opened himself, assigned by others, total, closed, average minutes, points) from the same engine as everywhere.
  No names, no task titles, no one else's numbers. v1 links still open. Anything malformed is refused.
- **On a phone with no setup**: the team link opens «My KPIs» with his month and his week from the link, his rank, and the full
  setup folded underneath; the numbers leave the address bar at once and stay on the device. With his own pull he sees his live
  data, as before.
- **«⚑ This number looks wrong»** beside every personal number (My KPIs, a person's details, the phone page): a window with the
  person, the period, the number and the one before, its definition and the date of the data, a note, and «Copy» / «Send by e-mail».
  Nothing is stored. The ⚑ is a 32-pixel target (the mobile suite holds every control to it).

## Tests
`harness/weekly.py` (14): the section's week column, picker and two buttons; Hossam's week Oct 18–24 equals an independent count
(20); the copied message carries his dates, total, the week before and the link; the decoded link holds only his numbers (month 72,
week 20) and no names or titles; the month message carries the same kind of link; ⚑ on every number of a person's details; on a new
phone with no setup «My KPIs» shows his month and week, the address bar is cleaned, a reload keeps them; ⚑ opens the report with the
number, period, definition and data date, and the copied report holds the note; a tampered link is refused. `rklinks.py` K4 accepts
the month and week while still checking for numbers only. Full run clean; the mobile suite caught the ⚑ under 32 px, fixed.
