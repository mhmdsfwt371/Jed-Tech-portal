# 0139 — Industrial IoT is a field of work of its own in the market study

Date: 18 November 2026 · Version 9.66 · Builds on ADR-0136 and 0138

## Context
The manager asked for the industrial IoT tenders of 2025 and 2026 — who won each and for how much, and a summary of them all —
and asked whether they were already counted. They were not. «AFAQY's field» (`etimadInScope()`) reads cameras, tracking,
networks, software and the words «sensor», «IoT» and «smart»; SCADA and control systems, meters, tank gauging and environmental
monitoring are not in it. The pull itself already holds every tender (ADR-0136), so nothing new has to be listed — only read.

Measured on his pull of 16 November 2026 (30,396 tenders) with the rule below: 7 tenders in 2025 and 17 in 2026, of which 2 and
4 were already inside AFAQY's field. A looser rule reached about 200, most of it noise («منسوب» also means «staff of»).
Etimad publishes no activity for this field, so the title is the only evidence.

## Decision
- **One pure rule, `etimadIiot(title)`**, returns the line a tender falls in, or nothing: `scada` (SCADA, PLC/DCS/RTU, automatic
  and remote control or monitoring), `meters` (smart, water, electricity, fuel, gas and flow meters), `tanks` (tank and fuel
  level, station automation), `env` (environmental and air-quality monitoring), `energy` (energy management, monitoring of
  pumps and generators, leak detection) and `city` (smart lighting, parking, irrigation, counting, weighbridges).
- **Maintenance and operation stay in** — the manager's choice, including the control systems of the desalination and water
  plants. **Spare parts, consumables, calibration, lab and medical purchases stay out**, and so do look-alike words: «مقياس»
  is not «قياس», «اليدوي» is not «آلي», an agency named after smart cities is not a project.
- **It is a field beside ours, not inside it.** «Market analysis» offers every field, AFAQY's field, industrial IoT, or both
  together (each tender once). AFAQY's own rule, the radar and the register are unchanged.
- **A «Lines» list** splits the tenders shown across the six lines with their count, awards and published value; a line pressed
  shows its tenders. The tender list and its Excel carry the line.
- **Nothing is stored.** The line is read from the title when the study is computed, so pulls kept before this version are
  read the same way and the radar format does not change.
- **The Etimad tool carries the same rule** (v5.2, `iiot_line()`), as two categories — industrial IoT, and AFAQY's field with it
  — so one pull opens the details of both. The two implementations were compared on all 30,396 titles: no disagreement.

## Consequences
- The numbers are small: Etimad carries a couple of dozen such tenders a year. The study says what Etimad published, not the
  size of the industrial market — much of that is bought outside Etimad.
- A title that does not name the technology is not counted. The rule is deliberately narrow; a line is widened by adding a
  phrase to `IIOT_LINES` in the portal and the tool together, with the same test titles in both.
- Winners and values still depend on the details being opened by the tool (ADR-0138 keeps what earlier pulls knew).
