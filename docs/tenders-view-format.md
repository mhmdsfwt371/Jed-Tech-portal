# `afaqy-tenders-view/v1` — the tender register as a sealed page anyone with the link can read

Safwoot (the manager's desktop app) is where the tender work is done (ADR-0156). It publishes a read-only copy of its register,
sealed, to a public folder on this site's address; the portal's page `tenders-view.html` opens it with the key carried in the link.
Anyone who has the link sees everything in it. Nobody else can read it, although the sealed file itself is public.

## The link

```
https://mhmdsfwt371.github.io/Jed-Tech-portal/tenders-view.html#k=<key>&r=<folder>
```

| Part | Meaning |
|---|---|
| `k` | The key: 32 random bytes made by Safwoot, written in base64url (43 characters). It never leaves the browser: the part after `#` is not sent to any server, and the page sends it nowhere. |
| `r` | The folder (a sibling repository published on the same address) that holds the sealed file. Letters, digits, `.`, `_`, `-`; default `jed-tenders`. The page only ever reads `../<r>/tenders.afqv`, on its own address. |

The page refuses a link without a well-formed key and never reads a file from another address.

## The sealed file `tenders.afqv`

| Bytes | Content |
|---|---|
| 0–3 | `AFQV` |
| 4 | `1` (the container version) |
| 5–16 | 12 random bytes, new for every publish (the AES-GCM nonce) |
| 17– | AES-256-GCM of the gzip of the UTF-8 JSON below; the 16-byte tag at the end; additional data = bytes 0–4 |

`sealView()` and `openView()` in `tenders-view-core.js` are the only writer and reader: Safwoot seals with the same function the
page opens with. A file over 8 MB, a wrong key, a cut file or a changed byte is refused, and the page says which.

## The register inside

Built from what Safwoot keeps (2.14): the Etimad section's workbook columns (`tender_register`), the change log (`tender_log`),
and each tender's mails (`tenders.py`).

```json
{
  "schema": "afaqy-tenders-view/v1",
  "app": "Safwoot 2.15.0",
  "publishedAt": "2026-11-28 09:30",
  "title": "سجل مناقصات فرع جدة",
  "tenders": [
    {
      "ref": "261139003142",
      "title": "…", "entity": "…",
      "status": "قيد الدراسة",
      "stage": "working",
      "dates": { "inquiries": "2026-12-13", "submit": "2026-12-22 10:00", "opening": "", "examination": "", "award": "" },
      "decision": { "verdict": "go", "reason": "…", "at": "2026-11-24 03:10" },
      "summary": "…",
      "etimad": { "checkedAt": "2026-11-28 09:00", "source": "workbook", "diffs": [ { "field": "submit", "ours": "…", "etimad": "…" } ] },
      "files": [ { "name": "كراسة الشروط والمواصفات.pdf", "at": "2026-11-23 19:33" } ],
      "timeline": [ { "at": "2026-11-23 19:33", "who": "…", "mine": false, "kind": "mail", "text": "…" } ],
      "changes": [ { "at": "2026-11-26 10:02", "field": "submit", "old": "…", "new": "…", "source": "ملف اعتماد" } ],
      "updatedAt": "2026-11-28 09:00"
    }
  ]
}
```

Rules (`validateView()` holds them; anything else is refused whole, not shown in part)
- Times are the Saudi wall clock: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM`; an empty string means not known. Never a guess.
- `ref` is the tender's reference as found in its mail or files (an Etimad number, or the entity's own number such as
  `ح/م/18/2026` when the tender is not on Etimad). Unique in the file.
- `status` is the register's own words. `stage` is one of `new` (وصلت للدراسة), `working` (قيد الدراسة), `submitted`
  (تم إرسال العرض), `declined` (لن نتقدم), `awarded`, `cancelled`, `other`. `submitted`, `declined`, `awarded` and `cancelled`
  are shown in the archive.
- `decision.verdict` is `go`, `no-go` or `pending`. The reason is the manager's, or a recommendation he accepted.
- `etimad.source` is where the dates were checked: `workbook` (the Etimad section's file), `pull` (the Etimad pull tool's file) or
  `page` (the tender's page on Etimad). `diffs` lists what Etimad says differently; Etimad never overwrites the register (ADR-0135).
- `timeline` is oldest first. `who` is a person's name as written in the mail; `mine` marks the manager's own mails. `kind` is
  `mail`, `note`, `decision`, `study` or `register`. `text` is the mail's subject and its own words in short, not the full mail.
- `changes` is the register's change log with its `source` (ملف اعتماد, الإيميلات, يدوي).
- Text is plain text and is shown as text, never as markup.
- Limits: 2,000 tenders; per tender 500 timeline lines, 500 changes, 200 file names; 20,000 characters per text.

## What is published, and what is not

| In | Out (unless the manager turns it on in Safwoot) |
|---|---|
| Dates, status, stage, the go / no-go decision and its reason, the short study summary | The files themselves (only their names) |
| Each mail's time, writer and short gist; the change log | Prices, hidden costs and offer values |
| The Etimad check and its differences | The full text of mails |

## What the manager should know

- **A forwarded link is a full copy of the access.** Whoever has it reads everything in it, until the key is changed.
- **Changing the key** (Safwoot «New link») stops old links from seeing later updates. A copy already published before the change
  can still be opened with the old link: the site keeps the history of the folder.
- The page shows when the copy was published; it is as fresh as Safwoot's last publish.
