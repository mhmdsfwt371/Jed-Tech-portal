# ADR-0094 — «نبض الفريق» on the control room; About tells the whole history; one Close per window

| | |
|---|---|
| **Status** | Accepted (the technical manager: «why does it say v5?» and «find something distinctive that adds to the system's look») |
| **Date** | 2026-11-07 |
| **Version** | v9.11 |

## Team pulse
A live trace on the control room: what the team closed each day this month, drawn in as a glowing line, today's point pulsing.
Friday and Saturday are shaded, so a dip explains itself. Last month runs beneath as a faint dashed line — only when last month was
pulled whole (the control room's own test, ADR-0059/0087); otherwise no line, «—» in the tooltip, and the legend says why.
Hover shows the day, its closes and last month's same day; a click opens that day's tasks (tiles, a bar per engineer, the list,
Excel). On a phone the trace is taller and its day numbers stay at least 12 px. Reduced motion: drawn at once, no pulse.
The trace adds up to «done this month».

## About: the whole history
«Since v5.0» read as if the portal began there. It did not: versions 1–4 ran on Firebase (sign-in, a ticket desk, a PRO bridge);
the work began in September 2026; at v5.0 (2026-10-29) the portal was rebuilt as a static GitHub page and the repository's
version history starts there. About now says both: «work started: September 2026 — versions 1 to 4 on Firebase» and «current build
since: v5.0 — 2026-10-29»; the version count is labelled «since the current build».

## One Close per window
Every dialog gets a top Close bar from the portal; About, the number windows and the paste window also carried a bottom Close.
The bottom ones are gone.

## Tests
`harness/pulse.py` (8): the trace and its point; it adds up to «done this month» (1080); no comparison with unpulled September;
a day click opens as many tasks as its tooltip says, one Close; About's history; phone height and day numbers ≥ 12 px. `crm.py`
closes windows with Escape. Full run clean.
