# ADR-0096 — A PST the browser cannot hold goes straight to the extractor

| | |
|---|---|
| **Status** | Accepted (the technical manager, with a screenshot of «Could not read the file» on a large PST: «what do I do?») |
| **Date** | 2026-11-08 |
| **Version** | v9.14 |

## Decision
Above 900 MB the mail page does not try to read a PST in the browser: it shows the four Mail Extractor steps with its download
button and lights the «Large files» box. A failed read also offers the extractor. The tender register's PST button explains the
limit and points to the assistant instructions or a smaller export.

## Tests
`harness/bigpst.py` (4): a 1 GB file shows the steps and the button at once, no «could not read» error, the tender register
explains. Mail, PST, email-activity, tender and mobile suites clean.
