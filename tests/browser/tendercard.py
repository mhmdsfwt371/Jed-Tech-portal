# ADR-0131 (v9.58): the tender's card. One window on a laptop (no pages), four tiles with the hand-over date, the dates line,
# what is missing typed on the card, the rest folded and opened with a held click; inquiries; «missed the deadline»; the control
# room's hand-over and short-time alerts; the year report with its printable page and Excel — three languages, both themes,
# the accessibility scan, and a phone. Made-up tenders only.
import threading, http.server, socketserver, functools, os, sys, json, pathlib, datetime
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9319'))
AXE=os.environ.get('AXE_JS') or os.path.join(ROOT,'node_modules','axe-core','axe.min.js')
SCAN="(async()=>{const d=[...document.querySelectorAll('dialog[open]')].pop(); const r=await axe.run({include:[d]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}); return r.violations.map(x=>[x.id,x.nodes.length,x.nodes[0].html.slice(0,90)])})()"
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
now=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)+datetime.timedelta(hours=3); day=lambda k: (now+datetime.timedelta(days=k)).strftime('%Y-%m-%d')
# two tenders: one that arrived two days ago with a deadline in eight days, one with three days and a hand-over already due
REG={'schema':'afaqy-tenders-from-mail/v1','to':day(0),'tenders':[{'subject':'sample: Card tender with time','received':day(-2),'from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True},
  {'subject':'sample: Short tender','received':day(-1),'from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True}]}
def reach(pg, loc):
    # A person finds a control: on the page shown, or page by page from the first (v9.74: the window's head is pinned and can
    # cover the top of a page, and the page shown after a save may be past the control — so the search starts again at page 1).
    hit=lambda bx: bx and loc.evaluate("(n,[x,y])=>{const h=document.elementFromPoint(x,y);return !!h&&(h===n||n.contains(h))}",[bx['x']+bx['width']/2,bx['y']+bx['height']/2])
    def here():
        bx=loc.bounding_box(); vh=pg.viewport_size['height']
        return bx if bx and bx['height']>0 and bx['y']>=0 and bx['y']+bx['height']<=vh and hit(bx) else None
    bx=here()
    if bx: return bx
    pv=pg.locator('dialog.td-dlg .dlg-pager .dp-prev'); nx=pg.locator('dialog.td-dlg .dlg-pager .dp-next')
    if nx.count() and nx.is_visible():
        for _ in range(20):
            if pv.is_disabled(): break
            pv.click(); pg.wait_for_timeout(150)
        for _ in range(20):
            bx=here()
            if bx or nx.is_disabled(): return bx
            nx.click(); pg.wait_for_timeout(350)
        return None
    loc.scroll_into_view_if_needed(); pg.wait_for_timeout(200); bx=loc.bounding_box()
    if hit(bx): return bx
    loc.evaluate("n=>n.scrollIntoView({block:'center'})"); pg.wait_for_timeout(200); bx=loc.bounding_box()   # under the pinned head: scroll on
    return bx if hit(bx) else None
def press(pg, loc, hold=150):   # a person holds a click for about a tenth of a second (the lesson of v9.56)
    bx=reach(pg, loc)
    if not bx: return False
    pg.mouse.move(bx['x']+bx['width']/2,bx['y']+bx['height']/2); pg.mouse.down(); pg.wait_for_timeout(hold); pg.mouse.up(); return True
def boot(b, theme='light', vp=(1366,800), lang='en', state=None):
    kw=dict(viewport={'width':vp[0],'height':vp[1]}, service_workers='block', color_scheme=theme, accept_downloads=True)
    if vp[0]<600: kw.update(is_mobile=True, has_touch=True)
    if state: kw['storage_state']=state
    c=b.new_context(**kw); c.grant_permissions(['clipboard-read','clipboard-write']); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: d.accept('A short notice from the entity'))
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1400); pg.select_option('#lang-select',lang); pg.wait_for_timeout(300); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(700)
    return c,pg,errs
def open_tender(pg, needle):
    pg.locator('#tenders-body .pills button').last.click(); pg.wait_for_timeout(300)   # «All» periods
    pg.locator('.td-table tr.td-row', has_text=needle).locator('.td-subj').click(); pg.wait_for_timeout(900)
def setv(pg, sel, v):
    # typed, then the person moves on (Tab): a field that is no longer missing leaves «Missing» for its fold, as it should
    loc=pg.locator(f'dialog.td-dlg {sel}'); loc.fill(v); pg.keyboard.press('Tab'); pg.wait_for_timeout(700)
with sync_playwright() as p:
    b=p.chromium.launch(); c,pg,errs=boot(b)
    pg.evaluate("""(j)=>{ const f=new File([JSON.stringify(j)],'reg.json'); const i=document.querySelector('#tenders-body input.td-up-in'); const dt=new DataTransfer(); dt.items.add(f); i.files=dt.files; i.dispatchEvent(new Event('change',{bubbles:true})); }""", REG); pg.wait_for_timeout(1500)
    open_tender(pg,'Card tender with time')
    setv(pg,'.td-need-box input.td-due',day(8)); setv(pg,'.td-need-box input.td-dueTime','10:00')
    m=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg');return {h:d.scrollHeight,ch:d.clientHeight,paged:!!d.querySelector('.dlg-pager:not([hidden]) .dp-next'),tiles:[...d.querySelectorAll('.td-tile')].map(x=>x.innerText.replace(/\\n/g,' | ')),pts:d.querySelectorAll('.td-tl-pt').length,now:!!d.querySelector('.td-tl-now'),need:[...d.querySelectorAll('.td-need-box input.td-need')].length}}")
    check('K1 on a laptop the card is one window, not pages', m and not m['paged'], m)
    check('K2 four tiles: the deadline with the time left, the hand-over two working days earlier, the working days, the value', len(m['tiles'])==4 and 'left' in m['tiles'][0] and 'Hand-over' in m['tiles'][1] and 'left' in m['tiles'][1] and 'working days' in m['tiles'][2], m['tiles'])
    check('K3 every date on one line, with «Now» on it', m['pts']>=3 and m['now'], m)
    check('K4 what is still missing is typed on the card itself (owner and Etimad number once the deadline is in)', m['need']==2, m)
    check('K4b the deadline’s hour stayed on the card after the date was typed, and left once it was', pg.evaluate("!document.querySelector('dialog.td-dlg .td-need-box input.td-dueTime') && !!document.querySelector('dialog.td-dlg .td-fold-data input.td-dueTime')"))
    # a held click opens «All data»; the fold takes the whole width under the row of folds
    ok=press(pg, pg.locator('dialog.td-dlg .td-fold-data > summary')); pg.wait_for_timeout(500)
    f=pg.evaluate("()=>{const f=document.querySelector('dialog.td-dlg .td-fold-data');const r=f.getBoundingClientRect(),row=f.parentElement.getBoundingClientRect();return {open:f.open,full:r.width>row.width-4,fields:[...f.querySelectorAll('input.td-f, textarea')].map(x=>[...x.classList].find(c=>c.startsWith('td-')&&c!=='td-f')||x.className)}}")
    check('K5 a held click opens «All data» across the whole width, with the fields of this stage', ok and f['open'] and f['full'] and 'td-bond' in f['fields'] and 'td-value' not in f['fields'], f)
    setv(pg,'.td-fold-data input.td-entity','Sample entity')
    chips=pg.evaluate("()=>[...document.querySelectorAll('dialog.td-dlg .td-card-chips .chip')].map(x=>x.textContent)")
    check('K6 the entity typed in the fold appears at the top of the card', 'Sample entity' in chips, chips)
    # inquiries
    press(pg, pg.locator('dialog.td-dlg .td-fold-inq > summary')); pg.wait_for_timeout(400)
    pg.locator('dialog.td-dlg .td-inq-new').fill('Where is the station, and who opens the gate?'); pg.wait_for_timeout(300); got=press(pg, pg.locator('dialog.td-dlg .td-inq-add-btn'))
    for _ in range(20):
        if pg.evaluate("document.querySelectorAll('dialog.td-dlg .td-inq').length"): break
        pg.wait_for_timeout(150)
    inq=pg.evaluate("()=>({n:document.querySelectorAll('dialog.td-dlg .td-inq').length,h:document.querySelector('dialog.td-dlg .td-fold-inq > summary').textContent,draft:(document.querySelector('dialog.td-dlg .td-inq-new')||{}).value,paged:!!document.querySelector('dialog.td-dlg .dlg-pager:not([hidden]) .dp-next')})"); inq['pressed']=got
    check('K7 an inquiry is added with a held click and counted as unanswered', inq['n']==1 and 'unanswered 1' in inq['h'], inq)
    press(pg, pg.locator('dialog.td-dlg .td-team-msg')); pg.wait_for_timeout(500); clip=pg.evaluate("navigator.clipboard.readText()")
    check('K8 the message to the tenders team carries the deadline, the hand-over date, the time given and the inquiry to raise', clip.startswith('Dear colleagues in the tenders team,') and 'Submission deadline on the platform' in clip and 'working days before closing' in clip and 'Please raise these inquiries' in clip and 'who opens the gate' in clip, clip[:500])
    mail=pg.locator('dialog.td-dlg .td-team-mail').get_attribute('href')
    check('K9 «Open it in your mail» addresses the tenders team with the same text', mail.startswith('mailto:a.ibrahim@afaqy.com?subject=') and 'who%20opens%20the%20gate' in mail, mail[:120])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # the short tender: three days, the hand-over already due — the control room says so
    open_tender(pg,'Short tender'); setv(pg,'.td-need-box input.td-due',day(2)); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    row=pg.evaluate("()=>[...document.querySelectorAll('.td-table tr.td-row')].find(r=>r.textContent.includes('Short tender')).textContent")
    check('K10 the list marks a tender with less than a working week', 'Short time' in row, row[:200])
    pg.evaluate("location.hash='#home'"); pg.wait_for_timeout(900)
    att=pg.evaluate("()=>[...document.querySelectorAll('.cr-att .cr-item')].map(x=>x.textContent)")
    check('K11 the control room warns about the hand-over due within a day and the tender that needs a decision today', any('tenders team within a day' in a for a in att) and any('less than a working week' in a for a in att), att)
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(700)
    # missed: the outcome with its reason
    sel=pg.locator('.td-table tr.td-row', has_text='Short tender').locator('select.td-stage'); sel.select_option('missed'); pg.wait_for_timeout(900)
    open_tender(pg,'Short tender'); st=pg.evaluate("()=>({end:(document.querySelector('dialog.td-dlg .td-step-end')||{}).textContent,reason:(document.querySelector('dialog.td-dlg .td-card-reason')||{}).textContent})")
    check('K12 «Missed the deadline» closes the strip with the outcome and shows its reason on the card', st['end']=='Missed the deadline' and 'short notice' in (st['reason'] or ''), st)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # the year report
    press(pg, pg.locator('#tenders-body .td-year-btn')); pg.wait_for_timeout(800)
    yr=pg.evaluate("()=>{const d=document.querySelector('dialog.td-yr-dlg');if(!d)return null;return {tiles:[...d.querySelectorAll('.km-tile')].map(x=>x.querySelector('b').textContent+' '+x.querySelector('span').textContent),why:d.textContent.includes('short notice from the entity'),rows:d.querySelectorAll('.td-yr-all tbody tr').length,wide:d.scrollWidth>d.clientWidth+1}}")
    check('K13 the year report counts both tenders, the missed one with its reason, and fits the window', yr and yr['tiles'][0].startswith('2 ') and any(t.startswith('1 Missed') for t in yr['tiles']) and yr['why'] and yr['rows']==2 and not yr['wide'], yr)
    with pg.expect_download() as dl: press(pg, pg.locator('dialog.td-yr-dlg .td-yr-html'))
    html=open(dl.value.path(),encoding='utf8').read()
    check('K14 «Printable page» is a whole page with the same numbers and reasons', html.startswith('<!doctype html>') and 'Tenders report' in html and 'short notice from the entity' in html and 'Card tender with time' in html, html[:200])
    with pg.expect_download() as dl2: press(pg, pg.locator('dialog.td-yr-dlg .td-yr-xl'))
    check('K15 and Excel downloads', dl2.value.suggested_filename.endswith('-report.xlsx'), dl2.value.suggested_filename)
    if os.path.exists(AXE): pg.add_script_tag(path=AXE); v=pg.evaluate(SCAN); check('K16 the accessibility scan passes in the year report', not v, v[:3])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    state=c.storage_state(indexed_db=True)
    check('K17 no page error on the laptop', not errs, errs[:2])
    # languages, themes, the scan inside the card, and a phone — on the same register
    LUM="""()=>{const lum=(c)=>{const v=c.map(x=>x/255).map(x=>x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4);return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]};const rgb=(s)=>{const m=s.match(/[\\d.]+/g).map(Number);return {c:m.slice(0,3),a:m.length>3?m[3]:1}};
      const bg=(n)=>{for(;n;n=n.parentElement){const b=rgb(getComputedStyle(n).backgroundColor);if(b.a>0.99)return b.c}return [255,255,255]};let worst=99,which='';
      for(const n of document.querySelectorAll('dialog.td-dlg .td-tile small, dialog.td-dlg .td-tile b, dialog.td-dlg .td-badge, dialog.td-dlg .td-tl-pt b, dialog.td-dlg .td-tl-pt span, dialog.td-dlg .td-tl-now span, dialog.td-dlg .td-step, dialog.td-dlg .td-step-end, dialog.td-dlg .td-card h3, dialog.td-dlg .td-fold > summary')){if(!n.textContent.trim())continue;const f=lum(rgb(getComputedStyle(n).color).c),b2=lum(bg(n)),r=(Math.max(f,b2)+0.05)/(Math.min(f,b2)+0.05);if(r<worst){worst=r;which=n.className+' '+n.textContent.slice(0,30)}}return {worst:Math.round(worst*100)/100,which}}"""
    for theme,lang in [('dark','ar'),('light','ur'),('dark','en')]:
        c2,q,e2=boot(b,theme,(1366,800),lang,state); open_tender(q,'Card tender with time')
        raw=q.evaluate("()=>/\\btd_[a-z_]+\\b/.test(document.querySelector('dialog.td-dlg').innerText)"); cr=q.evaluate(LUM)
        check(f'K18[{theme}/{lang}] the card has no raw key and every text on it is readable (at least 4.5 to 1)', not raw and cr['worst']>=4.5, (raw,cr))
        if os.path.exists(AXE): q.add_script_tag(path=AXE); v=q.evaluate(SCAN); check(f'K19[{theme}/{lang}] the accessibility scan passes in the card', not v, v[:3])
        check(f'K20[{theme}/{lang}] no page error', not e2, e2[:2]); c2.close()
    c3,ph,e3=boot(b,'light',(390,844),'ar',state); open_tender(ph,'Card tender with time')
    fit=ph.evaluate("()=>{const d=document.querySelector('dialog.td-dlg');const r=(n)=>n.getBoundingClientRect();return {page:document.documentElement.scrollWidth>innerWidth+1,over:[...d.querySelectorAll('.td-tile, .td-box, .td-fold, .td-card-acts .btn')].filter(n=>r(n).width&&(r(n).right>innerWidth+1||r(n).left<-1)).length}}")
    check('K21 on a phone nothing in the card runs off the side', not fit['page'] and fit['over']==0, fit)
    ok=press(ph, ph.locator('dialog.td-dlg .td-fold-data > summary')); ph.wait_for_timeout(500)
    check('K22 and a fold opens there with a tap', ok and ph.evaluate("!!document.querySelector('dialog.td-dlg .td-fold-data[open]')"))
    check('K23 no page error on the phone', not e3, e3[:2])
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
