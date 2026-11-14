# ADR-0127: the least-touch tender flow. The manager's name fills «file owner»; a study workbook dropped anywhere on the page fills
# its tender, stays attached and moves it to «In preparation» (with Undo); a «do not bid» study declines with its reason; any
# other dropped file asks once — which tender, what it is — and a final offer makes the tender «Ready». Made-up data only.
import threading, http.server, socketserver, functools, os, sys, json, tempfile, pathlib, base64
from playwright.sync_api import sync_playwright
import openpyxl
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9304'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
tmp=tempfile.mkdtemp(); P=lambda n: os.path.join(tmp,n)
json.dump({'schema':'afaqy-tenders-from-mail/v1','to':'2026-11-14','tenders':[{'subject':'منافسة توريد وتركيب كاميرات مراقبة','received':'2026-11-10','from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True},
  {'subject':'منافسة شبكة ألياف','received':'2026-11-11','from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True}]},open(P('reg.json'),'w'),ensure_ascii=False)
wb=openpyxl.Workbook(); wb.active.title='الدراسة'; ws=wb.create_sheet('tender-register')
for r in [['schema','afaqy-tender-study/v1'],['tool','Tender Analyzer 2.1'],['subject','منافسة توريد وتركيب كاميرات مراقبة'],['etimadNo','123456','كراسة.pdf',1,'رقم المنافسة 123456'],['fees',1500,'كراسة.pdf',4,'قيمة الوثائق 1500 ريال'],
          ['bond','2% من قيمة العرض'],['due','2026-12-01','كراسة.pdf',9,'آخر موعد لتقديم العروض'],['dueTime','14:30'],['decision','go'],['decisionWhy','ضمن نطاق أفاقي'],['summary','ملخص']]: ws.append(r)
wb.save(P('الدراسة.xlsx'))
wb2=openpyxl.Workbook(); wb2.active.append(['item','qty']); wb2.save(P('BOQ.xlsx'))
json.dump({'schema':'afaqy-tender-study/v1','tool':'Tender Analyzer 2.1','tenders':[{'subject':'منافسة شبكة ألياف','decision':'no-go','decisionWhy':'مقاولات عامة خارج النطاق','dates':{}}]},open(P('nogo.json'),'w'),ensure_ascii=False)
open(P('العرض الفني والمالي.pptx'),'wb').write(b'PK\x03\x04 made-up offer deck')
DROP="""async ([sel, files]) => { const dt = new DataTransfer(); for (const [name, b64] of files) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); dt.items.add(new File([u], name)); }
  const n = document.querySelector(sel); n.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })); n.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); }"""
def drop(pg, sel, names): pg.evaluate(DROP, [sel, [[n, base64.b64encode(open(P(n),'rb').read()).decode()] for n in names]])
ROW="""(needle)=>{const tr=[...document.querySelectorAll('.td-table tr.td-row')].find(r=>r.textContent.includes(needle));return tr?{stage:tr.querySelector('select.td-stage').selectedOptions[0].textContent,need:(tr.querySelector('.td-need-chip')||{}).textContent||''}:null}"""
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1366,'height':900}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    pg.locator('#tenders-body input[type=file][accept^=".json"]').first.set_input_files(P('reg.json')); pg.wait_for_timeout(1500)
    r=pg.evaluate(ROW,'كاميرات'); check('F1 a new tender needs 3 fields', r and r['need'].startswith('3'), r)
    pg.locator('#tenders-body .td-owner-in').fill('Eng Manager'); pg.locator('#tenders-body .td-owner-in').dispatch_event('change'); pg.wait_for_timeout(900)
    r=pg.evaluate(ROW,'كاميرات'); check('F2 the default owner fills «file owner» on open tenders: 2 left to fill', r and r['need'].startswith('2'), r)
    drop(pg,'#tenders-body',['الدراسة.xlsx']); pg.wait_for_timeout(2500)
    r=pg.evaluate(ROW,'كاميرات'); mv=pg.locator('#tenders-body .td-move').count()
    check('F3 the study workbook dropped on the page fills the tender and moves it to «In preparation»; only the estimated value (not in the study) is left', r and r['stage']=='In preparation' and r['need'].startswith('1') and mv==1, (r,mv))
    pg.locator('.td-table tr.td-row', has_text='كاميرات').locator('.td-subj').click(); pg.wait_for_timeout(900)
    w=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg');return {fees:d.querySelector('input.td-fees').value,due:d.querySelector('input.td-due').value,dueTime:d.querySelector('input.td-dueTime').value,files:[...d.querySelectorAll('.td-file b')].map(x=>x.textContent),dec:(d.querySelector('.td-study-dec')||{}).textContent||''}}")
    check('F4 its fields are filled and the workbook stays attached to it', w['fees']=='1500' and w['due']=='2026-12-01' and w['dueTime']=='14:30' and 'الدراسة.xlsx' in w['files'] and 'Bid' in w['dec'], w)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    pg.locator('#tenders-body .td-undo').click(); pg.wait_for_timeout(900)
    r=pg.evaluate(ROW,'كاميرات'); check('F5 Undo puts the stage back', r and r['stage']=='Arrived', r)
    drop(pg,'#tenders-body',['الدراسة.xlsx','nogo.json']); pg.wait_for_timeout(2500)
    r1=pg.evaluate(ROW,'كاميرات'); r2=pg.evaluate(ROW,'ألياف')
    if r2 is None:
        pg.locator('#tenders-body .pills button', has_text='All').first.click(); pg.wait_for_timeout(600); r2=pg.evaluate(ROW,'ألياف'); r1=pg.evaluate(ROW,'كاميرات')
    check('F6 dropped again with a «do not bid» study: the first is preparing, the second is declined', r1 and r1['stage']=='In preparation' and r2 and r2['stage']=='Declined', (r1,r2))
    drop(pg,'#tenders-body',['العرض الفني والمالي.pptx']); pg.wait_for_timeout(1200)
    d=pg.evaluate("()=>{const d=document.querySelector('dialog.td-drop-dlg');return d?{tender:d.querySelector('.td-drop-tender').selectedOptions[0].textContent,kind:d.querySelector('.td-drop-kind').value}:null}")
    check('F7 any other file asks once, offering the only tender being prepared and «final offer»', d and 'كاميرات' in d['tender'] and d['kind']=='offer', d)
    pg.locator('dialog.td-drop-dlg .td-drop-ok').click(); pg.wait_for_timeout(1500)
    r=pg.evaluate(ROW,'كاميرات'); check('F8 the final offer makes the tender «Ready» with no other file', r and r['stage'].startswith('Ready'), r)
    drop(pg,'#tenders-body',['BOQ.xlsx']); pg.wait_for_timeout(1500)
    d=pg.locator('dialog.td-drop-dlg').count(); check('F9 a workbook without the register sheet is asked about, not read as a study', d==1, d)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    # ADR-0128: everything the manager fills is optional — an empty tender closes as «Lost» with no reason and no files
    pg.locator('#tenders-body .pills button', has_text='All').first.click(); pg.wait_for_timeout(500)
    pg.once('dialog', lambda d: d.accept(''))
    sel=pg.locator('.td-table tr.td-row', has_text='ألياف').locator('select.td-stage'); sel.select_option('lost'); pg.wait_for_timeout(1000)
    r=pg.evaluate(ROW,'ألياف'); check('F11 a tender closes as «Lost» with an empty reason, no offer files and empty fields — and asks for nothing after', r and r['stage']=='Lost' and not r['need'], r)
    check('F10 no page error', not errs, errs[:2])
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
