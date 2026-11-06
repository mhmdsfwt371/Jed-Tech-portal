# ADR-0083 — The tender lifecycle: stages with owners and reasons, Etimad's dates and figures, the countdown, the calendar, the period's numbers

| | |
|---|---|
| **Status** | Accepted (the technical manager asked how to run tenders from the Etimad department professionally; the proposal was accepted: «build it in the portal») |
| **Date** | 2026-11-06 |
| **Version** | v9.01 |

## Decision
- **Stages** replace the two statuses: arrived → screening → bid decision → in preparation → ready (technical + financial) →
  submitted → won / lost; or cancelled / declined. **Declined and lost need a reason** (the move is refused without one).
  The first move to preparation/ready/submitted/declined stamps the **bid-decision date**; ready stamps the ready date; submitted
  stamps the submission date. All are editable. Older rows keep their meaning (not yet → arrived, ready → ready).
- **Per tender**: the Etimad number, the estimated value, the booklet fee, the initial guarantee, the inquiries deadline, the
  site-visit date, the submission deadline, the bid opening, the submission number, the file owner, the study (link or name), a note.
- **The row** shows how many days the tender has waited in its stage (red after 3 days while awaiting a decision) and its nearest
  coming date as a countdown chip: green, amber at 7 days or less, red at 3 or less. Click the row for the details.
- **Add to calendar** downloads an .ics with each date as an all-day event and a reminder the day before — opens in Outlook.
- **The period's numbers**: arrived, awaiting a decision (with the oldest wait), due within 7 days (with how many are past due),
  won with the win rate of those decided; then joined of arrived, average decision days (arrival to bid decision), submitted at
  least a day early, value in progress. The Excel carries every column and a monthly summary of these numbers.

## Tests
`harness/tenders.py` (25): the earlier checks on the new row; ready stamps the ready and decision dates; dates kept after a reload;
the countdown turns red at 2 days; «lost» refused without a reason and recorded with one; «submitted» stamps today; the numbers
line (joined 3 of 4, average decision 10.5 days); the calendar file with two all-day events and a reminder; the Excel with every
column, the stage, the reason, the dates and the summary. Full run clean; `weekly.py` W11 now accepts any version number.
