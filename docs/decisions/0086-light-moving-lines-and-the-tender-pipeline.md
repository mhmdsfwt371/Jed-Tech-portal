# ADR-0086 — Light, moving lines, and the tender pipeline

| | |
|---|---|
| **Status** | Accepted (the technical manager: «review the design — nothing that glows, lines that move, interactive, distinctive?») |
| **Date** | 2026-11-06 |
| **Version** | v9.04 |

## Rule
Every effect answers something — a stage with work in it, a date that is close, a page that changed, the pointer — and all of
it stops when the device asks for reduced motion.

## Decision
- **The tender pipeline** (the distinctive piece): the open stages in order, each with its count; the lines between run in the
  direction of travel, lit only where tenders are moving through; a stage pulses red when something has waited there over 3 days;
  then the outcomes (won, lost, declined, cancelled). Clicking a stage filters the table to it (and says so); clicking again clears.
- **Lines that move**: under each page title a line in AFAQY's colours draws itself, then shimmers slowly; the control room's
  headings draw their line; a light sweeps across the top on every page change.
- **Light**: red countdowns (≤3 days) and red alerts pulse softly; a light passes over the primary buttons under the pointer;
  the pointer's light now also follows on alert cards, pipeline stages and shortcut cards.

## Tests
`harness/tenders.py` (32): the pipeline counts each stage as the table does and the total matches; the stage with a 119-day wait
pulses; clicking filters and says so; clicking again shows all. Full run clean; mobile, shell and the layout sweep unchanged.
