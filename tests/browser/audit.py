# suite: alone — it measures frames and fades; run with the machine to itself (scripts/browser-suites.mjs)
# v9.55, the audit (ADR-0129). The smoke suite scans the pages; nothing scanned what opens OVER a page — and that is where the
# audit found text written in the dark theme's own card colour, inputs with no name, tables a keyboard cannot scroll, and sections
# printed blank. This suite opens every window the portal has, in light and dark, and holds each to the same bar:
#   no page error · no raw text key · focus inside · Escape closes · every control has a name · no unreadable text ·
#   (with AXE_JS) the WCAG 2.1 A and AA scan inside the window.
# Then the page-wide promises: a box that scrolls is reachable by keyboard, a hint-only input says its hint, print shows what was
# never scrolled to, and the tender register says when its only copy is old.
import threading, http.server, socketserver, functools, re, os, sys, json, tempfile, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9305'))
OCT=os.environ.get('OCT_PULL','/mnt/user-data/uploads/afaqy-tasks-2026-10-01_2026-10-29.json'); AXE=os.environ.get('AXE_JS') or os.path.join(ROOT,'node_modules','axe-core','axe.min.js')   # the pinned dev dependency (npm ci)
REAL=os.path.exists(OCT)
if not REAL: print('NOTE  no real pull (OCT_PULL): running on the portal’s own sample data — fewer windows have rows')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
NEED=18 if REAL else 12   # windows that must open: the day windows and some cards need pulled tasks
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
tmp=tempfile.mkdtemp(); P=lambda n: os.path.join(tmp,n)
json.dump({'schema':'afaqy-tenders-from-mail/v1','to':'2026-11-14','tenders':[{'subject':'منافسة توريد وتركيب كاميرات مراقبة','received':'2026-11-10','from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True},
  {'subject':'Fleet tracking tender','received':'2026-11-12','from_address':'x@example.com','attachments':['RFP.pdf'],'manual':True}]},open(P('reg.json'),'w'),ensure_ascii=False)
def mgr():   # a made-up manager pull: accounts and an employee list, so the Team windows have rows — no real name or customer
    rows=[{'c':str(k),'a':['e1'] if k%2 else ['e1','e2'],'d':k*10,'g':'Large' if k%3==0 else 'Individual & Small','y':[['afaqy.pro','Working']]} for k in range(1,40)]
    return {'schema':'afaqy-crm-reports/v1','range':{'from':'2026-11-01','to':'2026-11-14'},'branch':'2','extractedAt':'2026-11-14T12:00:00Z','techPoints':[],'afterSales':{'rows':[]},'activities':{'rows':[]},
            'accounts':{'rows':rows,'unmatched':0,'eng':{'e1':{'en':'Engineer One','ar':'المهندس واحد'},'e2':{'en':'Engineer Two','ar':'المهندس اثنان'}},'systems':{'read':9,'total':9,'complete':True}},'notes':['test']}
json.dump(mgr(),open(P('mgr.json'),'w'),ensure_ascii=False)
RAW=re.compile(r'(?<![\w./@-])[a-z]{1,10}_[a-z0-9]+(?:_[a-z0-9]+)*(?![\w.@-])')
# What can open a window, page by page. `all` opens each match in turn; otherwise the first.
OPENERS=[('home','#view-home tr.di-row',False),('home','#view-home .di-now',False),('home','#view-home .cr-num',False),('home','#view-home .help-q',False),
         ('me','#view-me .sec-card',True),('me','#view-me .km-flag',False),('me','#view-me .me-tour-open',False),
         ('kpi','#view-kpi .sec-card',True),('team','#view-team .sec-card',True),('weights','#view-weights .sec-card',True),
         ('tenders','#view-tenders .td-table tr.td-row .td-subj',False),('tenders','#view-tenders .td-paste-btn',False),('tenders','#view-tenders .td-add-btn',False),
         ('tenders','#view-tenders .mail-src button.linkish',True),('home','#by-line',False),('home','#version',False)]
# The state of the top window: text, focus, controls without a name, and text nobody could read (contrast under 3:1 against what
# is really painted behind it — the bar for large text; ordinary text is held to 4.5 by the scanner when AXE_JS is set).
LOOK="""async()=>{const dl=[...document.querySelectorAll('dialog[open]')].pop(); if(!dl) return null;
  // a window fades in: measured mid-fade, every colour reads as the background. Wait for what is moving to arrive (two seconds at most).
  try{ await Promise.race([Promise.all(dl.getAnimations({subtree:true}).filter(a=>a.effect&&a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>0))), new Promise(r=>setTimeout(r,2000))]) }catch(e){}
  const vis=(n)=>{const r=n.getBoundingClientRect(),c=getComputedStyle(n);return r.width>1&&r.height>1&&c.visibility!=='hidden'&&c.display!=='none'};
  const sig=(n)=>n.tagName.toLowerCase()+(n.className&&typeof n.className==='string'?'.'+n.className.trim().split(/\\s+/).slice(0,2).join('.'):'');
  const rgb=(s)=>{const m=(s.match(/[\\d.]+/g)||[]).map(Number);return {r:m[0]||0,g:m[1]||0,b:m[2]||0,a:m.length>3?m[3]:1}};
  const over=(f,b)=>({r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1});
  const lum=(c)=>{const f=(v)=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4};return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b)};
  const behind=(n)=>{const layers=[];let img=false;for(let a=n;a;a=a.parentElement){const cs=getComputedStyle(a);if(cs.backgroundImage&&cs.backgroundImage!=='none')img=true;const c=rgb(cs.backgroundColor);if(c.a>0){layers.push(c);if(c.a>=0.99)break}}
    if(img||!layers.length||layers[layers.length-1].a<0.99)return null;let b=layers.pop();while(layers.length)b=over(layers.pop(),b);return b};
  const dim=[],unnamed=[];
  const w=document.createTreeWalker(dl,NodeFilter.SHOW_TEXT);let x;const seen=new Set();
  while((x=w.nextNode())){const s=x.nodeValue.trim();if(s.length<2)continue;const p=x.parentElement;if(!p||seen.has(p)||!vis(p)||p.closest('[aria-hidden=true],option,select'))continue;seen.add(p);
    if(p.closest(':disabled,[disabled]'))continue;const bg=behind(p);if(!bg)continue;let op=1;for(let a=p;a&&a!==dl.parentElement;a=a.parentElement)op*=+getComputedStyle(a).opacity;
    const fg0=rgb(getComputedStyle(p).color),fg=over({...fg0,a:fg0.a*op},bg);const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    if(ratio<3&&dim.length<6)dim.push(sig(p)+' '+ratio.toFixed(2)+' «'+s.slice(0,24)+'»')}
  const named=(n)=>n.getAttribute('aria-label')||n.getAttribute('aria-labelledby')||n.title||(n.id&&document.querySelector('label[for="'+CSS.escape(n.id)+'"]'))||n.closest('label')||(/^(BUTTON|A|SUMMARY)$/.test(n.tagName)&&(n.textContent||'').trim());
  for(const n of dl.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,summary')){if(vis(n)&&!named(n)&&unnamed.length<6)unnamed.push(sig(n))}
  return {cls:dl.className||dl.id,text:(dl.innerText||'').slice(0,40000),focus:dl.contains(document.activeElement),dim,unnamed}}"""
def boot(b, theme, vp='laptop', lang='en'):
    kw=dict(viewport={'width':1366,'height':800}) if vp=='laptop' else dict(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True)
    c=b.new_context(service_workers='block', color_scheme=theme, accept_downloads=True, **kw); pg=c.new_page(); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: d.dismiss())
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1400); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(400)
    if REAL: pg.set_input_files('#file-in',OCT); pg.wait_for_timeout(2000)
    else: pg.evaluate("document.getElementById('sample-btn').click()"); pg.wait_for_timeout(1800); pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(400)
    pg.set_input_files('#file-in',P('mgr.json')); pg.wait_for_timeout(1300)
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800); pg.locator('#tenders-body input.td-up-in').set_input_files(P('reg.json')); pg.wait_for_timeout(1400)
    if lang!='en': pg.select_option('#lang-select',lang); pg.wait_for_timeout(600)
    return c,pg,errs
