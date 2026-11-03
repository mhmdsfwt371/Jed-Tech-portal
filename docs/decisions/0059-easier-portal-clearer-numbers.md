# ADR-0059 — An easier portal and clearer numbers

| | |
|---|---|
| **Status** | Accepted (the technical manager approved the study's plan; the open decisions took the recommended defaults) |
| **Date** | 2026-11-03 |
| **Version** | v8.77 |

## Context
A measured study of v8.76 (both links, desktop and phone, October's data) found My KPIs at 1,053 words, 7.4 phone screens and 106
numbers with no KPI on its first phone screen; the KPI board at 170 numbers; the Team page at 74 controls; and six figures that read the
wrong way. Two definitions written in v8.74 were also wrong (see Corrections).

## Decision
- Control room: a one-line answer on top; «No data for last month in the pull» instead of a comparison with 0 when the pull does not hold
  that month.
- KPI board: «Closed in period» (with how many were created before the period), «New in period», «New tasks closed»; the average in one
  unit, hours, labelled clock hours; «From email» and «Self-logged» as two tiles with definitions; an answer line; the table shows five
  columns until «More columns». Eight tiles laid out 4 × 2 (2 × 4 on a phone).
- Managers and team leads (anyone who is a leader in the team file, or has `covers`) are left out of the default counted team; the board's
  team picker brings them back. Every person keeps a file: the person file lists everyone, and a lead's level is computed with him added
  to the pool.
- My KPIs answer-first: a sentence and the update button on top, then the six tiles, the period, and the bold source; today and where you
  stand; open work. The month card, level details, history, definitions and team average fold under «More about my work»; bookmark setup
  and profile fold under «Setup and profile»; the overview card hides once data exists (a button shows it). The view-as banner stays on top.
- Team page reads as text until «Edit team»; editing shows the fields, rename and remove buttons, the add row, the names upload and
  signatures.
- Menu: «Data and settings» (Data, Weights, Mail from PST) separated from the results group; hidden on the team link.
- Wording: «1 day», «your own work only».

## Corrections to ADR-0057
- Average time is measured in **clock hours** from creation to closing (nights and weekends included), not official working hours.
  Working hours are used only by the points methods (by speed, against the usual time).
- «From email» counts tasks **created from an email in MyAFAQY's email module** (the module marker), not tasks of the type «Email
  Customer Activity». October: 440 from the module against 589 of that type.

## Result (same script as the study)
My KPIs 1,053 → 467 words, 7.4 → 3.4 phone screens, 106 → 59 numbers, six tiles on the first phone screen; KPI board 170 → 85 numbers;
Team page 74 → 6 controls; misleading figures 6 → 0.
