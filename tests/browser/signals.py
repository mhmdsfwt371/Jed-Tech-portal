# ADR-0155 (v9.88): where a tender stands, read from what its mails say. A tender the branch stepped aside from by a reply, or
# whose offer the tenders team reported submitted, is offered that stage with the sentence and its writer; the manager accepts
# it or puts it aside. And an entry that is part of another tender is put into it from its card. Made-up people and wording only.
import threading, http.server, socketserver, functools, os, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9335'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
STATE="""()=>new Promise((ok)=>{const r=indexedDB.open('afaqy-portal');r.onsuccess=()=>{const g=r.result.transaction('kv').objectStore('kv').get('tenders');g.onsuccess=()=>ok(((g.result&&g.result.items)||[]).map(i=>({id:i.id,stage:i.stage,stageAt:i.stageAt,reason:i.reason,sub:i.submittedOn,off:i.sigOff,mails:(i.messages||[]).length,files:(i.files||[]).length,acts:(i.activity||[]).map(a=>a.action)})))}})"""
SEED="""()=>new Promise((ok)=>{const r=indexedDB.open('afaqy-portal');r.onsuccess=()=>{const tx=r.result.transaction('kv','readwrite'),s=tx.objectStore('kv');
  const D='a.ibrahim@afaqy.com',B='boss@example.com';
  const mk=(id,subject,date,stage,thread,extra={})=>({id,subject,date,dateSource:'received',from:D,byFrom:true,byKr:false,att:[],status:'open',stage,stageAt:date,
    messages:thread.map((e,k)=>({key:id+k,messageId:id+k,hash:id+k,subject,sender:e.addr,date:e.at.slice(0,10),at:e.at})),files:[],thread,activity:[],...extra});
  const first=(at)=>({at,name:'Tenders Desk',addr:D,text:'The booklet is attached.'});
  s.put({items:[
    mk('s1','sample: Tender A — cameras for the depot','2026-11-01','received',[first('2026-11-01T09:00'),{at:'2026-11-10T17:30',name:'Branch Manager',addr:B,text:'Dear all,\\nWe will not participate in this tender: the site visit certificate is mandatory.\\nRegards'}]),
    mk('s2','sample: Tender B — fuel sensors','2026-11-02','prep',[first('2026-11-02T09:00'),{at:'2026-11-18T13:39',name:'Tenders Desk',addr:D,text:'Both offers have been submitted on the platform.'}]),
    mk('s3','sample: Tender C — door locks','2026-11-03','received',[first('2026-11-03T09:00'),{at:'2026-11-12T10:00',name:'Branch Manager',addr:B,text:'Better not to bid unless the date moves.\\nWe will not participate otherwise.'}]),
    mk('s4','sample: Tender D — network','2026-11-04','received',[first('2026-11-04T09:00')]),
    mk('s5','Tenders Desk shared "Tender D — network"','2026-11-05','received',[{at:'2026-11-05T11:00',name:'Tenders Desk',addr:D,text:'Here is the link.'}],{files:[{id:'f5',name:'link.txt',kind:'other',mailKey:'s50',blob:new Blob(['x'])}]}),
  ],to:null,pulledAt:''},'tenders');tx.oncomplete=()=>ok(1)}})"""
