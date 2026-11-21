# 0149 — The backup and the sync file as a ZIP of files: never one string of the whole register

Date: 21 November 2026 · Version 9.79 · Replaces how ADR-0081 (tenders in the backup) and the sync file (ADR-0103) carried attachments

## Context
On 21 November 2026, after the mail folder (ADR-0145) had brought 54 tender mails with their booklets into the register, the
manager pressed «Send to my other device» and the page said «Could not save the tender data on this device». Nothing was being
saved: both the sync file and «Export a backup» built one JSON text holding every attachment as base64 (`readAsDataURL`), then
`JSON.stringify` of the whole. A browser cannot hold a string longer than about 512 MB (V8's limit), which base64 reaches at about
380 MB of attachments. Reproduced in Chromium with 470 MB of attachments: both buttons failed with `RangeError: Invalid string length
at JSON.stringify`, and the page showed the same misleading message. The backup is the only other copy of the register, so this
was the more serious of the two.

## Decision
- **The backup is a ZIP** (`afaqy-portal-backup-YYYY-MM-DD.zip`): `backup.json` (`afaqy-portal/v3` — what v2 held, each attachment
  named by its place in the ZIP — `zip: files/0001_<name>` — instead of written into it) and every attachment under `files/` as the
  file itself. The ZIP is put together from Blob parts — a header's few bytes, then the attachment's own Blob — so no attachment is
  copied into the page's memory as text (`zipBuild()` in `app.js`; headers, directory and CRC-32 in `core.js`: `zipLocalHeader()`,
  `zipDirectory()`, `crc32()`). PDFs and pictures are stored as they are; only `backup.json` is deflated. Names are UTF-8 and marked
  so, made safe for Windows (`zipSafeName()`), so the manager can open the ZIP in Windows and take a booklet out of it directly.
- **Reading** goes by slices (`zipOpen()` with `zipFindEnd()`, `zipEntries()`, `zipDataStart()`): the end record, the directory,
  then each entry only when asked for — a stored attachment is a slice of the file, never read whole. `readBackupFile()` takes the
  ZIP or the JSON of before (v1, v2), so every backup already saved still restores. Restore merges as before (`applyBackup()`).
- **The sync file, version 2** (`.afqs`, «AFQS» + 2): the same ZIP sealed with AES-GCM in pieces of 4 MB (`syncPack2()`), the
  passphrase through PBKDF2 as before. Each piece has its own IV (the file's random 8 bytes and its number) and its number and
  whether it is the last in the additional data (`syncPieceIv()`), so a piece moved, dropped or cut off at the end does not open.
  A version 1 file still opens as before.
- **What went wrong is said**: a failure says «The file was not completed: <why>. Nothing on this device was changed.» — never
  «could not save» when nothing was being saved. While the file is prepared the page says so. The Data page says how much the
  portal keeps on this device, near the size the backup will be.
- A file over 4 GB, or a ZIP over 4 GB, is refused with a message rather than written wrong (ZIP64 is not written).

## Tests
`tests/core.test.mjs` «v9.79» (failed on 9.78 first: no `crc32`): the CRC every reader checks, a ZIP written and read back with an
Arabic name marked UTF-8, the 4 GB refusal, safe names, the pieces' IVs. `tests/tender-integration.test.mjs` (failed on 9.78 first):
the real path in the page — ZIP built, read back, an attachment removed and restored byte for byte with what was read from it; the
sync file sealed and opened, a wrong passphrase and a file cut short refused. `tests/browser/backup.py` K1–K12 (failed on 9.78
first): the buttons themselves — Python's `zipfile` opens the backup with every CRC right; restored in another browser and received
through the sync file byte for byte; a JSON backup and a version 1 sync file from before still read. With `BIG=470` the same suite
runs at the size of the manager's register: run locally on 21 November 2026 with 470 MB of attachments (313 files), all of K1–K12
passed — the ZIP opened by Python with every CRC right, the sync file received and the backup restored byte for byte — where 9.78,
on the same register, failed both buttons with `RangeError: Invalid string length`.
