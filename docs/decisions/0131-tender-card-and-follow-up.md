# 0131 — A tender's window is one card, and the register follows a tender from arrival to result

Date: 17 November 2026 · Version 9.58 · Replaces the window layout of ADR-0122; adds to ADR-0083 (stages), ADR-0130 (correspondence)

## Context
The fuel-sensor tender of 12–17 November closed before the offer was uploaded. The tenders team asked the branch for the offer
two working days before closing, for early warning of blockers, and for the site-visit status. The register could not show
any of this at a glance: a tender's window was six pages for one tender — nineteen fields of equal weight (three filled), nine
signature pictures as cards, the conversation from the second page. And there was no year view of what happened to the
tenders, nor an outcome for a tender we meant to bid on and missed.

## Decision
- **The card.** A tender's window answers two questions on one screen: where it stands and what it needs. Under the title and
  the stage select: the entity, the Etimad number, the owner and the site as chips; the stage strip (a closed tender ends on its
  outcome); four tiles — the platform deadline with the time left, the **hand-over to the tenders team**, the full working days
  from arrival to closing, the value; every date on one line with «Now»; the summary and the latest three messages; «Missing»
  with its own fields; the files on one line with their add controls. Everything else is in five folds that open where they are
  (All data, Correspondence, Files, Inquiries, Activity), side by side in one row; the open one takes the width below. On a
  laptop the card is one window (the pager of ADR-0119 stays for a phone and for opened folds). Each field appears once.
- **The hand-over date** (`tenderHandoverDue()`): `TENDER_HANDOVER_DAYS` = 2 working days (Sunday–Thursday) before the
  deadline, at the deadline's hour. It is a deadline like the others in the list's «next date» while the offer is not ready,
  and the control room warns when it is within a day or past. When the offer was handed over is the message the manager
  marked (ADR-0130), else the day it was marked ready (`tenderHandedAt()`); on time or not is `tenderHandoverOnTime()`,
  unknown when either side is.
- **The time a tender gives** (`tenderLead()`): full working days from arrival to the deadline; under five is «short», marked
  in the list, and a tender still before a decision with a short time is a control-room alert.
- **Fields by stage** (`tenderShownFields()`): at arrival the booklet's facts (13 fields); the value, opening and study from the
  decision on; the ready date once ready; submission number and date once submitted; the reason only for a closed outcome. A
  field that holds a value always shows. The deadline's hour stays on the card until it is typed.
- **«Missed the deadline»** (`missed`) is a closed outcome with its reason, like «lost» and «declined». It counts as joined
  (we decided to bid), never as submitted, and asks for nothing more.
- **Inquiries** (`inquiries`): the branch cannot see the platform's inquiries, so each is written here — its text, the day it was
  raised, the day and text of the answer. A merge keeps the answered copy.
- **The message to the tenders team**: the dates, the hand-over date, the working days, the site-visit date, the inquiries not
  yet raised and those waiting for an answer, what is missing, and — when the time is short — the proposal to agree that day on
  a short schedule, an extension or a withdrawal. Copied, or opened in the mail program addressed to the tenders team.
- **The year report** (`tenderYearReport()`): one year of arrivals — joined, submitted, won, lost, missed, declined with their
  reasons; values; the average time given and how many were short; how many offers reached the tenders team on time; by month and
  by entity; every tender. In a window, as a printable page (one HTML file, everything escaped), and as Excel.
- New fields `entity` (filled from the analyzer's study when empty) and `site`.

## Not built
- The award and work-start dates (Shaarawi's table in the mail of 12 November) are not read; the line shows the dates the
  register keeps.
- The hand-over rule is two working days for every tender; a per-tender rule would need the tenders team to agree it.
- Nothing is sent: the message is copied or opened in the mail program, and the manager sends it.
