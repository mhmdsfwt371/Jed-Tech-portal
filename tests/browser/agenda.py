# ADR-0143 (v9.73): the agenda. Every date of every open tender on one strip at the top of the register — the platform's dates
# and the internal ones worked out from them — a click opens the tender, the period widens, the calendar file carries them all,
# and the notice is said once on this device. Three languages, both themes, a phone. Made-up tenders only.
import threading, http.server, socketserver, functools, os, pathlib, datetime
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9343'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
now=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)+datetime.timedelta(hours=3); day=lambda k: (now+datetime.timedelta(days=k)).strftime('%Y-%m-%d')
REG={'schema':'afaqy-tenders-from-mail/v1','to':day(0),'tenders':[{'subject':'sample: Agenda cameras','received':day(-2),'from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True},
  {'subject':'sample: Agenda far tender','received':day(-1),'from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True}]}
NOTE="window.__n=[]; window.Notification=class{constructor(t,o){window.__n.push([t,(o||{}).body||''])} static get permission(){return window.__perm||'default'} static requestPermission(){window.__perm='granted';return Promise.resolve('granted')}};"
def boot(b, theme='light', vp=(1366,800), lang='en', state=None):
    kw=dict(viewport={'width':vp[0],'height':vp[1]}, service_workers='block', color_scheme=theme, accept_downloads=True)
    if vp[0]<600: kw.update(is_mobile=True, has_touch=True)
    if state: kw['storage_state']=state
    c=b.new_context(**kw); c.add_init_script(NOTE); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1400); pg.select_option('#lang-select',lang); pg.wait_for_timeout(300); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    return c,pg,errs
def setv(pg, sel, v):
    # the inquiries date sits in the card's folded part: the value is set and its change is announced, as typing and leaving would
    pg.evaluate("([q,v])=>{const i=document.querySelector('dialog.td-dlg '+q); i.value=v; i.dispatchEvent(new Event('change',{bubbles:true}))}",[sel,v]); pg.wait_for_timeout(700)
def dates(pg, needle, due, ask=None):
    pg.locator('#tenders-body .pills button', has_text='All').last.click(); pg.wait_for_timeout(300)
    pg.locator('.td-table tr.td-row', has_text=needle).locator('.td-subj').click(); pg.wait_for_timeout(900)
    setv(pg,'input.td-due',due)
    if ask: setv(pg,'input.td-askDue',ask)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
items=lambda pg: pg.evaluate("()=>[...document.querySelectorAll('#tenders-body .td-agenda .ag-item')].map(b=>[b.dataset.key,b.className,b.innerText.replace(/\\n/g,' | '),[...b.querySelectorAll('.ag-later li')].map(l=>l.dataset.key),b.closest('.ag-day').dataset.day||'late'])")
dates_n=lambda it: sum(1+len(x[3]) for x in it)   # every date on the strip: each card's own and the ones it carries
with sync_playwright() as p:
    b=p.chromium.launch(); c,pg,errs=boot(b)
    check('G1 an empty register has no agenda', pg.locator('#tenders-body .td-agenda').count()==0)
    pg.evaluate("""(j)=>{ const f=new File([JSON.stringify(j)],'reg.json'); const i=document.querySelector('#tenders-body input.td-up-in'); const dt=new DataTransfer(); dt.items.add(f); i.files=dt.files; i.dispatchEvent(new Event('change',{bubbles:true})); }""", REG); pg.wait_for_timeout(1500)
    check('G2 tenders with no date yet: still no agenda, nothing empty is drawn', pg.locator('#tenders-body .td-agenda').count()==0)
    dates(pg,'Agenda cameras',day(9),day(4)); dates(pg,'Agenda far tender',day(40))
    it=items(pg); keys=[x[0] for x in it]
    check('G3 the agenda comes right under the card that registers a tender, before the numbers and the list, with the platform\'s dates and the internal ones, nearest first', pg.evaluate("()=>{const q=(s)=>document.querySelector('#tenders-body '+s),a=q('.td-agenda');return !!a&&!!(a.compareDocumentPosition(q('.td-pull'))&2)&&!!(a.compareDocumentPosition(q('.td-overview'))&4)&&!!(a.compareDocumentPosition(q('.td-table'))&4)&&a.previousElementSibling===q('.td-pull')}") and [x for x in it if 'Agenda cameras' in x[2]][0][0]=='askUp' and len([x for x in it if 'Agenda cameras' in x[2]])==1
        and (lambda L: L[:1]==['askDue'] and 'bondCost' in L and 'handover' in L and L.index('bondCost')<L.index('handover'))([x for x in it if 'Agenda cameras' in x[2]][0][3]), it)
    check('G3b v9.78: a tender is on the strip once, on its nearest date, and carries the dates after it; every day of the range is a column to drop on',
        len([x for x in it if 'Agenda cameras' in x[2]])==1 and pg.locator('.td-agenda .ag-day[data-day]').count()>=8 and pg.locator('.td-agenda .ag-day.empty').count()>=1, (len(it), pg.locator('.td-agenda .ag-day[data-day]').count()))
    check('G4 a tender whose dates are beyond the period is not on it, and the count says how many are', not any('far tender' in x[2] for x in it) and pg.locator('.td-agenda .ag-count').inner_text()==str(len(it)), it)
    pg.locator('.td-agenda .ag-range button', has_text='30').click(); pg.wait_for_timeout(400); it30=items(pg)
    pg.locator('.td-agenda .ag-range button', has_text='7').click(); pg.wait_for_timeout(400); it7=items(pg)
    check('G5 the period widens and narrows the strip', dates_n(it7)<dates_n(it)<=dates_n(it30) and pg.locator('.td-agenda .ag-range button[aria-pressed=true]').inner_text().startswith('7'), (dates_n(it7),dates_n(it),dates_n(it30)))
    pg.locator('.td-agenda .ag-range button', has_text='14').click(); pg.wait_for_timeout(300)
    pg.locator('.td-agenda .ag-item', has_text='Agenda cameras').locator('.ag-open').click(); pg.wait_for_timeout(900)
    card=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg[open]');return d?{t:d.innerText.includes('Agenda cameras'),tl:[...d.querySelectorAll('.td-tl-pt span')].map(x=>x.innerText)}:null}")
    check('G6 a date on the strip opens its tender, and the card\'s own line of dates carries the two internal ones', card and card['t'] and 'Guarantee cost to Riyadh' in card['tl'] and 'Upload the inquiries to the platform' in card['tl'], card)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    with pg.expect_download() as dl: pg.locator('.td-agenda .ag-ics').click()
    ics=open(dl.value.path(),encoding='utf-8').read()
    check('G7 the calendar file carries every date ahead, each with a reminder the day before', ics.count('BEGIN:VEVENT')>=6 and ics.count('TRIGGER:-P1D')==ics.count('BEGIN:VEVENT') and 'Guarantee cost to Riyadh' in ics and 'Agenda far tender' in ics, ics.count('BEGIN:VEVENT'))
    check('G8 nothing is said before the user asks for notices', pg.evaluate('window.__n.length')==0 and pg.locator('.td-agenda .ag-bell').get_attribute('aria-pressed')=='false')
    dates(pg,'Agenda far tender',day(3))   # now a hand-over is a day away
    pg.locator('.td-agenda .ag-bell').click(); pg.wait_for_timeout(700); n1=pg.evaluate('window.__n')
    check('G9 turned on: what is a day away or less is said, with the tender\'s name', pg.locator('.td-agenda .ag-bell').get_attribute('aria-pressed')=='true' and len(n1)>=1 and any('Agenda far tender' in x[1] for x in n1) and not any('Agenda cameras' in x[1] for x in n1), n1)
    pg.locator('.td-agenda .ag-range button', has_text='30').click(); pg.wait_for_timeout(500); n2=pg.evaluate('window.__n.length')
    check('G10 and said once: drawing the page again repeats nothing', n2==len(n1), (len(n1),n2))
    # v9.76 (ADR-0146): the inquiries' upload day and the platform's deadline after it are one notice and one calendar entry
    pg.evaluate('window.__n=[]'); dates(pg,'Agenda far tender',day(12),day(2)); pg.locator('.td-agenda .ag-range button', has_text='14').click(); pg.wait_for_timeout(700)
    inq=[x for x in pg.evaluate('window.__n') if 'Agenda far tender' in x[1] and 'nquir' in x[0]+x[1]]
    with pg.expect_download() as dl: pg.locator('.td-agenda .ag-ics').click()
    ev=[e for e in open(dl.value.path(),encoding='utf-8').read().split('BEGIN:VEVENT') if 'Agenda far tender' in e and 'nquir' in e]
    strip=[x for x in items(pg) if 'Agenda far tender' in x[2]]
    check('G13 the inquiries for one tender are one notice, one calendar entry and one card — the upload day, carrying the deadline after it',
        len(inq)==1 and 'Upload the inquiries' in inq[0][0] and 'Inquiries deadline' in inq[0][1] and len(ev)==1 and 'Inquiries deadline' in ev[0].replace('\r\n ','') and len(strip)==1 and strip[0][0]=='askUp' and 'askDue' in strip[0][3], (inq, len(ev), strip))
    # v9.78 (ADR-0148): a card dragged onto another day moves that reminder there; the platform's date stays as it is
    RG="async()=>{const r=indexedDB.open('afaqy-portal',1);const db=await new Promise(o=>{r.onsuccess=()=>o(r.result)});const t=await new Promise(o=>{const q=db.transaction('kv').objectStore('kv').get('tenders');q.onsuccess=()=>o(q.result)});const i=t.items.find(x=>x.subject.includes('Agenda far tender'));return {askDue:i.askDue,moves:i.agendaMoves||{}}}"
    before=pg.evaluate(RG); far=lambda: [x for x in items(pg) if 'Agenda far tender' in x[2]][0]
    target=day(3); pg.locator('.td-agenda .ag-item', has_text='Agenda far tender').drag_to(pg.locator(f'.td-agenda .ag-day[data-day="{target}"]'), source_position={'x':40,'y':12})   # taken by its title, as a hand would; pg.wait_for_timeout(900)
    after=pg.evaluate(RG); f=far()
    check('G14 a card dragged onto another day moves its reminder there and says where it came from; the platform\'s inquiries deadline does not move',
        after['moves'].get('askUp',{}).get('to')==target and after['askDue']==before['askDue'] and 'moved from' in f[2] and 'now falls on' in pg.locator('#toast').inner_text(), (f, before, after))
    pg.reload(); pg.wait_for_timeout(1500); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900); pg.locator('.td-agenda .ag-range button', has_text='14').click(); pg.wait_for_timeout(500)
    check('G15 the moved reminder is still where it was put after the page is opened again', pg.evaluate(RG)['moves'].get('askUp',{}).get('to')==target and 'moved from' in far()[2], far())
    head=far()[0]; pg.locator('.td-agenda .ag-item', has_text='Agenda far tender').locator('.ag-move-in').fill(day(8)); pg.locator('.td-agenda .ag-item', has_text='Agenda far tender').locator('.ag-move-in').dispatch_event('change'); pg.wait_for_timeout(900)
    g16=pg.evaluate(RG)
    check('G16 without a mouse (a phone, the keyboard): the day picked on the card moves its reminder the same way', g16['moves'].get(head,{}).get('to')==day(8) and g16['askDue']==before['askDue'], (head, g16))
    for _ in range(4):
        u=pg.locator('.td-agenda .ag-item', has_text='Agenda far tender').locator('.ag-unmove')
        if not u.count(): break
        u.first.click(); pg.wait_for_timeout(700)
    back=pg.evaluate(RG)
    check('G17 «Back to its own day» puts each reminder back where the deadline puts it, and the moves are forgotten', back['moves']=={} and 'moved from' not in far()[2] and far()[0]=='askUp', (far(), back))
    check('G11 no page error', not errs, errs[:2])
    for theme,vp,lang,word in (('dark',(390,800),'ar','المواعيد القادمة'),('light',(1366,800),'ur','آنے والی تاریخیں')):
        # the same register, opened again in another language, theme and width (the register lives in this browser's own store)
        w=pg; e2=errs; w.set_viewport_size({'width':vp[0],'height':vp[1]}); w.emulate_media(color_scheme=theme); w.reload(); w.wait_for_timeout(1400); w.select_option('#lang-select',lang); w.wait_for_timeout(300); w.evaluate("location.hash='#tenders'"); w.wait_for_timeout(900)
        m=w.evaluate("()=>{const a=document.querySelector('#tenders-body .td-agenda');if(!a)return null;const r=a.getBoundingClientRect();const cs=(n)=>getComputedStyle(n);const lum=(c)=>{const v=c.match(/[\\d.]+/g).slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]};const it=a.querySelector('.ag-item b'),card=a.querySelector('.ag-item');const L1=lum(cs(it).color),L2=lum(cs(card).backgroundColor);return {h:a.querySelector('h2').innerText,over:document.documentElement.scrollWidth>innerWidth,n:a.querySelectorAll('.ag-item').length,tap:Math.min(...[...a.querySelectorAll('.ag-item,.ag-head button')].map(x=>x.getBoundingClientRect().height)),ratio:(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05),raw:/\\b(ag|td)_[a-z_]+\\b/.test(a.innerText)}}")
        if os.environ.get('SHOT'): w.locator('#tenders-body .td-agenda').screenshot(path=os.path.join(os.environ['SHOT'],f'agenda-{theme}-{lang}.png'))
        check(f'G12 {theme}/{lang}/{vp[0]}: the agenda is there after reopening, in its language, readable, inside the page, and its buttons can be pressed', m and m['h']==word and not m['over'] and m['n']>=1 and m['ratio']>=4.5 and not m['raw'] and (vp[0]>600 or m['tap']>=32) and not e2, (m,e2[:1]))
    c.close(); b.close()
print('\n'+('all passed' if not fails else f'{len(fails)} failed')); h.shutdown(); raise SystemExit(1 if fails else 0)
