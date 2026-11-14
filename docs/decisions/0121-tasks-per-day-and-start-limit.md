# 0121 — Tasks per day, and the manager's start limit

Date: 14 November 2026 · Version 9.45

## Context
The manager wants, for every day, how many tasks arrived and how many were left without anyone starting them. MyAFAQY shows
three columns per queue (To-Do, Open, Done); a task moves from To-Do to Open when someone starts it.

## The rule (the manager's, 14 November 2026)
- Sunday–Thursday: the clock runs 09:00–18:00 and 19:00–22:00; a task must be started within 1 working hour.
- Saturday: the clock runs 09:00–18:00; 3 working hours.
- Friday: off.
- A task that arrives outside these hours starts its clock at the next opening. The allowance is the one of the day the clock
  starts on (a task from Thursday 21:30 uses half an hour on Thursday and the other half on Saturday).

`RESPONSE_RULE` holds it; `startDue()` turns a creation time into the instant the task must be started by. It is separate from
`businessHours()` (Sunday–Thursday 08:00–17:00), which the points engine uses and which did not change.

## Decision
- The control room gets a table per day (14 days, or 31 on request), counted by creation day, for the team in scope. The
  columns add up: arrived = closed the same day + closed later + not started + started and open + cancelled.
- «Not started» is the To-Do column as it was at the pull, and «past the start limit» is judged at the pull's time, not at the
  moment the page is opened — the column could have changed since.
- A day is marked `*` when the pulls do not cover every day from it to the latest pull (`coveredFrom()`): a task that arrived
  that day and closed in a gap would be missing.
- Days with nothing (a Friday) are rows too.

## Not yet
When a task that is now closed was first started is not in the pull. MyAFAQY records it in the task's activity log
(`GET Task/GetTask/{id}`, activity `actionId 8` «Start», captured 31 October 2026), one request per task. Reading it for the
tasks that arrived since the last pull is the next step, so the table can also say how many waited past the limit before
someone opened them.
