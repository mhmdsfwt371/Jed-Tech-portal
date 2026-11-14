# ADR-0120: the After-Sales Accounts board on the Team page (a card that opens in a window since v9.49, ADR-0123). A made-up manager pull (no real names or addresses) is uploaded with the
# real October task pull; the board must show the exact totals, systems by customer, segments and accounts per engineer, in three
# languages, on a laptop and a phone, with no raw text key and no sideways scroll. A pull read only in part claims no system figure.
import threading, http.server, socketserver, functools, os, sys, json, re, pathlib, tempfile
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9297'))
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
def rep(complete):
    rows=[{'c':'1','a':['e1'],'d':1200,'g':'Large','y':[['afaqy.pro','Working'],['vss_37','Working'],['vss_17','Blocked']]},
          {'c':'2','a':['e1','e2'],'d':0,'g':'Individual & Small','y':[['afaqy.pro','Disabled']]},
          {'c':'3','a':['e2'],'d':35,'g':'Individual & Small','y':[]},
          {'c':'4','a':[],'d':7,'g':'','y':[['?','Working']]}]
    return {'schema':'afaqy-crm-reports/v1','range':{'from':'2026-11-01','to':'2026-11-14'},'branch':'2','extractedAt':'2026-11-14T12:00:00Z','techPoints':[],'afterSales':{'rows':[]},'activities':{'rows':[]},
            'accounts':{'rows':rows,'unmatched':2,'eng':{'e1':{'en':'Engineer One','ar':'المهندس واحد'},'e2':{'en':'Engineer Two','ar':'المهندس اثنان'}},'systems':{'read':9 if complete else 4,'total':9,'complete':complete}},'notes':['test']}
tmp=tempfile.mkdtemp(); F={k:os.path.join(tmp,f'{k}.json') for k in ['full','part','none']}
json.dump(rep(True),open(F['full'],'w'),ensure_ascii=False); json.dump(rep(False),open(F['part'],'w'),ensure_ascii=False)
none=rep(False); none['extractedAt']='2026-11-14T13:00:00Z'; none['range']={'from':'2026-11-02','to':'2026-11-14'}; none['accounts']['systems']={'read':0,'total':0,'complete':False}; json.dump(none,open(F['none'],'w'),ensure_ascii=False)
OPEN="()=>{const d=document.querySelector('dialog.sec-dlg');if(d&&d.open)d.close();document.querySelector('#team-body .sec-card[data-sec=accounts]').click()}"
RAW=re.compile(r'(?<![\w./@-])[a-z]{1,10}_[a-z0-9]+(?:_[a-z0-9]+)*(?![\w.@-])')
READ="""()=>{const b=document.getElementById('accounts-board');const se=document.scrollingElement;const rows=(sel)=>[...b.querySelectorAll(sel)].map(r=>[...r.cells].map(c=>c.textContent.replace(/[\\u2068\\u2069]/g,'').trim()));
  const tabs=[...b.querySelectorAll('table')];return {tiles:[...b.querySelectorAll('.strip b')].map(x=>x.textContent),sys:rows('table.ab-sys tbody tr'),fam:b.querySelectorAll('.ab-family').length,
  eng:tabs.length?[...tabs[tabs.length-1].tBodies[0].rows].map(r=>[r.cells[0].textContent,r.cells[1].textContent.trim()]):[],page:se.scrollWidth-se.clientWidth,text:b.innerText}}"""
with sync_playwright() as p:
    b=p.chromium.launch()
    for (w,hh,dev) in [(1366,900,'laptop'),(390,844,'phone')]:
        c=b.new_context(viewport={'width':w,'height':hh}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500)
        pg.evaluate("location.hash='#team'"); pg.wait_for_timeout(800); pg.evaluate(OPEN); pg.wait_for_timeout(500)
        check(f'A1 {dev}: with no manager pull the board says where the list comes from', pg.locator('#accounts-board .empty').count()==1)
        pg.evaluate("document.querySelector('dialog.sec-dlg')&&document.querySelector('dialog.sec-dlg').close()"); pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(500); pg.set_input_files('#file-in',[OCT,F['full']]); pg.wait_for_timeout(2800)
        for L in ['en','ar','ur']:
            pg.select_option('#lang-select',L); pg.wait_for_timeout(400); pg.evaluate("location.hash='#team'"); pg.wait_for_timeout(1000); pg.evaluate(OPEN); pg.wait_for_timeout(600)
            r=pg.evaluate(READ)
            check(f'A2 {dev} {L}: totals — 4 accounts, 1,242 devices, 1 with no device, 1 with no engineer', r['tiles']==['4','1,242','1','1'], r['tiles'])
            sysd={x[0]:x[1:] for x in r['sys']}
            check(f'A3 {dev} {L}: systems by customer — afaqy.pro 2 customers, 1 Working, 2 server accounts', sysd.get('afaqy.pro')==['2','1','2','1,200'], r['sys'])
            check(f'A4 {dev} {L}: one VSS family line (two VSS servers, one customer)', r['fam']==1 and sysd.get('vss_37')==['1','1','1','1,200'], (r['fam'],r['sys']))
            want=('Engineer One' if L=='en' else 'المهندس واحد')
            check(f'A5 {dev} {L}: accounts per engineer, named in the reader’s language', r['eng'][:2]==[[want,'2'],['Engineer Two' if L=='en' else 'المهندس اثنان','2']], r['eng'])
            raw=[k for k in set(RAW.findall(r['text'])) if not k.startswith(('afaqy_','vss_','cms_'))]
            check(f'A6 {dev} {L}: no raw text key, no sideways scroll', not raw and r['page']<=1, (raw,r['page']))
        pg.evaluate("document.querySelector('dialog.sec-dlg').close()"); pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(400); pg.set_input_files('#file-in',[F['part']]); pg.wait_for_timeout(2000)
        pg.select_option('#lang-select','en'); pg.evaluate("location.hash='#team'"); pg.wait_for_timeout(900); pg.evaluate(OPEN); pg.wait_for_timeout(600)
        r=pg.evaluate(READ)
        check(f'A7 {dev}: a server list read only in part shows no system figure and says why', not r['sys'] and '4 of 9' in r['text'], r['text'][:300])
        pg.evaluate("document.querySelector('dialog.sec-dlg').close()"); pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(400); pg.set_input_files('#file-in',[F['none']]); pg.wait_for_timeout(2000)
        pg.evaluate("location.hash='#team'"); pg.wait_for_timeout(900); pg.evaluate(OPEN); pg.wait_for_timeout(600); r=pg.evaluate(READ)
        check(f'A8 {dev}: server lists refused — no system figure, and the board says the account may lack access', not r['sys'] and 'Server Management' in r['text'], r['text'][:300])
        check(f'A9 {dev}: no page error', not errs, errs[:2]); c.close()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
