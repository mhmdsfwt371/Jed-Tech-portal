# ADR-0126: the Tender Analyzer's study file fills the register. From the toolbar a study finds its tender by Etimad number or
# subject and fills only empty fields; a field typed by hand stays and is listed as a difference; filled fields say «from the
# analyzer» with the evidence; the study decision shows in the window; a study for an unknown tender is reported; from a
# tender's window the study goes into that tender. Made-up tenders and studies only.
import threading, http.server, socketserver, functools, os, sys, json, tempfile, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9303'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
tmp=tempfile.mkdtemp(); J=lambda n,o: (json.dump(o,open(os.path.join(tmp,n),'w'),ensure_ascii=False), os.path.join(tmp,n))[1]
reg=J('reg.json',{'schema':'afaqy-tenders-from-mail/v1','to':'2026-11-14','tenders':[{'subject':'منافسة توريد وتركيب كاميرات مراقبة','received':'2026-11-10','from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True},
  {'subject':'منافسة شبكة ألياف','received':'2026-11-11','from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True}]})
study=lambda subj,no='',dec='go': {'subject':subj,'etimadNo':no,'entity':'جهة تجريبية','fees':1500,'bond':'2% من قيمة العرض','value':None,
  'dates':{'askDue':{'date':'2026-11-20','time':''},'visit':{'date':'2026-11-22','time':'10:00'},'due':{'date':'2026-12-01','time':'14:30'},'openAt':{'date':'2026-12-02','time':'10:00'}},
  'decision':dec,'decisionWhy':'ضمن نطاق أفاقي','summary':'ملخص الدراسة','studyFile':'دراسة.pptx','evidence':{'fees':{'file':'كراسة.pdf','page':4,'quote':'قيمة وثائق المنافسة 1500 ريال'}}}
f1=J('s1.json',{'schema':'afaqy-tender-study/v1','generatedAt':'2026-11-14T18:00:00Z','tool':'Tender Analyzer','tenders':[study('منافسة توريد وتركيب كاميرات مراقبة','123456'),study('منافسة لا وجود لها')]})
f2=J('s2.json',{'schema':'afaqy-tender-study/v1','generatedAt':'2026-11-14T18:00:00Z','tool':'Tender Analyzer','tenders':[study('عنوان مختلف تمامًا في الكراسة','999','no-go')]})
bad=J('bad.json',{'schema':'something-else'})
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1366,'height':900}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    pg.locator('#tenders-body input[type=file][accept^=".json"]').first.set_input_files(reg); pg.wait_for_timeout(1500)
    # the deadline typed by hand before the study arrives must stay
    pg.locator('.td-table tr.td-row', has_text='كاميرات').locator('.td-subj').click(); pg.wait_for_timeout(800)
    pg.locator('dialog.td-dlg input.td-due').fill('2026-11-30'); pg.locator('dialog.td-dlg input.td-due').dispatch_event('change'); pg.wait_for_timeout(600)
    pg.locator('dialog.td-dlg input.td-bond').fill('5%'); pg.locator('dialog.td-dlg input.td-bond').dispatch_event('change'); pg.wait_for_timeout(600)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    pg.locator('#tenders-body .td-study-btn + input[type=file]').set_input_files([f1,bad]); pg.wait_for_timeout(1500)
    res=pg.locator('#tenders-body .td-study-res').inner_text()
    check('S1 the toolbar import reports fields filled, differences, the unmatched study and the bad file', 'in 1 tenders' in res and '2 differences' in res and 'لا وجود لها' in res and 'bad.json' in res, res)
    pg.locator('.td-table tr.td-row', has_text='كاميرات').locator('.td-subj').click(); pg.wait_for_timeout(900)
    r=pg.evaluate("""()=>{const d=document.querySelector('dialog.td-dlg');const v=(k)=>d.querySelector('input.td-'+k).value;const tag=(k)=>{const l=d.querySelector('input.td-'+k).closest('label');const i=l&&l.querySelector('.td-auto-an');return i?i.title||'yes':''};
      return {fees:v('fees'),bond:v('bond'),due:v('due'),visit:v('visit'),askDue:v('askDue'),openAt:v('openAt'),etimad:v('etimadNo'),feesTag:tag('fees'),dueTag:tag('due'),visitTag:tag('visit'),dec:(d.querySelector('.td-study-dec')||{}).textContent||''}}""")
    check('S2 empty fields filled from the study (fee, Etimad no., inquiries, visit, opening); the hand-typed deadline and guarantee stay', r['fees']=='1500' and r['etimad']=='123456' and r['askDue']=='2026-11-20' and r['visit']=='2026-11-22' and r['openAt']=='2026-12-02' and r['due']=='2026-11-30' and r['bond']=='5%', r)
    check('S3 filled fields say «from the analyzer» with the evidence; the hand-typed one does not', 'page 4' in r['feesTag'] and 'قيمة وثائق' in r['feesTag'] and r['visitTag'] and not r['dueTag'], r)
    check('S4 the study decision shows in the window', r['dec'].startswith('Study decision: Bid'), r['dec'])
    pg.locator('dialog.td-dlg input.td-fees').fill('2000'); pg.locator('dialog.td-dlg input.td-fees').dispatch_event('change'); pg.wait_for_timeout(700)
    t2=pg.evaluate("()=>{const l=document.querySelector('dialog.td-dlg input.td-fees').closest('label');return !!l.querySelector('.td-auto-an')}")
    check('S5 typing over a filled field makes it the manager’s: the analyzer tag goes', not t2)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    pg.locator('.td-table tr.td-row', has_text='ألياف').locator('.td-subj').click(); pg.wait_for_timeout(800)
    pg.locator('dialog.td-dlg .row input[type=file][accept^=".json"]').set_input_files(f2); pg.wait_for_timeout(1500)
    r=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg');return {open:d.open,fees:d.querySelector('input.td-fees').value,dec:(d.querySelector('.td-study-dec')||{}).textContent||''}}")
    check('S6 from a tender’s own window a study with another title goes into that tender', r['fees']=='1500' and 'Do not bid' in r['dec'], r)
    check('S7 no page error', not errs, errs[:2])
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
