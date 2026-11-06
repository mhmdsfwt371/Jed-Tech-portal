# ADR-0082 — The tender register: three ways in (Claude with a period and a bookmark, a PST, by hand)

| | |
|---|---|
| **Status** | Accepted (the technical manager: «do the three — the PST with thousands of mails by my rules, a bookmark with a period, and by hand») |
| **Date** | 2026-11-06 |
| **Version** | v9.00 |

## Decision
- **A pull period (from / to)** on the page, used by the Claude instructions and by the PST.
- **Claude in Chrome**: the instructions now carry «ON OR AFTER from AND ON OR BEFORE to» and `received<=to`. A **bookmark**
  («📌 Pull tenders», dragged once to the bar) asks the period, copies the instructions (without the already-collected list — the
  portal merges anyway) and opens Outlook if it is not open. It cannot start Claude: Claude in Chrome is a separate extension a
  page cannot run; the person opens it and pastes.
- **A PST** read on the device with the same library as the mail page: for each message in the period, the sender, subject, date
  and the **names** of its attachments (no attachment is opened); what matches goes through the same import and checks.
  a.ibrahim is recognised as the SMTP address **or** as the internal Exchange address a company PST keeps (`…/cn=<id>-a.ibrahim`),
  and only when the alias ends the address — `a.ibrahimi` is someone else.
- **By hand**: «＋ Tender» (name, date, optional source), marked «by hand», refused if already in the register; it skips the mail
  rules since he is the source.

## Tests
`harness/tenders.py` (20): the earlier 14 plus a tender by hand (and a duplicate refused); the chosen period in the instructions;
the bookmark itself run with answered prompts — it copies the period and opens Outlook; a real PST read on the device (71
messages, 29 with attachments, none a tender by his rules); a.ibrahim by internal address recognised while a.ibrahimi is not.
Full run clean (p5repo passed alone after a timing miss under load).
