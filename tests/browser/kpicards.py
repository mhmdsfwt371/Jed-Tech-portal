# ADR-0123: on Team KPIs the old long fold is gone; each section is a card that opens in a window. Every card opens with content,
# in three languages, laptop and phone; no raw key, no page error, no sideways scroll; Escape closes it; the control-room
# «open more than 7 days» item lands on the page with the week's window already open.
import threading, http.server, socketserver, functools, os, sys, re, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9301')); SHOT=os.environ.get('SHOT','')
OCT=os.environ.get('OCT_PULL','/mnt/user-data/uploads/afaqy-tasks-2026-10-01_2026-10-29.json')
if not os.path.exists(OCT): print('SKIP  no pull file (set OCT_PULL)'); sys.exit(0)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
RAW=re.compile(r'(?<![\w./@-])[a-z]{1,10}_[a-z0-9]+(?:_[a-z0-9]+)*(?![\w.@-])')
with sync_playwright() as p:
    b=p.chromium.launch()
    for (w,hh,dev) in [(1366,900,'laptop'),(390,844,'phone')]:
        c=b.new_context(viewport={'width':w,'height':hh}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500)
        pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(500); pg.set_input_files('#file-in',OCT); pg.wait_for_timeout(2500)
        for L in ['en','ar','ur']:
            pg.select_option('#lang-select',L); pg.wait_for_timeout(300); pg.evaluate("location.hash='#kpi'"); pg.wait_for_timeout(1200)
            ids=pg.evaluate("[...document.querySelectorAll('#kpi-body .sec-card')].map(x=>x.dataset.sec)")
            check(f'K1 {dev} {L}: the fold is gone and the sections are cards ({len(ids)})', len(ids)>=5 and not pg.locator('#kpi-body details.km-more').count(), ids)
            bad=[]
            for sid in ids:
                pg.locator(f'#kpi-body .sec-card[data-sec="{sid}"]').click(); pg.wait_for_timeout(700)
                r=pg.evaluate("()=>{const d=document.querySelector('dialog.sec-dlg');const tx=d&&d.open?d.innerText:'';return {open:!!(d&&d.open),len:tx.length,text:tx,page:document.scrollingElement.scrollWidth-document.scrollingElement.clientWidth}}")
                raw=[k for k in set(RAW.findall(r['text'])) if not k.startswith(('afaqy_','vss_','cms_'))]
                if not r['open'] or r['len']<40 or raw or r['page']>1: bad.append((sid,r['open'],r['len'],raw[:3],r['page']))
                if SHOT and dev=='laptop' and L=='ar' and sid=='months': pg.screenshot(path=SHOT)
                pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
                if pg.locator('dialog.sec-dlg[open]').count(): bad.append((sid,'did not close'))
            check(f'K2 {dev} {L}: every card opens its section in a window with content, no raw key, no sideways scroll, and closes', not bad, bad)
        pg.select_option('#lang-select','en'); pg.evaluate("location.hash='#home'"); pg.wait_for_timeout(1000)
        item=pg.locator('#home-body .cr-item.k-old')
        if item.count():
            item.click(); pg.wait_for_timeout(1500)
            r=pg.evaluate("()=>({hash:location.hash,open:!!document.querySelector('dialog.sec-dlg[open]'),txt:(document.querySelector('dialog.sec-dlg[open]')||{}).innerText||''})")
            check(f'K3 {dev}: «open more than 7 days» lands on Team KPIs with the week open', r['hash']=='#kpi' and r['open'] and 'week' in r['txt'].lower(), (r['hash'],r['open'],r['txt'][:80]))
            pg.keyboard.press('Escape')
        check(f'K4 {dev}: no page error', not errs, errs[:2]); c.close()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
