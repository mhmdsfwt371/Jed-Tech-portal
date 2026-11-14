# `afaqy-tender-study/v1` — the Tender Analyzer's file for the tender register

The Tender Analyzer writes this file beside its study (one file per run; one or more tenders inside). The register's
«📊 Import the analyzer's study» reads it and fills only empty fields (ADR-0126).

```json
{
  "schema": "afaqy-tender-study/v1",
  "generatedAt": "2026-11-14T18:00:00Z",
  "tool": "Tender Analyzer 2.1",
  "tenders": [
    {
      "subject": "the tender's title exactly as the booklet or the email states it",
      "etimadNo": "the Etimad tender number, digits only, or \"\"",
      "entity": "the government entity",
      "dates": {
        "askDue": { "date": "YYYY-MM-DD", "time": "HH:MM" },
        "visit":  { "date": "YYYY-MM-DD", "time": "HH:MM" },
        "due":    { "date": "YYYY-MM-DD", "time": "HH:MM" },
        "openAt": { "date": "YYYY-MM-DD", "time": "HH:MM" }
      },
      "fees": 1500,
      "bond": "the initial guarantee as written, e.g. \"2% of the offer value\"",
      "value": null,
      "decision": "go | no-go | review",
      "decisionWhy": "one line",
      "summary": "the executive summary, at most 4000 characters",
      "studyFile": "the study deck's file name",
      "evidence": {
        "fees": { "file": "booklet.pdf", "page": 4, "quote": "the sentence the value came from, at most 240 characters" }
      }
    }
  ]
}
```

Rules
- A value that is not stated, or that the booklet sends to the Etimad platform («حسب المحدد في المنصة»), is `null` (numbers), `""`
  (text) or left out (dates). Never estimate.
- Dates are Gregorian `YYYY-MM-DD`; a Hijri date is converted. Times are 24-hour Saudi time `HH:MM`, or `""`.
- `askDue` inquiries deadline · `visit` site-visit deadline · `due` submission deadline · `openAt` bid opening.
- `fees` booklet price in SAR · `value` estimated contract value in SAR (only when the entity states it) · numbers, no text.
- `evidence` has one entry per filled field: `askDue`, `visit`, `due`, `openAt`, `etimadNo`, `fees`, `bond`, `value`.
- No names of people, no prices of our own, nothing from AFAQY's internal costing.

How the register uses it
- Matches a tender by `etimadNo`, then by `subject` (RE:/FW: and spacing ignored). From a tender's own window the study goes into
  that tender whatever its title.
- Fills only empty fields; a field already filled with another value is listed as a difference, never replaced.
- Each filled field shows «from the analyzer», with the file, page and quote on hover. Typing over it makes it the manager's.
- `decision` shows in the tender's window and in the Excel export; it does not move the tender's stage.

## The same data inside the study workbook (v9.53, ADR-0127)

So the manager uploads one file — the study — the analyzer may also put the data in the study workbook, in a sheet named exactly
`tender-register`, one row per key, columns `key | value | source file | page | quote`:

| key | value |
|---|---|
| `schema` | `afaqy-tender-study/v1` (required, or the sheet is ignored) |
| `tool`, `generatedAt`, `subject`, `etimadNo`, `entity` | text |
| `askDue`, `visit`, `due`, `openAt` | `YYYY-MM-DD` text or a date cell |
| `askDueTime`, `visitTime`, `dueTime`, `openAtTime` | `HH:MM` |
| `fees`, `value` | number, or empty |
| `bond`, `decision`, `decisionWhy`, `summary`, `studyFile` | text |

Columns 3–5 on a value's row are its evidence. The register reads the sheet, fills the tender, keeps the workbook attached as the
tender's study, and — if `decision` is `go` or `no-go` — moves a tender that is still before preparation.
