# 0153 — A tender's history by the mails' own times, and the register from a date

Date: 23 November 2026 · Version 9.86 · Extends ADR-0130 and ADR-0152

## Context
On 23 November 2026 the manager asked three things of the register: how many mails came in today, a history put right by its
dates, and an Excel of every tender since 1 July with its status as the mails tell it.

Every line of a tender's history was stamped with the moment it was written into the browser (`tdActivity` took `new Date()`), and
lines were kept newest first. A July mail dragged in on 23 November therefore read «23 November», and a tender caught up in one
sitting showed its mails in the order they were dragged, not the order they were written. The browser test written for this case
(`history.py` H1–H5) failed on 9.85. The register had no count of the day's mails, and its Excel gave the period on screen only,
with nothing from the mails beside the stage.

## Decision
- **A mail's line carries the mail's own time and writer** (`mailAt`, `who` on the activity entry; `at`, `name` on the stored
  message), beside the moment it was registered (`at`, unchanged). The writer is the mail's sender name, else its address.
- **The history is read by `tenderHistory()`**, oldest first, each line at the time it happened: a mail's line at the mail's time, a
  hand-over at its marked message in the conversation, anything else at the moment it was done. Hovering a line whose registration
  differs says when it was registered.
- **Lines saved before 9.86 are put right on reading, not rewritten**: each «email» line takes, oldest first, the oldest unused
  message of its subject (else the oldest unused message), and that message's time and writer come from the conversation entry by
  the same address on the same day. Nothing in the store is changed, so a backup restored later reads the same.
- **Today's mails** (`mailsOnDay()`): the mails whose own day is today, and the number of tenders they belong to, in one line above
  the list.
- **«Excel from a date»** (`tendersFrom()`, `tenderMailFacts()`): every tender that arrived on or after the chosen day, at every stage,
  oldest first, with the existing columns and five from the mails — how many, the latest (time, writer), the hand-over (time, by
  whom). The second sheet gives the months of these tenders alone. The register's own Excel button is unchanged apart from the
  five columns.

## Consequences
- The history answers «who did what, and when» in the order it happened, whichever day the mails reached the portal.
- A mail the portal never received (one the Power Automate flow does not save, ADR-0152) is still absent from the count and the
  Excel: the count is of the mails in the register, not of the mailbox.
- No network call, no new store, nothing leaves the device.
