# ADR-0122: a tender's details open in a window over the list (no long panel inside it); the fields the stage still needs are
# marked and counted; filling one keeps the window open, updates the count and the list's chip; Escape closes it.
import threading, http.server, socketserver, functools, os, sys, json, tempfile, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9300')); SHOT=os.environ.get('SHOT','')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
f=os.path.join(tempfile.mkdtemp(),'t.json'); json.dump({'schema':'afaqy-tenders-from-mail/v1','to':'2026-11-14','tenders':[{'subject':'منافسة توريد وتركيب كاميرات مراقبة لمبنى الإدارة','received':'2026-11-11','from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True}]},open(f,'w'),ensure_ascii=False)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,hh,dev in [(1366,900,'laptop'),(390,844,'phone')]:
        c=b.new_context(viewport={'width':w,'height':hh}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
        pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
        pg.locator('#tenders-body input[type=file][accept^=".json"]').first.set_input_files(f); pg.wait_for_timeout(1500)
        chip=pg.locator('.td-table .td-need-chip').first.inner_text()
        check(f'W1 {dev}: the list says how many fields are still to fill (3)', chip.startswith('3'), chip)
        pg.locator('.td-table tr.td-row .td-subj').first.click(); pg.wait_for_timeout(900)
        st=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg');return {open:!!(d&&d.open),inline:document.querySelectorAll('.td-table .td-detail').length,need:d?[...d.querySelectorAll('input.td-need')].map(x=>[...x.classList].find(c=>/^td-(?!f$|need$)/.test(c))):[],line:d?d.querySelector('.td-needs').textContent:'',h:d?d.querySelector('.td-dlg-h').textContent:''}}")
        check(f'W2 {dev}: the details open in a window, nothing unfolds inside the list', st['open'] and st['inline']==0 and 'كاميرات' in st['h'], st)
        check(f'W3 {dev}: owner, Etimad number and submission deadline are marked to fill', sorted(st['need'])==['td-due','td-etimadNo','td-owner'] and '(3)' in st['line'], st)
        if SHOT and dev=='laptop': pg.screenshot(path=SHOT)
        pg.locator('dialog.td-dlg input.td-owner').fill('Eng A'); pg.locator('dialog.td-dlg input.td-etimadNo').focus(); pg.wait_for_timeout(900)
        st=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg');return {open:d.open,need:d.querySelectorAll('input.td-need').length,line:d.querySelector('.td-needs').textContent,val:d.querySelector('input.td-owner').value,focus:document.activeElement.className}}")
        check(f'W4 {dev}: filling a field keeps the window open, saves it and drops the count to 2', st['open'] and st['need']==2 and '(2)' in st['line'] and st['val']=='Eng A', st)
        check(f'W5 {dev}: focus stays on the field the manager moved to', 'td-etimadNo' in st['focus'], st['focus'])
        pg.keyboard.press('Escape'); pg.wait_for_timeout(600)
        st=pg.evaluate("()=>({open:!!document.querySelector('dialog.td-dlg[open]'),chip:document.querySelector('.td-table .td-need-chip').textContent,page:document.scrollingElement.scrollWidth-document.scrollingElement.clientWidth})")
        check(f'W6 {dev}: Escape closes it; the list now says 2; no sideways scroll; no page error', not st['open'] and st['chip'].startswith('2') and st['page']<=1 and not errs, (st,errs[:2])); c.close()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
