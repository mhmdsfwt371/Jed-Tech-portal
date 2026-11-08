# ADR-0097 — The browser reads a PST up to 5 GB straight from the disk; the extractor opens any Windows path

| | |
|---|---|
| **Status** | Accepted (the technical manager: «I want the web to take up to 5 GB, not 1»; and a screenshot of extractor 1.0.1 failing on «E:/OCTOBER inbox.pst») |
| **Date** | 2026-11-08 |
| **Version** | v9.15 · extractor 1.0.2 |

## Browser: up to 5 GB
The page loaded the whole PST into memory (`arrayBuffer`), which no browser holds past about 2 GB. The library reads every byte
through one positioned read («N bytes at X»), so the library now runs in a Web Worker (`assets/pst-worker.js`) whose read comes from
the disk: `file.slice()` through `FileReaderSync`, 256 KB pieces, a 24 MB cache. The file is never loaded; memory does not grow
with its size. The library's file-system stub delegates to that reader when present (one change in the vendor file). The mail page
and the tender register both use it, show live progress, and say afterwards how much of the file was actually read. The result is
the same as before (one row per e-mail, copies counted — ADR-0075). Above 5 GB the page offers the extractor (ADR-0096): reading in
the browser is slower than the native app, so very large files go there.
Measured: a 3 GB test PST (the sample PST followed by empty space to 3 GB) — impossible before — read in 0.6 s, the same 71
messages, 5 MB actually read. A real 5 GB mailbox holds far more messages: expect minutes, not seconds; memory stays flat.

## Extractor 1.0.2: any Windows path
1.0.1 handed libpff the path; libpff's Windows path handling turned the file picker's «E:/OCTOBER inbox.pst» into
«\\?\E:\E:\OCTOBER inbox.pst\/OCTOBER inbox.pst» and failed. 1.0.2 opens the file in Python and gives libpff the open file
(`open_file_object`): spaces, forward slashes, Arabic names and long paths no longer matter. The build keeps the LGPL text in the
repository (gnu.org timed out during a build). 1.0.1 was withdrawn.

## Tests
Extractor: `test_01b` (a folder and file with spaces, brackets and Arabic, given with forward slashes) passes on Windows; the built
.exe self-tests on «C:/Temp Mail/OCTOBER inbox.pst» before release (69 messages). Portal: `bigpst.py` — a 6 GB file goes to the
extractor steps; the 3 GB file is read with the same 71 messages and under 64 MB read; the tender register reads it too.
Full run clean.
