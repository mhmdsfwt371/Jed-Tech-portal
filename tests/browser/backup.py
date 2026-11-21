# ADR-0149 (v9.79): the backup and the sync file are a ZIP of files, never one string of the whole register. Until 9.78 both wrote
# every attachment into one JSON text as base64; past about 380 MB of attachments the browser refused the string («Invalid string
# length») and the page said «Could not save the tender data». Here: the real buttons, a register with made-up attachments (Arabic
# names among them), the ZIP checked by Python's own reader, restored in another browser byte for byte, the sync file sent and
# received (a wrong passphrase, a file cut short), and the backups and sync files of before still read. BIG=470 runs the size the
# manager's register reached (local: it needs about 2 GB of disk and memory).
import threading, http.server, socketserver, functools, os, sys, pathlib, json, zipfile, hashlib, base64, tempfile, io
from playwright.sync_api import sync_playwright
ROOT=str(pathlib.Path(__file__).resolve().parents[2]); PORT=int(os.environ.get('PORT','9348'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
h=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory=ROOT)); threading.Thread(target=h.serve_forever,daemon=True).start()
fails=[]
def check(n,c,d=''):
    print(('PASS  ' if c else '**FAIL** ')+n+('' if c else f'  -> {d}'))
    if not c: fails.append(n)
BIG=float(os.environ.get('BIG','0') or 0)
TMP=tempfile.mkdtemp()
# made-up tenders: each file random bytes of a known size, so every byte can be compared after the round trip
FILL="""async([spec])=>{const r=indexedDB.open('afaqy-portal',1);const db=await new Promise(o=>{r.onsuccess=()=>o(r.result)});
  const bytes=(n,seed)=>{const a=new Uint8Array(n);for(let i=0;i<n;i+=65536)crypto.getRandomValues(a.subarray(i,Math.min(i+65536,n)));a[0]=seed&255;return a};
  const items=spec.map((t,k)=>({id:'sample: backup '+k,subject:'sample: Backup tender '+k,date:'2026-11-1'+(k%9),stage:'prep',status:'open',
    files:t.map((f,j)=>({id:'f'+k+'-'+j,name:f[0],kind:f[2]||'booklet',blob:new Blob([bytes(f[1],k*16+j)],{type:f[3]||'application/pdf'})}))}));
  await new Promise((o,x)=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put({items,to:null,pulledAt:''},'tenders');tx.oncomplete=()=>o();tx.onerror=()=>x(tx.error);tx.onabort=()=>x(tx.error||new Error('abort'))});db.close();return items.length}"""
# what the register holds: each tender's files with their size and SHA-256
HOLD="""async()=>{const r=indexedDB.open('afaqy-portal',1);const db=await new Promise(o=>{r.onsuccess=()=>o(r.result)});const t=await new Promise(o=>{const q=db.transaction('kv').objectStore('kv').get('tenders');q.onsuccess=()=>o(q.result)});db.close();
  if(!t)return {};const out={};for(const i of t.items){out[i.id]=[];for(const f of i.files||[]){const b=await f.blob.arrayBuffer();const d=await crypto.subtle.digest('SHA-256',b);out[i.id].push([f.name,b.byteLength,[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')])}out[i.id].sort()}return out}"""
def boot(p, name):
    c=p.chromium.launch_persistent_context(os.path.join(TMP,name), channel='chromium', viewport={'width':1366,'height':800}, service_workers='block', accept_downloads=True)
    pg=c.pages[0] if c.pages else c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: d.dismiss())
    pg.goto(f'http://127.0.0.1:{PORT}/'); pg.wait_for_timeout(1500); pg.select_option('#lang-select','en'); pg.wait_for_timeout(300)
    return c,pg,errs
def data(pg):   # the Data page, with «Other ways and backup» opened as a person opens it
    pg.evaluate("location.hash='#data'"); pg.wait_for_timeout(900)
    pg.evaluate("()=>{const d=document.getElementById('export-btn').closest('details'); if(d&&!d.open) d.querySelector('summary').click()}"); pg.wait_for_timeout(300)
def toast(pg): return pg.locator('#toast').inner_text()
SPEC=[[['كراسة الشروط والمواصفات.pdf',1200000],['BOQ جدول الكميات.xlsx',300000,'boq','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']],
      [['booklet: part 1/2 «final».pdf',900000]],
      [['photo.jpg',150000,'other','image/jpeg'],['offer.pdf',400000,'technical']]]
