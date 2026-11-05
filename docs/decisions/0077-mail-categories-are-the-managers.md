# ADR-0077 — The mail categories are the manager's own: add, name, reorder, remove — and they travel with the backup

| | |
|---|---|
| **Status** | Accepted (the technical manager: «why edit with you? make it dynamic — I edit in the portal») |
| **Date** | 2026-11-05 |
| **Version** | v8.94 |

## Findings
- The words of the three categories could already be edited in the portal, but the categories themselves were fixed in the code
  (`MF_CATS`): no new category, no renaming, no order of his own.
- The rules were kept with `kvPut('mailrules')` and **not carried by the device backup** — a new device or a cleared browser lost
  them. The guard did not see it, as that key does not go through the store list it checks.

## Decision
- Up to 12 categories, each with a name (the three built-in ones keep their translated names until renamed), its words, and its place:
  order is priority — the first rule that matches counts, the rest is «Other». Add, rename, move up/down, remove (with a confirm),
  back to the defaults (with a confirm).
- The results table, the totals and the list's filter pills are built from his categories, in his order, then «Other».
- `cleanMailRules` bounds and validates what is saved and what a backup brings; the backup carries `mailrules` and a device without
  rules of its own takes them on restore.

## Tests
`harness/mailfile.py` (16): the defaults before any file; edited words give the independent counts; a new category named «سعة»,
given a word and moved to the top, takes the messages that word matches first (upsell drops to 0) and, removed, gives them back;
the backup carries the rules and a new device restores them. Full run clean (projfit passed alone after a timing miss under load).
