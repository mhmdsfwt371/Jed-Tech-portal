"""Tests for the AFAQY Mail Extractor. Real reading is tested on the public sample PST/OST files (pst-extractor's test data,
downloaded at test time, never committed); everything a sample cannot hold — a missing Message-ID, the same message in two
folders, Arabic subjects, the October boundaries, an interrupted run, 300,000 messages — on synthetic messages."""
import datetime as dt, gzip, json, os, sys, tempfile, time, tracemalloc, unittest
sys.path.insert(0, os.path.dirname(__file__)); import afaqy_extract as X
SAMPLES = os.environ.get('PST_SAMPLES', '/tmp/pst/node_modules/pst-extractor/example/testdata')

class Msg:
    def __init__(self, subject, sender, name, sent, recv=None, msgid=None, recips=()):
        self.subject, self.sender_name = subject, name
        self.client_submit_time, self.delivery_time = sent, recv or sent
        self.props = {X.P_MSGID: msgid, X.P_SENDER_SMTP: sender if sender and '@' in sender else None, X.P_SENDER_EMAIL: sender}
        self.recipients = Rc(recips)
class Rc:
    def __init__(self, rs): self.rs = list(rs); self.number_of_sub_items = len(self.rs)
    def get_sub_item(self, i):
        a, k = self.rs[i]; o = type('R', (), {})(); o.props = {X.R_SMTP: a, X.R_TYPE: k}; return o
def T(s): return dt.datetime.fromisoformat(s).replace(tzinfo=dt.timezone.utc)
def read(path):
    with gzip.open(path, 'rt', encoding='utf-8') as g: L = [json.loads(x) for x in g]
    return L[0], L[1:]

