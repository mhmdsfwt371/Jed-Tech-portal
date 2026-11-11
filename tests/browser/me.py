# v9.32 — the engineer's own page on a phone, drawn through the manager's «view as» (the same renderer the engineer gets).
import threading, http.server, socketserver, functools, json, os, sys, pathlib, re
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9297'))
OCT=os.environ.get('OCT_PULL','/mnt/user-data/uploads/afaqy-tasks-2026-10-01_2026-10-29.json')
if not os.path.exists(OCT): print('SKIPPED: the real October pull is not here — set OCT_PULL'); sys.exit(0)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
raw=json.load(open(OCT,encoding='utf-8')); team=[x for x in raw['people'] if 'Jeddah After sales Team' in (x.get('teams') or [])]; cnt={}
for t in raw['tasks']: cnt[str(t.get('assigneeId'))]=cnt.get(str(t.get('assigneeId')),0)+1
team.sort(key=lambda x:-cnt.get(str(x['id']),0)); mid=str(team[4]['id'])
def open_as(b, phone=True):
    c=b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True, service_workers='block') if phone else b.new_context(viewport={'width':1440,'height':1000}, service_workers='block')
    pg=c.new_page(); pg.errs=[]; pg.on('pageerror', lambda e: pg.errs.append(str(e)[:150]))
    pg.goto(f'http://127.0.0.1:{PORT}/#data'); pg.wait_for_timeout(1200); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    pg.set_input_files('#file-in',OCT); pg.wait_for_timeout(2300); pg.evaluate("location.hash='#kpi'"); pg.wait_for_timeout(1200)
    pg.evaluate(f"(()=>{{const s=document.getElementById('kpi-viewas'); s.value='{mid}'; s.dispatchEvent(new Event('change',{{bubbles:true}}))}})()"); pg.wait_for_timeout(1300)
    return c, pg
with sync_playwright() as p:
    b=p.chromium.launch(); c,pg=open_as(b)
    check('M1 the page is the engineer\'s, drawn as he sees it', pg.evaluate("location.hash")=='#me' and pg.evaluate("document.body.classList.contains('viewing-as')"))
    w=pg.evaluate("[innerWidth, document.documentElement.scrollWidth]")
    check(f'M2 nothing is wider than the phone screen ({w[1]} of {w[0]})', w[0]==390 and w[1]<=392, w)
    rk=pg.locator('#view-me .pg-rank'); rtxt=rk.inner_text()
    check(f'M3 the rank is of the month on screen, and names it ({" · ".join(rtxt.split(chr(10))[:2])})', rk.get_attribute('data-month')=='2026-10' and 'October 2026' in rtxt and re.search(r'Rank [2-9] of \d', rtxt) is not None, rtxt)
    check('M4 no claim about a month that was never pulled (no «the month before» line)', rk.locator('.delta').count()==0 and 'month before' not in rtxt)
    ach=pg.evaluate("[...document.querySelectorAll('#view-me .pg-ach li, #view-me [class*=ach]')].map(e=>e.innerText).join('|')")
    check('M5 the rank and the achievements agree (not first, and «First place» is not marked done)', 'Rank 1 of' not in rtxt and re.search(r'First place in a month\s*\n?\s*Not yet', pg.locator('#view-me').inner_text()) is not None)
    txt=pg.locator('#view-me').inner_text()
    check('M6 the missing month is said once, in the engineer\'s words (no «Data page», which he does not have)', txt.count('not in your data')==1 and txt.count('was not pulled')==0 and 'Data page' not in txt, (txt.count('not in your data'), 'Data page' in txt))
    check('M7 on a touch screen it says «Tap», not «Hover»', 'Tap any tile' in txt and 'Hover' not in txt)
    dbl=pg.evaluate("[...document.querySelectorAll('#view-me .pm-tile .pm-k')].map(k=>[k.querySelector('b').innerText, (k.querySelector('.pm-term')||{}).innerText||'']).filter(([a,b])=>b&&b.toLowerCase().includes(a.toLowerCase()))")
    check('M8 no tile says its name twice', not dbl and pg.locator('#view-me .pm-tile').count()>=6, dbl)
    pos=pg.evaluate("(()=>{const o=document.querySelector('#view-me .pm-open-card'),d=document.querySelector('#view-me .pm-mix');return [o.getBoundingClientRect().top, d.getBoundingClientRect().top, o.getBoundingClientRect().width]})()")
    check('M9 open work comes before the chart, full width', pos[0]<pos[1] and pos[2]>300, pos)
    cut=pg.evaluate("[...document.querySelectorAll('#view-me .pm-legend .pm-lg-l')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.innerText)")
    leg=pg.evaluate("[...document.querySelectorAll('#view-me .pm-legend .pm-lg-l')].map(e=>e.innerText)")
    check(f'M10 the chart\'s labels are readable in full ({leg})', not cut and 'From e-mail' in leg, cut)
    check('M11 «How it is calculated» is folded away until asked for', pg.evaluate("(()=>{const d=document.querySelector('#view-me details.me-defs');return d&&!d.open&&d.querySelectorAll('li').length>3})()"))
    check('M12 no page error', not pg.errs, pg.errs[:2])
    pg.screenshot(path='/tmp/me_after.png', full_page=True); c.close()
    c,pg=open_as(b, phone=False); t2=pg.locator('#view-me').inner_text()
    check('M13 on a computer it says «Hover», and the page still has its six tiles', 'Hover any tile' in t2 and 'Tap any tile' not in t2 and pg.locator('#view-me .pm-tile').count()>=6)
    c.close(); b.close()
print(f'\n{"ALL PASS" if not fails else str(len(fails))+" FAIL"}'); sys.exit(1 if fails else 0)
