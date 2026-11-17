# Vendored libraries

| File | Version | Source | SHA-256 | Licence |
|---|---|---|---|---|
| `xlsx.full.min.js` | SheetJS Community Edition 0.20.3 | https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js | `cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41` | Apache-2.0 |
| `pst-extractor.min.js` | see ADR-0097 | bundled from the `pst-extractor` package | — | MIT |

Why local (ADR-0106): 0.18.5 — the last version on npm and cdnjs — carries CVE-2023-30533 (prototype pollution, fixed in 0.19.3)
and CVE-2024-22363 (ReDoS, fixed in 0.20.2). Newer versions are published only on cdn.sheetjs.com. Served from the portal's own
address, the library works offline and the portal makes no request to a third party at run time.

- tender-mail.min.js bundles PostalMime, MSGReader and the attachment classifier from the standalone Tender Register. It is loaded locally on the first Outlook import. Third-party license texts are in tender-mail-LICENSE.txt.
  Patched in this repository for v9.57 (ADR-0130): `parse()` also returns `sentAt` (the message's sent instant, ISO; the delivery time when there is none) and `senderName` (the writer's display name), for the correspondence timeline. The change is four additions inside the bundle's own `ds`, `ic` and `nc` functions; nothing else differs from the bundle of v9.38.

- `pdf.min.mjs`: PDF.js 6.5.438 (legacy build); SHA-256 `522ad2c83bc8a0010e7f0cc60d0892b77c8d2bf2c9702dc12288311d94270f42`. Local document extraction only.

- `pdf.worker.min.mjs`: PDF.js 6.5.438 (legacy build); SHA-256 `b4c8353ded0d88d2e2009574a29eb4e0c3ff7e942ecdf51ef5f71566a9667f31`. Local document extraction only.

- `fflate.mjs`: fflate 0.8.3; SHA-256 `b7ca4450b19559a1d50eb381adcee94b82449674be4cd17789d9beba7e6122a1`. Local document extraction only.

PDF.js text resources are in `cmaps`, `standard_fonts` and `wasm` with the upstream licenses. No CDN requests. Library licenses are included beside the bundles.
