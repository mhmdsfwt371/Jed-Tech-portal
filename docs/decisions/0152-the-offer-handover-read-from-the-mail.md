# 0152 — The offer hand-over read from the mail itself

Date: 22 November 2026 · Version 9.85 · Extends ADR-0130, ADR-0131 and ADR-0145

## Context
On 22 November 2026 the manager had read all his tender mails into the register and opened a tender expecting its history: who
did what, and whether the branch had handed it over. A colleague had sent the tenders team in Riyadh the three final files of one
tender that day (the offer deck, the priced bill of quantities and the datasheet), and the manager had sent another tender's files
before. Neither showed on its tender.

The importer linked a mail to a tender by the Etimad number in it, by the conversation's message ids, or by the same subject once
«RE:»/«FW:» is removed. A hand-over mail is usually a new mail under a subject of its own («the final files»), so it matched none of
them and became a tender of its own at «Arrived» — the tender itself stayed without the message and without the hand-over. The
browser test written for this case (`handover.py` H1) failed on 9.84 with two tenders.

The manager's rule (22 November 2026): when the Jeddah branch sends a tender's files to the tenders department in Riyadh, the
tender is done for the branch — submitted.

A second cause sits outside the portal: the Power Automate flow of ADR-0145 saves only the mails an Outlook rule moves into the
«Tenders» folder (the tenders team's own mails). A mail the manager sends is in «Sent Items», and a colleague's mail to the tenders
team reaches him only when he is in copy, in his Inbox. Those never reach the mail folder unless a flow or a rule takes them there.

## Decision
- **A hand-over mail** (`mailHandsOver`): written by anyone but the tenders team (`a.ibrahim`, as the register already knows it), and
  carrying a deck (pptx/ppt) and a workbook (xlsx/xls). A datasheet may come with them; a deck alone or a workbook alone is not the offer.
  The file types are the rule because they are what every AFAQY offer is made of; recipients are not read (the mail reader does not
  return them, and a branch mail can go to any member of the tenders team).
- **It finds its tender** (`tenderForHandover`) after the existing ways (number, message ids, subject): an open tender whose Etimad
  number appears in its subject or file names; else the open tender whose subject's words its subject and file names carry — the
  offer files are named after the tender — at least 60% of them and at least 15 points ahead of any other tender. Words that every
  tender shares («supply», «installation», «offer», «files») do not count. Two tenders that fit as well (Jazan and Najran) give none.
- **It never becomes a tender of its own.** When no tender fits, the mail is not registered and the folder's check (ADR-0146) says
  why: «… could not be told … so it was not registered as a new tender. Open the right tender and drop the mail on it.»
- **On its tender** (`tenderHandoverPatch`): the mail's own message in the conversation is marked as the hand-over (the manager's
  mark of ADR-0130, so the margin to the deadline and the summary work unchanged); a tender not yet submitted or closed moves to
  «Submitted» on the mail's day, with the days it was decided and ready kept when already set; the deck is filed as the offer and
  the workbook as the BOQ; the history says «Offer handed over to the tenders team · <writer>».
- **What was registered before** (`tenderHandoverRelink`): a card at «Arrived» made of one hand-over mail is moved, on opening the
  page, into the tender it belongs to by the same rule — its mail, files and messages — and the tender takes the hand-over. Its
  history keeps the moved card's subject. Nothing else is touched, and a second run moves nothing.
- **The flow**: step 8 of «How? The Power Automate steps» adds a second flow on «Sent Items» (only with attachments, to or copy the
  tenders team) and an Outlook rule that moves into «Tenders» a mail whose recipients include the tenders team. The manager's flows
  are changed only by him (his standing rule); the portal shows the steps.

## Consequences
- A branch mail with a deck and a workbook to anyone (a draft sent to a colleague for review) counts as the hand-over if it reaches
  the register. With the flows of step 8 only mails to the tenders team reach the folder; a mail dropped by hand is the manager's choice.
- A hand-over mail whose words fit no tender clearly is left to the manager rather than guessed.
- No new network call, no new storage, nothing leaves the computer.

Tests: `tests/core.test.mjs` (four tests, failing on 9.84), `tests/browser/handover.py` H0–H14 (H1–H10 and H13–H14 failing on 9.84).
