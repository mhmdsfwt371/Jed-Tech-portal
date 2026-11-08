# ADR-0098 — Everything pressable lights under the mouse and under a finger, always; a PST locked by Outlook is named

| | |
|---|---|
| **Status** | Accepted (the technical manager: «when I hover or touch anywhere it should light — this is part of the design, never forget it again»; and a 2.64 GB PST the browser could not read) |
| **Date** | 2026-11-08 |
| **Version** | v9.17 |

## The light — a design rule
ADR-0091 switched the pointer light off on touch screens (`hover: none`) and when the device asks for reduced motion — so a touch
laptop, a phone, or Windows with «Show animations» off got no light at all. Now nothing switches it off:
- mouse and pen: the soft light follows the pointer (as before), on a wider set — every button, link, fold, select, field, label,
  tile, card, row, chip and pipeline node;
- every press — finger, click or pen — blooms a glow from the spot pressed, fading in 0.7 s;
- keyboard focus glows;
- reduced motion keeps the light and drops only the movement (a steady glow, no bloom, no lift).
Guarded by `harness/glow.py`, part of every full run: ten kinds lit under a mouse, also with reduced motion; a click blooms; a
finger lights a tile, a pill, a row and a button on a phone; the glow fades. Recorded as a standing rule.

## A PST open in Outlook, in the browser
The 2.64 GB file had «~OCTOBER inbox.pst.tmp» beside it — Outlook's sign that the PST is open, hence locked. The browser raises
`NotReadableError` reading a locked file; the page now names it: «open in Outlook» with the two ways out (close Outlook; or detach
the data file — not deleted) and the «~name.pst.tmp» sign. Any other failure shows its technical detail in a fold to copy. The
tender register names a lock too.
