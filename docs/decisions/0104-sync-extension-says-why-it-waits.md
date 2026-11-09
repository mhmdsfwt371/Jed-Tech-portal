# ADR-0104 — The sync extension says why it waits, and starts by itself once signed in

| | |
|---|---|
| **Status** | Accepted (the technical manager: «I pressed "Update now" and it did not pull») |
| **Date** | 2026-11-09 |
| **Version** | v9.24 · extension 1.0.1 |

## What happened
«Update now» leaves a request with the extension and opens MyAFAQY. Extension 1.0.0 had three silent stops:
1. Not signed in to MyAFAQY → it returned with no status, and only looked once, when the tab opened — signing in afterwards
   never started the pull. The most likely cause on 2026-11-09 (last update 2026-11-08 11:58).
2. A pull marked running in the last 10 minutes → any new request ignored, no status.
3. The Data page knew only «pulling», «failed» and «month», so it looked as if nothing happened.

## Decision
- Extension 1.0.1: when a pull is due and MyAFAQY is not signed in, it records «needs sign-in» and checks every 2 s for 5 minutes,
  starting by itself once signed in (then «sign-in timeout»). A running pull is recorded as «busy». The request is heard for 5
  minutes after the tab opens (was 20 s). The portal state carries when the running pull started.
- The Data page has a line for every state (sign in in the tab that opened · running for N min · failed with the reason · no
  sign-in within 5 minutes · invalid request), highlighted when something waits; an extension older than 1.0.1 is named with the
  download and how to replace it.
- The zip keeps its four files under `afaqy-sync-extension/`, no folder entry (as before; `ext.py` X11).

## Tests
`harness/extwait.py` (8): the extension's MyAFAQY script under simulated storage — no sign-in records why and does not run; a token
appearing starts the pull within seconds; a running pull is said; the page shows each state and names an old extension.
`ext.py` 11/11. Full run 74/74.
