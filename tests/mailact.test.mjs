// ADR-0095 — the Manager-Inbox email activity: parsing, re-import, coverage, counting, identity
import { maParse, maMerge, maCovers, maStats, maSuggest, maDay, maOwnText, maCategory, maIsReply } from '../core.js';
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

// ADR-0099 — the sender's own words decide; a technical reply in an «upselling» thread is not upselling
const body = 'تم تركيب الجهاز وتفعيله والعميل بيستلم البيانات تمام\n\nFrom: Customer <c@client.sa>\nSent: Monday\nSubject: طلب عرض سعر\nنرجو إرسال عرض سعر لعدد 13 مركبة';
ok('own text stops at the quoted message', maOwnText(body) === 'تم تركيب الجهاز وتفعيله والعميل بيستلم البيانات تمام', maOwnText(body));
const cls = (x) => { const s = String(x || '').toLowerCase(); if (/عرض سعر|quotation|new inquiry/.test(s)) return 'upsell'; if (/api|تكامل|integration/.test(s)) return 'advanced'; return 'other'; };
ok('a technical reply under an «upselling» subject is not counted as upselling', maCategory({ s: 'RE: طلب عرض سعر لعدد 13 مركبة', b: maOwnText(body) }, cls) === 'other');
ok('a reply whose own words are technical (API) takes that category', maCategory({ s: 'RE: طلب عرض سعر', b: 'شغلنا الربط عن طريق API وبعتنا المفاتيح' }, cls) === 'advanced');
ok('a reply whose own words offer a quotation stays upselling', maCategory({ s: 'RE: استفسار', b: 'مرفق عرض سعر حسب طلبكم' }, cls) === 'upsell');
ok('an original message (no RE:) with no matching words falls back to its subject', maCategory({ s: 'طلب عرض سعر جديد', b: 'السلام عليكم' }, cls) === 'upsell');
ok('with no body read (an old file) the subject decides, as before', maCategory({ s: 'RE: integration keys' }, cls) === 'advanced' && maIsReply('Re: x') && maIsReply('رد: x') && !maIsReply('طلب'));
let L = maMerge({ imports: [], recs: [] }, { source: 'a.pst', from: '2026-10-01', to: '2026-10-31' }, [{ k: 'm1', fe: 'shaima@afaqy.com', s: 's', rt: '2026-10-05T07:00:00Z' }], 'x').state;
const m2 = maMerge(L, { source: 'a.pst', from: '2026-10-01', to: '2026-10-31' }, [{ k: 'm1', fe: 'ex:s.bajubayr', s: 's', rt: '2026-10-05T07:00:00Z' }], 'y');
ok('the same message with an SMTP address and an Exchange alias links the two addresses', m2.links.length === 1 && m2.links[0][0] === 'shaima@afaqy.com' && m2.links[0][1] === 'ex:s.bajubayr' && m2.state.recs.length === 1);
console.log(`mailact.test.mjs: ${n - fail} passed${fail ? `, ${fail} FAILED` : ''}`); if (fail) process.exit(1);
