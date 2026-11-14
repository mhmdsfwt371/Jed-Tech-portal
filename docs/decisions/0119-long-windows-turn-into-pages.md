# ADR-0119 — A window with a long scroll turns into pages

| | |
|---|---|
| **Status** | Accepted (the technical manager, 14 Nov 2026: «any window with a big scroll, make it pages, in any page») |
| **Date** | 2026-11-14 |
| **Version** | v9.41 |

## Decision
- One rule for every window the portal opens (every `showModal`, through the same hook that adds the ✕ bar): when what is inside
  is more than **1.5 screens** of the window, the scroll is replaced by pages, with «Previous · page numbers · Page n of m · Next»
  pinned at its foot. A shorter window keeps its own scroll, untouched.
- Nothing inside is moved or copied. The same content is shown one screen at a time, cut only between rows, cards, paragraphs
  and fields (`pageStarts()` in `core.js`). A heading is never left alone at a page's foot. A thing taller than a page is shown in
  screens. A long table keeps its heading row pinned under the ✕ bar.
- A box that scrolls by itself inside the window (a table in a frame) is opened into the same pages while the window is paged and
  gets its scroll back when the window closes: one way to move through a window, not a scroll inside the pages.
- Wheel, swipe, Page Up/Down, Home/End turn pages; one gesture is one page. Moving the focus to a field on another page brings
  that page. Pages are counted again when the content changes, the window is resized, or something inside finishes animating;
  the person stays on the page they were on.
- On closing, every change is undone. Printing shows the whole content.

## Not done
- The pages of the portal itself (Team KPIs, Data…) keep their normal scroll: the request was about windows.
- A reveal-on-scroll inside a paged window is shown at once (there is no scroll left to wait for).

## Tests
`tests/core.test.mjs`: page starts fall only between rows, every row belongs to exactly one page and is whole on it, the heading
row never covers a row; a heading is not left at a foot; a tall block is walked forward in screens.
`tests/browser/pager.py` (22): built windows measured page by page on desktop and phone, Arabic, a scrolling body inside the
window, a framed table, focus, keys and wheel, growth and shrinking, closing; then every window the portal opens on the real
October data, none left with a long scroll and none with a cut row.
