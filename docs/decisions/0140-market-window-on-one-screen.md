# 0140 — «Market analysis» on one screen: pressed numbers open their own window, and every list is searched

Date: 18 November 2026 · Version 9.68 · Builds on ADR-0136 and 0139 · An exception to ADR-0119

## Context
The manager opened «Market analysis» on his real pull and found «Page 1 of 105»: ADR-0119 turns any window with a long scroll
into pages, and a list of 2,807 tenders under nine numbers is a very long scroll. He asked for the opposite: the numbers first;
a date range he chooses beside the ready periods (both, not one instead of the other); a number or a name pressed opens a pop-up
with its own dashboard, its list and its Excel; the list scrolls inside the page; and a search in every list of the tender
pages — by tender number, by a name, filtering as he types.

## Decision
- **A working window keeps its own scroll.** A window marked `data-own-scroll` is left alone by the pager (`pagerAttach()`).
  The market window is laid out as one screen: what chooses and counts stays in view, the list scrolls inside the window with
  its heading row pinned, and more rows are added as the end of the list is reached. A button folds the choices and numbers
  away when the list needs the room. On a phone the window scrolls as one and the list keeps most of the screen.
- **The period and the two days are one choice shown twice.** A ready period fills «From day» and «To day»; changing a day
  makes the period «a period I choose» and keeps the other day.
- **A number is a door.** Every tile opens the tenders (or the names) it counts in a window over this one: `mkWindow(state)`
  is the same window started from the choice under it and narrowed to what was pressed (`only: 'valued' | 'bids'`, a status, a
  tab). A name in a list (winner, entity, activity, industrial-IoT line, bidder) opens its tenders the same way. Each window
  has its own numbers, lists, search, order and Excel, and closes back to the one under it.
- **Every list is searched as you type.** Tenders: by name, number, entity, activity, winner or bidder (`marketStats()` looks
  at the names only when the tender's own words do not match). A list of names: by name, without touching the numbers.
  The shared list window (`crModal()`) — the archive and every other list pop-up — gets the same box, searching any word or
  number in a row; it joins a pressed tile or bar, the Excel follows it, and «Show all» clears it.

## Consequences
- ADR-0119 still rules every other window. A window opts out only when it is built as one screen with a list inside it.
- Narrowing in place by a pressed name («Showing …», «Remove this narrowing») is gone from the market window; the pop-up
  replaces it, and the window under it keeps its place.
- The numbers on the tiles are shorter: the note «from N tenders whose value was published» moved to the tile's tooltip; the
  line under the tiles still says how many awards the money rests on.
