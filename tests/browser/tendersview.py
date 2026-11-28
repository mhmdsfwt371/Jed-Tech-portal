# ADR-0156: the tender register Safwoot publishes, read-only, for anyone with the link. The site is laid out as on GitHub:
# the portal in /Jed-Tech-portal/ and the sealed file in a sibling folder /jed-tenders/. Sealing is done by the same function
# Safwoot uses (tenders-view-core.js, run with node). Made-up tenders only.
import threading, http.server, socketserver, functools, os, sys, json, pathlib, tempfile, subprocess, shutil
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]; PORT = int(os.environ.get('PORT', '9481'))
AXE = os.environ.get('AXE_JS') or str(ROOT / 'node_modules' / 'axe-core' / 'axe.min.js')
SITE = pathlib.Path(tempfile.mkdtemp()); (SITE / 'Jed-Tech-portal').symlink_to(ROOT); DATA = SITE / 'jed-tenders'; DATA.mkdir()
fails = []
import re
clean = lambda s: re.sub('[\u2066-\u2069]', '', s)   # the page isolates dates and numbers inside sentences; the checks read the words
def check(n, c, d=''):
    print(('PASS  ' if c else '**FAIL** ') + n + ('' if c else f'  -> {d}'))
    if not c: fails.append(n)

def seal(view, key_b64, dest):
    src = json.dumps(view, ensure_ascii=False)
    code = ("import {sealView,b64urlDecode} from '" + (ROOT / 'tenders-view-core.js').as_uri() + "';"
            "import {readFileSync,writeFileSync} from 'node:fs';"
            "const v=JSON.parse(readFileSync(0,'utf8'));writeFileSync(process.argv[1],await sealView(v,b64urlDecode(process.argv[2])));")
    subprocess.run(['node', '--input-type=module', '-e', code, str(dest), key_b64], input=src.encode(), check=True)
def new_key():
    return subprocess.run(['node', '--input-type=module', '-e', "import {newViewKey} from '" + (ROOT / 'tenders-view-core.js').as_uri() + "';console.log(newViewKey())"], capture_output=True, text=True, check=True).stdout.strip()

def sample(title='سجل مناقصات فرع جدة (بيانات تجريبية)'):
    return {'schema': 'afaqy-tenders-view/v1', 'app': 'Safwoot 2.15.0', 'publishedAt': '2026-11-28 09:30', 'title': title, 'tenders': [
        {'ref': '261100000101', 'title': 'منافسة شبكة تجريبية', 'entity': 'جهة تجريبية', 'status': 'قيد الدراسة', 'stage': 'working',
         'dates': {'inquiries': '2099-12-13', 'submit': '2099-12-22 10:00', 'opening': '', 'examination': '', 'award': ''},
         'decision': {'verdict': 'go', 'reason': 'سبب تجريبي للقرار', 'at': '2026-11-24 03:10'}, 'summary': 'خلاصة تجريبية للمنافسة',
         'etimad': {'checkedAt': '2026-11-28 09:00', 'source': 'workbook', 'diffs': [{'field': 'submit', 'ours': '2099-12-22 10:00', 'etimad': '2099-12-23 10:00'}]},
         'files': [{'name': 'كراسة الشروط والمواصفات.pdf', 'at': '2026-11-23 19:33'}],
         'timeline': [{'at': '2026-11-23 19:33', 'who': 'زميل تجريبي', 'mine': False, 'kind': 'mail', 'text': 'كراسة المنافسة مرفقة'},
                      {'at': '2026-11-24 02:00', 'who': 'المدير', 'mine': True, 'kind': 'mail', 'text': 'رسالة تجريبية من المدير'}],
         'changes': [{'at': '2026-11-26 10:02', 'field': 'submit', 'old': '', 'new': '2099-12-22 10:00', 'source': 'ملف اعتماد'}], 'updatedAt': '2026-11-28 09:00'},
        {'ref': '261100000102', 'title': '<img src=x onerror="window.__xss=1">عنوان فيه وسم', 'entity': 'جهة', 'stage': 'submitted',
         'dates': {'inquiries': '2026-11-01', 'submit': '2099-11-30', 'opening': '', 'examination': '', 'award': ''}, 'updatedAt': '2026-11-27 12:00'},
        {'ref': '261100000103', 'title': 'منافسة تجريبية لن نتقدم لها', 'entity': 'جهة', 'stage': 'declined', 'decision': {'verdict': 'no-go', 'reason': 'سبب تجريبي'},
         'dates': {'inquiries': '', 'submit': '2026-12-01', 'opening': '', 'examination': '', 'award': ''}, 'updatedAt': '2026-11-24 10:00'}]}

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def end_headers(self): self.send_header('Cache-Control', 'no-cache'); super().end_headers()
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.ThreadingTCPServer(('127.0.0.1', PORT), functools.partial(Q, directory=str(SITE))); threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{PORT}/Jed-Tech-portal/tenders-view.html'
KEY = new_key(); seal(sample(), KEY, DATA / 'tenders.afqv')

