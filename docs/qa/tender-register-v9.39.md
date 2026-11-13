# Tender Register — QA report v9.39

Date: 13 November 2026 (Saudi Arabia)

Result: automated acceptance checks passed in the local checkout. Ready for local user acceptance testing, subject to the untested environments listed below. No remote branch, pull request, deployment or live portal data was changed.

## Scope and baseline

Source: Jed-Tech-portal snapshot of main commit `5a3caa8ea4c54403aa1299a83e316e7612354a41`. All changes are local. The existing Tender Register route, design tokens, manager/team views and portal data model are retained. New fields are additive. Test messages, addresses, quantities and dates are invented; test IDs begin with `sample:`.

## Verification

| Area | Method and observed result |
|---|---|
| Core logic | 92 tests passed, including document provenance, conflicting dates, manual-date preservation, removed file sources and merging older backups. |
| Existing mail activity | 21 tests passed. |
| Existing systems configuration | Validation suite passed. |
| Document readers | Actual generated PDF, XLSX, Arabic DOCX, CSV and TXT files read successfully. Table values, document dates and source page/sheet references verified. |
| Exceptional documents | Image-only PDF reported no readable text; mixed text/image PDF reported partial; password-protected PDF reported locked. Corrupt and unsupported inputs were labelled. Input and expanded-document limits were exercised. Original preservation is handled by saving before extraction. |
| Email import | EML imported with original bytes and all attachments. Receipt date populated. Duplicate Message-ID/content import skipped. A message missing both receipt and sent dates was rejected rather than assigned an invented date. |
| Dates | Three conflicting document dates remained available for review. Choosing one made it manual. Subsequent reading and backup merging preserved that choice. |
| Files | Classification correction, table preview, category filtering, selective deletion and original-email retention passed. Removed attachments did not reappear on duplicate import or backup merge. |
| Many files | 120 additional text attachments were read. Initial rendering showed 40 files; Show more displayed 80. Filename search selected the expected single attachment. This is not a multi-gigabyte capacity benchmark. |
| Lifecycle | Every existing stage exercised: received, screening, bid decision, preparation, ready, submitted, won, lost, cancelled and declined. Required reasons and stage history verified. |
| Final offers | Ready was blocked with no offers and with only a technical offer. Both populated offers allowed progression. Removing the required technical offer while ready was blocked. |
| Data integrity | Full backup/restore preserved file bytes, categories, extracted tables and manual dates. Reload retained data. A stale tab could not overwrite a newer revision. Simulated storage failure returned failure without updating the in-memory state as if saved. |
| Portal regression | Submitted tenders appeared once in My Projects. Existing historical records and control-room alerts remained intact. All management routes rendered in the test harness without uncaught UI errors. |
| Language and theme | Arabic, English and Urdu switching and theme switching passed in the DOM harness. Translation-key, design-token, syntax and version guards passed. Native Urdu wording review remains pending. |
| Team presentation | Team view did not load or export manager tender records. This validates existing presentation separation, not a new authentication system. |
| Literal content | HTML-like input displayed as text; it did not create an image element in the tender page. This is a focused rendering check, not a comprehensive security audit. |
| Packaging | Static site build and diff whitespace checks passed. The final patch is checked against a clean copy of the local baseline. |

## Browser observation

A real cloud Chrome session on the precursor v9.38 successfully imported one synthetic EML containing PDF, Word and Excel attachments. The UI showed all files, the three conflicting submission dates and extracted source references. Selecting a date, correcting the Word file category, filtering to BOQ and opening the table preview succeeded; the preview showed 30 cameras and 2 switches. Arabic portal navigation and the existing design were present.

The final v9.39 corrections were rechecked with automated integration tests. The browser session was not required to finish the remaining code checks. Native Outlook-to-browser drag and mobile visual behavior were not exercised.

## Defects corrected during this QA pass

1. Merging an older same-file backup could discard newer analysis or an explicit category. The merge now retains analysis by reading timestamp and manual classification by its change timestamp.
2. A short complete evidence sentence could absorb the next unrelated sentence. The next line is now added only when completing a heading.
3. Direct email imports were labelled as manual entries. New email records now show their email source, and guidance reflects the direct MSG/EML workflow.
4. Mixed text/image PDFs could appear fully read despite image-only pages. They now show partial reading; originals remain downloadable.

Regression assertions for the first three code behaviors and mixed-PDF handling were observed failing before their fixes, then passing afterward. A fixed-delay timing issue in the QA harness was also replaced with waiting for the saved state; it was a test issue, not a portal defect.

## Reproduce

Use Node 24.15 or newer in the 24.x line (validated on 24.22.1):

```sh
npm ci --ignore-scripts
npm run verify
node scripts/build-site.mjs
git diff --check
```

The verification workflow now uses Node 24 and installs the locked development dependencies. Tests and development dependencies are excluded from the published static-site build. Expected PDF.js diagnostics occur in Node when the standard-font resource is accessed through a file URL, and when exercising corrupt PDF input; the assertions still verify extracted values. Browser document reading succeeded independently.

## Remaining acceptance limits

- Native drag from the user's installed Outlook into Windows Chrome or Edge still requires a representative user-device test. File selection with EML was verified in Chrome. Native MSG import was not rerun in this final QA pass.
- PST remains the existing metadata/filename import. Full PST attachment extraction is not implemented by this change. No 10–25 GB mailbox performance claim is made.
- There is no OCR for scanned pages and no semantic AI study of every document. PDF/DOCX/Excel/TXT excerpts are rule-selected evidence for review. Unsupported file types remain downloadable.
- Browser storage quota depends on the device. Large real document collections, Safari/iPhone layouts, offline cold start and native Urdu translation quality are not signed off.
- Standalone HTML data migration and live user records were not exercised. External company services and deployment workflows were not run.
- The patch applies to the recorded baseline. Before any future GitHub integration, compare it with the then-current remote branch and rerun checks on the combined source.
