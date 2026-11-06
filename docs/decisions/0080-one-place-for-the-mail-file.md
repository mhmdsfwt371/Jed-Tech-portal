# ADR-0080 — One place for the mail file: the menu, nothing on «Data»

| | |
|---|---|
| **Status** | Accepted (the technical manager, with screenshots: «there is one in the menu and one on the Data page — that is two») |
| **Date** | 2026-11-06 |
| **Version** | v8.97 |

## Finding
The mail file was read in one place only (the «البريد من ملف PST» page), but «Data» carried a card with a button to that page.
To the person using it, that is two places for mail. The KPI column «من الإيميل» is a separate thing: tasks created from a message in
myafaqy's mail module, from the myafaqy pull uploaded on «Data» — not from the Outlook file.

## Decision
The mail card is removed from «Data». The mail page is reached from the menu (البيانات والإعدادات › البريد من ملف PST) only.

## Tests
`harness/pstdata.py` (4): «Data» has no mail card, no mail file input and no link to the mail page; the menu opens it with its title;
the file is read there (71 messages, 6 senders). Full run clean (projfit passed alone after a timing miss under load).