def go(pg):
    pg.reload(); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900)
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1366,'height':900}, service_workers='block')
    pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(600)
    pg.evaluate(SEED); go(pg)
    line=pg.locator('.td-sg-line')
    check('S1 the register says three tenders\' emails speak for another stage', line.count()==1 and '3 tenders' in line.inner_text(), line.inner_text() if line.count() else '')
    pg.locator('.td-sg-btn').click(); pg.wait_for_timeout(500); d=pg.locator('dialog.td-sg'); txt=d.inner_text()
    check('S2 each row shows the sentence, who wrote it and when, and the move', d.locator('.td-sg-x').count()==3 and 'We will not participate in this tender' in txt and 'Branch Manager' in txt and '10/11/2026' in txt and 'Both offers have been submitted' in txt and 'Declined' in txt and 'Submitted' in txt, txt[:900])
    fit=pg.evaluate("()=>{const d=document.querySelector('dialog.td-sg'),r=d.getBoundingClientRect();return r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&d.scrollWidth<=d.clientWidth+1}")
    check('S3 the window fits the screen with no sideways scroll', fit)
    before=pg.evaluate(STATE); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('S4 closing the window changes nothing', pg.evaluate(STATE)==before)
    pg.locator('.td-sg-btn').click(); pg.wait_for_timeout(400)
    pg.locator('dialog.td-sg .td-cl-row', has_text='door locks').locator('input').uncheck()   # the conditional sentence: the manager knows better
    pg.locator('dialog.td-sg .td-sg-go').click(); pg.wait_for_timeout(1200)
    st={x['id']:x for x in pg.evaluate(STATE)}
    check('S5 the tender the branch stepped aside from is «declined» on the reply\'s day, with the sentence as its reason', st['s1']['stage']=='declined' and st['s1']['stageAt']=='2026-11-10' and 'will not participate' in (st['s1']['reason'] or ''), st['s1'])
    check('S6 the tender the team reported submitted is «submitted» on that day', st['s2']['stage']=='submitted' and st['s2']['stageAt']=='2026-11-18' and st['s2']['sub']=='2026-11-18', st['s2'])
    check('S7 the unticked one keeps its stage and is put aside', st['s3']['stage']=='received' and st['s3']['off']=='2026-11-12T10:00', st['s3'])
    check('S8 nothing is left to review', pg.locator('.td-sg-line').count()==0)
    go(pg); check('S9 after reopening it is still so', pg.locator('.td-sg-line').count()==0 and {x['id']:x for x in pg.evaluate(STATE)}['s1']['stage']=='declined')
    pg.locator('#tenders-body .td-filter .pills .pill-btn').nth(3).click(); pg.wait_for_timeout(400)
    pg.locator('.td-table tr.td-row', has_text='Tender A').locator('.td-subj').first.click(); pg.wait_for_timeout(900)
    f=pg.locator('dialog.td-dlg .td-fold-history > summary')
    if not f.count():
        a=pg.locator('dialog.td-dlg .td-card-all')
        if a.count(): a.click(); pg.wait_for_timeout(500)
    if not pg.evaluate("!!document.querySelector('dialog.td-dlg .td-fold-history[open]')") and f.count(): f.first.click(); pg.wait_for_timeout(300)
    hs=pg.evaluate("()=>[...document.querySelectorAll('dialog.td-dlg .td-history-entry')].map(e=>e.textContent)")
    check('S10 the card\'s history says the stage came from the reply, at the reply\'s own time', any('The stage became «Declined»' in x and '10/11/2026' in x and '17:30' in x for x in hs), hs)
    # an entry that is part of another tender
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.locator('.td-table tr.td-row', has_text='shared').locator('.td-subj').first.click(); pg.wait_for_timeout(900)
    mb=pg.locator('dialog.td-dlg .td-mi-btn')
    if not mb.count():
        a=pg.locator('dialog.td-dlg .td-card-all')
        if a.count(): a.click(); pg.wait_for_timeout(500)
    mb.first.click(); pg.wait_for_timeout(400)
    pg.locator('dialog.td-mi .td-mi-go').click(); pg.wait_for_timeout(300)
    check('S11 nothing is put anywhere until a tender is chosen', pg.locator('dialog.td-mi').count()==1 and len(pg.evaluate(STATE))==5)
    pg.select_option('dialog.td-mi .td-mi-sel','s4'); pg.locator('dialog.td-mi .td-mi-go').click(); pg.wait_for_timeout(1200)
    st={x['id']:x for x in pg.evaluate(STATE)}
    check('S12 the entry is gone and its mail and file are in the tender chosen', 's5' not in st and st['s4']['mails']==2 and st['s4']['files']==1 and st['s4']['acts'][0]=='merged', st.get('s4'))
    check('S13 the tender chosen keeps its own arrival stage', st['s4']['stage']=='received' and st['s4']['stageAt']=='2026-11-04', st['s4'])
    for lang,dark in (('ar',False),('ur',True)):
        pg.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())"); pg.select_option('#lang-select',lang); pg.wait_for_timeout(300)
        if dark: pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
        pg.evaluate(SEED); pg.reload(); pg.wait_for_timeout(1500); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
        pg.locator('.td-sg-btn').click(); pg.wait_for_timeout(400)
        bad=pg.evaluate("()=>document.body.innerText.match(/td_sg_\\w+|td_mi_\\w+|td_history_signal/g)")
        check(f'S14 no raw key shows in {lang}', not bad and pg.locator('dialog.td-sg .td-sg-x').count()==3, bad)
    check('S15 no page error', not errs, errs)
    b.close()
h.shutdown()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); raise SystemExit(1 if fails else 0)
