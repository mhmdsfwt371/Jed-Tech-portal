# 0126 — The Tender Analyzer fills the tender register

Date: 14 November 2026 · Version 9.52

## Context
Two tools read the same booklet. The Tender Analyzer reads all of it with Claude and builds the study; the register guesses a
few dates with fixed patterns (ADR-0122) and leaves the rest to the manager. The manager asked for most of a tender's data to
fill itself.

## Decision
- The analyzer writes `afaqy-tender-study/v1` beside its study (`docs/tender-study-format.md`). The register reads it; nothing
  else is shared, and no network call is added — the file is uploaded like every other.
- `parseTenderStudy()` reads strictly: wrong schema, a date that is not a date, a field that is not a number are dropped.
- `matchTenderStudy()` uses the Etimad number, then the subject key; with two rows of that subject none is chosen. From a
  tender's window the study goes into that tender, whatever the booklet calls it.
- `applyTenderStudy()` fills only empty fields and lists the others that hold a different value. A field filled this way is
  marked `fieldSources[k] = 'analyzer'` (dates: `dateSources[k]`), with its evidence (file, page, quote); typing over it
  removes the mark.
- The study's decision (go / no-go / review) is shown and exported; it never moves the stage — the stage gates stay the manager's.
- Visit and opening hours are kept in the data but have no field on the form yet.

## Not checked yet
The analyzer side is a separate project; the format was tested here with made-up studies only.
