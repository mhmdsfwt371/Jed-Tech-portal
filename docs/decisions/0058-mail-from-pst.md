# ADR-0058 — «البريد من ملف PST»: who sent how many, and each subject sorted into three kinds

| | |
|---|---|
| **Status** | Accepted (requested by the technical manager) |
| **Date** | 2026-11-03 |
| **Version** | v8.75 |

## Context
The manager wants to drop an Outlook PST export and see, for chosen people, how many messages each sent and how they split by kind:
WASL work is normal, integration is advanced, and a new inquiry, request or requirement is upselling.

## Decision
- A manager-only page under «المؤشرات». The PST is read in the browser with pst-extractor 1.12.0, bundled for the browser
  (`assets/vendor/pst-extractor.min.js`, loaded only when a file is chosen; Node's fs stubbed, zlib served by pako, Buffer shimmed). The
  file is never uploaded or stored; the messages live in memory and vanish when the page closes. Only headers are read: folder, subject,
  sender name and address, recipients line, date.
- Senders with counts; the five busiest are ticked by default and the manager ticks whom he wants. A date range narrows everything.
- Classification by subject with editable word lists, saved on the device (`mailrules`), applied in order — the first rule that matches
  wins: «بيع إضافي» (new inquiry, inquiry, new request, new requirement, requirement, quotation, طلب جديد, استفسار, متطلب, عرض سعر),
  «متقدم» (integration, api, ربط, تكامل), «عادي» (wasl, وصل), else «أخرى». So «WASL integration» counts as advanced.
- Result: a table per person (total and the four kinds) with a totals row; the message list filtered by kind; CSV export.
- v8.76: the Data page carries a visible box «بريد أوتلوك — ملف PST» with «ارفع ملف PST»; the file is read by the same loader and the
  result page opens by itself. The page in the «المؤشرات» menu stays for working on the result.
- Very large files (over about 1 GB) do not fit in a browser; the page says so and the how-to shows Outlook's export filter.
- Tested in the browser on the library's public test mailbox (71 messages, 41 senders) against an independent count in Node:
  classification with custom words, a date range, filtering, the export, and that nothing of the file is stored.
