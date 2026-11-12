# ADR-0116 — «Team KPIs» follows the device's owner: the people under him, as MyAFAQY's employees list names them when the pull
# carries it, otherwise as the team file names them. The expected sets are worked out here independently of the portal's code.
import threading, http.server, socketserver, functools, json, os, sys, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9299'))
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
ppl={str(p['id']):p for p in raw['people']}; nm=lambda i: ppl.get(i,{}).get('nameEn') or i
has_task={str(t.get('assigneeId')) for t in raw['tasks']}
def below(root):                                   # everyone under `root` in the team file, at any depth
    out=[]; q=[root]; seen={root}
    while q:
        k=q.pop(0)
        for i,v in team.items():
            if v.get('leaderId')==k and i not in seen: seen.add(i); out.append(i); q.append(i)
    return out
mgr=[k for k,v in team.items() if v.get('covers')][0]
lead=[k for k,v in team.items() if v.get('leaderId')==mgr and below(k)][0]                    # a lead under the manager, with people of his own
sub=[k for k in below(lead) if below(k)]; sublead=sub[0] if sub else None                     # a lead under that lead
leaf=[k for k in below(lead) if not below(k) and k in has_task and not team[k].get('onLeave')][0]   # an engineer with nobody under him (not one on leave)
KEY='afaqy-portal:ownerId'
ROWS="[...document.querySelectorAll('#kpi-body tr.km-row')].map(r=>r.cells[0].innerText.split('\\n')[0].trim())"
NOTE="(()=>{const n=document.querySelector('#kpi-body .km-own-team');return n?{from:n.dataset.from,n:+n.dataset.n,text:n.innerText}:null})()"
def board(pg, owner):
    pg.evaluate("([k,v])=>{ if(v) localStorage.setItem(k,v); else localStorage.removeItem(k); localStorage.removeItem('afaqy-portal:team'); }", [KEY, owner])
    pg.reload(); pg.wait_for_timeout(1300); pg.select_option('#lang-select','en'); pg.evaluate("location.hash='#kpi'"); pg.wait_for_timeout(1500)
    return set(pg.evaluate(ROWS)), pg.evaluate(NOTE)
def up(pg, data, name):
    pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(400); pg.set_input_files('#file-in', files=[{'name':name,'mimeType':'application/json','buffer':json.dumps(data).encode()}]); pg.wait_for_timeout(2300)
names=lambda ids: {nm(i) for i in ids}
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1440,'height':1000}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    pg.goto(f'http://127.0.0.1:{PORT}/#data'); pg.wait_for_timeout(1100); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300); up(pg, raw, 'october.json')
    base, note0 = board(pg, None)
    check(f'T1 with no named owner the board is the manager\'s team from the team file, as before ({len(base)} people), and carries no owner line', len(base)>=5 and note0 is None)
    # --- the lead owns the device; the pull carries no employees list → the team file names his people
    rows, note = board(pg, lead); want=names([i for i in below(lead) if i in ppl])
    check(f'T2 the lead sees exactly the people under him — {len(rows)} of them, the lead under him included — and nobody else', rows==want and len(rows)>=3, (sorted(rows^want)))
    check(f'T3 the board says whose team it is and that the list came from the team file ({note and note["text"][:70]}…)', note and note['from']=='file' and note['n']==len(below(lead)) and nm(lead) in note['text'])
    check('T4 people who are not under him are not on his board', not (rows & names([i for i in ppl if i not in below(lead) and i!=lead])) )
    if sublead:
        r2, n2 = board(pg, sublead); w2=names([i for i in below(sublead) if i in ppl])
        check(f'T5 a lead one level down sees his own {len(r2)} people only', r2==w2 and len(r2)<len(rows) and n2['n']==len(below(sublead)), sorted(r2^w2))
    # --- an engineer with nobody under him
    r3, n3 = board(pg, leaf)
    check(f'T6 an engineer with nobody under him: the page says so plainly, draws no empty tables, and sends him to «My KPIs» ({n3 and n3["text"][:48]}…)', r3==set() and n3 and n3['from']=='none' and nm(leaf) in n3['text'] and pg.locator('#kpi-body table').count()==0 and pg.locator('#kpi-body a[href="#me"]').count()==1)
    # --- now a pull that carries MyAFAQY's employees list: it decides, even where it differs from the team file
    under_lead=[i for i in below(lead) if i in ppl and not below(i)][:3]                      # in MyAFAQY: three engineers sit directly under the lead
    others=[i for i in ppl if i in team and i not in under_lead and i not in (lead, mgr)]
    emp=[{'id':'E1','nameEn':nm(mgr),'nameAr':'','department':'Technical','manager':'','branch':'Jeddah','branchCode':'2','status':'Active'},
         {'id':'E2','nameEn':nm(lead),'nameAr':'','department':'Technical','manager':nm(mgr),'branch':'Jeddah','branchCode':'2','status':'Active'}]
    emp+=[{'id':f'E{10+k}','nameEn':nm(i),'nameAr':'','department':'After Sales','manager':nm(lead),'branch':'Jeddah','branchCode':'2','status':'Active'} for k,i in enumerate(under_lead)]
    emp+=[{'id':f'E{50+k}','nameEn':nm(i),'nameAr':'','department':'After Sales','manager':nm(mgr),'branch':'Jeddah','branchCode':'2','status':'Active'} for k,i in enumerate(others)]
    emp+=[{'id':'E90','nameEn':'Someone Not In Tasks','nameAr':'','department':'After Sales','manager':nm(lead),'branch':'Jeddah','branchCode':'2','status':'Active'},
          {'id':'E91','nameEn':'A Person Who Left','nameAr':'','department':'After Sales','manager':nm(lead),'branch':'Jeddah','branchCode':'2','status':'Inactive'}]
    up(pg, {**raw, 'employees': emp, 'extractedAt': '2026-10-30T09:00:00.000Z'}, 'october-with-employees.json')
    r4, n4 = board(pg, lead)
    check(f'T7 with MyAFAQY\'s employees list in the pull, the lead sees exactly the people MyAFAQY puts under him ({sorted(r4)})', r4==names(under_lead) and n4['from']=='myafaqy' and n4['n']==3, (sorted(r4), n4))
    check('T8 someone under him in MyAFAQY with no task account is named in the note, not silently dropped; a person who left is not counted', 'Someone Not In Tasks' in n4['text'] and 'A Person Who Left' not in n4['text'])
    r5, n5 = board(pg, None)
    check('T9 the manager\'s own board is unchanged by all this', r5==base and n5 is None, sorted(r5^base))
    # --- the same scope on the other team pages
    board(pg, lead); pg.evaluate("location.hash='#readings'"); pg.wait_for_timeout(1200)
    pg.evaluate("location.hash='#dev'"); pg.wait_for_timeout(1300); dev=pg.locator('#view-dev').inner_text()
    outside=[nm(i) for i in others if nm(i) and nm(i) in dev]
    check('T10 the Development page keeps to his people too', not outside, outside[:3])
    check('T11 no page error', not errs, errs[:2])
    b.close()
print(f'\n{"ALL PASS" if not fails else str(len(fails))+" FAIL"}'); sys.exit(1 if fails else 0)
