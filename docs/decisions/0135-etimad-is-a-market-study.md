# 0135 — The Etimad pull is a market study; the mail files and the study are each tender's reference

Date: 17 November 2026 · Version 9.62 · Replaces the «Etimad sets the platform's facts» part of ADR-0132

## Context
ADR-0132 made the Etimad pull the authority for a tender's platform dates and booklet fee: a pull replaced what the booklet,
the mail or the analyzer's study had given. The manager does not want the register to rely on the pull. The pull is a study
of the market, made every three or six months to see what is coming; a tender's reference is the files that arrive by mail
and the analyzer's study he uploads once those files are done. A pull months old would also carry dates that have since
moved (the fuel-sensor tender was extended twice in a week).

## Decision
- **A pull writes nothing into the register.** Importing it only says how many register tenders it knows. It no longer runs
  after a mail or a study is imported either.
- **The card mentions, never applies.** For a register tender the pull knows (by number or the very same title), a note on the
  card lists where the pull differs and what the register still lacks, with the pull's date, and says nothing was changed.
- **Linking** (the manager's «Link them») gives the Etimad number and page only.
- **Following** a tender from the radar is the one case where the pull's dates and fee enter a tender — there is nothing else
  yet. They are marked «from Etimad», and the study's and the mail's values replace them when they arrive
  (`applyTenderStudy()` and `applyTenderEmailDates()` treat an «etimad» value as open).
- **What 9.60–9.61 replaced is put back** on the next load (`tenderUndoEtimad()`): the mail's or the study's value and its
  source, with a history line. A value typed by hand since then stays.
- The radar's other uses stay as they are: the open tenders within scope, the market and the result in the card's fold, AFAQY's
  own bids, the year funnel. The outcome Etimad points to is still only offered.
- **The Hijri check stays** (ADR-0132): it guards the study itself, which is now the reference.

## Consequences
- A tender's dates are only as right as its booklet, mail and study; the card's note is where a newer platform date shows.
- `applyEtimad()` now fills only empty fields and returns the differences; the page uses it to build a followed tender and the
  card's note. `etimadWas` is kept only to undo 9.60–9.61 and is emptied by that undo.
