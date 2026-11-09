# Vendored libraries

| File | Version | Source | SHA-256 | Licence |
|---|---|---|---|---|
| `xlsx.full.min.js` | SheetJS Community Edition 0.20.3 | https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js | `cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41` | Apache-2.0 |
| `pst-extractor.min.js` | see ADR-0097 | bundled from the `pst-extractor` package | — | MIT |

Why local (ADR-0106): 0.18.5 — the last version on npm and cdnjs — carries CVE-2023-30533 (prototype pollution, fixed in 0.19.3)
and CVE-2024-22363 (ReDoS, fixed in 0.20.2). Newer versions are published only on cdn.sheetjs.com. Served from the portal's own
address, the library works offline and the portal makes no request to a third party at run time.
