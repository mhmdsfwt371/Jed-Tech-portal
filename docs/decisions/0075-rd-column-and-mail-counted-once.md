# ADR-0075 — The R&D column returns; a PST counts every e-mail once; the mail page says how it counts

| | |
|---|---|
| **Status** | Accepted (the technical manager: «is the mail analysis's criteria written? If I upload a mail file, will it double with the tasks that came from e-mails? And the R&D column — tell me what it means, and if it is useful bring it back, clean and smooth.») |
| **Date** | 2026-11-05 |
| **Version** | v8.92 |

## Findings
- **Month | Quarter** (v8.91) is live; a screen without it is a browser holding an older copy (reload).
- **R&D** counted the tasks closed in the period that sit in myafaqy's «R&D Tasks» queue (task group 12): how much of the closed
  work went to R&D rather than customer tickets. ADR-0070 left it out and it showed nowhere. The current pull (button and
  extension) carries the queue's list (`rdTaskIds`); older pulls, such as the October file, do not — there a number would be a
  false zero.
- **The PST reader skipped an item only when it saw the same item twice** (`descriptorNodeId`). The same e-mail kept in two
  folders is two items, so it counted twice.
- **The mail-file page showed its rules** (keywords per category, first match wins, the rest «Other») but did not say what is
  counted, and nothing said that its numbers never enter the KPIs.
- **No double counting with the KPIs:** the PST is read in the browser only and kept nowhere; its counts enter neither «Team KPIs»
  nor the points. «From e-mail» on the KPI pages counts myafaqy tasks created from an e-mail — a different thing, never added.

## Decision
- R&D returns as a column on «Team KPIs», a tile with its change against the period before, and a row in the personal view — only
  for periods whose every pull carries the R&D list; otherwise «—» with the reason (pull again with the button), never 0.
- `mailKey` (core): one key per e-mail — the global Message-ID, else sender, sending time and subject. Copies in other folders are
  left out and their number is shown on the file line.
- The mail page carries «How these numbers are counted» (five lines, three languages): once per e-mail; sender = From, date = sent,
  within From–To; category by the rules; messages are not tasks and never enter the KPIs or points; read in the browser only.

## Tests
`harness/rd.py` (8): with the R&D list every person's column equals an independent count (10 people, 167 tasks), the tile equals the
team row, the details carry the same number, the definition says what it counts; without the list «—» everywhere with the reason
and no R&D row in the personal view. Unit test: two copies of one e-mail share a key, two different e-mails do not (80 unit tests).
Full run: all local suites clean; the mail-file suite 10/10.
