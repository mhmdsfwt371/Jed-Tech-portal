# 0151 — The Tender Analyzer on the user's own subscriptions, and every date read twice

Date: 21 November 2026 · Version 9.84 (portal) and 3.8.0 (Tender Analyzer) · Extends ADR-0137, ADR-0141 and ADR-0142

## Context
On 21 November 2026 a study the portal sent to the Analyzer stood at 0% for many minutes: the free model on the computer read a
scanned booklet page by page with the text reader (6 seconds a page) before any model work. The manager is moving his Claude plan from Max to Pro, so the
$100 of monthly API credits that come with Max (Anthropic's page «API credits for Max, Ultra, and Team plans», which says Pro is
not eligible) will not be there. He has Claude Pro, ChatGPT Plus and Google AI Pro, and his own program Safwoot already drives the three
vendors' command-line tools with those subscriptions. Checked on Anthropic's pages: OAuth (subscription) sign-in is for «ordinary
use of Claude Code»; an end user signing in to the unmodified Claude Code binary with their own subscription is allowed; Pro and
Max limits assume ordinary, individual use and are shared with Claude chat. Google's Gemini API free tier was weighed and not
chosen: its terms say the content is used to improve Google's products, may be read by human reviewers, and that sensitive or
confidential information must not be submitted.

The manager's choices (21 November 2026): the Analyzer stays the tender product and the portal's one door (its link protocol and
outputs are tested end to end); Safwoot stays his general workspace; the Analyzer gains what only Safwoot had — the subscriptions —
as an engine, and a second model checks the dates.

## Decision
- **Engine «subs» in the Analyzer (`subs.py`).** Each round goes to Gemini (`agy`), Claude (`claude -p`) or ChatGPT (`codex exec`),
  each the vendor's own tool, unmodified, signed in with the user's account. Every key that would bill a service account instead
  is removed from the tool's environment; a Claude Code or Codex sign-in that is a paid key is refused. Order: Gemini (largest daily
  allowance, long documents), then Claude, then Codex. A subscription that reports its limit or a lost sign-in is skipped for the
  rest of the study and the next one answers the same round. None left: the study stops with the reason for each, and what was done is kept.
  The documents travel in the prompt; no tool reads or writes the disk (Claude Code runs with no tools; Codex in read-only).
- **A classified file never goes to a subscription**: the same rule as the service key — the study runs on the computer.
- **Every date read twice.** After the study, a second subscription (not the one that answered the study) reads only the pages that
  print dates, without seeing the first reading, for the four dates (askDue, visit, due, openAt). Both readings go through the
  same date reader (Hijri and Gregorian). The study file carries `checks` — `{field: {agree, other, by}}`, optional, so a
  portal before 9.84 ignores it — and the Word study shows both readings in a table.
- **The portal** reads `engine: "subs"` from the program's hello and names it under the button before anything is sent (as ADR-0141 does
  for the cloud and the key); «register and study» may start by itself toward «subs» only when the manager agreed to «subs». Beside
  each date on the card: «✓ Confirmed by a second model», or a red mark with the second reading — the booklet decides; a date typed
  by hand ends the mark (`dateCheckTag()`). The checks are kept on the tender (`dateChecks`, `cleanDateChecks()`).

## Not done, and why
- The tools are not given the PDFs to read themselves: what a CLI reads from the disk cannot be checked here; the text the program
  reads is the same for every engine. Scanned pages are still read on the computer before the study (cached once).
- An interactive study page in the portal is the next step, after a week of real tenders on this engine.

## Tests
Analyzer `tests/test_v38.py` (fails on 3.7.2: no engine): each vendor's tool asked its own way and its answer read (stand-in tools
on the disk); no pay-per-use key reaches a tool; a spent subscription skipped, the next answers the same round; none left stops
with why; a paid sign-in refused; a whole study on the subscriptions with nothing to paste and no cost counted; Gemini spent
halfway and Claude finishing; a classified file never sent; the dates read twice — one confirmed, one differing — in the
portal file and the Word study. Portal `tests/core.test.mjs` «v9.84» (fails on 9.83) and `tests/browser/tenderstudy.py` S8–S10:
the hello, the note, the automatic start, the checks kept, the tags on the card in green and red, gone once typed by hand, kept
after reopening.
