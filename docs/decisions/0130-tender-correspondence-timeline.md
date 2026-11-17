# 0130 — A tender's correspondence is read from the mails themselves

Date: 17 November 2026 · Version 9.57 · Adds to ADR-0117 (mail files in the register), ADR-0122 (the tender's window), ADR-0127 (least touch)

## Context
A tender's story is in its mail thread: when it was sent to the branch, what was asked, the reminders, when the offer was
handed over. Until now the register kept the mail file and its subject, sender and day — to answer «when did this reach us,
and how long did we have» the manager opened Outlook and read the thread from the bottom up. He asked to drop the mail and
get that history summarised for each tender, with a summary at the end.

A reply carries the whole conversation beneath it, each quoted message under the header block the mail program wrote
(«From: … Sent: …»). That is enough to rebuild the conversation on the device, with no server and no model.

## Decision
- `mailThread()` splits a mail body into its messages, oldest first: `{ at, name, addr, text }`. A quoted message is
  recognised by «From:» followed by its date line (English or Arabic labels), or by «On … wrote:». A line that only begins
  with «From:» is ordinary text. The mail's own writer and time come from the file (`sentAt`, `senderName` — added to what the
  bundled reader returns), not from the text.
- `mailWhen()` reads the date as the mail program wrote it — the wall clock of whoever replied, kept as written, to the
  minute. A numeric date with two readings (`03/04/2026`) is left empty: nothing is guessed, and the page says «time not
  readable».
- The words of a message are kept without quote marks, link targets (a sharing link carries its key), separators, and
  everything from the signature on: a closing phrase, the writer's own name on a short line, a phone number. At most 1,500
  characters a message, 300 messages a tender. `mailGist()` makes the one line shown: the writer's own words after the
  greeting, cut at a word.
- `tenderThreadMerge()` joins readings: a message already there (the same writer within a minute; with no readable time, the
  same writer and words) is not added again, keeps its mark, gains an address and takes the fuller text. Two people who share
  a first name are not one writer.
- The thread is saved on the tender (`thread`), read on every mail import, carried by the device backup and by the merge
  between devices. Mails kept before this version are read from their saved files on request («Read the timeline from the
  saved emails»); a second reading that finds nothing new writes nothing.
- `tenderThreadFacts()` gives the summary: messages and writers, first and last message, the submission deadline the register
  holds, and the **full working days** between the first message and that deadline — Sunday to Thursday, neither end counted
  (`workDaysBetween()`), because the day a tender arrives and the day it closes are not whole days of work.
- **The hand-over is the manager's mark.** Which message handed the offer to the tenders team cannot be told from its words
  without guessing, so the page never decides it. The manager marks one message; only then is the margin to the deadline
  worked out (minutes before, or after). A deadline without its hour gives no margin.
- A tender that **first** reaches the register as a reply takes the day of the oldest message quoted in it (`dateSource:
  'thread'`, said under the date). A tender already in the register keeps the date it has.
- In the tender's window: «Correspondence timeline» — the entries, the summary lines, «Copy the timeline» (plain text for a
  mail), the re-read. On the page: «Correspondence summary» — one row per shown tender whose mails were read, with a filter
  for tenders that had fewer than five full working days and for those with a marked hand-over, and the Excel download.

## Consequences
- The text of the thread now lives in the register, on the device only — as the mail file itself already did. It enters the
  device backup. Nothing leaves the browser; no address outside the portal's own is called.
- The summary line is extractive: it is the writer's own first lines, not an interpretation. A message that is only a
  picture or a signature says «no text».
- The time shown is the time written in the message. Inside one company and one time zone that is the real time; a thread
  that crossed time zones shows each quoted time as the replier's program displayed it.
- The list window (`crModal`) gained `wrap`, for cells that hold a sentence.
- The bundled mail reader (`assets/vendor/tender-mail.min.js`) is patched locally to return `sentAt` and `senderName`; the
  note is in `assets/vendor/README.md`.

## Not built
- Reading which message is the hand-over, or classifying messages (reminder, inquiry, decision) — both would be guesses.
- A thread whose headers are numeric dates with two readings keeps those messages after the dated ones, without a time.

## Also in this version
`tests/tender-integration.test.mjs` asserted the «closing soon» alert against a fixed deadline of 15 November 2026. From the
16th the whole suite was red with no change to the code. The deadline is now two days after the day the test runs.
