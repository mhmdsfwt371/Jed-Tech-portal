# ADR-0145 (v9.75): the tender mail folder. Power Automate saves every tender mail as a file in a OneDrive folder on the computer;
# the register reads that folder (read only) while it is open. Here the folder is a real directory handle from the browser's own
# private file system, so the real path runs: the handle kept in storage, read again after a reload, permission asked and given,
# files that are new, half-written, repeated or not mails at all. The steps window, three languages, both themes, a phone. Made-up mails.
import threading, http.server, socketserver, functools, os, sys, json, pathlib, datetime
from email.message import EmailMessage
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9346'))
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
with sync_playwright() as p:
    # A stored folder can only be read back by a browser with a profile of its own (a private window cannot — see M19), so the
    # main run uses a persistent profile, as the manager's Chrome is.
    import tempfile
    c=p.chromium.launch_persistent_context(tempfile.mkdtemp(), channel='chromium', viewport={'width':1366,'height':800}, service_workers='block', color_scheme='light')
    c.grant_permissions(['clipboard-read','clipboard-write'], origin=f'http://127.0.0.1:{PORT}'); c.add_init_script(INIT); axe=os.path.exists(AXE)
    if not axe: print('NOTE  the accessibility scan was skipped: run npm ci, or set AXE_JS to axe.min.js')
    pg,errs=page(c)
    row=pg.locator('#tenders-body .td-cmd .td-dir')
    check('M1 the register\'s card offers to connect the mail folder, with the way to set it up and what it does', row.locator('.md-connect').count()==1 and row.locator('.md-how-btn').count()==1 and 'Power Automate saves every tender mail' in line(pg), line(pg)[:120])
    # the steps window
    row.locator('.md-how-btn').click(); pg.wait_for_timeout(700)
    hw=pg.evaluate("()=>{const d=document.querySelector('dialog.md-how[open]');if(!d)return null;const x=d.querySelector(':scope > .tw-head .dlg-x'),h=d.querySelector('h2');return {tw:d.classList.contains('tw'),steps:d.querySelectorAll('.md-steps li').length,code:d.querySelector('.md-code').textContent,row:x.getBoundingClientRect().top<h.getBoundingClientRect().bottom,focus:document.activeElement===x,text:d.innerText}}")
    pg.locator('dialog.md-how .md-copy').click(); pg.wait_for_timeout(400); clip=pg.evaluate("navigator.clipboard.readText()")
    check('M2 «How?» opens the steps in the register\'s frame: eight steps (the last for the mails we send), the trigger and the two actions by their names, the file name ready to copy', hw and hw['tw'] and hw['steps']==8 and hw['code']==FLOW and clip==FLOW and hw['row'] and hw['focus']
        and all(k in hw['text'] for k in ['When a new email arrives (V3)','Export email (V2)','Create file','Always keep on this device','Allow on every visit']), (hw and {k:v for k,v in hw.items() if k!='text'}, clip[:40]))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # cancelling the folder picker changes nothing
    flags(pg, __mdCancel='1'); row.locator('.md-connect').click(); pg.wait_for_timeout(800)
    check('M3 closing the folder picker without choosing changes nothing and says nothing', row.locator('.md-connect').count()==1 and pg.locator('#toast.on').count()==0 and pg.evaluate(REG)['dir'] is None)
    flags(pg, __mdCancel=None)
    # connect an empty folder
    before=pg.evaluate(REG); row.locator('.md-connect').click(); pg.wait_for_timeout(1500); r=pg.evaluate(REG)
    check('M4 connected: the folder is named on the card, read once, kept in this browser — and nothing is registered from an empty folder', 'Tender Mail' in line(pg) and 'nothing new' in line(pg) and r['dir'] and r['dir']['handle']=='directory' and r['n']==before['n'] and pg.locator('#tenders-body .td-dir .md-private').count()==0, (line(pg)[:140], r['dir']))
    # two mails arrive
    write(pg,'2026-11-21_090000_aaa.eml',eml('sample: Folder cameras tender','fold-1',6)); write(pg,'2026-11-21_093000_bbb.eml',eml('sample: Folder fuel sensors','fold-2',5))
    write(pg,'desktop.ini','[.ShellClassInfo]'); write(pg,'~$draft.msg','x'); write(pg,'notes.txt','not a mail')
    pk=pg.evaluate("()=>document.querySelector('#tenders-body .pills button.on')?.textContent"); read_now(pg); r=pg.evaluate(REG)
    st=pg.evaluate("()=>({dlg:document.querySelectorAll('dialog[open]').length,pill:document.querySelector('#tenders-body .pills button.on')?.textContent})")
    toast=pg.locator('#toast').inner_text()
    check('M5 two mails in the folder are registered by «Read now» — the other files are left alone — and nothing opens over the page', r['n']==before['n']+2 and 'sample: Folder cameras tender' in r['subjects'] and st['dlg']==0 and '2 new tenders' in toast and '2 new mails read' in line(pg), (r['n'],r['subjects'],st,toast,line(pg)[:140]))
    # the same mail saved twice, a reply, and a file still being written
    write(pg,'2026-11-21_100000_ccc.eml',eml('sample: Folder cameras tender','fold-1',6)); write(pg,'2026-11-21_101500_ddd.eml',eml('RE: sample: Folder cameras tender','fold-3',2,'fold-1'))
    write(pg,'2026-11-21_102000_eee.eml',''); read_now(pg); r2=pg.evaluate(REG)
    check('M6 twice: the same mail saved twice is not registered again; a reply joins its tender', r2['n']==r['n'] and r2['msgs']==r['msgs']+1, (r['n'],r2['n'],r['msgs'],r2['msgs']))
    write(pg,'2026-11-21_102000_eee.eml',eml('sample: Folder access control','fold-4',1)); read_now(pg); r3=pg.evaluate(REG)
    check('M7 a file still empty when the folder was read is read on a later round, once it is whole', r3['n']==r2['n']+1 and 'sample: Folder access control' in r3['subjects'], (r2['n'],r3['n']))
    check('M8 no page error so far', not errs, errs[:2])
    # opened again: the folder is still there and read by itself; coming back to the page reads it again
    write(pg,'2026-11-21_110000_fff.eml',eml('sample: Folder dash cameras','fold-5',1)); pg.reload(); pg.wait_for_timeout(1500); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(1500)
    r4=pg.evaluate(REG)
    write(pg,'2026-11-21_111500_ggg.eml',eml('sample: Folder RFID gates','fold-6',1)); pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
    got=until(pg, lambda: pg.evaluate(REG)['n']==r4['n']+1, 8)
    check('M9 after a reload the folder is still connected and read by itself; coming back to the page reads it again', r4['n']==r3['n']+1 and 'sample: Folder dash cameras' in r4['subjects'] and got and 'Tender Mail' in line(pg), (r3['n'],r4['n'],got))
    # a browser that asks again on each visit: one press of «Allow», then it reads
    write(pg,'2026-11-21_120000_hhh.eml',eml('sample: Folder weighbridge','fold-7',1)); n0=pg.evaluate(REG)['n']; flags(pg, __mdPrompt='1')
    allow=pg.locator('#tenders-body .td-dir .md-allow'); had=allow.count()==1 and 'Allow on every visit' in line(pg) and pg.evaluate(REG)['n']==n0
    allow.click(); got=until(pg, lambda: pg.evaluate(REG)['n']==n0+1, 8)
    check('M10 when the browser asks again, the card says so and reads nothing until «Allow» is pressed; then it reads', had and got and pg.evaluate('window.__mdAsked')==1, (had,got))
    flags(pg, __mdPrompt=None)
    # a folder that already holds many mails asks first
    pg.locator('#tenders-body .td-dir .md-off').click(); pg.wait_for_timeout(500); flags(pg, __mdDir='Busy Folder')
    for k in range(27): write(pg,f'2026-10-{1+k%28:02d}_0900{k:02d}_old.eml',eml(f'sample: Old tender {k}',f'old-{k}',300+k))
    n0=pg.evaluate(REG)['n']; pg.locator('#tenders-body .td-dir .md-connect').click(); pg.wait_for_timeout(1500)
    ask=pg.locator('#tenders-body .td-dir .md-ask'); asked=ask.count()==1 and '27 mails' in ask.inner_text() and pg.evaluate(REG)['n']==n0
    ask.locator('.md-new').click(); pg.wait_for_timeout(800)
    write(pg,'2026-11-21_130000_new.eml',eml('sample: Folder after connecting','fold-8',1)); read_now(pg); r5=pg.evaluate(REG)
    check('M11 a folder that already holds 27 mails asks before reading them; «From now on only» registers none of them, then reads what arrives', asked and r5['n']==n0+1 and r5['dir']['seen']==28, (asked,n0,r5['n'],r5['dir']))
    pg.locator('#tenders-body .td-dir .md-off').click(); pg.wait_for_timeout(500); flags(pg, __mdDir='Busy Folder 2')
    for k in range(27): write(pg,f'2026-10-{1+k%28:02d}_0900{k:02d}_old.eml',eml(f'sample: Old tender {k}',f'old2-{k}',300+k))
    n0=pg.evaluate(REG)['n']; pg.locator('#tenders-body .td-dir .md-connect').click(); pg.wait_for_timeout(1500); pg.locator('#tenders-body .td-dir .md-ask .md-all').click()
    got=until(pg, lambda: pg.evaluate(REG)['n']==n0+27, 60)
    check('M12 «Read them all» reads the 27 mails ten at a time until the folder is done, and nothing waits', got and 'waiting' not in line(pg), (pg.evaluate(REG)['n']-n0, line(pg)[:120]))
    # disconnecting
    pg.locator('#tenders-body .td-dir .md-off').click(); pg.wait_for_timeout(600); write(pg,'2026-11-21_140000_zzz.eml',eml('sample: Folder after disconnect','fold-9',1))
    pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); pg.wait_for_timeout(1500); r6=pg.evaluate(REG)
    check('M13 «Disconnect» forgets the folder: the card offers to connect again and nothing more is read', r6['dir'] is None and pg.locator('#tenders-body .td-dir .md-connect').count()==1 and 'sample: Folder after disconnect' not in r6['subjects'], r6['dir'])
    check('M14 no page error in the folder\'s flow', not errs, errs[:2])
    # three languages, both themes, the scan — connected again
    flags(pg, __mdDir='Tender Mail'); pg.locator('#tenders-body .td-dir .md-connect').click(); pg.wait_for_timeout(2500)
    for theme,lang in (('dark','ar'),('light','ur'),('dark','en')):
        pg.emulate_media(color_scheme=theme); pg.select_option('#lang-select',lang); pg.wait_for_timeout(700)
        txt=pg.evaluate("()=>document.querySelector('#tenders-body .td-dir').innerText"); pg.locator('#tenders-body .td-dir .md-how-btn').click(); pg.wait_for_timeout(600)
        how=pg.evaluate("()=>document.querySelector('dialog.md-how[open]').innerText"); raw=[k for k in ('md_','td_mail') if k in txt+how]
        dirn=pg.evaluate("getComputedStyle(document.querySelector('dialog.md-how .md-steps')).direction"); code=pg.evaluate("getComputedStyle(document.querySelector('dialog.md-how .md-code')).direction")
        check(f'M15[{theme}/{lang}] the folder line and the steps are written in the language with no raw key; the file name stays left to right', not raw and dirn==('ltr' if lang=='en' else 'rtl') and code=='ltr' and FLOW in how and 'Tender Mail' in txt, (raw,dirn,code,txt[:80]))
        if axe:
            pg.add_script_tag(path=AXE); v=pg.evaluate(SCAN,'dialog.md-how'); pg.keyboard.press('Escape'); pg.wait_for_timeout(300); v2=pg.evaluate(SCAN,'#tenders-body .td-cmd')
            check(f'M16[{theme}/{lang}] the WCAG 2.1 A and AA scan passes in the steps window and on the card with the folder', not v and not v2, (v[:2],v2[:2]))
        else: pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('M17 no page error in three languages and both themes', not errs, errs[:2])
    # v9.76 (ADR-0146): «Check the folder». A folder of its own: two mails registered, a second copy of one, a reply that cannot be
    # placed (two tenders share its subject), a file still empty — then one more arrives that is not read yet.
    pg.select_option('#lang-select','en'); pg.wait_for_timeout(500); pg.locator('#tenders-body .td-dir .md-off').click(); pg.wait_for_timeout(500); flags(pg, __mdDir='Check Folder')
    write(pg,'2026-11-22_080000_c1.eml',eml('sample: Check cameras','ck-1',9)); write(pg,'2026-11-22_080500_c2.eml',eml('sample: Check fuel','ck-2',8))
    write(pg,'2026-11-22_081000_c3.eml',eml('sample: Check cameras','ck-1',9))   # the same mail, saved by the second flow
    write(pg,'2026-11-22_081500_c4.eml',eml('sample: Check twin','ck-3',7)); write(pg,'2026-11-22_081600_c5.eml',eml('sample: Check twin','ck-4',7))
    nodate='\n'.join(l for l in eml('sample: Check no date','ck-5',6).split('\n') if not l.startswith('Date:'))
    write(pg,'2026-11-22_081700_c6.eml',nodate)   # no date anywhere: the importer will not invent an arrival day, so it is not registered
    write(pg,'2026-11-22_081800_c7.eml','')
    pg.locator('#tenders-body .td-dir .md-connect').click(); pg.wait_for_timeout(4000)
    fl=pg.locator('#tenders-body .td-dir .md-failed')
    check('M20 a mail that could not be registered is said under the folder by count, and stays said after another round', fl.count()==1 and 'not registered: 1' in fl.inner_text() and (read_now(pg,2000) or True) and pg.locator('#tenders-body .td-dir .md-failed').count()==1, line(pg)[:200])
    write(pg,'2026-11-22_090000_c8.eml',eml('sample: Check late arrival','ck-6',1))
    pg.locator('#tenders-body .td-dir .md-ck-btn').click(); until(pg, lambda: 'Reading the files' not in (pg.locator('dialog.md-ck-dlg .md-ck-sum').inner_text() if pg.locator('dialog.md-ck-dlg').count() else 'Reading the files'), 20)
    ck=pg.evaluate("()=>{const d=document.querySelector('dialog.md-ck-dlg[open]');if(!d)return null;return {sum:d.querySelector('.md-ck-sum').textContent,rows:[...d.querySelectorAll('tbody tr')].map(r=>[r.dataset.st,r.cells[0].textContent,r.cells[1].textContent,r.cells[2].textContent]),reg:d.querySelector('.md-ck-reg').hidden?'':d.querySelector('.md-ck-reg').textContent,x:document.activeElement===d.querySelector('.dlg-x')}}")
    st={r[1]:r[0] for r in (ck['rows'] if ck else [])}
    check('M21 «Check the folder» says every mail against the register: in which tender, a second copy, not registered and why, not read yet, still being written — problems first, the counts above',
        ck and st.get('2026-11-22_080000_c1.eml')=='in' and st.get('2026-11-22_081000_c3.eml')=='same' and st.get('2026-11-22_081700_c6.eml')=='out' and st.get('2026-11-22_090000_c8.eml')=='wait' and st.get('2026-11-22_081800_c7.eml')=='empty'
        and ck['rows'][0][0]=='out' and 'Mails in the folder: 8' in ck['sum'] and 'In the register: 4, across 3 tenders' in ck['sum'] and 'missing' in ' '.join(r[2] for r in ck['rows'] if r[0]=='out').lower() and 'sample: Check cameras' in ' '.join(r[3] for r in ck['rows']) and ck['x'] and 'Register the ones not in the register (2)' in ck['reg'], ck)
    n0=pg.evaluate(REG)['n']; pg.locator('dialog.md-ck-dlg .md-ck-reg').click()
    ST2="()=>Object.fromEntries([...document.querySelectorAll('dialog.md-ck-dlg tbody tr')].map(r=>[r.cells[0].textContent,r.dataset.st]))"
    until(pg, lambda: pg.evaluate(ST2).get('2026-11-22_090000_c8.eml')=='in', 25); st2=pg.evaluate(ST2)
    check('M22 «Register the ones not in the register» registers the mail not read yet and checks again; the one that cannot be placed stays with its reason', pg.evaluate(REG)['n']==n0+1 and st2.get('2026-11-22_090000_c8.eml')=='in' and st2.get('2026-11-22_081700_c6.eml')=='out', (pg.evaluate(REG)['n']-n0, st2))
    pg.locator('dialog.md-ck-dlg .md-ck-open').first.click(); pg.wait_for_timeout(900)
    op=pg.evaluate("()=>({ck:!!document.querySelector('dialog.md-ck-dlg'),card:document.querySelector('dialog.td-dlg[open] .td-dlg-h')?.textContent||''})")
    check('M23 a tender\'s name in the check opens its card', not op['ck'] and 'sample: Check' in op['card'], op)
    # the card says why it is locked while mails are being read
    write(pg,'2026-11-22_100000_c9.eml',eml('sample: Check while the card is open','ck-7',1))
    # the lock lasts as long as the reading — under a second for one small mail — so it is recorded as it happens, not polled for
    pg.evaluate("()=>{window.__locked=false;const d=document.querySelector('dialog.td-dlg[open]');const see=()=>{if(d.querySelector('.td-dlg-busy')&&d.querySelector('select.td-stage')?.disabled)window.__locked=true};window.__lockObs=new MutationObserver(see);window.__lockObs.observe(d,{subtree:true,childList:true,attributes:true});see()}")
    pg.evaluate("()=>document.querySelector('#tenders-body .td-dir .md-read')?.click()")   # the card is open over the page; the folder is read behind it
    saw=until(pg, lambda: pg.evaluate('window.__locked'), 10)
    back=until(pg, lambda: pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg[open]');return !!d&&!d.querySelector('.td-dlg-busy')&&!d.querySelector('select.td-stage').disabled}"), 20)
    check('M24 while the folder is read, the open card says its stage is locked and why; when the reading ends it opens by itself', saw and back, (saw,back))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    for theme,lang in (('dark','ar'),('light','ur')):
        pg.emulate_media(color_scheme=theme); pg.select_option('#lang-select',lang); pg.wait_for_timeout(600)
        pg.locator('#tenders-body .td-dir .md-ck-btn').click(); until(pg, lambda: pg.locator('dialog.md-ck-dlg tbody tr').count()>0, 20)
        txt=pg.evaluate("()=>document.querySelector('dialog.md-ck-dlg[open]').innerText+document.querySelector('#tenders-body .td-dir').innerText"); raw=[k for k in ('md_ck','md_failed','td_mail') if k in txt]
        dirn=pg.evaluate("getComputedStyle(document.querySelector('dialog.md-ck-dlg .md-ck-sum')).direction"); nm=pg.evaluate("getComputedStyle(document.querySelector('dialog.md-ck-dlg .md-ck-name')).direction")
        v=[]
        if axe: pg.add_script_tag(path=AXE); v=pg.evaluate(SCAN,'dialog.md-ck-dlg')
        check(f'M24[{theme}/{lang}] the check is written in the language with no raw key, the file names stay left to right, and the WCAG scan passes', not raw and dirn=='rtl' and nm=='ltr' and not v, (raw,dirn,nm,v[:2]))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('M24 no page error in the check', not errs, errs[:2]); c.close()
    b=p.chromium.launch(channel='chromium')
    # a private window: the folder is read for the visit, never kept — reading a kept one back there closes the whole browser
    c,pg,errs=fresh(b)
    write(pg,'2026-11-21_150000_prv.eml',eml('sample: Folder private window','fold-10',1)); n0=pg.evaluate(REG)['n']
    pg.locator('#tenders-body .td-dir .md-connect').click(); pg.wait_for_timeout(2000); r7=pg.evaluate(REG)
    said=pg.locator('#tenders-body .td-dir .md-private').count()==1
    pg.reload(); pg.wait_for_timeout(1500); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900)
    alive=pg.locator('#tenders-body .td-dir .md-connect').count()==1
    check('M18 in a private window the folder is read for this visit and said so, nothing is kept, and the page opens again as it was', r7['n']==n0+1 and r7['dir'] is None and said and alive and not errs, (r7['n']-n0, r7['dir'], said, alive, errs[:1]))
    c.close()
    # a browser that cannot open a folder: said on a computer, not shown on a phone
    c,pg,errs=fresh(b,kv={'__mdNone':'1'}); un=line(pg); c.close()
    c,pg,errs=fresh(b,'light',(390,844),'ar',kv={'__mdNone':'1'}); ph=pg.evaluate("()=>{const d=document.querySelector('#tenders-body .td-dir');return d?d.getClientRects().length:0}"); side=pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"); c.close()
    check('M19 a browser that cannot open a folder: on a computer the card says where it works; on a phone it shows nothing', 'Chrome or Edge on a computer' in un and ph==0 and side, (un[:80],ph,side))
    b.close()
h.shutdown()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
