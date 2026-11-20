# ADR-0144 (v9.74): the tender desk. The register's page is one command card, then the agenda, a summary band and the list, each
# row marked on its edge with where it stands; «More» is a menu that a click outside or Escape closes; and every window the page
# opens shares one frame — the title, its tools and «Close» on one pinned row. Laptop and phone, both themes, three languages,
# the accessibility scan on the filled page. Made-up tenders only.
import threading, http.server, socketserver, functools, os, sys, json, pathlib, datetime, tempfile
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9345'))
AXE=os.environ.get('AXE_JS') or os.path.join(ROOT,'node_modules','axe-core','axe.min.js')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
now=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)+datetime.timedelta(hours=3); day=lambda k: (now+datetime.timedelta(days=k)).strftime('%Y-%m-%d')
LONG='sample: توريد وتركيب وتشغيل منظومة كاميرات مراقبة وحساسات وأجهزة تحكم بالدخول لمباني الإدارة والمستودعات والبوابات الخارجية'
T=[dict(subject=LONG, received=day(-3), stage='prep', due=day(9), dueTime='09:59', askDue=day(4), entity='جهة تجريبية للاختبار بمنطقة مكة المكرمة', etimadNo='261039000001', owner='Test Owner Name'),
   dict(subject='sample: Desk cameras for the depot', received=day(-2), stage='decide', due=day(6), dueTime='10:00', entity='Test entity'),
   dict(subject='sample: Desk fuel sensors', received=day(-1), stage='received'),
   dict(subject='sample: Desk access control', received=day(-30), stage='won', due=day(-20), value=48000),
   dict(subject='sample: Desk dash cameras', received=day(-31), stage='lost', due=day(-21), reason='Price above the winner', value=90000)]
REG={'schema':'afaqy-tenders-from-mail/v1','to':day(0),'tenders':[{'subject':x['subject'],'received':x['received']+'T09:00:00+03:00','from_address':'x@example.com','attachments':['كراسة الشروط.pdf'],'manual':True} for x in T]}
PULL={'schema':'afaqy-etimad-radar/v1','pulledAt':day(0)+'T08:00','partial':False,'tenders':[
  {'ref':'261139000888','title':'توريد كاميرات مراقبة للمستودع','entity':'أمانة محافظة جدة','status':'active','type':'منافسة عامة','due':day(5)+' 09:59','fees':300},
  {'ref':'261139000999','title':'توريد وتركيب شبكة لاسلكية للمبنى','entity':'جهة تجريبية','status':'active','due':day(25)+' 09:59','fees':100}]}
PATCH="""async(T)=>{const r=indexedDB.open('afaqy-portal',1);const db=await new Promise(o=>{r.onsuccess=()=>o(r.result)});
 const st=await new Promise(o=>{const q=db.transaction('kv').objectStore('kv').get('tenders');q.onsuccess=()=>o(q.result)});
 for(const x of T){const i=st.items.find(y=>y.subject===x.subject); if(!i) continue; const {subject,received,...rest}=x; Object.assign(i,rest,{stageAt:x.received});}
 await new Promise(o=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(st,'tenders');tx.oncomplete=o}); return st.items.length}"""
tmp=tempfile.mkdtemp(); PDF=os.path.join(tmp,'booklet-extra.pdf'); open(PDF,'wb').write(b'%PDF-1.4\n%made-up\n')
MAIL=os.path.join(tmp,'reply.eml'); open(MAIL,'w',encoding='utf-8',newline='').write('\r\n'.join(['From: Test Sender <sender@example.com>','To: qa@example.com',
  'Subject: RE: sample: Desk cameras for the depot','Message-ID: <desk-1@example.com>','Date: '+(now-datetime.timedelta(days=1)).strftime('%a, %d %b %Y 10:00:00 +0300'),'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=utf-8','','The booklet questions are attached.','','Test Sender','']))
def drop(pg, sel, name, obj):
    pg.evaluate("""([s,n,j])=>{const f=new File([JSON.stringify(j)],n,{type:'application/json'});const i=document.querySelector(s);const dt=new DataTransfer();dt.items.add(f);i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));}""",[sel,name,obj]); pg.wait_for_timeout(1500)
def boot(b, theme='light', vp=(1366,800), lang='en', state=None):
    kw=dict(viewport={'width':vp[0],'height':vp[1]}, service_workers='block', color_scheme=theme)
    if vp[0]<600: kw.update(is_mobile=True, has_touch=True)
    if state: kw['storage_state']=state
    c=b.new_context(**kw); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: d.dismiss())
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1400); pg.select_option('#lang-select',lang); pg.wait_for_timeout(300); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    return c,pg,errs
def show_all(pg):
    pg.locator('#tenders-body .pills button').last.click(); pg.wait_for_timeout(400)   # the last period is «All»
