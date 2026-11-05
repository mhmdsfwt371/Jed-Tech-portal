# ADR-0073 — The sixteen suites that already failed on v8.87: what was stale, and the four real faults they led to

| | |
|---|---|
| **Status** | Accepted (the technical manager: «do both and continue — finish all the work correctly») |
| **Date** | 2026-11-05 |
| **Version** | v8.90 |

## Findings
- **Seven suites failed only on language.** The portal opens in English unless the reader chose (app.js), while these suites were
  written when it opened in Arabic and look for Arabic words. Started in Arabic as written — without overriding a language a test
  picks later — they pass with no other change: shell 15, private links 9, signatures 8, PRO 17, assignment 16, tools 16, team 10.
  None of the six that looked like real faults (the Arabic menu side, a tool's height, PRO's wrong-password message, signatures,
  private links, the assignment panel) was one.
- **Nine suites tested shapes that changed by decision** (the per-pull board, its tabs, the person page, the old «My KPIs»
  dashboard, the side menu's old names, the old language button). Each was moved to the current place with the same intent.
- Four real faults came out of the work:
  1. **The single-file preview was broken since v8.88.** The planner's in-memory storage is a string holding `</script>`; inlined in
     the preview, it ended the script early («Invalid or unexpected token»). Written `<\/script>` — the same text. Preview 26/26.
  2. **A dialog's ✕ kept the first language** it was opened in; it is now re-labelled on each open (✕ Close / ✕ إغلاق / ✕ بند کریں).
  3. **The manager could show on «Team KPIs» and then vanish**: «me» was known only once «My KPIs» had been built. On the manager
     link «me» is now known from the first moment, by the rule «My KPIs» uses (the one the team file says covers the teams).
  4. **The personal view listed only six open tasks, unsorted** (v8.89), while «My KPIs» always listed every one, newest first.
     All of them now, newest first, six shown and the rest one fold away — on «My KPIs» and in a team row alike.
- One test fault of ours: the extension suite runs the first part of the manager-pull suite, which carried the Arabic-start
  helper — it now borrows that code without it.

## Decision and checks
- The suites keep their intent; where a decision changed the product, the check follows the decision (e.g. «My KPIs» has no
  team list, so the old «my team» checks now assert it is absent). Retired earlier: src, card (ADR-0072).
- One-to-ones: the separate export removed in v8.89 was a second way to do what the full backup does — now proven: the backup
  restored on a new device brings Suzan's goals back (8 / 10).
- **Open question to the manager:** the old board had an «R&D» column (done tasks from the R&D queue); ADR-0070 left it out and it
  is shown nowhere now.
- Full run: 57 of 57 local suites clean, mail 17/17 alone, the extension 11/11, the layout sweep with no problem.
