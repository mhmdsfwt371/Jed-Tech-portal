# ADR-0109 — The Outlook box and its Microsoft sign-in are removed; the publishing workflows move to Node 24 actions

| | |
|---|---|
| **Status** | Accepted (the technical manager: «كمل» on the review list, of which this was item 2; the IT route was dropped on 2026-11-08) |
| **Date** | 2026-11-10 |
| **Version** | v9.29 |

## Outlook box (supersedes ADR-0029's sign-in)
The box on the mail page asked for an Azure application (client) ID and tenant ID and signed in to Microsoft to read the manager's inbox.
It needed IT's admin consent, which was dropped on 2026-11-08, so it could never work. Removed: the box, the Microsoft sign-in and
mailbox read, the sign-in return at start-up, the three imports only it used, and its 24 texts in three languages.
Kept: the stored rows and their place in the backup and in sync, so an old backup still restores cleanly. Mail comes from a PST file
(ADR-0095). The guard's check 26 now fails if the app, core or page contacts Microsoft or asks for a mail scope.

## Workflows
GitHub warned that Node 20 actions are deprecated. Moved to the latest majors, each declaring Node 24 (or composite): checkout v7,
setup-node v7, setup-python v7, upload-artifact v7, upload-pages-artifact v5, deploy-pages v5 — in pages, verify and extractor.

## Tests
`harness/outlookgone.py` (7): an old backup carrying Outlook rows restores without error and keeps them; in three languages no Outlook
box, no Azure fields, no raw keys, no page error and no request to Microsoft. `monthly.py` M12b now expects no box; `mail.py` retired.
The three workflows are proven by the publish (pages, verify) and a manual extractor run (builds and tests, releases nothing).
