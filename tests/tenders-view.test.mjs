// ADR-0156: the tender register Safwoot publishes, sealed, and the page that opens it with the key in the link.
import assert from 'node:assert/strict';
import {
  VIEW_SCHEMA, sealView, openView, validateView, parseViewLink, viewLink, viewFileUrl, newViewKey, b64urlDecode, b64urlEncode, viewGroups, tenderNext,
} from '../tenders-view-core.js';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

const sample = () => ({
  schema: VIEW_SCHEMA, app: 'Safwoot 2.15.0', publishedAt: '2026-11-28 09:30', title: 'سجل مناقصات فرع جدة',
  tenders: [
    { ref: '261100000101', title: 'منافسة شبكة تجريبية', entity: 'جهة تجريبية أ', status: 'قيد الدراسة', stage: 'working',
      dates: { inquiries: '2026-12-13', submit: '2026-12-22 10:00', opening: '', examination: '', award: '' },
      decision: { verdict: 'go', reason: 'سبب تجريبي', at: '2026-11-24 03:10' }, summary: 'خلاصة تجريبية',
      etimad: { checkedAt: '2026-11-28 09:00', source: 'workbook', diffs: [] },
      files: [{ name: 'كراسة الشروط والمواصفات.pdf', at: '2026-11-23 19:33' }],
      timeline: [{ at: '2026-11-23 19:33', who: 'زميل تجريبي', mine: false, kind: 'mail', text: 'رسالة تجريبية' },
        { at: '2026-11-24 02:00', who: 'المدير', mine: true, kind: 'mail', text: 'رسالة تجريبية من المدير' }],
      changes: [{ at: '2026-11-26 10:02', field: 'submit', old: '', new: '2026-12-22 10:00', source: 'ملف اعتماد' }], updatedAt: '2026-11-28 09:00' },
    { ref: 'ك/ت/7/2099', title: 'منافسة أجهزة تجريبية', entity: 'جهة تجريبية ب', status: 'تم إرسال العرض', stage: 'submitted',
      dates: { inquiries: '2026-11-20', submit: '2026-11-30', opening: '2026-12-02', examination: '', award: '' }, files: [], timeline: [], changes: [], updatedAt: '2026-11-27 12:00' },
    { ref: '261100000103', title: 'منافسة نظام تجريبي', entity: 'جهة تجريبية ج', status: 'لن نتقدم', stage: 'declined',
      dates: { inquiries: '', submit: '2026-12-01', opening: '', examination: '', award: '' }, files: [], timeline: [], changes: [], updatedAt: '2026-11-24 10:00' },
  ],
});
const key = () => b64urlDecode(newViewKey());

test('a register sealed by Safwoot opens with the same key, whole', async () => {
  const k = key(), sealed = await sealView(sample(), k);
  assert.deepEqual([...sealed.slice(0, 5)], [65, 70, 81, 86, 1], 'AFQV then version 1');
  const r = await openView(sealed, k);
  assert.equal(r.ok, true, r.reason);
  assert.deepEqual(r.view, validateView(sample()));
  assert.equal(r.view.tenders[0].timeline[1].who, 'المدير');
});

test('every publish has its own nonce: the same register sealed twice is two different files', async () => {
  const k = key(), a = await sealView(sample(), k), b = await sealView(sample(), k);
  assert.notDeepEqual([...a.slice(5, 17)], [...b.slice(5, 17)]);
});

test('the wrong key, a cut file, a changed byte, a stranger file and a giant are refused with their reason', async () => {
  const k = key(), sealed = await sealView(sample(), k);
  assert.equal((await openView(sealed, key())).reason, 'key');
  assert.equal((await openView(sealed.slice(0, 40), k)).reason, 'key');
  const flipped = sealed.slice(); flipped[30] ^= 1; assert.equal((await openView(flipped, k)).reason, 'key');
  const header = sealed.slice(); header[4] = 2; assert.equal((await openView(header, k)).reason, 'version');
  assert.equal((await openView(new TextEncoder().encode('<html>404</html>'), k)).reason, 'not-ours');
  assert.equal((await openView(new Uint8Array(8 * 1024 * 1024 + 1), k)).reason, 'too-big');
  assert.equal((await openView(sealed.slice(0, 10), k)).reason, 'not-ours');
});

test('a sealed file that opens but breaks the format is refused whole, not shown in part', async () => {
  const k = key(), v = sample(); v.tenders[1].ref = v.tenders[0].ref;
  await assert.rejects(sealView(v, k), /invalid/);
  const raw = new TextEncoder().encode(JSON.stringify(v));
  const gz = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const iv = crypto.getRandomValues(new Uint8Array(12)), head = new Uint8Array([65, 70, 81, 86, 1]);
  const ck = await crypto.subtle.importKey('raw', k, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: head }, ck, gz));
  const forged = new Uint8Array(5 + 12 + ct.length); forged.set(head); forged.set(iv, 5); forged.set(ct, 17);
  assert.equal((await openView(forged, k)).reason, 'invalid');
});

