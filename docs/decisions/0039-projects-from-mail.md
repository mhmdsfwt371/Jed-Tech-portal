# ADR-0039 — My projects from email (imported, device only)

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-31 |
| **Version** | v8.45 |

## Context
Admin consent for the Outlook connection is pending with IT. Meanwhile the manager wants the projects he worked on, by fixed rules.

## Decision
- Claude in Chrome reads Outlook on the web (list rows only: sender, subject, date) and writes `afaqy-projects-from-mail/v1`.
  Rules: a thread is a project if it involves a.ibrahim@afaqy.com, its subject has project / tender / مشروع / مناقصة / منافسة,
  or it carries a "كراسة الشروط" attachment; "worked on" if the manager, Akram or Mohamed Shaarawi sent in it.
- The portal imports the file on the manager's device only (IndexedDB key `projects`, carried in the full backup), keeping subject,
  tender number, dates and counts; never bodies. The manager approved keeping the subject line for project threads.
- «مؤشراتي ← أنا» shows tiles, activity per month, filters (the year / whole period / only mine), search, a table with who sent and
  why it counts, CSV export, and the set-aside threads for review. Not shown on the team link.
- When IT grants consent, the same rules move into the Outlook reader so the file is no longer needed.

## Amendment (v8.46) — the projects register
- A second device-only file, `afaqy-projects-register/v1`, built from the management deck (won H1 2026, commercial offers and tenders
  in follow-up, H1 headline numbers) and the Presales Board (each request with its client; a `mine` flag instead of a name in code).
- One model joins the two: each register item carries the mail threads that match its words (1448 threads go to the Nusuk 1448 tender,
  not to the won 1447 MINA project); the other threads stand alone as worked on or studied (kraasa).
- Three views: Dashboard (worked → studied → submitted → won with the win rate, value won against the year target, pipeline with a check
  of each slide total against its rows, won by client, submitted, mail activity, requests by type), List (status filters, export with the
  mail header) and Clients. Values and client names never enter the public code.

## Amendment (v8.47) — one card, one workspace, everything editable
- «أنا» shows one card with the headline numbers; it opens a full layer: Dashboard (each funnel step and value opens the projects behind
  it as cards; a card opens the edit form), List (status filters incl. lost, drag to order, edit / link to a project / delete per row),
  Clients, Excel export with the mail header and the reason, and a PDF that places every project under its status.
- Anything can be added, renamed, re-statused or deleted. An edited mail thread becomes a project linked to that thread; a deleted thread
  stays hidden in later pulls; linking folds a thread into an existing project. Edits live in the device-only register.
- "New pull from mail" builds the Claude in Chrome prompt from the last pull's date and lists every collected or set-aside subject to skip;
  a new file merges into the old one without duplicates.
- No bookmarklet for Outlook on the web: unlike myafaqy it offers a page no API under the user's session, and reaching its internal token
  from a bookmarklet would be an exploit that any Microsoft update breaks. Automatic reading waits for IT's consent to the Graph app.

## Amendment (v8.48) — three pages, Excel round trip, project files
- Pages: "Projects from mail" (every project thread; ✓ reviewed, ✎ rename or re-status in place, 🔗 join to a project, ✕ wrong),
  "What we bid on" (two groups: clients — commercial offers; large projects and tenders — with value, status, date, notes, files),
  "Where I stand" (bid, won, with us, delivered, pending, lost; win rate over decided bids only; split by the two groups; each tile opens
  its projects). Clients stays as a fourth page.
- Statuses after a win: won → with us (in execution) → delivered. The deck's 11 H1 projects are delivered.
- Excel (.xlsx, four sheets, SheetJS from cdnjs on demand; CSV if it cannot load). Each row carries an ID; editing name, client, status,
  value, date, notes or the reviewed mark — or writing "delete" as the status — and importing the file applies the changes.
- Files per project (technical offer, financial offer, photos, other; up to 25 MB each) stay in IndexedDB on the device and ride in the
  full backup as data; adding a file to a mail thread makes it a project of its own.
