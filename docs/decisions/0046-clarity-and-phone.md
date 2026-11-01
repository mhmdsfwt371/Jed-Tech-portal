# ADR-0046 — A clarity and phone pass, measured

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-01 |
| **Version** | v8.62 |

## Measured on an iPhone 13 with October's data (before → after)
- «مؤشراتي» (manager) 24.8 → 8.5 screens: the team's month cards were still on the manager's own page; they are removed there
  (the team link keeps them for leaders). Each person's card, plan and meetings live in Development and the person file; the
  rank is still shown to the manager in Development.
- «التطوير» 22.6 → 6.6 screens: this month's suggestions and the team map are folded by default.
- Controls under 32px: 17 on «مؤشراتي», 3 on the team page, 2 on weights → 0 (help buttons, intro-card links, checkbox labels,
  small buttons, number inputs). Text under 12px: 60 on weights, 9 on Development → 0.
- No page scrolls sideways (unchanged).

## Menu
- On the manager link the tools page is «كل الأدوات والأنظمة», distinct from the «أدوات الفريق الفنية» group.
- English group names keep the reference's spaced capitals, a size larger and slightly tighter so they read on a phone.

## Guard
A permanent phone test checks every manager page: no sideways scroll, controls at least 32px (checkboxes count by their label),
no text under 12px, and My KPIs and Development under 10 screens.