with sync_playwright() as p:
    b = p.chromium.launch()
    c = b.new_context(viewport={'width': 1280, 'height': 900}); pg = c.new_page(); errs = []; urls = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:160])); pg.on('request', lambda r: urls.append(r.url))
    # the portal first, so its service worker is in place as on a team member's laptop
    pg.goto(f'http://127.0.0.1:{PORT}/Jed-Tech-portal/'); pg.wait_for_timeout(1500)
    pg.goto(f'{BASE}#k={KEY}&r=jed-tenders'); pg.wait_for_selector('#list .item', timeout=8000)
    check('T1 the published register opens with the key in the link: title, time, the four counts',
          'بيانات تجريبية' in pg.inner_text('#title') and '2026-11-28 09:30' in clean(pg.inner_text('#stamp')) and pg.locator('.tile').count() == 4,
          (pg.inner_text('#title'), pg.inner_text('#stamp')))
    txt = clean(pg.inner_text('#list'))
    check('T2 «In progress» shows the running tender with its next date, how far it is, and the decision',
          'منافسة شبكة تجريبية' in txt and 'آخر موعد للاستفسارات: 2099-12-13' in txt and 'القرار: الدخول' in txt, txt[:300])
    check('T3 a tag inside a title is shown as text, never run', not pg.evaluate('window.__xss') and pg.locator('#list img').count() == 0)
    pg.click('#tabs button:nth-child(2)'); pg.wait_for_timeout(200)
    check('T3b the title with a tag sits in «Offer submitted», written out as text', '<img src=x' in pg.inner_text('#list') and pg.evaluate('!window.__xss'))
    pg.click('#tabs button:nth-child(3)'); pg.wait_for_timeout(200)
    check('T4 the archive holds the declined tender', 'لن نتقدم لها' in pg.inner_text('#list') and 'القرار: عدم الدخول' in pg.inner_text('#list'))
    pg.click('#tabs button:nth-child(1)'); pg.fill('#search', 'شبكة'); pg.wait_for_timeout(200)
    check('T5 search by name keeps the match', pg.locator('#list .item').count() == 1)
    pg.fill('#search', 'لا يوجد شيء بهذا الاسم'); pg.wait_for_timeout(200)
    check('T5b a search with no match says so', 'لا توجد نتيجة' in pg.inner_text('#list'))
    pg.fill('#search', ''); pg.wait_for_timeout(200)
    pg.click('#list .item'); pg.wait_for_timeout(300)
    body = clean(pg.inner_text('#card-body'))
    check('T6 the tender opens in a window: dates, the Etimad check with its difference, decision, summary',
          pg.evaluate("document.getElementById('card').open") and '2099-12-22 10:00' in body and 'يختلف 1' in body and '2099-12-23 10:00' in body
          and 'سبب تجريبي للقرار' in body and 'خلاصة تجريبية' in body, body[:400])
    check('T6b the history, files and change log are folded with their counts, and focus is on «Close»',
          'تسلسل الأحداث (2)' in body and 'الملفات (1)' in body and 'سجل التغييرات (1)' in body and pg.evaluate("document.activeElement.id") == 'card-close', body[-300:])
    pg.click('#card-body details:first-of-type summary'); pg.wait_for_timeout(150)
    check('T6c the history reads oldest first, with who and when, the manager\'s own mail marked',
          'زميل تجريبي' in pg.inner_text('#card-body') and pg.locator('#card-body li.mine').count() == 1)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    check('T7 Escape closes the window', not pg.evaluate("document.getElementById('card').open"))
    pg.click('#list .item'); pg.wait_for_timeout(200); pg.click('#card-close'); pg.wait_for_timeout(200)
    check('T7b the × closes it too', not pg.evaluate("document.getElementById('card').open"))
    # publish twice, see the second: a new copy, same link, with the page already open (and the portal's service worker running)
    v2 = sample('سجل محدَّث (بيانات تجريبية)'); v2['tenders'].append({'ref': '261100000104', 'title': 'منافسة جديدة وصلت (تجريبية)', 'stage': 'new', 'dates': {'submit': '2099-12-30'}})
    seal(v2, KEY, DATA / 'tenders.afqv'); pg.click('#refresh'); pg.wait_for_timeout(800)
    check('T8 publish twice, see the second: «Refresh» shows the new copy, not a kept one',
          'سجل محدَّث' in pg.inner_text('#title') and 'منافسة جديدة وصلت' in pg.inner_text('#list'), pg.inner_text('#title'))
    check('T9 the key never leaves the page: no request carries it, and every request stays on this address',
          not any(KEY in u for u in urls) and all(u.startswith(f'http://127.0.0.1:{PORT}/') for u in urls), [u for u in urls if KEY in u or not u.startswith(f'http://127.0.0.1:{PORT}/')][:3])
    for L, word, d in [('en', 'In progress', 'ltr'), ('ur', 'جاری', 'rtl'), ('ar', 'جارية', 'rtl')]:
        pg.select_option('#language', L); pg.wait_for_timeout(250)
        check(f'T10 {L}: the page speaks it, in its direction', word in pg.inner_text('#tabs') and pg.evaluate('document.dir') == d, pg.inner_text('#tabs'))
    check('T11 no page error', not errs, errs[:3])
    # the refusals, each with its own words
    for name, link, want in [('the wrong key', f'#k={new_key()}&r=jed-tenders', 'لا يفتح النسخة المنشورة'), ('no key', '#r=jed-tenders', 'لا يحمل مفتاح'),
                             ('a cut key', f'#k={KEY[:20]}', 'ناقص أو تالف'), ('a folder outside the site', f'#k={KEY}&r=..%2F..%2Fevil', 'غير صالح'),
                             ('a folder with nothing published', f'#k={KEY}&r=empty-folder', 'لا توجد نسخة منشورة')]:
        pg.goto(f'{BASE}{link}'); pg.wait_for_timeout(700)
        check(f'T12 {name}: said plainly, and nothing of the register is shown', want in pg.inner_text('#state') and pg.locator('#board').is_hidden(), pg.inner_text('#state'))
    (DATA / 'tenders.afqv').write_bytes(b'<html>not ours</html>'); pg.goto(f'{BASE}#k={KEY}&r=jed-tenders'); pg.wait_for_timeout(700)
    check('T12b a file that is not a sealed register is refused', 'ليس سجل مناقصات' in pg.inner_text('#state'))
    seal(sample(), KEY, DATA / 'tenders.afqv')
    # both themes: the accessibility scan, and the page's own colours
    if os.path.exists(AXE):
        for mode in ['light', 'dark']:
            cx = b.new_context(viewport={'width': 1280, 'height': 900}, color_scheme=mode, bypass_csp=True); ap = cx.new_page(); ap.goto(f'{BASE}#k={KEY}&r=jed-tenders'); ap.wait_for_selector('#list .item')   # bypass_csp: the scanner is injected as an inline script, which the page's own rules forbid
            ap.add_script_tag(path=AXE)
            res = ap.evaluate("axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}).then(r=>r.violations.map(x=>[x.id,x.nodes.length,x.nodes[0].html.slice(0,90)]))")
            ap.click('#list .item'); ap.wait_for_timeout(300); ap.click('#card-body details:first-of-type summary'); ap.wait_for_timeout(100)
            res2 = ap.evaluate("axe.run(document.getElementById('card'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}).then(r=>r.violations.map(x=>[x.id,x.nodes.length,x.nodes[0].html.slice(0,90)]))")
            check(f'T13 {mode}: no accessibility violation on the list or in the window (WCAG 2.1 A and AA)', not res and not res2, (res[:3], res2[:3]))
            bg = ap.evaluate("getComputedStyle(document.body).backgroundColor")
            check(f'T13b {mode}: the page takes the theme', (bg == 'rgb(14, 21, 29)') == (mode == 'dark'), bg)
            ap.screenshot(path=f'/tmp/tendersview-{mode}.png'); cx.close()
    else: print('NOTE  the accessibility scan was skipped: run npm ci, or set AXE_JS to axe.min.js')
    # a phone
    m = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True); mp = m.new_page(); mp.goto(f'{BASE}#k={KEY}&r=jed-tenders'); mp.wait_for_selector('#list .item')
    wide = mp.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
    mp.screenshot(path='/tmp/tendersview-phone.png')
    mp.tap('#list .item'); mp.wait_for_timeout(300)
    box = mp.evaluate("(()=>{const r=document.getElementById('card').getBoundingClientRect();return [r.left,r.right,innerWidth]})()")
    mp.screenshot(path='/tmp/tendersview-phone-card.png')
    check('T14 a phone: nothing scrolls sideways, and the window fits the screen', not wide and box[0] >= 0 and box[1] <= box[2], (wide, box))
    m.close(); b.close()
srv.shutdown(); shutil.rmtree(SITE, ignore_errors=True)
print(f'{len(fails)} failed' if fails else 'all passed'); sys.exit(1 if fails else 0)
