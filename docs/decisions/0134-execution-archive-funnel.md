# 0134 — Execution, the archive, and the year as a funnel

Date: 17 November 2026 · Version 9.61 (shipped with ADR-0133) · Adds to ADR-0092 (the register feeds My projects), ADR-0131 (the year report)

## Context
The manager asked for one place from study to execution and archive. A won tender already reached «My projects» (ADR-0092),
where its execution, award and milestones are followed; but the card did not lead there, Etimad's work-start date was not
kept, closed tenders were only greyed rows in the list, and the year report counted only what reached the branch — never what
was published and did not.

## Decision
- **Execution.** Etimad's work-start date is kept on the tender (`workStart`, from `applyEtimad()`), shown in the fields of a won
  tender and on its card with «Follow the execution in My projects», which opens the follow-up view on that project.
- **The archive** (`tenderArchive()`): every closed tender (won, lost, missed, declined, cancelled), newest closure first, with
  its outcome, reason, value, number of files and Etimad number; tiles filter by outcome, bars by year; Excel download. The
  files themselves stay with the tender, as before.
- **The year as a funnel** (`tenderFunnel()`), at the top of the year report, its page and its Excel when the radar holds a pull:
  published within scope in the Western Region (and Kingdom-wide), reached the register, decided on (a study's decision or a stage
  past «decide»), submitted, won — each step as a share of the one before. The note under it says how many pulls the published
  counts rest on and that they say nothing about a period the pulls did not cover.

## Consequences
- The funnel's first step is only as complete as the pulls: a partial pull is said so, and the share «reached the register» is
  read against the West, where the branch works.
