# ADR-0042 — «اعرض كـ»: the manager views one person's page as they see it

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-01 |
| **Version** | v8.57 |

## Decision
- On the manager link, «مؤشراتي» carries a picker: choose a team member and the page is drawn for them from the manager's own pulls,
  through the same validator the bookmark uses (`upgradeMe`), with `own` set for that person. Team leaders get their team view.
- Read only: a sticky banner names the person and the data date; the manager's update and setup, bookmark, projects card, meeting
  export/import and meeting blocks are hidden; dragging is off, so the manager's own layout never changes.
- The real profile is put aside and restored. Leaving «مؤشراتي», an import from the bookmark, or a backup restore ends the view first;
  the full backup always saves the real profile.
- What only the person's own device holds (private links, their own mail reading) cannot appear, and the banner says so.
- Not on the team link.
