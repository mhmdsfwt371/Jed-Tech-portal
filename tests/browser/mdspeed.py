# v9.90 (ADR-0145, amended): mails first, documents after. Reading the folder used to wait, after each batch of ten mails, for
# every booklet of those mails to be read — 129 mails took most of an hour. Here each document takes 0.4 s to read; all 30 mails
# must be in the register while most documents are still unread, and every document must still be read in the end.
# ADR-0145 (v9.75): the tender mail folder. Power Automate saves every tender mail as a file in a OneDrive folder on the computer;
# the register reads that folder (read only) while it is open. Here the folder is a real directory handle from the browser's own
# private file system, so the real path runs: the handle kept in storage, read again after a reload, permission asked and given,
# files that are new, half-written, repeated or not mails at all. The steps window, three languages, both themes, a phone. Made-up mails.
import threading, http.server, socketserver, functools, os, sys, json, pathlib, datetime
from email.message import EmailMessage
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9347'))
AXE=os.environ.get('AXE_JS') or os.path.join(ROOT,'node_modules','axe-core','axe.min.js')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
now=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)+datetime.timedelta(hours=3)
def eml(subject, mid, hours_ago=5, reply_to=None):
    m=EmailMessage(); m['Subject']=subject; m['From']='Tenders Desk <tenders@example.com>'; m['To']='qa@example.com'
    m['Date']=(now-datetime.timedelta(hours=hours_ago)).strftime('%a, %d %b %Y %H:%M:%S +0300'); m['Message-ID']=f'<{mid}@example.com>'
    if reply_to: m['In-Reply-To']=m['References']=f'<{reply_to}@example.com>'
    m.set_content('منافسة جديدة، والمرفق كراسة الشروط.'); m.add_attachment('كراسة الشروط والمواصفات\n'.encode(), maintype='text', subtype='plain', filename='كراسة الشروط.txt')
    return bytes(m).decode('utf-8')
FLOW="concat(formatDateTime(triggerOutputs()?['body/receivedDateTime'],'yyyy-MM-dd_HHmmss'),'_',guid(),'.eml')"
# the folder: a real directory handle from the private file system. The picker is the one thing replaced — a test cannot press a
# native dialog — and it hands back that folder (or says «cancelled», or is missing, as on a browser without it).
INIT="""(() => {
  const dirName = () => localStorage.getItem('__mdDir') || 'Tender Mail';
  window.__mdWrite = async (name, text, dir) => { const root = await navigator.storage.getDirectory(); const d = await root.getDirectoryHandle(dir || dirName(), { create: true });
    const f = await d.getFileHandle(name, { create: true }); const w = await f.createWritable(); await w.write(text); await w.close(); return true; };
  if (localStorage.getItem('__mdNone') === '1') { delete window.showDirectoryPicker; return; }
  window.showDirectoryPicker = async () => { if (localStorage.getItem('__mdCancel') === '1') throw new DOMException('The user aborted a request.', 'AbortError');
    const root = await navigator.storage.getDirectory(); return root.getDirectoryHandle(dirName(), { create: true }); };
  if (localStorage.getItem('__mdPrompt') === '1') { let given = false; const q = FileSystemHandle.prototype.queryPermission;
    FileSystemHandle.prototype.queryPermission = async function (o) { return given ? q.call(this, o) : 'prompt'; };
    FileSystemHandle.prototype.requestPermission = async function () { given = true; window.__mdAsked = (window.__mdAsked || 0) + 1; return 'granted'; }; }
})();"""
REG="async()=>{const r=indexedDB.open('afaqy-portal',1);const db=await new Promise(o=>{r.onsuccess=()=>o(r.result)});const g=(k)=>new Promise(o=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>o(q.result)});const t=await g('tenders'),m=await g('tdmaildir');return {n:t?t.items.length:0,subjects:t?t.items.map(x=>x.subject).sort():[],msgs:t?t.items.reduce((a,x)=>a+(x.messages||[]).length,0):0,dir:m?{name:m.name,seen:(m.seen||[]).length,handle:!!m.handle&&m.handle.kind}:null}}"
SCAN="(async(sel)=>{const r=await axe.run({include:[sel]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}); return r.violations.map(x=>[x.id,x.nodes.length,x.nodes[0].html.slice(0,110)])})"
def page(c, lang='en'):
    pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: d.dismiss())
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1400); pg.select_option('#lang-select',lang); pg.wait_for_timeout(300); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900)
    return pg,errs
