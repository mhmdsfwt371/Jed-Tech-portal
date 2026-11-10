# ADR-0110 — The team pull works for any MyAFAQY account: only the tasks list is essential

| | |
|---|---|
| **Status** | Accepted (the technical manager: «anyone with a MyAFAQY account must be able to pull their own data and the data of the people under them»; the pull worked with his account and failed with a team lead's, on the same computer) |
| **Date** | 2026-11-10 |
| **Version** | v9.30 · extension 1.0.3 |

## Cause
Nothing in the pull is tied to an account: no name, e-mail or user id (checked), and «the people under me» is asked with no user, so
MyAFAQY answers for whoever is signed in. But the team pull read nine lists and treated every one as essential: a refusal of any of
them stopped the whole pull. MyAFAQY lets a team lead's account read his team's tasks (his own MyAFAQY screen shows them) but not
every supporting list, and it answers such a refusal with 401 — the code it also uses for an expired session, which is why ADR-0108
first read it as one.

## Decision
- Only `Task/GetMyTasksGrid` is essential. Every other list (people under the account, teams and team details, employees, technician
  report, activity log, the three after-sales lists) goes through one tolerant step: refused (any status, or `success: false`), it is
  skipped and named, and the pull goes on. An expired session still stops the pull with its own message.
- The tasks file carries `skippedLists`; the portal keeps a warning on that period's row in «Uploaded data», naming each list in plain
  words. The latest pull of a period decides, so a full pull clears it. (A message alone was overwritten by the second file.)
- In the shared key code (ADR-0108): a refused key that has NOT expired waits only 5 s for a newer one, then stops with «this account
  has no permission for this list», naming it — never «press F5». The wait counts its own one-second steps instead of reading the
  clock.

## Open, for a decision
The pull keeps people in the puller's branch, read from an earlier pull, and falls back to Jeddah (code 2) for a first pull, so a
manager in another branch would get nobody on his first pull. «Any branch» needs the people to come from «under the account» rather
than from a branch: a separate change.

## Tests
`harness/acctpull.py`, on the real pull against a simulated MyAFAQY: with the users, employee and after-sales lists refused, the pull
finishes with all tasks, names exactly those lists, the row warns in plain words, and a later full pull clears it; with the tasks list
refused, it stops at once with the permission message naming it. `keyrenew.py` (5) uses the shared code itself.
