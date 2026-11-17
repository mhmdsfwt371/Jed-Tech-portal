# ADR-0130 (v9.57): a tender's correspondence. A reply dropped on the register is read into its messages — writer, time and the
# writer's own words, oldest first; links, phone numbers and signatures are not kept; the tender first seen through a reply takes
# the day of the oldest message; the same mail twice leaves no mark; the hand-over is the manager's mark and the margin to the
# deadline is worked out only from it; the timeline survives a reload; «Correspondence summary» lists it — three languages,
# dark theme, laptop and phone. Made-up people and wording only.
import threading, http.server, socketserver, functools, os, sys, tempfile, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9318'))
AXE=os.environ.get('AXE_JS') or os.path.join(ROOT,'node_modules','axe-core','axe.min.js')   # the pinned dev dependency (npm ci), as the audit suite
SCAN="(async()=>{const d=[...document.querySelectorAll('dialog[open]')].pop(); const r=await axe.run({include:[d]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}); return r.violations.map(x=>[x.id,x.nodes.length,x.nodes[0].html.slice(0,90)])})()"
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
tmp=tempfile.mkdtemp(); P=lambda n: os.path.join(tmp,n)
MAIL='\r\n'.join(['From: Zaid Fares <zaid.fares@example.com>','To: qa@example.com','Subject: RE: sample: Level sensors supply','Message-ID: <thread-b1@example.com>',
  'Date: Mon, 16 Nov 2026 18:30:00 +0300','MIME-Version: 1.0','Content-Type: text/plain; charset=utf-8','',
  'The offer is attached for review.','Offer deck.pptx <https://files.example.com/s/secret-token-123>','','Best regards,','Zaid Fares','M: +966500000003','',
  'From: Lina Harb <lina.harb@example.com>','Sent: Thursday, November 12, 2026 2:26 PM','To: Zaid Fares <zaid.fares@example.com>','Subject: RE: sample: Level sensors supply','',
  'الزملاء الأعزاء،','يرجى العمل على الملفات مع الأخذ في الاعتبار الإطار الزمني.','','Lina Harb','Branch Manager','',
  'From: Rami Qasim <r.qasim@example.com>','Sent: Tuesday, November 10, 2026 9:15 AM','To: Lina Harb <lina.harb@example.com>','Subject: sample: Level sensors supply','',
  'The booklet is attached. Submission deadline: 2026-11-19 at 10:00 AM','','Rami Qasim','+966 50 000 0001',''])
open(P('reply.eml'),'w',encoding='utf-8',newline='').write(MAIL)
THREAD="""()=>{const d=document.querySelector('dialog.td-dlg');if(!d||!d.open)return null;const p=d.querySelector('.td-thread');
  return {open:p.open,head:p.querySelector('summary').textContent,entries:[...p.querySelectorAll('.td-thr-entry')].map(e=>({when:e.querySelector('.td-thr-when').textContent,who:e.querySelector('.td-thr-who').textContent,gist:e.querySelector('.td-thr-gist').textContent,on:e.classList.contains('td-thr-on'),chip:!!e.querySelector('.td-thr-chip'),pressed:e.querySelector('.td-thr-mark').getAttribute('aria-pressed'),more:!!e.querySelector('.td-thr-more')})),
    sum:[...p.querySelectorAll('.td-thr-sum p')].map(x=>x.textContent),all:p.textContent}}"""
# the worst contrast of the panel's own text against what is painted behind it (the nearest ancestor that paints a colour)
CONTRAST="""(sel)=>{const lum=(c)=>{const v=c.map(x=>x/255).map(x=>x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4);return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]};
  const rgb=(s)=>{const m=s.match(/[\\d.]+/g).map(Number);return {c:m.slice(0,3),a:m.length>3?m[3]:1}};
  const bg=(n)=>{for(;n;n=n.parentElement){const b=rgb(getComputedStyle(n).backgroundColor);if(b.a>0.99)return b.c}return [255,255,255]};
  let worst=99,which='';for(const n of document.querySelectorAll(sel)){if(!n.textContent.trim())continue;const f=lum(rgb(getComputedStyle(n).color).c),b=lum(bg(n)),r=(Math.max(f,b)+0.05)/(Math.min(f,b)+0.05);if(r<worst){worst=r;which=n.className}}
  return {worst:Math.round(worst*100)/100,which}}"""
