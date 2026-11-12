# ADR-0115 — Whose device this is on the manager link

| | |
|---|---|
| **Status** | Accepted (the technical manager, 13 Nov 2026: «the team lead's pull still shows him the manager's data») |
| **Date** | 2026-11-13 |
| **Version** | v9.35 · extension 1.0.4 |

## Finding
ADR-0110 made the team pull work for any MyAFAQY account. It did not change who the portal takes the person at the screen to be.
On the manager link five places assumed «the manager named in the team file»: «My KPIs», the «you» mark on the board, the right to
edit weights (two places) and the starting point of the organisation view. A team lead who pulled with his own account therefore saw
the manager's page as his own, and could edit every weight as if he were the manager. The pull recorded nothing about its account.

## Decision
- **A pull names the account that made it.** The team pull reads the user id and user name from MyAFAQY's own session key and writes
  them in the tasks file as `pulledBy`. The key itself is never written. The portal keeps the id only when it is a plain number.
- **The device's owner** is the account whose pull last arrived here **straight from MyAFAQY** — the bookmark's automatic delivery
  or the extension. It is kept on the device only (it is not in the backup and does not travel with sync).
- **A file brought in by hand, restored or synced never changes the owner.** Its row in «Uploaded data» says whose account pulled
  it and, when that is not the owner, offers «This is my account». The person says it himself, once.
- With no named pull yet, the manager in the team file, as before: older data keeps working.
- All five places use the owner. So a lead sees his own page, is marked on the board as himself, starts the organisation view at his
  own people, and has on the Weights page only the rights the editors' list gives him.

## Consequence to know
A person who used the manager link with another account could edit all weights; after his next pull he cannot, unless the editors'
list names him. That is the correction, not a side effect.

## Not done
- The engineers' link is untouched: an engineer's own pull already carried his identity.
- A pull made before v9.35 names no account. It is not guessed from the data.

## Tests
`tests/core.test.mjs`: the pull carries the account and never the key; a clean id is kept, a malformed one dropped, an older file
accepted; a later file without a name does not erase it. `tests/browser/owner.py` (10, real October data): the old behaviour for
unnamed pulls; the account line and the button; a hand-brought file changes nothing; the button makes the device his; his own page;
his own rights on the Weights page; kept after reload; unchanged by later files; the engineers' link untouched. The manager-link suite
runs the real pull end to end and reads the account from the file it saved.
