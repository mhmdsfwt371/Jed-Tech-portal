# ADR-0095 — Large PST files through a local extractor; «Email Activity — Manager Inbox» as a separate indicator

| | |
|---|---|
| **Status** | Accepted (the technical manager's development task «Large PST Processing & Engineer Email Activity KPIs»; build and publish as usual) |
| **Date** | 2026-11-08 |
| **Version** | v9.13 · extractor 1.0.0 |

## Context
A month of the manager's Inbox is a PST of 10–25 GB or more. The mail page read PSTs in the browser, loading the whole file into
memory (`pst-extractor`, `Buffer.from`) — impossible at that size. The public `team.json` holds no e-mail addresses, and the
myafaqy pull carries none either (its employee list uses another id space), so addresses cannot be matched to engineers
automatically.

## Decision
**A local Windows app, «AFAQY Mail Extractor»** (`tools/mail-extractor/`): Python + **libpff** (`libpff-python`, LGPL, Windows
wheels for Python 3.10–3.15), packaged with PyInstaller as a folder app (the library stays a separate, replaceable file).
- Walks folders lazily, one message at a time, writing each record at once; bodies and attachments are never opened. Only the
  set of seen keys grows (~60 bytes a message). Default scope: the Inbox and its subfolders; option: every mail folder except
  Sent, Deleted, Drafts, Outbox, Junk and non-mail folders.
- Record: key (Internet Message-ID hashed; when missing, sender + sent second + normalised subject, flagged `fb`), sender name
  and address (SMTP `0x5D01`, else `0x0C1F`; an Exchange address becomes `ex:alias` — never a display name), subject, sent and
  received time (UTC), folder path, To/CC **counts** and recipient **domains** (no recipient addresses).
- Date filter on the received day; progress (read, kept, duplicates, out of range, errors, memory); an atomic checkpoint so an
  interrupted run resumes; output `afaqy-mail-activity/v1` (gzip JSON lines: header with source, size, period, scope, counts,
  time, peak memory, helper version).
- English-only window: Tk does not shape Arabic reliably on every Windows set-up.
- Built and tested on a real Windows machine by `.github/workflows/extractor.yml`, released as a zip with its SHA-256.

**The portal** (mail page, «Large files»): download the extractor; import its file (gzip read in the browser); imports listed
with source, period, counts and import date (removable); **identity review** — an address counts for an engineer only once the
manager confirms it, keyed to the stable myafaqy id; a name only suggests; vendors can be ignored; the mapping stays on the
device. A message is its key, so importing the same period again replaces, never adds. Per-engineer counts by month and category
(the editable rules, first match wins), the messages behind each count, Excel (summary + every message).

**The indicator «Email Activity — Manager Inbox»**: its own section on Team KPIs (with coverage, source and the note that it is
not an engineer's whole productivity), a line in each engineer's detail; never added to tasks or points, and distinct from
myafaqy's «From e-mail». Weights prepared on «Weights», locked until the manager approves scoring rules. Not sent in engineers'
phone links (their «My KPIs»): it reflects only what reached the manager's mailbox. Backed up and restored with the device.

## Decisions taken without waiting (the manager asked to build and publish)
Western Region scope = whoever appears in the pulls (the identity list shows each person's branch code); identity confirmed once
per address; not in engineers' snapshots; recipients as counts and domains; Inbox + subfolders by default; the app unsigned
(Windows may warn — documented).

## Tests
- `tools/mail-extractor/test_extract.py` (10): real sample PST and OST; duplicates across folders; missing Message-ID; Arabic
  subjects; 1–31 October boundaries; address-only senders; recipients as counts/domains; interrupted run resumes without doubles;
  **300,000 messages: 55 s, peak 26 MB, 7.4 MB file**. The same tests run on Windows in the build.
- `tests/mailact.test.mjs` (14): parse, re-import, Saudi day, coverage, confirmed-only counting, precedence, suggestions.
- `harness/mailkpi.py` (14): file from the extractor → import → identity → counts by Saudi day → Excel → evidence → re-import
  unchanged → Team KPIs section → locked weights; **150,000 messages imported and drawn in 1.5 s**.
- Guard: any tracked .pst/.ost, extractor output, or file carrying the schema stops the release.
- Not tested here: a real 25 GB PST (no tool can write one here). The extractor's header records time and peak memory on the
  manager's own run.
