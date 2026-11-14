# ADR-0125: «My projects» splits into tenders and upselling (with «not sorted» for no clear signal), the split filters every page,
# «Delete all shown» saves a backup file first and removes only what the page shows, and the backup puts everything back.
import threading, http.server, socketserver, functools, os, sys, json, tempfile, pathlib, re
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9302'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
tmp=tempfile.mkdtemp(); reg=os.path.join(tmp,'register.json')
it=lambda i,name,kind,cat='':{'id':i,'name':name,'client':'Client '+i,'kind':kind,'cat':cat,'status':'submitted','value':1000,'date':'2026-11-01','period':'2026','match':[],'not':[]}
json.dump({'schema':'afaqy-projects-register/v1','asOf':'2026-11-14','items':[it('a','Offer to an existing client','commercial'),it('b','Public bid with a booklet','tender'),it('c','A big project','project'),it('d','Chosen as upselling','project','upsell')],'board':[],'mail':{}},open(reg,'w'))
PILLS="()=>Object.fromEntries([...document.querySelectorAll('#proj-dlg .proj-lines button')].map(b=>[b.dataset.line,+(b.textContent.match(/\\((\\d+)\\)/)||[0,-1])[1]]))"
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1366,'height':900}, service_workers='block', accept_downloads=True); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.on('dialog', lambda d: d.accept())
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900)
    pg.locator('#tenders-body button.linkish', has_text='Projects').first.click(); pg.wait_for_timeout(1500)
    pg.locator('#proj-dlg input[type=file]').first.set_input_files(reg); pg.wait_for_timeout(1200)
    n=pg.evaluate(PILLS)
    check('P1 the split counts: all 4, tenders 1, upselling 2 (one chosen by hand), not sorted 1', n=={'all':4,'tender':1,'upsell':2,'none':1}, n)
    pg.locator('#proj-dlg .proj-pages button', has_text='What we bid on').first.click(); pg.wait_for_timeout(700)
    pg.locator('#proj-dlg .proj-lines button[data-line=upsell]').click(); pg.wait_for_timeout(700)
    names=pg.evaluate("[...document.querySelectorAll('#proj-dlg .proj-tbl tbody tr td:first-child > div:first-child')].map(x=>x.textContent)")
    check('P2 «Upselling» filters the bids page to the two upselling projects, each with its line chip', sorted(names)==['Chosen as upselling','Offer to an existing client'] and pg.locator('#proj-dlg .proj-line-upsell').count()==2, names)
    with pg.expect_download() as dl: pg.locator('#proj-dlg .proj-del-all').click()
    path=dl.value.path(); bk=json.load(open(path))
    pg.wait_for_timeout(1000); n=pg.evaluate(PILLS)
    check('P3 «Delete all shown» saved a backup with all 4 first, then removed only the 2 shown', bk.get('backup')=='afaqy-projects-backup/v1' and len(bk['register']['items'])==4 and n.get('all')==2 and n.get('upsell')==0, (n, len(bk.get('register',{}).get('items',[]))))
    pg.locator('#proj-dlg input[type=file]').first.set_input_files(path); pg.wait_for_timeout(1200); n=pg.evaluate(PILLS)
    check('P4 uploading the backup puts all 4 back', n.get('all')==4 and n.get('upsell')==2, n)
    pg.locator('#proj-dlg .proj-lines button[data-line=none]').click(); pg.wait_for_timeout(600)
    pg.locator('#proj-dlg .proj-tbl tbody tr', has_text='A big project').locator('button[title="Edit"]').click(); pg.wait_for_timeout(600)
    pg.locator('dialog.proj-edit select').nth(2).select_option('tender'); pg.locator('dialog.proj-edit button.primary').click(); pg.wait_for_timeout(900)
    n=pg.evaluate(PILLS)
    check('P5 choosing «Tenders» in ✎ Edit moves a not-sorted project to tenders', n.get('tender')==2 and n.get('none')==0, n)
    check('P6 no page error', not errs, errs[:2])
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
