# ADR-0153 (v9.86): a tender's history by the day things happened. Mails of July and August dragged in today read at their own
# times, oldest first, each naming who wrote it — not «today» in the order they were dragged. A tender saved by 9.85 (its lines
# stamped with the import moment) reads the same way on opening. The register says how many mails were written today, and gives
# an Excel of every tender from a chosen day with its stage and what its mails say. Made-up people and wording only.
import threading, http.server, socketserver, functools, os, io, tempfile, pathlib, zipfile
from email.message import EmailMessage
from email.utils import format_datetime
from datetime import datetime, timezone, timedelta
from playwright.sync_api import sync_playwright
import openpyxl
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9333'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
tmp=tempfile.mkdtemp(); P=lambda n: os.path.join(tmp,n)
KSA=timezone(timedelta(hours=3)); NOW=datetime.now(KSA)
def office(part):
    b=io.BytesIO()
    with zipfile.ZipFile(b,'w') as z: z.writestr('[Content_Types].xml','<Types/>'); z.writestr(part,'<sample/>')
    return b.getvalue()
PPT=('application','vnd.openxmlformats-officedocument.presentationml.presentation'); XL=('application','vnd.openxmlformats-officedocument.spreadsheetml.sheet')
def mail(name, frm, subject, when, body, files=(), mid=None, refs=None):
    m=EmailMessage(); m['From']=frm; m['To']='Tenders Team <tenders.team@example.com>'; m['Subject']=subject
    m['Date']=format_datetime(when); m['Message-ID']=f'<{mid or name}@example.com>'
    if refs: m['References']=refs; m['In-Reply-To']=refs
    m.set_content(body)
    for fn,data,mt in files: m.add_attachment(data, maintype=mt[0], subtype=mt[1], filename=fn)
    open(P(name),'wb').write(bytes(m))
T1='sample: Supply of water level sensors for the pumping station'
mail('a1.eml','Tenders Desk <a.ibrahim@afaqy.com>',T1,datetime(2026,7,3,9,10,tzinfo=KSA),'The booklet is attached. Submission deadline: 2026-08-10 at 10:00 AM')
mail('a2.eml','Field Engineer <eng.field@example.com>','RE: '+T1,datetime(2026,7,20,13,0,tzinfo=KSA),'We visited the site.\n\nRegards,\nField Engineer',refs='<a1.eml@example.com>')
mail('a3.eml','Offer Engineer <eng.offer@example.com>','The final files',datetime(2026,8,2,15,30,tzinfo=KSA),'The final offer is attached.\n\nRegards,\nOffer Engineer',
     [('Supply of water level sensors for the pumping station.pptx',office('ppt/presentation.xml'),PPT),('BOQ_Priced.xlsx',office('xl/workbook.xml'),XL)])
T2='sample: Supply of vehicle cameras for the patrol cars'
mail('b1.eml','Tenders Desk <a.ibrahim@afaqy.com>',T2,datetime(2026,6,25,11,0,tzinfo=KSA),'The booklet is attached. Submission deadline: 2026-07-30 at 10:00 AM')
T3='sample: Supply of smart door locks for the office building'
mail('c1.eml','Tenders Desk <a.ibrahim@afaqy.com>',T3,NOW.replace(hour=8,minute=5,second=0,microsecond=0),'The booklet is attached. Submission deadline: 2026-12-20 at 10:00 AM')
HIST="""(sub)=>{const d=document.querySelector('dialog.td-dlg');if(!d||!d.open)return null;
  return [...d.querySelectorAll('.td-history-entry')].map(e=>({at:(e.querySelector('.td-h-at')||{}).textContent||'',text:(e.querySelector('span')||{}).textContent||'',cls:e.className}))}"""
