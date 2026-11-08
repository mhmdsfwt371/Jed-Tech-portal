"""AFAQY Mail Extractor — reads an Outlook PST/OST on this computer, one message at a time, and writes a compact
activity file for the portal (schema afaqy-mail-activity/v1, gzip JSON lines). Nothing leaves the computer.

Bounded memory: folders are walked lazily, each message is written as soon as it is read and then dropped; bodies and
attachments are never opened. The only thing that grows is the set of seen keys (about 60 bytes per message), kept so a
message filed in two folders counts once. A checkpoint is written as it goes, so an interrupted run resumes.
"""
import gzip, hashlib, json, os, re, sys, time, datetime as dt

SCHEMA = 'afaqy-mail-activity/v1'
VERSION = '1.0.0'
P_MSGID, P_SENDER_SMTP, P_SENDER_EMAIL, P_TO, P_CC = 0x1035, 0x5D01, 0x0C1F, 0x0E04, 0x0E03
R_SMTP, R_EMAIL, R_TYPE = 0x39FE, 0x3003, 0x0C15
SKIP = re.compile(r'^(sent items|sent|deleted items|deleted|outbox|drafts|junk( e-?mail)?|spam|conversation history|sync issues.*|calendar|contacts|tasks|notes|journal|'
                  r'العناصر المرسلة|المرسلة|العناصر المحذوفة|المحذوفة|علبة الصادر|المسودات|البريد العشوائي|التقويم|جهات الاتصال|المهام|الملاحظات)$', re.I)
INBOX = re.compile(r'^(inbox|البريد الوارد|علبة الوارد|posteingang|boîte de réception)$', re.I)

def iso(t):
    if not t: return None
    if t.tzinfo is None: t = t.replace(tzinfo=dt.timezone.utc)
    return t.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

def norm_subject(s):
    s = re.sub(r'^\s*((re|fw|fwd|رد|إعادة توجيه|تحويل)\s*:\s*)+', '', s or '', flags=re.I)
    return re.sub(r'\s+', ' ', s).strip().lower()

def clean_addr(a):
    """SMTP address in lower case; an Exchange address (/o=…/cn=…-alias) becomes ex:alias — never a display name."""
    a = (a or '').strip().strip('<>').lower()
    if not a: return ''
    if a.startswith('/o=') or a.startswith('/cn='):
        m = re.search(r'/cn=(?:[^/]*-)?([^/-][^/]*)$', a)
        return f'ex:{m.group(1)}' if m else ''
    return a if '@' in a else ''

def message_key(msgid, sender, sent, subject):
    """Deduplication key: the Internet Message-ID; when a message has none, sender + sent time (to the second) +
    normalised subject — marked as a fallback so it can be audited."""
    if msgid and msgid.strip():
        return hashlib.sha1(msgid.strip().lower().encode('utf-8')).hexdigest()[:20], False
    raw = f'{sender}|{sent or ""}|{norm_subject(subject)}'
    return 'fb' + hashlib.sha1(raw.encode('utf-8')).hexdigest()[:18], True

# ---------------- reading a PST through libpff ----------------
def _prop(item, tag):
    if hasattr(item, 'props'): return item.props.get(tag)   # test messages carry their properties directly
    try:
        for r in range(item.number_of_record_sets):
            rs = item.get_record_set(r)
            for j in range(rs.number_of_entries):
                e = rs.get_entry(j)
                if e.entry_type == tag:
                    try: return e.get_data_as_string()
                    except Exception:
                        try: return e.get_data_as_integer()
                        except Exception: return None
    except Exception: return None
    return None

def _recipients(m):
    to, cc, doms = 0, 0, set()
    try: rc = m.recipients
    except Exception: rc = None
    n = getattr(rc, 'number_of_sub_items', 0) if rc is not None else 0
    for i in range(n or 0):
        try: r = rc.get_sub_item(i)
        except Exception: continue
        addr = clean_addr(_prop(r, R_SMTP) or _prop(r, R_EMAIL)); kind = _prop(r, R_TYPE)
        if kind == 2: cc += 1
        elif kind != 3: to += 1
        if '@' in addr: doms.add(addr.split('@', 1)[1])
    if n == 0:   # no recipients table: count the display lines (names only, never kept)
        to = len([x for x in re.split(r';', _prop(m, P_TO) or '') if x.strip()]); cc = len([x for x in re.split(r';', _prop(m, P_CC) or '') if x.strip()])
    return to, cc, sorted(doms)

def pst_messages(path, scope='inbox', skip_folders=None):
    """Yield (folder_path, index, message) lazily. scope='inbox': the Inbox and its subfolders; scope='all': every mail
    folder except sent, deleted, drafts, outbox, junk and non-mail folders."""
    import pypff
    f = pypff.file(); f.open(path)
    root = f.get_root_folder()
    def walk(folder, fpath, inside):
        for i in range(folder.number_of_sub_folders):
            sub = folder.get_sub_folder(i); name = (sub.name or '').strip(); p = f'{fpath}/{name}'
            if SKIP.match(name): continue
            here = inside or scope == 'all' or bool(INBOX.match(name))
            if here and (skip_folders is None or p not in skip_folders):
                for k in range(sub.number_of_sub_messages):
                    try: yield p, k, sub.get_sub_message(k)
                    except Exception as e: yield p, k, e
            yield from walk(sub, p, here)
    yield from walk(root, '', False)
    f.close()

