// ADR-0095 — the Manager-Inbox email activity: parsing, re-import, coverage, counting, identity
import { maParse, maMerge, maCovers, maStats, maSuggest, maDay } from '../core.js';
let n = 0, fail = 0; const ok = (name, c, d) => { n++; if (!c) { fail++; console.log('FAIL', name, d ?? ''); } };
const head = (from, to, src = 'inbox.pst') => JSON.stringify({ schema: 'afaqy-mail-activity/v1', source: src, from, to, counts: {}, extracted_at: '2026-11-02T08:00:00Z' });
const rec = (k, fe, s, rt, extra = {}) => JSON.stringify({ k, fe, fn: 'N', s, rt, st: rt, f: '/Inbox', to: 1, cc: 0, rd: [], ...extra });
const file = (from, to, rs, src) => [head(from, to, src), ...rs].join('\n');
// parse
ok('bad schema refused', maParse('{"schema":"x"}').error === 'ma_bad_schema');
const p1 = maParse(file('2026-10-01', '2026-10-31', [rec('a', 'Eng.A@afaqy.com', 'تكامل API', '2026-10-05T07:00:00Z'), 'not json', rec('', 'x@a', 's', '2026-10-05T07:00:00Z'), rec('b', 'eng.b@afaqy.com', 'wasl', 'bad-time')]));
ok('good lines kept, bad lines counted, addresses lower-cased', p1.recs.length === 1 && p1.bad === 3 && p1.recs[0].fe === 'eng.a@afaqy.com', p1);
// Saudi day: 21:30 UTC on 31 Oct is 1 Nov in Riyadh
ok('the day is the Saudi day', maDay({ rt: '2026-10-31T21:30:00Z' }) === '2026-11-01');
// merge and re-import
let st = { imports: [], recs: [] };
const A = maParse(file('2026-10-01', '2026-10-31', [rec('a', 'eng.a@afaqy.com', 'new inquiry', '2026-10-05T07:00:00Z'), rec('b', 'eng.b@afaqy.com', 'wasl', '2026-10-06T07:00:00Z')]));
let m = maMerge(st, A.head, A.recs, '2026-11-02'); st = m.state;
ok('first import adds', m.added === 2 && m.replaced === 0 && st.imports.length === 1);
m = maMerge(st, A.head, A.recs, '2026-11-03'); st = m.state;
ok('the same period again replaces, never adds', m.added === 0 && m.replaced === 2 && st.recs.length === 2 && st.imports.length === 1 && m.again && st.imports[0].importedAt === '2026-11-03');
const B = maParse(file('2026-10-25', '2026-11-10', [rec('b', 'eng.b@afaqy.com', 'wasl', '2026-10-06T07:00:00Z'), rec('c', 'eng.a@afaqy.com', 'api', '2026-11-02T07:00:00Z')], 'inbox-nov.pst'));
m = maMerge(st, B.head, B.recs, '2026-11-11'); st = m.state;
ok('an overlapping import adds only the new messages', m.added === 1 && m.replaced === 1 && st.recs.length === 3 && st.imports.length === 2);
// coverage
ok('coverage: October covered by the first import', maCovers(st.imports, '2026-10-01', '2026-10-31'));
ok('coverage: September is not', !maCovers(st.imports, '2026-09-01', '2026-09-30'));
ok('coverage: a gap breaks it', !maCovers([{ from: '2026-10-01', to: '2026-10-10' }, { from: '2026-10-12', to: '2026-10-31' }], '2026-10-01', '2026-10-31'));
// counting and identity
const rules = [{ k: 'upsell', words: ['new inquiry', 'طلب جديد'] }, { k: 'advanced', words: ['api', 'تكامل'] }, { k: 'normal', words: ['wasl', 'وصل'] }];
const classify = (s) => { const x = String(s || '').toLowerCase(); for (const r of rules) if (r.words.some((w) => x.includes(w))) return r.k; return 'other'; };
const S = maStats(st.recs, { 'eng.a@afaqy.com': '101' }, classify, '2026-10-01', '2026-10-31');
ok('only confirmed addresses count; the rest is unmatched, never guessed', S.per.get('101').total === 1 && S.per.get('101').cats.upsell === 1 && S.unmatched.length === 1 && S.unmatched[0].addr === 'eng.b@afaqy.com', S);
ok('the period filters by Saudi day', S.total === 2);
const S2 = maStats(st.recs, { 'eng.a@afaqy.com': '101', 'eng.b@afaqy.com': '102' }, classify, '2026-10-01', '2026-11-30');
ok('category precedence: first rule wins ("api" over nothing; "new inquiry" upsell)', S2.per.get('101').cats.advanced === 1 && S2.per.get('101').cats.upsell === 1 && S2.per.get('102').cats.normal === 1);
const people = [{ id: '101', nameEn: 'Ahmed Morad', nameAr: 'أحمد مراد' }, { id: '102', nameEn: 'Ahmed Moradi', nameAr: 'أحمد مرادي' }, { id: '103', nameEn: 'Sara Ali', nameAr: 'سارة علي' }];
const sg = maSuggest('ahmed.morad@afaqy.com', 'Ahmed Morad', people);
ok('suggestions rank the exact name first and never decide alone', sg[0].id === '101' && sg.length >= 1 && !sg.some((x) => x.id === '103'), sg);
const S3 = maStats(st.recs, {}, classify, '2026-10-01', '2026-10-31');
ok('with no confirmed address nothing is counted for anyone', S3.per.size === 0 && S3.unmatched.reduce((s, u) => s + u.n, 0) === 2);
console.log(`mailact.test.mjs: ${n - fail} passed${fail ? `, ${fail} FAILED` : ''}`); if (fail) process.exit(1);
