# ADR-0093 — Three mail pulls, each said plainly: what it answers, where it goes in, where it shows

| | |
|---|---|
| **Status** | Accepted (the technical manager: «each one on its own, clear and plain — known where it is uploaded and where its data shows») |
| **Date** | 2026-11-07 |
| **Version** | v9.10 |

## The three
| | Answers | Goes in from | Shows in |
|---|---|---|---|
| **Mail activity (PST)** | who on the team sent how many messages; each message's kind from its subject words (editable categories) | its own page: choose a PST file, tick the people to count from the senders list | that page and its Excel only; not in Team KPIs or points; not kept |
| **Projects from mail** | the projects I worked on (threads I am part of), bid / won / value | My KPIs → My projects → «New pull from mail» or «Import a file», with the projects register | My projects (four views, PDF, Excel) and its card on My KPIs; kept on the device |
| **Tender register** | every tender that arrived (A. Ibrahim or «كراسة الشروط»), its stage, its near dates | its page: instructions for the assistant then file or paste; PST; or by hand | the register and pipeline, control-room alerts, weekly message, and My projects (submitted / decided); kept on the device |

(The direct Outlook connection — Mail.Read through Azure — is a fourth way in, waiting for IT consent.)

## Decision
A strip at the top of each of the three says the four lines above and links to the other two. A tender register alone now opens
«My projects» (the window had its own check that still required mail or a projects register — found by the strip's test).

## Tests
`harness/msrc.py` (5): each strip, its words, the links between the three. `projlink.py` P6: tenders only, the window opens with its
views. `tenders.py` T19 caught the strip's links under 32 px on a phone — fixed. Full run clean.
