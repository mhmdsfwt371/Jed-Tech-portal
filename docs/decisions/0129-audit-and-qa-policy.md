# 0129 — The audit: what «complete» needed, and the policy it left behind

Date: 15 November 2026 · Version 9.55 · Adds to ADR-0111 (browser suites), ADR-0119 (windows), ADR-0126–0128 (tender flow)

## Context
The manager asked for the system to be looked at the way a consultant and a quality engineer would, changed where it fell
short, and for a standing policy so the work does not stop early. Sixteen browser suites and the logic tests were green.

A crawl was written that opens every page, clicks everything on it that is not destructive, and inspects every window that
opens — 12 combinations of language, theme and screen, about 75 states each, with the accessibility scan inside each window.
It found no page error, no raw text key and no duplicate id. It found the defects below, none of which an existing suite
could have seen: the smoke suite scans pages, and these were in what opens over a page, in the dark theme, after a reload, or
on the second import.

## Decision

**Defects fixed (each with a test that failed on 9.54)**
- A site visit and a bid opening read from an attached document were computed and then dropped: two call sites saved «due»
  and «askDue» by name. `tenderDatePatch()` now carries every date field; the call sites use it.
- An empty estimated value or booklet fee became `0` after reload-save-reload (`Number(null)`), hiding the «empty» reminder
  and making the analyzer's study report a difference instead of filling. `tenderAmount()` keeps nothing as nothing.
- The same study imported twice wrote a history line each time. `applyTenderStudy()` now returns an empty patch when nothing
  changed.
- An hour written for the visit or the opening lived until the next reload. It is no longer written (the register keeps an
  hour for the submission and inquiries deadlines only).
- Dark theme: text in `--ink-soft`, `--sea`, `--live` and five uses of `#B42318` were dark ink on dark cards (1.1–2.7 to 1).
- 48 controls in the advanced weights, the rank and week selectors and every hint-only input had no accessible name; scroll
  boxes could not be reached by keyboard; a group of buttons was announced as a picture; the tour's progress bar had no name.
- Sections waiting to be scrolled into view were printed blank.
- A sentence taking an Arabic tender name was laid out right-to-left in English (`dir: auto` on the whole line).
- Files dropped while the page was reading others vanished silently.

**Changes of shape**
- The tender page opens on the least-touch flow (ADR-0127): the mail zone, «drop anything» with an «or choose the files»
  button (the same routing — a phone cannot drop), results. Every other way in and the default owner are folded under one
  line, open while the register is empty, and remembered.
- The «one of three mail pulls» explanation is one line that opens once its page holds data (tenders, projects, PST).
- A file means the same thing wherever it is added: from a tender's own window a study is read and a «final offer» moves the
  stage, as a drop does. Renaming a file's category to «final offer» does the same.
- The study reader is tolerant in form and strict in substance: a date as plain text (`YYYY-MM-DD`, optionally with `HH:MM`)
  and an amount as text (`1,500`, `١٥٠٠ ريال`) are read; a day-first date or an amount in words is not guessed — it is listed
  in `skipped` and named on the page; «not found» in words is empty and silent.
- The register says when its only copy is old: `backupDue()` — never saved, or seven days — with a button that saves one. The
  Data page shows the date. Nothing is asked while there is nothing to lose.

**Guards and tests**
- Guard rule 15b: a `color:` token must resolve to a light value in the dark theme, and no dark text colour may be written by
  number. It fails on 9.54 for the three tokens and the five reds.
- `tests/browser/audit.py`: every window in dark/English, light/Arabic, dark/Urdu and on a phone — names, focus, Escape, raw
  keys, readable text measured against what is really painted behind it, and the scanner inside each window; then keyboard
  scroll boxes, hint-only inputs, print, and the backup note. Without the real pull it runs on the portal's sample data.
- `scripts/browser-suites.mjs` (`npm run test:browser`): every suite, each on its own port, skips reported as skips; a suite marked `# suite: alone` (pager, audit — they measure frames) runs after the rest with the machine to itself.
- `axe-core` 4.10.2 is a pinned dev dependency: the scan no longer depends on a file outside the repository.
- CI runs the browser suites (job `browser`); those that need the real pull skip there and are run before a release.
- `docs/qa-policy.md`: the standing policy. `AGENTS.md` points to it.

## Not a defect — looked at and left
- Latin text in Arabic and Urdu pages: task-type names, team names, tool names and the standard English term beside a KPI are
  data or deliberate glosses. Positions show in English in Urdu because `team.json` holds Arabic and English only.
- Wide tables scroll sideways inside their own box on a phone; the page itself does not.
- The scanner's «target size» note on a thin bar under WCAG 2.2: outside the bar this portal is held to (2.1 AA).
- Contrast notes on the tour taken mid-fade: the text was at 5% opacity for the length of the animation.

## Not verified here
Everything that needs a real system: the server-systems read and the first-start read on MyAFAQY (extension 1.0.6), the
assignment panel's pilot, a real analyzer study file, the date patterns on real booklets, and Urdu read by a native speaker.

## Consequences
The toolbar buttons that tests reached directly are now inside a fold; suites open the fold or use the inputs' own classes
(`input.td-up-in`). The register upload input has a class so no test depends on the order of inputs again.
