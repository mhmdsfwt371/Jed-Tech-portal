// run: node tests/core.test.mjs
import assert from 'node:assert/strict';
import {
  STRINGS, LANGS, t, periodBlocks, buildPrompt, SCHEMA, extractJson, parseDataset, mergeDataset, completeness,
  factor1, creditOf, GROUP, formatHours, formatRate, sampleDataset, saudiToday, ymd,
  saudiBoundsZ, toIso, saudiDay, peopleOf, defaultTeam, nameOf, EMAIL_MODULE, SCHEMAS,
  buildBookmarklet, parseMe, myProfile, ME_SCHEMA,
} from '../core.js';
import { gzipSync } from 'node:zlib';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('every language has every key', () => {
  for (const lang of LANGS) for (const k of Object.keys(STRINGS.ar)) assert.ok(k in STRINGS[lang], `${lang} missing ${k}`);
});

test('Saudi today crosses midnight correctly', () => {
  assert.equal(ymd(saudiToday(new Date('2026-10-29T21:30:00Z'))), '2026-10-30', '00:30 in Jeddah is the next day');
  assert.equal(ymd(saudiToday(new Date('2026-10-29T20:59:00Z'))), '2026-10-29');
});

test('quarters, halves and years, most recent first, the current one partial', () => {
  const now = new Date('2026-10-29T09:00:00Z');
  const q = periodBlocks(3, 4, now);
  assert.deepEqual(q.map((b) => [b.from, b.to, b.label, b.partial]), [
    ['2026-10-01', '2026-10-29', 'Q4 2026', true], ['2026-07-01', '2026-09-30', 'Q3 2026', false],
    ['2026-04-01', '2026-06-30', 'Q2 2026', false], ['2026-01-01', '2026-03-31', 'Q1 2026', false],
  ]);
  assert.deepEqual(periodBlocks(6, 2, now).map((b) => [b.from, b.to, b.label]), [['2026-07-01', '2026-10-29', 'H2 2026'], ['2026-01-01', '2026-06-30', 'H1 2026']]);
  assert.deepEqual(periodBlocks(12, 2, now).map((b) => [b.from, b.to, b.label]), [['2026-01-01', '2026-10-29', '2026'], ['2025-01-01', '2025-12-31', '2025']]);
  assert.equal(periodBlocks(3, 1, new Date('2026-12-31T12:00:00Z'))[0].partial, false, 'a block that ends today is complete');
  assert.equal(periodBlocks(3, 2, new Date('2024-05-10T12:00:00Z'))[1].to, '2024-03-31');
  assert.throws(() => periodBlocks(4, 1));
});

test('the prompt carries the period in the CRM’s own format, the schema and the safety rules', () => {
  const p = buildPrompt({ from: '2026-07-01', to: '2026-09-30', today: '2026-10-29' });
  assert.ok(p.includes('"completedOn": ["2026-06-30T21:00:00.000Z", "2026-09-30T21:00:00.000Z"]'));
  assert.ok(p.includes('CREATED IN THE PERIOD, DONE LATER'), 'a past period also collects tasks created in it and closed after it');
  assert.ok(p.includes('"completedOn": ["2026-09-30T21:00:00.000Z", "2026-10-29T21:00:00.000Z"]'), '…up to the end of today');
  assert.ok(!buildPrompt({ from: '2026-10-01', to: '2026-10-29', today: '2026-10-29' }).includes('DONE LATER'), 'the current period needs no such step');
  for (const must of ['taskGroupId": 100001', 'GetAllHierarchyUsersDropDown', 'Teams/GetTeamById', 'Do NOT open tasks one by one', '"dateOfCompletion" (always null)', '"isAutomaticTask"'])
    assert.ok(p.includes(must), `prompt is missing: ${must}`);
  assert.ok(p.includes(`"schema": "${SCHEMA}"`));
  assert.ok(/READ-ONLY/.test(p) && /NEVER GUESS AN API PATH/.test(p) && /Never put tokens/.test(p));
  assert.ok(p.includes('"part": "1/3"'), 'tells it how to split a long answer');
  assert.throws(() => buildPrompt({ from: '2026-09-30', to: '2026-07-01' }));
  assert.throws(() => buildPrompt({ from: 'x', to: '2026-07-01' }));
});

