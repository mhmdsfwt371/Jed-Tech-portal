# Every page: opens in three languages with no page error, no failed request, no raw text key; WCAG 2.1 A and AA scan in light and
# dark; no sideways scroll on a phone; the engineers' link opens only its own pages.
import threading, http.server, socketserver, functools, re, os, sys, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9292'))
OCT=os.environ.get('OCT_PULL','/mnt/user-data/uploads/afaqy-tasks-2026-10-01_2026-10-29.json'); AXE=os.environ.get('AXE_JS') or os.path.join(ROOT,'node_modules','axe-core','axe.min.js')   # the pinned dev dependency (npm ci)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
RAW=re.compile(r'(?<![\w./@-])[a-z]{1,10}_[a-z0-9]+(?:_[a-z0-9]+)*(?![\w.@-])')
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1440,'height':1000}, service_workers='block'); pg=c.new_page(); errs=[]; bad=[]
    pg.on('pageerror', lambda e: errs.append(str(e)[:160])); pg.on('requestfailed', lambda r: bad.append(r.url[-70:]) if '127.0.0.1' in r.url else None)
    pg.on('response', lambda r: bad.append(f'{r.status} {r.url[-60:]}') if r.status>=400 and '127.0.0.1' in r.url and not r.url.endswith('favicon.ico') else None)
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500)
    if os.path.exists(OCT): pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(500); pg.set_input_files('#file-in',OCT); pg.wait_for_timeout(2200)
    views=pg.evaluate("[...new Set([...document.querySelectorAll('a[data-view]')].map(a=>a.dataset.view))]")
    check(f'S1 the menu lists the pages ({len(views)}), the new one among them', len(views)>=13 and 'readings' in views, views)
    for L in ['en','ar','ur']:
        pg.select_option('#lang-select',L); pg.wait_for_timeout(500); raw={}; empty=[]
        for v in views:
            pg.evaluate(f"location.hash='#{v}'"); pg.wait_for_timeout(650)
            sec=pg.locator(f'#view-{v}'); txt=sec.inner_text() if sec.count() else ''
            if len(txt.strip())<40: empty.append(v)
            hits=[k for k in set(RAW.findall(txt)) if not k.startswith(('afaqy_','x_','v_'))]
            if hits: raw[v]=hits[:3]
        check(f'S2 {L}: every page opens with content, no raw text key', not raw and not empty, (raw, empty))
    check('S3 no page error and no failed request on any page', not errs and not bad, (errs[:3], bad[:3]))
    pg.select_option('#lang-select','en'); pg.wait_for_timeout(400)
    if os.path.exists(AXE):
        for mode in ['light','dark']:
            # a tall window: the menu must fit without scrolling, or the scanner misreads the background of what sits below the fold
            cx=b.new_context(viewport={'width':1440,'height':1500}, service_workers='block', color_scheme=mode); ap=cx.new_page(); ap.goto(f'http://127.0.0.1:{PORT}/'); ap.wait_for_timeout(1200)
            if os.path.exists(OCT): ap.evaluate("location.hash='#data'"); ap.wait_for_timeout(400); ap.set_input_files('#file-in',OCT); ap.wait_for_timeout(2000)
            ap.select_option('#lang-select','en'); found={}
            for v in views:
                ap.evaluate(f"location.hash='#{v}'"); ap.wait_for_timeout(700); ap.add_script_tag(path=AXE)
                res=ap.evaluate("axe.run({exclude:[['#by-line']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}).then(r=>r.violations.map(x=>[x.id,x.nodes.length,x.nodes[0].html.slice(0,90)]))")
                for i,n,html in res: found[f'{v}:{i}']=(n,html)
            check(f'S4 {mode}: no accessibility violation on {len(views)} pages (WCAG 2.1 A and AA)', not found, dict(list(found.items())[:4]))
            # the by-line is left out of the scan: the scanner misreads the background of the sticky menu's last line (it reports the page's
            # paper behind it). Its contrast is measured here from the pixels themselves instead.
            ap.evaluate("location.hash='#home'"); ap.wait_for_timeout(500); ap.screenshot(path='/tmp/_byline.png')
            from PIL import Image
            box=ap.evaluate("(()=>{const e=document.getElementById('by-line'),r=e.getBoundingClientRect(),c=getComputedStyle(e);return [r.left,r.top,c.color,+c.opacity]})()")
            bg=Image.open('/tmp/_byline.png').convert('RGB').getpixel((int(box[0]+4), int(box[1]+3))); fg=[int(x) for x in re.findall(r'\d+', box[2])[:3]]; fg=[fg[i]*box[3]+bg[i]*(1-box[3]) for i in range(3)]
            lum=lambda c: sum(w*((v/255/12.92) if v/255<=0.03928 else ((v/255+0.055)/1.055)**2.4) for w,v in zip((0.2126,0.7152,0.0722),c))
            a,z=sorted([lum(fg),lum(bg)],reverse=True); ratio=(a+0.05)/(z+0.05)
            check(f'S4 {mode}: the by-line\'s real contrast, measured from the pixels, is {ratio:.1f}:1 (4.5 needed)', ratio>=4.5, (fg,bg)); cx.close()
    else: print('NOTE  the accessibility scan was skipped: run npm ci, or set AXE_JS to axe.min.js')
    m=b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True, service_workers='block'); mp=m.new_page(); mp.goto(f'http://127.0.0.1:{PORT}/'); mp.wait_for_timeout(1200)
    if os.path.exists(OCT): mp.evaluate("location.hash='#data'"); mp.wait_for_timeout(400); mp.set_input_files('#file-in',OCT); mp.wait_for_timeout(2000)
    wide=[]
    for v in views:
        mp.evaluate(f"location.hash='#{v}'"); mp.wait_for_timeout(600)
        if mp.evaluate("document.documentElement.scrollWidth>innerWidth+2"): wide.append(v)
    check(f'S5 on a phone no page scrolls sideways ({len(views)} pages)', not wide, wide)
    tp=m.new_page(); tp.goto(f'http://127.0.0.1:{PORT}/?portal=team#kpi'); tp.wait_for_timeout(1200); landed=[]
    for v in ['kpi','team','data','weights','readings','overtime','tenders']:
        tp.evaluate(f"location.hash='#{v}'"); tp.wait_for_timeout(350); landed.append(tp.evaluate("location.hash"))
    check('S6 the engineers\' link cannot open any manager page', set(landed)=={'#me'}, landed)
    b.close()
print(f'\n{"ALL PASS" if not fails else str(len(fails))+" FAIL"}'); sys.exit(1 if fails else 0)
