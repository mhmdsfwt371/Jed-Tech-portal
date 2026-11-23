# 0145 — The tender mail folder: Power Automate saves each tender mail as a file, the register reads the folder

Date: 21 November 2026 · Version 9.75 · Builds on ADR-0130 (a mail read into its messages), ADR-0142 (register and study in
one step) and ADR-0144 (the register's card and frame)

## Context
Tenders reach the register when the manager drops their email on the page. He asked whether the portal could read an Outlook
folder by itself, in the same browser, without an administrator. A web page cannot read another site's mailbox (the browser keeps
each site to itself), and Microsoft's own interface for mail needs an application registered for the company. What a person can
do with his own account is Power Automate: «When a new email arrives (V3)» on a folder, «Export email (V2)» — the mail as an eml
file — and «Create file» in OneDrive for Business. All three are standard connectors. OneDrive brings that folder down to the
computer, and Chromium lets a page read a folder the person chooses (File System Access), and keep reading it on later visits
once he allows it («Allow on every visit», Chrome 122). The manager chose this way on 21 November 2026.

## Decision
- **«Connect the mail folder»** sits under the mail drop on the register's card. The person picks the folder; the page reads it
  **read only**, every minute while it is open and whenever he comes back to it, and «Read now» reads it at once.
- What is new is decided by `mailDirNew()` in `core.js`: eml and msg files only, never a hidden or Office lock file, oldest
  first (the flow names files by the time the mail arrived), ten at a time; a file still empty is read on a later round. The
  names read are kept with `mailDirSeen()`, which forgets what left the folder, so the list never outgrows it.
- A new file goes through the importer a dropped mail goes through (`tdImportEmails()`), in a **quiet** mode: no window opens
  and the page keeps the period it shows; a toast says how many tenders were registered and mails linked. The same mail saved
  twice is registered once (the importer's own check), and a reply joins its tender. With the one-step switch on (ADR-0142) a
  new tender is studied as a dropped one is, toward the place agreed to only.
- **A folder that already holds more than `MAILDIR_ASK` (25) mails asks once** when it is connected: read them all (ten at a
  time until done) or start with what arrives from now on.
- **Permission.** On a later visit the browser may ask again: the card shows «Allow reading the folder», and reads nothing until
  it is pressed. Choosing «Allow on every visit» once ends that.
- **The handle stays in this browser** (key `tdmaildir`), never in the backup, and nothing is sent anywhere — no network call is
  added. A **private (incognito) window** keeps the folder for the visit only, and says so: in Chromium's own test browser, a
  folder kept by a private window and read back closed the whole browser. Such a window is told apart as the usual check does
  (its storage quota is under twice the script heap); a normal window that looked private would only have to connect again.
- A browser without folder access says on a computer where it works (Chrome or Edge), and shows nothing on a phone.
- **«How?»** opens the flow's seven steps in the register's frame (ADR-0144), with the file name expression ready to copy:
  `concat(formatDateTime(triggerOutputs()?['body/receivedDateTime'],'yyyy-MM-dd_HHmmss'),'_',guid(),'.eml')` — the time first so
  the names sort oldest first, and a GUID so two mails never share a name (a subject cannot be a file name: «:» and «?» are refused).

## What the flow cannot do
- It sees only mail that **arrives** in its folder after it is on: Outlook's trigger works on the received date, so an older mail
  moved there by hand is not saved — that one is dropped on the page as before.
- Microsoft says the trigger usually fires at once and, rarely, up to an hour late, and that many mails at once can rarely be
  missed. Dropping a mail by hand stays the way to be sure.

## Also in this version
- The one-step switch has its own message when the program does not answer (it showed the study's message, «the study did not
  start … press Study it with the Analyzer»): the box was not turned on, open the Analyzer (run.bat), leave it open, turn it on
  again, and allow Chrome to reach apps on this device if it asks.
- On a phone, the tender card's stage and chips take the head's whole width under the title and «Close».

## Tests
`tests/core.test.mjs` «v9.75» (failed on 9.74 first: `mailDirNew` did not exist). `tests/browser/maildir.py` M1–M19, failed on
9.74 first: the folder is a real directory handle from the browser's private file system in a browser profile of its own, so the
real path runs — kept, read back after a reload, permission asked and given; new, half-written, repeated and non-mail files; the
first-connection question both ways; disconnecting; three languages, both themes, the accessibility scan; a private window; a
browser without the feature on a computer and on a phone. `tests/browser/analyzerlink.py` B2 checks the switch's own message.


## تعديل 9.90 — الإيميلات أولًا ثم المستندات
كان `tdImportEmails()` ينتظر بعد كل دفعة من عشرة إيميلات قراءة كل كراساتها (`tdAnalyzeFiles()`)، وكل قراءة تحفظ السجل كله، فاستغرق فولدر من 129 إيميلًا قرابة الساعة والعدد يزحف. من الفولدر (`quiet`) تُضاف المناقصات إلى `tdDocQueue` وتُقرأ مستنداتها في `tdDrainDocs()` بعد أن يفرغ الفولدر. و«اقرأ الآن» يقول `md_nothing` حين لا جديد. الاختبار `tests/browser/mdspeed.py` (V1–V4)، فشل على 9.89 أولًا.