test('the format: dates are real dates or empty, stages and verdicts known, text is text, limits hold', () => {
  const bad = (edit) => { const v = sample(); edit(v); assert.equal(validateView(v), null); };
  bad((v) => { v.schema = 'afaqy-tenders-view/v2'; });
  bad((v) => { v.tenders[0].dates.submit = '2026-13-01'; });
  bad((v) => { v.tenders[0].dates.submit = '22/12/2026'; });
  bad((v) => { v.tenders[0].dates.inquiries = '2026-02-30'; });
  bad((v) => { v.tenders[0].stage = 'won'; });
  bad((v) => { v.tenders[0].decision.verdict = 'maybe'; });
  bad((v) => { v.tenders[0].timeline[0].text = { html: '<b>x</b>' }; });
  bad((v) => { v.tenders[0].ref = ''; });
  bad((v) => { v.tenders[0].etimad.source = 'google'; });
  bad((v) => { v.tenders[0].timeline = Array.from({ length: 501 }, () => ({ at: '2026-11-23', who: 'x', mine: false, kind: 'mail', text: 'x' })); });
  bad((v) => { v.tenders[0].summary = 'x'.repeat(20001); });
  bad((v) => { v.publishedAt = ''; });
  const ok = sample(); ok.tenders[0].extra = 'a later version may add fields'; delete ok.tenders[1].decision;
  const n = validateView(ok);
  assert.ok(n, 'an unknown field is ignored, a missing optional part is fine');
  assert.equal(n.tenders[0].extra, undefined, 'and an unknown field is not carried to the page');
  assert.equal(n.tenders[1].decision, null);
  const plain = validateView({ schema: VIEW_SCHEMA, app: 'Safwoot', publishedAt: '2026-11-28', tenders: [{ ref: '1', title: 't' }] });
  assert.ok(plain, 'a tender with only its reference and title is shown');
  assert.equal(plain.tenders[0].stage, 'other');
  assert.deepEqual(plain.tenders[0].dates, { inquiries: '', submit: '', opening: '', examination: '', award: '' });
});

test('the link: key and folder read from the part after #, anything malformed refused, the file always on this address', () => {
  const k = newViewKey();
  assert.match(k, /^[A-Za-z0-9_-]{43}$/);
  const link = viewLink('https://mhmdsfwt371.github.io/Jed-Tech-portal/', k, 'jed-tenders');
  assert.equal(link, `https://mhmdsfwt371.github.io/Jed-Tech-portal/tenders-view.html#k=${k}&r=jed-tenders`);
  const p = parseViewLink(new URL(link).hash);
  assert.equal(p.error, undefined); assert.equal(p.repo, 'jed-tenders'); assert.equal(b64urlEncode(p.key), k);
  assert.equal(parseViewLink(`#k=${k}`).repo, 'jed-tenders', 'the folder defaults');
  assert.equal(parseViewLink('').error, 'no-key');
  assert.equal(parseViewLink('#k=abc').error, 'bad-key');
  assert.equal(parseViewLink(`#k=${k}&r=../../evil`).error, 'bad-repo');
  assert.equal(parseViewLink(`#k=${k}&r=https://evil.example`).error, 'bad-repo');
  assert.equal(viewFileUrl('jed-tenders'), '../jed-tenders/tenders.afqv');
  assert.throws(() => viewFileUrl('a/b'));
});

test('the page\'s two lists: what is still running by its next date, and the archive', () => {
  const g = viewGroups(validateView(sample()), '2026-11-28 10:00');
  assert.deepEqual(g.running.map((t) => t.ref), ['261100000101']);
  assert.deepEqual(g.submitted.map((t) => t.ref), ['ك/ت/7/2099']);
  assert.deepEqual(g.archive.map((t) => t.ref), ['261100000103']);
  const next = tenderNext(g.running[0], '2026-11-28 10:00');
  assert.deepEqual(next, { field: 'inquiries', at: '2026-12-13', days: 15 });
  assert.deepEqual(tenderNext(g.submitted[0], '2026-11-28 10:00'), { field: 'submit', at: '2026-11-30', days: 2 });
  assert.equal(tenderNext(g.archive[0], '2026-12-05 10:00'), null, 'no date ahead');
  // a running tender whose every date has passed is not lost: it stays in «running», last, so it is noticed
  const v = validateView(sample()); v.tenders[0].dates = { inquiries: '2026-11-01', submit: '2026-11-10', opening: '', examination: '', award: '' };
  const v2 = viewGroups(v, '2026-11-28 10:00');
  assert.deepEqual(v2.running.map((t) => t.ref), ['261100000101']);
  // nearest date first among the running ones
  const many = validateView(sample()); many.tenders.push({ ...many.tenders[0], ref: '2', dates: { ...many.tenders[0].dates, inquiries: '2026-12-01' } });
  assert.deepEqual(viewGroups(many, '2026-11-28 10:00').running.map((t) => t.ref), ['2', '261100000101']);
});

let failed = 0;
for (const [name, fn] of tests) {
  try { await fn(); console.log('ok   ' + name); } catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + (e && e.message)); }
}
console.log(`tenders-view.test.mjs: ${tests.length - failed} of ${tests.length} passed`);
if (failed) process.exit(1);
