# ADR-0087 — Phone audit of «My KPIs» and «Data»: no false «before», every column on screen, numbers first

| | |
|---|---|
| **Status** | Accepted (the technical manager: «review» — an audit of the two pages the team uses, with screenshots and measures) |
| **Date** | 2026-11-06 |
| **Version** | v9.05 |

## Findings
- **A false comparison (the serious one).** The phone link carried the month before even when it was not pulled: with October
  pulled and September not, an engineer saw September as 5 · 0 · 1 · 6 … points 0 — a handful of September tasks inside the
  October file, shown as if it were his September. The boards already say «September not pulled, no comparison»; the snapshot did
  not apply the same test.
- On a phone the personal tables showed three of five columns: the change and ⚑ were off to the side.
- The intro card stood above the engineer's numbers even when he had numbers.
- «Data» on a phone was half Chrome-extension steps that cannot be done on a phone (phones do not take Chrome extensions).

## Decision
- The snapshot's «month before» is sent only if that month was pulled whole (the boards' own test, `pulledPeriods`); its «week
  before» only if the pulls cover every day of it (`rangePulled`). Otherwise «—», no arrow, and a line saying why. Old links read.
  The same rule in the team-messages week cell and the week message.
- On a phone the personal tables are laid out fixed so all five columns fit; ⚑ stays 36 px.
- The intro card shrinks to one line once the person has numbers.
- On a phone «Data» folds the extension steps under one line: set up in Chrome on a computer.

## Tests
`weekly.py` W7b (September shows «—» on the phone, with the reason); `rklinks.py` K4 (no month before when not pulled);
`mobile.py` P-cols (every column of the personal table on screen) and P-ext («Data» on a phone). Full run clean.
