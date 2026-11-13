# ADR-0118 — Tender document excerpts and source dates

- **Status** Accepted for local preview.
- **Date** 2026-11-13

Continue the Tender Register inside its existing route and design. Saved attachments are read locally with vendored PDF.js, fflate and the existing SheetJS. Original files remain available even if reading fails. No document text leaves the device.

Text rules select verbatim excerpts about scope, site visits, duration, guarantees, evaluation and handover. These are source excerpts for review, not an exhaustive semantic analysis or an AI-generated study. PDF pages and spreadsheet sheets identify their source. Image-only PDFs, passwords, unsupported formats, size limits and partial readings are labelled. There is no OCR. Tables show a bounded preview; the complete original remains downloadable.

File deadlines participate in the existing date-candidate review. Manual choices take priority. Conflicting candidates clear only automatically populated dates until the manager chooses. Removing a file removes its evidence and recalculates automatic deadlines without inventing a replacement. Existing historical dates remain unchanged.

File category changes, reads and removals are recorded. Users can search and filter large attachment collections. Explicit categories are retained when rereading. Backup and sync retain the optional analysis data and file-removal tombstones. Existing PST imports still carry metadata and filenames only; this decision does not claim full PST attachment extraction.

Limits are 25 MB per input, 120 PDF pages, 180,000 text characters and 400 spreadsheet rows on each of the first 20 sheets. Spreadsheet XML expands to at most 25 MB; DOCX document XML is at most 8 MB. Table previews include at most five tables with 31 rows and 16 columns. Exceeding read coverage is labelled and does not discard original bytes.

QA follow-up (v9.39): file analysis merges by its reading timestamp and explicit categories by `kindAt`. Mixed PDFs with pages without readable text are marked partial. New email entries have an email-source label. Reproducible document and integration tests are part of `npm run verify` and run with Node 24 development dependencies. See `docs/qa/tender-register-v9.39.md`.
