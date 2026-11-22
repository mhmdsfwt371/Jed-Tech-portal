# ADR-0152 (v9.85): the mail that hands the offer over to the tenders team. A mail from someone other than the tenders team that
# carries the offer deck and the priced BOQ finds its tender — even under a subject of its own — by the words of its subject and
# file names; the message is marked «Offer hand-over», the tender moves to «Submitted» on the mail's day, and no second tender is
# made. A hand-over mail whose tender is not clear is not registered at all and says why. The whole of it survives a reload; Arabic
# and Urdu show no raw key; a hand-over registered by 9.84 as a tender of its own is moved into its tender on opening the page. Made-up people and wording only.
import threading, http.server, socketserver, functools, os, io, tempfile, pathlib
from email.message import EmailMessage
from email.utils import format_datetime
from datetime import datetime, timezone, timedelta
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9331'))
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
def deck():
    from pptx import Presentation
    pr=Presentation(); s=pr.slides.add_slide(pr.slide_layouts[5]); s.shapes.title.text='Sample offer'; b=io.BytesIO(); pr.save(b); return b.getvalue()
def book():
    import openpyxl
    wb=openpyxl.Workbook(); wb.active.append(['Item','Qty','Unit price']); wb.active.append(['Sensor',4,1200]); b=io.BytesIO(); wb.save(b); return b.getvalue()
def mail(name, frm, subject, when, body, files=(), mid=None):
    m=EmailMessage(); m['From']=frm; m['To']='Tenders Team <tenders.team@example.com>'; m['Subject']=subject
    m['Date']=format_datetime(when); m['Message-ID']=f'<{mid or name}@example.com>'; m.set_content(body)
    for fn,data,mt in files: m.add_attachment(data, maintype=mt[0], subtype=mt[1], filename=fn)
    open(P(name),'wb').write(bytes(m))
PPT=('application','vnd.openxmlformats-officedocument.presentationml.presentation'); XL=('application','vnd.openxmlformats-officedocument.spreadsheetml.sheet')
TITLE='sample: Supply and installation of fuel level sensors for the supply station'
mail('arrive.eml','Tenders Desk <a.ibrahim@afaqy.com>',TITLE,datetime(2026,11,10,9,0,tzinfo=KSA),'The booklet is attached. Submission deadline: 2026-12-03 at 10:00 AM')
mail('handover.eml','Sample Engineer <eng.sample@example.com>','The final files',datetime(2026,11,22,14,5,tzinfo=KSA),
     'Dear team,\nThe final technical and financial offer is attached.\n\nBest regards,\nSample Engineer',
     [('Supply and installation of fuel level sensors - supply station.pptx',deck(),PPT),('AFAQY_BOQ_Priced_AR.xlsx',book(),XL)])
mail('unclear.eml','Sample Engineer <eng.sample@example.com>','Files',datetime(2026,11,22,15,0,tzinfo=KSA),'Attached.',
     [('Offer.pptx',deck(),PPT),('BOQ.xlsx',book(),XL)])
DLG="""()=>{const d=document.querySelector('dialog.td-dlg');if(!d||!d.open)return null;
  return {stage:(d.querySelector('select.td-stage')||{}).value||'',all:d.textContent,
    marked:[...d.querySelectorAll('.td-thr-entry')].filter(e=>e.classList.contains('td-thr-on')).map(e=>e.querySelector('.td-thr-who').textContent),
    hist:[...d.querySelectorAll('.td-history-entry')].map(e=>e.textContent),files:[...d.querySelectorAll('.td-file-name,.td-files li,.td-file')].map(e=>e.textContent).join(' | ')}}"""
def drop(pg, f):
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    pg.locator('#tenders-body .td-pull .td-mail-drop input[type=file]').set_input_files(P(f)); pg.wait_for_timeout(2600)
def open_tender(pg):
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    pg.locator('.td-table tr.td-row', has_text='fuel level sensors').locator('.td-subj').click(); pg.wait_for_timeout(900)
    if not pg.evaluate("!!document.querySelector('dialog.td-dlg .td-thread[open]')"):
        b=pg.locator('dialog.td-dlg .td-card-all')
        if b.count(): b.click(); pg.wait_for_timeout(500)
