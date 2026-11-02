# ADR-0055 — A simpler data page and KPI setup

| | |
|---|---|
| **Status** | Accepted (the technical manager asked for simpler wording) |
| **Date** | 2026-11-02 |
| **Version** | v8.72 |

## Context
The data page carried four ways to pull, each with its own explanation: 306 words and about 1,800 px tall. The manager needs one way.

## Decision
- Data page: one box on top — the period, two steps («مرة واحدة: اسحب هذا الزر إلى شريط المفضلة», «افتح ماي أفاقي واضغط الزر — البيانات
  ترجع هنا وحدها») with the direct button, and the last pull (date and task count). The uploaded data and the browser-storage warning stay
  visible beneath. The manual bookmark, the browser commands, pasting or choosing files, and backup live under a collapsed «طرق أخرى ونسخ
  احتياطي». The direct button's code (for a phone bookmark) moved there too.
- «مؤشراتي» setup: the same two steps; the phone notes and the copy-code button under «على الجوال، ونسخ رمز الاختصار». The lead sentence
  and the period line are shorter.
- Result: 306 → 89 words and 1,800 → 600 px on the data page; the setup 84 → 72 words. Nothing was removed — only folded.
- Tests that press buttons in the folded part now open it first, as a person would.