const reply = (tasks, extra = {}) => 'Here is the data:\n```json\n' + JSON.stringify({
  schema: 'afaqy-crm-tasks/v1', range: { from: '2026-07-01', to: '2026-09-30' }, extractedAt: '2026-10-29T10:00:00+03:00', branch: 'Jeddah',
  source: { endpoint: 'POST https://crmbackend.afaqy.sa/Task/X', crmTotal: tasks.length }, tasks, notes: ['done = مكتمل'], ...extra,
}) + '\n```\nDone.';
const T = (id, o = {}) => ({ id, title: 'x', type: 'دعم', status: 's', state: 'done', createdAt: '2026-07-05T09:00:00+03:00',
  createdById: 'sys', createdByName: 'System', assigneeId: 'a', assigneeName: 'أحمد', assignedToGroup: false,
  completedAt: '2026-07-05T15:00:00+03:00', completedById: 'a', completedByName: 'أحمد', fromEmail: true, customer: null, ...o });

test('reading Claude in Chrome’s reply: fenced, bare, wrong schema, bad rows', () => {
  const ok = parseDataset(reply([T('1'), T('2', { state: 'open', completedAt: '2026-07-06T00:00:00Z' }), T('3', { createdAt: 'nonsense' }), { title: 'no id' }]));
  assert.equal(ok.dataset.key, '2026-07-01_2026-09-30');
  assert.equal(ok.dataset.tasks.length, 2);
  assert.equal(ok.skipped, 2, 'rows without an id or a valid date are skipped, never invented');
  assert.equal(ok.dataset.tasks[1].completedAt, null, 'an open task carries no completion date');
  assert.equal(ok.dataset.tasks[0].createdAt, '2026-07-05T06:00:00.000Z', 'times normalised to UTC');
  assert.ok(parseDataset(JSON.stringify(JSON.parse(reply([T('1')]).split('```json\n')[1].split('\n```')[0]))).dataset, 'a bare object also works');
  assert.equal(parseDataset('no json here').error, 'err_json');
  assert.equal(parseDataset('{"schema":"other"}').error, 'err_schema');
  assert.equal(parseDataset(reply([T('1')], { range: { from: '2026-09-30', to: '2026-07-01' } })).error, 'err_range');
  assert.equal(parseDataset(reply([T('1')], { tasks: 'x' })).error, 'err_tasks');
  assert.equal(parseDataset(reply([T('1', { state: 'weird' })])).dataset.tasks[0].state, 'open', 'unknown states count as open');
});

test('parts of one period merge by task id; completeness checks the CRM total', () => {
  const p1 = parseDataset(reply([T('1'), T('2')], { part: '1/2', source: { endpoint: 'e', crmTotal: 3 } })).dataset;
  const p2 = parseDataset(reply([T('2', { title: 'newer' }), T('3')], { part: '2/2', source: { endpoint: 'e', crmTotal: 3 } })).dataset;
  let list = mergeDataset([], p1);
  assert.deepEqual(completeness(list[0]), { known: true, complete: false, got: 2, want: 3 });
  list = mergeDataset(list, p2);
  assert.equal(list.length, 1);
  assert.equal(list[0].tasks.length, 3);
  assert.equal(list[0].tasks.find((x) => x.id === '2').title, 'newer');
  assert.deepEqual(list[0].parts, ['1/2', '2/2']);
  assert.equal(completeness(list[0]).complete, true);
  const other = parseDataset(reply([T('9')], { range: { from: '2026-10-01', to: '2026-10-29' } })).dataset;
  list = mergeDataset(list, other);
  assert.deepEqual(list.map((d) => d.key), ['2026-10-01_2026-10-29', '2026-07-01_2026-09-30'], 'newest period first');
  assert.equal(completeness({ crmTotal: null, tasks: [1] }).known, false);
});

