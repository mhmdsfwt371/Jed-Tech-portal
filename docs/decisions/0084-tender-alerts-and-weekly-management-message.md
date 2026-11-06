# ADR-0084 — Tender alerts on the control room, and the weekly management message

| | |
|---|---|
| **Status** | Accepted (the technical manager: «ماشي اعمل» on points 3 and 5 of the tender-management proposal) |
| **Date** | 2026-11-06 |
| **Version** | v9.02 |

## Decision
- **Control room**: three alerts in «needs your attention», from the whole register, each opening the register on «all»:
  tenders past their submission deadline and not submitted (red); tenders awaiting a bid decision with the oldest wait (red after
  3 days); tenders with a date within 7 days (with the nearest ones). They show even before any task pull — tenders do not depend
  on myafaqy.
- **Weekly management message** on the register («copy» or «e-mail»): the last 7 days whatever the weekday — arrived, decided
  (joined / declined), submitted, won, lost with their reasons; what awaits a decision now and for how long, what is past its
  deadline; next week's dates; the cumulative win rate and the value in progress.

## Tests
`harness/tenders.py` (28): the message's week, flow, loss reason, waiting line and win rate; the control room with no task pull
warning of the one tender waiting 119 days; the alert opening the register on «all». Full run clean.
