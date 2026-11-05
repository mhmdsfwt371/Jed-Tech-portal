# ADR-0071 — «Team plans»: the team planner, cut to the manager's own part, kept on his device

| | |
|---|---|
| **Status** | Accepted (the technical manager: «A colleague built this planner; put it in the portal, admin only — or give me a place to upload it and it shows the same way. Only my part: R&D, projects and technical.») |
| **Date** | 2026-11-04 |
| **Version** | v8.88 |

## Findings
- The planner is one HTML file (≈635 KB) holding **seven plans for the whole branch** — sales, operations, finance, the whole
  branch, and three under the technical manager — with each person's **phone, e-mail, ID number, nationality, hire date and photo**.
- Removing plans from its plan list is **not enough**: the file carries a second full copy of the whole-branch plan
  (`REAL_PLAN`, «the last publish», 55 people). Cutting the list alone left 27 e-mails and 34 phones of other departments inside.
- Two people's names differ between plans («OMAR» / «OMAR H»); the e-mail is the same, so matching is by e-mail first.
- The repository is public: a name or e-mail written in the code would be published (the guard refused it).

## Decision
- An admin-only page «Team plans» next to «Team»: upload the file as it came; it is **kept in this browser only** (IndexedDB),
  never published or sent, carried by the device backup, and absent from the team link (menu and address).
- No name in the code: on first upload the manager **picks himself** from the people who lead someone in the file; the choice
  is kept with the file and reused for a newer file while he is still in it.
- `plannerFor(html, owner)` (core): everyone under him in the largest plan, by e-mail then name; a plan is kept only when
  **all** its people are under him; the whole-branch plan is dropped and `REAL_PLAN` becomes his own plan; then the **whole file**
  is searched for the e-mail and phone of everyone left out — **any hit refuses the file** (a newer planner that hides data
  elsewhere is refused, not shown).
- Shown in a **sandboxed frame without the portal's origin**: the planner's scripts cannot reach the portal page, its storage or its
  database. It gets a blank in-memory storage so all its features work while the page is open; edits are not kept (the page says
  so — to update, upload the newer file).

## Tests
`harness/planner.py` (21 checks, real Chromium): a non-planner file is refused and nothing kept; he picks himself; R&D, After-Sales
and Technical & Projects are shown, 20 people; none of the 32 people outside his part has an e-mail or phone anywhere in what is
shown, and the four other plans are gone; from inside the frame the portal page, its real storage (a secret put there is not
seen) and its database are out of reach; the planner draws; it survives a reload; the backup carries it and restores it on another
device with the same cut; a newer file with a buried copy of an outsider is refused with the reason and the kept file stays; the team
link has neither the menu entry nor the page; no raw key in three languages; «remove from this device» removes it for good; no page
error. Independently (Python on the produced file): 0 e-mails, 0 phones, 0 IDs of the 36 people outside.
