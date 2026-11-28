"""ADR-0156 (portal) — Safwoot's tender register → the read-only view `afaqy-tenders-view/v1` (docs/tenders-view-format.md).

Standard library only, like Safwoot. Takes plain dicts, so the glue in Safwoot maps its tables onto them:
- rows: tender_register rows (ref, title, entity, status, inquiries, submit, opening, examination, award, updated, ...)
- logs: {ref: [tender_log rows: field, old, new, source, at]}
- mails: {ref: [{at, who, mine, subject, body, files: [names]}]} from tenders.py
- extras: {ref: {decision: {verdict, reason, at}, summary, etimad: {checkedAt, source, diffs}}}
Returns (view, problems). A date the register holds in a form that cannot be read for sure is left empty in the view and
reported in problems — never guessed. Text over the format's limits is cut with «…», so one long mail never stops a publish.
"""
import re

DATES = ("inquiries", "submit", "opening", "examination", "award")
STAGES = ("new", "working", "submitted", "declined", "awarded", "cancelled", "other")
LIMIT_TEXT, LIMIT_TIMELINE, LIMIT_CHANGES, LIMIT_FILES = 20000, 500, 500, 200
GIST = 400                    # characters of a mail's own words kept in the view (the full mail stays in Safwoot)
_AR_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")


def _days_in(y, m):
    return [31, 29 if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]


def norm_date(value):
    """'YYYY-MM-DD[ HH:MM]' or '' — and whether the value was understood. Hijri years are not converted here."""
    s = " ".join(str(value or "").translate(_AR_DIGITS).replace("T", " ").split())
    if not s:
        return "", True
    s = re.sub(r"\s*(ص|AM|am)$", " AM", s); s = re.sub(r"\s*(م|PM|pm)$", " PM", s)
    m = re.fullmatch(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?: (\d{1,2}):(\d{2})(?::\d{2})?)?(?: (AM|PM))?", s)
    if m:
        y, mo, d, h, mi, ap = m.groups()
    else:
        m = re.fullmatch(r"(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?: (\d{1,2}):(\d{2})(?::\d{2})?)?(?: (AM|PM))?", s)
        if not m:
            return "", False
        d, mo, y, h, mi, ap = m.groups()
    y, mo, d = int(y), int(mo), int(d)
    if y < 1900 or not 1 <= mo <= 12 or not 1 <= d <= _days_in(y, mo):   # a Hijri year (14xx) lands here: left for the manager
        return "", False
    out = f"{y:04d}-{mo:02d}-{d:02d}"
    if h is not None:
        h, mi = int(h), int(mi)
        if ap == "PM" and h < 12:
            h += 12
        if ap == "AM" and h == 12:
            h = 0
        if h > 23 or mi > 59:
            return "", False
        if (h, mi) != (0, 0):
            out += f" {h:02d}:{mi:02d}"
    return out, True


def stage_of(status):
    """The register's own words → the view's stage. Awards and cancellations first: they close a tender."""
    s = str(status or "")
    if re.search(r"ترسي", s):
        return "awarded"
    if re.search(r"ألغي|الغي|إلغاء|الغاء|ملغا", s):
        return "cancelled"
    if re.search(r"لن نتقدم|لم يتم التقديم|عدم الدخول|اعتذار|اعتذر", s):
        return "declined"
    if re.search(r"تم إرسال العرض|تم ارسال العرض|تم التقديم|قُدِّم|قدم العرض|قدمنا", s):
        return "submitted"
    if re.search(r"قيد الدراسة|جاري|جارية|تحت الدراسة", s):
        return "working"
    if re.search(r"وصلت|جديدة|جديد", s):
        return "new"
    return "other"


def _cut(text, limit):
    t = str(text or "")
    return t if len(t) <= limit else t[: limit - 1] + "…"


def build_view(rows, logs=None, mails=None, extras=None, published_at="", title="", app="Safwoot"):
    logs, mails, extras = logs or {}, mails or {}, extras or {}
    problems, tenders, seen = [], [], set()
    for r in rows:
        ref = str(r.get("ref") or "").strip()
        if not ref or ref in seen:
            problems.append((ref, "ref", "missing or repeated")); continue
        seen.add(ref)
        dates = {}
        for k in DATES:
            v, ok = norm_date(r.get(k))
            dates[k] = v
            if not ok:
                problems.append((ref, k, str(r.get(k))))
        x = extras.get(ref) or {}
        timeline = []
        for m in sorted(mails.get(ref) or [], key=lambda m: str(m.get("at") or "")):
            at, ok = norm_date(m.get("at"))
            if not at:
                continue
            words = " ".join(str(m.get("body") or "").split())
            text = str(m.get("subject") or "").strip() + (" — " + _cut(words, GIST) if words else "")
            timeline.append({"at": at, "who": _cut(m.get("who"), 200), "mine": m.get("mine") is True, "kind": "mail", "text": _cut(text, LIMIT_TEXT)})
        files = []
        for m in mails.get(ref) or []:
            at, _ = norm_date(m.get("at"))
            for name in m.get("files") or []:
                if name and len(files) < LIMIT_FILES:
                    files.append({"name": _cut(name, 300), "at": at})
        changes = []
        for c in sorted(logs.get(ref) or [], key=lambda c: str(c.get("at") or "")):
            at, _ = norm_date(c.get("at"))
            if at:
                changes.append({"at": at, "field": _cut(c.get("field"), 60), "old": _cut(c.get("old"), 2000), "new": _cut(c.get("new"), 2000), "source": _cut(c.get("source"), 60)})
        t = {"ref": _cut(ref, 60), "title": _cut(r.get("title"), 600), "entity": _cut(r.get("entity"), 300), "status": _cut(r.get("status"), 300),
             "stage": r.get("stage") if r.get("stage") in STAGES else stage_of(r.get("status")), "dates": dates,
             "files": files, "timeline": timeline[-LIMIT_TIMELINE:], "changes": changes[-LIMIT_CHANGES:],
             "updatedAt": norm_date(r.get("updated"))[0]}
        if x.get("decision"):
            t["decision"] = x["decision"]
        if x.get("summary"):
            t["summary"] = _cut(x["summary"], LIMIT_TEXT)
        if x.get("etimad"):
            t["etimad"] = x["etimad"]
        tenders.append(t)
    view = {"schema": "afaqy-tenders-view/v1", "app": _cut(app, 60), "publishedAt": norm_date(published_at)[0], "title": _cut(title, 200), "tenders": tenders}
    return view, problems