def drop(pg, files):
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    pg.locator('#tenders-body .td-pull .td-mail-drop input[type=file]').set_input_files([P(f) for f in files]); pg.wait_for_timeout(3500)
def open_tender(pg, words):
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    pg.locator('#tenders-body .td-filter .pills .pill-btn').nth(3).click(); pg.wait_for_timeout(400)   # «All»
    pg.locator('.td-table tr.td-row', has_text=words).locator('.td-subj').first.click(); pg.wait_for_timeout(900)
    if not pg.evaluate("!!document.querySelector('dialog.td-dlg .td-fold-history[open]')"):
        f=pg.locator('dialog.td-dlg .td-fold-history > summary')
        if f.count(): f.first.click(); pg.wait_for_timeout(300)
        else:
            b=pg.locator('dialog.td-dlg .td-card-all')
            if b.count(): b.click(); pg.wait_for_timeout(500)
            f=pg.locator('dialog.td-dlg .td-fold-history > summary')
            if f.count(): f.first.click(); pg.wait_for_timeout(300)
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1366,'height':900}, service_workers='block', accept_downloads=True)
    pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    # dragged in today and out of order — the hand-over before the site visit — as a manager catching up would
    drop(pg,['a1.eml']); drop(pg,['a3.eml']); drop(pg,['a2.eml']); drop(pg,['b1.eml']); drop(pg,['c1.eml'])
    open_tender(pg,'water level sensors'); hs=pg.evaluate(HIST)
    mails=[x for x in (hs or []) if 'Email from' in x['text'] or 'Offer handed over' in x['text']]
    ats=[x['at'] for x in mails]
    check('H1 each mail\'s line is at the mail\'s own day and time, not the day it was dragged in', ats[:4]==['03/07/2026 · 09:10','20/07/2026 · 13:00','02/08/2026 · 15:30','02/08/2026 · 15:30'], hs)
    check('H2 the history reads oldest first: arrival, the site visit, then the hand-over', [x['text'][:20] for x in mails][:2]==['Email from Tenders D','Email from Field Eng'] and 'Offer handed over' in mails[3]['text'] if len(mails)>=4 else False, mails)
    check('H3 each mail\'s line names who wrote it', len(mails)>=3 and 'Tenders Desk' in mails[0]['text'] and 'Field Engineer' in mails[1]['text'] and 'Offer Engineer' in mails[2]['text'], mails)
    # a tender saved by 9.85: its lines stamped with the moment of import (today), newest first, no mail time of its own
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    pg.evaluate("""()=>new Promise((ok,no)=>{const r=indexedDB.open('afaqy-portal',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('kv','readwrite'),s=tx.objectStore('kv'),g=s.get('tenders');
      g.onsuccess=()=>{const v=g.result;const now=new Date().toISOString();v.items.push({id:'sample old fuel',subject:'sample: Old fuel tender',date:'2026-07-08',dateSource:'received',from:'a.ibrahim@afaqy.com',byFrom:true,byKr:false,att:[],status:'open',stage:'submitted',stageAt:'2026-07-28',
        messages:[{key:'id:o1@example.com',messageId:'o1@example.com',hash:'h1',subject:'sample: Old fuel tender',sender:'a.ibrahim@afaqy.com',date:'2026-07-08',schedule:{},warnings:0},{key:'id:o2@example.com',messageId:'o2@example.com',hash:'h2',subject:'Final',sender:'eng.old@example.com',date:'2026-07-28',schedule:{},warnings:0}],
        files:[],thread:[{at:'2026-07-08T10:00',name:'Tenders Desk',addr:'a.ibrahim@afaqy.com',text:'booklet'},{at:'2026-07-28T17:45',name:'Old Engineer',addr:'eng.old@example.com',text:'files',mark:'handover'}],
        activity:[{id:'x1',action:'handover',label:'Old Engineer',at:now},{id:'x2',action:'email',label:'Final',at:now},{id:'x3',action:'email',label:'sample: Old fuel tender',at:now}]});s.put(v,'tenders')};tx.oncomplete=()=>ok(1);tx.onerror=()=>no(tx.error)}})""")
    pg.reload(); pg.wait_for_timeout(1800); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    open_tender(pg,'Old fuel tender'); hs=pg.evaluate(HIST)
    check('H4 a tender saved before v9.86 reads by its mails\' own times, oldest first, with the writers', hs and [x['at'] for x in hs]==['08/07/2026 · 10:00','28/07/2026 · 17:45','28/07/2026 · 17:45'] and 'Tenders Desk' in hs[0]['text'] and 'Old Engineer' in hs[1]['text'], hs)
    check('H5 a line dragged in on another day says when it was registered, on hover', hs and all(x for x in pg.evaluate("[...document.querySelectorAll('dialog.td-dlg .td-history-entry')].map(e=>e.title.startsWith('Registered in the portal'))")), pg.evaluate("[...document.querySelectorAll('dialog.td-dlg .td-history-entry')].map(e=>e.title)"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    today=pg.locator('#tenders-body .td-today-mails').inner_text()
    check('H6 the register says how many mails were written today, by each mail\'s own day', today=="Today’s emails: 1 emails for 1 tenders", today)
    # the Excel from a day
    pg.locator('#tenders-body .td-xf-btn').click(); pg.wait_for_timeout(400)
    pg.locator('dialog.td-xf .td-xf-date').fill('2026-07-01'); pg.wait_for_timeout(200)
    n=pg.locator('dialog.td-xf .td-xf-n').inner_text()
    check('H7 the Excel window counts the tenders from the chosen day', n=='3 tenders from this date on', n)
    with pg.expect_download() as dl: pg.locator('dialog.td-xf .td-xf-go').click()
    name=dl.value.suggested_filename; path=P(name); dl.value.save_as(path)
    wb=openpyxl.load_workbook(path); ws=wb.worksheets[0]; rows=[[c.value for c in r] for r in ws.iter_rows()]
    head=rows[0]; col=lambda k: head.index(k)
    subj=[r[col('Tender')] for r in rows[1:]] if 'Tender' in head else []
    check('H8 the Excel has the tenders from 1 July only, oldest first (June\'s is left out)', subj==['sample: Supply of water level sensors for the pumping station','sample: Old fuel tender','sample: Supply of smart door locks for the office building'] and name.startswith('AFAQY-tenders-from-2026-07-01'), (head[:3], subj, name))
    ok9=False
    try:
        r=rows[1]; ok9=(r[col('Number of emails')]==3 and r[col('Offer handed over by')]=='Offer Engineer' and str(r[col('Handed to the tenders team on')]).startswith('2026-08-02 15:30') and r[col('Stage')]=='Submitted')
    except Exception as e: r=str(e)
    check('H9 each row has its stage and what its mails say: how many, the hand-over and who made it', ok9, r)
    check('H10 the Excel keeps two sheets: the list and the months of these tenders only', len(wb.worksheets)==2 and [x[0].value for x in list(wb.worksheets[1].iter_rows())[1:]]==['2026-07', datetime.now(KSA).strftime('%Y-%m')], [x[0].value for x in wb.worksheets[1].iter_rows()])
    pg.reload(); pg.wait_for_timeout(1800); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    open_tender(pg,'water level sensors'); hs=pg.evaluate(HIST)
    check('H11 after a reload the history keeps the mails\' times and writers', hs and [x['at'] for x in hs if 'Email from' in x['text']][:3]==['03/07/2026 · 09:10','20/07/2026 · 13:00','02/08/2026 · 15:30'], hs)
    for lg in ['ar','ur']:
        pg.select_option('#lang-select',lg); pg.wait_for_timeout(500); open_tender(pg,'water level sensors')
        raw=pg.evaluate("()=>/td_history_|td_xf_|td_today_|td_x_/.test(document.querySelector('dialog.td-dlg').textContent+document.querySelector('#tenders-body').textContent)")
        check(f'H12[{lg}] the history and the register are written in the language, no raw key', not raw, raw)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('H13 no page error', not errs, errs[:2])
    b.close()
h.shutdown()
print(f'{len(fails)} failed' if fails else 'all passed')
raise SystemExit(1 if fails else 0)