def close_all(pg):
    for _ in range(4):
        if pg.evaluate("document.querySelectorAll('dialog[open]').length")==0: return True
        pg.keyboard.press('Escape'); pg.wait_for_timeout(220)
    pg.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())"); return False
def sweep(pg, tag, axe):
    opened=0; bad={'raw':[], 'focus':[], 'unnamed':[], 'dim':[], 'stuck':[], 'axe':[]}
    for view,sel,every in OPENERS:
        pg.evaluate(f"location.hash='#{view}'"); pg.wait_for_timeout(600)
        n=pg.evaluate("(s)=>document.querySelectorAll(s).length", sel)
        for i in range(n if every else min(n,1)):
            before=pg.evaluate("location.hash")
            pg.evaluate("([s,i])=>{const e=document.querySelectorAll(s)[i]; if(e){e.scrollIntoView({block:'center'}); e.click()}}", [sel,i]); pg.wait_for_timeout(650)
            r=pg.evaluate(LOOK); where=f'{view} {sel.split(" ",1)[-1]}[{i}]'
            if not r:
                if pg.evaluate("location.hash")!=before: pg.evaluate(f"location.hash='#{view}'"); pg.wait_for_timeout(500)   # a link to another page, not a window
                continue
            opened+=1
            raw=[k for k in set(RAW.findall(r['text'])) if not k.startswith(('afaqy_','x_','v_'))]
            if raw: bad['raw'].append((where,raw[:3]))
            if not r['focus']: bad['focus'].append(where)
            if r['unnamed']: bad['unnamed'].append((where,r['unnamed']))
            if r['dim']: bad['dim'].append((where,r['dim']))
            if axe:
                pg.add_script_tag(path=AXE)
                v=pg.evaluate("(async()=>{const d=[...document.querySelectorAll('dialog[open]')].pop(); const r=await axe.run({include:[d]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}); return r.violations.map(x=>[x.id,x.nodes.length,x.nodes[0].html.slice(0,90)])})()")
                if v: bad['axe'].append((where,v[:3]))
            if not close_all(pg): bad['stuck'].append(where)
    return opened,bad
