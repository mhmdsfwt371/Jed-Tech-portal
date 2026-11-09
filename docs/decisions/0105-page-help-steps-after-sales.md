# ADR-0105 — Each after-sales page's «?» gives its steps

| | |
|---|---|
| **Status** | Accepted (the technical manager: a detailed user manual for every page and for the system as a whole, for the after-sales team — engineers and the manager/lead — not the tenders; «both» in the portal and as a document) |
| **Date** | 2026-11-09 |
| **Version** | v9.25 |

## Decision
- The document: «AFAQY Jeddah Portal — After-Sales User Manual» (a Claude Doc) — Part A for the engineer (A1–A8), Part B for
  the manager and team lead (B1–B9), numbered steps restarting in each chapter, 12 screens from the system; tenders and
  «My projects» left out.
- In the portal: a page's «?» keeps its paragraph and adds «How to use it» — the same steps, numbered — on My KPIs (9), the
  control room (5), Team KPIs (6), Development (6), Overtime hours (5), Team (6), Data (7), Weights (3) and Tools (4), in
  English, Arabic and Urdu. A page's steps live in `hs_<page>`; a page without them shows its paragraph as before (the tender
  register, mail, PRO, team plans).
- The help window scrolls when long, and fills the screen on a phone like every window (ADR-0102).

## Tests
`harness/helpsteps.py` (10): every after-sales page in three languages gives its steps under the right heading; the tender
register is unchanged; on the engineer's link on a phone, My KPIs gives its nine steps and fills the screen. Full run 75/75.
