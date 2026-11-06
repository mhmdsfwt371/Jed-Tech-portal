# ADR-0079 — «Live bento»: the portal's own look, AFAQY's web type, and motion that answers

| | |
|---|---|
| **Status** | Accepted (the technical manager chose «البنتو الحي» among nine shown directions, then: «نفذ») |
| **Date** | 2026-11-06 |
| **Version** | v8.96 |

## Path to the choice
- A first look drawn from the Team Planner was dropped at once: the portal must not resemble another tool.
- Three original directions (road, Jeddah lattice, control room), then three moving ones (live routes, flowing contours, site pulses);
  «Live routes» was built on the real portal and judged not modern enough.
- A web search on 2026 dashboard design (the move to lighter chrome, denser data, dark-first; glass 2.0) led to three more:
  dark console, liquid glass, live bento. He chose the live bento.

## Decision
- **Colours** (added to the guard's palette, docs/design.md): asphalt #1E2A36 for the menu and the primary buttons, AFAQY green
  #2A7130 / #4CC35A for what is live and for points, signal amber #E0A32E, sea blue #1F4E79; paper #F2F4F7, dark paper #0E151D.
  Light or dark follows the device.
- **Bento** on the summary pages: on «Team KPIs» the total is 2×2 with a bar of its real sources (e-mail · opened himself ·
  assigned by others), points 2×1 with a turning gradient edge (motion only, no number claimed), the average with a ring of the real
  closed share, named «نسبة الإغلاق» with the full sentence on hover; the control room's «done this month» is large. Tables stay tables.
  The bar and the ring are built in renderKpi from the same numbers as the tiles (`splitBar`, `closedRing`), never read from the page.
- **Type**: «Axiforma» is asked for first (Latin and digits) and shows on any device that has AFAQY's brand font installed; Arabic is
  «Cairo», the font afaqy.com itself uses (111 uses in its stylesheet, Axiforma 0), SIL OFL 1.1, 97 KB, covering Arabic, Latin and
  Urdu, bundled and precached. Axiforma has no Arabic and is a paid font: it is embedded only if AFAQY's licensed files and a web
  licence are supplied, because the portal is on a public address.
- **Motion that answers**: pages arrive; a slow aurora in AFAQY's colours behind each page head; sections appear once as they scroll
  into view; table rows arrive in turn; tiles enter in turn, lean a few degrees and light under the pointer; the menu pill slides to
  the open page; buttons press; the chosen pill pops; menu icons nudge. Numbers are final from the first frame (entrance motion,
  never counting). All of it stops when the device asks for reduced motion.

## Tests
Full run 59/59, extension 11, layout sweep clear. The mobile suite caught the ring caption at 11.8 px — set to 12 px. `mod.py` M8 and
`shell.py` R1/R4/R11/R12 now check the approved colours; R4 is stricter: the sliding marker sits on the current link within 1 px and
carries the green dot.
