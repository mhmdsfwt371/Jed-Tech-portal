# 0144 — The tender desk: the register in the order of the work, and one frame for its windows

Date: 20 November 2026 · Version 9.74 · Builds on ADR-0085 (one compact bar), ADR-0119 (the pager), ADR-0122 (the tender's window),
ADR-0131 (the card) and ADR-0143 (the agenda)

## Context
The register grew one release at a time. By 9.73 its page opened with the agenda, then a bar of actions, a fold of «other ways»
that stayed open once opened, the period's reports beside the list, and the list. Each window it opened had been built on its own:
a close bar added by the portal's general hook on some, a head of its own on others, different widths, «Close» on a line of its
own under a long title on a phone, and the tender's card opening with the focus on its stage list — where an arrow key changes
the stage. The manager asked for the page and every window in it to be thought again: simple, professional, distinctive.

## Decision
- **The page in the order of the work.** One command card first — the mail drop (and the auto-study box), «or choose the
  files» for any other file, the Etimad radar and the market analysis, and «More»; what the last action said sits at the card's
  foot. Then the agenda (ADR-0143), then one summary band (the tiles, the stages, the period's line), then a bar with the period,
  the search and the list's own exports (year report, archive, Excel), then the list.
- **«More» is a menu, not a fold.** It holds what is used now and then: the period's reports and messages, the default owner,
  adding a tender by hand, importing a study, the assistant's prompt, the PST file and the manual way. It opens over the page,
  closes on a click outside it or on Escape (focus back on its button), stays open while the page redraws and while a window
  opened from it is open, and is closed again after a reload. On an empty register the same ways sit open inside the card. On a
  narrow screen it opens in the card itself: the page section carries a transform from its entrance animation, which makes it
  the containing block of anything fixed inside it, so a sheet pinned to the screen's foot would land below the screen.
- **A row says where it stands on its edge.** Amber for received, screening and decision; blue for preparation, ready and
  submitted; green for won; red for lost and missed — the palette's own `--sig`, `--accent`, `--ok`, `--fail`.
- **One frame for every window of the register** (`twHead()`, `twFoot()`, `dialog.tw`): the head is the window's first child and
  its only bar (`.dlg-bar`, so the general hook adds none) — title, the window's tools and «Close» on one pinned row. The head is
  a grid, not a wrapping row, so a long title wraps in its own column and «Close» never drops under it; on a phone the tools take
  a second line. Save buttons sit in a pinned foot. Three widths: small (560 px — paste, add, file drop), middle (920 px — year
  report, archive, correspondence summary) and large (1140 px — the card, the radar, a document). The market window keeps its own
  size and scroll (ADR-0140). A form inside the frame keeps to its width: a long list of tender names no longer widens it.
- **The card.** Its pinned head holds the title, the stage list, the first arrival and who it is for (entity, Etimad number,
  owner, site, the platform's page) — on a phone in smaller chips that wrap, so nothing slides out of the keyboard's reach. The
  working buttons come first in the body, then the stages and the tiles. The window opens with the focus on «Close».
- **What is brought into view lands under the head, not behind it.** The head and the foot tell their window how tall they are
  (`twSized()` sets `--tw-head-h` and `--tw-foot-h` from a ResizeObserver), and the window's scroll padding keeps a fold opened
  from a button (`tdOpenFold()`), or a field reached with Tab, below the pinned head and above the pinned foot. The pager
  (ADR-0119) already starts its pages under the head.
- **A button that opens a part of a window shows its page** (`pagerReveal()`): in a window of pages it goes to the page that
  holds the part, now and once more when the window has finished redrawing — opening a fold can be what turns the window into
  pages, and the recount used to start again at page 1. Before this, «The whole timeline» opened its fold on page 2 and left the
  card on page 1, with the focus on something nobody could see.
- Nothing is stored that was not stored before, and no network call is added. The pref that remembered the old fold is no longer
  written.

## Consequences
- Tests that pressed the period's reports open «More» first, as a person would. The agenda now follows the command card.
- The card's test helper looks for a control from the first page when it is not on the page shown: after a save the pager
  keeps the page that was open, and with the working buttons first a fold can now sit on an earlier page.
- The pager (ADR-0119) counts the pinned head as inset, as before; a shorter head on a phone leaves more of each page.

## Tests
`tests/browser/tenderdesk.py` D1–D28 — failed on 9.73 first: the empty card, the page's order, the menu (opens on screen, over
the page, closes outside and on Escape, keeps a window's state, closed after a reload), the eight windows in one frame with their
widths and focus, «Close», the row colours, three languages, both themes, the accessibility scan on the filled page, and a phone
(one column, the menu inside the card, a long title beside «Close», a short head, tools on the second line); twice (the same
window opened again leaves no second head, bar or window); a fold opened from a button shown on its page, under the head.
