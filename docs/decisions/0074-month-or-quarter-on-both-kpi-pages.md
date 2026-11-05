# ADR-0074 — Month or quarter on both KPI pages, each compared with the one before

| | |
|---|---|
| **Status** | Accepted (the technical manager: «month by month and quarter by quarter, for my KPIs and the team's — this month against the last, this quarter against the last») |
| **Date** | 2026-11-05 |
| **Version** | v8.91 |

## Finding
- Since ADR-0070/0072 both pages read a month only (`kpi-month`, `me-month`); no quarter anywhere (checked in the code: zero).

## Decision
- One «month | quarter» switch on «My KPIs» and «Team KPIs», one choice for both, kept on this device.
- A period key is `2026-10` or `2026-Q4`. Its range, the period before (`2026-Q1` → `2025-Q4`) and its label come from one set
  of helpers; the same engine (factor1 + weightedPoints) runs on the range — a quarter is not a sum of rounded months.
- Quarters are listed from what the pulls cover; a quarter is whole when each of its months up to today is pulled whole, otherwise
  it is marked * with the days covered.
- Everything follows the choice: the tiles and their change, the team table, a person's details (this quarter against the last,
  the last periods), «My KPIs», the CSV, the management PDF of the period.

## Tests
`harness/monthly.py` Q1–Q6: the quarters Q4 and Q3 (from a quarter pull and October), every counted person's Q4 total and closed
against an independent count, Hossam's change against Q3 (72 vs 79 → ▼ 7), his details comparing Q4 2026 with Q3 2026 with Q3's
total independent, «My KPIs» following the same choice, and back to months. Full run: all local suites clean; two suites now pick
the sort pills explicitly (the switch is also a row of pills).
