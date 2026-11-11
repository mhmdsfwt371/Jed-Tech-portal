# ADR-0111 — «Monthly readings»: the proposal's readings for any pulled month. October must equal the proposal's workbook (v1.1).
import threading, http.server, socketserver, functools, json, re, os, sys, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9291'))
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
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1440,'height':1000}, service_workers='block', accept_downloads=True); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(f'http://127.0.0.1:{PORT}/#readings'); pg.wait_for_timeout(1200); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    check('R1 with no data the page says to pull first', 'pull' in pg.locator('#readings-body').inner_text().lower())
    pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(600); pg.set_input_files('#file-in',OCT); pg.wait_for_timeout(2200); pg.evaluate("location.hash='#readings'"); pg.wait_for_timeout(1500)
    T={t.get_attribute('data-rd'): t.inner_text().split('\n') for t in pg.locator('.rd-tile').all()}
    want={'arrived':('1,134','98.5% closed'),'generic':('84.9%','963 of 1,134'),'self5':('39.2%','171 of 436'),'mail8':('71.7%','365 of 509'),'dmed':('20.4','target 60 · highest 50.4'),'open':('17','over 7 days: 2')}
    bad={k:(T.get(k),v) for k,v in want.items() if not T.get(k) or T[k][1]!=v[0] or T[k][2]!=v[1]}
    check('R2 October\'s six headline readings equal the proposal\'s workbook (1,134 · 84.9% · 39.2% · 71.7% · 20.4 · 17)', not bad, bad)
    more={r.get_attribute('data-rd'): r.locator('td').first.inner_text() for r in pg.locator('#rd-more tbody tr').all()}
    wm={'accounts':'10','days':'21','types':'19','email':'516','self':'442','others':'176','med_all':'0.77 h','med_email':'1.35 h','med_self':'0.21 h','mail24':'81.1%','mail7d':'2.4%','sys8':'72.5%','dmax':'50.4','attarget':'0 / 10','spread':'8.4×','points':'1,734'}
    bad={k:(more.get(k),v) for k,v in wm.items() if more.get(k)!=v}
    check(f'R3 the other {len(wm)} readings equal the workbook', not bad, bad)
    mem=pg.evaluate("[...document.querySelectorAll('#rd-members tbody tr')].map(r=>[...r.children].map(c=>c.innerText.trim()))")
    pts=[int(r[6]) for r in mem]; sc=[float(r[10]) for r in mem]
    check(f'R4 members: tier points {pts} and automatic scores {sc} equal the workbook', pts==[373,303,207,223,157,111,111,102,97,50] and sc==[60.9,61.8,58.5,57.2,60.8,51.0,54.9,50.9,48.2,42.9], (pts,sc))
    names_on_screen=pg.evaluate("[...document.querySelectorAll('#rd-members tbody th')].map(c=>c.innerText.trim())")
    check('R5 members are numbered by default (no names on screen)', names_on_screen==[f'Member {i+1}' for i in range(10)])
    pg.locator('#rd-names').click(); pg.wait_for_timeout(500)
    named=pg.evaluate("[...document.querySelectorAll('#rd-members tbody tr th')].map(c=>c.innerText.trim())")
    check('R6 «Show names» shows the names and lights up', not named[0].startswith('Member ') and len(named[0])>3 and pg.locator('#rd-names').get_attribute('aria-pressed')=='true'); pg.locator('#rd-names').click(); pg.wait_for_timeout(400)
    ty=pg.evaluate("[...document.querySelectorAll('#rd-types tbody tr')].map(r=>[r.dataset.type,...[...r.children].map(c=>c.innerText.trim())])")
    e=[r for r in ty if r[0]=='email customer activity'][0]
    check(f'R7 types: 19 rows, e-mail activity 518 arrived, tier 2, Dammam 5 points ({e[2]}, tier {e[7]}, {e[10]})', len(ty)==19 and e[2]=='518' and e[7]=='2' and e[8]=='2' and e[10]=='5', e)
    check('R8 only the pulled month is listed — older tasks carried by the pull do not become months', pg.evaluate("[...document.querySelectorAll('#rd-month option')].map(o=>o.value)")==['2026-10'] and pg.locator('#rd-months').count()==0)
    with pg.expect_download() as dl: pg.locator('#rd-xlsx').click()
    name=dl.value.suggested_filename; path='/tmp/'+name; dl.value.save_as(path)
    from openpyxl import load_workbook
    wb=load_workbook(path); r1=wb.worksheets[0]; vals={str(r1.cell(i,1).value): r1.cell(i,2).value for i in range(1,r1.max_row+1)}
    check(f'R9 Excel export: {name}, three sheets, the same figures ({vals.get("Tasks arrived")}, {vals.get("Two generic types (%)")}%)', name=='afaqy-readings-2026-10.xlsx' and wb.sheetnames==['Readings','Types','Members'] and vals.get('Tasks arrived')==1134 and vals.get('Two generic types (%)')==84.9 and wb['Members'].cell(2,1).value=='Member 1' and wb['Members'].max_row==11 and wb['Types'].max_row==20, (wb.sheetnames, vals))
    # a second month: the same pull moved back one month → months compare, each tile shows the month before
    raw=json.load(open(OCT,encoding='utf-8')); raw['range']={'from':'2026-09-01','to':'2026-09-29'}
    for x in raw['tasks']:
        for f in ('createdAt','completedAt'):
            if x.get(f): x[f]=x[f].replace('2026-10-','2026-09-').replace('2026-09-31','2026-09-30')
        x['id']=f"s{x['id']}"
    raw['tasks']=raw['tasks'][:1500]
    pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(500); pg.set_input_files('#file-in', files=[{'name':'afaqy-tasks-2026-09.json','mimeType':'application/json','buffer':json.dumps(raw).encode()}]); pg.wait_for_timeout(2200); pg.evaluate("location.hash='#readings'"); pg.wait_for_timeout(1500)
    ms=pg.evaluate("[...document.querySelectorAll('#rd-month option')].map(o=>o.value)")
    check(f'R10 a second pulled month appears, with a month-by-month table and the month before on each tile ({ms})', ms==['2026-10','2026-09'] and pg.locator('#rd-months tbody tr').count()==2 and pg.locator('.rd-tile .rd-tp').count()==6 and 'September 2026' in pg.locator('.rd-tile .rd-tp').first.inner_text())
    pg.locator('#rd-months tbody tr[data-month="2026-09"] button').click(); pg.wait_for_timeout(600)
    check('R11 pressing a month in the table opens that month', pg.locator('#rd-month').input_value()=='2026-09' and pg.locator('#rd-months tr.on').get_attribute('data-month')=='2026-09')
    for L in ['ar','ur']:
        pg.select_option('#lang-select',L); pg.wait_for_timeout(700); txt=pg.locator('#view-readings').inner_text()
        raw_keys=re.findall(r'\b(?:rd|tier|nav|g|hs)_[a-z0-9_]{2,}\b', txt)
        check(f'R12 {L}: the page is fully translated (no raw keys), six tiles', not raw_keys and pg.locator('.rd-tile').count()==6, raw_keys[:4])
    pg.select_option('#lang-select','en'); pg.wait_for_timeout(500)
    pg.locator('.rd-tile[data-rd=generic]').hover(); pg.wait_for_timeout(500)
    tip=pg.evaluate("(()=>{const t=document.getElementById('tool-tip');return t&&!t.hidden?t.innerText:''})()")
    check(f'R13 a tile explains itself on hover ({tip[:50]}…)', 'Email Customer Activity' in tip)
    pg.locator('.help-q[data-help="g_readings_b"]').click(); pg.wait_for_timeout(300)
    check('R14 the page\'s «?» gives its five steps', pg.locator('#help-steps li').count()==5); pg.keyboard.press('Escape')
    check('R15 no page error', not errs, errs[:3]); c.close()
    t=b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True, service_workers='block'); tp=t.new_page(); tp.goto(f'http://127.0.0.1:{PORT}/?portal=team#readings'); tp.wait_for_timeout(1200)
    check('R16 the engineers\' link cannot open the page and does not list it', tp.evaluate("location.hash")=='#me' and tp.locator('a[data-view=readings]:visible').count()==0)
    mp=t.new_page(); mp.goto(f'http://127.0.0.1:{PORT}/#data'); mp.wait_for_timeout(1000); mp.set_input_files('#file-in',OCT); mp.wait_for_timeout(2200); mp.evaluate("location.hash='#readings'"); mp.wait_for_timeout(1300)
    check('R17 on a phone the page has no sideways scroll and one tile per row', not mp.evaluate("document.documentElement.scrollWidth>innerWidth+2") and mp.evaluate("new Set([...document.querySelectorAll('.rd-tile')].map(t=>Math.round(t.getBoundingClientRect().left))).size")==1)
    b.close()
print(f'\n{"ALL PASS" if not fails else str(len(fails))+" FAIL"}'); sys.exit(1 if fails else 0)
