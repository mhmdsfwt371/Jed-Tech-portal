# ADR-0154 (v9.87): only tenders in the register, each once. A mail with nothing that says «tender» is not registered and its
# reason is shown; a mail finds its tender by the Etimad reference in its subject, file names or text; and a register that
# already holds what is not a tender, or one tender twice, is tidied by the manager in one window. Made-up people and wording only.
import threading, http.server, socketserver, functools, os, tempfile, pathlib, json
from email.message import EmailMessage
from email.utils import format_datetime
from datetime import datetime, timezone, timedelta
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9334'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
tmp=tempfile.mkdtemp(); P=lambda n: os.path.join(tmp,n)
KSA=timezone(timedelta(hours=3))
def mail(name, frm, subject, when, body, mid=None, refs=None):
    m=EmailMessage(); m['From']=frm; m['To']='Branch <branch@example.com>'; m['Subject']=subject
    m['Date']=format_datetime(when); m['Message-ID']=f'<{mid or name}@example.com>'
    if refs: m['References']=refs; m['In-Reply-To']=refs
    m.set_content(body); open(P(name),'wb').write(bytes(m))
DESK='Tenders Desk <a.ibrahim@afaqy.com>'; BOSS='Branch Manager <boss@example.com>'
mail('n1.eml',BOSS,'sample: Notes on the fleet system screens',datetime(2026,9,1,9,0,tzinfo=KSA),'Please look at the attached notes.')
mail('t1.eml',DESK,'sample: Smart mobile monitoring units',datetime(2026,11,10,9,0,tzinfo=KSA),'The booklet is attached.\nReference number: 261139004470\nSubmission deadline: 2026-12-20 at 10:00 AM')
mail('t2.eml',BOSS,'About the monitoring units 261139004470',datetime(2026,11,12,14,0,tzinfo=KSA),'We will not take part in this one.\n\nRegards,\nBranch Manager')
mail('t3.eml',BOSS,'Our decision',datetime(2026,11,13,8,0,tzinfo=KSA),'As agreed.\n\nRegards,\nBranch Manager',refs='<t1.eml@example.com>')
mail('t4.eml',BOSS,'sample: مستندات منافسة توريد حساسات',datetime(2026,11,14,8,0,tzinfo=KSA),'مرفق المستندات.')
ROWS="()=>[...document.querySelectorAll('.td-table tr.td-row .td-subj')].map(e=>e.textContent)"
STATE="""()=>new Promise((ok)=>{const r=indexedDB.open('afaqy-portal');r.onsuccess=()=>{const g=r.result.transaction('kv').objectStore('kv').get('tenders');g.onsuccess=()=>ok(((g.result&&g.result.items)||[]).map(i=>({id:i.id,subject:i.subject,date:i.date,stage:i.stage,no:i.etimadNo,mails:(i.messages||[]).length,acts:(i.activity||[]).map(a=>a.action)})))}})"""
def drop(pg, files):
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    pg.locator('#tenders-body .td-pull .td-mail-drop input[type=file]').set_input_files([P(f) for f in files]); pg.wait_for_timeout(3500)
def show_all(pg):
    pg.locator('#tenders-body .td-filter .pills .pill-btn').nth(3).click(); pg.wait_for_timeout(400)
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1366,'height':900}, service_workers='block')
    pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: d.accept())
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    drop(pg,['n1.eml']); st=pg.evaluate(STATE)
    check('C1 a mail with nothing that says «tender» is not registered', st==[], st)
    check('C2 and the page says why', 'Nothing in this email says it is a tender' in pg.locator('#tenders-body').inner_text(), pg.locator('#tenders-body').inner_text()[:600])
    drop(pg,['t1.eml']); st=pg.evaluate(STATE)
    check('C3 the tender takes its Etimad reference from the mail\'s text', len(st)==1 and st[0]['no']=='261139004470', st)
    drop(pg,['t2.eml']); st=pg.evaluate(STATE)
    check('C4 a mail under another subject joins its tender by the reference', len(st)==1 and st[0]['mails']==2, st)
    drop(pg,['t3.eml']); st=pg.evaluate(STATE)
    check('C5 a reply with no sign of its own still joins the tender it answers', len(st)==1 and st[0]['mails']==3, st)
    drop(pg,['t4.eml']); st=pg.evaluate(STATE)
    check('C6 a mail whose subject names a tender opens one, whoever wrote it', len(st)==2, st)
    check('C7 a clean register shows no tidy line', pg.locator('.td-cl-line').count()==0)
    # a register as 9.86 left it: an entry that is not a tender, and one tender under two spellings
    pg.evaluate("""()=>new Promise((ok)=>{const r=indexedDB.open('afaqy-portal');r.onsuccess=()=>{const tx=r.result.transaction('kv','readwrite'),s=tx.objectStore('kv'),g=s.get('tenders');
      g.onsuccess=()=>{const rec=g.result,v=rec;
        const mk=(id,subject,date,stage,sender,key)=>({id,subject,date,dateSource:'received',from:sender,byFrom:false,byKr:false,att:[],status:'open',stage,stageAt:date,messages:[{key,messageId:key,hash:key,subject,sender,date}],files:[],thread:[],activity:[{id:key,action:'email',label:subject,at:'2026-11-20T08:00:00.000Z'}]});
        v.items.push(mk('x1','sample: Complaint about the insurance claim','2025-11-10','received','boss@example.com','k1'));
        v.items.push(mk('d1','تامين كاميرات مراقبة امنية للمنطقة الغربية','2026-10-13','received','a.ibrahim@afaqy.com','k2'));
        v.items.push(mk('d2','RE: تامين كميرات مراقبة امنية للمنطقة الغربية','2026-10-24','prep','a.ibrahim@afaqy.com','k3'));
        s.put(rec,'tenders')};tx.oncomplete=()=>ok(1);tx.onerror=()=>ok(0)}})""")
    pg.reload(); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900)
    line=pg.locator('.td-cl-line')
    check('C8 the register says what needs tidying: one entry that is not a tender, one tender twice', line.count()==1 and '1 entries' in line.inner_text() and '1 tenders' in line.inner_text(), line.inner_text() if line.count() else '')
    pg.locator('.td-cl-btn').click(); pg.wait_for_timeout(500)
    d=pg.locator('dialog.td-cl')
    check('C9 the window lists the entry and the pair, each ticked', d.locator('.td-cl-x').count()==1 and d.locator('.td-cl-m').count()==1 and 'Complaint' in d.locator('.td-cl-not').inner_text() and 'كميرات' in d.locator('.td-cl-dup').inner_text(), d.inner_text()[:500])
    box=pg.evaluate("()=>{const d=document.querySelector('dialog.td-cl'),r=d.getBoundingClientRect();return r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&d.scrollWidth<=d.clientWidth+1}")
    check('C10 the window fits the screen with no sideways scroll', box)
    before=pg.evaluate(STATE); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('C11 closing the window changes nothing', pg.evaluate(STATE)==before)
    pg.locator('.td-cl-btn').click(); pg.wait_for_timeout(400); pg.locator('dialog.td-cl .td-cl-go').click(); pg.wait_for_timeout(1200)
    st=pg.evaluate(STATE); ids=[x['id'] for x in st]; one=next((x for x in st if x['id']=='d1'),None)
    check('C12 what is not a tender is gone, and the two entries are one', 'x1' not in ids and 'd2' not in ids and len(st)==3, st)
    check('C13 the one that stays has the older arrival, the further stage and both mails', one and one['date']=='2026-10-13' and one['stage']=='prep' and one['mails']==2, one)
    check('C14 its history says a second entry was merged', one and one['acts'][0]=='merged', one)
    check('C15 the tidy line is gone', pg.locator('.td-cl-line').count()==0)
    show_all(pg); pg.locator('.td-table tr.td-row', has_text='كاميرات').locator('.td-subj').first.click(); pg.wait_for_timeout(900)
    f=pg.locator('dialog.td-dlg .td-fold-history > summary')
    if not f.count():
        a=pg.locator('dialog.td-dlg .td-card-all')
        if a.count(): a.click(); pg.wait_for_timeout(500)
    if not pg.evaluate("!!document.querySelector('dialog.td-dlg .td-fold-history[open]')") and f.count(): f.first.click(); pg.wait_for_timeout(300)
    txt=pg.locator('dialog.td-dlg').inner_text()
    check('C16 the card\'s history reads the merge in words', 'A second entry of this same tender was merged' in txt, txt[-700:])
    pg.keyboard.press('Escape'); pg.reload(); pg.wait_for_timeout(1500)
    check('C17 after reopening the register is still tidy', len(pg.evaluate(STATE))==3)
    for lang,dark in (('ar',False),('ur',True)):
        pg.select_option('#lang-select',lang); pg.wait_for_timeout(300)
        if dark: pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
        pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(600)
        bad=pg.evaluate("()=>document.body.innerText.match(/td_cl_\\w+|td_mail_not_tender|td_history_merged/g)")
        check(f'C18 no raw key shows in {lang}', not bad, bad)
    check('C19 no page error', not errs, errs)
    b.close()
h.shutdown()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); raise SystemExit(1 if fails else 0)
