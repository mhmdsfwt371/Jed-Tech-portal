# v9.81 (ADR-0150): little scrolling. Every page of the portal, on a laptop and on a phone: nothing scrolls sideways — a wide table
# folds its end columns into a «+» on each row, the tender stages fit the width, the coming dates are rows of days — and the long
# pages fold into their titles (one part open at a time): the guide, the weights and the Tender Analyzer's own page.
import threading, http.server, socketserver, functools, os, json, tempfile, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9311'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
tmp=tempfile.mkdtemp(); P=lambda n: os.path.join(tmp,n)
json.dump({'schema':'afaqy-tenders-from-mail/v1','to':'2026-11-14','tenders':[{'subject':'منافسة توريد وتركيب كاميرات مراقبة','received':'2026-11-10','from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True}]},open(P('reg.json'),'w'),ensure_ascii=False)
rows=[{'c':str(k),'a':['e1'] if k%2 else ['e1','e2'],'d':k*10,'g':'Large' if k%3==0 else 'Individual & Small','y':[['afaqy.pro','Working']]} for k in range(1,30)]
json.dump({'schema':'afaqy-crm-reports/v1','range':{'from':'2026-11-01','to':'2026-11-14'},'branch':'2','extractedAt':'2026-11-14T12:00:00Z','techPoints':[],'afterSales':{'rows':[]},'activities':{'rows':[]},
           'accounts':{'rows':rows,'unmatched':0,'eng':{'e1':{'en':'Engineer One','ar':'المهندس واحد'},'e2':{'en':'Engineer Two','ar':'المهندس اثنان'}},'systems':{'read':9,'total':9,'complete':True}},'notes':['test']},open(P('mgr.json'),'w'),ensure_ascii=False)
VIEWS='home tools me team dev weights data overtime tenders guide kpi'.split()
# what scrolls sideways on the page now showing: the page itself, and any box inside it that is wider than its room
SIDE="""()=>{const vis=(n)=>{const r=n.getBoundingClientRect();return r.width>1&&r.height>1&&getComputedStyle(n).display!=='none'};
  const box=[...document.querySelectorAll('main *, dialog[open] *')].filter(n=>vis(n)&&n.scrollWidth>n.clientWidth+8&&['auto','scroll'].includes(getComputedStyle(n).overflowX)).map(n=>(n.className&&typeof n.className==='string'?n.className.split(' ')[0]:n.tagName)+' +'+(n.scrollWidth-n.clientWidth)+'px');
  return {page:document.documentElement.scrollWidth-innerWidth, box}}"""
SCREENS="()=>+(document.documentElement.scrollHeight/innerHeight).toFixed(1)"
def boot(b, vp, theme='light', lang='ar'):
    kw=dict(viewport={'width':1366,'height':800}) if vp=='laptop' else dict(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True)
    c=b.new_context(service_workers='block', color_scheme=theme, **kw); pg=c.new_page(); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: d.dismiss())
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_selector('#lang-select'); pg.select_option('#lang-select',lang)
    pg.evaluate("location.hash='#data'"); pg.wait_for_selector('#sample-btn', state='attached'); pg.evaluate("document.getElementById('sample-btn').click()")
    pg.wait_for_function("document.querySelectorAll('#datasets .ds').length>0", timeout=15000); pg.evaluate("location.hash='#data'")
    pg.set_input_files('#file-in',P('mgr.json')); pg.wait_for_timeout(900)
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_selector('#tenders-body input.td-up-in', state='attached'); pg.locator('#tenders-body input.td-up-in').set_input_files(P('reg.json')); pg.wait_for_timeout(900)
    return c,pg,errs
def show(pg, v): pg.evaluate(f"location.hash='#{v}'"); pg.wait_for_timeout(700); pg.evaluate('scrollTo(0,0)')
with sync_playwright() as p:
    b=p.chromium.launch()
    for vp,theme,lang in [('laptop','light','ar'),('phone','dark','ar'),('phone','light','en')]:
        c,pg,errs=boot(b,vp,theme,lang); side={}; tall={}
        for v in VIEWS:
            show(pg,v); r=pg.evaluate(SIDE)
            if r['page']>0 or r['box']: side[v]=r
            tall[v]=pg.evaluate(SCREENS)
        tag=f'{vp} {theme}/{lang}'
        check(f'S1 {tag}: no page and no box on it scrolls sideways', not side, side)
        budget={'laptop':{'guide':3.2,'weights':2},'phone':{'guide':3.2,'weights':2.4}}[vp]
        check(f'S2 {tag}: the guide and the weights fold into their titles ({tall["guide"]} and {tall["weights"]} screens)', all(tall[k]<=x for k,x in budget.items()), (tall, budget))
        if vp=='phone':
            # the day table on the control room: its end columns folded, «+» opens them under the row, label by value; «−» closes
            show(pg,'home'); t=pg.locator('#view-home table.ph-fold').first
            n_hidden=pg.evaluate("()=>document.querySelector('#view-home table.ph-fold thead').querySelectorAll('th.ph-h').length")
            btn=t.locator('.ph-more-btn').first; btn.click(); pg.wait_for_timeout(250)
            det=pg.evaluate("()=>{const d=document.querySelector('#view-home tr.ph-detail');return d?{dt:d.querySelectorAll('dt').length,exp:document.querySelector('#view-home .ph-more-btn[aria-expanded=true]')!==null,label:document.querySelector('#view-home .ph-more-btn').getAttribute('aria-label')}:null}")
            check(f'S3 {tag}: «+» on a folded row opens what the row hid ({n_hidden} columns), each value under its column name', bool(det) and det['dt']==n_hidden and det['exp'] and det['label'] and '_' not in det['label'], (n_hidden,det))
            pg.evaluate("document.body.append(Object.assign(document.createElement('div'),{className:'x-probe'}))"); pg.wait_for_timeout(300)   # something else on the page changes
            still=pg.evaluate("document.querySelectorAll('#view-home tr.ph-detail').length")
            btn.click(); pg.wait_for_timeout(200); gone=pg.evaluate("document.querySelectorAll('#view-home tr.ph-detail').length")
            check(f'S4 {tag}: the opened row stays open while the page changes elsewhere, and «−» closes it', still==1 and gone==0, (still,gone))
        else:
            # the folds: one guide part open at a time; a weights part stays open when the page is redrawn by an edit
            show(pg,'guide'); s=pg.locator('#guide-body details.fold > summary')
            s.nth(0).click(); s.nth(3).click(); pg.wait_for_timeout(200)
            openN=pg.evaluate("[...document.querySelectorAll('#guide-body details.fold')].map((d,i)=>d.open?i:-1).filter(i=>i>=0)")
            check(f'S5 {tag}: the guide opens one part at a time', openN==[3], openN)
            show(pg,'weights'); pg.locator('#weights-body details.fold > summary').first.click(); pg.wait_for_timeout(200)
            first=pg.evaluate("document.querySelector('#weights-body details.fold').dataset.fold")
            pg.select_option('#lang-select','en'); pg.wait_for_timeout(500); pg.select_option('#lang-select',lang); pg.wait_for_timeout(500)   # the page is drawn again
            kept=pg.evaluate("[...document.querySelectorAll('#weights-body details.fold[open]')].map(d=>d.dataset.fold)")
            check(f'S6 {tag}: a weights part stays open when the page is drawn again', kept==[first], (first,kept))
            pg.evaluate("window.dispatchEvent(new Event('beforeprint'))"); allOpen=pg.evaluate("[...document.querySelectorAll('details.fold')].every(d=>d.open)")
            pg.evaluate("window.dispatchEvent(new Event('afterprint'))"); back=pg.evaluate("document.querySelectorAll('#weights-body details.fold[open]').length")
            check(f'S7 {tag}: printing shows every folded part, and the page comes back as it was', allOpen and back==1, (allOpen,back))
        check(f'S8 {tag}: no page error', not errs, errs[:2]); c.close()
    # the Tender Analyzer's page: its parts are titles; a link to one (the tender card links to #install) opens that part only
    for vp,kw in [('laptop',dict(viewport={'width':1366,'height':800})),('phone',dict(viewport={'width':390,'height':844},is_mobile=True))]:
        c=b.new_context(**kw); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{PORT}/tender-analyzer.html'); pg.wait_for_timeout(300)
        sc=pg.evaluate(SCREENS); side=pg.evaluate("document.documentElement.scrollWidth-innerWidth")
        pg.goto(f'http://127.0.0.1:{PORT}/tender-analyzer.html#install'); pg.wait_for_timeout(300)
        op=pg.evaluate("[...document.querySelectorAll('main details[open]')].map(d=>d.parentElement.id)")
        check(f'S9 analyzer page, {vp}: a short page ({sc} screens), nothing sideways, and #install opens that part alone', sc<=3.2 and side<=0 and op==['install'] and not errs, (sc,side,op,errs))
        c.close()
    b.close()
print(f'scrollfit: {"all passed" if not fails else str(len(fails))+" failed"}')
if fails: raise SystemExit(1)
