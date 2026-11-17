# 0133 — The market and the result, from the same Etimad pulls

Date: 17 November 2026 · Version 9.61 · Adds to ADR-0132 (the radar), ADR-0131 (the card)

## Context
The pull tool also reads, for awarded tenders, who won and for how much, and every published offer with its bidder, price and
technical result. In the first pull: 7,129 tenders with a confirmed winner and 35,842 published offers — about five bidders a
tender — and seven offers in AFAQY's own name (three won, two found not technically compliant). The register knew none of it:
a tender's result was typed by hand, and a decision to bid was taken without the prices the same entity had paid before.

## Decision
- **A tender's own result** (`radarResult()`): the published offers ranked by price among the technically compliant ones (when
  any passed), the rest listed after unranked; AFAQY's offer, its rank and its technical result; the winner and the award value.
  Shown on the card in one line, and in full in a new fold, «Market and result».
- **The outcome is offered, never applied** (`tenderOutcome()`): for a tender still open, our name among the winners offers
  «Record it: we won» (the award value fills an empty value); a winner published while our offer is on the list offers «Record
  it: we lost», with the reason written from Etimad's own facts (winner, value, our price, our rank, or «not technically
  compliant»). No winner, our offer not listed, or a closed tender: nothing is offered.
- **The market** (`radarSimilar()`): awarded tenders with two title words in common and half the shorter title, with their
  winner, award value, number of offers and the lowest and highest price; across them the median award, the median number of
  offers and who wins most. For a tender not linked yet, it is read from the register's title.
- **AFAQY's bids on Etimad** (`radarOurBids()`): in the radar window, every tender where AFAQY's name is among the bidders or the
  winners — our price, technical result, rank and the winner. They are AFAQY's, whatever branch made them.
- **The followed tenders go back to the tool**: «Copy the numbers I follow» puts the Etimad reference numbers of the register's
  tenders on the clipboard, for the pull tool's «Refresh the tenders I follow», which reopens only those pages.

## Consequences
- A result comes only from a pull that read the tender's award page; until then the fold says the offers are not published yet.
- Company names are matched as Etimad publishes them; AFAQY is recognised by «أفاقي لتقنية المعلومات» or «AFAQY» only, so a
  company with a similar word («آفاق …») is not taken for us.
