# ADR-0045 — Editable scoring rules, explained on the weights page; the manager's «مؤشراتي» is his own

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-01 |
| **Version** | v8.61 |

## Scoring rules
The engine's constants become rules published with the weights (`weights.json` → `rules`), edited by the weights admin:
factor importance (0–3 each), the four cut points that turn the factor score into a base 1–5, the speed multiplier, the time
multiplier limits, and optional extras for tasks from email and tasks closed outside working hours (Sun–Thu 08:00–17:00 Saudi).
- The defaults reproduce the old fixed engine exactly — proven by unit tests over all 81 factor combinations and 24 duration cases.
- `pointsDetail` is the single source of a task's points: `taskPoints` and the calculator both use it.
- Changing importance or cut points recounts only the types whose weight follows their factors; a weight set by hand stays.
- A preview lists the types whose base changes and the team's points before and after, before anything is applied.
- Rules apply on the device first (everything recounts), then publish with the weights; a rules-only change counts in the publish diff.
- The weights page opens with «كيف تُحسب النقاط»: the four steps with the current values, and a calculator.

## The manager's «مؤشراتي»
- On the manager link it shows only his own page («أنا»); «فريقي» and the alerts live in the control room, the board and the
  person file. The team link is unchanged (team leaders keep «فريقي»).
- With no bookmark profile (a phone), it is drawn from his pulls; the manager is the team-file entry that covers departments.
  That profile is never stored or put in the backup, and the weights page knows the manager the same way.
- View-as starts from the person file; the control room's shortcut opens it.
