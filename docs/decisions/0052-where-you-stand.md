# ADR-0052 — «مكانك وتقدمك»: rank, records, achievements and level for the engineer

| | |
|---|---|
| **Status** | Accepted (decided by the technical manager: the rank number for everyone) |
| **Date** | 2026-11-02 |
| **Version** | v8.68 |

## Decision
Under the Today card on the engineer's «مؤشراتي» (team link, and the manager's view-as):
- **Rank** «المركز r من n» this month by points, among his team: those under the same team leader in the team file, on duty, whose
  work is in his own pull — never everyone in the pull. With the gap to the one above («يتبقى لك X نقطة») or the lead, and the move
  since last month. If his colleagues' work is not in his pull the card says the rank cannot be counted, rather than claim first place.
- **Records** that do not repeat the Today card: best month by points, longest streak of working days, most tasks in one day.
- **Achievements** from his own work, with progress: a full week with work every day, 50 tasks in a month, 10 tasks within the usual
  time in a month, 20% better than the month before, first place in a month, a 10-day streak.
- **Level** with a bar to the next level (35 / 60 / 80 and difficulty 60) and the shortest way up (his weakest axis).
- Privacy: no colleague's name or number is shown; only he and his manager see his rank. Not on the manager's own page.
- Verified against an independent reimplementation of points from the raw data and weights file (rank 1 of 7 and 2 of 7 with the gap,
  best month 468 points, most in a day 17, longest streak 16). An early version counted everyone in the pull (rank 1 of 30); fixed.