test('credit: person, group completed, group open', () => {
  assert.deepEqual(creditOf(T('1')), { id: 'a', name: 'أحمد' });
  assert.deepEqual(creditOf(T('1', { assignedToGroup: true, assigneeId: 'g', completedById: 'b', completedByName: 'باسم' })), { id: 'b', name: 'باسم' });
  assert.deepEqual(creditOf(T('1', { assignedToGroup: true, assigneeId: 'g', state: 'open' })), { id: GROUP, name: GROUP });
});

test('Factor 1: counts, rate without cancelled, average and median, created, from email, team', () => {
  const tasks = parseDataset(reply([
    T('1'),                                                                                   // a: done in 6h, from email
    T('2', { completedAt: '2026-07-07T09:00:00+03:00' }),                                     // a: done in 48h
    T('3', { completedAt: '2026-07-25T09:00:00+03:00' }),                                     // a: done in 480h — the outlier
    T('4', { state: 'open', completedAt: null }),                                             // a: open
    T('5', { state: 'cancelled', completedAt: null }),                                        // a: cancelled
    T('6', { assigneeId: 'b', assigneeName: 'باسم', fromEmail: false, createdById: 'a', createdByName: 'أحمد', completedById: 'b' }),  // b: done, created by a
    T('7', { assignedToGroup: true, assigneeId: 'g', assigneeName: 'فريق', completedById: 'b', completedByName: 'باسم' }),         // group → b
    T('8', { assignedToGroup: true, assigneeId: 'g', assigneeName: 'فريق', state: 'open', completedAt: null }),                    // group line
  ])).dataset.tasks;
  const f = factor1(tasks);
  const a = f.people.find((p) => p.id === 'a');
  assert.equal(a.assigned, 5); assert.equal(a.done, 3); assert.equal(a.open, 1); assert.equal(a.cancelled, 1);
  assert.equal(a.rate, 3 / 4, 'cancelled tasks are not counted against completion');
  assert.equal(a.avgHours, (6 + 48 + 480) / 3);
  assert.equal(a.medianHours, 48, 'the median ignores the outlier');
  assert.equal(a.fromEmail, 5, 'every task the system account opened, whatever its outcome');
  assert.equal(a.created, 1, 'tasks the person opened themselves');
  const b = f.people.find((p) => p.id === 'b');
  assert.equal(b.assigned, 2); assert.equal(b.done, 2); assert.equal(b.created, 0);
  assert.equal(f.group.assigned, 1); assert.equal(f.group.open, 1);
  assert.equal(f.team.assigned, 8); assert.equal(f.team.done, 5);
  assert.equal(f.team.created, 1, 'system-created tasks are not counted as anyone’s creation');
  assert.equal(f.people[0].id, 'a', 'ordered by completed');
  assert.deepEqual(factor1([]).people, []);
});

test('sample data never merges into a real pull of the same period', () => {
  const real = parseDataset(reply([T('1'), T('2')])).dataset;
  const fake = parseDataset(sampleDataset({ from: '2026-07-01', to: '2026-09-30' })).dataset;
  const list = mergeDataset(mergeDataset([], real), fake);
  assert.equal(list.length, 2, 'two separate datasets');
  assert.equal(list.find((d) => !d.sample).tasks.length, 2, 'the real one is untouched');
  assert.ok(list.find((d) => d.sample).key.startsWith('sample:'));
});

test('Saudi day boundaries are exactly what the CRM’s own October filter sent', () => {
  // captured 28 Oct 2026: completedOn ["2026-09-30T21:00:00.000Z", "2026-10-29T21:00:00.000Z"] for 1–29 October
  assert.deepEqual(saudiBoundsZ('2026-10-01', '2026-10-29'), ['2026-09-30T21:00:00.000Z', '2026-10-29T21:00:00.000Z']);
});

