# ADR-0147 (v9.77): «Read the booklets again». Tenders registered before v9.76 had their booklet read without its Hijri dates table;
# this reads every open tender's files again. Here three tenders are registered from made-up mails, each carrying a small booklet
# (text) with an Etimad dates table in Hijri; then the register is put back as 9.75 left it (the booklet's dates unknown) and the
# button is pressed: a date found, a mail that disagrees with its booklet waiting for a choice, a date typed by hand left alone.
import threading, http.server, socketserver, functools, os, sys, pathlib, datetime
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
BOOK='كراسة الشروط والمواصفات\nالمرحلة تاريخ الاستحقاق\nإرسال الأسئلة والاستفسارات 15/06/1448\nتقديم العروض 20/06/1448\nفتح العروض\n'
def eml(subject, mid, body):
    m=EmailMessage(); m['Subject']=subject; m['From']='Tenders Desk <tenders@example.com>'; m['To']='qa@example.com'
    m['Date']='Sun, 15 Nov 2026 09:00:00 +0300'; m['Message-ID']=f'<{mid}@example.com>'; m.set_content(body)
    m.add_attachment(BOOK.encode(), maintype='text', subtype='plain', filename='كراسة الشروط.txt'); return bytes(m)
DB="async(fn)=>{const r=indexedDB.open('afaqy-portal',1);const db=await new Promise(o=>{r.onsuccess=()=>o(r.result)});const st=()=>db.transaction('kv','readwrite').objectStore('kv');const t=await new Promise(o=>{const q=st().get('tenders');q.onsuccess=()=>o(q.result)});const n=(new Function('t',fn))(t);if(n){await new Promise(o=>{const q=st().put(n,'tenders');q.onsuccess=()=>o()})}return t.items.map(i=>[i.subject,i.due||'',i.askDue||'',(i.dateSources||{}).due||''])}"
# back to what 9.75 stored: the booklet read without its table, the dates it would have given unknown (a date typed by hand stays)
OLD="t.items=t.items.map(i=>({...i,files:(i.files||[]).map(f=>f.analysis?{...f,analysis:{...f.analysis,schedule:{due:[],askDue:[],visit:[],openAt:[]}}}:f),...((i.dateSources||{}).due==='manual'?{}:{due:(i.messages||[]).some(m=>(m.schedule?.due||[]).length)?'2026-11-19':'',askDue:''}),dateSources:(i.dateSources||{}).due==='manual'?i.dateSources:{...(i.dateSources||{}),due:'mail'}}));return t"
SCAN="(async(sel)=>{const r=await axe.run({include:[sel]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}); return r.violations.map(x=>[x.id,x.nodes.length])})"
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]
    c=b.new_context(viewport={'width':1366,'height':800}, service_workers='block'); pg=c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: d.dismiss())
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1400); pg.select_option('#lang-select','en'); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900)
    check('R1 an empty register offers no «Read the booklets again»', pg.locator('#tenders-body .td-rr-btn').count()==0)
    for k,(s,body) in enumerate([('sample: Reread dash cams','Please find the tender booklet attached.'),('sample: Reread fuel','آخر موعد لتقديم العروض: 2026-11-19'),('sample: Reread typed','Booklet attached.')]):
        pg.locator('#tenders-body input[type=file][accept=".msg,.eml"]').first.set_input_files(files=[{'name':f'm{k}.eml','mimeType':'message/rfc822','buffer':eml(s,f'rr-{k}',body)}]); pg.wait_for_timeout(2500); pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    now=dict((x[0],x) for x in pg.evaluate(DB,''))
    check('R2 v9.76 already reads a new booklet\'s Hijri table on arrival: submission 2026-11-30 (20/06/1448), inquiries 2026-11-25 (15/06/1448)', now['sample: Reread dash cams'][1:3]==['2026-11-30','2026-11-25'], now)
    # the third date is typed by hand; then the register is put back as 9.75 left it
    pg.evaluate(DB,"t.items=t.items.map(i=>i.subject==='sample: Reread typed'?{...i,due:'2026-12-01',dueTime:'',dateSources:{...(i.dateSources||{}),due:'manual'}}:i);return t")
    old=dict((x[0],x) for x in pg.evaluate(DB,OLD)); pg.reload(); pg.wait_for_timeout(1500); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900)
    btn=pg.locator('#tenders-body .td-rr-btn'); check('R3 the button is on the line under the mail drop, and says what it does', btn.count()==1 and 'Hijri' in (btn.get_attribute('title') or ''))
    btn.click(); pg.wait_for_selector('dialog.td-rr-dlg[open]', timeout=30000); pg.wait_for_timeout(300)
    d=pg.evaluate("()=>{const d=document.querySelector('dialog.td-rr-dlg[open]');return {sum:d.querySelector('.td-rr-sum').textContent,items:[...d.querySelectorAll('li')].map(l=>l.innerText),x:document.activeElement===d.querySelector('.dlg-x')}}")
    after=dict((x[0],x) for x in pg.evaluate(DB,''))
    txt=' || '.join(d['items'])
    check('R4 read again: the booklet\'s dates reach the tender registered before it could read them (submission and inquiries found)', after['sample: Reread dash cams'][1:3]==['2026-11-30','2026-11-25'] and 'Submission' in txt and '2026-11-30' in txt, (old['sample: Reread dash cams'],after['sample: Reread dash cams'],txt[:300]))
    check('R5 a mail and its booklet that disagree leave the date to be chosen in the card — not guessed — and the window says so', after['sample: Reread fuel'][1]=='' and 'two different dates' in txt, (after['sample: Reread fuel'],txt[:300]))
    check('R6 a date typed by hand is never changed by the reading', after['sample: Reread typed'][1]=='2026-12-01' and after['sample: Reread typed'][3]=='manual' and 'sample: Reread typed' not in txt, after['sample: Reread typed'])
    check('R7 the window counts what was read and changed, and opens with the focus on «Close»', '3 files in 3 open tenders' in d['sum'] and d['x'], d)
    if os.path.exists(AXE): pg.add_script_tag(path=AXE); v=pg.evaluate(SCAN,'dialog.td-rr-dlg'); check('R8 the WCAG 2.1 A and AA scan passes in the window', not v, v)
    pg.locator('dialog.td-rr-dlg .td-rr-open', has_text='Reread fuel').click(); pg.wait_for_timeout(900)
    card=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg[open]');return d?d.innerText:''}")
    check('R9 a tender\'s name opens its card, where both dates are offered to choose from', 'Reread fuel' in card and '19' in card and '30' in card, card[:200])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    for theme,lang in (('dark','ar'),('light','ur')):
        pg.emulate_media(color_scheme=theme); pg.select_option('#lang-select',lang); pg.wait_for_timeout(600)
        pg.locator('#tenders-body .td-rr-btn').click(); pg.wait_for_selector('dialog.td-rr-dlg[open]', timeout=30000)
        t=pg.evaluate("()=>document.querySelector('dialog.td-rr-dlg[open]').innerText"); dr=pg.evaluate("getComputedStyle(document.querySelector('dialog.td-rr-dlg .td-rr-sum')).direction")
        check(f'R10[{theme}/{lang}] the window in its language, right to left, no raw key', 'td_rr' not in t and dr=='rtl', (t[:120],dr)); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('R11 no page error', not errs, errs[:2]); b.close()
h.shutdown()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
