# ADR-0099 — Mail reads are kept and build up; classification by the sender's own words; search by e-mail; internal aliases

| | |
|---|---|
| **Status** | Accepted (the technical manager, after his first real run — 2.64 GB, 4,082 messages: «search by e-mail to select», «some e-mails don't show — do I register them?», «the sideways scroll is far down», «what happens to this data? I don't want to redo it — keep it and build on it», «the subject says upselling but the engineers only answered technically») |
| **Date** | 2026-11-08 |
| **Version** | v9.18 · extractor 1.0.4 |

## First real figures
His October Inbox (2.64 GB): the extractor read 4,082 messages in 86.6 s, peak memory 110 MB; the browser read the same 4,082
in 15 s, reading 1,427 MB of 2,711 MB.

## Decisions
- **Kept and built on.** A PST read in the browser is saved into the same device store as the extractor's file, with the same
  keys (Internet Message-ID, SHA-1; the same fallback), so a message counts once whichever way it came, and it feeds
  «Email Activity — Manager Inbox». Measured: browser 71 messages, then the extractor's file of the same messages added 0.
- **One sender, two addresses.** The extractor reads the SMTP address; the browser library gives the Exchange address. When the
  same message arrives with both, the two are linked — a confirmed one confirms the other.
- **Classification by the sender's own words.** The top of the body, before the quoted earlier messages (both the browser and
  the extractor cut at «From:», «-----Original Message-----», «من:», «On … wrote:» …, 400 characters). A rule matching those words
  decides; a reply (RE:/FW:/رد:) matching nothing does not inherit its thread's subject; an original message, or one with no body
  read, falls back to the subject. A technical reply under «RE: طلب عرض سعر» is no longer upselling. The words stay on the device.
- **Search** by name or e-mail above the senders, «tick the matches», a count.
- **Internal senders** show their Exchange alias (ex:alias) — nothing to register; the alias identifies the person.
- **The messages table** scrolls in its own box (sticky header), so its sideways bar stays in view; folder names shortened.
- **Import errors named.** A «.part» leftover, an empty file, or another file (with its first characters). The extractor removes
  its «.part» when a run stops before keeping anything. The Windows build now has the portal's own reader check the .exe's output.

## Tests
`tests/mailact.test.mjs` (21) — own words, the technical-reply case, links. `harness/mailkeep.py` (11) — kept, survives a reload,
same keys, alias, search, scroll box, leftover named. `mailfile.py` recomputed independently with libpff in Python (29 = 5+1+1+22;
from 24 Oct 7 = 4+3) and now compares by column name. Extractor 15 tests, on Windows too. Full run 68/68.
