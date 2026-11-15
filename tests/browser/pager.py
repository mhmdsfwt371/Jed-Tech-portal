# suite: alone — it measures frames and fades; run with the machine to itself (scripts/browser-suites.mjs)
# ADR-0119 — a window with a long scroll turns into pages. Built windows first (every property measured), then every window the
# portal itself opens on the real October data, found by pressing what is on each page.
import threading, http.server, socketserver, functools, json, os, sys, pathlib
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9301'))
OCT=os.environ.get('OCT_PULL','/mnt/user-data/uploads/afaqy-tasks-2026-10-01_2026-10-29.json')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
AUDIT = r"""
window.__mk = (html, cls) => { const d = document.createElement('dialog'); d.className = cls || 'help-dialog'; d.id = 't-dlg'; d.innerHTML = html; document.body.append(d); d.showModal(); return true; };
window.__rows = (n, from) => Array.from({length:n}, (_, i) => `<tr><td>row ${(from||0)+i+1}</td><td>${'x'.repeat(8 + (i % 5) * 9)}</td><td>${i * 3}</td></tr>`).join('');
window.__sc = (d) => (d.matches('[data-paged]') ? d : d.querySelector('[data-paged]'));
window.__state = (d) => { const sc = __sc(d); if (!sc) { let worst = 0, who = ''; for (const n of [d, ...d.querySelectorAll('*')]) { if (n.clientHeight < 40 || /TEXTAREA|PRE|SELECT/.test(n.tagName)) continue; const r = n.scrollHeight / n.clientHeight; if (r > worst && /auto|scroll/.test(getComputedStyle(n).overflowY)) { worst = r; who = n.className || n.tagName; } } return { paged: false, ratio: +worst.toFixed(2), who }; }
  const bar = sc.querySelector(':scope > .dlg-pager'), on = bar.querySelector('.dp-status').textContent, m = on.match(/(\d+)\D+(\d+)/);
  return { paged: true, page: +m[1], pages: +m[2], status: on, prevOff: bar.querySelector('.dp-prev').disabled, nextOff: bar.querySelector('.dp-next').disabled, overflow: getComputedStyle(sc).overflowY, nums: bar.querySelectorAll('.dp-n').length }; };
// one page, measured: what is cut at the foot or the head of the page, and which table rows are whole on it
window.__page = (d) => { const sc = __sc(d), bar = sc.querySelector(':scope > .dlg-pager'), row = bar.querySelector('.dp-row'), s = sc.getBoundingClientRect();
  const foot = bar.getBoundingClientRect().top, inset = parseFloat(sc.style.getPropertyValue('--dp-top')) || 0, room = sc.clientHeight - row.offsetHeight - inset;
  const cut = [], whole = [], small = 'tr, li, p, h1, h2, h3, h4, button, input, select, textarea, label, summary, .card, [class*="tile"]';
  for (const e of sc.querySelectorAll(small)) { if (bar.contains(e) || e.closest('thead') || e.offsetParent === null && e.tagName !== 'TR') continue; const r = e.getBoundingClientRect(); if (r.height < 1 || r.height > room * 0.5) continue;
    const st = e.closest('table.dp-sticky'), th = st && st.tHead && st.tHead.querySelector('th'), head = Math.max(s.top + sc.clientTop + inset, th && e.tagName === 'TR' && !e.closest('thead') ? th.getBoundingClientRect().bottom : 0);   // the heading row is pinned: its cells are what covers
    if (r.top < foot - 1 && r.bottom > foot + 1) cut.push('foot:' + e.tagName + ':' + e.textContent.trim().slice(0, 24) + ` @${Math.round(r.top-s.top)}-${Math.round(r.bottom-s.top)} foot ${Math.round(foot-s.top)} st ${sc.scrollTop} cls ${e.className} in ${e.parentElement.closest('[class]')?.className}`);
    else if (r.bottom <= foot + 1 && r.top < head - 1 && r.bottom > head + 1) cut.push('head:' + e.tagName + ':' + e.textContent.trim().slice(0, 24));
    else if (e.tagName === 'TR' && r.top >= head - 1 && r.bottom <= foot + 1) whole.push(e.textContent.trim().slice(0, 30)); }
  const pad = sc.querySelector(':scope > .dlg-pad'), endSeen = pad.getBoundingClientRect().top <= foot + 1;
  const under = Math.round(s.bottom - sc.clientTop - bar.getBoundingClientRect().bottom); if (under > 1) cut.push('gap under the pager: ' + under + 'px');
  return { cut, whole, endSeen, barInView: row.getBoundingClientRect().bottom <= window.innerHeight + 1 && row.getBoundingClientRect().top >= 0, rowTop: Math.round(row.getBoundingClientRect().top), winH: window.innerHeight, sideways: document.documentElement.scrollWidth > window.innerWidth + 1 }; };
"""
def walk(pg, sel='#t-dlg'):
    """Go through every page of the open window; return (pages, cuts, rows seen whole in order, end seen on last, bar always in view)."""
    pg.wait_for_timeout(500)   # the window counts its pages once more after it settles (about 0.45 s)
    d=pg.locator(sel); st=d.evaluate("d=>__state(d)"); cuts=[]; rows=[]; inview=True; end=False
    if not st['paged']: return st, cuts, rows, end, inview
    d.evaluate("d=>d.querySelector('.dp-n, .dp-prev') && (function(){ const sc=__sc(d); for(let i=0;i<400;i++){ const b=sc.querySelector(':scope > .dlg-pager .dp-prev'); if(b.disabled) break; b.click(); } })()")
    for k in range(st['pages']):
        m=d.evaluate("d=>__page(d)"); cuts+= [f'p{k+1} {c}' for c in m['cut']]; rows+=m['whole']; inview=inview and m['barInView']; end=m['endSeen']
        if k<st['pages']-1: d.locator('.dlg-pager .dp-next').click(); pg.wait_for_timeout(40)
    return st, cuts, rows, end, inview
