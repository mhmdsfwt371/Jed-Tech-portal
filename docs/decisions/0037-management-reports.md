# ADR-0037 — Management reports: AFAQY-branded PDF and an interactive HTML

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-31 |
| **Version** | v8.41 |

## Decision
- On the KPI board, "Reports for management" uses the period chosen on the board and the people ticked there.
- One engine, two outputs: a PDF (A4 print layout, opened for printing) and a self-contained interactive HTML (logo embedded;
  sort the comparison table by any heading, search to spotlight a person, hover any bar for its value).
- Content is high-level for evaluation: cover; executive summary (totals, highest points, anyone red on load); points per person;
  level distribution; comparison table; then one page per person — level and four axes as a radar, six KPIs, points by task type,
  weekly rhythm, load sustainability and share of the top points, with strongest and weakest axis named.
- Built entirely on the device from data already there; nothing is sent anywhere.
- AFAQY brand colours from the logo (navy #1C1E3D, green #2A7130) join the palette for reports only.
- The links admin page can remember the GitHub key on the manager's device and open by itself; the key is never put in the site.
- Every card list (home tools, dashboard tiles, person cards, month cards, plan cards) can be reordered by drag; each list keeps its
  own order on the device.
