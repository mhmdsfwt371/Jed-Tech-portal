# ADR-0085 — The tender register: a compact pull bar, and cards on a phone

| | |
|---|---|
| **Status** | Accepted (the technical manager: «doesn't the design need something new?» — an audit with real screenshots answered) |
| **Date** | 2026-11-06 |
| **Version** | v9.03 |

## Findings (measured)
- The pull section (three ways, each with its explanation) came first and was long: on a desktop the table started at 1032 px,
  below the first screen; on a phone after 1.8 screens — the weekly setup buried the daily view.
- On a phone the table showed two columns; the stage, the days waiting and the countdown were off to the side, reachable only by
  a sideways scroll nobody would guess. The date fields were under 32 px tall.

## Decision
- The pull section is one compact bar: the period and five actions (copy the instructions, the bookmark, upload Claude's file,
  choose a PST, «＋ Tender»). How each way works is folded under «How?», open only while the register is empty.
- On a phone each tender is a card: the name, the first date with the days waiting, the stage across the card, the countdown;
  tapping opens the details as before. Controls are at least 36 px tall.

## Result
Desktop: the table starts at 674 px (within the first screen); the page is a third shorter. Phone: no sideways scroll, no control
under 32 px, no text under 12 px — `harness/tenders.py` T19 holds it. Full run clean (weekly passed alone after a timing miss).
