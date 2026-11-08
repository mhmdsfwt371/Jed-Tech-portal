# ADR-0101 — The tooltip policy; «My projects» imports said plainly; the projects pull follows the latest rules

| | |
|---|---|
| **Status** | Accepted (the technical manager, on the person dashboard: «the text shows over the text when I hover — set a policy and fix it»; on «My projects»: «does this import matter, or is it in the PST? … split it»; «update the mail pull from Claude to fit what we did last in tenders and projects») |
| **Date** | 2026-11-08 |
| **Version** | v9.20 |

## Why
Three newer tooltips (the dashboard definitions, the month chart, the team pulse) drew their own box in `--asphalt`, nearly the
page's colour at night, so their words mixed with the words under them. The portal already had one good tooltip (#tool-tip).

## The tooltip policy (the design rule — guarded by `harness/tips.py` on every full release)
1. ONE tooltip for the whole portal (#tool-tip). Nothing draws its own floating box.
2. Opaque and clearly apart from the page (inverted colours, a border); text contrast at least 4.5:1.
3. Above every layer (z-index 1000).
4. Beside what it explains — below if there is room, else above, else the roomier side; never over it, never off the screen.
5. One at a time; on hover, keyboard focus or tap. It may cover what is under it; it never mixes with it.
6. It belongs to the element that showed it: leaving an element closes only its own tooltip (pointer events arrive before mouse
   events, so the next element may already own it). Scrolling: it follows its element and goes when the element leaves the screen.
7. On a phone a tap shows it, a second tap hides it, a tap elsewhere closes it.
The guard found and this decision fixed three real faults: on a phone a tap showed and closed the definition at once; moving
straight from one element to the next closed the new tooltip; a tap that made the page scroll hid it.

## «My projects» imports
The one button «Import a file (mail or register)» becomes «Import ▾» with four kinds, each with a line saying what it is and
what it changes: the project register; the assistant's result as a file; the assistant's result pasted from its chat (words and
code fences around it are fine); Excel after editing. A file of another place is sent there with a link: a PST to «Mail from a PST
file» or «Tender register», the extractor's file to the mail page, a tender file to the tender register. A register chosen as the
assistant's result (or the reverse) still goes to its right place, and says so. The PST does not replace these: it has no bid
values or outcomes.

## The projects pull instructions
The booklet counts from anyone, even on a reply or forward, in all its spellings (one search each); one conversation is one
project on its earliest date; the tenders already in the register are listed so the assistant names them the same and they count
once; Arabic forward prefixes; if no file can be saved, the JSON in one code block to paste.

## Tests
`harness/tips.py` (23, three runs in a row), `harness/projimp.py` (14). `pmdash.py` and `pulse.py` read the one tooltip.
`crm.py` C6 now reads counts of any width (decisions passed 100). Full run 71/71.
