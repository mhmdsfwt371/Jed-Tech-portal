# 0136 — «Market analysis»: the whole Etimad pull, read for a period, a field of work and a status

Date: 17 November 2026 · Version 9.63 · Builds on ADR-0132, 0133 and 0135

## Context
ADR-0135 made the Etimad pull a study of the market, made every three or six months. The manager asked what the sheet he sent
had been used for, and asked for a study of all the business AFAQY could enter: for the last quarter, the last six months, a
year (2024, 2025, 2026), which tenders came most, which companies won most, what the awards were worth and which tenders were
the biggest. He asked for everything, not a top ten: a pop-up that shows a dashboard when he filters, the lists themselves, and
an Excel of the lists exactly as he filtered them.

Until now a pull kept only AFAQY's scope, the tenders the register follows and the ones AFAQY bid on (2,774 of 30,396 in his
file). A study of the market cannot be built from that.

## Decision
- **A pull keeps all it holds** (`radarKeep()`), up to 200,000 tenders, with their awards and published offers. Each tender
  still carries `scope` and `west`, so the radar keeps showing our scope by default and the study can narrow to it.
- **One pure function, `marketStats(radar, filter)`**, gives every number and every list for a filter: the period (publication
  day, `marketPeriod()`: the last 3 or 6 months, this year, a year, a quarter of a year, or two days he picks), the field of
  work (every field, or AFAQY's), the Western Region or the Kingdom, the status, words in the title, entity or number, and one
  name pressed in a list (a winner, an entity, an activity or a bidder).
- **Nothing is cut.** The tenders, winning companies, entities, activities, bidders and AFAQY's own bids are complete lists.
  The page shows 200 rows and adds 300 at a press; the Excel holds them all.
- **Money is only what Etimad published.** A win without a published value counts as a win, not as money. The window says how
  many awarded tenders the sums rest on and how many have a known winner — 2026 awards are still mostly unpublished.
- **Excel follows the choice made**: the list shown, or every list (a summary sheet that names the choice, one sheet per list,
  and the months). Numbers stay numbers so they can be summed.
- **The pull still writes nothing into a tender** (ADR-0135). The study reads the pull; the register's data stays the mail's,
  the booklet's and the study's.
- Finding a register tender in a whole pull goes through an index built once per pull (`radarFind()`), and the title words
  used for similar tenders are remembered, so 30,000 tenders stay quick.

## Consequences
- The stored pull is larger (tens of megabytes for a full year); it stays on the device like the rest of the register and is
  not in the backup.
- A window this long is paged like every long window (v9.47); the lists scroll inside it.
- When a later pull adds the awards of 2026, the same window shows them without any change.