TEXT_SEL='dialog.td-dlg .td-thr-when, dialog.td-dlg .td-thr-who, dialog.td-dlg .td-thr-gist, dialog.td-dlg .td-thr-sum p, dialog.td-dlg .td-thr-chip, dialog.td-dlg .td-thread > .hint, dialog.td-dlg .td-thr-mark'
# The tender's window turns into pages (ADR-0119): what is on a later page is reached the way a person reaches it — with «Next» —
# and pressed where it is seen. A click that scrolls the window by itself would prove nothing about what a person can press.
def reach(pg, loc):
    for _ in range(14):
        bx=loc.bounding_box(); vh=pg.viewport_size['height']
        if bx and bx['height']>0 and bx['y']>=0 and bx['y']+bx['height']<=vh:
            hit=loc.evaluate("(n,[x,y])=>{const h=document.elementFromPoint(x,y);return !!h&&(h===n||n.contains(h))}",[bx['x']+bx['width']/2,bx['y']+bx['height']/2])
            if hit: return bx
        nx=pg.locator('dialog.td-dlg .dlg-pager .dp-next')
        if not nx.count() or nx.is_disabled(): break
        nx.click(); pg.wait_for_timeout(350)
    return None
def press(pg, loc, hold=150):
    bx=reach(pg, loc)
    if not bx: return False
    pg.mouse.move(bx['x']+bx['width']/2,bx['y']+bx['height']/2); pg.mouse.down(); pg.wait_for_timeout(hold); pg.mouse.up(); return True
def open_tender(pg):
    pg.locator('.td-table tr.td-row', has_text='Level sensors').locator('.td-subj').click(); pg.wait_for_timeout(900)
    all_msgs(pg)