class Extract(unittest.TestCase):
    def setUp(self): self.d = tempfile.mkdtemp(); self.out = os.path.join(self.d, 'o.jsonl.gz')
    def test_01_small_real_pst(self):
        p = os.path.join(SAMPLES, 'enron.pst')
        if not os.path.exists(p): self.skipTest('sample PST not present')
        h, R = read(self.out) if X.run(p, self.out, scope='all') else (None, None)
        self.assertEqual(h['schema'], 'afaqy-mail-activity/v1'); self.assertEqual(h['counts']['kept'], len(R)); self.assertGreater(len(R), 50)
        self.assertTrue(all(r['f'].startswith('/') and r['k'] and (r['st'] or r['rt']) for r in R))
        self.assertGreater(len({r['f'] for r in R}), 3, 'several folders read')
    def test_01b_path_with_space_forward_slash_and_drive(self):
        """The 1.0.1 failure: the file picker gives «E:/OCTOBER inbox.pst» (forward slash, a space); libpff mangled it."""
        import shutil
        src = os.path.join(SAMPLES, 'enron.pst')
        if not os.path.exists(src): self.skipTest('sample PST not present')
        d = os.path.join(self.d, 'Mail Folder (October)', 'صندوق الوارد'); os.makedirs(d)
        dst = os.path.join(d, 'OCTOBER inbox.pst'); shutil.copy(src, dst)
        as_picker = os.path.abspath(dst).replace(os.sep, '/')   # exactly what the Tk file picker returns on Windows
        h, R = read(self.out) if X.run(as_picker, self.out, scope='all') else (None, None)
        self.assertEqual(h['counts']['errors'], 0); self.assertGreater(len(R), 50); self.assertEqual(h['source'], 'OCTOBER inbox.pst')
    def test_02_real_ost(self):
        p = os.path.join(SAMPLES, 'pstextractortest@outlook.com.ost')
        if not os.path.exists(p): self.skipTest('sample OST not present')
        h, R = read(self.out) if X.run(p, self.out, scope='all') else (None, None)
        self.assertEqual(h['counts']['errors'], 0); self.assertEqual(h['counts']['kept'], len(R))
    def test_03_duplicates_across_folders_count_once(self):
        m = Msg('Integration API keys', 'eng.a@afaqy.com', 'Eng A', T('2026-10-05T08:00:00'), msgid='<x1@afaqy.com>')
        h = X.run([('/Inbox', 0, m), ('/Inbox/Projects', 0, m), ('/Inbox/Archive', 3, m)], self.out)
        self.assertEqual((h['counts']['kept'], h['counts']['dup']), (1, 2))
    def test_04_missing_message_id_uses_fallback_key(self):
        a = Msg('RE: wasl contract', 'eng.b@afaqy.com', 'Eng B', T('2026-10-06T09:00:00'))
        b = Msg('wasl contract', 'eng.b@afaqy.com', 'Eng B', T('2026-10-06T09:00:00'))   # same mail filed twice, one with «RE:» stripped by a rule
        c = Msg('wasl contract', 'eng.b@afaqy.com', 'Eng B', T('2026-10-06T09:05:00'))   # a different time: a different message
        h, R = read(self.out) if X.run([('/Inbox', 0, a), ('/Inbox/x', 0, b), ('/Inbox', 1, c)], self.out) else (None, None)
        self.assertEqual((h['counts']['kept'], h['counts']['dup'], h['counts']['fallback']), (2, 1, 2)); self.assertTrue(all(r['fb'] and r['k'].startswith('fb') for r in R))
    def test_05_arabic_and_english_subjects_kept_exactly(self):
        subs = ['طلب جديد — استفسار عن الربط', 'تكامل API مع وصل', 'New inquiry: GPS units']
        h, R = read(self.out) if X.run([('/Inbox', i, Msg(s, 'e@afaqy.com', 'E', T(f'2026-10-0{i+1}T10:00:00'), msgid=f'<{i}@a>')) for i, s in enumerate(subs)], self.out) else (None, None)
        self.assertEqual([r['s'] for r in R], subs)
    def test_06_october_boundaries(self):
        ms = [('/Inbox', i, Msg('s', 'e@afaqy.com', 'E', T(t), msgid=f'<b{i}@a>')) for i, t in enumerate(['2026-09-30T23:59:59', '2026-10-01T00:00:00', '2026-10-31T23:59:59', '2026-11-01T00:00:00'])]
        h, R = read(self.out) if X.run(ms, self.out, '2026-10-01', '2026-10-31') else (None, None)
        self.assertEqual([r['rt'] for r in R], ['2026-10-01T00:00:00Z', '2026-10-31T23:59:59Z']); self.assertEqual(h['counts']['out_of_range'], 2)
    def test_07_sender_is_an_address_never_a_display_name(self):
        ms = [('/Inbox', 0, Msg('s', '/o=afaqy/ou=exchange/cn=recipients/cn=7a1b-a.ibrahim', 'Ahmed', T('2026-10-02T10:00:00'), msgid='<e1@a>')),
              ('/Inbox', 1, Msg('s', None, 'Display Only', T('2026-10-02T11:00:00'), msgid='<e2@a>')),
              ('/Inbox', 2, Msg('s', 'Eng.C@AFAQY.com', 'Eng C', T('2026-10-02T12:00:00'), msgid='<e3@a>'))]
        h, R = read(self.out) if X.run(ms, self.out) else (None, None)
        self.assertEqual([r['fe'] for r in R], ['ex:a.ibrahim', '', 'eng.c@afaqy.com'])
    def test_08_recipients_are_counts_and_domains_only(self):
        m = Msg('s', 'e@afaqy.com', 'E', T('2026-10-03T10:00:00'), msgid='<r@a>', recips=[('a@client.sa', 1), ('b@client.sa', 1), ('mgr@afaqy.com', 2), ('hidden@x.com', 3)])
        h, R = read(self.out) if X.run([('/Inbox', 0, m)], self.out) else (None, None)
        self.assertEqual((R[0]['to'], R[0]['cc'], R[0]['rd']), (2, 1, ['afaqy.com', 'client.sa', 'x.com']))
        self.assertNotIn('a@client.sa', json.dumps(R[0]))
    def test_09_interrupted_run_resumes_without_doubles(self):
        ms = [('/Inbox', i, Msg(f's{i}', 'e@afaqy.com', 'E', T('2026-10-04T10:00:00') + dt.timedelta(minutes=i), msgid=f'<z{i}@a>')) for i in range(2000)]
        class Stop(Exception): pass
        def first_half():
            for k, x in enumerate(ms):
                if k == 1300: raise Stop()
                yield x
        with self.assertRaises(Stop): X.run(first_half(), self.out, every=100)
        self.assertTrue(os.path.exists(self.out + '.checkpoint.json'))
        h, R = read(self.out) if X.run(iter(ms), self.out, every=100) else (None, None)
        self.assertEqual(len(R), 2000); self.assertEqual(len({r['k'] for r in R}), 2000); self.assertFalse(os.path.exists(self.out + '.checkpoint.json'))
    def test_10_memory_stays_bounded_with_300k_messages(self):
        N = 300_000
        def stream():
            base = T('2026-10-01T06:00:00')
            for i in range(N): yield ('/Inbox' if i % 3 else '/Inbox/Sub', i, Msg(f'Ticket {i} — طلب صيانة', f'eng{i % 40}@afaqy.com', f'Eng {i % 40}', base + dt.timedelta(seconds=7 * i), msgid=f'<{i}@afaqy.com>'))
        tracemalloc.start(); t = time.time(); h = X.run(stream(), self.out, every=5000); cur, peak = tracemalloc.get_traced_memory(); tracemalloc.stop()
        self.assertEqual(h['counts']['kept'], N)
        mb = peak / 1048576; print(f'\n    300k messages: {time.time() - t:.1f}s, peak Python memory {mb:.1f} MB, file {os.path.getsize(self.out) / 1048576:.1f} MB')
        self.assertLess(mb, 120, 'memory must not grow with the mailbox beyond the seen-key set')
if __name__ == '__main__': unittest.main(verbosity=2)