with sync_playwright() as p:
    b=p.chromium.launch(); axe=os.path.exists(AXE)
    if not axe: print('NOTE  the in-window accessibility scan was skipped: run npm ci, or set AXE_JS to axe.min.js')
    for theme,lang in [('dark','en'),('light','ar'),('dark','ur')]:
        c,pg,errs=boot(b,theme,'laptop',lang); opened,bad=sweep(pg,f'{theme}/{lang}',axe)
        check(f'A1 {theme}/{lang}: the portal’s windows open ({opened})', opened>=NEED, opened)
        check(f'A2 {theme}/{lang}: no raw text key in any window, focus is inside it, and Escape closes it', not bad['raw'] and not bad['focus'] and not bad['stuck'], (bad['raw'][:2],bad['focus'][:3],bad['stuck'][:3]))
        check(f'A3 {theme}/{lang}: every control in every window has a name', not bad['unnamed'], bad['unnamed'][:3])
        check(f'A4 {theme}/{lang}: no text in any window is unreadable against what is behind it (3:1 at the least)', not bad['dim'], bad['dim'][:4])
        if axe: check(f'A5 {theme}/{lang}: the WCAG 2.1 A and AA scan passes inside every window', not bad['axe'], bad['axe'][:4])
        check(f'A6 {theme}/{lang}: no page error while opening them', not errs, errs[:2]); c.close()
    # --- the phone: windows too, and the boxes that scroll
    c,pg,errs=boot(b,'dark','phone','ar'); opened,bad=sweep(pg,'dark/ar/phone',axe)
    check(f'A7 phone, dark, Arabic: the windows open ({opened}) with names, readable text and no page error', opened>=NEED and not bad['unnamed'] and not bad['dim'] and not bad['raw'] and not errs, (opened,bad['unnamed'][:2],bad['dim'][:3],errs[:2]))
    if axe: check('A8 phone, dark, Arabic: the scan passes inside every window', not bad['axe'], bad['axe'][:4])
    out=[]
    for v in ['kpi','overtime','tenders','dev','readings']:
        pg.evaluate(f"location.hash='#{v}'"); pg.wait_for_timeout(900)
        out+=pg.evaluate("(v)=>[...document.querySelectorAll('#view-'+v+' .table-wrap, #view-'+v+' .td-pipe')].filter(n=>n.getBoundingClientRect().width>1&&(n.scrollWidth>n.clientWidth+2)).map(n=>({v,cls:n.className.slice(0,30),tab:n.tabIndex,name:n.getAttribute('aria-label')||n.getAttribute('aria-labelledby')||''}))", v)
    check(f'A9 on a phone every box that scrolls sideways ({len(out)}) can be reached by keyboard and says what it is', len(out)>=3 and all(o['tab']==0 and o['name'] for o in out), [o for o in out if o['tab']!=0 or not o['name']][:3] or len(out))
    c.close()
    # --- page-wide promises
    c,pg,errs=boot(b,'light')
    pg.evaluate("location.hash='#tools'"); pg.wait_for_timeout(700)
    ph=pg.evaluate("()=>[...document.querySelectorAll('input[placeholder],textarea[placeholder]')].filter(n=>n.type!=='hidden'&&n.placeholder.trim()&&n.getBoundingClientRect().width>1).map(n=>({ph:n.placeholder.slice(0,24),named:!!(n.getAttribute('aria-label')||n.getAttribute('aria-labelledby')||n.title||n.closest('label')||(n.id&&document.querySelector('label[for=\"'+n.id+'\"]')))}))")
    pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(700)
    ph+=pg.evaluate("()=>[...document.querySelectorAll('#view-data textarea[placeholder]')].map(n=>({ph:n.placeholder.slice(0,24),named:!!(n.getAttribute('aria-label')||n.closest('label'))}))")
    check(f'A10 an input whose only name is its grey hint says the hint ({len(ph)} checked)', len(ph)>=2 and all(x['named'] for x in ph), [x for x in ph if not x['named']][:3] or len(ph))
    pg.select_option('#lang-select','ar'); pg.wait_for_timeout(600)
    follows=pg.evaluate("()=>{const n=document.querySelector('#paste');return n.getAttribute('aria-label')===n.placeholder&&/[\\u0600-\\u06FF]/.test(n.placeholder)}")
    check('A11 and the name follows the language', follows)
    pg.select_option('#lang-select','en'); pg.wait_for_timeout(500)
    pg.evaluate("location.hash='#kpi'"); pg.wait_for_timeout(900)
    wait=pg.evaluate("()=>[...document.querySelectorAll('.bt-rv:not(.bt-seen)')].length")
    pg.emulate_media(media='print'); pg.wait_for_timeout(200)
    hid=pg.evaluate("()=>[...document.querySelectorAll('.bt-rv:not(.bt-seen)')].filter(n=>+getComputedStyle(n).opacity<1).length"); pg.emulate_media(media='screen')
    check(f'A12 a section still waiting to be scrolled to ({wait}) is printed, not left blank', wait>=1 and hid==0, (wait,hid))
    # --- the only copy: the tender register says when it has never been backed up, and stops once it is
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900)
    note=pg.locator('#tenders-body .td-backup'); had=note.count()
    with pg.expect_download() as dl: pg.locator('#tenders-body .td-backup-btn').click()
    name=dl.value.suggested_filename; pg.wait_for_timeout(700)
    check('A13 a register that was never backed up says so, saves a backup from the note, and then stops saying it', had==1 and name.startswith('afaqy-portal-backup-') and pg.locator('#tenders-body .td-backup').count()==0, (had,name))
    pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(600)
    last=pg.locator('#bk-last').text_content(); check('A14 the Data page shows when the last backup was saved', re.search(r'20\d\d-\d\d-\d\d', last) is not None, last)
    pg.evaluate("(k)=>{for(const x of Object.keys(localStorage)) if(x.endsWith('bkat')) localStorage.setItem(x,'2026-01-01T00:00:00.000Z')}"); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(300); pg.reload(); pg.wait_for_timeout(1800)
    old=pg.locator('#tenders-body .td-backup').inner_text() if pg.locator('#tenders-body .td-backup').count() else ''
    check('A15 a backup older than a week is said again, with its age in days', re.search(r'\d{2,} days ago', old) is not None, old)
    check('A16 no page error in these checks', not errs, errs[:2]); c.close()
    b.close()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
