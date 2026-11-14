# ADR-0121: «Tasks per day» on the control room, from the real October pull. The table's columns add up per day, the numbers equal
# dailyIntake() run in the page on the same tasks, a day opens its own tasks, the late line opens the late list — three languages,
# laptop and phone, no raw key, no sideways scroll.
import threading, http.server, socketserver, functools, os, sys, re, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9298'))
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
READ="""()=>{const b=document.querySelector('#home-body .di-box');if(!b)return null;const se=document.scrollingElement;
  const rows=[...b.querySelectorAll('tbody tr')].map(r=>[...r.cells].map(c=>c.textContent.trim()));const foot=[...b.querySelectorAll('tfoot td')].map(c=>c.textContent.trim());
  return {rows,foot,now:b.querySelector('.di-now b').textContent,page:se.scrollWidth-se.clientWidth,text:b.innerText}}"""
with sync_playwright() as p:
    b=p.chromium.launch()
    for (w,hh,dev) in [(1366,900,'laptop'),(390,844,'phone')]:
        c=b.new_context(viewport={'width':w,'height':hh}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500)
        pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(500); pg.set_input_files('#file-in',OCT); pg.wait_for_timeout(2500)
        for L in ['en','ar','ur']:
            pg.select_option('#lang-select',L); pg.wait_for_timeout(400); pg.evaluate("location.hash='#home'"); pg.wait_for_timeout(1100)
            r=pg.evaluate(READ)
            check(f'D1 {dev} {L}: the section is on the control room with 14 days', r is not None and len(r['rows'])==14, r and len(r['rows']))
            if not r: continue
            num=lambda s: int(s.replace(',','') or 0)
            adds=all(num(x[1])==sum(num(v) for v in [x[2],x[3],x[4],x[6],x[7]]) for x in r['rows'])
            check(f'D2 {dev} {L}: every day adds up — arrived = same day + later + not started + open + cancelled', adds, r['rows'][:3])
            check(f'D3 {dev} {L}: «past the limit» never exceeds «not started»', all(num(x[5])<=num(x[4]) for x in r['rows']), r['rows'][:3])
            raw=[k for k in set(RAW.findall(r['text']))]
            check(f'D4 {dev} {L}: no raw text key, no sideways scroll', not raw and r['page']<=1, (raw,r['page']))
        pg.select_option('#lang-select','en'); pg.wait_for_timeout(300); pg.evaluate("location.hash='#home'"); pg.wait_for_timeout(900)
        r=pg.evaluate(READ); first=r['rows'][0]
        pg.locator('#home-body .di-table tbody tr').first.click(); pg.wait_for_timeout(700)
        m=pg.evaluate("()=>{const d=[...document.querySelectorAll('dialog')].find(x=>x.open);return d?{rows:d.querySelectorAll('tbody tr').length,h:d.innerText.slice(0,200)}:null}")
        check(f'D5 {dev}: clicking a day opens exactly its arrivals ({first[1]})', m and m['rows']==int(first[1]) and first[0].split(' ')[-1].replace('*','').strip() in m['h'], (m,first))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        late=int(re.search(r'past the start limit: (\d+)', r['now']).group(1))
        if late:
            pg.locator('#home-body .di-now').click(); pg.wait_for_timeout(700)
            m=pg.evaluate("()=>{const d=[...document.querySelectorAll('dialog')].find(x=>x.open);return d?d.querySelectorAll('tbody tr').length:null}")
            check(f'D6 {dev}: the late line opens the {late} late tasks', m==late, m); pg.keyboard.press('Escape')
        check(f'D7 {dev}: no page error', not errs, errs[:2]); c.close()
# ADR-0124: start times for the last days — a copy of the October pull where some tasks carry «startedAt»
import json, tempfile, datetime
d=json.load(open(OCT,encoding='utf8')); n_late=0; n_known=0
for i,x in enumerate(d['tasks']):
    c=x.get('createdAt') or ''
    if x.get('state')=='done' and c>='2026-10-26' and c<'2026-10-28':
        t0=datetime.datetime.fromisoformat(c.replace('Z','+00:00')); late=(i%3==0)
        x['startedAt']=(t0+datetime.timedelta(hours=26 if late else 0, minutes=20)).isoformat().replace('+00:00','Z')
F2=os.path.join(tempfile.mkdtemp(),'oct-start.json'); json.dump(d,open(F2,'w',encoding='utf8'),ensure_ascii=False)
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1366,'height':900}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500)
    pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(500); pg.set_input_files('#file-in',F2); pg.wait_for_timeout(2500)
    pg.select_option('#lang-select','en'); pg.evaluate("location.hash='#home'"); pg.wait_for_timeout(1100)
    r=pg.evaluate("""()=>{const b=document.querySelector('#home-body .di-box');const hs=[...b.querySelectorAll('thead th')].map(x=>x.textContent);const k=hs.indexOf('Started after the limit');
      return {k,cells:[...b.querySelectorAll('tbody tr')].map(r=>[r.cells[0].textContent,k>=0?r.cells[k].textContent:'']),foot:k>=0?b.querySelector('tfoot tr').cells[k].textContent:'',note:b.innerText.includes('last 7 days of the pull only')}}""")
    known=[x for x in r['cells'] if '/' in x[1]]
    check('D8 with start times the column «Started after the limit» appears, only on days with a known start, as «late / known»', r['k']>0 and len(known)==2 and all(x[0].split(' ')[-1].replace('*','').strip() in ('2026-10-26','2026-10-27') for x in known) and r['note'], r)
    sums=[tuple(int(v) for v in x[1].split(' / ')) for x in known]
    check('D9 late ≤ known on each day, and the total row adds the days', all(a<=k for a,k in sums) and r['foot']==f"{sum(a for a,_ in sums)} / {sum(k for _,k in sums)}" and sum(a for a,_ in sums)>0, (sums,r['foot']))
    pg.locator('#home-body .di-table tbody tr', has_text='2026-10-26').first.click(); pg.wait_for_timeout(900)
    m=pg.evaluate("()=>{const d=[...document.querySelectorAll('dialog')].find(x=>x.open);return {tiles:[...d.querySelectorAll('.crm-tiles button, .crm-tiles > *')].map(x=>x.innerText.replace(/\\s+/g,' ')).join(' | '),started:[...d.querySelectorAll('tbody td')].some(td=>td.textContent.includes('started '))}}")
    check('D10 the day window has a «Started after the limit» tile and shows each start time', 'Started after the limit' in m['tiles'] and m['started'], m)
    check('D11 no page error', not errs, errs[:2])
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
