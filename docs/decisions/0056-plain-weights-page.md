# ADR-0056 — A plain weights page: points typed directly, everything else under «إعدادات متقدمة»

| | |
|---|---|
| **Status** | Accepted (the technical manager found the page too big to use) |
| **Date** | 2026-11-03 |
| **Version** | v8.73 |

## Context
The weights page had grown to 2,296 words and 5,700 px: the four-factor basis, three methods, usual times, AND/OR extras, own methods,
the rules editor, the calculator and the type-list update, all open at once. The manager needs to set a number per type and publish.

## Decision
- Default view: one simple table per group — the type, its points in a box the manager types into (0.5–10, step 0.5), how many tasks of
  it in the latest pull, and one grey line on how it counts («بالإنجاز», «×1.5 إن أُغلقت خلال 4 س», «حسب الوقت المعتاد (45 س)», an own
  method's name). Then the activities' points and the publish buttons.
- A type whose points are typed directly is saved with `w` and no `f` (factors): the engine already treats `f` as optional and the guard
  checks factors only when present. Its method and usual time are kept. The advanced table shows «نقاط محددة مباشرة» for it.
- Everything else moved under a closed «إعدادات متقدمة»: the explanation and calculator, the rules editor, the types update box, the
  four tiers, and the full per-type tables. It stays open across the page's redraws.
- Result: 2,296 → 439 words, 5,739 → 2,787 px; what remains is the type list itself. Nothing was removed.
- Tests: a new suite for the plain page; the suites that work inside the advanced part open it first; the phone suite now measures
  visibility with checkVisibility() because Chromium keeps a layout for closed details content.
