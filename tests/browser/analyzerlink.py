# ADR-0137 (v9.64): the Tender Analyzer inside the card. The card hands a tender's documents to the program on this computer and
# takes the study back: nothing to send is said; a program that is not there is said, with the way to open or get it; then the
# real exchange in a real browser with a stand-in program on the program's own address — the files go, the study is followed,
# its files come back and fill the card; a page reloaded in the middle picks the study up again. Three languages, both themes,
# the accessibility scan, and a phone. Made-up tenders only; the stand-in speaks `afaqy-analyzer-link/v1` as link.py does.
import threading, http.server, socketserver, functools, os, sys, json, pathlib, datetime, tempfile, urllib.parse
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9331')); LINK=47615
AXE=os.environ.get('AXE_JS') or os.path.join(ROOT,'node_modules','axe-core','axe.min.js')
SCAN="(async()=>{const d=[...document.querySelectorAll('dialog[open]')].pop(); const r=await axe.run({include:[d]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}); return r.violations.map(x=>[x.id,x.nodes.length,x.nodes[0].html.slice(0,120)]);})()"
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
now=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)+datetime.timedelta(hours=3); day=lambda k: (now+datetime.timedelta(days=k)).strftime('%Y-%m-%d')
SUBJECT='sample: Analyzer tender'
REG={'schema':'afaqy-tenders-from-mail/v1','to':day(0),'tenders':[{'subject':SUBJECT,'received':day(-2),'from_address':'x@example.com','attachments':[],'manual':True}]}
TMP=tempfile.mkdtemp(); P=lambda n: os.path.join(TMP,n)
json.dump(REG,open(P('reg.json'),'w',encoding='utf-8'),ensure_ascii=False)
open(P('كراسة الشروط.txt'),'w',encoding='utf-8').write('كراسة الشروط والمواصفات\nالضمان الابتدائي 1%\n')
open(P('BOQ.csv'),'w',encoding='utf-8').write('م,البند,الكمية\n1,كاميرا,4\n')
STUDY=json.dumps({'schema':'afaqy-tender-study/v1','tool':'Tender Analyzer 3','tenders':[{'subject':SUBJECT,'etimadNo':'261139007777','fees':'500','decision':'go','decisionWhy':'within scope'}]},ensure_ascii=False).encode()
OUTS={'T.tender-study.json':STUDY,'AFAQY_Tender_T_Study_AR.pptx':b'PK deck','AFAQY_Tender_T_Inquiries_AR.docx':b'PK letter'}
# the stand-in program: it answers the portal's page only, keeps what it is sent, «studies» for a few looks, then offers its files
ST={'files':{},'job':None,'state':'waiting','looks':0,'need':3,'origins':[]}
class Prog(http.server.BaseHTTPRequestHandler):
    protocol_version='HTTP/1.1'
    def log_message(self,*a): pass
    def out(self,code,body=b'',ctype='application/json',extra=()):
        o=self.headers.get('Origin') or ''; ST['origins'].append(o)
        data=body if isinstance(body,bytes) else json.dumps(dict(body,schema='afaqy-analyzer-link/v1')).encode()
        self.send_response(code)
        if o==f'http://127.0.0.1:{PORT}': self.send_header('Access-Control-Allow-Origin',o)
        self.send_header('Content-Type',ctype); self.send_header('Content-Length',str(len(data)))
        for k,v in extra: self.send_header(k,v)
        self.end_headers(); self.wfile.write(data)
    def do_OPTIONS(self): self.out(204,b'',extra=(('Access-Control-Allow-Methods','GET, POST, PUT, OPTIONS'),('Access-Control-Allow-Headers','content-type'),('Access-Control-Allow-Private-Network','true')))
    def view(self): return {'job':ST['job'],'state':ST['state'],'stage':1,'progress':0.4 if ST['state']=='running' else 1.0,'message':'reading the booklet' if ST['state']=='running' else '','error':'',
                            'outputs':[{'name':n,'size':len(b)} for n,b in OUTS.items()] if ST['state']=='done' else []}
    def do_GET(self):
        p=urllib.parse.urlsplit(self.path).path
        if p=='/v1/hello': return self.out(200,{'app':'TenderAnalyzer','version':'3.1.0','engine':'local','busy':ST['state']=='running','job':ST['job'] if ST['state']=='running' else None})
        if ST['job'] and p==f"/v1/jobs/{ST['job']}":
            if ST['state']=='running':
                ST['looks']+=1
                if ST['looks']>=ST['need']: ST['state']='done'
            return self.out(200,self.view())
        if ST['job'] and p.startswith(f"/v1/jobs/{ST['job']}/outputs/"):
            n=urllib.parse.unquote(p.rsplit('/',1)[1]); return self.out(200,OUTS[n],'application/octet-stream') if n in OUTS else self.out(404,{'error':'file'})
        self.out(404,{'error':'path'})
    def do_POST(self):
        p=urllib.parse.urlsplit(self.path).path; body=json.loads(self.rfile.read(int(self.headers.get('Content-Length') or 0)) or b'{}')
        if p=='/v1/jobs': ST.update(job=body['id'],state='waiting',files={}); return self.out(200,self.view())
        if ST['job'] and p==f"/v1/jobs/{ST['job']}/start": ST.update(state='running',looks=0); return self.out(200,self.view())
        self.out(404,{'error':'path'})
    def do_PUT(self):
        p=urllib.parse.urlsplit(self.path).path; data=self.rfile.read(int(self.headers.get('Content-Length') or 0))
        ST['files'][urllib.parse.unquote(p.rsplit('/',1)[1])]=data; self.out(200,{'name':'x','size':len(data)})
