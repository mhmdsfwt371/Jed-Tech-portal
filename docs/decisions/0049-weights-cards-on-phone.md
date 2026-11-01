# ADR-0049 — The weights tables read as cards on a phone

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-02 |
| **Version** | v8.65 |

## Context
On an iPhone the weights table (eight columns: type, factors, weight, method, usual time, count, points, editors) scrolled sideways
inside its frame, cutting the type names and the usual time — the manager could not follow the layout. The phone test excluded
tables that scroll inside their own frame, so it did not catch it.

## Decision
- After drawing, every cell of the weights tables carries its column's name; under 820px each row becomes a card: the type on top,
  every field named under it, the four factors in one row. Desktop keeps the table.
- The phone test now fails if any weights table scrolls sideways or a card spills off-screen.
- English and Urdu say “usual time” like the Arabic.
