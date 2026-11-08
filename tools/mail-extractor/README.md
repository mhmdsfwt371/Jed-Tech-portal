# AFAQY Mail Extractor

Reads a whole Outlook mail file (.pst or .ost — 25 GB or more) **on this computer**, one message at a time, and writes a
small file for the portal's «Mail activity». Nothing is uploaded. Message bodies and attachments are never opened.

## Use it (Windows)
1. Download **AFAQY-Mail-Extractor-win64.zip** from the repository's Releases and unzip it anywhere.
2. Double-click **AFAQY Mail Extractor.exe**.
3. Choose the .pst file, the period (last month is filled in), and the folders (Inbox and its subfolders by default).
4. **Start.** The window shows how many messages it has read, kept, skipped as duplicates, and the memory it is using.
5. When it finishes, the file `…-mail-activity-<from>_<to>.jsonl.gz` is next to the .pst. Import it in the portal:
   **Mail activity → Import the extractor's file**.

If it stops (closed, power cut), start again with the same file and period: it resumes where it stopped.
Windows may warn about an app from an unknown publisher (the app is not code-signed) — choose «More info → Run anyway».

## What is in the file
One header line (source file name and size, period, folders, counts, time, peak memory, helper version), then one line per
message: a key (from the Internet Message-ID; when a message has none, sender + sent time + subject, marked `fb`), sender name
and address (SMTP, or `ex:alias` for an internal Exchange sender — never a display name), subject, sent and received time
(UTC), folder path, and the **number** of To and CC recipients with their **domains only** — no recipient addresses.

## Tests
`python test_extract.py` — real reading on public sample PST/OST files, and synthetic messages for duplicates across folders,
a missing Message-ID, Arabic subjects, the October 1–31 boundaries, an interrupted run that resumes, and 300,000 messages with
bounded memory. A real 25 GB mailbox is measured by running the extractor on it: the header records time and peak memory.

## Licences
Reads PST through **libpff** (© Joachim Metz, LGPL-3.0-or-later) via `libpff-python`, shipped as a separate replaceable
library file in the app folder; see `LICENSES/libpff-LGPL.txt`. The extractor itself is part of the AFAQY technical portal.
Powered by Mohamed Safwat — idea, design & build.
