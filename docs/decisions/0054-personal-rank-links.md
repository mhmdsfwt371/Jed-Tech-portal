# ADR-0054 — Personal rank links: the manager sends each engineer his own rank

| | |
|---|---|
| **Status** | Accepted (approved by the technical manager); a SharePoint route follows once IT approves file access |
| **Date** | 2026-11-02 |
| **Version** | v8.70 |

## Context
An engineer whose myafaqy access does not show his colleagues' tasks cannot see his rank (ADR-0052). The manager's pull has the whole
team, but the portal is served from a public repository: anything published there is readable by anyone, so ranks cannot be published.

## Decision
- The manager's board (team tab) lists each engineer's rank in his team — same team leader, on duty, the same rule as the engineer's card
  — for this month so far or last month (the first week of a month starts on last month), with the gap, and «انسخ رسالة مركزه» copies a
  ready message with a personal link. The person file has the same button.
- The link carries only that engineer's numbers in the address fragment (`?portal=team#rank=…`: id, month, rank, team size, gap or lead,
  date) — no names, no colleague figures. The portal checks it, stores it on the engineer's device keyed by his id, removes it from the
  address bar at once, and the progress card shows «المركز r من n — من مديرك». A colleague's link does not change his card; a broken link
  is refused. First place in a finished month unlocks the achievement.
- The link is taken at start and whenever only the hash changes on an open portal; on an open portal My KPIs is redrawn (the router
  does not redraw pages).
- Forging a link fools only its holder (nobody else sees that rank). Forwarding a link shows that engineer's rank to whoever opens it, so
  it is sent to him personally.
- Later: once IT approves file access for the Azure app, the manager can keep the ranks in a private SharePoint folder that each engineer
  reads with his company sign-in.
- Tested on separate devices: rank and gap against an independent count, link contents, the restricted engineer before and after, the
  same-tab and new-tab openings, a colleague's link, a broken link.
