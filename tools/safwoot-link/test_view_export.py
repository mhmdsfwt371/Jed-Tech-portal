"""Safwoot's register → the view (ADR-0156): messy dates read or reported, stages, limits, and the result opens on the page.
Run: python3 tools/safwoot-link/test_view_export.py"""
import json, pathlib, subprocess, sys
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
from view_export import build_view, norm_date, stage_of

fails = []
def check(name, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + name + ("" if ok else f"  -> {detail}"))
    if not ok: fails.append(name)

check("dates in the forms the Etimad section's file and Excel give", [norm_date(x)[0] for x in (
    "2026-12-22 10:00", "2026-12-22 10:00:00", "2026/12/22", "22/12/2026", "22-12-2026 10:00", "٢٢/١٢/٢٠٢٦", "2026-12-22T10:00", "22/12/2026 2:30 م", "2026-12-22 00:00", "")] ==
      ["2026-12-22 10:00", "2026-12-22 10:00", "2026-12-22", "2026-12-22", "2026-12-22 10:00", "2026-12-22", "2026-12-22 10:00", "2026-12-22 14:30", "2026-12-22", ""])
check("a Hijri date, an impossible date and free text are not guessed", [norm_date(x) for x in ("1448/06/14", "2026-02-30", "بعد أسبوع")] == [("", False)] * 3)
check("stages from the register's own words", [stage_of(x) for x in ("وصلت للدراسة", "قيد الدراسة", "تم إرسال العرض", "لن نتقدم", "تمت الترسية على شركة أخرى", "ألغيت المنافسة", "بانتظار")] ==
      ["new", "working", "submitted", "declined", "awarded", "cancelled", "other"])

rows = [
    {"ref": "261100000101", "title": "مشروع تجريبي", "entity": "جهة", "status": "قيد الدراسة", "inquiries": "13/12/2026", "submit": "2026-12-22 10:00",
     "opening": "1448/06/20", "examination": "", "award": None, "updated": "2026-11-28 09:00:12"},
    {"ref": "261100000101", "title": "نفس الرقم مرة ثانية"},
    {"ref": "ك/ت/7/2099", "title": "منافسة خارج اعتماد", "status": "تم إرسال العرض", "submit": "2026-11-30"},
]
mails = {"261100000101": [
    {"at": "2026-11-24 02:00", "who": "المدير", "mine": True, "subject": "تكليف", "body": "الموزع " * 200, "files": []},
    {"at": "2026-11-23 19:33", "who": "زميل", "mine": False, "subject": "كراسة المنافسة", "body": "مرفق", "files": ["كراسة.pdf", "BOQ.xlsx"]}]}
logs = {"261100000101": [{"field": "submit", "old": "", "new": "2026-12-22 10:00", "source": "ملف اعتماد", "at": "2026-11-26 10:02"}]}
extras = {"261100000101": {"decision": {"verdict": "go", "reason": "في النطاق", "at": "2026-11-24 03:10"}, "summary": "خلاصة",
                           "etimad": {"checkedAt": "2026-11-28 09:00", "source": "workbook", "diffs": []}}}
view, problems = build_view(rows, logs, mails, extras, "2026-11-28 09:30", "سجل تجريبي", "Safwoot 2.15.0")
t0 = view["tenders"][0]
check("the repeated reference is reported, not published twice", len(view["tenders"]) == 2 and ("261100000101", "ref", "missing or repeated") in problems, problems)
check("the Hijri opening date is left empty and reported", t0["dates"]["opening"] == "" and ("261100000101", "opening", "1448/06/20") in problems, problems)
check("the mails are oldest first, the manager's marked, a long mail cut to its gist", [x["who"] for x in t0["timeline"]] == ["زميل", "المدير"] and t0["timeline"][1]["mine"] and len(t0["timeline"][1]["text"]) < 450, t0["timeline"])
check("file names only, with their mail's time", t0["files"] == [{"name": "كراسة.pdf", "at": "2026-11-23 19:33"}, {"name": "BOQ.xlsx", "at": "2026-11-23 19:33"}], t0["files"])
check("the non-Etimad reference is kept as written", view["tenders"][1]["ref"] == "ك/ت/7/2099" and view["tenders"][1]["stage"] == "submitted")

# the result must open on the page: sealed and opened by the same core
code = ("import {sealView,openView,newViewKey,b64urlDecode} from '" + (ROOT / "tenders-view-core.js").as_uri() + "';"
        "import {readFileSync} from 'node:fs';const v=JSON.parse(readFileSync(0,'utf8'));const k=b64urlDecode(newViewKey());"
        "const r=await openView(await sealView(v,k),k);console.log(JSON.stringify({ok:r.ok,reason:r.reason||'',n:r.ok?r.view.tenders.length:0}));")
out = subprocess.run(["node", "--input-type=module", "-e", code], input=json.dumps(view, ensure_ascii=False), capture_output=True, text=True, encoding="utf-8")
res = json.loads(out.stdout or "{}") if out.returncode == 0 else {"error": out.stderr[-300:]}
check("what Safwoot builds is sealed and opened by the page's own core", res.get("ok") is True and res.get("n") == 2, res)
print("test_view_export.py: " + (f"{len(fails)} failed" if fails else "all passed")); sys.exit(1 if fails else 0)
