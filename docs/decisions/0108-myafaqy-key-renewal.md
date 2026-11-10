# ADR-0108 — The MyAFAQY pulls wait for a valid key and renew on a rejection

| | |
|---|---|
| **Status** | Accepted (the technical manager: «Could not load: Security/GetAllHierarchyUsersDropDown HTTP 401», on 2026-11-09 and again on 2026-11-10, while signed in) |
| **Date** | 2026-11-10 |
| **Version** | v9.28 · extension 1.0.2 |

## Cause
MyAFAQY's key lives 8 hours and is renewed in the same place (`localStorage.token`) a moment after the page opens. The extension pulls
at most every 12 hours, so the stored key had nearly always expired; the pull read it before MyAFAQY renewed it and was refused (401).
1.0.1 only covered «no key at all». (The technical manager confirmed: F5 keeps him signed in, and the key is renewed every 8 h in the
same place.)

## Decision
- `TOKEN_JS` (core.js), shared by the extension's pull and the team, task-types, assignment and «My KPIs» bookmarks: reads the
  expiry from inside the key; an expired key, or one with under a minute left, waits up to 90 s for MyAFAQY to renew it; every
  MyAFAQY request goes through `fx`, which on a 401 waits up to 60 s for a newer key and retries once; with no renewal the pull stops
  with «Your MyAFAQY session needs renewing: press F5 …», not «HTTP 401».
- The extension (1.0.2) treats an expired key like no key: it waits and starts by itself once the key is valid.
- A bookmark dragged before v9.28 keeps its old code: the release note asks everyone to drag theirs again.

## Tests
`harness/keyrenew.py` (4), with simulated keys and a simulated MyAFAQY server that accepts only the current key: today's case (expired,
renewed 1.5 s later) runs with the new key only and no refusal; a refusal mid-pull retries once with the renewed key; no renewal stops
with the plain message after 60 s; the extension waits and then starts by itself. The guard confirms all four real scripts carry the
wait and the retry and that no MyAFAQY request bypasses it. Confirmation on the real MyAFAQY is the first pull after updating.