test('CRM times without a zone are Saudi time on any machine; seven-digit fractions are read', () => {
  assert.equal(toIso('2026-10-28T10:27:56.8339878'), '2026-10-28T07:27:56.833Z');
  assert.equal(toIso('2026-10-28T19:08:51.341833+03:00'), '2026-10-28T16:08:51.341Z');
  assert.equal(toIso('2026-10-29T00:00:00'), '2026-10-28T21:00:00.000Z');
  assert.equal(toIso('2026-10-28T10:00:00Z'), '2026-10-28T10:00:00.000Z', 'an explicit zone is respected');
  assert.equal(toIso('nonsense'), null);
  assert.equal(saudiDay('2026-10-31T21:30:00.000Z'), '2026-11-01', 'half past midnight in Jeddah is the next day');
});

const V2 = (tasks, extra = {}) => JSON.stringify({ schema: 'afaqy-crm-tasks/v2', range: { from: '2026-10-01', to: '2026-10-31' },
  extractedAt: '2026-11-02T09:00:00+03:00', taskGroupId: 100001,
  source: { endpoint: 'POST https://crmbackend.afaqy.sa/Task/GetMyTasksGrid', doneInRangeTotal: 3, openTotal: 1, pageSize: 20 },
  people: [{ id: '70', nameEn: 'Engineer One', nameAr: 'المهندس الأول', teams: ['Aftersales'], branchCode: '2' },
           { id: '124', nameEn: 'Engineer Two', nameAr: 'المهندس الثاني', teams: ['Support'], branchCode: '1' }],
  tasks, notes: ['times are +03:00'], ...extra });
const R = (id, o = {}) => ({ id, title: 't', typeId: 16, type: 'Prepare the visit', statusId: 3, state: 'done',
  createdAt: '2026-10-05T09:00:00', createdById: '681', assigneeId: '70', completedAt: '2026-10-05T15:00:00', moduleId: 179, customer: null, bucket: 'done', ...o });

test('v2: e-mail is read from module 146, never from the creator', () => {
  const d = parseDataset(V2([R('1', { moduleId: EMAIL_MODULE, type: 'Email Customer Activity' }), R('2', { createdById: '681', moduleId: 179 })])).dataset;
  assert.equal(d.tasks[0].fromEmail, true);
  assert.equal(d.tasks[1].fromEmail, false, 'the system account also creates work-order tasks — those are not e-mail');
  assert.equal(d.people.length, 2);
  assert.ok(SCHEMAS.includes('afaqy-crm-tasks/v1'), 'v1 files still open');
});

test('v2 completeness checks the CRM’s own done-in-period and open counts', () => {
  const tasks = [R('1'), R('2'), R('3', { createdAt: '2026-09-20T09:00:00', completedAt: '2026-10-02T09:00:00' }), R('4', { state: 'open', statusId: 2, completedAt: null, bucket: 'open' })];
  assert.deepEqual(completeness(parseDataset(V2(tasks)).dataset), { known: true, complete: true, got: 4, want: 4 });
  assert.equal(completeness(parseDataset(V2(tasks.slice(1))).dataset).complete, false);
  const late = R('5', { createdAt: '2026-10-30T09:00:00', completedAt: '2026-11-01T10:00:00' });
  assert.equal(completeness(parseDataset(V2([...tasks, late])).dataset).got, 4, 'a task closed after the period does not count toward done-in-period');
});

