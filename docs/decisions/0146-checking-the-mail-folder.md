# 0146 — «Check the folder», a booklet's Hijri dates table, and one notice for the inquiries

Date: 21 November 2026 · Version 9.76 · Builds on ADR-0145 (the tender mail folder)

## Context
The first time the manager connected his «Tender Mail» folder (54 mails saved by Power Automate), the page read it for minutes and
then said «nothing new». He asked how to be sure that all 54 had reached the register. The page could not tell him: the folder's
line counts what each round read, not what the folder holds against the register. Two gaps showed while answering:
- A mail the importer could not register (no date, or two tenders it could belong to) was still taken as read — it would otherwise
  fail every minute — and the reason, shown once under the card, was replaced by the next round's. It was forgotten.
- While the folder was read, the tender card's stage list was locked (the importer and a stage change must not write over each
  other) with nothing on the card saying why. The manager took it for a fault.

## Decision
- **«Check the folder»** beside the folder reads every mail file (read only), parses it as the importer does and makes the same key
  (the Message-ID, else the file's SHA-256) — and `mailDirReport()` in `core.js` says each file's state against the register:
  *in* (which tender), *same* (a second copy of a mail already there — both flows saved it), *out* (read and not in the register,
  with the importer's reason, or «removed from the register since, or never registered»), *wait* (not read yet), *empty* (still
  being written or not brought down by OneDrive) and *bad* (the reader cannot open it). A line above adds them up; problems are
  listed first; a tender's name opens its card. «Register the ones not in the register» hands the *out* and *wait* files to the
  importer in its quiet mode and checks again; «Copy the list» copies it as text. Nothing is changed by the check itself.
- **A mail that could not be registered is kept** by name with its reason (`mailDirFailed()`), until it is registered or leaves
  the folder; the line under the folder says how many are left and points to the check.
- **The card says why it is locked**: while mails or files are being read, a note at the top of the tender card says the stage and
  the fields are locked so no change is lost, and that they open by themselves when the reading ends (the card is drawn again then).
  The lock itself stays: an import reads the register, awaits the attachments and writes it back, and a stage changed in between
  would be written over.

## Also in this version
- **A booklet's Hijri dates table is read.** Two Etimad booklets the manager sent (Taif fingerprint devices, National Guard dash
  cameras) showed that a dropped booklet offered no dates: Etimad writes its table in Hijri, and pdf.js gives a right-to-left page
  back with its letters spaced and reversed and the day glued to the year («131448 / 06 /»). `bookletHijriSchedule()` knows a row by
  the letters it holds, whatever their order (inquiries, submitting the offers, opening the offers), reads the date by the shape of
  its numbers and converts it with the Umm al-Qura calendar (`hijriToGregorian()`). A day and month that both read as a real day
  either way are left out, not guessed. The dates join the document's schedule, so they reach the date review with their page and
  never overwrite a date entered by hand. Both booklets read right: Taif 2026-11-23 and 2026-12-03, the dash cameras 2026-11-25 and
  2026-11-30 — the second showing that the register's deadline for it (from the forwarded mail) was wrong.
- **One notice for the inquiries.** «Upload the inquiries» falls a working day before the platform's inquiries deadline; the two
  were two notices and two calendar entries on two days for one job. `agendaFold()` carries the deadline on the upload day: one
  notice (the deadline in its body), one calendar entry, and both ids said. The strip on the page still shows the two days.

## Tests
`tests/core.test.mjs` «v9.76» (failed on 9.75 first: `mailDirReport` did not exist). `tests/browser/maildir.py` M20–M24, failed on
9.75 first: the check counts a folder holding registered mails, a second copy, a failed mail, an unread one and a half-written one;
the failed mail stays on the folder's line after later rounds; «Register the ones not in the register» registers what is left; the
tender's name opens its card; the note on a locked card; three languages and both themes with the accessibility scan.
`tests/core.test.mjs` also reads the dates table as pdf.js gives it and as a clean copy (failed on 9.75: no such reader), and
`tests/browser/agenda.py` G13 checks one notice and one calendar entry for the inquiries (failed on 9.75: two of each).
