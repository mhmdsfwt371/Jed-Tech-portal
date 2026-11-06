# ADR-0089 — Fields in the portal's colours, softer night text, Arabic phrases that keep their order

| | |
|---|---|
| **Status** | Accepted (the technical manager, with screenshots: «the date is an ugly grey that doesn't match; make it easier on the eye») |
| **Date** | 2026-11-07 |
| **Version** | v9.07 |

## Decision
- Every input, select and date field takes the portal's own field colour (light #FFFFFF; night #1B2836 with a #3A4E62 line), a
  green focus ring, and at night a dark calendar icon (`color-scheme: dark`) — no more browser-grey boxes.
- At night the secondary text is one step lighter (#AEBAC6) for easier reading.
- Arabic phrases inside English and Urdu lines (here «كراسة الشروط») are wrapped in Unicode isolates so their word order holds;
  the screenshot showed «الشروط كراسة».