def more(pg, want=True):
    if pg.evaluate("()=>document.querySelector('#tenders-body details.td-how').open")!=want:
        pg.locator('#tenders-body details.td-how > summary').click(); pg.wait_for_timeout(350)
# The frame of the top window: the pinned head first, one bar only, the title and «Close» on one row at the window's end edge.
FRAME="""()=>{const d=[...document.querySelectorAll('dialog[open]')].pop(); if(!d) return null; const hd=d.firstElementChild, r=(n)=>n&&n.getBoundingClientRect();
  const x=hd&&hd.querySelector(':scope > .dlg-x'), t=hd&&hd.querySelector('.tw-titles h2'), tools=hd&&hd.querySelector(':scope > .tw-tools'), rd=r(d), rx=r(x), rt=r(t), rh=r(hd), rtl=getComputedStyle(d).direction==='rtl';
  const pad=parseFloat(getComputedStyle(hd||d).paddingInlineEnd)||0;
  return {cls:d.className, tw:d.classList.contains('tw'), head:!!hd&&hd.classList.contains('tw-head')&&hd.classList.contains('dlg-bar'), bars:d.querySelectorAll(':scope > .dlg-bar').length,
    sticky:hd?getComputedStyle(hd).position:'', row:!!(rx&&rt)&&rx.top<rt.bottom&&rt.top<rx.bottom, edge:!!(rx&&rh)&&Math.abs(rtl?rx.left-(rh.left+pad):(rh.right-pad)-rx.right)<=2,
    toolsRow:tools?(tools.getBoundingClientRect().top<rt.bottom?1:2):0, w:Math.round(rd.width), fits:rd.left>=-1&&rd.right<=innerWidth+1, side:d.scrollWidth<=d.clientWidth+1,
    focus:d.contains(document.activeElement), onX:document.activeElement===x, headH:rh?Math.round(rh.height):0}}"""
ORDER="""()=>{const b=document.getElementById('tenders-body'), at=(s)=>{const n=b.querySelector(s);if(!n)return -1;let k=0;for(let c=b.firstElementChild;c;c=c.nextElementSibling,k++)if(c===n||c.contains(n))return k;return -1};
  return ['.td-cmd','.td-agenda','.td-overview','.td-listbar','.td-table'].map(at)}"""
STRIPE="""()=>{const probe=(v)=>{const s=document.createElement('span');s.style.color=`var(${v})`;document.body.append(s);const c=getComputedStyle(s).color;s.remove();return c};
  const want={received:'--sig',decide:'--sig',prep:'--accent',won:'--ok',lost:'--fail'}, rtl=getComputedStyle(document.documentElement).direction==='rtl', out={};
  for(const tr of document.querySelectorAll('#tenders-body .td-table tr.td-row')){const st=tr.dataset.stage, td=tr.firstElementChild, wide=innerWidth>820;
    const cs=getComputedStyle(wide?td:tr), side=rtl?'Right':'Left'; out[st]={got:cs['border'+side+'Color'],w:parseFloat(cs['border'+side+'Width']),want:want[st]?probe(want[st]):''}}
  return out}"""
SCAN="(async(sel)=>{const r=await axe.run({include:[sel]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}); return r.violations.map(x=>[x.id,x.nodes.length,x.nodes[0].html.slice(0,110)])})"
def frame_ok(f, size=None, phone=False):
    if not f: return False
    ok=f['tw'] and f['head'] and f['bars']==1 and f['sticky']=='sticky' and f['row'] and f['edge'] and f['focus'] and f['fits'] and f['side']
    if size and not phone: ok=ok and f['w']<=size+1
    if phone: ok=ok and (f['toolsRow'] in (0,2))
    return ok
