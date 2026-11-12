# ADR-0115 — whose device this is on the manager link. A pull names the account that made it; the manager link then shows that
# person's own page, marks him on the board and gives him his own rights on the Weights page — not the manager named in the team file.
import threading, http.server, socketserver, functools, json, os, sys, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9298'))
OCT=os.environ.get('OCT_PULL','/mnt/user-data/uploads/afaqy-tasks-2026-10-01_2026-10-29.json')
if not os.path.exists(OCT): print('SKIPPED: the real October pull is not here — set OCT_PULL'); sys.exit(0)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
raw=json.load(open(OCT,encoding='utf-8')); team=json.load(open(ROOT+'/team.json',encoding='utf-8'))['people']
mgr=[k for k,v in team.items() if v.get('covers')][0]                      # the manager named in the team file
lead=[k for k,v in team.items() if v.get('leaderId')==mgr and any(x.get('leaderId')==k for x in team.values())][0]   # a lead under him, with people of his own
nm=lambda i: next((p.get('nameEn') for p in raw['people'] if str(p['id'])==i), i)
OWNER="Object.entries(localStorage).filter(([k])=>k.endsWith('ownerId')).map(([k,v])=>v)"
WHO="(document.querySelector('#view-me .me-name')||{}).textContent||''"
def up(pg, data, name):
    pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(400); pg.set_input_files('#file-in', files=[{'name':name,'mimeType':'application/json','buffer':json.dumps(data).encode()}]); pg.wait_for_timeout(2200)
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1440,'height':1000}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    pg.goto(f'http://127.0.0.1:{PORT}/#data'); pg.wait_for_timeout(1100); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    up(pg, raw, 'old-pull.json')                                              # a pull made before v9.35: it names no account
    pg.evaluate("location.hash='#me'"); pg.wait_for_timeout(1200)
    check(f'O1 a pull that names no account: «My KPIs» is the manager named in the team file, as before ({pg.evaluate(WHO)})', pg.evaluate(WHO)==nm(mgr) and pg.evaluate(OWNER)==[] and pg.locator('#datasets .ds-by').count()==0)
    up(pg, {**raw, 'pulledBy': {'id': int(lead), 'name': 'lead.account'}}, 'lead-pull.json')        # the lead's own pull, brought in as a file
    by=pg.locator('#datasets .ds-by'); line=by.first.inner_text() if by.count() else ''
    check(f'O2 the data row says whose account pulled, by his name, and offers «This is my account» ({line[:60]})', nm(lead) in line and pg.locator('#datasets .ds-mine').count()==1)
    pg.evaluate("location.hash='#me'"); pg.wait_for_timeout(1000)
    check('O3 a file brought in by hand does not change whose device this is', pg.evaluate(OWNER)==[] and pg.evaluate(WHO)==nm(mgr))
    pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(400); pg.locator('#datasets .ds-mine').first.click(); pg.wait_for_timeout(600)
    check('O4 «This is my account» makes the device his; the button goes', pg.evaluate(OWNER)==[lead] and pg.locator('#datasets .ds-mine').count()==0)
    pg.evaluate("location.hash='#me'"); pg.wait_for_timeout(1200); txt=pg.locator('#view-me').inner_text()
    check(f'O5 «My KPIs» is now his own page, not the manager\'s ({pg.evaluate(WHO)})', pg.evaluate(WHO)==nm(lead) and nm(mgr) not in pg.evaluate(WHO))
    pg.evaluate("location.hash='#weights'"); pg.wait_for_timeout(1300); pg.evaluate("(d=>d&&(d.open=true))(document.querySelector('.w-adv'))"); pg.wait_for_timeout(400)
    sels=pg.evaluate("[document.querySelectorAll('#weights-body select.w-sel').length, document.querySelectorAll('#weights-body select.w-sel:not(:disabled)').length]")
    W=json.load(open(ROOT+'/weights.json',encoding='utf-8')); may=sum(1 for k,v in (W.get('editors') or {}).items() if lead in [str(x) for x in (v if isinstance(v,list) else [v])])
    check(f'O6 on the Weights page he has his own rights, not the manager\'s: {sels[1]} of {sels[0]} fields open to him', sels[0]>20 and sels[1]<sels[0], (sels, may))
    pg.reload(); pg.wait_for_timeout(1300); pg.evaluate("location.hash='#me'"); pg.wait_for_timeout(1200)
    check('O7 it is remembered after a reload', pg.evaluate(WHO)==nm(lead))
    up(pg, {**raw, 'pulledBy': {'id': int(mgr), 'name': 'manager.account'}, 'range': {'from':'2026-09-01','to':'2026-09-29'}}, 'another.json')
    check('O8 another person\'s file, brought in later, still does not change it', pg.evaluate(OWNER)==[lead])
    check('O9 no page error', not errs, errs[:2]); c.close()
    t=b.new_context(viewport={'width':390,'height':844}, service_workers='block'); tp=t.new_page(); tp.goto(f'http://127.0.0.1:{PORT}/?portal=team#data'); tp.wait_for_timeout(1200)
    check('O10 the engineers\' link is untouched: no account line, no button', tp.locator('.ds-mine').count()==0 and tp.locator('.ds-by').count()==0)
    b.close()
print(f'\n{"ALL PASS" if not fails else str(len(fails))+" FAIL"}'); sys.exit(1 if fails else 0)
