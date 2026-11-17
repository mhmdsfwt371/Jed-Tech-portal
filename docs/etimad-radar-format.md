# `afaqy-etimad-radar/v1` — the Etimad pull tool's file for the tender register

The pull tool writes this file beside its Excel workbook. The register's «Etimad radar» reads it (ADR-0132) as a market study,
made every three or six months; it never changes a tender's data, whose reference is its mail files and the study (ADR-0135). It is small because
the tool writes only what was asked for (a period, a category). From v9.63 (ADR-0136) the register keeps all of it — every field of
work, up to 200,000 tenders with their awards and offers — because «Market analysis» studies the whole market; the radar still
shows AFAQY's scope by default.

```json
{
  "schema": "afaqy-etimad-radar/v1",
  "tool": "Etimad Tender Intelligence 5.0",
  "pulledAt": "2026-11-17 08:00",
  "partial": false,
  "filter": { "from": "2026-11-01", "to": "2026-11-17", "category": "تقنية المعلومات" },
  "tenders": [
    { "ref": "261139004629", "no": "126526 / 130720", "title": "WM - توريد وتركيب داش كام", "entity": "…",
      "status": "active", "type": "شراء مباشر", "activity": "تجارة الكماليات", "published": "2026-11-15",
      "askDue": "2026-11-25", "due": "2026-11-30 09:59", "openAt": "", "fees": 200, "place": "", "duration": "60 يوم",
      "link": "https://tenders.etimad.sa/Tender/DetailsForVisitor?STenderId=…", "workStart": "", "firstSeen": "2026-11-15 12:00" }
  ],
  "awards": [ { "ref": "…", "winner": "company name as published", "value": 44620 } ],
  "offers": [ { "ref": "…", "bidder": "company name as published", "price": 58650, "tech": "pass | fail | \"\"" } ]
}
```

Rules
- `ref` is Etimad's reference number (digits; a «REF:» prefix is dropped). `no` is the entity's own tender number as written.
- Times are the Saudi wall clock as Etimad shows them: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM`. 00:00 means no hour.
- `status`: `active`, `awarded`, or anything else (read as «not confirmed»). Arabic values (`نشطة`, `تم إعلان الترسية`) are also read.
- Amounts are numbers in SAR, or `null` when not published. Never estimated.
- `link` is kept only when it is an Etimad page (`https://tenders.etimad.sa/…`).
- `partial: true` when any run behind the file did not finish; the register says so above the list.
- No sign-in data, no personal data. Company names are as Etimad publishes them.

The register also reads the tool's Excel workbook directly: sheets «جميع المنافسات» (or «المنافسات النشطة»), «تفاصيل الترسيات»,
«العروض المنشورة» and «سجل السحب», columns found by their Arabic header.
