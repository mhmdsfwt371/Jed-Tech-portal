# ADR-0081 — The tender register: every tender mail once, his status and his dates, by month, quarter or year

| | |
|---|---|
| **Status** | Accepted (the technical manager: track the tender mails — originals only — and count them over the month, quarter and year) |
| **Date** | 2026-11-06 |
| **Version** | v8.98 |

## His rules (chosen)
- A tender is an **original** message (not a reply or forward) that is **from a.ibrahim@afaqy.com OR carries an attachment whose
  name contains «كراسة الشروط»** (also written «كراسه»). Each conversation counts once, on its **first** date.
- The status — **ready (technical + financial)** or **not yet** — is set **by hand**. Ready sets today as its ready date (editable).
- His own dates per tender: **submission deadline** and **site-visit deadline**, plus a note.
- A page in the portal (manager only, «Indicators» group) and an **Excel export**.

## Source
Outlook is read by **Claude in Chrome** with Outlook on the web open on his account (the portal copies the instructions: read-only,
from the last pull to today, skipping what is already in the register; it saves `afaqy-tenders-from-mail/v1`). Not chosen:
a bookmarklet inside Outlook (it would rely on Outlook's unofficial internal calls and likely break IT policy) and the PST reader
(it does not read attachment names). When IT grants the Mail.Read consent, the same page can pull directly.

## The portal does not trust the file blindly
On import it re-checks the rules: replies/forwards (RE:, FW:, Fwd:, رد:, إعادة توجيه:) and anything neither from a.ibrahim nor
carrying «كراسة الشروط» are left out and counted; duplicates merge on the earliest date; his status and dates are never overwritten.

## The page
Month · quarter · year · all; counts: arrived, ready, not yet, submission due within 7 days; the table (tender, first arrival, why,
status, ready date, both deadlines, note, remove). Excel: the register and a monthly summary (arrived · ready · not yet).
Stored on the device, carried by the backup; the team link cannot open it.

## Tests
`harness/tenders.py` (13) on a sample with every hard case: 4 added, 1 duplicate merged on its first date (11-02 not 11-04), 2
replies/forwards and 1 newsletter left out; filters 1/3/4/4; ready date set to today; deadlines kept after a reload; Excel with both
sheets; the same file again adds nothing; the backup restores it on a new device; the team link cannot open it.
Also: `home.py` H2 knows the new menu item; `mobile.py` measures with reduced motion (the settled layout, not an entrance frame);
`shell.py` R4 waits for the menu marker to finish its slide, then measures within 1 px. Full run clean.

## v8.99
On the live site the four counts inherited the board's bento sizes (ready spanning two, the last on its own row). They are now four
equal tiles in one row (two per row on a phone); `tenders.py` T12b measures it.
