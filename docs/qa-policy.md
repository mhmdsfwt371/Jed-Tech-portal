# QA policy — what «done» means on this repository

Version 9.55 · ADR-0129 · binding on every agent and every person who changes the portal, together with `AGENTS.md`.

This is the working policy the audit of 14–15 November 2026 was run under. It exists because the portal had sixteen green
suites and still shipped text nobody could read in dark mode, a date that was read and then thrown away, and an empty box that
became zero after a reload. Green suites were true; they were not the whole truth. The rules below are how the gap is closed.

## 1. The bar

A change is done when **all** of these hold, not when the feature appears to work:

1. **A test failed first.** The test is written before the fix, is run against the old code, and fails there. A test that has
   never failed has proved nothing. For a new function the old-code failure is trivial; then the test must cover the behaviour
   that mattered, not the function's existence.
2. **`npm run verify` is green** (logic tests, integration tests, the guard).
3. **`npm run test:browser` is green with the real pull present** — every suite ran, none skipped. A skipped suite is reported
   as skipped and never counted as passed.
4. **The audit suite passed** (`tests/browser/audit.py`): every window, light and dark, three languages, a phone.
5. **GitHub agrees on the same commit**: `verify` (both jobs) and `pages` green, and the live `version.json` shows the new
   number. Until then nobody is told «done».

## 2. What must be looked at, every time

A page is not only what the menu opens. For any change to the page code:

- **Every window that opens over a page** — cards, detail windows, lists, help, the tour — not only the pages.
- **Both themes.** A colour that is fine on white can be the dark theme's own card colour.
- **Three languages**, and one sentence that mixes scripts (an Arabic name inside English text).
- **A phone** (390 px): no sideways scroll, and nothing that needs a drag — a phone cannot drop a file.
- **After a reload.** What was saved must come back as it was. An empty value is still empty; nothing that was read is lost.
- **Twice.** The same file imported twice, the same button pressed twice: the second time must not leave a mark.
- **Print**, when the page is one that gets printed.
- **Keyboard only**: every control has a name; whatever scrolls can be reached.

## 3. Rules for data

- **Nothing is guessed.** A value the portal cannot read is left empty.
- **What is left out is said.** If a file held a value and the portal did not take it, the page names the field. Silence is
  the defect: the manager must never have to wonder whether a value was missing or dropped.
- **Empty is not zero.** `null`, `''` and a missing value mean «nothing»; they never turn into `0`, `false` or today's date.
- **One patch for one decision.** When several fields are decided together (the four tender dates), they are saved together,
  through one function in `core.js` — not listed by name at each call site, where the fifth field will be forgotten.
- **The only copy is watched.** Anything kept on one device says how old its last backup is.

## 4. Rules for the look

- Text colour comes from a token that has a dark-theme value. Never a colour by number, never a surface token. The guard
  (rule 15b) refuses both.
- A sentence that takes a name or a file name isolates it (`bidi()`), and keeps the page's direction — never `dir: auto` on
  the whole line.
- A long explanation is one line that opens. The first screen of a phone belongs to the work.
- An input has a name a screen reader can say. A grey hint alone is not a name (the page supplies it as a last resort; a real
  label is better).

## 5. Reporting

Every report to the manager separates three lists, in plain words:

- **Verified** — what a test proved, and on which data (the real October pull, or made-up data built in the test).
- **Not verified here** — what works only against a system this environment cannot reach (MyAFAQY, a real booklet, a real
  analyzer file). Said every time, until someone has tried it for real.
- **Needs the manager** — what only he can do or decide.

No figure is given without its source. A number that came from an estimate is called an estimate.

## 6. Do not stop early

Work stops when the list in §1 holds for everything that was found, or at a decision that is the manager's and cannot be
undone. «It mostly works» and «the rest is cosmetic» are not stopping points: each finding is fixed, or written down in the
audit record with the reason it was left.

## 7. The audit itself

Before a release that touches many pages, and at least once a month, the wide crawl is run: every page, everything on it that
can be clicked, every window that opens, in the theme × language × screen matrix, with the accessibility scan inside each
window. Its findings are sorted into *fixed with a test*, *not a defect — why*, and *left — why*. The record of the first run
is `docs/qa/audit-v9.55.md`.
