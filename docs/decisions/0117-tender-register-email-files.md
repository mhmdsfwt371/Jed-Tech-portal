# ADR-0117 — Outlook messages and files in Tender Register

- **Status** Accepted for the local integration preview.
- **Date** 2026-11-13

The manager's Tender Register keeps its route, lifecycle, filters and single IndexedDB record. Outlook MSG and EML imports can link to a selected tender or match by Etimad number, reply references or subject. Message IDs and hashes prevent duplicate imports. The parser stays on the device. The original file, classified attachments and scheduling metadata are retained.

Deadlines are read from message text and table rows. Distinct candidates are displayed for review. Dates entered by the manager are preserved. When Outlook only provides a sent date, the register labels it as such.

The existing tender data gains optional files, messages and activity. Earlier rows and reports remain readable. Device backup and encrypted sync carry the files and merge deletions so a removed attachment does not reappear. New bids require both offers before advancing from preparation to ready or a submitted outcome. Historical bid stages remain valid.
