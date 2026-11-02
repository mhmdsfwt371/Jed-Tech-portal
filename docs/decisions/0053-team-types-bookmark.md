# ADR-0053 — «أنواع الفرق»: update the task-type list from myafaqy in seconds

| | |
|---|---|
| **Status** | Accepted (approved by the technical manager) |
| **Date** | 2026-11-02 |
| **Version** | v8.69 |

## Context
The list of task types linked to the Jeddah after-sales and R&D teams came only with a full data pull. The portal cannot read myafaqy
by itself — every read runs as a bookmark inside myafaqy with the manager's own sign-in, by design.

## Decision
- A light bookmark, «أنواع الفرق», built from the manager bookmark's own text (myafaqy check, fresh nonce and portal window, request
  helpers, the teams and types reading, the hand-over). It reads only `Teams/GetAllTeams` and `Teams/GetTeamById`, keeps the Jeddah
  teams, and hands the types to the portal's weights page by the same secured hand-over (this tab's nonce, myafaqy's origin, its
  opener, an acknowledgement). The sign-in token never leaves myafaqy.
- The portal validates the list before storing it (`parseTeamTypesTransfer`) and keeps it on the device (`teamtypes`); the weights page
  uses the newer of this list and the latest pull's.
- The weights page shows the list's date and source, «حدّث قائمة الأنواع» with three steps (drag the bookmark once, open myafaqy, press
  it), and names new linked types without a weight; the control room lists them too.
- Guard: the builder joins the bookmark exclusions, and a rule checks it talks only to crmbackend and the portal, reads only the teams,
  and never puts the token in the hand-over.
- Tested end to end against a simulated myafaqy (Jeddah after-sales, Jeddah R&D and a Riyadh team): only team reads with myafaqy's own
  sign-in, only the Jeddah types stored, the new type named, a forged message ignored.