test('v2 Factor 1: done is by completion date, received by creation date, open is now', () => {
  const tasks = parseDataset(V2([
    R('1'),                                                                                         // created Oct, done Oct in 6h
    R('2', { completedAt: '2026-10-07T09:00:00' }),                                                 // created Oct, done Oct in 48h
    R('3', { createdAt: '2026-09-20T09:00:00', completedAt: '2026-10-02T09:00:00' }),               // created Sep, done Oct
    R('4', { createdAt: '2026-10-30T09:00:00', completedAt: '2026-11-01T10:00:00' }),               // created Oct, done Nov
    R('5', { state: 'open', statusId: 2, completedAt: null, bucket: 'open', createdAt: '2026-08-01T09:00:00' }), // open, old
    R('6', { state: 'cancelled', completedAt: null }),                                              // created Oct, cancelled
    R('7', { moduleId: EMAIL_MODULE }),                                                             // e-mail, created & done Oct
    R('8', { assigneeId: '124' }),                                                                  // someone outside the team
  ])).dataset.tasks;
  const range = { from: '2026-10-01', to: '2026-10-31' };
  const f = factor1(tasks, { range, team: ['70'] });
  assert.equal(f.people.length, 1, 'the team filter keeps only the chosen people');
  const s = f.people[0];
  assert.equal(s.assigned, 5, 'received in October: 1, 2, 4, 6, 7');
  assert.equal(s.done, 4, 'completed in October: 1, 2, 3, 7 — task 3 was created in September, task 4 closed in November');
  assert.equal(s.rate, 4 / 4, 'of the October cohort (cancelled excluded) 1, 2, 4, 7 are done by extraction');
  assert.equal(s.timed, 4, 'durations come from the four completed in October');
  assert.equal(s.medianHours, 27, 'October completions took 6, 6, 48 and 288 hours → median (6 + 48) / 2');
  assert.equal(s.avgHours, (6 + 6 + 48 + 288) / 4);
  assert.equal(s.open, 1, 'open is a snapshot, whatever its creation date');
  assert.equal(s.cancelled, 1);
  assert.equal(s.fromEmail, 1);
  assert.equal(factor1(tasks, { range }).people.length, 2, 'without a team everyone counts');
});

test('the default team is the Jeddah branch; names follow the language', () => {
  const d = parseDataset(V2([R('1'), R('2', { assigneeId: '124' }), R('3', { assigneeId: '999' })])).dataset;
  const ppl = peopleOf([d]);
  assert.deepEqual(defaultTeam(ppl, d.tasks), ['70'], 'Jeddah is branch code 2');
  assert.deepEqual(defaultTeam(ppl.map((p) => ({ ...p, branchCode: null })), d.tasks).sort(), ['124', '70', '999'], 'no branches known → everyone assigned');
  assert.equal(nameOf(ppl.find((p) => p.id === '70'), 'ar'), 'المهندس الأول');
  assert.equal(nameOf(ppl.find((p) => p.id === '70'), 'en'), 'Engineer One');
  assert.ok(ppl.find((p) => p.id === '999'), 'an assignee missing from the people list still appears');
});

// the hand-over exactly as the bookmark makes it: JSON → gzip → base64url, after '#me-z.'
const handOver = (obj) => 'z.' + gzipSync(Buffer.from(JSON.stringify(obj))).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const ME = (tasks, extra = {}) => ({ schema: ME_SCHEMA, user: { id: '7001', name: 'engineer.one' }, extractedAt: '2026-10-29T09:00:00.000Z',
  since: '2025-10-28T21:00:00.000Z', months: 12, tasks, ...extra });
const MT = (i, o = {}) => ({ i: String(i), c: '2026-10-05T09:00:00', d: '2026-10-05T15:00:00', s: 'done', m: 179, b: 'done', ...o });

test('my KPIs: the hand-over is read back, times in Saudi time, e-mail by module 146', async () => {
  const r = await parseMe(handOver(ME([MT(1), MT(2, { m: EMAIL_MODULE }), MT(3, { s: 'open', d: null, b: 'open' })])));
  assert.ok(r.me, JSON.stringify(r));
  assert.equal(r.me.user.id, '7001');
  assert.equal(r.me.tasks.length, 3);
  assert.equal(r.me.tasks[0].createdAt, '2026-10-05T06:00:00.000Z');
  assert.equal(r.me.tasks[1].fromEmail, true);
  assert.ok(r.me.tasks.every((x) => x.assigneeId === '7001'), 'every task in «My Tasks» is this person’s');
  assert.equal(r.me.tasks[2].completedAt, null);
});

test('my KPIs: anything else in the address is refused, never half-read', async () => {
  assert.equal((await parseMe('z.not-gzip')).error, 'err_json');
  assert.equal((await parseMe('nonsense')).error, 'err_json');
  assert.equal((await parseMe(handOver({ ...ME([]), schema: 'other/v1' }))).error, 'err_schema');
});

