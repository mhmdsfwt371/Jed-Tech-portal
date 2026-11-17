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
# v9.58 (ADR-0131): the tender's card keeps everything but its summary in folds; a test opens a fold the way a person does
def open_fold(pg, name):
    if not pg.evaluate(f"!!document.querySelector('dialog.td-dlg .td-fold-{name}[open]')"):
        pg.locator(f'dialog.td-dlg .td-fold-{name} > summary').click(); pg.wait_for_timeout(300)
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1366,'height':900}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    pg.locator('#tenders-body input.td-up-in').set_input_files(P('reg.json')); pg.wait_for_timeout(1500)
    r=pg.evaluate(ROW,'كاميرات'); check('F1 a new tender needs 3 fields', r and r['need'].startswith('3'), r)
    # v9.55: every other way in, and the one setting, are folded once the register holds tenders; the fold stays as the manager left it
    fold=pg.evaluate("()=>{const d=document.querySelector('#tenders-body details.td-how');return {open:d.open,inside:['.td-owner-in','.td-add-btn','.td-copy','.td-paste-btn','.td-pst-btn','.td-study-btn'].every(c=>d.querySelector(c)),outside:!!document.querySelector('#tenders-body .td-pull > .td-drop-any .td-any-btn')}}")
    check('F12 with tenders in the register the other ways are folded; «drop or choose the files» stays in front', fold['open'] is False and fold['inside'] and fold['outside'], fold)
    pg.locator('#tenders-body details.td-how > summary').click(); pg.wait_for_timeout(300)
    pg.locator('#tenders-body .td-owner-in').fill('Eng Manager'); pg.locator('#tenders-body .td-owner-in').dispatch_event('change'); pg.wait_for_timeout(900)
    check('F13 the fold stays open after the page redraws', pg.evaluate("document.querySelector('#tenders-body details.td-how').open") is True)
    r=pg.evaluate(ROW,'كاميرات'); check('F2 the default owner fills «file owner» on open tenders: 2 left to fill', r and r['need'].startswith('2'), r)
    pg.locator('#tenders-body .td-drop-any input[type=file]').set_input_files(P('الدراسة.xlsx')); pg.wait_for_timeout(2500)   # «or choose the files»: the same routing as a drop
    r=pg.evaluate(ROW,'كاميرات'); mv=pg.locator('#tenders-body .td-move').count()
    check('F3 the study workbook dropped on the page fills the tender and moves it to «In preparation»; only the estimated value (not in the study) is left', r and r['stage']=='In preparation' and r['need'].startswith('1') and mv==1, (r,mv))
    mvd=pg.evaluate("()=>{const p=document.querySelector('#tenders-body .td-move');const t=p.querySelector('span').textContent;return {dir:getComputedStyle(p).direction,first:t.indexOf('moved to'),iso:t.includes('\\u2068')&&t.includes('\\u2069')}}")
    check('F20 an Arabic tender name inside the English sentence does not turn the sentence around: the line keeps the page’s direction and the name is isolated', mvd['dir']=='ltr' and mvd['iso'], mvd)
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
    # v9.55: the same file means the same thing wherever it is added — from the tender's own window too (the only way on a phone)
    json.dump({'schema':'afaqy-tenders-from-mail/v1','to':'2026-11-14','tenders':[{'subject':'منافسة أنظمة تتبع','received':'2026-11-13','from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True},
      {'subject':'منافسة حساسات وقود','received':'2026-11-13','from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True}]},open(P('reg2.json'),'w'),ensure_ascii=False)
    pg.locator('#tenders-body input.td-up-in').set_input_files(P('reg2.json')); pg.wait_for_timeout(1500)
    wb3=openpyxl.Workbook(); ws3=wb3.active; ws3.title='tender-register'
    for row in [['schema','afaqy-tender-study/v1'],['subject','اسم آخر في الدراسة'],['etimadNo','556677'],['fees','1,200 ريال'],['value','حسب جدول الكميات'],['due','2026-12-20 13:00'],['visit','15/12/2026']]: ws3.append(row)
    wb3.save(P('دراسة التتبع.xlsx'))
    pg.locator('.td-table tr.td-row', has_text='أنظمة تتبع').locator('.td-subj').click(); pg.wait_for_timeout(900)
    pg.locator('dialog.td-dlg .td-file-controls input[type=file]').first.set_input_files(P('دراسة التتبع.xlsx')); pg.wait_for_timeout(2500)
    w=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg');return d?{no:d.querySelector('input.td-etimadNo').value,fees:d.querySelector('input.td-fees').value,value:(d.querySelector('input.td-value')||{value:''}).value,due:d.querySelector('input.td-due').value,dueTime:d.querySelector('input.td-dueTime').value,visit:d.querySelector('input.td-visit').value,files:[...d.querySelectorAll('.td-file b')].map(x=>x.textContent)}:null}")
    check('F14 a study workbook added from the tender’s own «add files» fills that tender (its subject need not match) and stays attached; an amount and a date written as text are read',
          w and w['no']=='556677' and w['fees']=='1200' and w['due']=='2026-12-20' and w['dueTime']=='13:00' and 'دراسة التتبع.xlsx' in w['files'], w)
    check('F15 what the study held but could not be read is left empty, never guessed', w and w['value']=='' and w['visit']=='', w)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    skip=pg.evaluate("()=>[...document.querySelectorAll('#tenders-body .td-study-res .td-study-skip')].map(p=>p.textContent)")
    check('F16 and the page says which values it left out, by name', len(skip)==1 and 'Estimated value' in skip[0] and 'Site-visit' in skip[0], skip)
    pg.locator('#tenders-body .td-study-close').click(); pg.wait_for_timeout(400)
    check('F17 the result block can be put away', pg.locator('#tenders-body .td-study-res').count()==0)
    pg.locator('.td-table tr.td-row', has_text='أنظمة تتبع').locator('.td-subj').click(); pg.wait_for_timeout(900)
    pg.locator('dialog.td-dlg .td-file-controls select.td-pick').select_option('offer')
    pg.locator('dialog.td-dlg .td-file-controls input[type=file]').first.set_input_files(P('العرض الفني والمالي.pptx')); pg.wait_for_timeout(1500)
    st=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg');return d?d.querySelector('select.td-stage').selectedOptions[0].textContent:null}")
    check('F18 a file added in the window as «final offer» makes the tender «Ready» — it used to need a drop', st and st.startswith('Ready'), st)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    pg.locator('.td-table tr.td-row', has_text='حساسات وقود').locator('.td-subj').click(); pg.wait_for_timeout(900)
    pg.locator('dialog.td-dlg .td-file-controls select.td-pick').select_option('other')
    pg.locator('dialog.td-dlg .td-file-controls input[type=file]').first.set_input_files(P('العرض الفني والمالي.pptx')); pg.wait_for_timeout(1800)
    st0=pg.evaluate("()=>document.querySelector('dialog.td-dlg select.td-stage').selectedOptions[0].textContent")
    open_fold(pg,'files'); pg.locator('dialog.td-dlg select.td-file-kind').first.select_option('offer'); pg.wait_for_timeout(1500)
    st1=pg.evaluate("()=>document.querySelector('dialog.td-dlg select.td-stage').selectedOptions[0].textContent")
    check('F19 naming a file already on the tender «final offer» does the same', st0=='Arrived' and st1.startswith('Ready'), (st0,st1))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    check('F10 no page error', not errs, errs[:2])
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
