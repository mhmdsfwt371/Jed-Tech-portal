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
    check('M8 no tile says its name twice', not dbl and pg.locator('#view-me .pm-tile').count()>=4, dbl)
    pos=pg.evaluate("(()=>{const o=document.querySelector('#view-me .pm-now'),d=document.querySelector('#view-me .pm-mix');return [o.getBoundingClientRect().top, d.getBoundingClientRect().top, o.getBoundingClientRect().width]})()")
    check('M9 open work comes before the chart, full width', pos[0]<pos[1] and pos[2]>300, pos)
    cut=pg.evaluate("[...document.querySelectorAll('#view-me .pm-legend .pm-lg-l')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.innerText)")
    leg=pg.evaluate("[...document.querySelectorAll('#view-me .pm-legend .pm-lg-l')].map(e=>e.innerText)")
    check(f'M10 the chart\'s labels are readable in full ({leg})', not cut and 'From e-mail' in leg, cut)
    check('M11 «How it is calculated» is folded away until asked for', pg.evaluate("(()=>{const d=document.querySelector('#view-me details.me-defs');return d&&!d.open&&d.querySelectorAll('li').length>3})()"))
    med=pg.evaluate("[...document.querySelectorAll('#view-me .pm-tile .pm-med')].map(e=>[e.dataset.med, e.innerText, e.className])")
    mm={k:(t,c) for k,t,c in med}
    check(f'M14 the four tiles carry the team median, each said as better or worse ({[t for _,t,_ in med]})', set(mm)=={'thru','rate','mttr','pts'} and all(re.search(r'(Above|Below|At|Faster than|Slower than) the team median ', mm[k][0]) for k in ['thru','rate','mttr','pts']), med)
    check('M15 it agrees with his rank: rank 5 of 7 by points is below the median, and marked so', mm['pts'][0].startswith('Below the team median') and ' bad' in mm['pts'][1])
    note=pg.locator('#view-me .pm-med-note').inner_text()
    check(f'M16 a line says what the median is and that no colleague\'s number is shown ({note[:44]}…)', 'middle value among the 7' in note and 'No colleague' in note)
    w2=pg.evaluate("[innerWidth, document.documentElement.scrollWidth]")
    check('M17 the page still fits the phone with the new lines', w2[1]<=w2[0]+2, w2)
    # ADR-0114 — direction D
    now=pg.locator('#view-me .pm-now'); ntxt=now.inner_text(); ages=[int(x) for x in re.findall(r'(\d+) d\b', ntxt)]
    check(f'D1 «needed from you now» comes first, with the count and the date of the data ({pg.locator("#view-me .pm-now-n").inner_text()} open, ages {ages})', pg.locator('#view-me .pm-now-n').inner_text()=='2' and '2026-10-29' in ntxt and pg.evaluate("document.querySelector('#view-me .pm-dash').firstElementChild.classList.contains('pm-d-top')"))
    check('D2 ages are counted to the data\'s last update, not to today (nothing «older than 7 days» here)', 'none older than 7 days' in ntxt and all(a<=7 for a in ages), (ntxt[:120], ages))
    check('D3 the rank sits in «your next step», once on the page', pg.locator('#view-me .pm-next .pg-rank').count()==1 and pg.locator('#view-me .pg-rank').count()==1 and 'Rank 5 of 7' in pg.locator('#view-me .pm-next').inner_text())
    bars=pg.evaluate("[...document.querySelectorAll('#view-me .pm-tile')].map(t=>[t.dataset.kpi, !!t.querySelector('.pm-bar i'), !!t.querySelector('.pm-bar u'), t.querySelector('.pm-v').innerText])")
    check(f'D4 four tiles, each with a bar and the median\'s tick, and the numbers settle on the real values ({[b[3] for b in bars]})', [b[0] for b in bars]==['thru','rate','mttr','pts'] and all(b[1] and b[2] for b in bars) and bars[0][3]=='127' and bars[3][3]=='230.5', bars)
    cal=pg.evaluate("[...document.querySelectorAll('#view-me .pm-cal-day')].map(b=>[b.dataset.day, +b.dataset.n, b.disabled, b.classList.contains('off')])")
    check(f'D5 the month is a calendar: 31 days, 10 weekend days, the 2 days after the data marked as not yet ({sum(1 for c in cal if c[3])} weekend, {sum(1 for c in cal if c[2])} future)', len(cal)==31 and sum(1 for c in cal if c[3])==10 and [c[0][-2:] for c in cal if c[2]]==['30','31'], cal[:3])
    best=max(cal, key=lambda c:c[1]); pg.locator(f'#view-me .pm-cal-day[data-day="{best[0]}"]').click(); pg.wait_for_timeout(350)
    det=pg.locator('#view-me .pm-cal-detail'); rows=det.locator('li').count()
    check(f'D6 pressing a day lists what was closed that day ({best[0]}: {best[1]} closed, {rows} listed)', rows==min(best[1],20) and best[1]>0 and pg.locator(f'#view-me .pm-cal-day[data-day="{best[0]}"]').get_attribute('aria-pressed')=='true' and f'{best[1]} closed' in det.inner_text())
    offday=[c for c in cal if c[3] and c[1]==0][0]; pg.locator(f'#view-me .pm-cal-day[data-day="{offday[0]}"]').click(); pg.wait_for_timeout(300)
    check('D7 a weekend day says so, and only one day is selected', 'Weekend.' in det.inner_text() and pg.locator('#view-me .pm-cal-day[aria-pressed="true"]').count()==1)
    summ=pg.locator('#view-me .pm-cal > p.hint').first.inner_text()
    check(f'D8 the summary counts working days with a closure ({summ})', re.search(r'\d+ of 21 working days', summ) is not None)
    check('M12 no page error', not pg.errs, pg.errs[:2])
    pg.screenshot(path='/tmp/me_after.png', full_page=True); c.close()
    c,pg=open_as(b, phone=False); t2=pg.locator('#view-me').inner_text()
    check('M13 on a computer it says «Hover», and the page still has its tiles', 'Hover any tile' in t2 and 'Tap any tile' not in t2 and pg.locator('#view-me .pm-tile').count()>=4)
    pg.evaluate("document.querySelector('.va-exit, #va-exit, [data-va-exit]')?.click()"); pg.wait_for_timeout(300)
    for bt in pg.locator('button:has-text("Exit")').all():
        if bt.is_visible(): bt.click(); break
    pg.wait_for_timeout(900); pg.evaluate("location.hash='#me'"); pg.wait_for_timeout(900)
    check('M18 the manager\'s own page carries no team median (it is for the engineer\'s page)', not pg.evaluate("document.body.classList.contains('viewing-as')") and pg.locator('#view-me .pm-med').count()==0 and pg.locator('#view-me .pm-tile').count()>=6)
    c.close(); b.close()
print(f'\n{"ALL PASS" if not fails else str(len(fails))+" FAIL"}'); sys.exit(1 if fails else 0)
