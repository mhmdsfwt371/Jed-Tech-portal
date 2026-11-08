# ADR-0100 — A person's KPIs as an interactive dashboard; a «كراسة الشروط» attachment counts from anyone, even on a reply or forward

| | |
|---|---|
| **Status** | Accepted (the technical manager, on the engineer detail in Team KPIs: «wouldn't this be better as a dashboard? each person's profile as an interactive dashboard with shapes, real numbers and KPI terms that light up on hover»; and on the tender register: «any e-mail with a «كراسة الشروط» attachment — from Shaarawi, from Ido Ibrahim, from anyone — should show at once») |
| **Date** | 2026-11-08 |
| **Version** | v9.19 |

## Why
The detail was three tables. And the toast of his first real register read said «7 replies/forwards left out»: a booklet forwarded
by a colleague never showed, because the rule dropped every reply and forward before looking at its attachments.

## Decisions — the dashboard
At the top of every person's detail (Team KPIs, and My KPIs which uses the same view), from the same numbers as the table:
- Six tiles in KPI terms: Throughput (closed), Workload (total), Closure rate (closed ÷ total), MTTR (average to close),
  Weighted points (with the share of the team), Backlog (open now, the oldest's age). Each: the number, the change against the
  previous period (green = better; for MTTR and backlog lower is better), a sparkline of the recent months, and its definition
  on hover, focus or tap, with the pointer light (ADR-0098).
- A work-intake ring (e-mail, self-initiated, assigned by others) with the self-initiated rate.
- A recent-months chart (workload, closed, average time) with each month's figures on hover.
- Open-work aging (under a day, 1–3, 3–7, over 7 days).
- The table stays below, with ⚑. Six tiles to a row on wide screens, three, then two on a phone.

## Decisions — the tender rule
A tender is any mail with an attachment named «كراسة الشروط» — from anyone, original, reply or forward — or an original
message from a.ibrahim@afaqy.com. The name match covers «كراسه الشروط», «كراسة_الشروط», «كراسة شروط», «… والمواصفات».
The same tender (its subject without RE:/FW:/رد:/إعادة توجيه:) counts once, on its earliest date. The assistant instructions
say the same and search the new spellings.

## Tests
`harness/tdrule.py` (6): a forward from Shaarawi counts; an Arabic «رد:» with «كراسه شروط» counts; original+forward+reply are one
tender on the earliest date; no booklet stays out. `harness/pmdash.py` (11): six tiles with terms, the table's own numbers, rate,
the ring adds up, sparklines and month bars, definitions and month figures on hover, MTTR down shows better, phone layout.
Full run 70/70.
