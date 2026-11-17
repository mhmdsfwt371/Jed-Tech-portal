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
  {'ref':'261139000555','title':'توريد أدوية','entity':'جهة تجريبية','status':'active','due':day(4)+' 09:59'},
  {'ref':'261139000444','title':'توريد كاميرات مراقبة للبوابات','entity':'جهة تجريبية','status':'active','due':day(-1)+' 09:59'}]}   # open when pulled, closed since
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
def press_in(pg, loc, dlg='dialog.mk-modal'):   # a long window is paged (v9.47): turn its pages until the control is on screen, then hold the click
    for _ in range(20):
        bx=loc.bounding_box(); vh=pg.viewport_size['height']
        if bx and bx['height']>0 and bx['y']>=0 and bx['y']+bx['height']<=vh and loc.evaluate("(n,[x,y])=>{const h=document.elementFromPoint(x,y);return !!h&&(h===n||n.contains(h))}",[bx['x']+bx['width']/2,bx['y']+bx['height']/2]):
            pg.mouse.move(bx['x']+bx['width']/2,bx['y']+bx['height']/2); pg.mouse.down(); pg.wait_for_timeout(150); pg.mouse.up(); pg.wait_for_timeout(500); return True
        nx=pg.locator(f'{dlg} .dlg-pager .dp-next')
        if not nx.count() or nx.is_disabled() or not nx.is_visible(): return press(pg, loc)
        nx.click(); pg.wait_for_timeout(350)
    return False
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
    check('R2 the pull file dropped on the register is read as a pull, not a study, and says it changes nothing', '3 open tenders within our scope' in line and pg.locator('.et-res').count()==1 and 'does not change their data' in pg.locator('.et-res').inner_text(), line)
    ok=press(pg, pg.locator('.td-radar-btn')); rad=pg.locator('dialog.et-modal')
    check('R3 the radar opens with a held click', ok and rad.count()==1)
    refs=lambda: sorted(rad.locator('tr.et-row').evaluate_all("rs=>rs.map(r=>r.dataset.ref)"))
    check('R4 only our scope and still open: no medicines tender, no tender whose deadline passed', refs()==['261139000888','261139000999','261139004629'], refs())
    first=rad.locator('tr.et-row').first.get_attribute('data-ref')
    check('R5 the closest deadline comes first', first=='261139000888', first)
    press(pg, rad.locator('.pill-btn', has_text='Western Region'))
    check('R6 the Western Region filter', refs()==['261139000888','261139004629'], refs())
    press(pg, rad.locator('.pill-btn', has_text='Whole Kingdom'))
    sug=rad.locator('.et-sugg').inner_text() if rad.locator('.et-sugg').count() else ''
    check('R7 the register tender with another title is suggested, not linked by itself', 'WM - توريد وتركيب داش كام' in sug, sug)
    press(pg, rad.locator('.et-sugg .et-link')); pg.wait_for_timeout(600)
    dash=[x for x in items(pg)['items'] if 'داش' in x['subject']][0]
    check('R8 linking gives the Etimad number and page only — the pull never fills the tender (v9.62)', dash['etimadNo']=='261139004629' and not dash.get('due') and dash.get('fees') is None and dash.get('link','').startswith('https://tenders.etimad.sa/'), {k:dash.get(k) for k in ['etimadNo','due','dueTime','fees','link']})
    press(pg, rad.locator('tr[data-ref="261139000999"] .et-hide'))
    check('R9 «Not ours» hides a tender and counts it', '261139000999' not in refs() and 'What you hid (1)' in rad.locator('.et-filters').inner_text())
    press(pg, rad.locator('tr[data-ref="261139000888"] .et-follow')); pg.wait_for_timeout(800)
    fol=[x for x in items(pg)['items'] if x.get('etimadNo')=='261139000888']
    check('R10 «Follow it» adds the tender with Etimad’s dates and opens it', len(fol)==1 and fol[0]['due']==day(5) and pg.locator('dialog.td-dlg[open] .td-card').count()==1, fol)
    if pg.locator('dialog.td-dlg[open]').count(): pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.locator('#tenders-body .pills button').last.click(); pg.wait_for_timeout(300)
    pg.locator('.td-table tr.td-row', has_text='داش كام').locator('.td-subj').click(); pg.wait_for_timeout(900)
    card=pg.locator('dialog.td-dlg .td-card').inner_text().replace('\u2068','').replace('\u2069','')
    check('R11 the card says what the pull holds as a note, changes nothing, and links to the Etimad page', 'In the Etimad pull of' in card and day(13)+' 09:59 (empty in the register)' in card and 'Nothing was changed' in card and pg.locator('dialog.td-dlg .et-chip-link').get_attribute('href').startswith('https://tenders.etimad.sa/'), card[:400])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # v9.61 (ADR-0133): a later pull publishes the dash-cam tender's offers and award; similar awarded tenders give the market
    RES={'schema':'afaqy-etimad-radar/v1','pulledAt':day(0)+'T12:00','tenders':[dict(PULL['tenders'][0],status='awarded'),
      {'ref':'261139000301','title':'توريد وتركيب داش كام للمركبات','entity':'جهة تجريبية','status':'awarded','published':day(-60)},
      {'ref':'261139000302','title':'توريد داش كام وكاميرات خلفية للمركبات','entity':'جهة تجريبية','status':'awarded','published':day(-90)},
      {'ref':'261139000303','title':'تحديث نظام سكادا لمحطات الضخ','entity':'جهة تجريبية','status':'awarded','published':day(-30)}],
      'awards':[{'ref':'261139004629','winner':'شركة رامي قاسم','value':41000},{'ref':'261139000301','winner':'شركة رامي قاسم','value':38000},{'ref':'261139000302','winner':'مؤسسة لينا حرب','value':52000}],
      'offers':[{'ref':'261139004629','bidder':'شركة رامي قاسم','price':41000,'tech':'pass'},{'ref':'261139004629','bidder':'شركة أفاقي لتقنية المعلومات','price':45500,'tech':'pass'},
        {'ref':'261139000301','bidder':'شركة رامي قاسم','price':38000,'tech':'pass'},{'ref':'261139000301','bidder':'مؤسسة زيد فارس','price':40000,'tech':'pass'}]}
    drop(pg,'.td-drop-any input','etimad-radar-2.json',RES)
    mg=pg.locator('.et-merged').inner_text() if pg.locator('.et-merged').count() else ''
    check('R34 a second pull is written onto the first: the message says how many were added and updated, and that nothing kept was removed (v9.65)', '3 new tenders were added, 1 were updated' in mg and '8 tenders are kept now' in mg and 'nothing that was kept was removed' in mg, mg)
    pg.locator('#tenders-body .pills button').last.click(); pg.wait_for_timeout(300)
    pg.locator('.td-table tr.td-row', has_text='داش كام').locator('.td-subj').click(); pg.wait_for_timeout(900)
    rl=pg.locator('dialog.td-dlg .et-res-line'); check('R19 the card shows who won, at what value, and where our offer stood', rl.count()==1 and 'ranked 2 of 2' in rl.inner_text(), rl.inner_text() if rl.count() else '')
    ok=press(pg, pg.locator('dialog.td-dlg .td-fold-market > summary')); n=pg.locator('dialog.td-dlg .td-fold-market table.et-sim tbody tr').count()
    check('R20 the market fold opens with a held click: our bid among the offers, two similar awarded tenders', ok and pg.locator('dialog.td-dlg .td-fold-market tr.et-us').count()==1 and n==2, n)
    check('R21 the outcome is offered, not recorded by itself', pg.locator('dialog.td-dlg .et-out-btn').count()==1 and [x for x in items(pg)['items'] if 'داش' in x['subject']][0]['stage']!='lost')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # v9.61 (ADR-0134): the archive and the year funnel
    press(pg, pg.locator('.td-year-btn')); yr=pg.locator('dialog.td-yr-dlg')
    steps=yr.locator('.et-funnel li b').all_inner_texts() if yr.count() else []
    check('R24 the year report opens with the funnel from Etimad to what we won', len(steps)==5, steps)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # v9.63 (ADR-0136): «Market analysis» — the whole pull in one window, every list complete, Excel by the choice made
    nR=pg.evaluate("async()=>{const r=indexedDB.open('afaqy-portal',1);const db=await new Promise(o=>{r.onsuccess=()=>o(r.result)});return await new Promise(o=>{const q=db.transaction('kv').objectStore('kv').get('radar');q.onsuccess=()=>o(q.result.tenders.length)})}")
    ok=press(pg, pg.locator('.td-market-btn')); mk=pg.locator('dialog.mk-modal')
    TILE="(l)=>{const t=[...document.querySelectorAll('dialog.mk-modal .km-tile')].find(x=>x.querySelector('span').textContent===l);return t?t.querySelector('b').textContent:null}"
    rows=lambda: mk.locator('table.mk-t tbody tr').count()
    check('R27 the market window opens with a held click and counts every tender in the pull, ours or not', ok and mk.count()==1 and pg.evaluate(TILE,'tenders published')==str(nR) and rows()==nR, (nR, pg.evaluate(TILE,'tenders published'), rows()))
    press_in(pg, mk.locator('.mk-sc-afaqy')); inScope=pg.evaluate(TILE,'tenders published'); press_in(pg, mk.locator('.mk-sc-all'))
    check('R28 «AFAQY\'s field of work only» narrows the numbers, «Every field» brings them back', inScope is not None and int(inScope)<nR and pg.evaluate(TILE,'tenders published')==str(nR), (inScope,nR))
    press_in(pg, mk.locator('.mk-sc-iiot')); io=pg.evaluate(TILE,'tenders published'); chip=mk.locator('table.mk-t tbody tr .td-chips').first.inner_text() if rows() else ''
    press_in(pg, mk.locator('.mk-tab-lines')); lr=mk.locator('table.mk-t-lines tbody tr').all_inner_texts(); press_in(pg, mk.locator('.mk-tab-tenders')); press_in(pg, mk.locator('.mk-sc-all'))
    check('R35 «Industrial IoT» is a field of its own: its tenders, each with its line, and the lines list (v9.66)', io=='1' and 'SCADA' in chip and len(lr)==1 and 'SCADA, control and remote monitoring' in lr[0] and pg.evaluate(TILE,'tenders published')==str(nR), (io,chip,lr))
    press_in(pg, mk.locator('.mk-tab-winners'))
    if not mk.locator('table.mk-t-winners').count(): press_in(pg, mk.locator('.mk-tab-winners'))   # a press that landed while the pager was settling
    wn=mk.locator('table.mk-t-winners tbody tr').count(); top=mk.locator('table.mk-t-winners tbody tr').first.inner_text()
    press_in(pg, mk.locator('table.mk-t-winners tbody tr').first.locator('.mk-who'))
    check('R29 the winners list is complete, and a winner pressed shows his tenders only', wn==2 and 'شركة رامي قاسم' in top and mk.locator('.mk-who-on').count()==1 and rows()==2, (wn,top,rows()))
    with pg.expect_download() as dl: press_in(pg, mk.locator('.mk-xl-all'))
    import openpyxl, tempfile; xf=os.path.join(tempfile.mkdtemp(),dl.value.suggested_filename); dl.value.save_as(xf); wb=openpyxl.load_workbook(xf); names=wb.sheetnames; tl=list(wb['Tenders'].values)
    check('R30 «Excel of every list» downloads one sheet per list with the choice applied', names[:2]==['Summary','Tenders'] and 'Industrial IoT lines' in names and len(names)==9 and len(tl)==3 and 'شركة رامي قاسم' in str(list(wb['Summary'].values)[0][1]), (names,len(tl)))
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
        press(q, q.locator('.td-year-btn')); cr=q.evaluate(LUM,'dialog.td-yr-dlg .et-funnel li b, dialog.td-yr-dlg .et-funnel li span, dialog.td-yr-dlg .et-funnel small, dialog.td-yr-dlg .td-yr-funnel .hint')
        check(f'R25[{theme}/{lang}] the funnel is readable', cr['worst']>=4.5, cr)
        if os.path.exists(AXE): v=q.evaluate(SCAN); check(f'R26[{theme}/{lang}] the accessibility scan passes in the year report with the funnel', not v, v[:3])
        q.keyboard.press('Escape'); q.wait_for_timeout(300)
        q.locator('#tenders-body .pills button').last.click(); q.wait_for_timeout(300)
        q.locator('.td-table tr.td-row', has_text='داش كام').locator('.td-subj').click(); q.wait_for_timeout(900); press(q, q.locator('dialog.td-dlg .td-fold-market > summary'))
        cr=q.evaluate(LUM,'dialog.td-dlg .et-card p, dialog.td-dlg .td-fold-market th, dialog.td-dlg .td-fold-market td, dialog.td-dlg .td-fold-market h4, dialog.td-dlg .et-sim-sum, dialog.td-dlg .td-fold-market small')
        raw=q.evaluate("()=>/\\b(et|td)_[a-z_]+\\b/.test(document.querySelector('dialog.td-dlg').innerText)")
        check(f'R22[{theme}/{lang}] the result and the market are readable, with no raw key', not raw and cr['worst']>=4.5, (raw,cr))
        if os.path.exists(AXE): v=q.evaluate(SCAN); check(f'R23[{theme}/{lang}] the accessibility scan passes in the card with the market open', not v, v[:3])
        q.keyboard.press('Escape'); q.wait_for_timeout(300); press(q, q.locator('.td-market-btn'))
        raw=q.evaluate("()=>/\\bmk_[a-z_]+\\b/.test(document.querySelector('dialog.mk-modal').innerText)")
        cr=q.evaluate(LUM,'dialog.mk-modal h2, dialog.mk-modal .hint, dialog.mk-modal .note, dialog.mk-modal .km-tile b, dialog.mk-modal .km-tile span, dialog.mk-modal .km-tile small, dialog.mk-modal .pill-btn, dialog.mk-modal th, dialog.mk-modal td b, dialog.mk-modal .chip, dialog.mk-modal .crm-n, dialog.mk-modal label span')
        check(f'R31[{theme}/{lang}] the market window has no raw key and every text is readable (at least 4.5 to 1)', not raw and cr['worst']>=4.5, (raw,cr))
        if os.path.exists(AXE): v=q.evaluate(SCAN); check(f'R32[{theme}/{lang}] the accessibility scan passes in the market window', not v, v[:3])
        check(f'R16[{theme}/{lang}] no page error', not e2, e2[:2]); c2.close()
    c3,ph,e3=boot(b,'light',(390,844),'ar',state); ok=press(ph, ph.locator('.td-radar-btn'))
    fit=ph.evaluate("()=>{const d=document.querySelector('dialog.et-modal');if(!d)return null;const r=(n)=>n.getBoundingClientRect();return {page:document.documentElement.scrollWidth>innerWidth+1,over:[...d.querySelectorAll('.km-tile, .et-filters, .et-q, .et-pull .btn, .et-sugg')].filter(n=>r(n).width&&(r(n).right>innerWidth+1||r(n).left<-1)).length}}")
    check('R17 on a phone the radar opens with a tap and nothing runs off the side', ok and fit and not fit['page'] and fit['over']==0, fit)
    ph.keyboard.press('Escape'); ph.wait_for_timeout(300); ok=press(ph, ph.locator('.td-market-btn'))
    fit=ph.evaluate("()=>{const d=document.querySelector('dialog.mk-modal');if(!d)return null;return {page:document.documentElement.scrollWidth>innerWidth+1,over:[...d.querySelectorAll('.km-tile, .mk-filters, .mk-tabs, .mk-xl, .crm-head')].filter(n=>{const r=n.getBoundingClientRect(),D=d.getBoundingClientRect();return r.right>D.right+1||r.left<D.left-1}).length}}")
    check('R33 on a phone the market window opens with a tap and nothing runs off the side', ok and fit and not fit['page'] and fit['over']==0, fit)
    check('R18 no page error on the phone', not e3, e3[:2]); c3.close()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
