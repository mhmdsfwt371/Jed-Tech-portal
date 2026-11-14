# The Weights page: a type whose two name fields both carry «English | Arabic» is named once, in the reader's language, and no
# table on the page — the simple ones or the advanced ones — scrolls sideways, on a laptop or a phone, in three languages.
import threading, http.server, socketserver, functools, os, sys, json, pathlib, tempfile
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9296'))
OCT=os.environ.get('OCT_PULL','/mnt/user-data/uploads/afaqy-tasks-2026-10-01_2026-10-29.json')
if not os.path.exists(OCT): print('SKIP  no pull file (set OCT_PULL)'); sys.exit(0)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
d=json.load(open(OCT,encoding='utf8'))
names=[('Training Request','طلب تدريب'),('Account Credentials','بيانات الحساب'),('Sensor Installation Follow Up','متابعة تركيب حساس'),('API Integration Support','دعم ربط الواجهة')]
# as MyAFAQY sends them: the same «English | Arabic» text in both fields
d['teamTypes']={'Jeddah After Sales':[{'id':i,'nameEn':f'{e} | {a}','nameAr':f'{e} | {a}'} for i,(e,a) in enumerate(names)],'Jeddah R&D':[{'id':9,'nameEn':'Visit','nameAr':'زيارة'}]}
f=os.path.join(tempfile.mkdtemp(),'pull.json'); json.dump(d,open(f,'w',encoding='utf8'),ensure_ascii=False)
MEASURE="""()=>{const b=document.getElementById('weights-body');const cells=[...b.querySelectorAll('tbody td:first-child > div:first-child')].map(x=>x.textContent.replace(/[\\u2068\\u2069]/g,''));
  const se=document.scrollingElement;return {n:cells.length,pipe:cells.filter(x=>x.includes('|')).slice(0,3),first:cells.slice(0,4),page:se.scrollWidth-se.clientWidth,
  wide:[...b.querySelectorAll('.table-wrap')].map(e=>e.scrollWidth-e.clientWidth).filter(x=>x>2)}}"""
with sync_playwright() as p:
    b=p.chromium.launch()
    for (w,hh,dev) in [(1366,768,'laptop'),(390,844,'phone')]:
        c=b.new_context(viewport={'width':w,'height':hh}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500)
        pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(500); pg.set_input_files('#file-in',f); pg.wait_for_timeout(2500)
        for L in ['en','ar','ur']:
            pg.select_option('#lang-select',L); pg.wait_for_timeout(400); pg.evaluate("location.hash='#weights'"); pg.wait_for_timeout(1100)
            r=pg.evaluate(MEASURE)
            check(f'W1 {dev} {L}: each type is named once, with no «|» and no second copy', r['n']>0 and not r['pipe'], r)
            want='Training Request' if L=='en' else 'طلب تدريب'
            check(f'W2 {dev} {L}: the name is in the reader\'s language', want in r['first'], r['first'])
            check(f'W3 {dev} {L}: no sideways scroll, on the page or inside a table', r['page']<=1 and not r['wide'], r)
            pg.evaluate("document.querySelector('#weights-body .sec-card[data-sec=adv]').click()"); pg.wait_for_timeout(900)
            pg.evaluate("document.querySelectorAll('dialog.sec-dlg details').forEach(d=>d.open=true)"); pg.wait_for_timeout(500)
            r=pg.evaluate(MEASURE.replace("getElementById('weights-body')","querySelector('dialog.sec-dlg[open]')"))
            r['adv']=pg.evaluate("()=>{const d=document.querySelector('dialog.sec-dlg[open]');return d?[!!d.querySelector('.pr-box'),d.querySelectorAll('table.w-cards').length]:null}")
            pg.evaluate("document.querySelector('dialog.sec-dlg').close()"); pg.wait_for_timeout(300)
            check(f'W4 {dev} {L}: the advanced settings open in a window with the rules box and labelled tables, no sideways scroll, no doubled name', r['adv'] and r['adv'][0] and r['adv'][1]>0 and r['page']<=1 and not r['wide'] and not r['pipe'], r)
        check(f'W5 {dev}: no page error', not errs, errs[:2]); c.close()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
