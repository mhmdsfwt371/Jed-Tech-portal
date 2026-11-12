# ADR-0116 — The team follows the device's owner; an engineer's pull survives a refused queue

| | |
|---|---|
| **Status** | Accepted (the technical manager, 13 Nov 2026: «whoever pulls sees his own user, and the people under him in Team KPIs, as MyAFAQY's employees list has them») |
| **Date** | 2026-11-13 |
| **Version** | v9.36 |

## Findings
1. ADR-0115 made the manager link show the page of the account that pulled. «Team KPIs» and the other team pages still took their
   people from the team file's scope for the manager named there, so a lead saw the whole department, not his own people.
2. The engineer's own pull read two queues, the general one and the R&D one, and treated both as essential. When MyAFAQY refuses the
   R&D queue to an account, the whole pull stopped and nothing reached the portal. An older test whose stand-in refuses that queue
   showed it. How the real MyAFAQY answers an after-sales engineer there is not known; the pull is now safe either way.

## Decision
- **For an owner who is not the manager named in the team file, «the team» is everyone under him**, at every level:
  from MyAFAQY's employees list when the pull carries it and names him (who reports to whom, people tied by name, people who left
  not counted); otherwise from the team file (`leaderId`).
- One function (`ownerTeam`) feeds the portal's single scope (`scoped`), so every team page follows it: Team KPIs, Development,
  the control room, overtime, weekly.
- The board **says whose team it is, how many, and where the list came from**. People under him in MyAFAQY whose names match no
  task account are named in that line, never dropped silently.
- His default team is all of them, leads under him included: the list is MyAFAQY's, not a comparison of engineers. He can still
  untick people in the team picker. A manual choice saved for a previous owner is dropped when the owner changes.
- **Nobody under him**: the page says so, draws no empty tables, and offers «My KPIs». The person at the screen is never a row on
  his own board (unchanged rule).
- The manager named in the team file, and a device with no named pull, see exactly what they saw before.
- **The engineer's pull**: the general queue stays essential; a refused R&D queue is skipped and the pull finishes.

## Limits, said plainly
- The October pull, the only real month here, carries no employees list. The «as MyAFAQY lists it» path is tested on the real
  October tasks with an employees list built for the test; it has **not** been compared with MyAFAQY's own Employees page.
  The first pull made with v9.36 by a lead is the check: the number in the line on his board against the people under him there.
- People are tied to MyAFAQY's employees by name (the employee number is not the task account's id). A spelling difference shows
  as «could not be tied», by name, in the line on the board.
- This is a view on the person's own device from his own pull. It is not access control: what an account may read is MyAFAQY's rule.

## Tests
`tests/browser/ownerteam.py` (11, real October data, expected sets worked out independently from the team file): the manager
unchanged; a lead sees exactly his people; a lead one level down; an engineer with nobody under him; MyAFAQY's list deciding where it
differs from the team file; an unmatched name shown, a departed person not counted; the Development page keeps to the same people.
`tests/core.test.mjs`: the engineer's pull guards each queue. The engineer-pull suite runs the whole pull with the R&D queue refused
and reads the account the page opened with.
