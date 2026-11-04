# ADR-0063 — Overtime estimated from task times; updates fetch fresh files; every unit test runs

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-04 |
| **Version** | v8.81 |

## 1. Overtime hours
The technical manager needs the hours the team worked outside the working day. MyAFAQY records no working hours, so the portal
estimates them from what it does record for each task: when it was created and by whom, and when it was closed (Saudi time).
- Events for a person: closing a task assigned to him; creating a task he created; and the creation of a task he closed the same
  day (the start of work on it).
- **Saturday:** from the first event to the last task he closed (the manager's rule).
- **Sunday–Thursday:** only events between 19:00 and midnight; from the first of them, or from 19:00 if the manager chooses,
  to the last task he closed. Friday and after midnight are not counted.
- A day with one close and no known start measures zero and still shows in the details.
- Automated accounts are not people: the System User created 1,024 tasks in October and would have topped the list with 62 hours.
- Page «ساعات العمل الإضافي» (manager only): month, the counted team or everyone, the evening method, a summary per person,
  day-by-day details with the first and last task, the method in writing, and a CSV.
- On the October pull, an independent Python count of the same rules matches the page for every person, day and minute.

## 2. Updates fetch fresh files
After 8.80 the manager saw raw keys (ext_off, ext_s1…) instead of sentences: the new service worker had filled its cache with
`addAll`, which uses the browser's ordinary HTTP cache (GitHub Pages: 10 minutes), so the new code was cached with an old
language file. The install now fetches every shell file with `cache: 'reload'`; the guard keeps it so.

## 3. Every unit test runs
The unit-test runner sat before 16 test registrations, which were counted as passed without running — 12 of them from earlier
sessions (quarters, goals, rules, extra conditions, the team-types shortcut) and 4 from this one. Moved after every test, all of
them run; the only failure was a wrong expectation in the new overtime test. The guard now fails a release if a test sits after
the runner.

## 4. The extension guide
The Data page shows the extension setup as a live checklist of the real state (downloaded, installed, reloaded, MyAFAQY opened,
data arrived), with the action for the current step; once data has arrived it folds into a status line with «Update now».
