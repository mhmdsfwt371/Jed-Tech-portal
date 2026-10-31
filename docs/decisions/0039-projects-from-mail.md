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