if BIG: SPEC=[[[f'booklet-{k}-{j}.pdf',1500000] for j in range(7)] for k in range(int(BIG/1.5/7)+1)]
with sync_playwright() as p:
    a,pa,ea=boot(p,'a')
    pa.evaluate(FILL,[SPEC]); pa.reload(); pa.wait_for_timeout(1800); held=pa.evaluate(HOLD)
    data(pa)
    with pa.expect_download(timeout=600000) as dl: pa.locator('#export-btn').click()
    zpath=os.path.join(TMP,'backup.zip'); dl.value.save_as(zpath); name=dl.value.suggested_filename
    z=zipfile.ZipFile(zpath); bad=z.testzip(); names=z.namelist(); man=json.loads(z.read('backup.json'))
    inzip={}
    for it in man['tenders']['items']:
        inzip[it['id']]=sorted([f['name'], len(z.read(f['zip'])), hashlib.sha256(z.read(f['zip'])).hexdigest()] for f in it['files'])
    check('K1 «Export a backup» saves a ZIP that Python\'s own reader opens with every CRC right: backup.json (afaqy-portal/v3) and each attachment as itself, byte for byte',
        name.startswith('afaqy-portal-backup-') and name.endswith('.zip') and bad is None and 'backup.json' in names and man.get('backup')=='afaqy-portal/v3' and inzip=={k:[list(x) for x in v] for k,v in held.items()} and 'data:' not in z.read('backup.json').decode('utf-8'),
        (name, bad, man.get('backup'), len(names)))
    ar=[n for n in names if 'كراسة' in n]
    check('K2 the files in the ZIP keep their names, Arabic ones too, safe for Windows (no folder or forbidden sign from a name)', (BIG or bool(ar)) and all(n=='backup.json' or (n.startswith('files/') and n.count('/')==1 and not any(ch in n[6:] for ch in ':*?"<>|')) for n in names), names[:6])
    check('K3 the Data page says how much the portal keeps on this device', 'MB on this device' in pa.locator('#bk-last').inner_text(), pa.locator('#bk-last').inner_text())
    # the sync file: a wrong passphrase, a file cut short, then the right one — in another browser
    pa.locator('input[type=password]').last.fill('secret-pass-1')
    with pa.expect_download(timeout=600000) as dl: pa.locator('.sync-send').click()
    spath=os.path.join(TMP,'sync.afqs'); dl.value.save_as(spath); sent=toast(pa)
    raw=open(spath,'rb').read()
    check('K4 «Send to my other device» saves a sealed file (version 2) and says its size', raw[:5]==b'AFQS\x02' and 'File saved' in sent and 'Could not' not in sent, (raw[:5], sent))
    check('K5 no page error while saving', not ea, ea[:2]); a.close()
    b,pb,eb=boot(p,'b'); data(pb)
    pb.locator('input[type=password]').last.fill('wrong-pass-9'); pb.locator('.sync-recv-in').set_input_files(spath); pb.wait_for_timeout(3000)
    w=toast(pb); none=pb.evaluate(HOLD)
    cut=os.path.join(TMP,'cut.afqs'); open(cut,'wb').write(raw[:-7])
    pb.locator('input[type=password]').last.fill('secret-pass-1'); pb.locator('.sync-recv-in').set_input_files(cut); pb.wait_for_timeout(3000)
    c2=toast(pb); none2=pb.evaluate(HOLD)
    check('K6 a wrong passphrase, or a file cut short, opens nothing and says which', 'Wrong passphrase' in w and 'not a portal sync file' in c2 and none=={} and none2=={}, (w, c2, len(none), len(none2)))
    pb.locator('input[type=password]').last.fill('secret-pass-1'); pb.locator('.sync-recv-in').set_input_files(spath); pb.wait_for_timeout(8000 if not BIG else 120000)
    got=pb.evaluate(HOLD)
    check('K7 received with the passphrase: every tender and every attachment arrives byte for byte', got==held, (len(got), len(held)))
    check('K8 no page error on the receiving side', not eb, eb[:2]); b.close()
    # the backup ZIP restored on a third browser
    c,pc,ec=boot(p,'c'); data(pc); pc.locator('#import-in').set_input_files(zpath); pc.wait_for_timeout(8000 if not BIG else 120000)
    got=pc.evaluate(HOLD); rt=toast(pc)
    check('K9 «Restore a backup» takes the ZIP and puts every attachment back byte for byte', got==held and 'restored' in rt, (len(got), rt))
    # the backups of before: a v2 JSON with its attachment written in as text, and a sync file of version 1
    legacy={'backup':'afaqy-portal/v2','exportedAt':'2026-11-01T10:00:00Z','datasets':[],'reports':[],'tenders':{'items':[{'id':'sample: legacy','subject':'sample: Legacy tender','date':'2026-11-02','stage':'prep','status':'open',
        'files':[{'id':'L1','name':'old.pdf','kind':'booklet','data':'data:application/pdf;base64,'+base64.b64encode(b'%PDF-old backup').decode()}]}],'to':None,'pulledAt':''}}
    lpath=os.path.join(TMP,'old-backup.json'); open(lpath,'w').write(json.dumps(legacy)); pc.locator('#import-in').set_input_files(lpath); pc.wait_for_timeout(2500)
    old=pc.evaluate(HOLD).get('sample: legacy')
    v1=pc.evaluate("""async(j)=>{const pass='old-pass-22',enc=new TextEncoder(),salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
      const base=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt']);
      const gz=new Uint8Array(await new Response(new Blob([JSON.stringify(j)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
      const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,gz));const out=new Uint8Array(5+16+12+ct.length);out.set([0x41,0x46,0x51,0x53,1]);out.set(salt,5);out.set(iv,21);out.set(ct,33);
      return [...out]}""", {**legacy,'tenders':{**legacy['tenders'],'items':[{**legacy['tenders']['items'][0],'id':'sample: legacy sync','subject':'sample: Legacy sync tender'}]}})
    v1p=os.path.join(TMP,'old.afqs'); open(v1p,'wb').write(bytes(v1)); pc.locator('input[type=password]').last.fill('old-pass-22'); pc.locator('.sync-recv-in').set_input_files(v1p); pc.wait_for_timeout(3000)
    oldsync=pc.evaluate(HOLD).get('sample: legacy sync')
    check('K10 a JSON backup and a sync file made before 9.79 are still read, their attachment with them', old and old[0][1]==len(b'%PDF-old backup') and oldsync and oldsync[0][1]==len(b'%PDF-old backup'), (old, oldsync))
    for lang in ('ar','ur'):
        pc.select_option('#lang-select',lang); pc.wait_for_timeout(500); pc.locator('#export-btn').click(); pc.wait_for_timeout(300); t0=toast(pc)
        check(f'K11[{lang}] the message while the file is prepared is in the language, with no raw key', t0 and 'bk_' not in t0 and not t0.startswith('Preparing'), t0)
        pc.wait_for_timeout(2500)
    check('K12 no page error on the restoring side', not ec, ec[:2]); c.close()
h.shutdown()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
