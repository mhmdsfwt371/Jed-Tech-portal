# 0150 — Little scrolling: no table scrolls sideways, and the long pages fold into their titles

Date: 21 November 2026 · Version 9.81 · Applies to every page of the portal, the Tender Analyzer's page, and the program's window (3.7.1)

## Context
On 21 November 2026 the manager asked that neither the portal nor the program make him scroll much, down or sideways, because it
makes them tiring to use. Measured on 9.80, every page and window at 1366×800 and at 390×844 (phone), on the portal's sample data:
the guide was 12 screens on a laptop and 20 on a phone; the weights page 5 and 15; the Tender Analyzer's page 8 and 13. Sideways:
the tender stages strip overflowed by 92 px even on a laptop, and on a phone the tables of the control room, the team KPIs, the
overtime page (six tables) and the projects layer scrolled sideways. The windows themselves were all one screen (ADR-0119 pages
them). The program's window opened 780 px tall whatever the screen and, with a study and an offer done, needed 915 — on a laptop
screen its foot (the archive, the register, the signature) was out of reach, and a window does not scroll.

He chose (21 November 2026): long pages fold into their titles, one part open at a time; a table on a phone keeps its main columns
and opens the rest of a row on a tap; and the program's window is included.

## Decision
- **No table scrolls sideways** (`fitTable()` in `app.js`): any table in a `.table-wrap`, on a page or in a window, is measured at
  its natural width; while it is wider than its box, its end columns are hidden — a header group (merged cells) as one — keeping the
  first column, a column marked `keep`, a column holding a control, and at least two columns. Each row then has a «+» that opens the
  hidden cells under the row, each value under its column's name, and «−» folds it. It runs wherever a table is drawn (one observer
  of the page), again when the width changes, and leaves a table alone once fitted at that width, so an opened row stays open while
  the page changes elsewhere. Printing shows every column. Nothing is computed differently: it is the same table, shown narrower.
- **Long pages fold** (`fold()`): native `<details>` sharing a `name`, so opening one part closes the other. The guide (its twenty
  parts and the definitions) and the weights page (each team's types and the activity weights) are titles only; the part that is
  open stays open when the page is drawn again (an edit, a language change). Printing opens every part, then puts them back.
- **The tender stages** share the width on a laptop (stops shrink, labels wrap) and wrap into rows on a phone; **the coming dates**
  are rows of days on a laptop instead of a strip to drag sideways (a phone keeps the swipe strip, one day per swipe).
- **The Tender Analyzer's page**: every part folds under its title (`#install` and the side list open their part); on a phone the
  side list goes, since the titles are the list, and the two-column tables stack.
- **The program's window (3.7.1)** opens no taller than the screen; after a study the six steps and the full progress bar go (they
  come back while something runs), the switches and «Start» fold behind «⚙ Settings and analysing again», the files' buttons sit in
  one row whenever their labels fit (two rows otherwise, never a cut label), and the offer's files are one row instead of five
  buttons one under another. The archive and chat windows are no taller than the screen either.

## Not done, and why
- The day strip of «coming dates» on a phone still swipes sideways: on a 390 px screen, rows of days would be a long column; one
  day per swipe is the shorter way to read it.
- The tender register's top card (import, mail folder, how-to) is unchanged: it is already folded behind «⋯ More» where it can be.

## Tests
`tests/browser/scrollfit.py` S1–S9 (failed on 9.80 first: the stages strip 92 px sideways on a laptop; the guide 12.1 screens and
the weights 4.8): no page and no box scrolls sideways on a laptop and on two phones (dark Arabic, light English); the guide and the
weights within their screen budget; «+» opens exactly the hidden columns with their names and survives a change elsewhere; one guide
part open at a time; a weights part stays open across a redraw; print opens every part and restores; the Tender Analyzer's page in
under 3.2 screens, nothing sideways, `#install` opening that part alone. The program: `tests/test_window_fits.py` (with
`TA_WINDOW_TEST=1` under a virtual screen; failed on 3.7.0 first: 780 > 668 at 1366×768): every state — empty, study, study and
offer — fits the window in Arabic and English at 1280×720, 1366×768 and 1920×1080, measured with Noto Sans Arabic in place of
Segoe UI (wider, so a fit there is a fit on Windows).
