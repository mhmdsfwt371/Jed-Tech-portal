# v9.42 — the assignment panel, run inside a stand-in for MyAFAQY (no real account is touched): each account counted once though
# the grid repeats accounts across pages, MyAFAQY's own refusal shown per account, an unasked removal locks «apply to the rest»,
# and five refusals in a row stop the run. The stand-in answers like the real server did in the 14 Nov 2026 log.
import json, base64, time, sys, pathlib, subprocess
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]
code = subprocess.run(['node', '--input-type=module', '-e', f"const c=await import('{ROOT}/core.js'); process.stdout.write(decodeURIComponent(c.buildAssignBookmarklet('en').slice(11)))"], capture_output=True, text=True, check=True).stdout
fails = []
def check(n, c, d=''):
    print(('PASS  ' if c else '**FAIL** ') + n + ('' if c else f'  -> {d}'))
    if not c: fails.append(n)
b64 = lambda o: base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip('=')
TOKEN = b64({'alg': 'none'}) + '.' + b64({'UserId': 70, 'exp': int(time.time()) + 7200}) + '.x'
ENG = [{'id': i, 'nameEn': n} for i, n in [(1, 'Eng One'), (2, 'Eng Two'), (3, 'Eng Three'), (4, 'Eng Four'), (5, 'Eng Five'), (6, 'Eng Six'), (99, 'Left Person')]]
state = {'acc': {}, 'mode': 'real', 'assign': 0}
def reset():
    state['acc'] = {str(1000 + i): {'branchCode': '2', 'have': [1, 2, 3, 99]} for i in range(30)}
    state['acc'].update({str(2000 + i): {'branchCode': '1', 'have': [1]} for i in range(5)})
    state['assign'] = 0
reset()
def grid(body):
    ids = sorted(state['acc']); size = 10; pg = body.get('pageNumber', 0)
    page = [ids[(pg * size - 3 + k) % len(ids)] for k in range(size)] if pg * size < len(ids) else []   # pages overlap by 3, like the repeats seen
    return {'data': {'data': [{'id': int(i), 'customerId': int(i), 'branchCode': state['acc'][i]['branchCode'], 'afterSalesManIds': state['acc'][i]['have'], 'connectedDevices': 2} for i in page], 'listCount': len(ids), 'pageSize': size, 'totalPages': 4}, 'success': True}
def handle(route):
    req = route.request; path = req.url.split('crmbackend.afaqy.sa/')[1]; body = json.loads(req.post_data or '{}') if req.post_data else {}
    if path.startswith('Teams/GetAllTeams'): out = {'data': {'data': [], 'totalPages': 1}, 'success': True}
    elif path.startswith('AfterSales/GetAllAfterSalesEngineers'): out = {'data': ENG, 'success': True}
    elif path.startswith('AfterSales/GetAfterSalesRequestGrid'): out = grid(body)
    elif path.startswith('AfterSales/AssignAfterSales'):
        state['assign'] += 1; ids = body['afterSalesIds']; a = state['acc'][str(body['customerId'])]
        if state['mode'] == 'reject' or 99 in ids: out = {'data': None, 'success': False, 'message': 'The item you are looking for not found'}
        else:
            a['have'] = [x for x in ids if not (state['mode'] == 'drop' and x == 3)]   # «drop»: the server loses someone, as happened to one engineer
            out = {'data': None, 'success': True, 'status': 202}
    else: out = {'success': True, 'data': []}
    route.fulfill(status=200, content_type='application/json', body=json.dumps(out), headers={'access-control-allow-origin': '*'})
with sync_playwright() as p:
    b = p.chromium.launch(); c = b.new_context(viewport={'width': 1300, 'height': 900}); pg = c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    c.route('https://myafaqy.com/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<!doctype html><html><body><h1>stand-in</h1></body></html>'))
    c.route('https://crmbackend.afaqy.sa/**', handle)
    def open_panel():
        pg.goto('https://myafaqy.com/'); pg.evaluate("t=>localStorage.setItem('token',t)", TOKEN); pg.evaluate(code); pg.wait_for_selector('#afaqy-assign button', timeout=15000); pg.wait_for_timeout(1500)
    P = lambda: pg.locator('#afaqy-assign')
    tick = lambda name: P().locator('label', has_text=name).first.locator('input').check()
    def press(text):
        pg.evaluate("() => document.querySelectorAll('#afaqy-assign button').forEach(b => b.dataset.old = '1')")   # the panel redraws its buttons when a step ends
        P().get_by_role('button', name=text).click()
        pg.wait_for_function("() => { const b = document.getElementById('afaqy-assign'); return b && [...b.querySelectorAll('button')].some(x => !x.dataset.old) && !/Applying|Reading accounts/.test(b.innerText) }", timeout=90000); pg.wait_for_timeout(300)
    open_panel()   # no Jeddah team in the stand-in: the panel lists every engineer
    summary = P().inner_text()
    check('A1 the grid repeats accounts across pages, the panel counts each once: 30 Jeddah accounts, not more', '30 Jeddah accounts' in summary, summary[:300])
    eng1 = P().locator('label', has_text='Eng One').first.inner_text()
    check(f'A2 the number beside an engineer is his real count ({eng1.strip()})', eng1.strip().endswith('30'))
    tick('Eng Six'); press('Pilot on 10'); t1 = P().inner_text();
    check(f'A3 MyAFAQY refuses a list that carries someone it does not find: its reply is shown per account with what to do, and after five refusals the pilot stops sending ({state["assign"]} sent)', t1.count('The item you are looking for not found') == 5 and t1.count('not sent: Stopped after 5 errors') == 5 and 'Tick whoever left in the removal section' in t1 and state['assign'] == 5, t1[-600:])
    P().locator('summary').click(); P().locator('details label', has_text='Left Person').first.locator('input').check(); pg.wait_for_timeout(200)
    press('Pilot on 10'); t2 = P().inner_text(); rows = P().locator('table tr').all_inner_texts();
    ok_rows = [r for r in rows[1:] if r.strip().endswith('ok')]
    check(f'A4 with the one who left ticked for removal, the pilot works: «Eng Six» added and «Left Person» removed by name on all ten ({len(ok_rows)})', len(ok_rows) == 10 and all('Eng Six' in r and 'Left Person' in r for r in ok_rows), rows[:3])
    check('A5 nothing locked: nobody was removed who was not ticked', 'were removed from the account' not in t2)
    state['mode'] = 'drop'; tick('Eng Five'); press('Pilot on 10'); t3 = P().inner_text()
    check('A6 when MyAFAQY drops someone nobody ticked (as happened to one engineer), the panel says so in red and names him', 'People you did not tick were removed' in t3 and 'Eng Three' in t3, t3[-700:])
    before = state['assign']; P().get_by_role('button', name='Apply to the rest').click(); pg.wait_for_timeout(2500); t4 = P().inner_text()   # locked: nothing to wait for
    check(f'A7 «Apply to the rest» is then locked: no account is sent ({state["assign"] - before} sent)', state['assign'] == before and 'Locked' in t4, t4[:300])
    reset(); state['mode'] = 'reject'; open_panel(); tick('Eng Four'); press('Apply to the rest'); pg.wait_for_timeout(3000)
    check(f'A8 five refusals in a row stop the run instead of sending all 30 ({state["assign"]} sent)', state['assign'] == 5 and 'Stopped after 5 errors' in P().inner_text())
    check('A9 no script error', not errs, errs[:2]); b.close()
print(f'\n{"ALL PASS" if not fails else str(len(fails)) + " FAIL"}'); sys.exit(1 if fails else 0)