test('my KPIs: the profile is Factor 1 for this person, per quarter, over the twelve months read', async () => {
  const me = (await parseMe(handOver(ME([
    MT(1), MT(2, { d: '2026-10-07T09:00:00' }),                                  // Q4 2026: received and done
    MT(3, { c: '2026-09-20T09:00:00', d: '2026-10-02T09:00:00' }),              // received Q3, done Q4
    MT(4, { c: '2026-08-01T09:00:00', d: '2026-08-02T09:00:00' }),              // Q3
    MT(5, { s: 'open', d: null, b: 'open', c: '2026-10-10T09:00:00' }),         // received Q4, still open
  ])))).me;
  const q = myProfile(me, new Date('2026-10-29T12:00:00Z'));
  assert.deepEqual(q.map((x) => x.label), ['Q4 2026', 'Q3 2026', 'Q2 2026', 'Q1 2026', 'Q4 2025']);
  assert.equal(q[0].row.assigned, 3, 'Q4: 1, 2, 5 were created in it');
  assert.equal(q[0].row.done, 3, 'Q4: 1, 2 and the September task 3 were closed in it');
  assert.equal(q[1].row.assigned, 2); assert.equal(q[1].row.done, 1);
  assert.equal(q[4].range.from, '2025-10-29', 'the oldest quarter starts where the twelve months start');
  assert.ok(q[4].partial);
});

test('my KPIs: the bookmark reads My Tasks only, on myafaqy only, and hands over no token', () => {
  const code = decodeURIComponent(buildBookmarklet('https://mhmdsfwt371.github.io/afaqy-portal/').slice('javascript:'.length));
  assert.ok(code.includes('taskGroupId:100000') && !/taskGroupId:(?!100000)\d/.test(code));
  assert.ok(code.includes("location.hostname!=='myafaqy.com'"));
  assert.ok(!/const pay=\{[^}]*tk/.test(code));
  assert.ok(code.includes("P+'#me-'"), 'it hands over in the address fragment, which no server receives');
});

test('self-logged: tasks the assignee opened for himself, not from e-mail (WhatsApp and calls)', async () => {
  const v2 = parseDataset(V2([
    R('1', { createdById: '70' }),                                  // opened by himself → self-logged
    R('2', { createdById: '70', moduleId: EMAIL_MODULE }),          // from e-mail, even if his id → e-mail, not self
    R('3', { createdById: '681' }),                                 // the system account → neither
    R('4', { createdById: '124' }),                                 // a colleague → neither
  ])).dataset.tasks;
  const row = factor1(v2, { range: { from: '2026-10-01', to: '2026-10-31' }, team: ['70'] }).people[0];
  assert.equal(row.selfLogged, 1); assert.equal(row.fromEmail, 1); assert.equal(row.assigned, 4);
  const me = (await parseMe(handOver(ME([MT(1, { o: true }), MT(2, { o: true, m: EMAIL_MODULE }), MT(3, { o: false })])))).me;
  const q = myProfile(me, new Date('2026-10-29T12:00:00Z'));
  assert.equal(q[0].row.selfLogged, 1, 'from My KPIs: the bookmark’s yes/no flag, never an id');
});

test('formatting', () => {
  assert.equal(formatHours(null, 'ar'), '—');
  assert.equal(formatHours(5.26, 'en'), '5.3 h');
  assert.equal(formatHours(72, 'en'), '3 d');
  assert.equal(formatRate(0.756), '76%');
  assert.equal(formatRate(null), '—');
});

test('sample data parses through the same door and is marked', () => {
  const d = parseDataset(sampleDataset({ from: '2026-07-01', to: '2026-09-30' })).dataset;
  assert.equal(d.sample, true);
  assert.ok(d.tasks.length >= 60);
  assert.equal(completeness(d).complete, true);
  assert.ok(d.tasks.every((x) => x.createdAt >= '2026-06-30T21:00:00.000Z' && x.createdAt <= '2026-09-30T20:59:00.000Z'));
});

let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); } catch (e) { failed++; console.error(`FAIL ${name}\n  ${e.message}`); }
}
if (failed) { console.error(`core.test.mjs: ${failed} failed`); process.exit(1); }
console.log(`core.test.mjs: ${tests.length} passed`);
