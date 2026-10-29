// run: node tests/core.test.mjs
import assert from 'node:assert/strict';
import {
  STRINGS, LANGS, t, periodBlocks, buildPrompt, SCHEMA, extractJson, parseDataset, mergeDataset, completeness,
  factor1, creditOf, GROUP, formatHours, formatRate, sampleDataset, saudiToday, ymd,
  saudiBoundsZ, toIso, saudiDay, peopleOf, defaultTeam, nameOf, EMAIL_MODULE, SCHEMAS,
  buildBookmarklet, parseMe, myProfile, ME_SCHEMA, parseMePayload, profileMonths, monthWindows, scopeOf, ME_SCHEMA_V2, upgradeMe,
  parseRoster, mergeRoster, positionOf, leaderOf, reportsOf, donutParts, periodWindows, teamAlerts, activityTotals, descendantsOf,
  parseWeights, mergeWeights, weightedPoints, typeKey, taskWeight, scopeIds, inScope,
  weeklyDigest, goalProgress, patternPath, coverageTotals, monthCard, closableMonths, repairCheck, parseRepairLines,
  buildReportsPrompt, parseReports, techTotals, afterSalesTotals, monthsOf, REPORTS_SCHEMA, TECH_FIELDS, portalRoute,
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
  for (const must of ['taskGroupId": 100001', 'GetAllHierarchyUsersDropDown', 'Teams/GetTeamById', 'Do NOT open tasks one by one', '"dateOfCompletion" (always null)', '"isAutomaticTask"',
                      'ABSOLUTE RULE — NOTHING MAY CHANGE IN MYAFAQY', 'are UTC', 'afaqy-tasks-2026-07-01_2026-09-30.json', 'No write endpoint was called'])
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

test('myafaqy times without a zone are UTC on any machine (verified against the screen); seven-digit fractions are read', () => {
  // 29 Oct 2026: task shown at 12:30 PM in myafaqy came back from the API as 2026-10-29T09:30:41
  assert.equal(toIso('2026-10-29T09:30:41'), '2026-10-29T09:30:41.000Z');
  assert.equal(saudiDay(toIso('2026-10-29T09:30:41')), '2026-10-29');
  assert.equal(saudiDay(toIso('2026-10-29T22:30:00')), '2026-10-30', 'half past one in the morning in Jeddah is the next day');
  assert.equal(toIso('2026-10-28T10:27:56.8339878'), '2026-10-28T10:27:56.833Z');
  assert.equal(toIso('2026-10-28T19:08:51.341833+03:00'), '2026-10-28T16:08:51.341Z', 'a written zone is respected');
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
  const mixed = [{ id: 'a', teams: ['Riyadh Pre sales', 'Jeddah After sales Team'], branchCode: '1' },
                 { id: 's', teams: ['Jeddah-Sales Team'], branchCode: '2' }, { id: 'c', teams: ['Jeddah-Collection Team'], branchCode: '2' },
                 { id: 'p', teams: ['Jeddah-Sales Team', 'Jeddah Presales Team'], branchCode: '2' }, { id: 'n', teams: [], branchCode: null }];
  assert.deepEqual(defaultTeam(mixed, []).sort(), ['a', 'p'], 'a Jeddah-named team counts; sales or collection alone does not; no team is the manager’s call');
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
  assert.equal(r.me.tasks[0].createdAt, '2026-10-05T09:00:00.000Z', 'the bookmark hands over raw myafaqy times, which are UTC');
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

test('my KPIs: the bookmark reads My Tasks and All Tasks on myafaqy only, hands over by message to the portal, no token', () => {
  const code = decodeURIComponent(buildBookmarklet('https://mhmdsfwt371.github.io/Jed-Tech-portal/').slice('javascript:'.length));
  assert.ok(code.includes('for(const g of[100000,100001])') && !/taskGroupId:\d/.test(code), 'exactly My Tasks and All Tasks');
  assert.ok(code.includes("location.hostname!=='myafaqy.com'"));
  assert.ok(!/const pay=\{[^}]*tk/.test(code));
  assert.ok(code.includes("w.postMessage({type:'afaqy-me',payload:pay},PO)") && code.includes('PO=new URL(P).origin'), 'by message, to the portal origin only');
  assert.ok(code.includes("P+'#me-'"), 'the address fragment stays as a fallback when windows are blocked');
  assert.doesNotThrow(() => new Function(code), 'it compiles once its lines are joined');
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

const TR = (id, o = {}) => ({ technicianId: id, employeeId: 9000 + id, nameEn: `Tech ${id}`, nameAr: `فني ${id}`,
  ...Object.fromEntries(TECH_FIELDS.map((f) => [f, 0])), ...o });
const REP = (extra = {}) => JSON.stringify({ schema: REPORTS_SCHEMA, range: { from: '2026-10-01', to: '2026-11-30' }, branch: '2', extractedAt: '2026-11-30T10:00:00Z',
  techPoints: [
    { month: '2026-10', listCount: 3, rows: [TR(1, { installedDeviceCount: 10, totalPoint: 40, bonusValue: 999, phoneNumber: '05x' }), TR(2, { maintainedDeviceCount: 4, totalPoint: 12 }), TR(3)] },
    { month: '2026-11', listCount: 2, rows: [TR(1, { installedDeviceCount: 5, violationCount: 1, totalPoint: 18 }), TR(2, { stopServiceDeviceCount: 2, totalPoint: 6 })] },
  ],
  afterSales: { rows: [{ id: 68, name: 'Agent A', open: 1, pending: 0, done: 2, total: 3 }, { id: 69, name: 'Agent B', open: 0, pending: 0, done: 0, total: 0 },
                       { id: 70, afterSalesName: 'Agent C', openTickets: 0, pendingTickets: 2, doneTickets: 9, totalTickets: 11 }] }, ...extra });

test('reports: months in the format the technician report expects', () => {
  assert.deepEqual(monthsOf('2026-10-15', '2026-12-31').map((m) => [m.key, m.quarterId, m.requestDate[0], m.requestDate[1]]),
    [['2026-10', 4, '2026-10-01T00:00:00.000Z', '2026-10-31T00:00:00.000Z'], ['2026-11', 4, '2026-11-01T00:00:00.000Z', '2026-11-30T00:00:00.000Z'],
     ['2026-12', 4, '2026-12-01T00:00:00.000Z', '2026-12-31T00:00:00.000Z']]);
  assert.equal(monthsOf('2026-12-01', '2027-01-31')[1].key, '2027-01', 'crosses the year');
});

test('reports: read, pay and phone fields dropped, months summed per technician, idle people left out', () => {
  const r = parseReports(REP()).reports;
  assert.ok(r && r.techPoints.length === 2);
  assert.ok(!JSON.stringify(r).includes('999') && !JSON.stringify(r).includes('05x'), 'bonus and phone never kept');
  const tt = techTotals(r);
  assert.deepEqual(tt.rows.map((x) => [x.technicianId, x.installedDeviceCount, x.totalPoint, x.months]), [['1', 15, 58, 2], ['2', 0, 18, 2]], 'Tech 3 did nothing and is left out');
  assert.equal(tt.total.violationCount, 1);
  const at = afterSalesTotals(r);
  assert.deepEqual(at.rows.map((x) => x.name), ['Agent C', 'Agent A'], 'both field namings are read; the idle agent is left out');
  assert.deepEqual(at.total, { open: 1, pending: 2, done: 11, total: 14 });
  assert.equal(parseReports(REP({ schema: 'x' })).error, 'err_schema');
});

test('reports prompt: two named reads, one call per month, the after-sales window in Saudi bounds', () => {
  const p = buildReportsPrompt({ from: '2026-10-01', to: '2026-11-30' });
  assert.ok(p.includes('TechnicianReport/GetTechnicianReportStatic · AfterSalesBoardReport/GetAfterSalesAgentsGrid'));
  assert.equal((p.match(/"monthId":/g) || []).length, 2);
  assert.ok(p.includes('"branchIds":"2"') && p.includes('"createDate":["2026-09-30T21:00:00.000Z","2026-11-30T21:00:00.000Z"]'));
  assert.ok(p.includes('Do NOT keep phoneNumber, bonusValue'));
});

test('R&D: tasks in the R&D queue are counted among the completed', () => {
  const d = parseDataset(V2([R('1'), R('2'), R('3', { state: 'open', statusId: 2, completedAt: null, bucket: 'open' })], { rdTaskIds: ['2', '3'] })).dataset;
  assert.ok(d.rdKnown);
  const row = factor1(d.tasks, { range: { from: '2026-10-01', to: '2026-10-31' }, team: ['70'] }).people[0];
  assert.equal(row.rd, 1, 'only task 2 is both R&D and completed in the period');
  assert.equal(parseDataset(V2([R('1')])).dataset.rdKnown, false, 'older files carry no R&D list');
});

const MEV2 = (tasks, people) => ({ schema: ME_SCHEMA_V2, user: { id: '70', name: 'lead' }, extractedAt: '2026-10-29T09:00:00Z', since: '2025-10-28T21:00:00Z', months: 12, people, tasks });
const T2 = (i, a, s, c, d, extra = {}) => ({ i, a, s, c, d, m: 179, o: false, b: s === 'done' ? 'done' : 'open', ...extra });

test('profile v2: titles kept only on the person’s own open tasks; people sanitised; old v1 still read', () => {
  const r = parseMePayload(MEV2([T2('1', '70', 'open', '2026-10-20T08:00:00', null, { t: 'MY OPEN' }), T2('2', '70', 'done', '2026-10-02T08:00:00', '2026-10-02T12:00:00', { t: 'MY DONE' }),
    T2('3', '124', 'open', '2026-10-21T08:00:00', null, { t: 'COLLEAGUE OPEN' })],
    [{ id: '70', nameEn: 'Lead', nameAr: 'القائد', teams: ['Jeddah After sales Team'], branchCode: '2', h: false }, { id: '124', nameEn: 'Eng', nameAr: 'المهندس', teams: ['Jeddah After sales Team'], branchCode: '2', h: true, phone: '05x' }]));
  assert.ok(r.me);
  const titles = Object.fromEntries(r.me.tasks.map((x) => [x.id, x.title]));
  assert.deepEqual(titles, { 1: 'MY OPEN', 2: '', 3: '' }, 'done titles and colleagues’ titles never survive');
  assert.ok(!JSON.stringify(r.me).includes('05x'), 'unknown fields on people are dropped');
  assert.deepEqual(r.me.people.find((p) => p.id === '124').below, true);
  assert.equal(parseMePayload({ schema: ME_SCHEMA, user: { id: '9' }, tasks: [{ i: 1, c: '2026-10-01T08:00:00', s: 'open', b: 'open' }] }).me.tasks[0].assigneeId, '9', 'v1 hand-overs still read');
});

test('profile: this month so far against the same days last month', () => {
  assert.deepEqual(monthWindows(new Date('2026-10-29T10:00:00Z')), { day: 29, this: { from: '2026-10-01', to: '2026-10-29' }, last: { from: '2026-09-01', to: '2026-09-29' } });
  assert.deepEqual(monthWindows(new Date('2026-03-31T10:00:00Z')).last, { from: '2026-02-01', to: '2026-02-28' }, 'clamped to the shorter month');
  assert.deepEqual(monthWindows(new Date('2026-01-15T10:00:00Z')).last, { from: '2025-12-01', to: '2025-12-15' }, 'across the year');
});

test('profile: month comparison, team average without names, and only the people below in “my team”', () => {
  const now = new Date('2026-10-29T10:00:00Z');
  const tasks = [
    T2('1', '70', 'done', '2026-10-03T08:00:00', '2026-10-03T10:00:00'), T2('2', '70', 'done', '2026-10-05T08:00:00', '2026-10-05T12:00:00'),
    T2('3', '70', 'done', '2026-09-03T08:00:00', '2026-09-03T09:00:00'),
    T2('4', '124', 'done', '2026-10-04T08:00:00', '2026-10-04T08:30:00'), T2('5', '124', 'done', '2026-10-06T08:00:00', '2026-10-06T09:00:00'), T2('6', '124', 'done', '2026-10-07T08:00:00', '2026-10-07T09:00:00'),
    T2('7', '125', 'open', '2026-10-10T08:00:00', null),
    T2('8', '999', 'done', '2026-10-08T08:00:00', '2026-10-08T09:00:00')];
  const people = [{ id: '70', teams: ['Jeddah After sales Team'], branchCode: '2', h: false }, { id: '124', teams: ['Jeddah After sales Team'], branchCode: '2', h: true },
    { id: '125', teams: ['Jeddah After sales Team'], branchCode: '2', h: true }, { id: '999', teams: ['Riyadh Pre sales'], branchCode: '1', h: false }];
  const me = parseMePayload(MEV2(tasks, people)).me;
  const pm = profileMonths(me, now);
  assert.equal(pm.mine.this.done, 2); assert.equal(pm.mine.last.done, 1);
  assert.deepEqual(pm.scope.team.sort(), ['124', '125', '70'], 'the team is Jeddah; Riyadh stays out of the average');
  assert.ok(pm.average && pm.average.n === 3 && Math.abs(pm.average.done - 5 / 3) < 1e-9, 'average over people with work this month');
  assert.deepEqual(pm.below.map((r) => r.id), ['124', '125'], 'only the people myafaqy places below, busiest first');
  const solo = parseMePayload(MEV2(tasks.filter((x) => x.a === '70'), [people[0]])).me;
  assert.equal(profileMonths(solo, now).average, null, 'seeing only oneself: no average');
  assert.equal(profileMonths(solo, now).below.length, 0);
});

test('a profile saved by v6.9 (no people) is upgraded on load and still draws a month comparison', () => {
  const old = { schema: ME_SCHEMA, user: { id: 7001, name: 'eng' }, extractedAt: '2026-10-28T10:00:00Z', since: '2025-10-28T21:00:00Z',
    tasks: [{ id: '1', state: 'done', createdAt: '2026-10-02T08:00:00.000Z', completedAt: '2026-10-02T12:00:00.000Z', assigneeId: '7001', moduleId: 179, own: false, bucket: 'done', fromEmail: false }] };
  const me = upgradeMe(old);
  assert.ok(me && me.people.length === 1 && me.people[0].id === '7001');
  const pm = profileMonths(me, new Date('2026-10-29T10:00:00Z'));
  assert.equal(pm.mine.this.done, 1); assert.equal(pm.average, null); assert.equal(pm.below.length, 0);
  assert.equal(upgradeMe(null), null);
});

test('team file: ids, positions and leaders only; unknown fields dropped; the device wins; a roster leader sees their people', () => {
  const repo = { people: { 70: { position: 'مدير', name: 'LEAKED', phone: '05x' }, 124: { position: 'مهندس', leaderId: '70' }, 125: { leaderId: '70' } } };
  const r = parseRoster(repo);
  assert.ok(!JSON.stringify(r).includes('LEAKED') && !JSON.stringify(r).includes('05x'), 'names and phones never survive');
  assert.deepEqual(reportsOf(r, '70').sort(), ['124', '125']);
  const m = mergeRoster(repo, { people: { 124: { position: 'قائد فريق', leaderId: '70' } } });
  assert.equal(positionOf(m, '124'), 'قائد فريق'); assert.equal(leaderOf(m, '125'), '70');
  const tasks = [T2('1', '70', 'done', '2026-10-03T08:00:00', '2026-10-03T10:00:00'), T2('4', '124', 'done', '2026-10-04T08:00:00', '2026-10-04T08:30:00'), T2('7', '125', 'open', '2026-10-10T08:00:00', null)];
  const me = parseMePayload(MEV2(tasks, [{ id: '70', teams: ['Jeddah After sales Team'], branchCode: '2', h: false }, { id: '124', teams: ['Jeddah After sales Team'], branchCode: '2', h: false }, { id: '125', teams: [], branchCode: null, h: false }])).me;
  assert.deepEqual(profileMonths(me, new Date('2026-10-29T10:00:00Z')).below, [], 'myafaqy places nobody below');
  assert.deepEqual(profileMonths(me, new Date('2026-10-29T10:00:00Z'), m).below.map((x) => x.id).sort(), ['124', '125'], 'the team file does');
});

test('donuts: shares sum to one, dashes sum to the circumference, zero parts dropped', () => {
  const d = donutParts([{ label: 'a', value: 3 }, { label: 'b', value: 1 }, { label: 'c', value: 0 }], 40);
  assert.equal(d.total, 4); assert.equal(d.parts.length, 2);
  assert.ok(Math.abs(d.parts.reduce((s, p) => s + p.share, 0) - 1) < 1e-9);
  const C = 2 * Math.PI * 40;
  assert.ok(Math.abs(d.parts.reduce((s, p) => s + parseFloat(p.dasharray.split(' ')[0]), 0) - C) < 0.05);
  assert.equal(donutParts([], 40).total, 0);
});

test('period windows: quarter so far against the same days of last quarter; six months against the six before', () => {
  const now = new Date('2026-10-29T10:00:00Z');
  assert.deepEqual(periodWindows('quarter', now), { kind: 'quarter', day: 29, this: { from: '2026-10-01', to: '2026-10-29' }, last: { from: '2026-07-01', to: '2026-07-29' } });
  assert.deepEqual(periodWindows('quarter', new Date('2027-01-15T10:00:00Z')).last, { from: '2026-10-01', to: '2026-10-15' }, 'across the year');
  const h = periodWindows('half', now);
  assert.equal(h.this.from, '2026-04-30'); assert.equal(h.last.to, '2026-04-29'); assert.ok(h.last.from < h.this.from);
  assert.equal(periodWindows('month', now).kind, 'month');
});

test('team alerts: the person to look at (with reasons) and the clearest improvement; nobody flagged on thin data', () => {
  const row = (id, t, l) => ({ id, this: { assigned: 20, done: t.done, rate: t.rate, medianHours: t.med, open: t.open }, last: { done: l } });
  const below = [row('a', { done: 18, rate: 0.95, med: 2, open: 2 }, 12), row('b', { done: 9, rate: 0.6, med: 9, open: 11 }, 10), row('c', { done: 15, rate: 0.9, med: 2.5, open: 3 }, 14)];
  const al = teamAlerts(below);
  assert.equal(al.attention.id, 'b');
  assert.deepEqual(al.attention.why.map((w) => w.k).sort(), ['median', 'open', 'rate']);
  assert.deepEqual(al.improved, { id: 'a', delta: 6 });
  assert.deepEqual(teamAlerts([{ id: 'x', this: { assigned: 2, done: 1, rate: 0.5, medianHours: 50, open: 1 }, last: { done: 0 } }]), { attention: null, improved: null }, 'fewer than five tasks: no verdict');
});

test('activity log: per person within the period and team; descriptions and names never kept; statuses and categories as they come', () => {
  const A = (id, by, cust, st, cat, d, task = null) => ({ ticketId: id, taskId: task, customerId: cust, categoryId: 1, category: cat, caseId: 2, case: 'Follow Up', statusId: 3, status: st, createdById: by, createDate: d, description: 'SECRET TEXT', customerNameEn: 'ACME' });
  const r = parseReports(REP({ activities: { rows: [A(1, 70, 'c1', 'Done', 'Customer Support', '2026-10-05T08:00:00Z', 900), A(2, 70, 'c2', 'Open', 'API Issues', '2026-10-06T08:00:00Z'),
    A(3, 124, 'c1', 'Done', 'Customer Support', '2026-11-02T08:00:00Z'), A(4, 999, 'c9', 'Done', 'Customer Support', '2026-10-07T08:00:00Z'), A(5, 70, 'c3', 'Done', 'Customer Support', '2026-12-05T08:00:00Z')] } })).reports;
  assert.ok(!JSON.stringify(r).includes('SECRET TEXT') && !JSON.stringify(r).includes('ACME'));
  const ac = activityTotals(r, ['70', '124']);
  assert.deepEqual(ac.people.map((p) => [p.id, p.activities, p.customers, p.withTask]), [['70', 2, 2, 1], ['124', 1, 1, 0]], 'the outsider 999 and the December row (outside the range) are left out');
  assert.deepEqual(ac.total.byStatus, { Done: 2, Open: 1 }); assert.deepEqual(ac.statuses.sort(), ['Done', 'Open']);
  assert.equal(activityTotals(r).people.length, 3, 'no team: everyone');
});

test('hierarchy: a manager sees every level below — and a loop in the file cannot hang it', () => {
  const r = parseRoster({ people: { 91: { leaderId: '70' }, 124: { leaderId: '91' }, 343: { leaderId: '124' }, 344: { leaderId: '124' } } });
  assert.deepEqual(descendantsOf(r, '70').sort(), ['124', '343', '344', '91']);
  assert.deepEqual(descendantsOf(r, '124').sort(), ['343', '344']);
  assert.deepEqual(descendantsOf(r, '343'), []);
  const loop = parseRoster({ people: { 1: { leaderId: '2' }, 2: { leaderId: '1' } } });
  assert.deepEqual(descendantsOf(loop, '1'), ['2']);
});

test('Factor 1: a team member with no tasks still gets a row of zeros — nothing logged is a finding, not a gap', () => {
  const tasks = [{ id: '1', assigneeId: 'A', createdById: 'A', state: 'done', createdAt: '2026-10-02T08:00:00Z', completedAt: '2026-10-02T10:00:00Z' }];
  const f = factor1(tasks, { range: { from: '2026-10-01', to: '2026-10-29' }, team: ['A', 'Z'] });
  const z = f.people.find((r) => r.id === 'Z');
  assert.ok(z, 'Z is listed'); assert.equal(z.done, 0); assert.equal(z.assigned, 0);
  assert.equal(f.team.done, 1);
});

test('weights: the type key is the English part; points = done × type weight + Done activities × category weight', () => {
  assert.equal(typeKey('WASL Link | الربط مع وصل'), 'wasl link');
  assert.equal(typeKey('التشييك على كونفجريشن الاجهزة | check for devices config.'), 'check for devices config.');
  assert.equal(typeKey('Manual Task'), 'manual task');
  const wt = parseWeights({ default: 1, tasks: { 'WASL Link': { w: 3, tier: 'integration', team: 'aftersales' }, 'Manual Task': { w: 1 }, bad: { w: 99 } }, activities: { 'API Issues': 3 } });
  assert.equal(wt.tasks.bad, undefined, 'out-of-range weights are dropped');
  assert.equal(taskWeight(wt, 'Unknown Type'), 1, 'unknown types take the default');
  const T = (id, a, type, state, done) => ({ id, assigneeId: a, type, state, createdAt: '2026-10-02T08:00:00Z', completedAt: done });
  const tasks = [T('1', 'A', 'WASL Link | الربط مع وصل', 'done', '2026-10-05T08:00:00Z'), T('2', 'A', 'Manual Task', 'done', '2026-10-06T08:00:00Z'),
    T('3', 'A', 'WASL Link', 'open', null), T('4', 'A', 'WASL Link', 'done', '2026-11-05T08:00:00Z'), T('5', 'B', 'Manual Task', 'cancelled', null)];
  const acts = [{ createdById: 'A', category: 'API Issues', status: 'Done', createdAt: '2026-10-07T08:00:00Z' }, { createdById: 'A', category: 'API Issues', status: 'Open', createdAt: '2026-10-07T08:00:00Z' }];
  const r = weightedPoints(tasks, acts, wt, { range: { from: '2026-10-01', to: '2026-10-29' }, team: ['A', 'B'] });
  const a = r.byId.get('A');
  assert.equal(a.taskPoints, 4, 'WASL 3 + manual 1; open and out-of-range excluded'); assert.equal(a.activityPoints, 3, 'only the Done activity');
  assert.equal(r.byId.get('B').total, 0, 'a cancelled task earns nothing'); assert.equal(r.total, 7);
  const m = mergeWeights({ tasks: { 'Manual Task': { w: 1 } } }, { tasks: { 'Manual Task': { w: 2 } } });
  assert.equal(taskWeight(m, 'Manual Task'), 2, 'the device wins');
});

test('scope: with a team file, only its people count — the profile’s team average and “below” stay inside it', () => {
  const r = parseRoster({ people: { 70: { position: 'x' }, 124: { leaderId: '70' } } });
  assert.deepEqual(scopeIds(r).sort(), ['124', '70']); assert.ok(inScope(r, '70')); assert.ok(!inScope(r, '999'));
  assert.ok(inScope(parseRoster({}), '999'), 'an empty file means no scope: everyone');
  const tasks = [T2('1', '70', 'done', '2026-10-03T08:00:00', '2026-10-03T10:00:00'), T2('2', '124', 'done', '2026-10-04T08:00:00', '2026-10-04T08:30:00'), T2('3', '999', 'done', '2026-10-05T08:00:00', '2026-10-05T09:00:00')];
  const me = parseMePayload(MEV2(tasks, [{ id: '70', teams: ['Jeddah After sales Team'], branchCode: '2', h: false }, { id: '124', teams: ['Jeddah After sales Team'], branchCode: '2', h: false }, { id: '999', teams: ['Jeddah-Sales Team'], branchCode: '2', h: true }])).me;
  const sc = scopeOf(me, r);
  assert.deepEqual(sc.team.sort(), ['124', '70'], 'the sales person is out even though myafaqy shows them');
  assert.deepEqual(sc.below, ['124'], 'myafaqy puts 999 below me, but 999 is out of scope; 124 reports to me by the file');
  const strangers = parseMePayload(MEV2([T2('9', '555', 'done', '2026-10-03T08:00:00', '2026-10-03T10:00:00')], [{ id: '555', teams: ['X'], branchCode: '2', h: false }])).me;
  assert.deepEqual(scopeOf(strangers, r).team, ['555'], 'a file with nobody from the scope shows its people rather than nobody');
});

test('week: last 7 days vs the 7 before; movers, sharp drops from ten points, and aging opens', () => {
  const wt = parseWeights({ default: 1, tasks: { 'WASL Link': { w: 3 } } });
  const D = (id, a, day, type = 'WASL Link') => ({ id, assigneeId: a, type, state: 'done', createdAt: `2026-10-${day}T08:00:00Z`, completedAt: `2026-10-${day}T09:00:00Z` });
  const tasks = [...[16, 17, 18, 19].map((d, i) => D('a' + i, 'A', d)), ...[25, 26].map((d, i) => D('b' + i, 'A', d)),
    ...[24, 25, 26, 27, 28].map((d, i) => D('c' + i, 'B', d)), { id: 'o', assigneeId: 'B', state: 'open', createdAt: '2026-10-10T08:00:00Z' }];
  const w = weeklyDigest(tasks, wt, ['A', 'B'], new Date('2026-10-29T10:00:00Z'));
  const a = w.rows.find((r) => r.id === 'A'), b = w.rows.find((r) => r.id === 'B');
  assert.equal(a.points, 6); assert.equal(a.prev, 12); assert.equal(b.points, 15);
  assert.deepEqual(w.movers.map((r) => r.id), ['B']); assert.deepEqual(w.drops.map((r) => r.id), ['A'], '12 → 6 is a 50% drop from ten or more');
  assert.deepEqual(w.aging.map((r) => r.id), ['B']);
});

test('goals and the path: progress from that month’s completed work; the path lists closed months only', () => {
  const wt = parseWeights({ tasks: { 'WASL Link': { w: 3 } } });
  const tasks = [1, 2, 3].map((i) => ({ id: String(i), assigneeId: 'A', type: 'WASL Link | الربط مع وصل', state: 'done', completedAt: `2026-10-0${i}T08:00:00Z` }));
  const g = goalProgress(tasks, wt, 'A', '2026-10', [{ key: 'wasl link', target: 5 }, { key: '__points__', target: 9 }]);
  assert.deepEqual(g.map((x) => [x.got, x.pct, x.met]), [[3, 60, false], [9, 100, true]]);
  const closed = { '2026-09': { A: { archetype: 'volume', points: 50, quartile: 2 } }, '2026-10': { A: { archetype: 'field', points: 80, quartile: 1 } } };
  assert.deepEqual(patternPath(closed, 'A').map((p) => p.archetype), ['volume', 'field']);
  assert.deepEqual(patternPath(closed, 'Z'), []);
});

test('coverage: accounts, devices, sole engineer, touched by an activity in the period; unmatched engineers stay out of the scope', () => {
  const rep = { range: { from: '2026-10-01', to: '2026-10-29' }, accounts: [{ c: '1', a: ['A', 'B'], d: 3 }, { c: '2', a: ['A'], d: 0 }, { c: '3', a: ['e999'], d: 5 }],
    activities: [{ createdById: 'A', customerId: '2', createdAt: '2026-10-05T08:00:00Z' }, { createdById: 'A', customerId: '1', createdAt: '2026-11-05T08:00:00Z' }] };
  const cv = coverageTotals(rep, ['A', 'B']);
  const A = cv.people.find((p) => p.id === 'A');
  assert.deepEqual([A.accounts, A.devices, A.solo, A.touched], [2, 3, 1, 1]);
  assert.equal(cv.total.uncovered, 1, 'account 3 has only an unmatched engineer'); assert.equal(cv.total.zeroDevices, 1);
});

test('the month card: “too little to judge” under ten points; quartile and rank; nothing claimed without five tasks', () => {
  const wt = parseWeights({ default: 1, tasks: { 'Training Request': { w: 5, tier: 'multistage' }, 'View Units': { w: 1, tier: 'admin' } } });
  const D = (id, a, type, day) => ({ id, assigneeId: a, type, state: 'done', createdAt: `2026-10-${day}T08:00:00Z`, completedAt: `2026-10-${day}T10:00:00Z` });
  const tasks = [...[1, 2, 3, 4, 5, 6].map((d) => D('t' + d, 'A', 'Training Request', `0${d}`)), ...[1, 2, 3].map((d) => D('v' + d, 'B', 'View Units', `0${d}`))];
  const ctx = { tasks, activities: [], weights: wt, team: ['A', 'B'], now: new Date('2026-10-29T10:00:00Z') };
  const a = monthCard(ctx, 'A', '2026-10'), b = monthCard(ctx, 'B', '2026-10');
  assert.equal(a.points, 30); assert.equal(a.rank, 1); assert.equal(b.archetype, 'early', '3 points is too little to judge');
  assert.ok(a.strengths.every((s) => s.kind !== 'spec' || s.mine >= 5));
  assert.deepEqual(closableMonths([{ from: '2026-09-01', to: '2026-10-29' }], new Date('2026-10-29T10:00:00Z')), ['2026-09']);
});

test('repair check: came back after the repair, waiting inside 48 hours, failed after, unknown when PRO has no unit; per engineer from decided only', () => {
  const now = new Date('2026-10-29T12:00:00Z');
  const units = [{ imei: '111', name: 'Bus 1', last_update: { dtt: Date.parse('2026-10-28T10:00:00Z') / 1000 } }, { device_serial: 'S22', last_update: { dtt: '2026-10-20T08:00:00Z' } }, { imei: '333', last_update: {} }];
  const items = [{ ref: '111', engineerId: 'A', at: '2026-10-27T10:00:00Z' }, { ref: 's22', engineerId: 'A', at: '2026-10-25T10:00:00Z' }, { ref: '333', engineerId: 'B', at: '2026-10-29T06:00:00Z' }, { ref: '999', engineerId: 'B', at: '2026-10-20T06:00:00Z' }];
  const r = repairCheck(units, items, now);
  assert.deepEqual(r.rows.map((x) => x.status), ['ok', 'failed', 'waiting', 'unknown']);
  const A = r.people.find((p) => p.id === 'A'); assert.equal(A.rate, 0.5); assert.equal(r.people.find((p) => p.id === 'B').rate, null, 'nothing decided yet');
  const lines = parseRepairLines('866123456789012, 2026-10-20 14:00\n866123456789013\n12', now);
  assert.equal(lines.length, 2, 'too-short refs dropped'); assert.equal(lines[0].at, '2026-10-20T11:00:00.000Z', 'Saudi time read as UTC+3'); assert.equal(lines[1].at, now.toISOString());
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

test('two presentation links: admin is unchanged and team routes only to non-management pages', () => {
  for (const v of ['tools', 'me', 'pro', 'guide', 'm-sensor', 'me-wait']) assert.equal(portalRoute(v, true), v);
  for (const v of ['', 'data', 'kpi', 'team', 'weights', 'unknown']) assert.equal(portalRoute(v, true), 'me');
  for (const v of ['', 'data', 'kpi', 'team', 'weights', 'tools']) assert.equal(portalRoute(v, false), v);
});

let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); } catch (e) { failed++; console.error(`FAIL ${name}\n  ${e.message}`); }
}
if (failed) { console.error(`core.test.mjs: ${failed} failed`); process.exit(1); }
console.log(`core.test.mjs: ${tests.length} passed`);