with sync_playwright() as p:
    b=p.chromium.launch(); axe=os.path.exists(AXE)
    if not axe: print('NOTE  the accessibility scan was skipped: run npm ci, or set AXE_JS to axe.min.js')
    # ---- an empty register: the ways in sit open inside the card
    c,pg,errs=boot(b)
    e=pg.evaluate("()=>{const c=document.querySelector('#tenders-body .td-cmd'),d=c&&c.querySelector('details.td-how');return c?{empty:c.classList.contains('td-cmd-empty'),inline:!!d&&d.classList.contains('td-how-inline'),open:!!d&&d.open,pos:d?getComputedStyle(d.querySelector('.td-how-panel')).position:'',agenda:!!document.querySelector('#tenders-body .td-agenda'),band:!!document.querySelector('#tenders-body .td-overview')}:null}")
    check('D1 an empty register is one card: the mail drop first, every other way in open inside it, no agenda and no numbers yet', e and e['empty'] and e['inline'] and e['open'] and e['pos']=='static' and not e['agenda'] and not e['band'], e)
    # ---- a register with tenders at every stage
    drop(pg,'#tenders-body input.td-up-in','reg.json',REG); pg.evaluate(PATCH,T); pg.reload(); pg.wait_for_timeout(1500); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(900)
    drop(pg,'#tenders-body .td-drop-any input','etimad-radar.json',PULL); show_all(pg)
    o=pg.evaluate(ORDER)
    check('D2 the page reads top to bottom: the command card, the agenda, the summary band, the list bar, the list', all(k>=0 for k in o) and o==sorted(o) and len(set(o))==5 and o[0]==0, o)
    m=pg.evaluate("()=>{const d=document.querySelector('#tenders-body details.td-how');return {inline:d.classList.contains('td-how-inline'),open:d.open,shown:d.querySelector('.td-how-panel').checkVisibility(),label:d.querySelector('summary').textContent.trim()}}")
    check('D3 with tenders in it «More» is a closed menu button, not an open fold', not m['inline'] and not m['open'] and not m['shown'] and m['label'].endswith('More'), m)
    more(pg)
    pn=pg.evaluate("()=>{const d=document.querySelector('#tenders-body details.td-how'),s=d.querySelector('summary').getBoundingClientRect(),p=d.querySelector('.td-how-panel'),r=p.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+24);return {open:d.open,top:r.top>=s.bottom-1,inView:r.left>=0&&r.right<=innerWidth&&r.top<innerHeight,h:Math.round(r.height),onTop:!!hit&&p.contains(hit),has:['.td-wm','.td-sum-btn','.td-owner-in','.td-add-btn','.td-study-btn','.td-copy','.td-paste-btn','.td-pst-btn'].filter(c=>!p.querySelector(c))}}")
    check('D4 «More» opens a panel under its button, on screen and over the page, holding the period\'s reports, the default owner and every other way in', pn['open'] and pn['top'] and pn['inView'] and pn['onTop'] and pn['h']>120 and not pn['has'], pn)
    pg.locator('#tenders-body .td-cmd .td-pull-head h2').click(); pg.wait_for_timeout(300)
    out=pg.evaluate("document.querySelector('#tenders-body details.td-how').open")
    more(pg); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    esc=pg.evaluate("()=>{const d=document.querySelector('#tenders-body details.td-how');return {open:d.open,focus:document.activeElement===d.querySelector('summary')}}")
    check('D5 a click outside the menu closes it, and so does Escape, which leaves focus on its button', out is False and esc['open'] is False and esc['focus'], (out,esc))
    pg.locator('#tenders-body .td-pull .td-mail-drop input[type=file]').set_input_files(MAIL); pg.wait_for_timeout(2500)   # a reply: one tender has its correspondence
    for _ in range(3):
        if pg.evaluate("document.querySelectorAll('dialog[open]').length"): pg.keyboard.press('Escape'); pg.wait_for_timeout(350)   # the tender the reply went to opens; close it
    show_all(pg)
    more(pg); pg.locator('#tenders-body .td-sum-btn').click(); pg.wait_for_timeout(800); f=pg.evaluate(FRAME); pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    kept=pg.evaluate("()=>({open:document.querySelector('#tenders-body details.td-how').open,dlg:document.querySelectorAll('dialog[open]').length})")
    check('D6 a window opened from the menu closes on Escape and leaves the menu as it was', f and kept['open'] is True and kept['dlg']==0, (f and f['cls'],kept))
    check('D7 the correspondence summary has the frame: title and «Close» on one pinned row, one bar, the middle width', frame_ok(f,920), f)
    more(pg,False)
    # ---- every window of the register in the one frame (laptop)
    wins=[]
    pg.locator('.td-table tr.td-row', has_text='Desk cameras').locator('.td-subj').click(); pg.wait_for_timeout(1100); f=pg.evaluate(FRAME); wins.append(('card',f,1140))
    check('D8 the tender\'s window opens with focus on «Close», not on the stage list where an arrow key would change the stage', f and f['onX'], f)
    hd=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg[open]');const h=d.querySelector('.td-dlg-head');return {stage:!!h.querySelector('select.td-stage'),chips:!!h.querySelector('.td-card-chips'),acts:d.querySelector('.td-card')?.firstElementChild?.classList.contains('td-card-acts')}}")
    check('D9 its pinned head holds the title, the stage and who it is for; what can be done comes first in the body', hd['stage'] and hd['chips'] and hd['acts'], hd)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    for name,sel,size,inside in (('paste','.td-paste-btn',560,True),('add','.td-add-btn',560,True),('radar','.td-radar-btn',1140,False),('year','.td-year-btn',920,False),('archive','.td-arch-btn',920,False)):
        if inside: more(pg)
        pg.locator(f'#tenders-body {sel}').first.click(); pg.wait_for_timeout(900); wins.append((name,pg.evaluate(FRAME),size)); pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
        if inside: more(pg,False)
    pg.locator('#tenders-body .td-market-btn').click(); pg.wait_for_timeout(1500); wins.append(('market',pg.evaluate(FRAME),None)); pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    pg.locator('#tenders-body .td-drop-any input[type=file]').set_input_files(PDF); pg.wait_for_timeout(1200); wins.append(('drop',pg.evaluate(FRAME),560)); pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    bad=[(n,f) for n,f,s in wins if not frame_ok(f,s)]
    check(f'D10 every window of the register ({len(wins)}) has the frame: title, tools and «Close» on one pinned row at its end edge, one bar, its width, focus inside', len(wins)==8 and not bad, bad[:2])
    pg.locator('.td-table tr.td-row', has_text='Desk cameras').locator('.td-subj').click(); pg.wait_for_timeout(1100)
    pg.locator('dialog.td-dlg[open] .dlg-x').click(); pg.wait_for_timeout(400)
    check('D11 «Close» in the head closes the window', pg.evaluate("document.querySelectorAll('dialog[open]').length")==0)
    # twice: the same window opened again, the same menu toggled again — no second bar, no second window, no leftover
    for _ in range(2):
        pg.locator('.td-table tr.td-row', has_text='Desk cameras').locator('.td-subj').click(); pg.wait_for_timeout(900); pg.keyboard.press('Escape'); pg.wait_for_timeout(350)
    pg.locator('.td-table tr.td-row', has_text='Desk cameras').locator('.td-subj').click(); pg.wait_for_timeout(900)
    tw=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg[open]');return {heads:d.querySelectorAll('.tw-head').length,bars:d.querySelectorAll(':scope > .dlg-bar').length,dlgs:document.querySelectorAll('dialog.td-dlg').length}}")
    # a button that opens a fold brings it under the pinned head, not behind it
    pg.locator('dialog.td-dlg[open] .td-card-all').click(); pg.wait_for_timeout(900)
    fd=pg.evaluate("()=>{const d=document.querySelector('dialog.td-dlg[open]'),f=d.querySelector('.td-fold-thread'),s=f.querySelector('summary').getBoundingClientRect(),h=d.querySelector('.tw-head').getBoundingClientRect(),x=s.left+s.width/2,y=s.top+s.height/2,hit=document.elementFromPoint(x,y);return {open:f.open,below:s.top>=h.bottom-1,seen:!!hit&&f.querySelector('summary').contains(hit),focus:document.activeElement===f.querySelector('summary'),y:[Math.round(s.top),Math.round(s.bottom),Math.round(h.bottom),innerHeight],hit:hit?(hit.className||hit.tagName).toString().slice(0,40):null,paged:d.hasAttribute('data-paged'),st:d.scrollTop}}")
    pg.keyboard.press('Escape'); pg.wait_for_timeout(350)
    for _ in range(2): more(pg); more(pg,False)
    pg.locator('#tenders-body .td-paste-btn').evaluate("b=>b.click()"); pg.wait_for_timeout(500); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    more(pg); pg.locator('#tenders-body .td-paste-btn').click(); pg.wait_for_timeout(600)
    twice=pg.evaluate("()=>({paste:document.querySelectorAll('dialog.td-paste').length,open:document.querySelectorAll('dialog[open]').length,reports:document.querySelectorAll('#tenders-body .td-how-reports .td-sum-btn').length})")
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300); more(pg,False)
    check('D27 twice: the card opened three times has one head and one bar, a window opened twice is there once, the menu\'s reports are listed once', tw=={'heads':1,'bars':1,'dlgs':1} and twice=={'paste':1,'open':1,'reports':1}, (tw,twice))
    check('D28 «All messages» opens its fold right under the pinned head, where it can be seen and pressed, with focus on it', fd['open'] and fd['below'] and fd['seen'] and fd['focus'], fd)
    s=pg.evaluate(STRIPE)
    check('D12 each row is marked on its edge with where it stands: waiting amber, in work blue, won green, lost red', len(s)==5 and all(v['want'] and v['got']==v['want'] and v['w']>=3 for v in s.values()) and len({s['received']['got'],s['prep']['got'],s['won']['got'],s['lost']['got']})==4, s)
    if axe:
        pg.add_script_tag(path=AXE); v=pg.evaluate(SCAN,'#view-tenders')
        check('D13[light] the WCAG 2.1 A and AA scan passes on the filled page', not v, v[:4])
    check('D14 no page error on the laptop', not errs, errs[:2])
    state=c.storage_state(indexed_db=True)
    pg.reload(); pg.wait_for_timeout(1500); pg.evaluate("location.hash='#tenders'"); pg.wait_for_timeout(800)
    check('D15 after a reload «More» is closed again: a menu, not a remembered fold', pg.evaluate("document.querySelector('#tenders-body details.td-how').open") is False)
    c.close()
    # ---- dark, and the two right-to-left languages
    for theme,lang in (('dark','en'),('dark','ar'),('light','ur')):
        c,pg,errs=boot(b,theme,(1366,800),lang,state); show_all(pg); more(pg)
        txt=pg.evaluate("()=>document.getElementById('tenders-body').innerText")
        raw=[k for k in ('td_more_btn','td_how_reports','td_overview','td_more') if k in txt]
        dirn=pg.evaluate("getComputedStyle(document.querySelector('#tenders-body .td-cmd')).direction")
        check(f'D16[{theme}/{lang}] the desk is written in the language with no raw key, and runs {"right to left" if lang!="en" else "left to right"}', not raw and dirn==('ltr' if lang=='en' else 'rtl'), (raw,dirn))
        if axe:
            pg.add_script_tag(path=AXE); v=pg.evaluate(SCAN,'#view-tenders')
            check(f'D17[{theme}/{lang}] the WCAG 2.1 A and AA scan passes on the filled page, the menu open', not v, v[:4])
        more(pg,False)
        pg.locator('.td-table tr.td-row').filter(has_text='sample: توريد وتركيب وتشغيل').locator('.td-subj').click(); pg.wait_for_timeout(1100); f=pg.evaluate(FRAME)
        check(f'D18[{theme}/{lang}] the tender\'s window keeps the frame in this language: «Close» at the end of the title\'s row', frame_ok(f,1140), f)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        check(f'D19[{theme}/{lang}] no page error', not errs, errs[:2]); c.close()
    # ---- a phone
    c,pg,errs=boot(b,'dark',(390,844),'ar',state); show_all(pg)
    side=pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1")
    col=pg.evaluate("()=>{const r=(s)=>document.querySelector('#tenders-body .td-cmd '+s).getBoundingClientRect();return r('.td-cmd-tools').top>=r('.td-cmd-intake').bottom-1}")
    more(pg); pg.locator('#tenders-body details.td-how > summary').scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    ph=pg.evaluate("()=>{const d=document.querySelector('#tenders-body details.td-how'),s=d.querySelector('summary').getBoundingClientRect(),p=d.querySelector('.td-how-panel'),r=p.getBoundingClientRect();return {open:d.open,below:r.top>=s.bottom-1&&r.top<innerHeight,fits:r.left>=-1&&r.right<=innerWidth+1,h:Math.round(r.height),pos:getComputedStyle(p).position}}")
    check('D20 on a phone the card is one column and nothing runs off the side', side and col, (side,col))
    check('D21 on a phone «More» opens right under its button, inside the screen\'s width, in the card itself', ph['open'] and ph['below'] and ph['fits'] and ph['h']>120 and ph['pos']!='fixed', ph)
    more(pg,False)
    pg.locator('.td-table tr.td-row').filter(has_text='sample: توريد وتركيب وتشغيل').locator('.td-subj').click(); pg.wait_for_timeout(1200); f=pg.evaluate(FRAME)
    check('D22 on a phone a long title wraps beside «Close» — it never pushes it to a line of its own — and the window fits the screen', frame_ok(f,phone=True), f)
    check('D23 and the pinned head stays short enough to leave the card most of the screen', f and f['headH']<=0.42*844, f and f['headH'])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    pg.locator('#tenders-body .td-year-btn').click(); pg.wait_for_timeout(900); f=pg.evaluate(FRAME)
    check('D24 on a phone a window\'s tools take the line under its title, and «Close» stays beside the title', frame_ok(f,phone=True) and f['toolsRow']==2, f)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    if axe:
        pg.add_script_tag(path=AXE); v=pg.evaluate(SCAN,'#view-tenders')
        check('D25 the WCAG 2.1 A and AA scan passes on the phone', not v, v[:4])
    check('D26 no page error on the phone', not errs, errs[:2]); c.close()
    b.close()
h.shutdown()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
