# ADR-0092 — The tender register feeds «My projects»

| | |
|---|---|
| **Status** | Accepted (the technical manager: «اعمل» — link the two) |
| **Date** | 2026-11-07 |
| **Version** | v9.09 |

## Context
«My projects» counts what the manager worked on and what was won (projects register + mail threads). It showed a 100 % win
rate with «lost: 0»: losses never entered it. The tender register (ADR-0081..0088) records every tender that arrived, with a
loss reason required.

## Decision
- A tender at «submitted», «won» or «lost» counts in «My projects» on its own, under «large projects and tenders», with its value
  and dates, marked «from the tender register» (a link to it), a loss showing its reason. «Preparing» and «ready» do not count:
  nothing was submitted yet.
- Once only. If the tender is already in «My projects» it is not added; that row is lifted when the register is further along
  (PROJ_RANK). Matching takes the closest row: the same name or the Etimad number first; one name inside the other only when the
  two are nearly the same length (≥ 80 %).
- The register alone is enough for «My projects» to count (it no longer needs mail or a projects register first).

## Found on the way
On the real register the first matching rule (one name inside the other, any length) tied «Elaf Al-Arabia — AVL + CAN + Gates»
(an H2 offer, submitted) to «Elaf Al-Arabia» (an H1 project, delivered) — a different project of the same client. The closest-match
rule above fixes it.

## Tests
`harness/projlink.py` (5), on the real projects register: two new tenders add 2 to «bid» (not 3); the known offer is lifted to
«won» and not mixed with the delivered H1 project; the lost tender appears with its reason; reopening changes nothing. Full run clean.