def start_program():
    s=http.server.ThreadingHTTPServer(('127.0.0.1',LINK),Prog); threading.Thread(target=s.serve_forever,daemon=True).start(); return s
def press(pg, loc, hold=150):   # a person holds a click for about a tenth of a second (the lesson of v9.56)
    for _ in range(20):
        bx=loc.bounding_box(); vh=pg.viewport_size['height']
        if bx and bx['height']>0 and bx['y']>=0 and bx['y']+bx['height']<=vh and loc.evaluate("(n,[x,y])=>{const h=document.elementFromPoint(x,y);return !!h&&(h===n||n.contains(h))}",[bx['x']+bx['width']/2,bx['y']+bx['height']/2]):
            pg.mouse.move(bx['x']+bx['width']/2,bx['y']+bx['height']/2); pg.mouse.down(); pg.wait_for_timeout(hold); pg.mouse.up(); pg.wait_for_timeout(400); return True
        nx=pg.locator('dialog.td-dlg .dlg-pager .dp-next')
        if not nx.count() or nx.is_disabled() or not nx.is_visible():
            loc.scroll_into_view_if_needed(); pg.wait_for_timeout(300); bx=loc.bounding_box()
            if not bx: return False
            pg.mouse.move(bx['x']+bx['width']/2,bx['y']+bx['height']/2); pg.mouse.down(); pg.wait_for_timeout(hold); pg.mouse.up(); pg.wait_for_timeout(400); return True
        nx.click(); pg.wait_for_timeout(350)
    return False
def boot(b, theme='light', vp=(1366,800), lang='en', state=None):
    kw=dict(viewport={'width':vp[0],'height':vp[1]}, service_workers='block', color_scheme=theme)
    if vp[0]<600: kw.update(is_mobile=True, has_touch=True)
    if state: kw['storage_state']=state
    c=b.new_context(**kw); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: d.accept())
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1400); pg.select_option('#lang-select',lang); pg.wait_for_timeout(300); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(700)
    return c,pg,errs
def open_card(pg):
    pg.locator('#tenders-body .pills button').last.click(); pg.wait_for_timeout(300)
    pg.locator('.td-table tr.td-row', has_text='Analyzer tender').locator('.td-subj').click(); pg.wait_for_timeout(900)
def item(pg): return pg.evaluate("async()=>{const r=indexedDB.open('afaqy-portal',1);const db=await new Promise(o=>{r.onsuccess=()=>o(r.result)});const t=await new Promise(o=>{const q=db.transaction('kv').objectStore('kv').get('tenders');q.onsuccess=()=>o(q.result)});const i=t.items.find(x=>x.subject.includes('Analyzer tender'));return {etimadNo:i.etimadNo||'',analyzer:i.analyzer||null,decision:i.studyDecision||'',files:(i.files||[]).map(f=>[f.name,f.kind,f.mailKey||''])}}")
line=lambda pg: pg.locator('dialog.td-dlg .an-line').inner_text().replace('⁨','').replace('⁩','')
def until(pg, f, secs=20):
    for _ in range(int(secs*5)):
        if f(): return True
        pg.wait_for_timeout(200)
    return False
