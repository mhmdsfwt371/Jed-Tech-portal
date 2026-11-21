# 0147 — «Read the booklets again»: today's reader over the open tenders' files

Date: 21 November 2026 · Version 9.77 · Builds on ADR-0146 (a booklet's Hijri dates table)

## Context
v9.76 taught the register to read an Etimad booklet's dates table in Hijri. A booklet is read once, when it arrives, so the tenders
registered before 9.76 — the manager's 28, with their booklets already attached — kept the dates the old reading gave (none from
the booklet, sometimes a wrong one from a forwarded mail). He asked for a button like «Read now» that brings the right dates in.

## Decision
- **«Read the booklets again»** on the line under the mail drop (shown once the register holds a tender) reads again every file of
  every open tender that has not been submitted — never the mails themselves, never the signature pictures — through the same
  path a newly attached file takes (`tdAnalyzeFiles()`), so today's reader applies and the dates follow the register's own rule
  (`applyTenderEmailDates()`): a single date from the mail and the booklet is taken, two that disagree leave the field to be chosen
  in the card, and **a date typed by hand is never touched**.
- Then a window (the register's frame, ADR-0144) says what `tenderDateChanges()` in `core.js` found: per tender, each date that
  moved or was found (was → now), and each date that now waits for a choice because the mail and the booklet disagree. A tender's
  name opens its card. Nothing else is changed.

## Tests
`tests/core.test.mjs` «v9.77» (failed on 9.76 first: `tenderDateChanges` did not exist). `tests/browser/reread.py` R1–R11, failed on
9.76 first: three tenders registered from made-up mails each carrying a booklet with a Hijri table, put back as 9.75 left them, then
read again — a date found, a disagreement left to choose, a typed date untouched, the window's counts and focus, the card opened
from it, the accessibility scan, Arabic and Urdu in both themes.