# v9.58: the card shows the latest messages; «The whole timeline» opens the conversation's fold
def all_msgs(pg):
    if not pg.evaluate("!!document.querySelector('dialog.td-dlg .td-thread[open]')"): pg.locator('dialog.td-dlg .td-card-all').click(); pg.wait_for_timeout(600)
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1366,'height':900}, service_workers='block'); c.grant_permissions(['clipboard-read','clipboard-write'])
    pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    pg.locator('#tenders-body .td-pull .td-mail-drop input[type=file]').set_input_files(P('reply.eml')); pg.wait_for_timeout(2500)
    card=pg.evaluate("()=>[...document.querySelectorAll('dialog.td-dlg .td-card-msg')].map(x=>x.textContent)")
    check('C0 the card shows the latest messages, newest first, with the conversation folded below', len(card)==3 and 'Zaid Fares' in card[0] and 'Rami Qasim' in card[2] and not pg.evaluate("!!document.querySelector('dialog.td-dlg .td-thread[open]')"), card)
    all_msgs(pg); t=pg.evaluate(THREAD)
    check('C1 the reply opens its tender with the conversation read: three messages, oldest first', t and t['open'] and len(t['entries'])==3 and [e['who'] for e in t['entries']]==['Rami Qasim','Lina Harb','Zaid Fares'], t)
    check('C2 each message carries the time the mail program wrote', t and '10 Nov 2026' in t['entries'][0]['when'] and '09:15' in t['entries'][0]['when'] and '14:26' in t['entries'][1]['when'] and '18:30' in t['entries'][2]['when'], t and [e['when'] for e in t['entries']])
    check('C3 the line under each is the writer’s own words: the greeting is skipped, the signature is cut', t and t['entries'][0]['gist']=='The booklet is attached. Submission deadline: 2026-11-19 at 10:00 AM' and t['entries'][1]['gist']=='يرجى العمل على الملفات مع الأخذ في الاعتبار الإطار الزمني.' and t['entries'][2]['gist']=='The offer is attached for review. · Offer deck.pptx', t and [e['gist'] for e in t['entries']])
    check('C4 no link, no phone number and no signature line reaches the page', t and 'secret-token' not in t['all'] and '+966' not in t['all'] and 'Branch Manager' not in t['all'] and 'Best regards' not in t['all'], t and t['all'][:300])
    check('C5 the summary under the list: messages and writers, and the full working days to the deadline the register read', t and len(t['sum'])>=2 and 'Messages: 3 · writers: 3' in t['sum'][0] and 'the deadline: 6' in t['sum'][1], t and t['sum'])
    check('C6 nothing about a hand-over is said before a message is marked', t and not any('hand-over' in s for s in t['sum']) and not any(e['on'] for e in t['entries']), t and t['sum'])
    row=pg.evaluate("()=>{const tr=[...document.querySelectorAll('.td-table tr.td-row')].find(r=>r.textContent.includes('Level sensors'));return tr?tr.children[1].textContent:''}")
    check('C7 first seen through a reply: the tender takes the day of the oldest message, and the list says so', '2026-11-10' in row and 'oldest message' in row, row)
    # the hand-over mark — a held click, as a person presses (the lesson of v9.56)
    got=press(pg, pg.locator('dialog.td-dlg .td-thr-entry').nth(2).locator('.td-thr-mark')); pg.wait_for_timeout(900)
    t=pg.evaluate(THREAD)
    check('C8a the message is reached with the window’s own «Next», and pressed where it is seen', got)
    check('C8 marking the message that handed the offer over works out its margin to the deadline', t and t['entries'][2]['on'] and t['entries'][2]['chip'] and t['entries'][2]['pressed']=='true' and any('2 d 15 h before the deadline' in s for s in t['sum']), t and t['sum'])
    press(pg, pg.locator('dialog.td-dlg .td-thr-entry').nth(0).locator('.td-thr-mark')); pg.wait_for_timeout(800); t=pg.evaluate(THREAD)
    check('C9 one hand-over message at a time: marking another moves the mark', t and [e['on'] for e in t['entries']]==[True,False,False], t and [e['on'] for e in t['entries']])
    press(pg, pg.locator('dialog.td-dlg .td-thr-entry').nth(2).locator('.td-thr-mark')); pg.wait_for_timeout(800)
    press(pg, pg.locator('dialog.td-dlg .td-thr-entry').nth(2).locator('.td-thr-more summary')); pg.wait_for_timeout(300)
    full=pg.locator('dialog.td-dlg .td-thr-entry').nth(2).locator('.td-thr-text').inner_text()
    check('C10 «Full text» shows the message line by line, still without the signature', full.strip().split('\n')==['The offer is attached for review.','Offer deck.pptx'], full)
    press(pg, pg.locator('dialog.td-dlg .td-thr-copy')); pg.wait_for_timeout(500); clip=pg.evaluate("navigator.clipboard.readText()")
    check('C11 «Copy the timeline» puts the same lines and the same summary on the clipboard', clip.startswith('Correspondence timeline — RE: sample: Level sensors supply') and len([l for l in clip.split('\n') if l.startswith('- ')])==3 and '[Offer hand-over]' in clip and '2 d 15 h before the deadline' in clip, clip[:400])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    # twice: the same mail again leaves no mark
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.locator('#tenders-body .td-pull .td-mail-drop input[type=file]').set_input_files(P('reply.eml')); pg.wait_for_timeout(2000)
    res=pg.locator('#tenders-body .td-pull [role=status]').last.inner_text(); rows=pg.locator('.td-table tr.td-row').count()
    open_tender(pg); t=pg.evaluate(THREAD)
    check('C12 the same mail dropped again is a duplicate: one tender, three messages, the mark kept', 'Duplicates 1' in res and rows==1 and t and len(t['entries'])==3 and t['entries'][2]['on'], (res,rows))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # after a reload
    pg.reload(); pg.wait_for_timeout(1800); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800); open_tender(pg); t=pg.evaluate(THREAD)
    check('C13 after a reload the conversation, its times and the mark are as they were', t and len(t['entries'])==3 and t['entries'][2]['on'] and '18:30' in t['entries'][2]['when'] and any('2 d 15 h before the deadline' in s for s in t['sum']), t and t['sum'])
    press(pg, pg.locator('dialog.td-dlg .td-thr-rebuild')); pg.wait_for_timeout(1500); t=pg.evaluate(THREAD)
    hist=pg.evaluate("()=>[...document.querySelectorAll('dialog.td-dlg .td-history-entry')].filter(x=>x.textContent.includes('Correspondence timeline read')).length")
    check('C14 reading the saved mail again finds nothing new and writes no history line', t and len(t['entries'])==3 and hist==0, hist)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # the summary window
    pg.locator('#tenders-body .td-sum-btn').click(); pg.wait_for_timeout(700)
    s=pg.evaluate("()=>{const d=document.querySelector('dialog.cr-modal');if(!d||!d.open)return null;return {h:d.querySelector('h2').textContent,head:[...d.querySelectorAll('thead th')].map(x=>x.textContent),rows:[...d.querySelectorAll('tbody tr')].map(r=>[...r.children].map(x=>x.textContent)),tiles:[...d.querySelectorAll('.km-tile')].map(x=>x.querySelector('b').textContent+' '+x.querySelector('span').textContent),wide:d.scrollWidth>d.clientWidth+1||d.querySelector('.crm-list').scrollWidth>d.querySelector('.crm-list').clientWidth+1,last:d.querySelector('tbody tr').lastElementChild.getBoundingClientRect().left>=d.getBoundingClientRect().left}}")
    check('C15 «Correspondence summary» opens one row for the tender with the same facts', s and s['h']=='Tender correspondence summary' and len(s['rows'])==1 and len(s['head'])==5 and 'Level sensors' in s['rows'][0][0] and '09:15' in s['rows'][0][1] and 'working days: 6' in s['rows'][0][2] and s['rows'][0][3].startswith('3 · ') and '2 d 15 h before the deadline' in s['rows'][0][4], s)
    check('C16 its tiles count the tenders, the messages and the marked hand-overs; six working days is not «less than a working week»', s and s['tiles'][0].startswith('1 ') and s['tiles'][1].startswith('3 ') and s['tiles'][2].startswith('0 ') and s['tiles'][3].startswith('1 '), s and s['tiles'])
    check('C16b every column of the summary is in view on a laptop — a long tender name wraps instead of pushing the others out', s and not s['wide'] and s['last'], s and (s['wide'],s['last']))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('C17 the summary window closes on Escape', pg.locator('dialog.cr-modal').count()==0)
    # three languages: no raw key, and the Arabic name keeps the sentence in order
    for lg in ['ar','ur']:
        pg.select_option('#lang-select',lg); pg.wait_for_timeout(500); open_tender(pg); t=pg.evaluate(THREAD)
        raw=pg.evaluate("()=>/td_thr_|td_sum_|td_thread_|td_history_thread/.test(document.querySelector('dialog.td-dlg').textContent)")
        dirn=pg.evaluate("()=>getComputedStyle(document.querySelector('dialog.td-dlg .td-thr-sum')).direction")
        check(f'C18[{lg}] the panel is written in the language, right to left, with no raw key and Latin digits in its times', t and len(t['entries'])==3 and not raw and dirn=='rtl' and '2026' in t['entries'][0]['when'] and '(3)' in t['head'], (raw,dirn,t and t['entries'][0]['when']))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        pg.locator('#tenders-body .td-sum-btn').click(); pg.wait_for_timeout(600)
        raw2=pg.evaluate("()=>{const d=document.querySelector('dialog.cr-modal');return d?/td_thr_|td_sum_/.test(d.textContent):true}")
        check(f'C19[{lg}] and so is the summary window', not raw2, raw2)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # both themes: every text of the panel is readable against what is painted behind it
    pg.select_option('#lang-select','en'); pg.wait_for_timeout(400)
    for _ in range(2):
        theme=pg.evaluate("document.documentElement.dataset.theme||'light'"); open_tender(pg); cr=pg.evaluate(CONTRAST, TEXT_SEL)
        check(f'C20[{theme}] the panel’s text is readable (contrast at least 4.5 to 1), the marked message included', cr['worst']>=4.5, cr)
        if os.path.exists(AXE):
            pg.add_script_tag(path=AXE); reach(pg, pg.locator('dialog.td-dlg .td-thr-entry').nth(2).locator('.td-thr-mark')); v=pg.evaluate(SCAN)
            check(f'C20b[{theme}] the WCAG 2.1 A and AA scan passes in the tender’s window, on the page that holds the conversation', not v, v[:3])
            pg.keyboard.press('Escape'); pg.wait_for_timeout(300); pg.locator('#tenders-body .td-sum-btn').click(); pg.wait_for_timeout(600); v=pg.evaluate(SCAN)
            check(f'C20c[{theme}] and in the summary window', not v, v[:3])
        else: print('NOTE  the accessibility scan was skipped: run npm ci, or set AXE_JS to axe.min.js')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300); pg.locator('#theme-btn').click(); pg.wait_for_timeout(400)
    check('C21 no page error on the laptop', not errs, errs[:2])
    # a phone: nothing runs off the side, and the mark can still be pressed
    ph=b.new_context(viewport={'width':390,'height':844}, service_workers='block', storage_state=c.storage_state(indexed_db=True)); q=ph.new_page(); perr=[]; q.on('pageerror', lambda e: perr.append(str(e)[:200]))
    q.goto(f'http://127.0.0.1:{PORT}/#tenders'); q.wait_for_timeout(2200)
    have=q.locator('.td-table tr.td-row', has_text='Level sensors').count()
    if not have:   # a context that could not carry the register over: build it again on the phone
        q.locator('#tenders-body .td-pull .td-mail-drop input[type=file]').set_input_files(P('reply.eml')); q.wait_for_timeout(2500)
    else:
        q.locator('.td-table tr.td-row', has_text='Level sensors').locator('.td-subj').click(); q.wait_for_timeout(900)
    if q.locator('dialog.td-dlg').count():
        b=q.locator('dialog.td-dlg .td-card-all'); press(q, b); q.wait_for_timeout(600)
    m=q.evaluate("()=>{const d=document.querySelector('dialog.td-dlg'),p=d&&d.querySelector('.td-thread');if(!p)return null;const r=(n)=>n.getBoundingClientRect();return {n:p.querySelectorAll('.td-thr-entry').length,over:[...p.querySelectorAll('.td-thr-entry, .td-thr-sum, .td-thr-mark, .td-thr-gist')].filter(n=>r(n).right>innerWidth+1||r(n).left<-1).length,page:document.documentElement.scrollWidth>innerWidth+1,btn:r(p.querySelector('.td-thr-mark')).height}}")
    check('C22 on a phone the conversation fits the screen: nothing runs off the side', m and m['n']==3 and m['over']==0 and not m['page'], m)
    q.locator('dialog.td-dlg .td-thr-entry').nth(1).locator('.td-thr-mark').click(); q.wait_for_timeout(900)
    on=q.evaluate("()=>[...document.querySelectorAll('dialog.td-dlg .td-thr-entry')].map(e=>e.classList.contains('td-thr-on'))")
    check('C23 and a message can be marked there', on==[False,True,False], on)
    q.keyboard.press('Escape'); q.wait_for_timeout(300); q.locator('#tenders-body .td-sum-btn').scroll_into_view_if_needed(); q.locator('#tenders-body .td-sum-btn').click(); q.wait_for_timeout(700)
    ps=q.evaluate("()=>{const d=document.querySelector('dialog.cr-modal');if(!d||!d.open)return null;const r=d.getBoundingClientRect(),l=d.querySelector('.crm-list');return {fits:r.left>=-1&&r.right<=innerWidth+1,page:document.documentElement.scrollWidth>innerWidth+1,rows:d.querySelectorAll('tbody tr').length,reach:l.tabIndex===0||l.scrollWidth<=l.clientWidth+1}}")
    check('C25 the summary window fits the phone; its table scrolls inside its own box and can be reached from the keyboard', ps and ps['fits'] and not ps['page'] and ps['rows']==1 and ps['reach'], ps)
    check('C24 no page error on the phone', not perr, perr[:2])
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