LUM="""(sel)=>{const lum=(c)=>{const v=c.map(x=>x/255).map(x=>x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4);return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]};const rgb=(s)=>{const m=s.match(/[\\d.]+/g).map(Number);return {c:m.slice(0,3),a:m.length>3?m[3]:1}};
  const bg=(n)=>{for(;n;n=n.parentElement){const b=rgb(getComputedStyle(n).backgroundColor);if(b.a>0.99)return b.c}return [255,255,255]};let worst=99,which='';
  for(const n of document.querySelectorAll(sel)){if(!n.textContent.trim()||!n.getClientRects().length)continue;const f=lum(rgb(getComputedStyle(n).color).c),b2=lum(bg(n)),r=(Math.max(f,b2)+0.05)/(Math.min(f,b2)+0.05);if(r<worst){worst=r;which=n.className+' '+n.textContent.slice(0,30)}}return {worst:Math.round(worst*100)/100,which}}"""
with sync_playwright() as p:
    b=p.chromium.launch(); c,pg,errs=boot(b)
    pg.locator('#tenders-body input.td-up-in').set_input_files(P('reg.json')); pg.wait_for_timeout(1400)
    open_card(pg)
    box=pg.locator('dialog.td-dlg .an-box'); start=pg.locator('dialog.td-dlg .td-card-acts .an-start')
    one=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg');return {paged:!!d.querySelector('.dlg-pager:not([hidden]) .dp-next'),fold:d.querySelector('.td-fold-analyzer > summary').textContent,open:d.querySelector('.td-fold-analyzer').open}}")
    check('A1 the card stays one window: the study is a closed fold that says «not studied yet», and one button starts it', box.count()==1 and start.count()==1 and not one['paged'] and not one['open'] and 'not studied yet' in one['fold'], one)
    ok=press(pg, start); pg.wait_for_timeout(600)
    check('A2 a tender with no documents: the held click says what to add, and nothing is sent', ok and 'no tender files' in line(pg), line(pg))
    pg.select_option('dialog.td-dlg .td-file-controls select.td-pick','booklet'); pg.locator('dialog.td-dlg .td-file-controls input[type=file]').first.set_input_files(P('كراسة الشروط.txt')); pg.wait_for_timeout(1800)
    pg.select_option('dialog.td-dlg .td-file-controls select.td-pick','boq'); pg.locator('dialog.td-dlg .td-file-controls input[type=file]').first.set_input_files(P('BOQ.csv')); pg.wait_for_timeout(1800)
    box=pg.locator('dialog.td-dlg .an-box')
    check('A3 with the booklet and the bill of quantities on the card, the button counts two files', '(2 files)' in box.locator('.an-go').inner_text(), box.locator('.an-go').inner_text())
    press(pg, pg.locator('dialog.td-dlg .an-box .an-go'))
    opening=until(pg, lambda: 'Opening it now' in line(pg) or 'not found' in line(pg), 6)
    missing=until(pg, lambda: 'not found on this computer' in line(pg), 45)
    hrefs=[pg.locator('dialog.td-dlg .an-open').get_attribute('href'), pg.locator('dialog.td-dlg .an-get').get_attribute('href')] if missing else []
    check('A4 the program is not on this computer: the card tries to open it, then says so with the way to open or get it', opening and missing and hrefs==['afaqy-tender://open','./tender-analyzer.html#install'] and item(pg)['analyzer'] is None, (line(pg),hrefs))
    prog=start_program()
    press(pg, pg.locator('dialog.td-dlg .an-go'))
    ST['need']=6; ran=until(pg, lambda: 'studying the tender now' in line(pg) and 'reading the booklet' in line(pg), 15); bar=pg.locator('dialog.td-dlg .an-bar').count()
    check('A5 the program is there: the card says the study is running, with what the program is doing', ran and bar==1 and 'reading the booklet' in line(pg), line(pg))
    done=until(pg, lambda: (item(pg)['analyzer'] or {}).get('state')=='done' and 'came back' in line(pg), 30); it=item(pg)
    check('A6 the tender\'s own two documents reached the program, byte for byte', sorted(ST['files'])==['BOQ.csv','كراسة الشروط.txt'] and ST['files']['BOQ.csv']==open(P('BOQ.csv'),'rb').read(), sorted(ST['files']))
    mine=sorted(f[0] for f in it['files'] if f[2].startswith('analyzer:'))
    check('A7 the study\'s files came back onto the card, and the register file filled it', done and mine==sorted(OUTS) and it['etimadNo']=='261139007777' and it['decision']=='go', (line(pg),mine,it['etimadNo']))
    check('A8 every request came from the portal\'s own page', set(ST['origins'])=={f'http://127.0.0.1:{PORT}'}, set(ST['origins']))
    check('A9 no page error on the laptop', not errs, errs[:2])
    # a page reloaded while the program works: the tender remembers, and the reopened card follows the study to its end
    ST['need']=8; pg.wait_for_timeout(2500)   # the card reads the files that just came back; its buttons are held while it does
    tries=0
    for _ in range(3):
        tries+=1; press(pg, pg.locator('dialog.td-dlg .an-go'))
        if until(pg, lambda: (item(pg)['analyzer'] or {}).get('state')=='running', 5): break
    pg.reload(); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(700)
    kept=(item(pg)['analyzer'] or {}).get('state'); open_card(pg)
    again=until(pg, lambda: (item(pg)['analyzer'] or {}).get('state')=='done', 40); n=len([f for f in item(pg)['files'] if f[2].startswith('analyzer:')])
    check('A10 a page reloaded in the middle picks the study up again, and a second study replaces only its own earlier files (one press was enough)', tries==1 and kept=='running' and again and n==3, (tries,kept,again,n))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    state=c.storage_state(indexed_db=True); c.close()
    for theme,lang in [('dark','ar'),('light','ur'),('dark','en'),('light','ar')]:
        c2,q,e2=boot(b,theme,(1366,800),lang,state); open_card(q); press(q, q.locator('dialog.td-dlg .td-fold-analyzer > summary'))
        raw=q.evaluate("()=>/\\ban_[a-z_]+\\b/.test(document.querySelector('dialog.td-dlg .td-fold-analyzer').innerText)"); seen=q.locator('dialog.td-dlg .an-box .an-line').is_visible()
        cr=q.evaluate(LUM,'dialog.td-dlg .td-fold-analyzer > summary, dialog.td-dlg .an-box .an-line, dialog.td-dlg .an-box .hint, dialog.td-dlg .an-box .btn, dialog.td-dlg .an-start')
        check(f'A11[{theme}/{lang}] the Analyzer box has no raw key and every text is readable (at least 4.5 to 1)', seen and not raw and cr['worst']>=4.5, (seen,raw,cr))
        if os.path.exists(AXE): q.add_script_tag(path=AXE); v=q.evaluate(SCAN); check(f'A12[{theme}/{lang}] the accessibility scan passes in the card with the Analyzer box', not v, v[:3])
        check(f'A13[{theme}/{lang}] no page error', not e2, e2[:2]); c2.close()
    c3,ph,e3=boot(b,'light',(390,844),'ar',state); open_card(ph); press(ph, ph.locator('dialog.td-dlg .td-fold-analyzer > summary'))
    fit=ph.evaluate("()=>{const d=document.querySelector('dialog.td-dlg'),x=d.querySelector('.an-box');if(!x)return null;const D=d.getBoundingClientRect();return {page:document.documentElement.scrollWidth>innerWidth+1,over:[x,...x.querySelectorAll('.btn, .an-line, .hint')].filter(n=>{const r=n.getBoundingClientRect();return r.right>D.right+1||r.left<D.left-1}).length,tap:Math.min(...[...x.querySelectorAll('.btn')].map(n=>n.getBoundingClientRect().height))}}")
    check('A14 on a phone the Analyzer box fits and its buttons are large enough to tap', fit and not fit['page'] and fit['over']==0 and fit['tap']>=40, fit)
    check('A15 no page error on the phone', not e3, e3[:2]); c3.close()
    prog.shutdown()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
