# 0127 — The tender register moves by the files dropped on it

Date: 14 November 2026 · Version 9.53

## Context
The manager wants to touch the register as little as possible: drop the email, follow, upload the project's study file and the
final file. Until now each step also needed a stage change by hand, the owner typed, and a technical and a financial file
classified separately — while the Tender Analyzer produces one offer deck.

## Decision
- One drop place: the whole page and the tender's window. `.msg`/`.eml` register tenders (as before). A study — the JSON file, or
  a workbook with a `tender-register` sheet (`tenderStudyFromSheet()`) — fills its tender; the workbook stays attached as the
  tender's study. Any other file asks once: which tender (the open window's, else the only tender being prepared, else one whose
  Etimad number is in the file name is offered) and what it is (final offer first).
- `tenderAutoStage()` moves a tender forward only: a «bid» study takes a tender still before preparation into preparation; a
  «do not bid» study declines it with the study's reason, and without a reason nothing moves; a final offer makes a tender not
  yet ready «Ready» with today's date. Nothing is moved back, nothing closed is reopened. Submitted, won and lost stay manual
  (the manager's decision, 14 November). Each automatic move is written in the tender's history and listed with «Undo».
- A file of the new kind `offer` (technical and financial in one) satisfies the gate to «Ready» by itself.
- «Default file owner» is kept on the device; the single save path puts it on every open tender without an owner.

## Not built
Reading the Etimad submission receipt to mark «Submitted» waits for a real receipt email.
