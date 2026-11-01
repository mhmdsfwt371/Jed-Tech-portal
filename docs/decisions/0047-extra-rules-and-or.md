# ADR-0047 — Extra rules with AND / OR

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-01 |
| **Version** | v8.63 |

## Decision
The two fixed extras of v8.61 (email, outside hours) become a list of extra rules the weights admin builds:
- Each rule: one or more conditions — from email, outside working hours, on a weekend, within the type's standard time, field
  work (field factor 2), government or platform (outside-party factor 2), contract or revenue impact (impact factor 2) — joined by
  AND («كل الشروط مع بعض») or OR («أي شرط منها»), and a percentage (1–100). One condition alone = that condition only.
- When several rules match: add their percentages, or take the highest only; a cap (default 100%) bounds the total.
- The v8.61 extras read as single-condition rules; no rules = the original numbers (unit tests).
- The methods (done / speed / time) stay one per type: speed rewards finishing faster and time rewards taking longer, so they
  cannot combine; “within the standard time” is available as a condition with any method.
- The explanation lists the rules in words; the calculator shows which rules matched.
