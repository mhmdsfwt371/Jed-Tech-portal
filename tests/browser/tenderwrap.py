# v9.46: a long tender subject (Arabic, with RE:/FW:) wraps inside its own cell and never runs over the «First arrived» date —
# laptop, wide screen and phone, no sideways scroll. Made-up tenders, uploaded as an afaqy-tenders-from-mail/v1 file.
import threading, http.server, socketserver, functools, os, sys, json, tempfile, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9299'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
subj=['RE: مشروع تركيب حساسات لقياس مستوى الوقود بمحطة تموين المنطقة بقيادة منطقة المدينة المنورة',
      'FW: منافسة توريد وتركيب وتشغيل كاميرات مراقبة أمنية بالذكاء الاصطناعي لمناطق شمال شرق المدينة المنورة والمرافق التابعة لها مع شبكة ألياف ضوئية متكاملة']
f=os.path.join(tempfile.mkdtemp(),'t.json'); json.dump({'schema':'afaqy-tenders-from-mail/v1','to':'2026-11-14','tenders':[{'subject':s,'received':'2026-11-1%d'%(i+1),'from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True} for i,s in enumerate(subj)]},open(f,'w'),ensure_ascii=False)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,hh,dev in [(1920,990,'wide'),(1366,900,'laptop'),(390,844,'phone')]:
        c=b.new_context(viewport={'width':w,'height':hh}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500)
        pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
        pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
        pg.locator('#tenders-body input.td-up-in').set_input_files(f); pg.wait_for_timeout(1500)
        r=pg.evaluate("""()=>[...document.querySelectorAll('.td-table tr.td-row')].map(tr=>{const s=tr.cells[0].querySelector('.td-subj')||tr.cells[0];return {sw:s.scrollWidth,cw:s.clientWidth}})""")
        check(f'T1 {dev}: both tenders listed', len(r)==2, r)
        check(f'T2 {dev}: each subject fits its cell (wraps instead of running over the next column)', r and all(x['sw']<=x['cw']+1 for x in r), r)
        se=pg.evaluate("document.scrollingElement.scrollWidth-document.scrollingElement.clientWidth")
        check(f'T3 {dev}: no sideways scroll, no page error', se<=1 and not errs, (se,errs[:2])); c.close()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
