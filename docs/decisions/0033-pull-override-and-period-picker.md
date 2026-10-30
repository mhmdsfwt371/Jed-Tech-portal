# ADR-0033 — A newer pull overrides the older; the manager picks the pull period

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-31 |
| **Version** | v8.33 |

## Decision
- A new real pull removes any older real pull whose range it fully covers (pulling the month on the 15th and again on the 20th
  leaves only the 20th). Partial overlaps stay; the sample set never overrides or is overridden. Reports follow the same rule.
- A ✕ beside the board's period list deletes that period (and its reports) from the device, after confirmation.
- The Data page has a pull-period picker: this month, any of the last four quarters, a year (four quarters), or custom dates.
  Both manager bookmarks (direct and manual) are rebuilt for the chosen range.
