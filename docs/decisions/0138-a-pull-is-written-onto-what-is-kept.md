# 0138 — A new Etimad pull is written onto what is kept, never in its place

Date: 17 November 2026 · Version 9.65 · Refines ADR-0132 and ADR-0136

## Context
The first pull read every tender's listing but stopped before it opened the award details of 2026: of 1,174 awarded tenders of
2026 within AFAQY's scope, the details of three had been read. The manager will make a second, smaller pull — 2026, AFAQY's scope,
for the winners and the award values — and upload it. His condition: the upload writes onto the old data and does not replace it.

Until now a tender both pulls held was replaced whole by the copy uploaded last. A thinner row (a pull made for the winners carries
fewer listing fields) would have erased a date or a fee the first pull knew, and an old file uploaded after a newer one would have
taken the data back in time.

## Decision
`radarMerge()`:
- every tender carries the time it was read (`at`, the pull's time);
- a tender only one side holds is kept as it is;
- for a tender both hold, the later reading's values win, and an empty value never erases a known one; `firstSeen` stays the earliest;
- the winners and the published offers of a tender come from the later reading that has any; a reading with none keeps what is known;
- the result says how many tenders were added and how many updated, and the upload message shows it with the total kept.

## Consequences
- A small pull is enough to complete the winners; nothing is lost by uploading it.
- A value Etimad itself emptied later stays as last known; the market study shows the last known value, not a blank.
- The pull still writes nothing into a register tender (ADR-0135).
