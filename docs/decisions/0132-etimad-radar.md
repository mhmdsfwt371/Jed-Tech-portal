# 0132 — The Etimad radar, and Etimad as the source of the platform's dates

Date: 17 November 2026 · Version 9.60 · Adds to ADR-0126 (the analyzer's study), ADR-0131 (the card)

## Context
The manager runs his own Etimad pull tool (Python, public data only, no sign-in). Its first full pull — 30,396 tenders of 2025
and 2026 in a 16-sheet Excel workbook (24 MB): the tenders, the awards with the winners and values, the published offers with
each bidder's price and technical result, the run log. Of the 1,267 open tenders, about two hundred fall within AFAQY's scope.

The same week the WM dash-cam tender's card showed a submission deadline of Thursday 19 November and a booklet fee of 0. Etimad
said Monday 30 November 09:59 and 200 riyals. The wrong date came from the Tender Analyzer's study: the booklet's page 4 reads
«وقت التسليم 16/06/1448 09:30», which is 26 November in the Umm al-Qura calendar; the study wrote 19 November, and the register
took it as the platform's deadline because it had no better source. The booklet itself also differs from the platform (26 vs 30
November) — the platform is where the offer is uploaded, so its date is the one that counts.

## Decision
- **The radar is a file, read on the device.** The register reads the pull tool's Excel workbook (sheets found by name, columns
  by their Arabic header) or the tool's own small file `afaqy-etimad-radar/v1` (`docs/etimad-radar-format.md`). The page makes
  no call to Etimad. It keeps only what concerns AFAQY: tenders within the scope, tenders the register follows, and tenders AFAQY
  bid on — with their awards and offers. The radar lives in the device store under `radar`; a pull adds to it (a newer copy of a
  tender replaces the older one). It is not in the backup: it is rebuilt from the tool's file. What the manager put aside
  (`radarIgnore`) is part of the register and is in the backup.
- **Scope.** The Tender Analyzer's rule the manager approved: IT, IoT, building systems, cameras, networks and software are in,
  with the civil and fibre works a technical project carries; general contracting, finishing and supplies are out
  (`etimadInScope()`: the title first — a clear «out» word wins — then Etimad's main activity). Etimad's region column came empty
  for every tender, so the Western Region is read from the entity and the place (`etimadWest()`).
- **Etimad sets the platform's facts** (`applyEtimad()`): the submission deadline and its hour, the inquiries deadline and its
  hour, the bid opening, and the booklet fee replace what the booklet, the mail or the study said. The replaced value and its
  source are kept (`etimadWas`) and the card says «Corrected by Etimad: … was … (from …)». A value the manager typed is never
  replaced — the import lists it as a difference. A pull older than the one applied changes nothing; the same pull twice writes
  nothing. An empty Etimad number and entity are filled. The tender's Etimad page is kept (`link`, Etimad's own domain only).
- **Linking is exact or asked.** A register row is the Etimad tender with its number (Etimad's reference number, or the entity's
  own tender number) or with the very same title (`radarFind()`). Anything looser is suggested — two shared words and most of
  the shorter title (`radarSuggest()`) — with a «Link them» button, in the radar and on the card.
- **The radar window**: the open tenders within scope, nearest deadline first; filters for scope, the West and the status; a
  search; «Follow it» (a register row made from the Etimad tender, arriving today), «Not ours» (hidden, with a list to bring it
  back), the Etimad page. Four tiles: open within scope, in the West, closing within 7 days, linked to the register. A pull the
  tool marked incomplete is said so.
- **The deadline's source** is written under the deadline tile: the Etimad platform, the analyzer's study of the booklet, the
  email, the tender's file, typed by hand.
- **A Hijri date is checked before it is taken** (`hijriCheck()`): when a study's date comes with a quote that holds a Hijri
  date, the register converts that date itself (Umm al-Qura, through the browser's own calendar) and compares. One reading that
  differs: the converted date is taken and the import says so. Several readings (day and month both under 13) and none matches:
  the date is left out and listed as not read. Text pulled out of a right-to-left PDF comes out of order, so the year is found
  first and clock times and Gregorian dates are set aside.

## Consequences
- The register no longer shows a booklet's or a study's date as the platform deadline once Etimad knows the tender; before
  that, the tile says where the date came from.
- Reading the 24 MB workbook takes about 8 seconds and much memory in the browser; the pull tool's own small file is the
  better way (its update: a period, a category, an incremental sync, and the radar file beside the Excel).
- The radar's competitor data (winners, bidders' prices) stays in the browser and is never committed: the repository is public.
  Test data uses invented names.