def shut(pg):
    pg.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close()); const t=document.getElementById('t-dlg'); if(t) t.remove();"); pg.wait_for_timeout(60)
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':1440,'height':900}, service_workers='block'); pg=c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: d.dismiss())
    pg.add_init_script(AUDIT); pg.goto(f'http://127.0.0.1:{PORT}/#data'); pg.wait_for_timeout(1200); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    # ---------- a long table
    pg.evaluate("__mk('<h2>Tasks</h2><table style=\"width:100%\"><thead><tr><th>Task</th><th>Note</th><th>Hours</th></tr></thead><tbody>'+__rows(300)+'</tbody></table>')"); pg.wait_for_timeout(250)
    st,cuts,rows,end,inview=walk(pg)
    check(f'W1 a window with 300 rows opens in pages, not a scroll: {st.get("pages")} pages, «{st.get("status")}»', st['paged'] and st['pages']>5 and st['overflow']=='hidden')
    check('W2 no row is cut at the foot or the head of any page', not cuts, cuts[:4])
    check(f'W3 every row is shown whole on exactly one page, in order ({len(rows)} of 300)', rows==[(f'row {i+1}'+'x'*(8+(i%5)*9)+str(i*3))[:30] for i in range(300)], (len(rows), len(set(rows)), rows[:2]))
    check('W4 the last page reaches the end, and the pager stays inside the window on every page', end and inview)
    d=pg.locator('#t-dlg'); d.evaluate("d=>{ const sc=__sc(d); for(let i=0;i<400;i++){ const b=sc.querySelector(':scope > .dlg-pager .dp-prev'); if(b.disabled) break; b.click(); } }")
    d.locator('.dlg-pager .dp-next').click(); d.locator('.dlg-pager .dp-next').click(); pg.wait_for_timeout(60)
    hd=d.evaluate("d=>{ const sc=__sc(d), th=d.querySelector('thead th').getBoundingClientRect(), x=d.querySelector('.dlg-bar').getBoundingClientRect(); return [Math.round(th.top - x.bottom), th.top >= sc.getBoundingClientRect().top] }")
    check(f'W5 on page 3 the heading row of the table is still in view, right under the ✕ bar (gap {hd[0]} px)', abs(hd[0])<=1 and hd[1])
    s0=d.evaluate("d=>__state(d)"); burst="d=>{ const r=d.querySelector('tbody tr'); for(let i=0;i<6;i++) r.dispatchEvent(new WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true})); return __state(d) }"
    s1=d.evaluate(burst); pg.wait_for_timeout(120); s1b=d.evaluate(burst); pg.wait_for_timeout(600)
    pg.keyboard.press('PageUp'); pg.wait_for_timeout(80); s2=d.evaluate("d=>__state(d)"); pg.keyboard.press('End'); pg.wait_for_timeout(80); s3=d.evaluate("d=>__state(d)"); pg.keyboard.press('Home'); pg.wait_for_timeout(80); s4=d.evaluate("d=>__state(d)")
    check(f'W6 six wheel events in a row turn one page, not six ({s0["page"]}→{s1["page"]}), and a glide that keeps coming is still the same gesture ({s1b["page"]}), Page Up goes back ({s2["page"]}), End and Home go to the last and first', s1['page']==s0['page']+1 and s1b['page']==s1['page'] and s2['page']==s1['page']-1 and s3['page']==s3['pages'] and s3['nextOff'] and s4['page']==1 and s4['prevOff'])
    # ---------- the pages follow the content
    n0=d.evaluate("d=>__state(d)")['pages']; d.evaluate("d=>d.querySelector('tbody').insertAdjacentHTML('beforeend', __rows(200, 300))"); pg.wait_for_timeout(350); n1=d.evaluate("d=>__state(d)")['pages']
    d.evaluate("d=>{ const tb=d.querySelector('tbody'); while(tb.rows.length>6) tb.deleteRow(-1); }"); pg.wait_for_timeout(350); s5=d.evaluate("d=>__state(d)"); nat=d.evaluate("d=>[d.querySelectorAll('.dlg-pager, .dlg-pad').length, getComputedStyle(d).overflowY, d.hasAttribute('data-paged')]")
    check(f'W7 more rows → more pages by itself ({n0}→{n1}); cut down to 6 rows → the pager goes and the window is as it was', n1>n0 and not s5['paged'] and nat==[0,'auto',False], (n0,n1,s5,nat))
    shut(pg)
    # ---------- a short scroll is left alone
    pg.evaluate("__mk('<h2>Short</h2><table><tbody>'+__rows(22)+'</tbody></table>')"); pg.wait_for_timeout(250); s=pg.locator('#t-dlg').evaluate("d=>__state(d)")
    check(f'W8 a window a little longer than the screen ({s.get("ratio")} screens) keeps its own scroll: no pager', not s['paged'] and 1.0 < s['ratio'] <= 1.5, s); shut(pg)
    # ---------- v9.56: a click held as long as a person holds it. The tests clicked in an instant and passed; on the manager's
    # screen «Next» and the page numbers did nothing, because pressing a button adds the press effect, the pager counted that as
    # a change, rebuilt its buttons under the finger, and the release fell on a button that was gone.
    def held(sel, ms=140):
        bb=None
        for _ in range(20):
            bb=pg.locator(sel).bounding_box()
            if bb: break
            pg.wait_for_timeout(100)
        if not bb: print('NOTE  '+sel+' was not on screen'); return
        pg.mouse.move(bb['x']+bb['width']/2, bb['y']+bb['height']/2); pg.wait_for_timeout(250)
        pg.mouse.down(); pg.wait_for_timeout(ms); pg.mouse.up(); pg.wait_for_timeout(350)
    pg.evaluate("__mk('<h2>Held</h2><table><tbody>'+__rows(70)+'</tbody></table>')"); pg.wait_for_timeout(400); d=pg.locator('#t-dlg')
    check('W20b the held-click window is paged into a few numbered pages', 3<=d.evaluate("d=>__state(d)")['pages']<=9 and pg.locator('#t-dlg .dlg-pager .dp-n').count()>=3, d.evaluate("d=>__state(d)"))
    h0=d.evaluate("d=>__state(d)")['page']; held('#t-dlg .dlg-pager .dp-next'); h1=d.evaluate("d=>__state(d)")['page']
    held('#t-dlg .dlg-pager .dp-n:nth-child(3)'); h2=d.evaluate("d=>__state(d)")['page']; held('#t-dlg .dlg-pager .dp-prev'); h3=d.evaluate("d=>__state(d)")['page']
    check(f'W21 «Next», a page number and «Previous» work when the click is held like a person holds it ({h0}→{h1}→{h2}→{h3})', (h1,h2,h3)==(h0+1,3,2), (h0,h1,h2,h3))
    # something in the window that never stops changing (a writing-help extension in a text box, a file still being read)
    d.evaluate("d=>{ const g=document.createElement('span'); g.id='busy-ext'; __sc(d).prepend(g); let k=0; window.__busy=setInterval(()=>{ g.className='x'+(k++%2) }, 50) }")
    pg.wait_for_timeout(300); pg.keyboard.press('Home'); pg.wait_for_timeout(200)
    tries=[]
    for _ in range(4):
        pg.keyboard.press('Home'); pg.wait_for_timeout(200)
        b0=d.evaluate("d=>__state(d)")['page']; held('#t-dlg .dlg-pager .dp-next'); b1=d.evaluate("d=>__state(d)")['page']; held('#t-dlg .dlg-pager .dp-n:nth-child(3)'); b2=d.evaluate("d=>__state(d)")['page']; tries.append((b0,b1,b2))
    pg.evaluate("clearInterval(window.__busy); document.getElementById('busy-ext').remove()"); pg.wait_for_timeout(300)
    check(f'W22 and while something else in the window keeps changing — four times over ({tries})', all((x[1],x[2])==(x[0]+1,3) for x in tries), tries)
    shut(pg)
    # ---------- mixed content: headings, text, a grid of cards, a form, and one block taller than a page
    cards=''.join(f'<div class="card" style="padding:14px;min-height:{90+(i%3)*40}px"><b>Card {i+1}</b><p>text</p></div>' for i in range(24))
    form=''.join(f'<label style="display:block;margin:10px 0">Field {i+1} <input id="f{i+1}" style="display:block;min-height:40px;width:100%"></label>' for i in range(30))
    para=''.join(f'<p>Paragraph {i+1}. '+'word '*40+'</p>' for i in range(14))
    pg.evaluate("([cards,form,para])=>__mk('<h2>One</h2>'+para+'<h3 id=\"hc\">Cards</h3><div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:12px\">'+cards+'</div><h3>Form</h3><form>'+form+'</form><h3>Tall</h3><div id=\"tall\" style=\"height:2600px;background:linear-gradient(var(--card),var(--bg))\"></div><p id=\"last\">The end.</p>')", [cards,form,para]); pg.wait_for_timeout(300)
    st,cuts,rows,end,inview=walk(pg); d=pg.locator('#t-dlg')
    check(f'W9 mixed content ({st.get("pages")} pages): no paragraph, card, field or heading is cut on any page', st['paged'] and not cuts, cuts[:5])
    last=d.evaluate("d=>{ const r=d.querySelector('#last').getBoundingClientRect(), f=d.querySelector('.dlg-pager').getBoundingClientRect().top; return r.top>=0 && r.bottom<=f+1 }")
    check('W10 a block taller than a page is shown in screens, and the last line of the window is reached', end and last and inview)
    d.evaluate("d=>{ const sc=__sc(d); for(let i=0;i<400;i++){ const b=sc.querySelector(':scope > .dlg-pager .dp-prev'); if(b.disabled) break; b.click(); } }"); hp=[]
    for k in range(st['pages']):
        hp.append(d.evaluate("d=>{ const f=d.querySelector('.dlg-pager').getBoundingClientRect().top; return [...d.querySelectorAll('h3')].filter(h=>{ const r=h.getBoundingClientRect(), n=h.nextElementSibling.getBoundingClientRect(); return r.bottom<=f+1 && r.top>0 && n.top>=f-1 }).map(h=>h.textContent) }"))
        if k<st['pages']-1: d.locator('.dlg-pager .dp-next').click()
    check('W11 no heading is left alone at the foot of a page', not any(hp), [x for x in hp if x])
    d.evaluate("d=>{ const sc=__sc(d); for(let i=0;i<400;i++){ const b=sc.querySelector(':scope > .dlg-pager .dp-prev'); if(b.disabled) break; b.click(); } }"); d.evaluate("d=>d.querySelector('#f22').focus()")
    # the page follows the focus on the next frame; on a busy machine that frame can be later than any fixed wait (this check failed
    # one run in five when four suites ran at once) — so wait for the page to arrive, up to three seconds, instead of guessing
    for _ in range(30):
        pg.wait_for_timeout(100)
        fo=d.evaluate("d=>{ const r=d.querySelector('#f22').getBoundingClientRect(), f=d.querySelector('.dlg-pager').getBoundingClientRect().top, x=d.querySelector('.dlg-bar').getBoundingClientRect().bottom; return [__state(d).page, r.top>=x-1 && r.bottom<=f+1] }")
        if fo[0]>1 and fo[1]: break
    pg.keyboard.type('abc'); pg.keyboard.press('Home'); tv=d.evaluate("d=>[d.querySelector('#f22').value, __state(d).page]")
    check(f'W12 moving to a field on another page brings its page (page {fo[0]}, the field whole in view); Home while typing stays in the field', fo[0]>1 and fo[1] and tv==['abc', fo[0]], (fo,tv))
    d.evaluate("d=>d.close()"); pg.wait_for_timeout(100); cl=pg.evaluate("(()=>{ const d=document.getElementById('t-dlg'); return [d.querySelectorAll('.dlg-pager, .dlg-pad').length, d.hasAttribute('data-paged'), d.style.overflowY] })()")
    pg.evaluate("document.getElementById('t-dlg').showModal()"); pg.wait_for_timeout(250); re=pg.locator('#t-dlg').evaluate("d=>__state(d)")
    check(f'W13 closing puts the window back as it was; opening it again starts at page 1 of {re.get("pages")}', cl==[0,False,''] and re['paged'] and re['page']==1, (cl,re)); shut(pg)
    pg.evaluate("__mk('<h2>Framed</h2><p>Top text</p><div class=\"table-wrap\" style=\"max-height:300px;overflow:auto\"><table style=\"width:100%\"><tbody>'+__rows(140)+'</tbody></table></div><p id=\"after\">After the frame.</p>'+'<p>more</p>'.repeat(30))"); pg.wait_for_timeout(300)
    st,cuts,rows,end,inview=walk(pg); fr=pg.locator('#t-dlg .table-wrap').evaluate("w=>[w.scrollHeight<=w.clientHeight+1, w.style.maxHeight]")
    check(f'W13b a long table in a frame of its own inside the window is opened into the pages ({st.get("pages")} pages): no scroll left inside, no row cut, all 140 rows', st['paged'] and fr==[True,'none'] and not cuts and len(rows)==140 and end, (fr,cuts[:3],len(rows),end))
    pg.locator('#t-dlg').evaluate("d=>d.close()"); pg.wait_for_timeout(100); back=pg.evaluate("(()=>{ const w=document.querySelector('#t-dlg .table-wrap'); return [w.style.maxHeight, w.style.overflowY, w.scrollHeight>w.clientHeight] })()")
    check(f'W13c on closing, the frame gets its own scroll back exactly ({back})', back[:2]==['300px','auto']); shut(pg)
    # ---------- a window whose body scrolls inside it (the list window's shape), Arabic, a phone
    pg.evaluate("(()=>{ const d=document.createElement('dialog'); d.className='sheet'; d.id='t-dlg'; d.innerHTML='<div class=\"sheet-head\"><h3>List</h3></div><div class=\"sheet-body\"><table style=\"width:100%\"><thead><tr><th>A</th><th>B</th><th>C</th></tr></thead><tbody>'+__rows(180)+'</tbody></table></div>'; document.body.append(d); d.showModal(); })()"); pg.wait_for_timeout(300)
    st,cuts,rows,end,inview=walk(pg); own=pg.locator('#t-dlg').evaluate("d=>[__sc(d).className, d.scrollHeight<=d.clientHeight+1]")
    check(f'W14 when the body inside the window is what scrolls, the pages are made there ({own[0]}, {st.get("pages")} pages), and the window itself does not start scrolling', st['paged'] and own==['sheet-body',True] and not cuts and len(rows)==180 and end and inview, (own,cuts[:3],len(rows),end,inview)); shut(pg)
    pg.select_option('#lang-select','ar'); pg.wait_for_timeout(400); pg.evaluate("__mk('<h2>مهام</h2><table><tbody>'+__rows(120)+'</tbody></table>')"); pg.wait_for_timeout(300); s=pg.locator('#t-dlg').evaluate("d=>__state(d)"); lab=pg.locator('#t-dlg .dlg-pager').evaluate("b=>[b.querySelector('.dp-prev').textContent, b.querySelector('.dp-next').textContent, b.getAttribute('aria-label')]")
    check(f'W15 in Arabic the pager speaks Arabic: «{s.get("status")}», {lab}', s['paged'] and 'صفحة 1 من' in s['status'] and 'السابق' in lab[0] and 'التالي' in lab[1]); shut(pg); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    check('W16 no page error so far', not errs, errs[:2])
    ph=b.new_context(viewport={'width':390,'height':844}, service_workers='block', has_touch=True, is_mobile=True); pp=ph.new_page(); pp.add_init_script(AUDIT); perr=[]; pp.on('pageerror', lambda e: perr.append(str(e)[:200]))
    pp.goto(f'http://127.0.0.1:{PORT}/#data'); pp.wait_for_timeout(1200); pp.evaluate("__mk('<h2>Tasks</h2><table style=\"width:100%\"><thead><tr><th>Task</th><th>Note</th><th>H</th></tr></thead><tbody>'+__rows(150)+'</tbody></table>')"); pp.wait_for_timeout(350)
    st,cuts,rows,end,inview=walk(pp); m=pp.locator('#t-dlg').evaluate("d=>__page(d)")
    check(f'W17 on a phone (390 px) the full-screen window is paged too: {st.get("pages")} pages, nothing cut, all 150 rows, the pager on screen, no sideways scroll', st['paged'] and not cuts and len(rows)==150 and end and inview and not m['sideways'] and not perr, (cuts[:3],len(rows),end,inview,m['sideways'],perr[:1]))
    ph.close()
    # ---------- every window the portal opens itself, on the real October data
    if not os.path.exists(OCT): print('SKIPPED the real windows: the October pull is not here — set OCT_PULL')
    else:
        pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(400); pg.set_input_files('#file-in', files=[{'name':'october.json','mimeType':'application/json','buffer':open(OCT,'rb').read()}]); pg.wait_for_timeout(2600)
        pg.evaluate("window.open=()=>null; HTMLAnchorElement.prototype.click=function(){};")
        views=pg.evaluate("[...new Set([...document.querySelectorAll('a[data-view]')].map(a=>a.getAttribute('data-view')))]"); seen={}; pressed=0
        for v in views:
            pg.evaluate("v=>{ location.hash='#'+v }", v); pg.wait_for_timeout(900); shut(pg)
            n=pg.evaluate("v=>{ const root=document.querySelector('#view-'+v)||document.querySelector('main'); window.__btn=[...root.querySelectorAll('button, [role=button], a[href=\"#\"], .tile, [class*=\"tile\"], tr[tabindex], td[tabindex], [data-k]')].filter(e=>e.offsetParent!==null && !/remove|delete|حذف|pull|publish|restore|import|upload/i.test(e.textContent+e.className)).slice(0,70); return __btn.length }", v)
            for i in range(n):
                try: opened=pg.evaluate("i=>{ const e=window.__btn[i]; if(!e||!e.isConnected||e.offsetParent===null) return null; try{ e.click() }catch(x){} const d=document.querySelector('dialog[open]'); return d ? (d.id||d.className||'dialog') : null }", i)
                except Exception: opened=None
                pressed+=1
                if not opened: continue
                pg.wait_for_timeout(600); key=opened.split()[0]
                if key in seen and seen[key]['n']>=3: shut(pg); continue
                dl=pg.locator('dialog[open]').first; dl.evaluate("d=>d.setAttribute('data-audit','1')")
                st,cuts,rows,end,inview=walk(pg,'dialog[data-audit]'); pg.evaluate("document.querySelectorAll('[data-audit]').forEach(d=>d.removeAttribute('data-audit'))")
                e=seen.setdefault(key, {'n':0,'paged':0,'pages':0,'bad':[], 'ratio':0, 'view':v}); e['n']+=1
                if st['paged']:
                    e['paged']+=1; e['pages']=max(e['pages'], st['pages'])
                    if cuts or not end or not inview: e['bad'].append((v, cuts[:2], end, inview))
                    inner=pg.evaluate("(()=>{ const d=[...document.querySelectorAll('dialog[open]')].pop(); return [...d.querySelectorAll('*')].filter(n=>!/TEXTAREA|PRE|SELECT/.test(n.tagName) && /auto|scroll/.test(getComputedStyle(n).overflowY) && n.scrollHeight > n.clientHeight*1.5 && !n.hasAttribute('data-paged')).map(n=>n.className||n.tagName) })()")
                    if inner: e['bad'].append((v,'a box inside still scrolls', inner[:3]))
                else:
                    e['ratio']=max(e['ratio'], st['ratio'])
                    if st['ratio']>1.5: e['bad'].append((v, 'long scroll left', st['ratio'], st['who']))
                shut(pg)
        print(f'      pressed {pressed} controls on {len(views)} pages; windows opened: '+'; '.join(f"{k} ×{x['n']} "+(f"paged, up to {x['pages']} pages" if x['paged'] else f"short ({x['ratio']} screens)") for k,x in seen.items()))
        bad={k:x['bad'] for k,x in seen.items() if x['bad']}
        check(f'W18 every window the portal opened on the real data ({len(seen)} kinds): none keeps a long scroll, and in the paged ones nothing is cut and the end is reached', len(seen)>=3 and not bad, bad)
        check(f'W19 at least one real window was long enough to be paged ({[k for k,x in seen.items() if x["paged"]]})', any(x['paged'] for x in seen.values()))
        check('W20 no page error after pressing through the portal', not errs, errs[:3])
    b.close()
print(f'\n{"ALL PASS" if not fails else str(len(fails))+" FAIL"}'); sys.exit(1 if fails else 0)