rows=lambda pg: pg.locator('.td-table tr.td-row').count()
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1366,'height':900}, service_workers='block')
    pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    drop(pg,'arrive.eml'); open_tender(pg); d=pg.evaluate(DLG)
    check('H0 the tender arrives from the tenders team and is not handed over', rows(pg)==1 and d and d['stage']=='received' and not d['marked'], d and (d['stage'],d['marked']))
    # before v9.85 this mail, under a subject of its own, became a second tender at «Arrived»
    drop(pg,'handover.eml'); n=rows(pg); open_tender(pg); d=pg.evaluate(DLG)
    check('H1 the hand-over mail under its own subject joins its tender: still one tender', n==1, n)
    check('H2 the tender moves to «Submitted»', d and d['stage']=='submitted', d and d['stage'])
    check('H3 the hand-over message is marked «Offer hand-over», and it is the engineer’s', d and d['marked']==['Sample Engineer'], d and d['marked'])
    check('H4 its history says the offer was handed over, and by whom', d and any('Offer handed over to the tenders team' in x and 'Sample Engineer' in x for x in d['hist']), d and d['hist'][:4])
    check('H5 the deck and the workbook are filed as the offer and the BOQ', d and 'Supply and installation of fuel level sensors' in d['all'] and 'AFAQY_BOQ_Priced_AR.xlsx' in d['all'], d and d['files'][:200])
    sub=pg.evaluate("()=>{const tr=[...document.querySelectorAll('.td-table tr.td-row')].find(r=>r.textContent.includes('fuel level sensors'));return tr?tr.textContent:''}")
    check('H6 the list says «Submitted»', 'Submitted' in sub, sub[:300])
    drop(pg,'unclear.eml'); n=rows(pg); res=pg.locator('#tenders-body .td-pull [role=status]').last.inner_text()
    check('H7 a hand-over mail whose tender is not clear is not registered as a tender', n==1, n)
    check('H8 and it says why, by name', 'unclear.eml' in res and 'could not be told' in res, res[:400])
    pg.reload(); pg.wait_for_timeout(1800); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800); open_tender(pg); d=pg.evaluate(DLG)
    check('H9 after a reload: one tender, «Submitted», the mark on the engineer’s message', rows(pg)==1 and d and d['stage']=='submitted' and d['marked']==['Sample Engineer'], d and (d['stage'],d['marked']))
    drop(pg,'handover.eml'); n=rows(pg); open_tender(pg); d=pg.evaluate(DLG)
    check('H10 the same hand-over mail again is a duplicate: one tender, one mark', n==1 and d and d['marked']==['Sample Engineer'], (n, d and d['marked']))
    # a hand-over mail that an earlier version registered as a tender of its own, as it sits in the browser's store
    pg.evaluate("""()=>new Promise((ok,no)=>{const r=indexedDB.open('afaqy-portal',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('kv','readwrite'),s=tx.objectStore('kv'),g=s.get('tenders');
      g.onsuccess=()=>{const v=g.result;v.items.unshift({id:'final offer',subject:'Final offer',date:'2026-11-23',dateSource:'received',from:'eng.two@example.com',byFrom:false,byKr:false,att:[],status:'open',stage:'received',stageAt:'2026-11-23',
        messages:[{key:'id:stray-1@example.com',messageId:'stray-1@example.com',hash:'x',subject:'Final offer',sender:'eng.two@example.com',date:'2026-11-23',schedule:[],warnings:0}],
        files:[{id:'s1',name:'stray.eml',kind:'original',mailKey:'id:stray-1@example.com',blob:new Blob(['x'])},{id:'s2',name:'Supply and installation of fuel level sensors - supply station.pptx',kind:'other',mailKey:'id:stray-1@example.com',blob:new Blob(['x'])},{id:'s3',name:'BOQ.xlsx',kind:'sheet',mailKey:'id:stray-1@example.com',blob:new Blob(['x'])}],
        thread:[{at:'2026-11-23T10:00',name:'Eng Two',addr:'eng.two@example.com',text:'The final files.'}],activity:[]});s.put(v,'tenders')};tx.oncomplete=()=>ok(1);tx.onerror=()=>no(tx.error)}})""")
    pg.reload(); pg.wait_for_timeout(2200); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900)
    n=rows(pg); stray=pg.locator('.td-table tr.td-row', has_text='Final offer').count(); open_tender(pg); d=pg.evaluate(DLG)
    check('H13 on opening the page, a hand-over registered before as a tender of its own goes into its tender', n==1 and stray==0, (n,stray))
    check('H14 its message joins the conversation marked, and the tender\'s history says where it came from', d and 'Eng Two' in d['marked'] and any('registered as a tender of its own' in x for x in d['hist']), d and (d['marked'], d['hist'][:3]))
    pg.reload(); pg.wait_for_timeout(1800); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800); open_tender(pg); d=pg.evaluate(DLG)
    check('H15 after one more reload both history lines are still there, and nothing moves again', rows(pg)==1 and d and any('Offer handed over' in x for x in d['hist']) and sum('registered as a tender of its own' in x for x in d['hist'])==1, d and d['hist'][:4])
    for lg in ['ar','ur']:
        pg.select_option('#lang-select',lg); pg.wait_for_timeout(500); open_tender(pg)
        raw=pg.evaluate("()=>/td_history_|td_ho_|td_mail_no/.test(document.querySelector('dialog.td-dlg').textContent)")
        check(f'H11[{lg}] the history is written in the language, no raw key', not raw, raw)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('H12 no page error', not errs, errs[:2])
    b.close()
h.shutdown()
print(f'{len(fails)} failed' if fails else 'all passed')
raise SystemExit(1 if fails else 0)
