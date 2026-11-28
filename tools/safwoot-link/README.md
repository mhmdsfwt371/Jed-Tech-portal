# Safwoot ↔ portal: the tender register's read-only view (ADR-0156)

What Safwoot takes into its own package. The page side is in the repository root (`tenders-view.*`).

| File | Runs in | Does |
|---|---|---|
| `view_export.py` | Safwoot (Python, standard library) | Its tables → `afaqy-tenders-view/v1`, with the dates it could not read reported |
| `publish.js` | Safwoot's window, beside a copy of `tenders-view-core.js` | Seals the register and writes `tenders.afqv` to the sibling repository (GitHub contents API, the manager's token) |
| `test_view_export.py`, `test_publish.mjs` | here | The exporter's dates, stages and limits; the publisher against a stand-in GitHub; both opened by the page's own core |

Copy `tenders-view-core.js` from the root into Safwoot with every change to it: the same function must seal and open.