def record_of(m, fpath):
    sender_name = (m.sender_name or '').strip()
    sender = clean_addr(_prop(m, P_SENDER_SMTP)) or clean_addr(_prop(m, P_SENDER_EMAIL))
    sent, recv = iso(m.client_submit_time), iso(m.delivery_time)
    subject = m.subject or ''
    key, fb = message_key(_prop(m, P_MSGID), sender or sender_name.lower(), sent, subject)
    to, cc, doms = _recipients(m)
    return {'k': key, 'fb': fb, 'fn': sender_name, 'fe': sender, 's': subject, 'st': sent, 'rt': recv, 'to': to, 'cc': cc, 'rd': doms, 'f': fpath}

# ---------------- the run ----------------
def in_range(rec, d_from, d_to, by='rt'):
    t = rec.get(by) or rec.get('st')
    if not t: return False
    day = t[:10]   # UTC day; the portal re-checks on the Saudi day
    return (not d_from or day >= d_from) and (not d_to or day <= d_to)

def run(source, out_path, d_from=None, d_to=None, scope='inbox', progress=None, every=500, reader=None):
    """source: path to a .pst/.ost (or, for tests, an iterable of (folder, index, message-like)). Writes out_path
    (gzip JSON lines: a header line, then one record per kept message) and returns the counts."""
    t0 = time.time(); part = out_path + '.part'; ck = out_path + '.checkpoint.json'
    seen, counts, done_folders, resume_at = set(), {'read': 0, 'kept': 0, 'dup': 0, 'fallback': 0, 'out_of_range': 0, 'errors': 0}, set(), {}
    if os.path.exists(ck) and os.path.exists(part):   # resume: reload what was written and where we stopped
        with open(ck, encoding='utf-8') as fh: state = json.load(fh)
        counts.update(state.get('counts', {})); done_folders = set(state.get('done', []))
        resume_at = {state['folder']: state['index']} if state.get('folder') else {}
        with gzip.open(part, 'rt', encoding='utf-8') as g:
            for line in g:
                try: r = json.loads(line)
                except Exception: continue
                if 'k' in r: seen.add(r['k'])
        mode = 'at'
    else: mode = 'wt'
    peak = 0
    def rss():
        try:
            import psutil; return psutil.Process().memory_info().rss
        except Exception:
            try:
                import resource; v = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss; return v * 1024 if sys.platform != 'darwin' else v
            except Exception: return 0
    msgs = (reader or pst_messages)(source, scope, done_folders) if isinstance(source, str) else source
    cur_folder, last_folder = None, None
    with gzip.open(part, mode, encoding='utf-8') as out:
        for fpath, idx, m in msgs:
            if fpath != last_folder:
                if last_folder: done_folders.add(last_folder)
                last_folder = fpath
            if fpath in resume_at and idx < resume_at[fpath]: continue
            counts['read'] += 1
            if isinstance(m, Exception): counts['errors'] += 1; continue
            try: rec = record_of(m, fpath) if not isinstance(m, dict) else m
            except Exception: counts['errors'] += 1; continue
            if not in_range(rec, d_from, d_to): counts['out_of_range'] += 1; continue
            if rec['k'] in seen: counts['dup'] += 1; continue
            seen.add(rec['k']); counts['kept'] += 1; counts['fallback'] += 1 if rec['fb'] else 0
            out.write(json.dumps(rec, ensure_ascii=False, separators=(',', ':')) + '\n')
            if counts['read'] % every == 0:
                peak = max(peak, rss()); out.flush()
                with open(ck + '.tmp', 'w', encoding='utf-8') as fh: json.dump({'counts': counts, 'done': sorted(done_folders), 'folder': fpath, 'index': idx + 1}, fh)
                os.replace(ck + '.tmp', ck)   # atomic: a cut mid-write never leaves a broken checkpoint
                if progress: progress(dict(counts, folder=fpath, seconds=round(time.time() - t0, 1), peak_mb=round(peak / 1048576, 1)))
    peak = max(peak, rss())
    size = os.path.getsize(source) if isinstance(source, str) and os.path.exists(source) else None
    head = {'schema': SCHEMA, 'helper': VERSION, 'source': os.path.basename(source) if isinstance(source, str) else 'test', 'source_bytes': size,
            'from': d_from, 'to': d_to, 'by': 'received', 'scope': scope, 'extracted_at': iso(dt.datetime.now(dt.timezone.utc)),
            'counts': counts, 'seconds': round(time.time() - t0, 1), 'peak_mb': round(peak / 1048576, 1)}
    # final file: header first, then the records (streamed, so the records are never held in memory)
    with gzip.open(out_path, 'wt', encoding='utf-8') as fin, gzip.open(part, 'rt', encoding='utf-8') as src:
        fin.write(json.dumps(head, ensure_ascii=False) + '\n')
        for line in src: fin.write(line)
    os.remove(part)
    if os.path.exists(ck): os.remove(ck)
    return head

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(description='AFAQY Mail Extractor (command line). Double-click «AFAQY Mail Extractor» for the window.')
    ap.add_argument('pst'); ap.add_argument('out'); ap.add_argument('--from', dest='d_from'); ap.add_argument('--to', dest='d_to')
    ap.add_argument('--scope', choices=['inbox', 'all'], default='inbox'); a = ap.parse_args()
    h = run(a.pst, a.out, a.d_from, a.d_to, a.scope, progress=lambda p: print(json.dumps(p, ensure_ascii=False), flush=True))
    print(json.dumps(h, ensure_ascii=False, indent=1))
