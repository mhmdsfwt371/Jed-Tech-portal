# ADR-0132 (v9.60): the Etimad radar. The pull tool's file dropped on the register; Etimad sets the platform's dates on the tender it
# knows; the radar window lists our scope, filters the West, suggests a link, follows and hides; the card says what Etimad corrected
# and where the deadline came from — three languages, both themes, the accessibility scan, and a phone. Made-up tenders only.
import threading, http.server, socketserver, functools, os, sys, json, pathlib, datetime
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9321'))
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
REG={'schema':'afaqy-tenders-from-mail/v1','to':day(0),'tenders':[{'subject':'توريد وتركيب داش كام - جهة تجريبية','received':day(-2),'from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True}]}
PULL={'schema':'afaqy-etimad-radar/v1','pulledAt':day(0)+'T08:00','partial':False,'tenders':[
  {'ref':'261139004629','title':'WM - توريد وتركيب داش كام','entity':'جهة تجريبية بالمدينة المنورة','status':'active','type':'شراء مباشر','due':day(13)+' 09:59','askDue':day(8),'fees':200,'link':'https://tenders.etimad.sa/Tender/DetailsForVisitor?STenderId=qa1'},
  {'ref':'261139000888','title':'توريد كاميرات مراقبة للمستودع','entity':'أمانة محافظة جدة','status':'active','type':'منافسة عامة','due':day(5)+' 09:59','fees':300},
  {'ref':'261139000999','title':'توريد وتركيب شبكة لاسلكية للمبنى','entity':'جهة تجريبية','status':'active','due':day(25)+' 09:59','fees':100},
  {'ref':'261139000555','title':'توريد أدوية','entity':'جهة تجريبية','status':'active','due':day(4)+' 09:59'}]}
def drop(pg, sel, name, obj):
    pg.evaluate("""([s,n,j])=>{const f=new File([JSON.stringify(j)],n,{type:'application/json'});const i=document.querySelector(s);const dt=new DataTransfer();dt.items.add(f);i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));}""",[sel,name,obj]); pg.wait_for_timeout(1200)
def press(pg, loc, hold=150):
    loc.scroll_into_view_if_needed(); bx=loc.bounding_box()
    if not bx: return False
    pg.mouse.move(bx['x']+bx['width']/2,bx['y']+bx['height']/2); pg.mouse.down(); pg.wait_for_timeout(hold); pg.mouse.up(); pg.wait_for_timeout(500); return True
def boot(b, theme='light', vp=(1366,800), lang='en', state=None):
    kw=dict(viewport={'width':vp[0],'height':vp[1]}, service_workers='block', color_scheme=theme)
    if vp[0]<600: kw.update(is_mobile=True, has_touch=True)
    if state: kw['storage_state']=state
    c=b.new_context(**kw); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: d.accept())
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1400); pg.select_option('#lang-select',lang); pg.wait_for_timeout(300); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(700)
    return c,pg,errs
def items(pg): return pg.evaluate("async()=>{const r=indexedDB.open('afaqy-portal',1);const db=await new Promise(o=>{r.onsuccess=()=>o(r.result)});return await new Promise(o=>{const q=db.transaction('kv').objectStore('kv').get('tenders');q.onsuccess=()=>o(q.result)})}")
LUM="""(sel)=>{const lum=(c)=>{const v=c.map(x=>x/255).map(x=>x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4);return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]};const rgb=(s)=>{const m=s.match(/[\\d.]+/g).map(Number);return {c:m.slice(0,3),a:m.length>3?m[3]:1}};
  const bg=(n)=>{for(;n;n=n.parentElement){const b=rgb(getComputedStyle(n).backgroundColor);if(b.a>0.99)return b.c}return [255,255,255]};let worst=99,which='';
  for(const n of document.querySelectorAll(sel)){if(!n.textContent.trim()||!n.getClientRects().length)continue;const f=lum(rgb(getComputedStyle(n).color).c),b2=lum(bg(n)),r=(Math.max(f,b2)+0.05)/(Math.min(f,b2)+0.05);if(r<worst){worst=r;which=n.className+' '+n.textContent.slice(0,30)}}return {worst:Math.round(worst*100)/100,which}}"""
with sync_playwright() as p:
    b=p.chromium.launch(); c,pg,errs=boot(b)
    drop(pg,'#tenders-body input.td-up-in','reg.json',REG)
    check('R1 before any pull the register says what the radar is for', 'Upload the Etimad pull tool' in pg.locator('.td-radar-line').inner_text())
    drop(pg,'.td-drop-any input','etimad-radar.json',PULL)
    line=pg.locator('.td-radar-line').inner_text()
    check('R2 the pull file dropped on the register is read as a pull, not a study', '3 open tenders within our scope' in line and pg.locator('.et-res').count()==1, line)
    ok=press(pg, pg.locator('.td-radar-btn')); rad=pg.locator('dialog.et-modal')
    check('R3 the radar opens with a held click', ok and rad.count()==1)
    refs=lambda: sorted(rad.locator('tr.et-row').evaluate_all("rs=>rs.map(r=>r.dataset.ref)"))
    check('R4 only our scope: the medicines tender is not listed', refs()==['261139000888','261139000999','261139004629'], refs())
    first=rad.locator('tr.et-row').first.get_attribute('data-ref')
    check('R5 the closest deadline comes first', first=='261139000888', first)
    press(pg, rad.locator('.pill-btn', has_text='Western Region'))
    check('R6 the Western Region filter', refs()==['261139000888','261139004629'], refs())
    press(pg, rad.locator('.pill-btn', has_text='Whole Kingdom'))
    sug=rad.locator('.et-sugg').inner_text() if rad.locator('.et-sugg').count() else ''
    check('R7 the register tender with another title is suggested, not linked by itself', 'WM - توريد وتركيب داش كام' in sug, sug)
    press(pg, rad.locator('.et-sugg .et-link')); pg.wait_for_timeout(600)
    dash=[x for x in items(pg)['items'] if 'داش' in x['subject']][0]
    check('R8 linking sets the platform deadline, its hour and the booklet fee from Etimad', dash['etimadNo']=='261139004629' and dash['due']==day(13) and dash['dueTime']=='09:59' and dash['fees']==200, {k:dash.get(k) for k in ['etimadNo','due','dueTime','fees']})
    press(pg, rad.locator('tr[data-ref="261139000999"] .et-hide'))
    check('R9 «Not ours» hides a tender and counts it', '261139000999' not in refs() and 'What you hid (1)' in rad.locator('.et-filters').inner_text())
    press(pg, rad.locator('tr[data-ref="261139000888"] .et-follow')); pg.wait_for_timeout(800)
    fol=[x for x in items(pg)['items'] if x.get('etimadNo')=='261139000888']
    check('R10 «Follow it» adds the tender with Etimad’s dates and opens it', len(fol)==1 and fol[0]['due']==day(5) and pg.locator('dialog.td-dlg[open] .td-card').count()==1, fol)
    if pg.locator('dialog.td-dlg[open]').count(): pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.locator('#tenders-body .pills button').last.click(); pg.wait_for_timeout(300)
    pg.locator('.td-table tr.td-row', has_text='داش كام').locator('.td-subj').click(); pg.wait_for_timeout(900)
    card=pg.locator('dialog.td-dlg .td-card').inner_text()
    check('R11 the card names the deadline’s source and links to the Etimad page', 'Source: the Etimad platform' in card and pg.locator('dialog.td-dlg .et-chip-link').get_attribute('href').startswith('https://tenders.etimad.sa/'), card[:300])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('R12 no page error on the laptop', not errs, errs[:2])
    state=c.storage_state(indexed_db=True); c.close()
    for theme,lang in [('dark','ar'),('light','ur'),('dark','en'),('light','ar')]:
        c2,q,e2=boot(b,theme,(1366,800),lang,state); press(q, q.locator('.td-radar-btn'))
        raw=q.evaluate("()=>/\\b(et|td)_[a-z_]+\\b/.test(document.querySelector('dialog.et-modal').innerText)")
        cr=q.evaluate(LUM,'dialog.et-modal h2, dialog.et-modal .hint, dialog.et-modal td b, dialog.et-modal .chip, dialog.et-modal .pill-btn, dialog.et-modal .km-tile span, dialog.et-modal .td-badge, dialog.et-modal th')
        check(f'R13[{theme}/{lang}] the radar has no raw key and every text is readable (at least 4.5 to 1)', not raw and cr['worst']>=4.5, (raw,cr))
        if os.path.exists(AXE): q.add_script_tag(path=AXE); v=q.evaluate(SCAN); check(f'R14[{theme}/{lang}] the accessibility scan passes in the radar', not v, v[:3])
        q.keyboard.press('Escape'); q.wait_for_timeout(300)
        check(f'R15[{theme}/{lang}] Escape closes the radar', q.locator('dialog.et-modal').count()==0)
        check(f'R16[{theme}/{lang}] no page error', not e2, e2[:2]); c2.close()
    c3,ph,e3=boot(b,'light',(390,844),'ar',state); ok=press(ph, ph.locator('.td-radar-btn'))
    fit=ph.evaluate("()=>{const d=document.querySelector('dialog.et-modal');if(!d)return null;const r=(n)=>n.getBoundingClientRect();return {page:document.documentElement.scrollWidth>innerWidth+1,over:[...d.querySelectorAll('.km-tile, .et-filters, .et-q, .et-pull .btn, .et-sugg')].filter(n=>r(n).width&&(r(n).right>innerWidth+1||r(n).left<-1)).length}}")
    check('R17 on a phone the radar opens with a tap and nothing runs off the side', ok and fit and not fit['page'] and fit['over']==0, fit)
    check('R18 no page error on the phone', not e3, e3[:2]); c3.close()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