def flags(pg, **kv):   # the switches of the stand-in picker live in this browser's storage; the page is opened again to take them
    pg.evaluate("(kv)=>{for(const [k,v] of Object.entries(kv)){ if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v)}}", kv)
    pg.reload(); pg.wait_for_timeout(1400); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900)
def fresh(b, theme='light', vp=(1366,800), lang='en', kv=None):   # a context with nothing kept — a private window, as the browser sees it
    kw=dict(viewport={'width':vp[0],'height':vp[1]}, service_workers='block', color_scheme=theme)
    if vp[0]<600: kw.update(is_mobile=True, has_touch=True)
    c=b.new_context(**kw); c.add_init_script("(()=>{"+''.join(f"localStorage.setItem('{k}','{v}');" for k,v in (kv or {}).items())+"})();"+INIT)
    pg,errs=page(c,lang); return c,pg,errs
def write(pg, name, text, d=None): pg.evaluate("([n,t,d])=>window.__mdWrite(n,t,d)", [name, text, d])
def read_now(pg, wait=2500):
    pg.locator('#tenders-body .td-dir .md-read').click(); pg.wait_for_timeout(wait)
def line(pg): return pg.locator('#tenders-body .td-dir').inner_text()
def until(pg, fn, secs):
    for _ in range(int(secs*4)):
        if fn(): return True
        pg.wait_for_timeout(250)
    return False

WRAP="""import * as real from './tender-documents.js?real';
export * from './tender-documents.js?real';
export async function readTenderDocument(...a) { await new Promise((r) => setTimeout(r, 400)); return real.readTenderDocument(...a); }"""
COUNT="""async()=>{const r=indexedDB.open('afaqy-portal',1);const db=await new Promise(o=>{r.onsuccess=()=>o(r.result)});const t=await new Promise(o=>{const q=db.transaction('kv').objectStore('kv').get('tenders');q.onsuccess=()=>o(q.result)});
  const items=(t&&t.items)||[];return {n:items.length,read:items.reduce((a,i)=>a+(i.files||[]).filter(f=>f.kind!=='original'&&f.analysis).length,0),docs:items.reduce((a,i)=>a+(i.files||[]).filter(f=>f.kind!=='original').length,0)}}"""
with sync_playwright() as p:
    b=p.chromium.launch()
    c,pg,errs=fresh(b, kv={'__mdDir':'Speed'})
    c.route(lambda u: u.endswith('/assets/tender-documents.js'), lambda r: r.fulfill(status=200, content_type='text/javascript', body=WRAP))
    for k in range(30): write(pg, f'2026-11-{10+k%15:02d}_0900{k:02d}_m{k}.eml', eml(f'منافسة رقم {k} لتوريد كاميرات الموقع {k}', f'speed{k}', hours_ago=40-k))
    pg.locator('#tenders-body .md-connect').click(); pg.wait_for_timeout(1500)
    if pg.locator('#tenders-body .md-all').count(): pg.locator('#tenders-body .md-all').click()
    at=None
    for _ in range(240):
        s=pg.evaluate(COUNT)
        if s['n']>=30: at=s; break
        pg.wait_for_timeout(250)
    check('V1 all 30 mails are in the register while most of their documents are still unread', at is not None and at['read']<=10, at or pg.evaluate(COUNT))
    done=until(pg, lambda: (lambda s: s['docs']>0 and s['read']==s['docs'])(pg.evaluate(COUNT)), 60)
    check('V2 and every document is still read afterwards', done, pg.evaluate(COUNT))
    pg.wait_for_timeout(800)
    read_now(pg, 2000)
    toast=pg.evaluate("()=>[...document.querySelectorAll('.toast, [role=status]')].map(e=>e.textContent).join(' | ')")
    check('V3 «Read now» with nothing new says so, with the number of files', 'No new email in the folder' in toast and '30' in toast, toast)
    check('V4 no page error', not errs, errs)
    b.close()
h.shutdown()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); raise SystemExit(1 if fails else 0)
