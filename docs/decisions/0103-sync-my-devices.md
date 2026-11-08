# ADR-0103 — Sync my devices: one encrypted file through the phone's share sheet, merged on arrival

| | |
|---|---|
| **Status** | Accepted (the technical manager: «I pulled the data on my laptop and want it on my phone (iOS and Android) without pulling again — a manual sync, or semi-automatic»). Level 2 (OneDrive through an admin-consented Azure app) was proposed and **dropped by him on 2026-11-08** — no IT request; the Outlook direct pull (Mail.Read) is not pursued either. Level 3 (a server such as Firebase) was not recommended: company data at a third party, and against the «no Firebase» decision. |
| **Date** | 2026-11-08 |
| **Version** | v9.23 |

## Decision
- «Data» → «Sync my devices» (a visible card): a passphrase (6 characters or more), «Send to my other device», «Receive from my
  other device», the last send and receipt, and how it is protected.
- The file carries what the backup carries (one builder, `buildBackup`), gzip-compressed, then AES-256-GCM with a key from the
  passphrase (PBKDF2-SHA-256, 310,000 rounds, random salt and IV). Header «AFQS» + version. A month of tasks: 82 KB. The passphrase is
  never stored.
- Send uses the phone's share sheet (AirDrop, Quick Share, WhatsApp, the OneDrive app); where sharing is unavailable the file is saved.
  The receive picker takes any file: iOS greys out an extension it does not know; the header and passphrase decide.
- Restore and sync are one function (`applyBackup`) and now truly merge what used to come back only onto an empty device: tenders
  tender by tender (the further stage wins, empty fields filled from the other copy); mail activity by message key; e-mail owners
  (this device's choice wins a clash); my projects; the register. Settings (weights, team file, profile, rules, planner) stay as each
  device has them.

## Found and fixed while testing
Extracting the backup builder left its download line in place, so «Send» saved an unencrypted backup. The builder now returns the
data; `sync.py` checks the file starts «AFQS» and holds no readable task text.

## Tests
`harness/sync.py` (10): two separate browsers — laptop → empty phone with the same numbers, wrong passphrase refused, phone → laptop
merging a stage move and a new tender without losing or doubling anything, receiving twice changes nothing, a non-sync file named.
Guide: «Sync the laptop and the phone» and «Cards that filter» in three languages. Full run 74/74.
