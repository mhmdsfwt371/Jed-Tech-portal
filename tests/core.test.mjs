// run: node tests/core.test.mjs
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {
  STRINGS, LANGS, t, periodBlocks, buildPrompt, SCHEMA, extractJson, parseDataset, mergeDataset, completeness,
  factor1, creditOf, GROUP, formatHours, formatRate, sampleDataset, saudiToday, ymd,
  saudiBoundsZ, toIso, saudiDay, peopleOf, defaultTeam, nameOf, EMAIL_MODULE, SCHEMAS,
  buildBookmarklet, parseMe, myProfile, ME_SCHEMA, parseMePayload, profileMonths, monthWindows, scopeOf, ME_SCHEMA_V2, upgradeMe,
  parseRoster, mergeRoster, positionOf, leaderOf, reportsOf, donutParts, periodWindows, teamAlerts, activityTotals, descendantsOf,
  parseWeights, mergeWeights, weightedPoints, typeKey, taskWeight, scopeIds, inScope,
  weeklyDigest, goalProgress, patternPath, coverageTotals, monthCard, closableMonths, repairCheck, parseRepairLines,
  buildReportsPrompt, parseReports, techTotals, afterSalesTotals, monthsOf, REPORTS_SCHEMA, TECH_FIELDS, buildManagerBookmarklet, parseManagerTransfer, MANAGER_AUTO_SCHEMA, portalRoute, tourState, TOUR_DEVICES, tourDemoPlan,
  taskPointBreakdown, weightPublishDiff, publishableWeights, portalWeights,
} from '../core.js';
await (await import('../core.js')).loadStrings();
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);
test('team weights cannot be overridden by a manager draft saved on the same browser origin', () => {
  const repo = { default: 1, tasks: { 'wasl link': { w: 3, tier: 'integration', team: 'aftersales' } } };
  const draft = { tasks: { 'wasl link': { w: 5, tier: 'integration', team: 'aftersales' } } };
  assert.equal(portalWeights(repo, draft, true).tasks['wasl link'].w, 3);
  assert.equal(portalWeights(repo, draft, false).tasks['wasl link'].w, 5);
  assert.equal(portalWeights(repo, null, true).tasks['wasl link'].w, 3);
});

test('task point breakdown exactly matches completed weighted work and flags unmapped types', () => {
  const wt = parseWeights({ default: 1, tasks: {
    'wasl link': { w: 3, tier: 'integration' },
    'client inquiry': { w: 2, tier: 'customer' },
  } });
  const done = [
    { state: 'done', completedAt: '2026-10-29T09:00:00Z', type: 'WASL Link' },
    { state: 'done', completedAt: '2026-10-29T10:00:00Z', type: 'WASL Link' },
    { state: 'done', completedAt: '2026-10-29T11:00:00Z', type: 'Client Inquiry' },
    { state: 'done', completedAt: '2026-10-29T12:00:00Z', type: 'Unlisted type' },
    { state: 'open', completedAt: null, type: 'WASL Link' },
    { state: 'cancelled', completedAt: '2026-10-29T12:00:00Z', type: 'WASL Link' },
  ];
  const b = taskPointBreakdown(done, wt);
  assert.equal(b.count, 4);
  assert.equal(b.points, 9);
  assert.equal(b.unmapped, 1);
  assert.equal(b.rows.reduce((sum, row) => sum + row.points, 0), 9);
  assert.ok(b.rows.some(row => row.key === 'unlisted type' && row.unmapped && row.weight === 1));
  assert.deepEqual(taskPointBreakdown([], wt), { rows: [], count: 0, points: 0, unmapped: 0 });
});
test('only proposed changes are counted and a publishable payload preserves tiers', () => {
  const repo = { schema: 'afaqy-weights/v1', v: 1, default: 1,
    reviewed: '2026-10-01', tiers: { admin: 1, customer: 2 },
    tasks: { 'wasl link': { w: 3, tier: 'integration', team: 'aftersales' } },
    activities: { support: 1 }, editors: { '70': ['*'] }, card: { minN: 5 } };
  const draft = { tasks: { 'wasl link': { w: 5, tier: 'integration', team: 'aftersales' } },
    activities: { support: 2 }, editors: { '91': ['wasl link'] } };
  const diff = weightPublishDiff(repo, draft);
  assert.equal(diff.count, 3);
  assert.deepEqual(diff.tasks, ['wasl link']);
  assert.deepEqual(diff.activities, ['support']);
  assert.deepEqual(diff.editors, ['91']);
  assert.equal(weightPublishDiff(repo, null).count, 0);
  const merged = publishableWeights(repo, draft, '2026-10-30');
  assert.deepEqual(merged.tiers, repo.tiers);
  assert.equal(merged.reviewed, '2026-10-30');
  assert.equal(merged.tasks['wasl link'].w, 5);
  assert.equal(merged.activities.support, 2);
  assert.deepEqual(merged.editors['70'], ['*']);
  assert.deepEqual(merged.editors['91'], ['wasl link']);
  assert.equal(weightPublishDiff(merged, draft).count, 0);
});

test('animated demo points to real browser actions for each screen and device', () => {
  for (const device of TOUR_DEVICES) for (let step = 0; step < 5; step++) {
    const plan = tourDemoPlan(step, device);
    assert.equal(plan.step, step);
    assert.equal(plan.device, device);
    assert.equal(plan.gesture, device === 'desktop' && step === 1 ? 'drag' : 'click');
    for (const point of [plan.start, plan.target]) {
      assert.ok(point.x >= 0 && point.x <= 100);
      assert.ok(point.y >= 0 && point.y <= 100);
    }
    assert.notDeepEqual(plan.start, plan.target);
  }
  assert.equal(tourDemoPlan(1, 'unknown').device, 'desktop');
  assert.deepEqual(tourDemoPlan(-5, 'ios').target, tourDemoPlan(0, 'ios').target);
});

test('reopenable KPI walkthrough keeps all five steps in bounds for every device', () => {
  assert.deepEqual(TOUR_DEVICES, ['desktop', 'android', 'ios']);
  for (const device of TOUR_DEVICES) {
    for (let i = 0; i <= 4; i++) {
      assert.deepEqual(tourState(i, device), { step: i, total: 5, progress: (i + 1) * 20, device });
    }
  }
  assert.equal(tourState(-20, 'unknown').step, 0);
  assert.equal(tourState(99, 'android').step, 4);
  assert.equal(tourState(2.5, 'ios').step, 0);
  assert.equal(tourState(1, 'unknown').device, 'desktop');
});

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


test('manager direct handoff validates both existing file formats atomically', () => {
  const tasks = JSON.parse(V2([R('m1')], { range: { from: '2026-10-01', to: '2026-10-31' } }));
  const reports = JSON.parse(REP({ range: { from: '2026-10-01', to: '2026-10-31' } }));
  const message = { type: MANAGER_AUTO_SCHEMA, nonce: '0123456789abcdef0123456789abcdef', tasks, reports };
  const imported = parseManagerTransfer(message);
  assert.equal(imported.error, undefined);
  assert.equal(imported.dataset.tasks.length, 1);
  assert.equal(imported.reports.range.from, '2026-10-01');
  assert.equal(parseManagerTransfer({ ...message, nonce: 'bad' }).error, 'mgr_auto_invalid');
  assert.equal(parseManagerTransfer({ ...message, reports: { ...reports, range: { from: '2026-09-01', to: '2026-09-30' } } }).error, 'mgr_auto_range');
  assert.equal(parseManagerTransfer({ ...message, tasks: { ...tasks, taskGroupId: 100000 } }).error, 'mgr_auto_invalid');
  assert.equal(parseManagerTransfer({ ...message, reports: { ...reports, schema: 'unknown' } }).error, 'mgr_auto_invalid');
});
test('manual manager bookmark remains downloadable and auto transfer uses one exact portal origin', () => {
  const args = ['2026-10-01', '2026-10-31', '2', 'ar'];
  const manual = decodeURIComponent(buildManagerBookmarklet(...args));
  const auto = decodeURIComponent(buildManagerBookmarklet(...args, 'auto', 'https://mhmdsfwt371.github.io/Jed-Tech-portal/'));
  assert.match(manual, /"DEL":"download"/);
  assert.match(auto, /"DEL":"auto"/);
  assert.match(auto, /window.open\(dest.href/);
  assert.match(auto, /sink.postMessage\(packet,targetOrigin\)/);
  assert.match(auto, /'afaqy-manager-ready\/v1'/);
  assert.match(auto, /'afaqy-manager-ack\/v1'/);
  assert.match(auto, /dl\('afaqy-tasks-'/, 'fallback must still produce downloadable files');
  assert.doesNotMatch(manual, /https:\/\/mhmdsfwt371.github.io\/Jed-Tech-portal\//);
  assert.throws(() => buildManagerBookmarklet(...args, 'auto', 'http://example.com/'), /invalid portal URL/);
});

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

test('type names in the reader’s language, isolated; safe portal addresses; strings load per language', async () => {
  const C = await import('../core.js');
  assert.equal(C.typeLabel('WASL Link | الربط مع وصل', 'ar'), '\u2068الربط مع وصل\u2069');
  assert.equal(C.typeLabel('WASL Link | الربط مع وصل', 'en'), '\u2068WASL Link\u2069');
  assert.equal(C.typeLabel('Prepare the visit', 'ar'), '\u2068Prepare the visit\u2069', 'no Arabic half: the name as it is');
  assert.ok(C.safePortalUrl('https://mhmdsfwt371.github.io/Jed-Tech-portal/'));
  assert.ok(C.safePortalUrl('http://127.0.0.1:8080/'), 'this machine, for testing');
  for (const bad of ['http://example.com/', 'https://u:p@example.com/', 'file:///x', 'javascript:alert(1)']) assert.ok(!C.safePortalUrl(bad), bad);
  for (const l of C.LANGS) assert.ok(Object.keys(C.STRINGS[l]).length > 500, `${l} strings loaded`);
});

test('the card judges only the teams’ own types: other types count in points as “other work”, never as strengths; no team work = too little to judge', () => {
  const wt = parseWeights({ default: 1, tasks: { 'WASL Link': { w: 3, tier: 'integration' }, 'View Units': { w: 1, tier: 'admin' } } });
  const D = (id, a, type, day) => ({ id, assigneeId: a, type, state: 'done', createdAt: `2026-10-${day}T08:00:00Z`, completedAt: `2026-10-${day}T09:00:00Z` });
  const tasks = [...['01', '02', '03', '04', '05', '06', '07', '08'].map((d) => D('m' + d, 'M', 'Prepare the visit', d)),
    ...['01', '02', '03', '04', '05', '06'].map((d) => D('w' + d, 'A', 'WASL Link', d)), ...['01', '02'].map((d) => D('x' + d, 'B', 'WASL Link', d)), ...['10', '11', '12', '13', '14', '15', '16', '17', '18', '19'].map((d) => D('v' + d, 'B', 'View Units', d))];
  const ctx = { tasks, activities: [], weights: wt, team: ['M', 'A', 'B'], now: new Date('2026-10-29T10:00:00Z') };
  const m = monthCard(ctx, 'M', '2026-10'), a = monthCard(ctx, 'A', '2026-10');
  assert.equal(m.points, 8, 'other work still counts in points'); assert.equal(m.otherWork, 8);
  assert.equal(m.archetype, 'early', 'no work of the teams’ types: too little to judge');
  assert.ok(!m.strengths.some((s) => /Prepare/.test(s.type || '')), 'an outside type is never a strength');
  assert.equal(a.otherWork, 0); assert.ok(a.strengths.some((s) => s.kind === 'spec'), 'the WASL specialist is still found');
});

test('workload share: calendar windows (Sunday week) and each person’s share by points, tasks and email', async () => {
  const C = await import('../core.js');
  assert.deepEqual(C.shareWindow('day', '2026-10-29'), { from: '2026-10-29', to: '2026-10-29' });
  assert.deepEqual(C.shareWindow('week', '2026-10-29'), { from: '2026-10-25', to: '2026-10-31' }, 'Sunday to Saturday');
  assert.deepEqual(C.shareWindow('month', '2026-10-29'), { from: '2026-10-01', to: '2026-10-31' });
  assert.deepEqual(C.shareWindow('quarter', '2026-11-15'), { from: '2026-10-01', to: '2026-12-31' });
  const wt = parseWeights({ default: 1, tasks: { 'WASL Link': { w: 3 } } });
  const D = (id, a, type, day, m) => ({ id, assigneeId: a, type, state: 'done', moduleId: m, createdAt: `2026-10-${day}T08:00:00Z`, completedAt: `2026-10-${day}T09:00:00Z` });
  const tasks = [D('1', 'A', 'WASL Link', '26'), D('2', 'B', 'x', '26', 146), D('3', 'B', 'x', '27', 146), D('4', 'C', 'x', '20')];
  const s = C.workloadShare(tasks, wt, ['A', 'B', 'C'], C.shareWindow('week', '2026-10-29'));
  const A = s.people.find((p) => p.id === 'A'), B = s.people.find((p) => p.id === 'B');
  assert.deepEqual([s.total.tasks, s.total.points, s.total.email], [3, 5, 2], 'C’s task is the week before');
  assert.equal(A.pointsPct, 60); assert.equal(B.tasksPct, 66.7); assert.equal(B.emailPct, 100); assert.equal(s.fair, 33.3);
});

test('email: classification by words (English and Arabic, without false «وصل»), sender matching, content-free rows, per-person stats', async () => {
  const C = await import('../core.js');
  assert.equal(C.classifyMail('Re: API integration needed'), 'integration');
  assert.equal(C.classifyMail('طلب ربط مع منصة وصل'), 'wasl', 'WASL linking is easy');
  assert.equal(C.mailTier(C.classifyMail('WASL link request')), 'easy');
  assert.equal(C.classifyMail('WASL API integration'), 'integration', 'real integration words still make it hard');
  assert.equal(C.classifyMail('ربط الأنظمة'), 'integration', 'a generic link request stays hard');
  assert.deepEqual(C.lastQuarters('2026-10-30', 4).map((q) => q.label), ['Q4 2026', 'Q3 2026', 'Q2 2026', 'Q1 2026']);
  assert.deepEqual(C.lastQuarters('2026-02-01', 2).map((q) => [q.label, q.from, q.to]), [['Q1 2026', '2026-01-01', '2026-03-31'], ['Q4 2025', '2025-10-01', '2025-12-31']]);
  assert.equal(C.classifyMail('وصل الجهاز اليوم'), 'other', '«وصل» meaning “arrived” is not WASL');
  assert.equal(C.classifyMail('RFQ for 40 trackers'), 'request');
  assert.equal(C.classifyMail('الجهاز متوقف'), 'issue');
  assert.equal(C.classifyMail('استفسار عن التقرير'), 'inquiry');
  const people = [{ id: 'A', nameEn: 'Lina Testwell' }, { id: 'B', nameEn: 'Karim Sample' }]; const internal = (a) => /@afaqy/.test(a);
  const row = C.mailRow({ id: 'm1', receivedDateTime: '2026-10-28T08:00:00Z', conversationId: 'c1', subject: 'API please', bodyPreview: 'secret text', from: { emailAddress: { address: 'x@client.com', name: 'Client' } } }, people, internal);
  assert.deepEqual(Object.keys(row), ['i', 't', 'c', 'w', 'k']); assert.equal(row.w, 'ext'); assert.equal(row.k, 'integration');
  assert.ok(!JSON.stringify(row).includes('secret') && !JSON.stringify(row).includes('client.com'), 'no content, no address');
  const M = (id, at, conv, addr, name, subj = '') => C.mailRow({ id, receivedDateTime: at, conversationId: conv, subject: subj, from: { emailAddress: { address: addr, name } } }, people, internal);
  const rows = [M('1', '2026-10-27T08:00:00Z', 'c1', 'a@cl.com', 'C', 'API integration'), M('2', '2026-10-27T08:30:00Z', 'c1', 'lina.testwell@afaqy.sa', 'Lina Testwell'),
    M('3', '2026-10-27T09:00:00Z', 'c2', 'b@cl.com', 'C', 'استفسار'), M('4', '2026-10-27T11:00:00Z', 'c2', 'k.sample@afaqy.sa', 'Karim Sample'),
    M('5', '2026-10-28T09:00:00Z', 'c3', 'c@cl.com', 'C', 'issue'), M('6', '2026-10-28T09:10:00Z', 'c3', 'z@afaqy.sa', 'Other Colleague')];
  const s = C.mailStats(rows, ['A', 'B'], C.shareWindow('week', '2026-10-29'));
  const A = s.people.find((p) => p.id === 'A'), B = s.people.find((p) => p.id === 'B');
  assert.deepEqual([s.total, s.customerThreads, s.unanswered, s.otherColleagues], [2, 3, 0, 1]);
  assert.deepEqual([A.replies, A.hardPct, A.firstReplyMin], [1, 100, 30]); assert.deepEqual([B.cats.easy, B.firstReplyMin], [1, 120]);
});

test('levels: percentile axes among peers, a level only with enough work, and the plan from the weakest axes', async () => {
  const C = await import('../core.js');
  const wt = parseWeights({ default: 1, tasks: { 'WASL Link': { w: 3, tier: 'integration' }, 'View Units': { w: 1, tier: 'admin' } } });
  const D = (id, a, type, day, hrs) => ({ id, assigneeId: a, type, state: 'done', createdAt: `2026-10-${day}T08:00:00Z`, completedAt: new Date(Date.parse(`2026-10-${day}T08:00:00Z`) + hrs * 3600000).toISOString() });
  const mk = (who, n, type, hrs) => Array.from({ length: n }, (_, i) => D(`${who}${type}${i}`, who, type, String(10 + (i % 15)).padStart(2, '0'), hrs));
  const tasks = [...mk('A', 12, 'WASL Link', 2), ...mk('B', 12, 'View Units', 30), ...mk('C', 6, 'WASL Link', 5), ...mk('C', 6, 'View Units', 5)];
  const q = C.lastQuarters('2026-10-29', 1)[0];
  const L = C.engineerLevels(tasks, wt, ['A', 'B', 'C'], q);
  assert.equal(L.A.axes.difficulty, 100); assert.equal(L.B.axes.difficulty, 0); assert.equal(L.A.axes.speed, 100); assert.equal(L.B.axes.speed, 0);
  assert.ok(L.A.level > L.B.level, 'the harder, faster engineer ranks higher');
  assert.equal(L.A.trend, null, 'no previous quarter, no trend'); assert.equal(L.A.forecast, null, 'a forecast needs three quarters');
  const plan = C.developmentPlan(L, 'B');
  assert.ok(plan.length && plan.every((p) => p.pct < 50), 'the plan targets weak axes'); assert.equal(plan.find((p) => p.axis === 'difficulty').buddy, 'A');
  const tiny = C.engineerLevels(mk('Z', 2, 'View Units', 1), wt, ['Z', 'A'], q);
  assert.equal(tiny.Z.level, null, 'too little work, no level');
});

test('points basis: factors → base; working hours Sun–Thu 8–17 Saudi; done, speed (×1.5 within standard) and time (×0.5–×2)', async () => {
  const C = await import('../core.js');
  assert.deepEqual([[0, 0, 0, 1], [0, 1, 0, 1], [1, 1, 0, 1], [1, 2, 0, 1], [1, 1, 2, 2], [1, 2, 2, 2]].map(C.baseFromFactors), [1, 2, 2, 3, 4, 5]);
  assert.equal(C.businessHours('2026-10-29T06:00:00Z', '2026-10-29T09:00:00Z'), 3, 'Thursday 9:00–12:00 Saudi');
  assert.equal(C.businessHours('2026-10-29T13:00:00Z', '2026-11-01T06:00:00Z'), 2, 'Thursday 16:00 → Sunday 09:00: one hour Thursday, the weekend skipped, one hour Sunday');
  const wt = C.parseWeights({ default: 1, tasks: {
    'Email Customer Activity': { w: 2, f: [0, 1, 0, 1], mode: 'speed', std: 2 }, 'TSU Request': { w: 4, f: [1, 1, 2, 2], mode: 'time', std: 9 }, 'View Units': { w: 1, f: [0, 0, 0, 0], mode: 'done' } } });
  const T = (type, from, to) => ({ type, createdAt: from, completedAt: to, state: 'done' });
  assert.equal(C.taskPoints(wt, T('Email Customer Activity', '2026-10-28T06:00:00Z', '2026-10-28T07:00:00Z')), 3, 'within 2h → ×1.5');
  assert.equal(C.taskPoints(wt, T('Email Customer Activity', '2026-10-28T06:00:00Z', '2026-10-28T10:00:00Z')), 2, 'beyond → the base');
  assert.equal(C.taskPoints(wt, T('TSU Request', '2026-10-25T05:00:00Z', '2026-10-26T14:00:00Z')), 4, 'two working days = 18h, exactly twice the usual 9h → ×1 (ADR-0048: the old time method reads as «compare»)');
  assert.equal(C.taskPoints(wt, T('TSU Request', '2026-10-25T05:00:00Z', '2026-11-05T14:00:00Z')), 2, 'far beyond twice the usual → ×0.5');
  assert.equal(C.taskPoints(wt, T('TSU Request', '2026-10-25T05:00:00Z', '2026-10-25T06:00:00Z')), 6, 'within half the usual → ×1.5');
  assert.equal(C.taskPoints(wt, T('View Units', '2026-10-25T05:00:00Z', '2026-11-25T06:00:00Z')), 1, 'on completion: time does not count');
});

test('load sustainability: after-hours, weekend and late-night shares in Saudi time; load against an even slice; red, amber, green', async () => {
  const C = await import('../core.js');
  const wt = parseWeights({ default: 1 });
  const at = (day, hh) => `2026-10-${day}T${String(hh - 3).padStart(2, '0')}:30:00Z`;   // hh is Saudi time
  const D = (id, a, day, hh) => ({ id, assigneeId: a, type: 'x', state: 'done', createdAt: at(day, hh), completedAt: at(day, hh) });
  const days = ['18', '19', '20', '21', '22', '25', '26', '27', '28', '29'];   // Sun–Thu working days
  const tasks = [
    ...days.flatMap((d, i) => [D(`a${i}`, 'A', d, 10), D(`b${i}`, 'A', d, 11)]),                                 // A: all in hours
    ...days.flatMap((d, i) => [D(`c${i}`, 'B', d, 19), D(`e${i}`, 'B', d, 22)]), D('f1', 'B', '23', 12), D('f2', 'B', '24', 12),   // B: evenings, late, weekend
    ...days.map((d, i) => D(`g${i}`, 'C', d, 9)),
  ];
  const r = C.loadSustainability(tasks, wt, ['A', 'B', 'C'], '2026-10-29');
  assert.equal(r.people.A.after, 0); assert.equal(r.people.A.status, 'green');
  assert.ok(r.people.B.after >= 90 && r.people.B.weekend > 0 && r.people.B.late >= 45); assert.equal(r.people.B.status, 'red');
  assert.equal(r.people.C.status, 'quiet', 'too few events and no load signal');
  assert.ok(r.people.A.share > 1 && r.people.C.share < 1);
});

test('a newer pull overrides older real pulls it covers; partial overlaps and the sample set stay', async () => {
  const C = await import('../core.js');
  const ds = (from, to, ids, extra = {}) => ({ key: `${from}_${to}`, range: { from, to }, tasks: ids.map((i) => ({ id: i })), people: [], ...extra });
  let list = C.mergeDataset([], ds('2026-10-01', '2026-10-15', ['a']));
  list = C.mergeDataset(list, ds('2026-09-20', '2026-10-10', ['z']));
  list = C.mergeDataset(list, ds('2026-10-01', '2026-10-20', ['a', 'b']));
  assert.deepEqual(list.map((d) => d.key).sort(), ['2026-09-20_2026-10-10', '2026-10-01_2026-10-20'], '1–15 is replaced by 1–20; the partial overlap stays');
  list = C.mergeDataset(list, ds('2026-10-01', '2026-10-31', ['a', 'b', 'c'], { sample: true }));
  assert.equal(list.length, 3, 'a sample set replaces nothing');
});

test('team: a device “removed” marker takes someone off the scope and out of the merged file', async () => {
  const C = await import('../core.js');
  const repo = { people: { 1: { position: 'a' }, 2: { position: 'b' } } };
  const merged = C.mergeRoster(repo, { people: { 2: { removed: true }, 3: { position: 'c' } } });
  assert.deepEqual(Object.keys(merged.people).sort(), ['1', '3']);
  assert.ok(!JSON.stringify(merged).includes('removed'), 'the downloaded file never carries the marker');
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


// ---- quarter development plans ----
test('quarterRange gives the first and last day and the months; quarterOf shifts across the year', () => {
  const q = core.quarterRange('2027-Q1'); assert.equal(q.from, '2027-01-01'); assert.equal(q.to, '2027-03-31'); assert.equal(q.months[2], '2027-03');
  assert.equal(core.quarterOf('2026-10-31', 1).key, '2027-Q1'); assert.equal(core.quarterOf('2026-02-10', -1).key, '2025-Q4');
});
const QWT = { tasks: { 'manual task': { w: 2 } }, activities: {} };
const QTK = [{ assigneeId: 'a', state: 'done', type: 'Manual Task', createdAt: '2026-10-01T06:00:00Z', completedAt: '2026-10-01T16:00:00Z' },
  { assigneeId: 'a', state: 'done', type: 'Manual Task', createdAt: '2026-10-05T06:00:00Z', completedAt: '2026-10-06T06:00:00Z' },
  { assigneeId: 'a', state: 'open', type: 'Manual Task', createdAt: '2026-11-01T06:00:00Z' }];
test('quarterBaseline counts done, mean hours, completion rate and task types', () => {
  const b = core.quarterBaseline(QTK, QWT, 'a', core.quarterRange('2026-Q4'));
  assert.equal(b.done, 2); assert.equal(b.avgHours, 17); assert.equal(b.rate, 0.67); assert.equal(b.types[0].k, 'manual task');
});
test('goal progress handles higher-better, lower-better and custom goals, and weights the plan', () => {
  const pr = core.quarterGoalProgress(QTK, QWT, 'a', core.quarterRange('2026-Q4'), [{ metric: 'done', target: 4, weight: 1 }, { metric: 'avgHours', target: 34, weight: 1 }, { metric: 'custom', pct: 50, weight: 2 }]);
  assert.equal(pr[0].pct, 50); assert.equal(pr[1].pct, 100); assert.equal(pr[2].pct, 50); assert.equal(core.planProgress(pr), 63);
});
test('suggested goals stretch the baseline and aim at the weakest axes', () => {
  const b = core.quarterBaseline(QTK, QWT, 'a', core.quarterRange('2026-Q4'));
  const s = core.suggestQuarterGoals(b, { axes: { volume: 80, difficulty: 60, speed: 20, reliability: 40 } });
  const sp = s.find((g) => g.metric === 'avgHours'); assert.equal(sp.target, 13.6); assert.ok(sp.weak); assert.ok(s.some((g) => g.metric === 'type'));
});
// ---- the scoring rules (ADR-0045): defaults must reproduce the original fixed engine exactly ----
test('default rules reproduce the old base for all 81 factor combinations', () => {
  const old = (f) => { const n = f.reduce((a, b) => a + b, 0); return n <= 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : n === 6 ? 4 : 5; };
  const R = core.parseRules(null); let n = 0;
  for (const a of [0, 1, 2]) for (const b of [0, 1, 2]) for (const c of [0, 1, 2]) for (const d of [0, 1, 2]) { assert.equal(core.baseFromFactors([a, b, c, d], R), old([a, b, c, d])); assert.equal(core.baseFromFactors([a, b, c, d]), old([a, b, c, d])); n++; }
  assert.equal(n, 81);
});
test('default rules reproduce the old points for done and speed at many durations', () => {
  const oldPts = (x, task) => { const base = x.w; if (!x.mode || x.mode === 'done' || !x.std) return base; const h = core.businessHours(task.createdAt, task.completedAt);
    if (x.mode === 'speed') return h <= x.std ? Math.round(base * 1.5 * 10) / 10 : base; return Math.round(base * Math.min(2, Math.max(0.5, h / x.std)) * 10) / 10; };
  const wt = core.parseWeights({ tasks: { 'a': { w: 3, mode: 'done' }, 'b': { w: 4, mode: 'speed', std: 6 } } });
  let n = 0;
  for (const ty of ['a', 'b']) for (const hrs of [1, 3, 5.5, 6, 9, 14, 30, 60]) {
    const start = '2026-10-04T05:00:00.000Z', end = new Date(Date.parse(start) + hrs * 3600000).toISOString(), task = { type: ty, createdAt: start, completedAt: end, state: 'done' };
    assert.equal(core.taskPoints(wt, task), oldPts(wt.tasks[ty], task), `${ty} ${hrs}h`); n++;
  }
  assert.equal(n, 16);
});
test('factor importance, cut points, speed, time limits and extras change the points as set', () => {
  const R = core.parseRules({ fw: { impact: 2 } }); assert.equal(core.factorScore([0, 0, 0, 2], R), 4); assert.equal(core.baseFromFactors([0, 0, 0, 2], R), 3);
  assert.equal(core.baseFromFactors([2, 2, 0, 0], core.parseRules({ cuts: [0, 1, 2, 3] })), 5);
  const wt = core.parseWeights({ tasks: { s: { w: 4, mode: 'speed', std: 8 }, t: { w: 2, mode: 'time', std: 2 } }, rules: { speedX: 2, bonusEmail: 25, bonusAfter: 50 } });
  const sun = '2026-10-04T05:00:00.000Z', plus = (h) => new Date(Date.parse(sun) + h * 3600000).toISOString();
  assert.equal(core.taskPoints(wt, { type: 's', createdAt: sun, completedAt: plus(2) }), 8);
  assert.equal(core.taskPoints(wt, { type: 't', createdAt: sun, completedAt: plus(7) }), 1);   // the old «time» now reads as «compare»: 7 h of a 2 h usual time is over twice → ×0.5
  assert.equal(core.taskPoints(wt, { type: 's', createdAt: sun, completedAt: plus(2), fromEmail: true }), 10);
  assert.equal(core.taskPoints(wt, { type: 's', createdAt: sun, completedAt: '2026-10-04T16:30:00.000Z' }), 6);
});
test('invalid rules fall back to the defaults, and the weights carry and merge the rules', () => {
  const R = core.parseRules({ cuts: [5, 3, 6, 7], speedX: 9, fw: { tech: -1 }, bonusEmail: 'x' });
  assert.deepEqual(R.cuts, [1, 3, 5, 6]); assert.equal(R.speedX, 1.5); assert.equal(R.fw.tech, 1); assert.equal(R.extras.length, 0); assert.ok(core.rulesAreDefault(R));
  const m = core.mergeWeights({ rules: { speedX: 1.2 } }, { rules: { speedX: 2 } }); assert.equal(m.rules.speedX, 2);
  assert.equal(core.mergeWeights({ rules: { speedX: 1.2 } }, {}).rules.speedX, 1.2);
});
test('extra rules: one condition, AND, OR, stacking by sum or highest, and the cap', () => {
  const sun = '2026-10-04T05:00:00.000Z', late = '2026-10-04T15:30:00.000Z', plus = (h) => new Date(Date.parse(sun) + h * 3600000).toISOString();
  const mk = (rules) => core.parseWeights({ tasks: { d: { w: 4, mode: 'done' }, v: { w: 4, mode: 'done', f: [1, 0, 2, 0] } }, rules });
  const AND = mk({ extras: [{ when: ['email', 'after'], join: 'and', pct: 50 }] }), OR = mk({ extras: [{ when: ['email', 'after'], join: 'or', pct: 50 }] });
  assert.equal(core.taskPoints(AND, { type: 'd', createdAt: sun, completedAt: plus(2), fromEmail: true }), 4);
  assert.equal(core.taskPoints(AND, { type: 'd', createdAt: sun, completedAt: late, fromEmail: true }), 6);
  assert.equal(core.taskPoints(OR, { type: 'd', createdAt: sun, completedAt: plus(2), fromEmail: true }), 6);
  assert.equal(core.taskPoints(OR, { type: 'd', createdAt: sun, completedAt: late }), 6);
  assert.equal(core.taskPoints(OR, { type: 'd', createdAt: sun, completedAt: plus(2) }), 4);
  const two = [{ when: ['email'], pct: 25 }, { when: ['field'], pct: 50 }];
  assert.equal(core.taskPoints(mk({ extras: two }), { type: 'v', createdAt: sun, completedAt: plus(2), fromEmail: true }), 7);
  assert.equal(core.taskPoints(mk({ extras: two, stack: 'max' }), { type: 'v', createdAt: sun, completedAt: plus(2), fromEmail: true }), 6);
  assert.equal(core.taskPoints(mk({ extras: two, capPct: 30 }), { type: 'v', createdAt: sun, completedAt: plus(2), fromEmail: true }), 5.2);
  const legacy = core.parseRules({ bonusEmail: 25 }); assert.deepEqual(legacy.extras, [{ when: ['email'], join: 'and', pct: 25 }]);
  assert.equal(core.parseRules({ extras: [{ when: ['nonsense'], pct: 20 }, { when: ['email'], pct: 0 }] }).extras.length, 0);
});
test('«against the usual time» in three steps, adjustable, and the old «time» reads as it', () => {
  const sun = '2026-10-04T05:00:00.000Z', plus = (h) => new Date(Date.parse(sun) + h * 3600000).toISOString();
  const wt = core.parseWeights({ tasks: { c: { w: 2, mode: 'compare', std: 4 }, old: { w: 2, mode: 'time', std: 4 } } });
  assert.equal(wt.tasks.old.mode, 'compare'); assert.deepEqual(core.POINT_MODES, ['done', 'speed', 'compare']);
  const p = (ty, h, w = wt) => core.taskPoints(w, { type: ty, createdAt: sun, completedAt: plus(h) });
  assert.equal(p('c', 1), 3); assert.equal(p('c', 2), 3); assert.equal(p('c', 4), 2); assert.equal(p('c', 8), 2); assert.equal(p('c', 9), 1); assert.equal(p('old', 9), 1);
  const w2 = core.parseWeights({ tasks: { c: { w: 2, mode: 'compare', std: 4 } }, rules: { cmpFast: 0.25, cmpSlow: 1.5, cmpFastX: 2, cmpSlowX: 0 } });
  assert.equal(p('c', 1, w2), 4); assert.equal(p('c', 2, w2), 2); assert.equal(p('c', 7, w2), 0);
  assert.equal(core.pointsDetail(wt, 'c', 9).why, 'cmp_slow');
});
test('the manager’s own methods: steps against the usual time, flat, missing, and validation', () => {
  const sun = '2026-10-04T05:00:00.000Z', plus = (h) => new Date(Date.parse(sun) + h * 3600000).toISOString();
  const rules = { methods: [{ id: 'm_veryfast', name: 'سريعة جدًا', steps: [{ upTo: 30, x: 2 }, { upTo: 100, x: 1.2 }], beyond: 0.5 }, { id: 'm_flat01', name: 'ثابتة', steps: [], beyond: 1 }] };
  const wt = core.parseWeights({ tasks: { a: { w: 2, mode: 'm_veryfast', std: 1 }, b: { w: 2, mode: 'm_flat01' }, c: { w: 2, mode: 'm_gone99', std: 1 } }, rules });
  const p = (ty, h) => core.taskPoints(wt, { type: ty, createdAt: sun, completedAt: plus(h) });
  assert.equal(p('a', 0.2), 4); assert.equal(p('a', 0.8), 2.4); assert.equal(p('a', 1), 2.4); assert.equal(p('a', 2), 1);
  assert.equal(p('b', 9), 2); assert.equal(p('c', 0.1), 2);
  assert.equal(core.pointsDetail(wt, 'a', 0.2).method, 'سريعة جدًا'); assert.equal(core.pointsDetail(wt, 'c', 0.1).why, 'custom_missing');
  const R = core.parseRules({ methods: [{ id: 'bad id', name: 'x', steps: [] }, { id: 'm_abc', name: '', steps: [] }, { id: 'm_ok1', name: 'ok', steps: [{ upTo: 50, x: 2 }, { upTo: 40, x: 1 }, { upTo: 80, x: 9 }], beyond: 7 }] });
  assert.equal(R.methods.length, 1); assert.deepEqual(R.methods[0].steps, [{ upTo: 50, x: 2 }]); assert.equal(R.methods[0].beyond, 1);
  assert.ok(core.isCustomMode('m_ok1')); assert.ok(!core.isCustomMode('speed'));
});
test('the «أنواع الفرق» bookmark reads only the teams, talks only to crmbackend and the portal, and its hand-over is checked', () => {
  const code = decodeURIComponent(core.buildTypesBookmarklet('https://example.org/portal/').replace(/^javascript:/, ''));
  assert.ok(code.includes("post('Teams/GetAllTeams'") && code.includes("get('Teams/GetTeamById/'") && !code.includes('Task/GetMyTasksGrid') && !code.includes('TechnicianReport'));
  assert.ok(code.includes("dest.hash='weights'") && code.includes(core.TEAMTYPES_AUTO_SCHEMA) && !/const packet=\{[^}]*\btk\b/.test(code));
  assert.throws(() => core.buildTypesBookmarklet('http://evil.example/'));
  const ok = core.parseTeamTypesTransfer({ type: core.TEAMTYPES_AUTO_SCHEMA, extractedAt: '2026-11-02T08:00:00Z', teamTypes: { 'Jeddah After sales Team': [{ id: 5, nameEn: 'New Type', nameAr: 'نوع' }, { junk: 1 }] } });
  assert.equal(ok.teamTypes['Jeddah After sales Team'].length, 1); assert.equal(ok.extractedAt, '2026-11-02T08:00:00.000Z');
  assert.equal(core.parseTeamTypesTransfer({ type: 'other', teamTypes: {} }).error, 'tt_bad'); assert.equal(core.parseTeamTypesTransfer({ type: core.TEAMTYPES_AUTO_SCHEMA, teamTypes: { a: [] } }).error, 'tt_empty');
});
test('the hierarchy from the employee list: eight safe fields only, tied to people by name, descendants without loops, differences from the team file', () => {
  const raw = [
    { id: 1, nameEn: 'Alpha Director', nameAr: 'ألفا', phoneNumber: '+966500000001', identityNumber: '1100000001', department: 'Technical', manager: 'Zulu Head', branch: 'Jeddah', branchCode: '2', status: 'Active' },
    { id: 2, nameEn: 'Bravo Lead', department: 'Technical', manager: 'Alpha Director', branch: 'Jeddah', status: 'Active', phoneNumber: '+966500000002' },
    { id: 3, nameEn: 'Charlie Team Lead', manager: 'Bravo Lead', status: 'Active' }, { id: 4, nameEn: 'Delta Rnd Lead', manager: 'Alpha Director', status: 'Active' },
    { id: 5, nameEn: 'Eng One', manager: 'charlie  team lead', status: 'Active' }, { id: 6, nameEn: 'Eng Two', manager: 'Charlie Team Lead', status: 'Active' },
    { id: 7, nameEn: 'Eng Three', manager: 'Delta Rnd Lead', status: 'Active' }, { id: 8, nameEn: 'Ghost Hire', manager: 'Charlie Team Lead', status: 'Active' },
    { id: 9, nameEn: 'Left Company', manager: 'Charlie Team Lead', status: 'Inactive' }, { id: 10, nameEn: 'Loop A', manager: 'Loop B' }, { id: 11, nameEn: 'Loop B', manager: 'Loop A' },
  ];
  const emps = core.parseEmployees(raw);
  assert.equal(emps.length, 11); assert.ok(!JSON.stringify(emps).includes('966500000001') && !JSON.stringify(emps).includes('1100000001') && !/phoneNumber|identityNumber/.test(JSON.stringify(emps)));
  assert.deepEqual(Object.keys(emps[0]).sort(), ['branch', 'branchCode', 'department', 'id', 'manager', 'nameAr', 'nameEn', 'status']);
  assert.deepEqual(core.parseEmployees(null), []); assert.equal(core.parseEmployees([{ id: 1 }, null, 'x']).length, 0);
  const people = [['1', 'Alpha Director'], ['2', 'Bravo Lead'], ['3', 'Charlie Team Lead'], ['4', 'Delta Rnd Lead'], ['21', 'Eng One'], ['22', 'Eng Two'], ['23', 'Eng Three'], ['24', 'Left Company'], ['25', 'Not In List']].map(([id, nameEn]) => ({ id, nameEn }));
  const org = core.buildOrg(emps, people);
  assert.deepEqual(org.engineersOf('1').sort(), ['21', '22', '23'], 'engineers = matched people with no reports of their own; the inactive one and the unmatched hire are out');
  assert.deepEqual(org.unmatchedUnder('1'), ['Ghost Hire']); assert.deepEqual(org.managers().map((m) => m.pid).slice(0, 3), ['1', '2', '3']); assert.equal(org.managers()[0].n, 7);
  assert.deepEqual(org.managerOf('21'), { pid: '3', name: 'Charlie Team Lead' }); assert.equal(org.isManager('3'), true); assert.equal(org.isManager('21'), false); assert.deepEqual(org.under('25'), []);
  assert.equal(org.under('1').length, 7, 'a loop between two employees ends');
  const cmp = core.compareOrg(org, { people: { '21': { leaderId: '3' }, '22': { leaderId: '2' }, '24': { leaderId: '3' }, '99': { leaderId: '3', position: 'Gone' } } }, '1');
  assert.deepEqual(cmp.leader.map((d) => [d.id, d.file, d.orgPid]), [['22', '2', '3']]); assert.deepEqual(cmp.notInOrg, ['99']); assert.deepEqual(cmp.inactive, ['24']); assert.deepEqual(cmp.missingInFile, ['23']); assert.deepEqual(cmp.unmatched, ['Ghost Hire']);
  const code = decodeURIComponent(core.buildManagerBookmarklet('2026-10-01', '2026-10-29', '2', 'en', 'auto', 'https://example.org/portal/').replace(/^javascript:/, ''));
  assert.ok(code.includes("post('EmployeeIC/GetAllEmployeesGrid'") && code.includes('employees,notes:') && !/phoneNumber|identityNumber/.test(code));
});
test('the pull filters teams by the branch it is given; the Jeddah name rule applies only to Jeddah; the hierarchy gives a manager his branch', () => {
  const dec = (b) => decodeURIComponent(core.buildManagerBookmarklet('2026-10-01', '2026-10-29', b, 'en', 'auto', 'https://example.org/portal/').replace(/^javascript:/, ''));
  assert.ok(dec('1').includes('"BR":"1"') && dec('1').includes('"JED":false') && dec('1').includes('bc===BR||(JED&&/jeddah/i'));
  assert.ok(dec(core.JEDDAH_BRANCH).includes(`"BR":"${core.JEDDAH_BRANCH}"`) && dec(core.JEDDAH_BRANCH).includes('"JED":true'));
  const ty = decodeURIComponent(core.buildTypesBookmarklet('https://example.org/portal/', '1').replace(/^javascript:/, ''));
  assert.ok(ty.includes("bc==='1'||(false&&/jeddah/i"));
  const org = core.buildOrg(core.parseEmployees([{ nameEn: 'Alpha Boss', manager: 'Zulu Head', branch: 'Riyadh', branchCode: '1' }, { nameEn: 'Bravo Eng', manager: 'Alpha Boss', branch: 'Riyadh', branchCode: '1' }]), [{ id: '1', nameEn: 'Alpha Boss' }, { id: '2', nameEn: 'Bravo Eng' }]);
  assert.deepEqual(org.branchOf('1'), { code: '1', name: 'Riyadh' }); assert.equal(org.branchOf('99'), null);
});
test('the pull is one recipe plus one body: the bookmark and the extension run the same text; «ext» hands the result to the extension', () => {
  const R = core.managerPullRecipe('2026-09-01', '2026-11-30', '2', 'ar', 'ext');
  assert.deepEqual(Object.keys(R), core.MANAGER_PULL_KEYS); assert.equal(R.DEL, 'ext'); assert.equal(R.PORTAL, ''); assert.equal(R.LATER, false);
  assert.ok(!core.MANAGER_PULL_BODY.includes('${'), 'no value is woven into the body');
  assert.ok(core.MANAGER_PULL_BODY.includes("if(DEL==='ext'){window.postMessage({type:PACKET,ext:true,tasks:tasksFile,reports:repFile},location.origin)"));
  assert.ok(core.MANAGER_PULL_BODY.includes('range:{from:FROM,to:RTO}'), 'a period that runs past today is recorded as ending today');
  const bm = decodeURIComponent(core.buildManagerBookmarklet('2026-10-01', '2026-10-29', '2', 'ar').replace(/^javascript:/, ''));
  assert.ok(bm.includes(core.MANAGER_PULL_BODY.replace(/\n/g, '')), 'the bookmark carries exactly the same body');
  assert.throws(() => core.managerPullRecipe('2026-11-30', '2026-09-01'));
});
test('overtime from task times: Saturday first-to-last, Sunday–Thursday 19:00–24:00 only, Friday and daytime ignored, Saudi time', () => {
  const T = (id, a, cr, done, by = null) => ({ id, title: `t${id}`, assigneeId: a, createdById: by, createdAt: cr, completedAt: done, state: done ? 'done' : 'open' });
  const tasks = [
    T('1', 'B', '2026-10-03T06:00:00Z', null, 'A'),                       // Sat 09:00 Saudi: A creates a task
    T('2', 'A', '2026-10-02T08:00:00Z', '2026-10-03T11:30:00Z'),          // created Friday, closed Sat 14:30 by A
    T('3', 'A', '2026-10-04T12:00:00Z', '2026-10-04T17:30:00Z'),          // Sun: created 15:00, closed 20:30
    T('4', 'A', '2026-10-04T18:00:00Z', '2026-10-04T19:15:00Z'),          // Sun: created 21:00, closed 22:15
    T('5', 'B', '2026-10-08T10:00:00Z', '2026-10-08T20:59:00Z'),          // Thu 23:59: still the evening window
    T('6', 'B', '2026-10-09T10:00:00Z', '2026-10-09T15:00:00Z'),          // Friday: not counted
    T('7', 'B', '2026-10-05T10:00:00Z', '2026-10-05T15:59:00Z'),          // Mon 18:59: daytime
    T('8', 'B', '2026-10-05T10:00:00Z', '2026-10-05T21:30:00Z'),          // Tue 00:30: after midnight, not counted
  ];
  const o = core.overtimeOf(tasks, { from: '2026-10-01', to: '2026-10-31' });
  const row = (pid, date) => o.rows.find((r) => r.pid === pid && r.date === date);
  assert.equal(row('A', '2026-10-03').hours, 5.5, 'Saturday: from the first task (09:00) to the last close (14:30)');
  assert.equal(row('A', '2026-10-03').kind, 'sat');
  assert.equal(row('A', '2026-10-04').hours, 1.75, 'evening: first event in the window (20:30) to the last close (22:15)');
  assert.equal(row('B', '2026-10-08').hours, 0, 'one close with no known start measures zero');
  assert.equal(o.rows.filter((r) => r.pid === 'B').length, 1, 'B has the Thursday evening only: task 1 on Saturday is A’s creation, not B’s work');
  assert.ok(!o.rows.some((r) => ['2026-10-09', '2026-10-05', '2026-10-06'].includes(r.date)), 'Friday, daytime and after-midnight are out');
  const f = core.overtimeOf(tasks, { from: '2026-10-01', to: '2026-10-31', evening: 'from' });
  assert.equal(f.rows.find((r) => r.pid === 'A' && r.date === '2026-10-04').hours, 3.25, 'from 19:00 to the last close');
  assert.equal(f.rows.find((r) => r.pid === 'A' && r.date === '2026-10-03').hours, 5.5, 'the evening choice never changes Saturday');
  const a = o.people.find((p) => p.pid === 'A'); assert.deepEqual([a.satDays, a.satHours, a.eveDays, a.eveHours, a.total], [1, 5.5, 1, 1.75, 7.25]);
  assert.equal(core.overtimeOf(tasks, { from: '2026-10-01', to: '2026-10-31', people: new Set(['B']) }).rows.every((r) => r.pid === 'B'), true);
  assert.equal(core.overtimeOf(tasks, { from: '2026-10-04', to: '2026-10-31' }).rows.some((r) => r.date === '2026-10-03'), false);
});
test('overtime marks a day closed in one batch (three or more closes within 15 minutes) and counts those days per person', () => {
  const T = (id, a, cr, done) => ({ id, title: `t${id}`, assigneeId: a, createdById: 'SYS', createdAt: cr, completedAt: done, state: 'done' });
  const tasks = [T('1', 'L', '2026-10-03T11:48:00Z', '2026-10-03T11:53:00Z'), T('2', 'L', '2026-10-03T11:49:00Z', '2026-10-03T11:53:30Z'), T('3', 'L', '2026-10-03T11:50:00Z', '2026-10-03T11:54:00Z'),
    T('4', 'M', '2026-10-03T06:00:00Z', '2026-10-03T08:00:00Z'), T('5', 'M', '2026-10-03T09:00:00Z', '2026-10-03T12:00:00Z')];
  const o = core.overtimeOf(tasks, { from: '2026-10-01', to: '2026-10-31', people: new Set(['L', 'M']) });
  assert.equal(o.rows.find((r) => r.pid === 'L').batch, true); assert.equal(o.rows.find((r) => r.pid === 'M').batch, false);
  assert.equal(o.people.find((x) => x.pid === 'L').batchDays, 1); assert.equal(o.people.find((x) => x.pid === 'M').batchDays, 0);
});
test('one source per task (self, email, other) and, in the board engine, received per source and time to close per source over the tasks done', () => {
  const T = (id, a, by, mod, cr, done, st) => ({ id, assigneeId: a, createdById: by, fromEmail: mod, createdAt: cr, completedAt: done, state: st || (done ? 'done' : 'open') });
  assert.equal(core.taskSource({ fromEmail: true, createdById: 'H', assigneeId: 'H' }), 'email', 'e-mail first, even if the same person');
  assert.equal(core.taskSource({ fromEmail: false, createdById: 'H', assigneeId: 'H' }), 'self'); assert.equal(core.taskSource({ fromEmail: false, createdById: 'M', assigneeId: 'H' }), 'other');
  const tasks = [T('1', 'H', 'H', false, '2026-10-05T07:00:00Z', '2026-10-05T09:00:00Z'), T('2', 'H', 'H', false, '2026-10-06T07:00:00Z', '2026-10-06T11:00:00Z'),
    T('3', 'H', 'SYS', true, '2026-10-07T07:00:00Z', '2026-10-08T07:00:00Z'), T('4', 'H', 'M', false, '2026-10-08T07:00:00Z', '2026-10-08T13:00:00Z'),
    T('5', 'H', 'SYS', true, '2026-09-29T07:00:00Z', '2026-10-02T07:00:00Z'), T('6', 'H', 'H', false, '2026-10-09T07:00:00Z', null)];
  const f = core.factor1(tasks, { range: { from: '2026-10-01', to: '2026-10-31' }, team: ['H'] }), h = f.people.find((p) => p.id === 'H'), s = h.bySource;
  assert.deepEqual([s.self.received, s.email.received, s.other.received], [3, 1, 1], 'received in October: tasks 1, 2, 6 self; 3 email; 4 other');
  assert.deepEqual([s.self.done, s.email.done, s.other.done], [2, 2, 1], 'done in October: task 5 (received in September) is done in October and counts in «done»');
  assert.equal(s.self.avgHours, 3); assert.equal(s.email.avgHours, 48); assert.equal(s.other.avgHours, 6);
  assert.equal(h.avgHours, 21.6, 'all five done in October: (2 + 4 + 24 + 72 + 6) ÷ 5 = 21.6 h');
});
test('overtime marks a day closed in one batch (three or more closes within 15 minutes) and counts those days per person', () => {
  const T = (id, a, cr, done) => ({ id, title: `t${id}`, assigneeId: a, createdById: 'SYS', createdAt: cr, completedAt: done, state: 'done' });
  const tasks = [T('1', 'L', '2026-10-03T11:48:00Z', '2026-10-03T11:53:00Z'), T('2', 'L', '2026-10-03T11:49:00Z', '2026-10-03T11:53:30Z'), T('3', 'L', '2026-10-03T11:50:00Z', '2026-10-03T11:54:00Z'),
    T('4', 'M', '2026-10-03T06:00:00Z', '2026-10-03T08:00:00Z'), T('5', 'M', '2026-10-03T09:00:00Z', '2026-10-03T12:00:00Z')];
  const o = core.overtimeOf(tasks, { from: '2026-10-01', to: '2026-10-31', people: new Set(['L', 'M']) });
  assert.equal(o.rows.find((r) => r.pid === 'L').batch, true); assert.equal(o.rows.find((r) => r.pid === 'M').batch, false);
  assert.equal(o.people.find((x) => x.pid === 'L').batchDays, 1); assert.equal(o.people.find((x) => x.pid === 'M').batchDays, 0);
});
test('overtime marks a day closed in one batch (three or more closes within 15 minutes) and counts those days per person', () => {
  const T = (id, a, cr, done) => ({ id, title: `t${id}`, assigneeId: a, createdById: 'SYS', createdAt: cr, completedAt: done, state: 'done' });
  const tasks = [T('1', 'L', '2026-10-03T11:48:00Z', '2026-10-03T11:53:00Z'), T('2', 'L', '2026-10-03T11:49:00Z', '2026-10-03T11:53:30Z'), T('3', 'L', '2026-10-03T11:50:00Z', '2026-10-03T11:54:00Z'),
    T('4', 'M', '2026-10-03T06:00:00Z', '2026-10-03T08:00:00Z'), T('5', 'M', '2026-10-03T09:00:00Z', '2026-10-03T12:00:00Z')];
  const o = core.overtimeOf(tasks, { from: '2026-10-01', to: '2026-10-31', people: new Set(['L', 'M']) });
  assert.equal(o.rows.find((r) => r.pid === 'L').batch, true); assert.equal(o.rows.find((r) => r.pid === 'M').batch, false);
  assert.equal(o.people.find((x) => x.pid === 'L').batchDays, 1); assert.equal(o.people.find((x) => x.pid === 'M').batchDays, 0);
});
// The runner sits after every test() so that each one runs; a test added below this line would be counted without running.
let failed = 0;
test('one e-mail counts once: copies in two folders share a key; without a Message-ID, sender, time and subject decide (ADR-0075)', () => {
  const a = { internetMessageId: '<ABC@afaqy.com>', descriptorNodeId: 1, subject: 'x' }, b = { internetMessageId: '<abc@afaqy.com> ', descriptorNodeId: 2, subject: 'x' };
  assert.equal(core.mailKey(a), core.mailKey(b));
  const c = { senderEmailAddress: 'S@afaqy.com', clientSubmitTime: '2026-10-05T09:00:00Z', subject: 'Report' }, d = { ...c, descriptorNodeId: 9, subject: ' report ' };
  assert.equal(core.mailKey(c), core.mailKey(d));
  assert.notEqual(core.mailKey(c), core.mailKey({ ...c, subject: 'Another' }));
  assert.notEqual(core.mailKey(a), core.mailKey({ internetMessageId: '<other@afaqy.com>' }));
});

// ADR-0111 — monthly readings: invented data only (no real pull may live in the repository)
test('monthly readings: scope, origin, times, tier points, Dammam points and the automatic score', () => {
  const people = [{ id: '1', nameEn: 'A', teams: ['Jeddah After sales Team'] }, { id: '2', nameEn: 'B', teams: ['Jeddah After sales Team'] }, { id: '9', nameEn: 'X', teams: ['Jeddah-Sales Team'] }, { id: '7', nameEn: 'System User', teams: ['Jeddah After sales Team'] }];
  const tk = (id, type, created, closed, by, to, mail = false) => ({ id, type, createdAt: created, completedAt: closed, createdById: by, assigneeId: to, fromEmail: mail, state: closed ? 'done' : 'open' });
  const tasks = [
    tk('a', 'Email Customer Activity', '2026-10-04T06:00:00Z', '2026-10-04T08:00:00Z', '7', '1', true),      // e-mail, 2 h
    tk('b', 'Email Customer Activity', '2026-10-05T06:00:00Z', '2026-10-06T06:00:00Z', '7', '1', true),      // e-mail, 24 h
    tk('c', 'Manual Task', '2026-10-05T07:00:00Z', '2026-10-05T07:03:00Z', '1', '1'),                        // self, 3 minutes
    tk('d', 'Training Request | طلب تدريب', '2026-10-06T07:00:00Z', '2026-10-08T07:00:00Z', '2', '1'),        // others, 48 h, tier 4
    tk('e', 'WASL Link', '2026-10-07T07:00:00Z', null, '1', '2'),                                              // open, created 7 Oct
    tk('f', 'Manual Task', '2026-10-20T07:00:00Z', '2026-10-20T08:00:00Z', '2', '2'),                        // self, 1 h
    tk('g', 'Manual Task', '2026-09-30T18:52:00Z', '2026-10-01T07:00:00Z', '2', '2'),                        // 30 Sep 21:52 Saudi time: September, not October
    tk('h', 'Manual Task', '2026-10-10T07:00:00Z', '2026-10-10T07:30:00Z', '9', '9'),                        // another team
    tk('i', 'Manual Task', '2026-09-30T21:30:00Z', '2026-10-01T05:00:00Z', '1', '1'),                        // 1 Oct 00:30 Saudi time: October
  ];
  const W = { tasks: { 'email customer activity': { w: 2, tier: 'customer' }, 'manual task': { w: 1, tier: 'admin' }, 'training request': { w: 5, tier: 'multistage' }, 'wasl link': { w: 2, tier: 'customer' } } };
  const r = core.monthReadings(tasks, people, W, { month: '2026-10', to: '2026-10-29' });
  assert.equal(r.accounts, 2, 'the system account and other teams are outside the scope');
  assert.equal(r.arrived, 7); assert.equal(r.closed, 6); assert.equal(r.workingDays, 21);
  assert.deepEqual([r.email, r.self, r.others], [2, 3, 2]);
  assert.equal(r.generic, 5); assert.equal(r.typeCount, 4);
  assert.equal(r.selfLe5m, 1); assert.equal(r.selfClosed, 3);
  assert.equal(r.emailLe8h, 1); assert.equal(r.emailClosed, 2); assert.equal(r.emailLe8hShare, 0.5);
  const m1 = r.members.find((m) => m.id === '1'), m2 = r.members.find((m) => m.id === '2');
  assert.equal(m1.no, 1); assert.equal(m1.points, 2 + 2 + 1 + 5 + 1); assert.equal(m1.dammamPoints, 5 + 5 + 3 + 15 + 3);
  assert.equal(m2.points, 1); assert.equal(m2.open, 1); assert.equal(m2.openOver7, 1, 'open since 7 Oct is over 7 days on 29 Oct');
  assert.equal(m1.sysClosed, 3); assert.equal(m1.sysLe8h, 1);
  assert.equal(r.baseTarget, 6); assert.equal(Math.round(m1.score.output), 110, 'output is capped at 110%');
  assert.equal(r.types.find((x) => x.key === 'training request').points, 5);
  const sep = core.monthReadings(tasks, people, W, { month: '2026-09' });
  assert.equal(sep.arrived, 1, 'the 30 Sep 21:52 task belongs to September'); assert.equal(sep.to, '2026-09-30');
});

// ADR-0115 — a pull names the account that made it
test('the team pull names the account that made it; the portal keeps a clean id and nothing else', () => {
  const code = decodeURIComponent(core.buildManagerBookmarklet('2026-11-01', '2026-11-12').slice(11));
  assert.ok(code.includes('pulledBy:WHO') && code.includes('p.UserId'), 'the tasks file carries the account from the session key');
  assert.ok(!/pulledBy:tk|token:tk|"tk"/.test(code), 'the key itself is never put in the file');
  assert.ok(!decodeURIComponent(core.buildTypesBookmarklet('https://x/').slice(11)).includes('WHO'), 'the types bookmark is not changed');
  const base = { schema: core.SCHEMA, range: { from: '2026-11-01', to: '2026-11-12' }, extractedAt: '2026-11-12T10:00:00.000Z', taskGroupId: 100001, people: [{ id: '124', nameEn: 'A', teams: [] }], tasks: [] };
  const ok = core.parseDataset({ ...base, pulledBy: { id: 124, name: 'n'.repeat(300) } });
  assert.deepEqual([ok.dataset.pulledBy.id, ok.dataset.pulledBy.name.length], ['124', 80]);
  assert.equal(core.parseDataset({ ...base, pulledBy: { id: '<script>', name: 'x' } }).dataset.pulledBy, null, 'a malformed id is dropped');
  assert.equal(core.parseDataset(base).dataset.pulledBy, null, 'an older pull names no account');
  const merged = core.mergeDataset([ok.dataset], core.parseDataset({ ...base, extractedAt: '2026-11-12T11:00:00.000Z' }).dataset);
  assert.equal(merged[0].pulledBy.id, '124', 'a later file of the same period that names no account does not erase it');
});

// ADR-0116 — an engineer's own pull does not stop when MyAFAQY refuses the R&D queue
test("the engineer's pull treats the main queue as essential and the R&D queue as optional", () => {
  const code = decodeURIComponent(core.buildBookmarklet('https://x/', 'en').slice(11));
  assert.doesNotThrow(() => new Function(code));
  assert.ok(code.includes('for(const g of[100000,100001]){try{'), 'each queue is read inside its own guard');
  assert.ok(code.includes('catch(e){if(g===100000)throw e}'), 'a refusal of the main queue still stops the pull; a refusal of the R&D queue does not');
});

test('tender email reads Arabic schedule tables, validates dates and leaves conflicting deadlines for review', () => {
  const schedule = core.tenderEmailSchedule('', '<table><tr><td>الاستفسارات</td><td>06/06/1448</td><td>١٦/١١/٢٠٢٦</td></tr><tr><td>التقديم</td><td>17/11/2026 الساعة 2:30 م</td></tr></table>');
  assert.deepEqual(schedule, { askDue: [{ date: '2026-11-16', time: '' }], due: [{ date: '2026-11-17', time: '14:30' }], visit: [], openAt: [] });
  const followup = core.tenderEmailSchedule('Submission deadline: 2026-11-19 at 9:30 AM\nClarification deadline: 31/02/2026');
  const item = { due: '', askDue: '2026-11-15', messages: [{ schedule }] };
  const filled = core.applyTenderEmailDates(item);
  assert.equal(filled.dueTime, '14:30');
  assert.equal(item.due, '');
  assert.equal(filled.askDue, '2026-11-15');
  const conflicted = core.applyTenderEmailDates({ ...filled, messages: [...filled.messages, { schedule: followup }] });
  assert.equal(conflicted.due, '');
  assert.equal(conflicted.dueTime, '');
  assert.deepEqual(core.tenderDeadlineCandidates(conflicted, 'due').map((d) => d.date), ['2026-11-17', '2026-11-19']);
  assert.equal(followup.askDue.length, 0);
  assert.equal(core.applyTenderEmailDates({ ...conflicted, due: '2026-11-19', dateSources: { due: 'manual' } }).due, '2026-11-19');
});

test('tender file backup merge honours a removed attachment and requires both offer files for a new bid', () => {
  const original = { id: 'mail', name: 'message.eml', kind: 'original', blob: new Blob(['mail']) };
  const photo = { id: 'photo', name: 'logo.png', kind: 'other', blob: new Blob(['image']) };
  const technical = { id: 'technical', name: 'technical.pdf', kind: 'technical', blob: new Blob(['tech']) };
  const financial = { id: 'financial', name: 'financial.pdf', kind: 'financial', blob: new Blob(['finance']) };
  const before = core.cleanTenderDetails({ files: [original, photo, technical] });
  const after = core.cleanTenderDetails({ files: [original, technical, financial], removedFiles: ['photo'] });
  assert.equal(core.tenderCanAdvance(before, 'ready'), false);
  assert.equal(core.tenderCanAdvance(before, 'submitted'), false);
  assert.equal(core.tenderCanAdvance(before, 'prep'), true);
  assert.equal(core.tenderCanAdvance(after, 'ready'), true);
  for (const merged of [core.mergeTenderDetails(before, after), core.mergeTenderDetails(after, before)]) {
    assert.deepEqual(merged.files.map((f) => f.id).sort(), ['financial', 'mail', 'technical']);
    assert.deepEqual(merged.removedFiles, ['photo']);
  }
});

test('document insights quote source text, keep Arabic evidence and never invent missing facts', () => {
  const result = core.tenderDocumentInsights([{ locator: '3', text: 'كراسة الشروط والمواصفات\nالزيارة الميدانية إلزامية قبل تقديم العرض\nمدة التنفيذ 90 يوما\nالضمان الابتدائي 1%\nSubmission deadline: 2026-12-04 at 10:00 AM' }]);
  assert.equal(result.kind, 'booklet');
  assert.ok(result.highlights.some(x => x.topic === 'visit' && x.locator === '3' && x.text.includes('إلزامية')));
  assert.ok(result.highlights.some(x => x.topic === 'duration' && x.text.includes('90')));
  assert.deepEqual(result.schedule.due.map(x => [x.date,x.time,x.locator]), [['2026-12-04','10:00','3']]);
  assert.equal(core.tenderDocumentInsights([{text:'Logo only',locator:'1'}]).highlights.length, 0);
  assert.equal(core.tenderDocumentInsights([{text:'الزيارة الميدانية غير مطلوبة',locator:'2'}]).highlights[0].text, 'الزيارة الميدانية غير مطلوبة');
});
test('document deadlines retain provenance, reveal conflict, preserve manual dates and clear removed sources', () => {
  const file = { id:'f',name:'terms.pdf',kind:'booklet',analysis:{state:'read',schedule:{due:[{date:'2026-12-04',time:'10:00',locator:'3'}]}} };
  const filled = core.applyTenderEmailDates({ files:[file],due:'' });
  assert.equal(filled.due, '2026-12-04');
  assert.equal(filled.dateSources.due, 'document');
  assert.equal(core.tenderDeadlineCandidates(filled,'due')[0].sources[0].label, 'terms.pdf');
  const conflict = core.applyTenderEmailDates({...filled,messages:[{key:'m',subject:'extension',schedule:{due:[{date:'2026-12-08',time:''}]}}]});
  assert.equal(conflict.due, '');
  assert.equal(core.applyTenderEmailDates({...filled,files:[]}).due, '');
  assert.equal(core.applyTenderEmailDates({...filled,files:[],dateSources:{due:'manual'}}).due, '2026-12-04');
});
test('document findings survive sanitization with bounded tables and safe field names', () => {
  const file = {id:'f',name:'BOQ.xlsx',kind:'boq',blob:new Blob(['x']),analysis:{state:'read',format:'sheet',readAt:'2026-11-12T00:00:00Z',highlights:[{topic:'bond',text:'Bid bond 1%',locator:'Terms'}],schedule:{due:[{date:'2026-12-04',time:'10:00',locator:'Terms'}]},tables:[{name:'BOQ',rows:[['Item','Qty'],['Camera','30']]}]}};
  const cleaned = core.cleanTenderDetails({files:[file],dateSources:{due:'document'}});
  assert.equal(cleaned.files[0].analysis.tables[0].rows[1][1], '30');
  assert.equal(cleaned.files[0].analysis.highlights[0].topic, 'bond');
  assert.equal(cleaned.dateSources.due, 'document');
  assert.equal(core.cleanTenderDetails({files:[{...file,analysis:{state:'invented'}}]}).files[0].analysis, undefined);
});

test('a short complete evidence sentence does not absorb the next requirement', () => {
  const result = core.tenderDocumentInsights([{locator:'1',text:'Site visit is not required.\nContract duration: 90 days.'}]);
  assert.equal(result.highlights.find(x=>x.topic==='visit').text,'Site visit is not required.');
  const heading = core.tenderDocumentInsights([{text:'Contract duration:\n90 calendar days',locator:'1'}]);
  assert.equal(heading.highlights[0].text,'Contract duration:\n90 calendar days');
});
test('document analysis and explicit classification survive merging an older same-file backup', () => {
  const blob = new Blob(['bytes']);
  const oldFile = {id:'f',name:'terms.pdf',kind:'other',blob};
  const editedFile = {...oldFile,kind:'study',kindManual:true,kindAt:'2026-11-13T10:00:00Z',analysis:{state:'read',readAt:'2026-11-13T09:00:00Z',highlights:[{topic:'visit',text:'Visit required',locator:'1'}]}};
  for (const [base,other] of [[oldFile,editedFile],[editedFile,oldFile]]) {
    const file = core.mergeTenderDetails({files:[base]},{files:[other]}).files[0];
    assert.equal(file.kind,'study');assert.equal(file.analysis.highlights[0].text,'Visit required');
  }
});

test('project follow-up keeps execution separate and reports nullable cash amounts', () => {
  const row={id:'sample:followup-core',name:'sample: Tender',status:'won',value:900,threads:[]};
  const data=core.projectWorkUpdate(null,row,{execution:'ongoing',collected:120},{id:'sample:event',at:'2026-11-14T09:00:00Z'});
  const report=core.projectReport([row],data);
  assert.equal(row.status,'won');assert.equal(report.rows[0].status,'ongoing');
  assert.equal(report.rows[0].followup.award,null);assert.equal(report.totals.collected,120);
  assert.equal(report.events.length,1);
});

// ADR-0119 — a long window turns into pages: where each page begins
test('pages of a long window start only between rows, keep every row whole once, and keep the heading row in view', () => {
  const rows = Array.from({ length: 60 }, (_, i) => ({ top: 100 + i * 42, bottom: 142 + i * 42, lead: 38 }));
  const { starts, end } = core.pageStarts(rows, { view: 800, barH: 60, inset: 54 });
  assert.equal(end, 100 + 60 * 42);
  assert.ok(starts.length > 3);
  const room = 800 - 60;
  for (let p = 0; p < starts.length; p += 1) {
    const s = starts[p], next = starts[p + 1];
    if (p) assert.ok(rows.some((r) => r.top === s.y), `page ${p + 1} starts at a row`);
    // everything that starts on this page and before the next page ends inside the visible part, under the bar and the heading row
    for (const r of rows) if (r.top >= s.y && (!next || r.top < next.y)) { assert.ok(r.bottom <= s.top + room + 0.5, `row at ${r.top} is cut at the foot of page ${p + 1}`); if (p) assert.ok(r.top >= s.top + 54 + 38 - 0.5, `row at ${r.top} hides under the heading on page ${p + 1}`); }
  }
  const seen = rows.map((r) => starts.filter((s, p) => r.top >= s.y && (!starts[p + 1] || r.top < starts[p + 1].y)).length);
  assert.deepEqual([...new Set(seen)], [1], 'every row belongs to exactly one page');
});
test('a heading is not left alone at the foot of a page, and something taller than a page is shown in screens', () => {
  const boxes = [{ top: 10, bottom: 600 }, { top: 610, bottom: 640, head: true }, { top: 650, bottom: 690 }, { top: 700, bottom: 1400 }];
  const a = core.pageStarts(boxes, { view: 700, barH: 40, inset: 0 });
  assert.equal(a.starts[1].y, 610, 'the page ends before the heading, so the heading opens the next page with what follows it');
  const tall = core.pageStarts([{ top: 10, bottom: 60, head: true }, { top: 70, bottom: 3000 }], { view: 700, barH: 40, inset: 0 });
  assert.ok(tall.starts.length >= 5 && tall.starts.every((s, i) => !i || s.top > tall.starts[i - 1].top), 'the tall block is walked in screens, always forward');
  assert.equal(tall.starts[1].top, 660, 'the first page is not left empty before the tall block');
  assert.deepEqual(core.pageStarts([], { view: 700, barH: 40 }).starts, [{ y: 0, top: 0 }]);
});

// v9.42 — the assignment panel read the same accounts several times (10,005 «Jeddah accounts» for 2,201 real ones)
test('the assignment panel counts each account once, keeps only Jeddah, and notices a page that brings nothing new', () => {
  const seen = new Set();
  const a = core.assignPage(seen, [{ id: 1, customerId: 31405, branchCode: '2', afterSalesManIds: [7610, 4121, 4121], connectedDevices: '3' }, { id: 2, customerId: 900, branchCode: '1', afterSalesManIds: [5] }]);
  assert.deepEqual(a.rows, [{ id: '31405', have: ['7610', '4121'], devices: 3 }]);
  assert.equal(a.fresh, 2, 'a Riyadh account is still counted as read, so the reading knows when it has seen them all');
  const again = core.assignPage(seen, [{ customerId: 31405, branchCode: '2', afterSalesManIds: [1] }, { customerId: 900, branchCode: '1' }]);
  assert.deepEqual([again.rows.length, again.fresh], [0, 0], 'the same accounts on a later page are not counted again');
  const code = decodeURIComponent(core.buildAssignBookmarklet('ar').slice(11));
  assert.doesNotThrow(() => new Function(code));
  assert.ok(code.includes('assignPage(seen,arr)'), 'the panel reads its pages through the same function');
  assert.ok(/M\.unexpected/.test(code) && /blocked=true/.test(code), 'a pilot that removed someone nobody ticked stops «apply to the rest»');
  assert.ok(decodeURIComponent(core.buildAssignBookmarklet('ur').slice(11)).includes('"title":"'), 'an Urdu manager gets a panel with words, not an empty one');
});

test('typeNameOf: a type whose two name fields both carry «English | Arabic» is named once, not twice', () => {
  const both = 'Training Request | طلب تدريب';
  assert.equal(core.typeNameOf(both, both), both);
  assert.equal(core.typeLabel(core.typeNameOf(both, both), 'en'), '\u2068Training Request\u2069');
  assert.equal(core.typeLabel(core.typeNameOf(both, both), 'ar'), '\u2068طلب تدريب\u2069');
  assert.equal(core.typeNameOf('Visit', 'زيارة'), 'Visit | زيارة');
  assert.equal(core.typeNameOf('Visit', ''), 'Visit');
  assert.equal(core.typeNameOf('', ''), '');
});

test('buildOrg: a person «On Leave» in MyAFAQY stays on his manager\'s team and is never called inactive', () => {
  const emps = [{ id: 1, nameEn: 'Boss One', status: 'Active' }, { id: 2, nameEn: 'Away Eng', manager: 'Boss One', status: 'On Leave' },
    { id: 3, nameEn: 'Here Eng', manager: 'Boss One', status: 'Active' }, { id: 4, nameEn: 'Gone Eng', manager: 'Boss One', status: 'Resigned' }];
  const people = [{ id: '10', nameEn: 'Boss One' }, { id: '20', nameEn: 'Away Eng' }, { id: '30', nameEn: 'Here Eng' }, { id: '40', nameEn: 'Gone Eng' }];
  const org = core.buildOrg(emps, people);
  assert.deepEqual(org.engineersOf('10').sort(), ['20', '30'], 'on leave is still on the team; the one who left is not');
  assert.equal(org.isActive('20'), true); assert.equal(org.isOnLeave('20'), true); assert.equal(org.statusOf('40'), 'Resigned');
  const file = { people: { 20: { leaderId: '10' }, 30: { leaderId: '10', onLeave: true }, 40: { leaderId: '10' } } };
  const cmp = core.compareOrg(org, file, '10');
  assert.deepEqual(cmp.inactive, ['40']); assert.deepEqual(cmp.onLeave, ['20'], 'only the leave the team file does not already mark');
});

test('accounts board: systems come from joining the server-account list to the Server IP list, port included, counted by customer', () => {
  const ipSys = core.serverIpMap([{ serverIP: '10.0.0.110', systemName: 'afaqy.pro' }, { serverIP: '10.0.0.37:9966\n', systemName: 'vss_37' }, { serverIP: '10.0.0.37', systemName: 'camera.x' },
    { serverIP: 'OfflineDVR', systemName: 'OfflineDVR' }, { serverIP: '10.0.0.17', systemName: 'vss_17' }], {});
  assert.equal(ipSys['10.0.0.37:9966'], 'vss_37', 'a trailing line break is not part of the address');
  const accts = [{ c: '1', a: ['u1'], d: 10, g: 'Medium' }, { c: '2', a: ['u1', 'u2'], d: 0, g: 'Individual & Small' }, { c: '3', a: [], d: 5, g: 'Individual & Small' }];
  const jed = new Map(accts.map((x) => [x.c, x]));
  const n = core.attachSystems(jed, [{ customerId: 1, serverIp: '10.0.0.110', status: 'Working' }, { customerId: 1, serverIp: '10.0.0.37:9966', status: 'Working' },
    { customerId: 1, serverIp: '10.0.0.17', status: 'Blocked' }, { customerId: 2, serverIp: '10.0.0.37', status: 'Working' }, { customerId: 2, serverIp: '9.9.9.9', status: 'Disabled' },
    { customerId: 77, serverIp: '10.0.0.110', status: 'Working' }], ipSys);
  assert.equal(n, 5, 'a customer outside Jeddah is skipped');
  const raw = JSON.parse(REP({ accounts: { rows: accts, eng: { e9: { en: 'Left Engineer', ar: 'م' } }, systems: { read: 6, total: 6, complete: true } } }));
  const rep = parseReports(JSON.stringify(raw)).reports;
  assert.deepEqual(rep.accounts[0].y, [['afaqy.pro', 'Working'], ['vss_37', 'Working'], ['vss_17', 'Blocked']]);
  assert.equal(rep.accEng.e9.en, 'Left Engineer');
  const b = core.accountsBoard(rep);
  assert.deepEqual(b.total, { accounts: 3, devices: 15, zero: 1, unassigned: 1, withServer: 2, withWorking: 2, noServer: 1 });
  assert.deepEqual(b.segments.map((x) => [x.name, x.accounts, x.devices]), [['Individual & Small', 2, 5], ['Medium', 1, 10]]);
  assert.deepEqual(b.engineers.map((x) => [x.id, x.accounts, x.devices, x.solo]), [['u1', 2, 10, 1], ['u2', 1, 0, 0]]);
  assert.deepEqual(b.systems.map((x) => [x.name, x.customers, x.working, x.servers]), [['?', 1, 0, 1], ['afaqy.pro', 1, 1, 1], ['camera.x', 1, 1, 1], ['vss_17', 1, 0, 1], ['vss_37', 1, 1, 1]]);
  assert.deepEqual(b.families.map((x) => [x.id, x.customers, x.working, x.members]), [['vss', 1, 1, ['vss_17', 'vss_37']]], 'one customer on two VSS servers is one VSS customer');
  const half = core.accountsBoard(parseReports(JSON.stringify({ ...raw, accounts: { ...raw.accounts, systems: { read: 3, total: 6, complete: false } } })).reports);
  assert.equal(half.hasSystems, false, 'a list read only in part claims no system figure');
  const old = core.accountsBoard(parseReports(REP({ accounts: { rows: [{ c: '1', a: ['u1'], d: 2, s: 1 }] } })).reports);
  assert.equal(old.hasSystems, false); assert.equal(old.total.accounts, 1, 'an older pull without systems still reads');
  const code = decodeURIComponent(core.buildManagerBookmarklet('2026-10-01', '2026-10-31', '2', 'ar'));
  assert.ok(code.includes("'TechniqueSystem/GetGridServerIPs'") && code.includes("'CustomerServerAccount/GetAllCustomerAccounts'"), 'the two lists the screens themselves send');
  assert.ok(code.includes('const attachSystems=function attachSystems'), 'the bookmark runs the tested join');
  assert.doesNotThrow(() => new Function(code.replace(/^javascript:/, '')));
});

test('startDue: the manager\'s response rule — 1 working hour Sun–Thu (09–18, 19–22), 3 on Saturday (09–18), Friday off', () => {
  const at = (s) => core.startDue(s), z = (s) => new Date(s).toISOString();
  assert.equal(at('2026-11-15T10:00:00+03:00'), z('2026-11-15T11:00:00+03:00'), 'Sunday morning: one hour');
  assert.equal(at('2026-11-15T17:30:00+03:00'), z('2026-11-15T19:30:00+03:00'), 'half an hour before 18:00, the rest after 19:00');
  assert.equal(at('2026-11-15T18:20:00+03:00'), z('2026-11-15T20:00:00+03:00'), 'the break 18–19 does not count');
  assert.equal(at('2026-11-15T21:45:00+03:00'), z('2026-11-16T09:45:00+03:00'), 'fifteen minutes at night, the rest next morning');
  assert.equal(at('2026-11-15T07:00:00+03:00'), z('2026-11-15T10:00:00+03:00'), 'before opening: from 09:00');
  assert.equal(at('2026-11-19T23:00:00+03:00'), z('2026-11-21T12:00:00+03:00'), 'Thursday night → Friday off → Saturday 09:00 + 3 h');
  assert.equal(at('2026-11-20T10:00:00+03:00'), z('2026-11-21T12:00:00+03:00'), 'Friday: from Saturday 09:00, Saturday\'s 3 hours');
  assert.equal(at('2026-11-21T16:00:00+03:00'), z('2026-11-22T10:00:00+03:00'), 'Saturday 16:00: two hours to 18:00, no Saturday evening, the third hour Sunday');
  assert.equal(at('2026-11-19T21:30:00+03:00'), z('2026-11-21T09:30:00+03:00'), 'Thursday 21:30: half an hour Thursday, the other half Saturday');
  assert.equal(at('nonsense'), null);
});
test('dailyIntake: each day\'s arrivals add up, «not started» and «late» are judged at the pull\'s time, other teams left out', () => {
  const X = (id, c, o = {}) => ({ id, assigneeId: 'A', createdAt: c, state: 'open', bucket: 'open', ...o });
  const tasks = [
    X('1', '2026-11-15T10:00:00+03:00', { state: 'done', bucket: 'done', completedAt: '2026-11-15T15:00:00+03:00' }),
    X('2', '2026-11-15T11:00:00+03:00', { state: 'done', bucket: 'done', completedAt: '2026-11-16T09:30:00+03:00' }),
    X('3', '2026-11-15T12:00:00+03:00', { bucket: 'toDo' }),
    X('4', '2026-11-16T09:10:00+03:00', { bucket: 'toDo', fromEmail: true }),
    X('5', '2026-11-16T09:20:00+03:00'),
    X('6', '2026-11-16T09:30:00+03:00', { state: 'cancelled', bucket: 'done' }),
    X('7', '2026-11-16T09:40:00+03:00', { bucket: 'toDo', assigneeId: 'B' })];
  const r = core.dailyIntake(tasks, { from: '2026-11-15', to: '2026-11-16', asOf: '2026-11-16T09:50:00+03:00', team: ['A'], complete: (d) => d === '2026-11-16' });
  assert.deepEqual(r.days.map((d) => [d.day, d.arrived, d.sameDay, d.later, d.notStarted, d.late, d.open, d.cancelled, d.email, d.complete]),
    [['2026-11-16', 3, 0, 0, 1, 0, 1, 1, 1, true], ['2026-11-15', 3, 1, 1, 1, 1, 0, 0, 0, false]], 'task 4 is 40 minutes old: not late yet; task 3 is a day old: late');
  for (const d of r.days) assert.equal(d.arrived, d.sameDay + d.later + d.notStarted + d.open + d.cancelled);
  assert.deepEqual(core.dailyIntake([], { from: '2026-11-19', to: '2026-11-21', asOf: '2026-11-21T12:00:00Z' }).days.map((d) => [d.day, d.arrived]), [['2026-11-21', 0], ['2026-11-20', 0], ['2026-11-19', 0]], 'a day with nothing is still a row');
  assert.deepEqual(r.lateNow.map((x) => x.id), ['3']); assert.equal(r.waiting, 2);
  assert.ok(core.coveredFrom([{ from: '2026-10-01', to: '2026-10-31' }, { from: '2026-11-01', to: '2026-11-16' }], '2026-10-20', '2026-11-16'));
  assert.ok(!core.coveredFrom([{ from: '2026-10-01', to: '2026-10-29' }, { from: '2026-11-01', to: '2026-11-16' }], '2026-10-20', '2026-11-16'), 'a gap on 30–31 October');
  assert.ok(!core.coveredFrom([{ from: '2026-11-03', to: '2026-11-16' }], '2026-11-01', '2026-11-16'));
});

test('tender dates: the site visit and the bid opening are read from labelled lines; a manual value is never replaced; needs follow the stage', () => {
  const s = core.tenderEmailSchedule('آخر موعد لزيارة الموقع: 20/11/2026\nتاريخ فتح العروض 01/12/2026 الساعة 10:00 ص\nآخر موعد لتقديم العروض: 30/11/2026\nSite visit date: 2026-11-20\nBid opening: 2026-12-01');
  assert.deepEqual(s.visit, [{ date: '2026-11-20', time: '' }]);
  assert.deepEqual(s.openAt.map((d) => d.date), ['2026-12-01', '2026-12-01']);
  assert.deepEqual(s.due, [{ date: '2026-11-30', time: '' }], 'the opening line is not mistaken for the submission deadline');
  const filled = core.applyTenderEmailDates({ visit: '', openAt: '', due: '', askDue: '', messages: [{ key: 'm', subject: 'x', schedule: s }] });
  assert.equal(filled.visit, '2026-11-20'); assert.equal(filled.openAt, '2026-12-01'); assert.equal(filled.dateSources.visit, 'mail');
  const kept = core.applyTenderEmailDates({ visit: '2026-11-25', openAt: '', due: '', askDue: '', messages: [{ key: 'm', subject: 'x', schedule: s }] });
  assert.equal(kept.visit, '2026-11-25', 'a visit date typed by hand before this version stays');
  assert.equal(core.applyTenderEmailDates({ ...filled, visit: '2026-11-22', dateSources: { ...filled.dateSources, visit: 'manual' } }).visit, '2026-11-22');
  assert.deepEqual(core.tenderEmailSchedule('حسب ما هو محدد في منصة اعتماد: زيارة الموقع').visit, [], 'a booklet that points to the platform gives no date');
  assert.deepEqual(core.tenderNeeds({ stage: 'received', owner: '', etimadNo: '', due: '' }), ['owner', 'etimadNo', 'due']);
  assert.deepEqual(core.tenderNeeds({ stage: 'prep', owner: 'a', etimadNo: '1', due: '2026-11-30', value: null, bond: '5%' }), ['value']);
  assert.deepEqual(core.tenderNeeds({ stage: 'submitted', owner: 'a', etimadNo: '1', due: '2026-11-30', value: 5, bond: '5%', submittedOn: '', submitNo: '' }), ['submittedOn', 'submitNo']);
  assert.deepEqual(core.tenderNeeds({ stage: 'declined' }), []);
});

test('firstStart and dailyIntake: the first Start (or Complete) from the activity log; «started after the limit» only where the start is known', () => {
  assert.equal(core.firstStart([{ actionId: 1, createDate: '2026-11-15T06:00:00' }, { actionId: 8, createDate: '2026-11-15T08:30:00.12' }, { actionId: 9, createDate: '2026-11-15T09:00:00' }, { actionId: 10, createDate: '2026-11-15T10:00:00' }, { actionId: 8, createDate: '2026-11-15T07:45:00' }]), '2026-11-15T07:45:00.000Z');
  assert.equal(core.firstStart([{ actionId: 1, createDate: '2026-11-15T06:00:00' }, { actionId: 11, createDate: '2026-11-15T09:00:00' }]), '2026-11-15T09:00:00.000Z', 'closed without Start: it left To-Do on closing');
  assert.equal(core.firstStart([{ actionId: 7, createDate: '2026-11-15T09:00:00' }]), null);
  assert.equal(core.firstStart(null), null);
  const X = (id, c, o = {}) => ({ id, assigneeId: 'A', createdAt: c, state: 'done', bucket: 'done', completedAt: '2026-11-15T15:00:00+03:00', ...o });
  const r = core.dailyIntake([
    X('1', '2026-11-15T10:00:00+03:00', { startedAt: '2026-11-15T10:40:00+03:00' }),
    X('2', '2026-11-15T10:00:00+03:00', { startedAt: '2026-11-15T12:30:00+03:00' }),
    X('3', '2026-11-15T10:00:00+03:00')], { from: '2026-11-15', to: '2026-11-15', asOf: '2026-11-15T16:00:00+03:00' });
  const d = r.days[0];
  assert.deepEqual([d.startKnown, d.startedLate, d.waitMedianH], [2, 1, 1.6], 'task 2 started 2.5 h after arriving (limit 1 h); task 3 has no known start and is not counted');
  assert.deepEqual([r.total.startKnown, r.total.startedLate], [2, 1]);
  const code = decodeURIComponent(core.buildManagerBookmarklet('2026-11-01', '2026-11-15', '2', 'ar'));
  assert.ok(code.includes("getO('Task/GetTask/'+t.id)") && code.includes('const firstStart=function firstStart'), 'the bookmark reads the log with the tested function');
  assert.ok(/t\.bucket==='toDo'\)continue/.test(code), 'a task still in To-Do is not asked about: it has no start');
  assert.doesNotThrow(() => new Function(code.replace(/^javascript:/, '')));
  const ds = core.parseDataset(JSON.stringify({ schema: core.SCHEMA || 'afaqy-crm-tasks/v2', range: { from: '2026-11-01', to: '2026-11-15' }, extractedAt: '2026-11-15T12:00:00Z', people: [{ id: 'A', nameEn: 'a' }],
    tasks: [{ id: '1', title: 'x', assigneeId: 'A', createdAt: '2026-11-15T07:00:00Z', state: 'done', completedAt: '2026-11-15T09:00:00Z', startedAt: '2026-11-15T07:40:00Z', moduleId: 1, bucket: 'done' }] }));
  const one = (ds.dataset || ds).tasks;
  assert.ok(one && one[0] && one[0].startedAt === '2026-11-15T07:40:00.000Z', JSON.stringify(ds).slice(0, 200));
});

test('projectLine and projectDeletePlan: tenders vs upselling from clear signals only; delete-all removes items, hides threads, leaves tender rows', () => {
  assert.deepEqual(core.projectLine({ kind: 'commercial', cat: 'tender' }), { line: 'tender', auto: false }, 'the manager’s choice wins');
  assert.deepEqual(core.projectLine({ fromTender: true }), { line: 'tender', auto: true });
  assert.deepEqual(core.projectLine({ kind: '', kraasa: true }), { line: 'tender', auto: true }, 'a terms booklet means a tender');
  assert.deepEqual(core.projectLine({ kind: 'commercial' }), { line: 'upsell', auto: true });
  assert.deepEqual(core.projectLine({ kind: 'project' }), { line: '', auto: true }, 'no clear signal: not sorted, not guessed');
  const p = core.projectDeletePlan([{ id: 'i:1', item: { id: '1' } }, { id: 'm:a', key: 'a' }, { id: 'm:a', key: 'a' }, { id: 't:9', fromTender: true, tender: '9' }]);
  assert.deepEqual(p, { items: ['1'], keys: ['a'], kept: ['t:9'] });
});

test('tender study file: read strictly, matched by Etimad number then subject, fills only empty fields, lists differences', () => {
  const file = { schema: 'afaqy-tender-study/v1', generatedAt: '2026-11-14T18:00:00Z', tool: 'Tender Analyzer 2.1', tenders: [
    { subject: 'منافسة توريد كاميرات', etimadNo: '2026-123 456', entity: 'جهة', fees: 1500, bond: '2% من قيمة العرض', value: null,
      dates: { askDue: { date: '2026-11-20', time: '' }, visit: { date: '2026-11-22', time: '10:00' }, due: { date: '2026-12-01', time: '14:30' }, openAt: { date: 'غير مذكور' } },
      decision: 'go', decisionWhy: 'ضمن نطاق أفاقي', summary: 'ملخص', studyFile: 'دراسة.pptx', evidence: { fees: { file: 'كراسة.pdf', page: 4, quote: 'قيمة وثائق المنافسة 1500 ريال' }, junk: { file: 'x' } } },
    { subject: '' }, 'nonsense'] };
  const st = core.parseTenderStudy(JSON.stringify(file));
  assert.equal(st.tenders.length, 1); const s0 = st.tenders[0];
  assert.equal(s0.etimadNo, '2026123456'); assert.deepEqual(Object.keys(s0.dates).sort(), ['askDue', 'due', 'visit'], 'a date that is not a date is dropped');
  assert.deepEqual(Object.keys(s0.evidence), ['fees']); assert.equal(s0.value, null);
  assert.deepEqual(core.parseTenderStudy('{"schema":"other"}'), { error: 'schema' }); assert.deepEqual(core.parseTenderStudy('nope'), { error: 'json' });
  const key = (x) => String(x).trim();
  const items = [{ id: 'منافسة توريد كاميرات', subject: 'منافسة توريد كاميرات', etimadNo: '' }, { id: 'أخرى', subject: 'أخرى', etimadNo: '2026123456' }];
  assert.equal(core.matchTenderStudy(items, s0, key).id, 'أخرى', 'the Etimad number wins over the subject');
  assert.equal(core.matchTenderStudy([items[0]], s0, key).id, 'منافسة توريد كاميرات');
  assert.equal(core.matchTenderStudy([items[0], { ...items[0], id: 'x' }], { ...s0, etimadNo: '' }, key), null, 'two rows with that subject: none is chosen');
  const row = { id: 'r', etimadNo: '', fees: null, bond: '5%', value: null, askDue: '', askDueTime: '', visit: '', due: '2026-12-01', dueTime: '', openAt: '', study: '', studySummary: '', dateSources: { due: 'manual' } };
  const { patch, filled, differs } = core.applyTenderStudy(row, s0, '2026-11-14T18:01:00Z');
  assert.deepEqual(filled.sort(), ['askDue', 'dueTime', 'entity', 'etimadNo', 'fees', 'study', 'studySummary', 'visit'].sort(), 'v9.58: the study’s entity fills the empty entity too');
  assert.equal(patch.fees, 1500); assert.ok(!('visitTime' in patch), 'v9.55: the register keeps no hour for the visit, so none is written'); assert.equal(patch.due, undefined, 'a deadline typed by hand stays');
  assert.equal(patch.fieldSources.fees, 'analyzer'); assert.equal(patch.dateSources.askDue, 'analyzer'); assert.equal(patch.dateSources.due, 'manual');
  assert.equal(patch.evidence.fees.page, 4); assert.equal(patch.studyDecision, 'go');
  assert.deepEqual(differs, [{ field: 'bond', have: '5%', study: '2% من قيمة العرض' }]);
  const cleaned = core.cleanTenderDetails({ ...row, ...patch });
  assert.equal(cleaned.fieldSources.fees, 'analyzer'); assert.equal(cleaned.dateSources.visit, 'analyzer'); assert.equal(cleaned.studyDecision, 'go'); assert.equal(cleaned.evidence.fees.quote, 'قيمة وثائق المنافسة 1500 ريال');
});

test('tender auto stage, one-file offer and the study sheet: files move a tender forward only, never back, never reopen', () => {
  const T = '2026-11-15', I = (stage, o = {}) => ({ stage, stageAt: '2026-11-01', decidedOn: '', reason: '', readyOn: '', status: 'open', ...o });
  assert.deepEqual(core.tenderAutoStage(I('received'), { type: 'study', decision: 'go' }, T).patch, { stageAt: T, decidedOn: T, stage: 'prep' });
  const no = core.tenderAutoStage(I('decide', { decidedOn: '2026-11-10' }), { type: 'study', decision: 'no-go', why: 'خارج النطاق' }, T);
  assert.deepEqual(no.patch, { stageAt: T, decidedOn: '2026-11-10', stage: 'declined', reason: 'خارج النطاق' }); assert.equal(no.back.stage, 'decide');
  assert.equal(core.tenderAutoStage(I('received'), { type: 'study', decision: 'no-go', why: ' ' }, T), null, 'declining needs the study’s reason');
  assert.equal(core.tenderAutoStage(I('received'), { type: 'study', decision: 'review' }, T), null);
  assert.equal(core.tenderAutoStage(I('prep'), { type: 'study', decision: 'no-go', why: 'x' }, T), null, 'already preparing: a study does not pull it back');
  assert.equal(core.tenderAutoStage(I('declined'), { type: 'study', decision: 'go' }, T), null, 'a closed tender is not reopened');
  assert.deepEqual(core.tenderAutoStage(I('prep', { decidedOn: '2026-11-05' }), { type: 'offer' }, T).patch, { stageAt: T, decidedOn: '2026-11-05', stage: 'ready', readyOn: T, status: 'ready' });
  assert.equal(core.tenderAutoStage(I('submitted'), { type: 'offer' }, T), null);
  const blob = { size: 5 };
  assert.equal(core.tenderCanAdvance({ files: [{ kind: 'offer', blob }] }, 'ready'), true, 'one offer file is enough');
  assert.equal(core.tenderCanAdvance({ files: [{ kind: 'technical', blob }] }, 'ready'), false);
  assert.equal(core.tenderCanAdvance({ files: [{ kind: 'offer', blob: { size: 0 } }] }, 'ready'), false);
  const rows = [['schema', 'afaqy-tender-study/v1'], ['tool', 'Tender Analyzer 2.1'], ['subject', 'منافسة كاميرات'], ['etimadNo', 123456], ['fees', '1,500', 'كراسة.pdf', 4, 'قيمة الوثائق 1500'],
    ['due', '2026-12-01', 'كراسة.pdf', 9, 'آخر موعد'], ['dueTime', '14:30'], ['visit', new Date('2026-11-21T21:00:00Z')], ['value', ''], ['decision', 'go'], ['decisionWhy', 'ضمن النطاق']];
  const st = core.parseTenderStudy(core.tenderStudyFromSheet(rows, 'الدراسة.xlsx'));
  const s0 = st.tenders[0];
  assert.deepEqual([s0.etimadNo, s0.fees, s0.value, s0.decision, s0.studyFile], ['123456', 1500, null, 'go', 'الدراسة.xlsx']);
  assert.deepEqual(s0.dates, { due: { date: '2026-12-01', time: '14:30' }, visit: { date: '2026-11-22', time: '' } }, 'a spreadsheet date cell is read as its Saudi day');
  assert.equal(s0.evidence.fees.page, 4);
  assert.equal(core.tenderStudyFromSheet([['subject', 'x']]), null, 'a sheet without the schema row is not a study');
});

test('ADR-0128: a closed tender asks for nothing; what is left open is a reminder only', () => {
  assert.deepEqual(core.tenderNeeds({ stage: 'won', owner: '', etimadNo: '', due: '', value: null, submittedOn: '' }), []);
  assert.deepEqual(core.tenderNeeds({ stage: 'lost', owner: '', etimadNo: '' }), []);
  assert.deepEqual(core.tenderNeeds({ stage: 'ready', owner: 'a', etimadNo: '1', due: '2026-12-01', value: null, bond: '' }), ['value', 'bond']);
});

// ---- v9.55: the audit's findings in the tender register ----
test('tender amounts: nothing stays nothing — null and an empty box never become 0; a number written as text is read, words are not', () => {
  for (const v of [null, undefined, '', 'about two million', '12,34', -5, NaN]) assert.equal(core.tenderAmount(v), null, String(v));
  assert.equal(core.tenderAmount(0), 0, 'a real zero is a value');
  assert.equal(core.tenderAmount(1500.456), 1500.46);
  assert.equal(core.tenderAmount('1,500'), 1500); assert.equal(core.tenderAmount('2,450,000.50'), 2450000.5);
  assert.equal(core.tenderAmount('١٥٠٠ ريال'), 1500); assert.equal(core.tenderAmount('SAR 2000'), 2000);
});

test('tender study: the same study read twice changes nothing the second time; a changed decision does', () => {
  const study = core.parseTenderStudy({ schema: 'afaqy-tender-study/v1', tenders: [{ subject: 's', etimadNo: '5', fees: 1500, decision: 'go', decisionWhy: 'in scope', dates: { due: { date: '2026-12-01', time: '14:30' } } }] }).tenders[0];
  const item = { id: 's', subject: 's', etimadNo: '', fees: null, due: '', dueTime: '' };
  const first = core.applyTenderStudy(item, study, '2026-11-14T10:00:00Z');
  assert.deepEqual(first.filled, ['etimadNo', 'fees', 'due']); assert.equal(first.patch.studyDecision, 'go');
  assert.equal(first.patch.dueTime, '14:30');
  const visit = core.applyTenderStudy({ id: 's', subject: 's', visit: '' }, { ...study, dates: { visit: { date: '2026-11-25', time: '10:00' } } });
  assert.equal(visit.patch.visit, '2026-11-25'); assert.ok(!('visitTime' in visit.patch), 'an hour the register does not keep is not written for one session only');
  const second = core.applyTenderStudy({ ...item, ...first.patch }, study, '2026-11-15T10:00:00Z');
  assert.deepEqual(second.patch, {}, 'nothing to save, so no history line and no new stamp');
  assert.deepEqual(second.filled, []); assert.deepEqual(second.differs, []);
  const third = core.applyTenderStudy({ ...item, ...first.patch }, { ...study, decision: 'no-go', why: 'out of scope' }, '2026-11-16T10:00:00Z');
  assert.equal(third.patch.studyDecision, 'no-go'); assert.equal(third.patch.studyAt, '2026-11-16T10:00:00Z');
});

test('tender study: a date written as plain text and an amount written as text are read; what cannot be read is listed, never guessed', () => {
  const r = core.parseTenderStudy({ schema: 'afaqy-tender-study/v1', tenders: [{ subject: 's', fees: '1,500', value: 'تقريبا مليون', bond: 2,
    dates: { due: '2026-12-05 14:30', askDue: '2026-11-20', visit: '05/12/2026', openAt: { date: '2026-12-10' }, }, }] }).tenders[0];
  assert.deepEqual(r.dates, { due: { date: '2026-12-05', time: '14:30' }, askDue: { date: '2026-11-20', time: '' }, openAt: { date: '2026-12-10', time: '' } });
  assert.equal(r.fees, 1500); assert.equal(r.value, null); assert.equal(r.bond, '2');
  assert.deepEqual(r.skipped.sort(), ['value', 'visit'], 'a day-first date and words are reported as left out');
  const clean = core.parseTenderStudy({ schema: 'afaqy-tender-study/v1', tenders: [{ subject: 's', fees: null, value: null, dates: { due: null, visit: { date: null } } }] }).tenders[0];
  assert.deepEqual(clean.skipped, [], '«not found» is not an error');
  const words = core.parseTenderStudy({ schema: 'afaqy-tender-study/v1', tenders: [{ subject: 's', fees: 'غير مذكور', value: 'N/A', dates: { due: 'not stated', visit: { date: 'غير محدد' }, openAt: 'حسب ما هو محدد في منصة اعتماد', askDue: '—' } }] }).tenders[0];
  assert.deepEqual(words.skipped, [], '«not found» in words fills nothing and is not reported'); assert.deepEqual(words.dates, {}); assert.equal(words.fees, null);
  assert.equal(core.parseTenderStudy({ schema: 'afaqy-tender-study/v1', tenders: [{ subject: 's', dates: { due: '2026-02-30' } }] }).tenders[0].skipped[0], 'due', 'a day that does not exist');
  // the workbook form goes through the same reader
  const sheet = core.tenderStudyFromSheet([['schema', 'afaqy-tender-study/v1'], ['subject', 's'], ['fees', '1,500 ريال'], ['value', 'see BOQ'], ['due', '2026-12-05 14:30'], ['askDue', new Date('2026-11-19T21:00:00Z')], ['visit', '2026-12-01'], ['visitTime', '10:00']]);
  const fromSheet = core.parseTenderStudy(sheet).tenders[0];
  assert.equal(fromSheet.fees, 1500); assert.deepEqual(fromSheet.skipped, ['value']);
  assert.deepEqual(fromSheet.dates, { due: { date: '2026-12-05', time: '14:30' }, askDue: { date: '2026-11-20', time: '' }, visit: { date: '2026-12-01', time: '10:00' } });
});

test('tender dates: the patch that saves what was read carries every date field — the site visit and the bid opening too', () => {
  const file = { id: 'f', name: 'terms.txt', analysis: { schedule: { due: [{ date: '2026-11-30', time: '10:00' }], askDue: [], visit: [{ date: '2026-11-20', time: '' }], openAt: [{ date: '2026-12-01', time: '' }] } } };
  const dated = core.applyTenderEmailDates({ due: '', askDue: '', visit: '', openAt: '', files: [file] });
  const patch = core.tenderDatePatch(dated);
  assert.equal(patch.visit, '2026-11-20'); assert.equal(patch.openAt, '2026-12-01'); assert.equal(patch.due, '2026-11-30'); assert.equal(patch.dueTime, '10:00');
  assert.equal(patch.askDue, ''); assert.equal(patch.askDueTime, '');
  assert.deepEqual(patch.dateSources, { due: 'document', visit: 'document', openAt: 'document' });
  // the file is removed: what it filled is emptied again, in the same patch
  const gone = core.tenderDatePatch(core.applyTenderEmailDates({ ...dated, files: [] }));
  assert.deepEqual([gone.visit, gone.openAt, gone.due, gone.dueTime], ['', '', '', '']); assert.deepEqual(gone.dateSources, {});
});

test('backup reminder: nothing to lose asks nothing; never saved, or a week old, asks; a fresh one does not', () => {
  const now = '2026-11-14T20:00:00Z';
  assert.deepEqual(core.backupDue('', now, { items: 0 }), { due: false, days: null }, 'an empty register is not nagged');
  assert.deepEqual(core.backupDue('', now, { items: 3 }), { due: true, days: null }, 'never saved');
  assert.deepEqual(core.backupDue('not a date', now, { items: 3 }), { due: true, days: null });
  assert.deepEqual(core.backupDue('2026-11-10T09:00:00Z', now, { items: 3 }), { due: false, days: 4 });
  assert.deepEqual(core.backupDue('2026-11-07T20:00:00Z', now, { items: 3 }), { due: true, days: 7 });
  assert.deepEqual(core.backupDue('2026-10-01T00:00:00Z', now, { items: 1 }), { due: true, days: 44 });
  assert.deepEqual(core.backupDue('2026-11-20T00:00:00Z', now, { items: 1 }), { due: false, days: 0 }, 'a clock set wrong never shows a negative age');
  assert.equal(core.backupDue('2026-11-12T20:00:00Z', now, { items: 1, every: 2 }).due, true);
});

// ---------- v9.57 (ADR-0130): the tender's correspondence, read from the mail thread ----------
// Invented people and wording only — no real mailbox content belongs in this repository.
const THREAD_BODY = [
  'Sending date of the tender: 12/11/2026', '', 'Rami Qasim', 'Bids Officer', 'Sample Company', '+966 50 000 0001', 'www.example.com <https://www.example.com/>', '',
  'From: Lina Harb <lina.harb@example.com> ',
  'Sent: Tuesday, November 17, 2026 11:15 AM',
  'To: Tala Nasser <tala.nasser@example.com>',
  'Cc: Rami Qasim <r.qasim@example.com>',
  'Subject: RE: sample: supply of level sensors',
  '', 'Please add the date the tender was first sent to the branch,', 'so the whole picture can be reviewed.', '', 'Lina Harb', 'Branch Manager', '+966-50-0000-002', '',
  '________________________________', '',
  'From: Rami Qasim <r.qasim@example.com <mailto:r.qasim@example.com> >',
  'Date: Tuesday, 17 November 2026 at 10:02 AM',
  'To: Zaid Fares <zaid.fares@example.com <mailto:zaid.fares@example.com> >',
  'Subject: RE: sample: supply of level sensors',
  '', ' ', '', 'Rami Qasim', 'Bids Officer', '',
  'From: Zaid Fares <zaid.fares@example.com <mailto:zaid.fares@example.com> >',
  'Sent: Tuesday, November 17, 2026 9:43 AM',
  'To: Rami Qasim <r.qasim@example.com>',
  'Subject: RE: sample: supply of level sensors',
  '', 'Dear Rami,', 'The offer files are attached for review.', 'Offer deck.pptx <https://files.example.com/s/secret-token-123>', '', 'Best regards,', 'Eng. Zaid Fares', 'Technical Manager', 'M: +966500000003', '',
  'من: Rami Qasim <r.qasim@example.com>',
  'تاريخ الإرسال: الخميس، ١٢ نوفمبر ٢٠٢٦ ١١:٠٣ ص',
  'إلى: Lina Harb',
  'الموضوع: sample: supply of level sensors',
  '', 'الزملاء الأعزاء،', 'مرفق كراسة المنافسة، والموعد النهائي للتقديم يوم الثلاثاء.', '', 'مع أطيب التحيات،', 'Rami Qasim',
].join('\r\n');

test('mail thread: a date written by the mail program is read as written — and an ambiguous one is not guessed', () => {
  assert.equal(core.mailWhen('Tuesday, November 17, 2026 11:15 AM'), '2026-11-17T11:15');
  assert.equal(core.mailWhen('Tuesday, 17 November 2026 at 10:02 PM'), '2026-11-17T22:02');
  assert.equal(core.mailWhen('Tue, Nov 17, 2026 at 12:05 AM'), '2026-11-17T00:05');
  assert.equal(core.mailWhen('الخميس، ١٢ نوفمبر ٢٠٢٦ ١١:٠٣ ص'), '2026-11-12T11:03');
  assert.equal(core.mailWhen('12 أكتوبر 2026 3:04 م'), '2026-10-12T15:04');
  assert.equal(core.mailWhen('2026-11-16 15:04'), '2026-11-16T15:04');
  assert.equal(core.mailWhen('17/11/2026 09:43'), '2026-11-17T09:43', 'the day is above 12: only one reading');
  assert.equal(core.mailWhen('11/17/2026 9:43 AM'), '2026-11-17T09:43');
  assert.equal(core.mailWhen('03/04/2026 10:00'), '', 'March the 4th or April the 3rd: nothing is guessed');
  assert.equal(core.mailWhen('17 November 2026'), '2026-11-17', 'a day without a time stays a day');
  assert.equal(core.mailWhen('31 February 2026 10:00'), '', 'a day that does not exist');
  assert.equal(core.mailWhen('soon'), '');
  assert.equal(core.mailWall('2026-11-17T08:31:01.000Z'), '2026-11-17T11:31', 'an instant becomes the Saudi wall clock');
  assert.equal(core.mailWall('2026-11-17T22:31:00Z'), '2026-11-18T01:31');
  assert.equal(core.mailWall(''), ''); assert.equal(core.mailWall('nonsense'), '');
});

test('mail thread: a reply is split into its messages, oldest first — writer, time, and the words without the signature', () => {
  const th = core.mailThread(THREAD_BODY, { at: '2026-11-17T11:31', name: 'Rami Qasim', addr: 'r.qasim@example.com' });
  assert.deepEqual(th.map((e) => e.at), ['2026-11-12T11:03', '2026-11-17T09:43', '2026-11-17T10:02', '2026-11-17T11:15', '2026-11-17T11:31']);
  assert.deepEqual(th.map((e) => e.name), ['Rami Qasim', 'Zaid Fares', 'Rami Qasim', 'Lina Harb', 'Rami Qasim']);
  assert.deepEqual(th.map((e) => e.addr), ['r.qasim@example.com', 'zaid.fares@example.com', 'r.qasim@example.com', 'lina.harb@example.com', 'r.qasim@example.com']);
  assert.equal(th[0].text, 'الزملاء الأعزاء،\nمرفق كراسة المنافسة، والموعد النهائي للتقديم يوم الثلاثاء.', 'Arabic headers are read, the closing and the name are cut');
  assert.equal(th[1].text, 'Dear Rami,\nThe offer files are attached for review.\nOffer deck.pptx', 'the link is dropped with its token; the signature and the phone are cut');
  assert.equal(th[2].text, '', 'a message that is only a picture or a signature has no words — none are invented');
  assert.equal(th[3].text, 'Please add the date the tender was first sent to the branch,\nso the whole picture can be reviewed.');
  assert.equal(th[4].text, 'Sending date of the tender: 12/11/2026');
  assert(!JSON.stringify(th).includes('secret-token'), 'a sharing link is never kept');
  assert(!JSON.stringify(th).includes('+966'), 'a phone number is never kept');
  // a body with no quoted message is one entry; an empty body with a known writer is still one (the mail exists)
  assert.deepEqual(core.mailThread('Only this.', { at: '2026-11-01T08:00', name: 'Tala Nasser', addr: '' }), [{ at: '2026-11-01T08:00', name: 'Tala Nasser', addr: '', text: 'Only this.' }]);
  assert.equal(core.mailThread('', { at: '2026-11-01T08:00', name: '', addr: 'x@example.com' }).length, 1);
  assert.deepEqual(core.mailThread('', {}), [], 'nothing known, nothing written');
  // a line that merely begins with «From:» is not a message without its date line
  assert.equal(core.mailThread('From: the supplier we received two prices\nand both are high.', { at: '2026-11-01T08:00', name: 'A B', addr: '' }).length, 1);
  // the «On … wrote:» form, with quoted lines
  const g = core.mailThread('Agreed.\n\nOn Mon, Nov 16, 2026 at 3:04 PM Rami Qasim <r.qasim@example.com> wrote:\n> Reminder: the deadline is tomorrow at 10:00.\n> Please send the offer.', { at: '2026-11-16T15:30', name: 'Zaid Fares', addr: 'zaid.fares@example.com' });
  assert.deepEqual(g.map((e) => [e.at, e.name, e.text]), [['2026-11-16T15:04', 'Rami Qasim', 'Reminder: the deadline is tomorrow at 10:00.\nPlease send the offer.'], ['2026-11-16T15:30', 'Zaid Fares', 'Agreed.']]);
  // a header whose date cannot be read keeps its place and says nothing about the time
  const u = core.mailThread('Second.\n\nFrom: Tala Nasser\nSent: 03/04/2026 10:00\nSubject: x\n\nFirst.', { at: '2026-04-05T09:00', name: 'Zaid Fares', addr: '' });
  assert.deepEqual(u.map((e) => [e.at, e.name, e.text]), [['', 'Tala Nasser', 'First.'], ['2026-04-05T09:00', 'Zaid Fares', 'Second.']]);
});

test('mail thread: the one-line summary is the writer’s own words, after the greeting', () => {
  assert.equal(core.mailGist('Dear Rami,\nThe offer files are attached for review.\nOffer deck.pptx'), 'The offer files are attached for review. · Offer deck.pptx');
  assert.equal(core.mailGist('الزملاء الأعزاء،\nمرفق كراسة المنافسة، والموعد النهائي للتقديم يوم الثلاثاء.'), 'مرفق كراسة المنافسة، والموعد النهائي للتقديم يوم الثلاثاء.');
  assert.equal(core.mailGist('السلام عليكم / أستاذ سالم\nيرجى شراء الكراسة.'), 'يرجى شراء الكراسة.');
  assert.equal(core.mailGist('Dear all,'), 'Dear all,', 'a message that is only a greeting keeps it rather than showing nothing');
  assert.equal(core.mailGist(''), '');
  const long = core.mailGist('word '.repeat(100), 40);
  assert(long.length <= 41 && long.endsWith('…') && !long.includes('  '), long);
});

test('mail thread: the same message arriving again in a later reply is one entry — the mark and the fuller text are kept', () => {
  const first = core.mailThread(THREAD_BODY, { at: '2026-11-17T11:31', name: 'Rami Qasim', addr: 'r.qasim@example.com' });
  const marked = first.map((e) => (e.at === '2026-11-17T09:43' ? { ...e, mark: 'handover' } : e));
  // a later reply quotes the same thread: one name comes without its address, one time is a minute off, one text is shorter
  const later = [{ at: '2026-11-17T09:43', name: 'Zaid Fares', addr: '', text: 'Dear Rami,' }, { at: '2026-11-17T11:32', name: 'Rami Qasim', addr: '', text: 'Sending date of the tender: 12/11/2026' },
    { at: '2026-11-17T12:40', name: 'Zaid Fares', addr: 'zaid.fares@example.com', text: 'The branch explanation is attached.' }];
  const merged = core.tenderThreadMerge(marked, later);
  assert.equal(merged.length, 6, 'only the one new message was added');
  assert.deepEqual(merged.map((e) => e.at), ['2026-11-12T11:03', '2026-11-17T09:43', '2026-11-17T10:02', '2026-11-17T11:15', '2026-11-17T11:31', '2026-11-17T12:40']);
  const h = merged.find((e) => e.at === '2026-11-17T09:43');
  assert.equal(h.mark, 'handover'); assert.equal(h.addr, 'zaid.fares@example.com'); assert(h.text.includes('attached for review'), 'the fuller text wins');
  assert.equal(core.tenderThreadMerge(merged, merged).length, 6, 'merging twice changes nothing');
  // two different people in the same minute are two messages
  assert.equal(core.tenderThreadMerge([{ at: '2026-11-17T09:43', name: 'Zaid Fares', addr: '', text: 'a' }], [{ at: '2026-11-17T09:43', name: 'Lina Harb', addr: '', text: 'b' }]).length, 2);
  // an entry with no readable time is matched by writer and words, and stays after the dated ones
  const und = core.tenderThreadMerge([{ at: '', name: 'Tala Nasser', addr: '', text: 'First.' }], [{ at: '', name: 'Tala Nasser', addr: '', text: 'First.' }, { at: '2026-01-01T08:00', name: 'A B', addr: '', text: 'x' }]);
  assert.deepEqual(und.map((e) => e.at), ['2026-01-01T08:00', '']);
});

test('mail thread: full working days between two dates — Sunday to Thursday, the two ends not counted', () => {
  assert.equal(core.workDaysBetween('2026-11-12', '2026-11-17'), 2, 'Thursday to Tuesday: Sunday and Monday');
  assert.equal(core.workDaysBetween('2026-11-12', '2026-11-15'), 0, 'Thursday to Sunday: a weekend only');
  assert.equal(core.workDaysBetween('2026-11-15', '2026-11-29'), 9);
  assert.equal(core.workDaysBetween('2026-11-17', '2026-11-17'), 0);
  assert.equal(core.workDaysBetween('2026-11-17', '2026-11-12'), null, 'a deadline before the first message is not a duration');
  assert.equal(core.workDaysBetween('', '2026-11-17'), null); assert.equal(core.workDaysBetween('2026-11-12', ''), null);
});

test('mail thread: the facts of a tender’s correspondence — first and last message, the deadline, the hand-over and its margin', () => {
  const thread = core.mailThread(THREAD_BODY, { at: '2026-11-17T11:31', name: 'Rami Qasim', addr: 'r.qasim@example.com' });
  const item = { due: '2026-11-17', dueTime: '10:00', thread };
  const f = core.tenderThreadFacts(item);
  assert.equal(f.n, 5); assert.equal(f.people, 3);
  assert.equal(f.first.at, '2026-11-12T11:03'); assert.equal(f.last.at, '2026-11-17T11:31');
  assert.equal(f.dueAt, '2026-11-17T10:00'); assert.equal(f.workDays, 2);
  assert.equal(f.handover, null); assert.equal(f.leadMin, null, 'no message was marked: no margin is worked out');
  const marked = { ...item, thread: thread.map((e) => (e.at === '2026-11-17T09:43' ? { ...e, mark: 'handover' } : e)) };
  const m = core.tenderThreadFacts(marked);
  assert.equal(m.handover.at, '2026-11-17T09:43'); assert.equal(m.leadMin, 17, 'seventeen minutes before the deadline');
  const late = core.tenderThreadFacts({ ...item, thread: thread.map((e) => (e.at === '2026-11-17T11:15' ? { ...e, mark: 'handover' } : e)) });
  assert.equal(late.leadMin, -75, 'after the deadline the margin is negative');
  // a deadline without its time gives the days but no margin; no deadline gives neither; no thread gives zeros and nulls
  const noTime = core.tenderThreadFacts({ ...marked, dueTime: '' }); assert.equal(noTime.dueAt, '2026-11-17'); assert.equal(noTime.workDays, 2); assert.equal(noTime.leadMin, null);
  const noDue = core.tenderThreadFacts({ thread: marked.thread }); assert.equal(noDue.dueAt, ''); assert.equal(noDue.workDays, null); assert.equal(noDue.leadMin, null);
  assert.deepEqual(core.tenderThreadFacts({}), { n: 0, people: 0, first: null, last: null, dueAt: '', workDays: null, handover: null, leadMin: null });
});

test('mail thread: what is saved on the tender is cleaned, survives a merge between two devices, and nothing else is dropped', () => {
  const thread = core.mailThread(THREAD_BODY, { at: '2026-11-17T11:31', name: 'Rami Qasim', addr: 'r.qasim@example.com' });
  const dirty = [...thread, { at: 'yesterday', name: 'X'.repeat(200), addr: 5, text: 'y'.repeat(5000), mark: 'other' }, null, { at: '2026-11-17T09:43' }];
  const clean = core.cleanTenderDetails({ dateSource: 'thread', thread: dirty, activity: [{ id: 'a1', action: 'thread', at: '2026-11-17T10:00:00Z', label: '5' }] });
  assert.equal(clean.dateSource, 'thread', 'a date taken from the oldest message keeps its source');
  assert.equal(clean.thread.length, 6, 'the entry with nothing in it is dropped');
  assert.deepEqual(clean.thread.slice(0, 5), thread);
  assert.deepEqual(clean.thread[5], { at: '', name: 'X'.repeat(80), addr: '', text: 'y'.repeat(1500) });
  assert.equal(clean.activity.length, 1, 'the history line of a thread reading is kept');
  assert.deepEqual(core.cleanTenderDetails({}).thread, []);
  const a = { thread: thread.slice(0, 3).map((e, k) => (k === 1 ? { ...e, mark: 'handover' } : e)) }, b = { thread: thread.slice(2) };
  const both = core.mergeTenderDetails(a, b).thread;
  assert.equal(both.length, 5); assert.equal(both[1].mark, 'handover');
});

// ---------- v9.58 (ADR-0131): following a tender from arrival to result ----------
test('tender follow-up: the hand-over to the tenders team is two working days before the deadline, at the same hour', () => {
  assert.equal(core.TENDER_HANDOVER_DAYS, 2);
  assert.equal(core.tenderHandoverDue({ due: '2026-11-17', dueTime: '10:00' }), '2026-11-15T10:00', 'Tuesday: Monday and Sunday are the two days');
  assert.equal(core.tenderHandoverDue({ due: '2026-11-22', dueTime: '' }), '2026-11-18', 'Sunday: Thursday and Wednesday — the weekend is skipped; no hour, the day alone');
  assert.equal(core.tenderHandoverDue({ due: '2026-11-19', dueTime: '13:30' }), '2026-11-17T13:30');
  assert.equal(core.tenderHandoverDue({ due: '' }), '', 'no deadline, no hand-over date');
  assert.equal(core.tenderHandoverDue({}), '');
});

test('tender follow-up: when the offer was handed over — the message the manager marked, else the day it was ready; never guessed', () => {
  assert.equal(core.tenderHandedAt({ thread: [{ at: '2026-11-17T09:43', mark: 'handover' }], readyOn: '2026-11-16' }), '2026-11-17T09:43', 'the marked message wins');
  assert.equal(core.tenderHandedAt({ readyOn: '2026-11-16' }), '2026-11-16');
  assert.equal(core.tenderHandedAt({ thread: [{ at: '2026-11-17T09:43' }] }), '', 'an unmarked message is not a hand-over');
  // on time: by the hour when both carry one, by the day otherwise
  assert.equal(core.tenderHandoverOnTime({ due: '2026-11-17', dueTime: '10:00', thread: [{ at: '2026-11-17T09:43', mark: 'handover' }] }), false);
  assert.equal(core.tenderHandoverOnTime({ due: '2026-11-17', dueTime: '10:00', thread: [{ at: '2026-11-15T09:59', mark: 'handover' }] }), true);
  assert.equal(core.tenderHandoverOnTime({ due: '2026-11-17', dueTime: '10:00', readyOn: '2026-11-15' }), true, 'a day against an hour compares the days');
  assert.equal(core.tenderHandoverOnTime({ due: '2026-11-17', readyOn: '2026-11-16' }), false);
  assert.equal(core.tenderHandoverOnTime({ due: '2026-11-17' }), null, 'nothing handed over yet: unknown, not late');
  assert.equal(core.tenderHandoverOnTime({ readyOn: '2026-11-16' }), null, 'no deadline: unknown');
});

test('tender follow-up: the time a tender had — full working days from arrival to the deadline, and whether that is short', () => {
  assert.deepEqual(core.tenderLead({ date: '2026-11-12', due: '2026-11-17' }), { workDays: 2, short: true, handoverBeforeArrival: false });
  assert.deepEqual(core.tenderLead({ date: '2026-11-01', due: '2026-11-19' }), { workDays: 13, short: false, handoverBeforeArrival: false });
  assert.deepEqual(core.tenderLead({ date: '2026-11-16', due: '2026-11-17' }), { workDays: 0, short: true, handoverBeforeArrival: true }, 'the hand-over day was before the tender arrived');
  assert.deepEqual(core.tenderLead({ date: '2026-11-12' }), { workDays: null, short: false, handoverBeforeArrival: false }, 'no deadline: nothing is claimed');
});

test('tender follow-up: minutes left to a moment on the Saudi wall clock; a day alone ends at its last minute', () => {
  assert.equal(core.minutesUntil('2026-11-17T10:00', '2026-11-16T15:00'), 1140);
  assert.equal(core.minutesUntil('2026-11-15T10:00', '2026-11-16T15:10'), -1750);
  assert.equal(core.minutesUntil('2026-11-17', '2026-11-17T23:00'), 59);
  assert.equal(core.minutesUntil('', '2026-11-17T23:00'), null);
});

test('tender follow-up: the fields a stage shows — few at arrival, more as it moves, and never one that holds a value', () => {
  const arrived = core.tenderShownFields({ stage: 'received' });
  assert.deepEqual(arrived, ['date', 'owner', 'etimadNo', 'entity', 'site', 'fees', 'bond', 'askDue', 'askDueTime', 'visit', 'due', 'dueTime', 'note'], 'the booklet’s own facts, in the window’s order');
  const prep = core.tenderShownFields({ stage: 'prep' });
  for (const k of ['value', 'bond', 'decidedOn', 'openAt', 'study']) assert(prep.includes(k), k);
  assert(!prep.includes('submittedOn') && !prep.includes('reason'));
  const sub = core.tenderShownFields({ stage: 'submitted' }); for (const k of ['readyOn', 'submittedOn', 'submitNo']) assert(sub.includes(k), k);
  for (const st of ['declined', 'lost', 'missed', 'cancelled']) assert(core.tenderShownFields({ stage: st }).includes('reason'), st);
  const kept = core.tenderShownFields({ stage: 'received', submitNo: 'X-1', reason: '', value: 0 });
  assert(kept.includes('submitNo'), 'a value typed earlier is never hidden'); assert(kept.includes('value'), 'zero is a value'); assert(!kept.includes('reason'), 'empty is not');
});

test('tender follow-up: «missed the deadline» is a closed outcome that asks for nothing more', () => {
  assert.deepEqual(core.tenderNeeds({ stage: 'missed' }), []);
  assert.deepEqual(core.tenderNeeds({ stage: 'prep' }), ['owner', 'etimadNo', 'due', 'value', 'bond']);
});

test('tender follow-up: the inquiries log is cleaned, kept between devices, and an answered copy wins', () => {
  const raw = [{ id: 'q1', text: '  Where is the station?  ', askedOn: '2026-11-15', answeredOn: '', answer: '' }, { id: 'q2', text: '', askedOn: '2026-11-15' }, null,
    { id: 'q3', text: 'x'.repeat(900), askedOn: 'soon', answeredOn: '2026-11-16', answer: 'y'.repeat(2000) }];
  const c = core.cleanTenderDetails({ inquiries: raw }).inquiries;
  assert.deepEqual(c.map((q) => q.id), ['q1', 'q3'], 'an inquiry without words is dropped');
  assert.deepEqual(c[0], { id: 'q1', text: 'Where is the station?', askedOn: '2026-11-15', answeredOn: '', answer: '' });
  assert.equal(c[1].text.length, 600); assert.equal(c[1].askedOn, ''); assert.equal(c[1].answer.length, 1500);
  const mine = { inquiries: [{ id: 'q1', text: 'Where?', askedOn: '2026-11-15', answeredOn: '', answer: '' }] };
  const theirs = { inquiries: [{ id: 'q1', text: 'Where?', askedOn: '2026-11-15', answeredOn: '2026-11-16', answer: 'Gate 3' }, { id: 'q9', text: 'Hours?', askedOn: '', answeredOn: '', answer: '' }] };
  const m = core.mergeTenderDetails(mine, theirs).inquiries;
  assert.equal(m.length, 2); assert.equal(m.find((q) => q.id === 'q1').answer, 'Gate 3', 'the answered copy is kept whichever side it came from');
  assert.equal(core.mergeTenderDetails(theirs, mine).inquiries.find((q) => q.id === 'q1').answer, 'Gate 3');
});

test('tender follow-up: the year report — counts, values, time given, hand-overs, reasons, months and entities, from that year only', () => {
  const T = (o) => ({ subject: o.id, stage: 'received', ...o });
  const items = [
    T({ id: 'a', date: '2026-01-10', stage: 'won', value: 100000, due: '2026-01-25', readyOn: '2026-01-20', entity: 'Entity A' }),
    T({ id: 'b', date: '2026-01-20', stage: 'lost', value: 50000, reason: 'price', due: '2026-02-05', readyOn: '2026-02-04', entity: 'Entity A' }),
    T({ id: 'c', date: '2026-02-03', stage: 'declined', reason: 'out of scope', due: '2026-02-20', entity: 'Entity B' }),
    T({ id: 'd', date: '2026-11-12', stage: 'missed', reason: 'three working days', due: '2026-11-17', dueTime: '10:00', value: 276000, thread: [{ at: '2026-11-17T09:43', mark: 'handover' }] }),
    T({ id: 'e', date: '2026-11-14', stage: 'prep', due: '2026-12-01', value: null }),
    T({ id: 'f', date: '2026-11-15', stage: 'submitted', due: '2026-11-30', value: 20000, readyOn: '2026-11-25', entity: 'Entity B' }),
    T({ id: 'old', date: '2025-12-30', stage: 'won', value: 999999 }),
  ];
  const r = core.tenderYearReport(items, '2026');
  assert.equal(r.n, 6, 'only the tenders that arrived in 2026');
  assert.deepEqual([r.joined, r.submitted, r.won, r.lost, r.missed, r.declined, r.cancelled, r.open], [5, 3, 1, 1, 1, 1, 0, 2]);
  assert.equal(r.winRate, 50);
  assert.deepEqual(r.value, { all: 446000, submitted: 170000, won: 100000, known: 4 });
  assert.equal(r.lead.known, 6); assert.equal(r.lead.short, 1, 'one tender had fewer than five full working days');
  assert.equal(r.lead.avgWorkDays, 9.5, '(10 + 11 + 12 + 2 + 12 + 10) / 6');
  assert.deepEqual(r.handover, { known: 4, onTime: 2 }, 'a and f on time; b a day late; d 17 minutes before the deadline, not two working days');
  assert.deepEqual(r.reasons.missed, [{ subject: 'd', reason: 'three working days' }]); assert.deepEqual(r.reasons.lost, [{ subject: 'b', reason: 'price' }]); assert.deepEqual(r.reasons.declined, [{ subject: 'c', reason: 'out of scope' }]);
  assert.deepEqual(r.months, [{ month: '2026-01', n: 2, joined: 2, submitted: 2, won: 1, missed: 0 }, { month: '2026-02', n: 1, joined: 0, submitted: 0, won: 0, missed: 0 }, { month: '2026-11', n: 3, joined: 3, submitted: 1, won: 0, missed: 1 }]);
  assert.deepEqual(r.entities, [{ entity: 'Entity A', n: 2, submitted: 2, won: 1 }, { entity: 'Entity B', n: 2, submitted: 1, won: 0 }, { entity: '', n: 2, submitted: 0, won: 0 }], 'most first; «not recorded» last');
  assert.deepEqual(r.rows.map((x) => x.id), ['a', 'b', 'c', 'd', 'e', 'f']);
  const none = core.tenderYearReport(items, '2024');
  assert.equal(none.n, 0); assert.equal(none.winRate, null); assert.equal(none.lead.avgWorkDays, null); assert.deepEqual(none.months, []);
});

test('tender follow-up: the analyzer’s study fills the entity when it is empty, and never writes over one typed by hand', () => {
  const st = core.parseTenderStudy({ schema: 'afaqy-tender-study/v1', tenders: [{ subject: 'x', entity: '  Entity A ', dates: {} }] }).tenders[0];
  assert.equal(core.applyTenderStudy({ entity: '' }, st).patch.entity, 'Entity A');
  assert.equal(core.applyTenderStudy({ entity: 'Typed' }, st).patch.entity, undefined);
});

// ---------- v9.60 (ADR-0132): Etimad radar and the Hijri check ----------
test('v9.60: a booklet date written in Hijri is converted by the register itself — Umm al-Qura, the calendar Etimad uses', () => {
  assert.equal(core.hijriToGregorian(1448, 6, 5), '2026-11-15');
  assert.equal(core.hijriToGregorian(1448, 6, 16), '2026-11-26');
  assert.equal(core.hijriToGregorian(1448, 6, 20), '2026-11-30');
  assert.equal(core.hijriToGregorian(1448, 13, 1), '', 'no thirteenth month');
  assert.deepEqual(core.hijriInQuote('وقت التسليم 16ص 09:30 1448/06/'), [{ hijri: '1448-06-16', date: '2026-11-26' }], 'text pulled out of a right-to-left PDF, out of order, clock time set aside');
  assert.deepEqual(core.hijriInQuote('١٤٤٨/٠٦/١٦'), [{ hijri: '1448-06-16', date: '2026-11-26' }], 'Arabic-Indic digits');
  assert.deepEqual(core.hijriInQuote('آخر موعد 2026-11-30'), [], 'no Hijri year: nothing to check');
  assert.equal(core.hijriInQuote('1448/05/06').length, 2, 'day and month both under 13: two readings');
  assert.deepEqual(core.hijriCheck('2026-11-26', '16/06/1448'), { ok: true });
  assert.deepEqual(core.hijriCheck('2026-11-19', 'وقت التسليم 16ص 09:30 1448/06/'), { ok: false, hijri: '1448-06-16', date: '2026-11-26' });
});

test('v9.60: a study whose Hijri date was converted wrongly is corrected from its own quote; two readings and neither matches — the date is left out', () => {
  const st = (due, quote) => core.parseTenderStudy({ schema: 'afaqy-tender-study/v1', tenders: [{ subject: 'WM - dash cam', dates: { due: { date: due, time: '' } }, evidence: { due: { file: 'booklet.pdf', page: 4, quote } } }] }).tenders[0];
  const a = st('2026-11-19', 'وقت التسليم 16ص 09:30 1448/06/');
  assert.equal(a.dates.due.date, '2026-11-26', 'the study wrote 19 Nov for 16/06/1448; it is 26 Nov');
  assert.deepEqual(a.fixed, [{ field: 'due', was: '2026-11-19', hijri: '1448-06-16', now: '2026-11-26' }]);
  const b = st('2026-11-26', '16/06/1448'); assert.equal(b.dates.due.date, '2026-11-26'); assert.deepEqual(b.fixed, []);
  const c = st('2026-12-01', '1448/05/06'); assert.equal(c.dates.due, undefined); assert.deepEqual(c.skipped, ['due']);
  const d = st('2026-12-01', 'آخر موعد لتقديم العروض'); assert.equal(d.dates.due.date, '2026-12-01', 'no Hijri date in the quote: taken as written');
});

test('v9.60: Etimad times are read as the Saudi wall clock, whatever the browser’s time zone', () => {
  const serial = (y, mo, d, h, mi) => (Date.UTC(y, mo - 1, d, h, mi) - Date.UTC(1899, 11, 30)) / 864e5;
  assert.deepEqual(core.etimadWhen(serial(2026, 11, 30, 9, 59) - 1e-9), { date: '2026-11-30', time: '09:59' }, 'Excel keeps 09:58:59.999 — read as 09:59');
  assert.deepEqual(core.etimadWhen(serial(2026, 11, 15, 0, 0)), { date: '2026-11-15', time: '' }, 'midnight on Etimad means no hour');
  assert.deepEqual(core.etimadWhen('2026-12-15 09:59:00'), { date: '2026-12-15', time: '09:59' });
  assert.deepEqual(core.etimadWhen('٢٠٢٦-١٢-١٥'), { date: '2026-12-15', time: '' });
  assert.deepEqual(core.etimadWhen('05/12/2026'), { date: '', time: '' }, 'a day-first date is not guessed');
  assert.deepEqual(core.etimadWhen(null), { date: '', time: '' });
});

test('v9.60: AFAQY’s scope and the Western Region are read from the title, the activity, the entity and the place', () => {
  assert.equal(core.etimadInScope('توريد وتركيب كاميرات مراقبة أمنية'), true);
  assert.equal(core.etimadInScope('WM - توريد وتركيب داش كام', 'تجارة الكماليات'), true);
  assert.equal(core.etimadInScope('مشروع توريد تركيب حساسات لقياس مستوى الوقود'), true);
  assert.equal(core.etimadInScope('تجديد رخص نظام الموارد المؤسسية', 'تقنية المعلومات'), true, 'Etimad’s IT activity');
  assert.equal(core.etimadInScope('تجديد اشتراك نظام إدارة أداء التطبيقات'), true, '«التطبيقات» holds the letters of «طبي» and is not a medical tender');
  assert.equal(core.etimadInScope('قطع غيار لنظام كاميرات'), false, 'a clear «out» word wins');
  assert.equal(core.etimadInScope('توريد أدوية', 'الأنشطة الطبية'), false);
  assert.equal(core.etimadInScope('أعمال نظافة المباني'), false);
  assert.equal(core.etimadWest('مستشفى الامير محمد بن عبدالعزيز بالمدينة المنورة'), true);
  assert.equal(core.etimadWest('أمانة محافظة جدة'), true);
  assert.equal(core.etimadWest('أمانة منطقة الرياض', ''), false);
  assert.equal(core.etimadIsUs('شركة أفاقي لتقنية المعلومات'), true); assert.equal(core.etimadIsUs('مؤسسة آفاق ساهر للمقاولات'), false, 'another company with a similar word');
});

const radarSheets = () => {
  const H = ['الرقم المرجعي', 'اسم المنافسة', 'الجهة الحكومية', 'حالة المنافسة', 'نوع المنافسة', 'النشاط الرئيسي', 'تاريخ النشر', 'آخر موعد استفسارات', 'آخر موعد تقديم', 'موعد فتح العروض', 'سعر الكراسة ر.س', 'رقم المنافسة', 'مكان التنفيذ', 'رابط اعتماد', 'أول رصد', 'تاريخ بدء الأعمال'];
  const s = { 'جميع المنافسات': [H,
    ['261139004629', 'WM - توريد وتركيب داش كام', 'مستشفى تجريبي بالمدينة المنورة', 'نشطة', 'شراء مباشر', 'تجارة الكماليات', '2026-11-15 00:00:00', '2026-11-25 00:00:00', '2026-11-30 09:59:00', '', 200, '126526 / 130720', '', 'https://tenders.etimad.sa/Tender/DetailsForVisitor?STenderId=abc', '2026-11-15 12:00:00', ''],
    ['261139000001', 'توريد أدوية', 'تجمع صحي تجريبي', 'نشطة', 'شراء مباشر', 'الأنشطة الطبية', '2026-11-15', '2026-11-20', '2026-11-25 09:59', '', 100, '', '', 'javascript:alert(1)', '2026-11-15', ''],
    ['REF:250739013184', 'أعمال نظافة', 'جهة تجريبية', 'تم إعلان الترسية', 'منافسة عامة', 'التشغيل والصيانة والنظافة', '2025-07-01', '2025-07-05', '2025-07-10', '', 500, '', '', '', '2026-11-15', '2025-09-01'],
    ['261139000002', 'توريد ملابس', 'جهة تجريبية', 'نشطة', 'شراء مباشر', 'تجارة', '2026-11-15', '2026-11-20', '2026-11-25', '', 100, '', '', '', '2026-11-15', '']],
    'تفاصيل الترسيات': [['الرقم المرجعي', 'اسم الفائز', 'قيمة الترسية ر.س'], ['250739013184', 'شركة رامي قاسم', 44620], ['261139000001', 'مؤسسة لينا حرب', 900]],
    'العروض المنشورة': [['الرقم المرجعي', 'مقدم العرض', 'سعر العرض المالي ر.س', 'نتيجة الفحص الفني'], ['250739013184', 'شركة أفاقي لتقنية المعلومات', 58650, 'غير مطابق'], ['250739013184', 'شركة رامي قاسم', 44620, 'مطابق']],
    'سجل السحب': [['رقم التشغيل', 'بدأ', 'انتهى', 'الحالة'], ['1', '2026-11-15 12:48:14', '2026-11-15 13:15:55', 'partial'], ['2', '2026-11-15 20:48:14', '2026-11-16 15:38:00', 'complete']] };
  return (n) => s[n] || null;
};
test('v9.63: the pull tool’s Excel is read by column name and all of it is kept — the market study reads every field of work', () => {
  const r = core.radarFromSheets(radarSheets(), ['261139000002']);
  assert.equal(r.total, 4);
  assert.deepEqual(r.tenders.map((x) => x.ref), ['261139004629', '261139000001', '250739013184', '261139000002'], 'the medicines tender is kept too (9.60–9.62 dropped it)');
  assert.deepEqual(r.tenders.map((x) => x.scope), [true, false, false, false], 'each tender still says whether it is ours');
  const dc = r.tenders[0];
  assert.deepEqual([dc.status, dc.due, dc.dueTime, dc.askDue, dc.askDueTime, dc.fees, dc.no, dc.scope, dc.west], ['active', '2026-11-30', '09:59', '2026-11-25', '', 200, '126526 / 130720', true, true]);
  assert.equal(r.tenders[2].status, 'awarded'); assert.equal(r.tenders[2].ref, '250739013184', 'the «REF:» prefix is dropped');
  assert.deepEqual(r.awards, [{ ref: '250739013184', winner: 'شركة رامي قاسم', value: 44620 }, { ref: '261139000001', winner: 'مؤسسة لينا حرب', value: 900 }], 'every award is kept');
  assert.deepEqual(r.offers.map((o) => [o.bidder, o.tech]), [['شركة أفاقي لتقنية المعلومات', 'fail'], ['شركة رامي قاسم', 'pass']]);
  assert.equal(r.pulledAt, '2026-11-16T15:38'); assert.equal(r.partial, true, 'one run says partial');
  assert.deepEqual(core.radarFromSheets(() => null), { error: 'nosheet' });
});
test('v9.60: the pull tool’s own file is checked; a link that is not an Etimad page is dropped', () => {
  assert.deepEqual(core.parseRadar('{'), { error: 'json' }); assert.deepEqual(core.parseRadar({ schema: 'x', tenders: [] }), { error: 'schema' });
  const r = core.parseRadar({ schema: core.RADAR_SCHEMA, pulledAt: '2026-11-17T08:00', filter: { from: '2026-11-01', to: '2026-11-17', category: 'تقنية المعلومات' },
    tenders: [{ ref: '261139000009', title: 'توريد كاميرات مراقبة', entity: 'أمانة محافظة جدة', status: 'active', due: '2026-12-01 10:00', link: 'javascript:alert(1)' }, { ref: '', title: 'no ref' }] });
  assert.equal(r.tenders.length, 1); assert.equal(r.tenders[0].link, ''); assert.equal(r.tenders[0].dueTime, '10:00'); assert.equal(r.tenders[0].west, true);
  assert.deepEqual(r.filter, { from: '2026-11-01', to: '2026-11-17', category: 'تقنية المعلومات' });
});
test('v9.60: pulls add up — a newer copy of a tender replaces the older one, nothing else is dropped', () => {
  const a = core.radarFromSheets(radarSheets(), []), b = core.parseRadar({ schema: core.RADAR_SCHEMA, pulledAt: '2026-11-18T08:00', tenders: [{ ref: '261139004629', title: 'WM - توريد وتركيب داش كام', status: 'active', due: '2026-12-03 09:59' }] });
  const m = core.radarMerge(core.radarMerge(null, a), b);
  assert.equal(m.tenders.length, 4); assert.equal(m.tenders.find((x) => x.ref === '261139004629').due, '2026-12-03', 'Etimad extended the deadline');
  assert.equal(m.awards.length, 2, 'the older pull’s awards stay'); assert.equal(m.pulls.length, 2); assert.equal(m.pulledAt, '2026-11-18T08:00');
});

// v9.63 (ADR-0136): the market study
const studyRadar = () => core.parseRadar({ schema: core.RADAR_SCHEMA, pulledAt: '2026-11-17T08:00', tenders: [
  { ref: '1', title: 'توريد كاميرات مراقبة', entity: 'أمانة جدة', status: 'awarded', activity: 'تقنية المعلومات', published: '2025-02-10', due: '2025-03-01' },
  { ref: '2', title: 'تتبع المركبات', entity: 'أمانة جدة', status: 'awarded', activity: 'تقنية المعلومات', published: '2025-05-20', due: '2025-06-01' },
  { ref: '3', title: 'أعمال نظافة', entity: 'بلدية الرياض', status: 'awarded', activity: 'النظافة', published: '2025-08-01', due: '2025-08-20' },
  { ref: '4', title: 'شبكات اتصالات', entity: 'تجمع جدة الصحي', status: 'active', activity: 'الاتصالات', published: '2026-10-01', due: '2026-12-01' },
  { ref: '5', title: 'توريد أدوية', entity: 'بلدية الرياض', status: 'other', activity: 'الأنشطة الطبية', published: '2026-11-10', due: '2026-11-30' },
  { ref: '6', title: 'كاميرات مراقبة المدارس', entity: 'أمانة جدة', status: 'awarded', activity: 'تقنية المعلومات', published: '2025-11-02', due: '2025-11-20' }],
  awards: [{ ref: '1', winner: 'شركة ألف', value: 100000 }, { ref: '2', winner: 'شركة أفاقي لتقنية المعلومات', value: 50000 }, { ref: '3', winner: 'شركة ألف', value: 30000 },
    { ref: '6', winner: 'شركة باء', value: null }],
  offers: [{ ref: '1', bidder: 'شركة ألف', price: 100000, tech: 'pass' }, { ref: '1', bidder: 'شركة أفاقي لتقنية المعلومات', price: 120000, tech: 'pass' },
    { ref: '2', bidder: 'شركة أفاقي لتقنية المعلومات', price: 50000, tech: 'pass' }, { ref: '2', bidder: 'شركة ألف', price: 70000, tech: 'fail' }, { ref: '3', bidder: 'شركة ألف', price: 30000, tech: 'pass' }] });
test('v9.63: the market study counts, sums and lists everything for a filter — no list is cut to ten', () => {
  const R = studyRadar(), all = core.marketStats(R, {});
  assert.deepEqual([all.total, all.active, all.awarded, all.other, all.winnerKnown, all.valueKnown, all.value], [6, 1, 4, 1, 4, 3, 180000]);
  assert.equal(all.medianValue, 50000); assert.equal(all.medianBidders, 2); assert.deepEqual([all.us, all.usWon], [2, 1]);
  assert.deepEqual(all.winners.map((w) => [w.name, w.wins, w.value, w.valued, w.us]), [['شركة ألف', 2, 130000, 2, false], ['شركة أفاقي لتقنية المعلومات', 1, 50000, 1, true], ['شركة باء', 1, 0, 0, false]], 'a win without a published value counts as a win, not as money');
  assert.deepEqual(all.entities.map((e) => [e.name, e.n, e.awarded, e.value]), [['أمانة جدة', 3, 3, 150000], ['بلدية الرياض', 2, 1, 30000], ['تجمع جدة الصحي', 1, 0, 0]]);
  assert.deepEqual(all.bidders.map((b) => [b.name, b.bids, b.wins, b.winRate, b.fail]), [['شركة ألف', 3, 2, 67, 1], ['شركة أفاقي لتقنية المعلومات', 2, 1, 50, 0]]);
  assert.deepEqual(all.months.map((m) => [m.month, m.n]), [['2025-02', 1], ['2025-05', 1], ['2025-08', 1], ['2025-11', 1], ['2026-10', 1], ['2026-11', 1]]);
  const t1 = all.tenders.find((x) => x.ref === '1');
  assert.deepEqual([t1.winners, t1.value, t1.bidders, t1.low, t1.high, t1.us, t1.usWon], [['شركة ألف'], 100000, 2, 100000, 120000, true, false]);
  assert.deepEqual(all.tenders.map((x) => x.ref), ['5', '4', '6', '3', '2', '1'], 'newest first');
  const many = core.parseRadar({ schema: core.RADAR_SCHEMA, tenders: Array.from({ length: 40 }, (_, i) => ({ ref: String(100 + i), title: `t${i}`, entity: `e${i}`, status: 'active', published: '2026-01-01' })) });
  const M = core.marketStats(many, {}); assert.equal(M.tenders.length, 40); assert.equal(M.entities.length, 40, 'all forty, not a top ten');
});
test('v9.63: the market filter — period, our scope, status, words, and one name pressed in a list', () => {
  const R = studyRadar();
  const y25 = core.marketStats(R, core.marketPeriod('2025', '2026-11-17'));
  assert.deepEqual([y25.total, y25.value, y25.first, y25.last], [4, 180000, '2025-02-10', '2025-11-02']);
  assert.equal(core.marketStats(R, { ...core.marketPeriod('2025-Q2', '2026-11-17') }).total, 1);
  assert.equal(core.marketStats(R, { status: 'active' }).total, 1);
  assert.equal(core.marketStats(R, { q: 'كاميرات' }).total, 2, 'a word in the title');
  assert.equal(core.marketStats(R, { q: 'بلديه الرياض' }).total, 2, 'the entity, spelt with ه for ة');
  const w = core.marketStats(R, { who: { kind: 'winner', name: 'شركة ألف' } });
  assert.deepEqual(w.tenders.map((x) => x.ref).sort(), ['1', '3']);
  assert.deepEqual(core.marketStats(R, { who: { kind: 'entity', name: 'أمانة جدة' } }).tenders.map((x) => x.ref).sort(), ['1', '2', '6']);
  assert.deepEqual(core.marketStats(R, { who: { kind: 'bidder', name: 'شركة أفاقي لتقنية المعلومات' } }).tenders.map((x) => x.ref).sort(), ['1', '2']);
  assert.deepEqual(core.marketStats(R, { who: { kind: 'activity', name: 'النظافة' } }).tenders.map((x) => x.ref), ['3']);
  const empty = core.marketStats(null, {}); assert.deepEqual([empty.total, empty.value, empty.medianValue, empty.tenders.length], [0, 0, null, 0]);
});
test('v9.63: the market periods — last quarter, half year, this year, a year, a quarter, and two days of his own', () => {
  assert.deepEqual(core.marketPeriod('q', '2026-11-17'), { from: '2026-08-17', to: '2026-11-17' });
  assert.deepEqual(core.marketPeriod('h', '2026-11-17'), { from: '2026-05-17', to: '2026-11-17' });
  assert.deepEqual(core.marketPeriod('ytd', '2026-11-17'), { from: '2026-01-01', to: '2026-11-17' });
  assert.deepEqual(core.marketPeriod('2024', '2026-11-17'), { from: '2024-01-01', to: '2024-12-31' });
  assert.deepEqual(core.marketPeriod('2024-Q1', '2026-11-17'), { from: '2024-01-01', to: '2024-03-31' }, 'a leap year');
  assert.deepEqual(core.marketPeriod('2025-Q4', '2026-11-17'), { from: '2025-10-01', to: '2025-12-31' });
  assert.deepEqual(core.marketPeriod('custom', '2026-11-17', '2025-01-05', 'x'), { from: '2025-01-05', to: '' });
  assert.deepEqual(core.marketPeriod('all', '2026-11-17'), { from: '', to: '' });
});
// v9.64 (ADR-0137): the Tender Analyzer inside the card
test('v9.64: the page talks to the program on this computer only, and only in our protocol', () => {
  assert.equal(core.ANALYZER.base, 'http://127.0.0.1:47615', 'this computer, never the network');
  assert.deepEqual(core.parseAnalyzerHello({ schema: 'afaqy-analyzer-link/v1', app: 'TenderAnalyzer', version: '3.1.0', engine: 'local', busy: false, job: null }), { version: '3.1.0', engine: 'local', busy: false, job: '' });
  assert.deepEqual(core.parseAnalyzerHello({ schema: 'x', app: 'TenderAnalyzer' }), { error: 'schema' }, 'another program on the same port is not ours');
  assert.deepEqual(core.parseAnalyzerHello('<html>'), { error: 'schema' });
  const j = core.parseAnalyzerJob({ schema: 'afaqy-analyzer-link/v1', job: 't-1', state: 'running', stage: 2, progress: 7, message: 'قراءة', error: '',
    outputs: [{ name: 'a.xlsx', size: 10 }, { name: '../b.xlsx', size: 10 }, { name: 'a.xlsx', size: 10 }, { name: 'c.pptx', size: 0 }, { name: '.hidden', size: 3 }, null] });
  assert.deepEqual([j.state, j.stage, j.progress, j.message], ['running', 2, 1, 'قراءة']);
  assert.deepEqual(j.outputs, [{ name: 'a.xlsx', size: 10 }], 'a path, a repeat, an empty file and a hidden file are dropped');
  assert.equal(core.parseAnalyzerJob({ schema: 'afaqy-analyzer-link/v1', job: 't-1', state: 'dancing' }).state, 'failed', 'a state we do not know is not success');
  assert.deepEqual(core.parseAnalyzerJob({ schema: 'afaqy-analyzer-link/v1' }), { error: 'schema' });
});
test('v9.64: a tender has one job name, and the card sends its own documents only', () => {
  const a = core.analyzerJobId('توريد وتركيب داش كام'), b = core.analyzerJobId('توريد وتركيب داش كام 2');
  assert.match(a, /^t-[0-9a-f]{16}$/); assert.equal(a, core.analyzerJobId('توريد وتركيب داش كام')); assert.notEqual(a, b);
  const f = (id, name, kind, mailKey = '') => ({ id, name, kind, mailKey });
  const s = core.analyzerSend({ files: [f('1', 'mail.msg', 'original'), f('2', 'كراسة الشروط.pdf', 'booklet'), f('3', 'BOQ.xlsx', 'boq'), f('4', 'BOQ.xlsx', 'boq'), f('5', 'our offer.pptx', 'offer'),
    f('6', 'T_Study_AR.pptx', 'study', 'analyzer:t-1'), f('7', 'run.exe', 'other'), f('8', 'a/b:c.pdf', 'other')] });
  assert.deepEqual(s.files, [{ id: '2', name: 'كراسة الشروط.pdf' }, { id: '3', name: 'BOQ.xlsx' }, { id: '4', name: 'BOQ (2).xlsx' }, { id: '8', name: 'a b c.pdf' }]);
  assert.equal(s.skipped, 3, 'our own offer, the program\'s earlier study and a file it cannot read are counted; the mail itself is not');
  assert.deepEqual(core.analyzerSend({ files: [] }), { files: [], skipped: 0 });
});
test('v9.64: what the program wrote takes its place on the card, and one file fills the fields', () => {
  const k = core.analyzerOutputKind;
  assert.deepEqual([k('AFAQY_Tender_T_Study_AR.pptx'), k('AFAQY_Tender_T_Workbook_AR.xlsx'), k('AFAQY_Tender_T_Inquiries_AR.docx'), k('T.tender-study.json'), k('AFAQY_Tender_T_Offer_AR.pptx'),
    k('AFAQY_Tender_T_Offer_AR.pdf'), k('AFAQY_Tender_T_BOQ_Priced_AR.xlsx'), k('AFAQY_Tender_T_Offer_AR.xlsx'), k('AFAQY_Tender_T_Datasheets_AR.pdf')],
  ['study', 'study', 'study', 'study', 'offer', 'offer', 'financial', 'financial', 'technical']);
  assert.equal(core.analyzerStudyFile([{ name: 'AFAQY_Tender_T_Workbook_AR.xlsx' }, { name: 'T.tender-study.json' }]), 'T.tender-study.json');
  assert.equal(core.analyzerStudyFile([{ name: 'AFAQY_Tender_T_Workbook_AR.xlsx' }, { name: 'x.pptx' }]), 'AFAQY_Tender_T_Workbook_AR.xlsx');
  assert.equal(core.analyzerStudyFile([{ name: 'x.pptx' }]), '');
  const job = core.analyzerJobId('x');
  assert.deepEqual(core.cleanAnalyzer({ job, state: 'done', at: '2026-11-17T21:30:55', files: 6, extra: 1 }), { job, state: 'done', at: '2026-11-17T21:30', error: '', files: 6 });
  assert.equal(core.cleanAnalyzer({ job: '../x', state: 'done' }), null);
  assert.deepEqual(core.cleanTenderDetails({ analyzer: { job, state: 'running', at: '2026-11-17T21:30' } }).analyzer, { job, state: 'running', at: '2026-11-17T21:30', error: '', files: 0 }, 'kept with the tender, so a reload finds the study again');
  assert.equal('analyzer' in core.cleanTenderDetails({}), false);
});
test('v9.63: finding a register row in a whole pull of 30,000 tenders stays quick', () => {
  const L = Array.from({ length: 30000 }, (_, i) => ({ ref: String(261100000000 + i), no: '', title: `منافسة رقم ${i}` }));
  const t0 = Date.now(); let n = 0;
  for (let i = 0; i < 300; i++) if (core.radarFind({ etimadNo: '', subject: `منافسة رقم ${i * 7}` }, L, key)) n++;
  assert.equal(n, 300); assert.ok(Date.now() - t0 < 1500, `took ${Date.now() - t0} ms`);
});
// v9.65 (ADR-0138): a new pull is written onto what is kept, never in its place
test('v9.65: a later pull adds the winners and the new tenders, and never erases what an earlier pull knew', () => {
  const P = (at, tenders, awards = [], offers = []) => core.parseRadar({ schema: core.RADAR_SCHEMA, pulledAt: at, tenders, awards, offers });
  const first = P('2026-11-16T15:38', [
    { ref: '261100000001', title: 'توريد كاميرات مراقبة', entity: 'أمانة جدة', status: 'awarded', activity: 'تقنية المعلومات', published: '2026-03-01', due: '2026-03-20 10:00', fees: 500, firstSeen: '2026-11-15' },
    { ref: '261100000002', title: 'تتبع مركبات', entity: 'بلدية ينبع', status: 'active', published: '2026-11-10', due: '2026-12-01 09:59', firstSeen: '2026-11-15' },
    { ref: '251100000003', title: 'أعمال نظافة', entity: 'جهة أخرى', status: 'awarded', published: '2025-06-01' }],
  [{ ref: '251100000003', winner: 'شركة قديمة', value: 9000 }]);
  // the second pull: 2026 in our scope only, made for the winners — thinner rows (no fee, no entity on one), one new tender
  const second = P('2026-11-20T09:00', [
    { ref: '261100000001', title: 'توريد كاميرات مراقبة', entity: '', status: 'awarded', published: '2026-03-01', due: '', firstSeen: '2026-11-20' },
    { ref: '261100000002', title: 'تتبع مركبات', entity: 'بلدية ينبع', status: 'awarded', published: '2026-11-10', due: '2026-12-05 09:59' },
    { ref: '261100000009', title: 'شبكات جديدة', entity: 'أمانة جدة', status: 'active', published: '2026-11-18', due: '2026-12-10 10:00' }],
  [{ ref: '261100000001', winner: 'شركة ألف', value: 120000 }], [{ ref: '261100000001', bidder: 'شركة ألف', price: 120000, tech: 'pass' }]);
  const m = core.radarMerge(core.radarMerge(null, first), second), t = (r) => m.tenders.find((x) => x.ref === r);
  assert.equal(m.tenders.length, 4, 'three kept and one new: nothing the first pull held is gone');
  assert.deepEqual(m.merged, { added: 1, updated: 2 });
  assert.deepEqual([t('261100000001').entity, t('261100000001').due, t('261100000001').dueTime, t('261100000001').fees, t('261100000001').activity], ['أمانة جدة', '2026-03-20', '10:00', 500, 'تقنية المعلومات'], 'an empty value in the new pull erases nothing');
  assert.equal(t('261100000001').firstSeen, '2026-11-15', 'first seen stays the earliest');
  assert.deepEqual([t('261100000002').status, t('261100000002').due], ['awarded', '2026-12-05'], 'what the later reading knows wins');
  assert.equal(t('251100000003').title, 'أعمال نظافة', 'a tender the new pull does not hold stays as it was');
  assert.deepEqual(m.awards.map((a) => [a.ref, a.winner]).sort(), [['251100000003', 'شركة قديمة'], ['261100000001', 'شركة ألف']], 'the winners are added to the ones already known');
  assert.equal(m.offers.length, 1); assert.equal(m.pulls.length, 2); assert.equal(m.pulledAt, '2026-11-20T09:00');
  assert.equal(core.marketStats(m, core.marketPeriod('2026', '2026-11-20')).winnerKnown, 1, 'and the market study sees them');
});
test('v9.65: an old file uploaded after a newer one cannot take the register back in time', () => {
  const P = (at, tenders, awards = []) => core.parseRadar({ schema: core.RADAR_SCHEMA, pulledAt: at, tenders, awards });
  const newer = P('2026-11-20T09:00', [{ ref: '261100000001', title: 'توريد كاميرات مراقبة', entity: '', status: 'awarded', due: '2026-12-05 09:59' }], [{ ref: '261100000001', winner: 'شركة ألف', value: 120000 }]);
  const older = P('2026-11-16T15:38', [{ ref: '261100000001', title: 'توريد كاميرات مراقبة', entity: 'أمانة جدة', status: 'active', due: '2026-11-30 09:59', fees: 500 }, { ref: '261100000007', title: 'قديم آخر', status: 'active' }],
    [{ ref: '261100000001', winner: 'اسم قديم خطأ', value: 1 }, { ref: '261100000007', winner: 'شركة باء', value: 7 }]);
  const m = core.radarMerge(core.radarMerge(null, newer), older), x = m.tenders.find((y) => y.ref === '261100000001');
  assert.deepEqual([x.status, x.due], ['awarded', '2026-12-05'], 'the later reading stays');
  assert.deepEqual([x.entity, x.fees], ['أمانة جدة', 500], 'and the old file still fills what the later one lacked');
  assert.deepEqual(m.awards.map((a) => a.winner).sort(), ['شركة ألف', 'شركة باء'], 'the newer winner is not replaced by the old file; a winner only the old file knows is taken');
  assert.equal(m.pulledAt, '2026-11-20T09:00'); assert.equal(m.tenders.length, 2);
  const same = core.radarMerge(m, older); assert.deepEqual(same.merged, { added: 0, updated: 0 }, 'the same file again changes nothing');
});
test('v9.65: a thinner later reading cannot take a tender out of our scope or out of the Western Region', () => {
  const P = (at, tenders, awards = []) => core.parseRadar({ schema: core.RADAR_SCHEMA, pulledAt: at, tenders, awards });
  // in scope by its activity alone, and in the west by its entity alone — exactly what a details-only second pull does not carry
  const full = P('2026-11-16T15:38', [{ ref: '261100000021', title: 'تطوير منصة الخدمات', entity: 'أمانة جدة', activity: 'تقنية المعلومات', status: 'awarded', published: '2026-03-02' }]);
  const thin = P('2026-11-20T09:00', [{ ref: '261100000021', title: 'تطوير منصة الخدمات', entity: '', status: 'awarded', published: '2026-03-02' }], [{ ref: '261100000021', winner: 'شركة ألف', value: 90000 }]);
  assert.deepEqual([full.tenders[0].scope, full.tenders[0].west, thin.tenders[0].scope, thin.tenders[0].west], [true, true, false, false], 'the thin row alone reads out of scope');
  for (const m of [core.radarMerge(core.radarMerge(null, full), thin), core.radarMerge(core.radarMerge(null, thin), full)]) {
    const x = m.tenders[0];
    assert.deepEqual([x.scope, x.west, x.activity, x.entity], [true, true, 'تقنية المعلومات', 'أمانة جدة'], 'scope and region follow what is known of the tender after the merge');
    const st = core.marketStats(m, { ...core.marketPeriod('2026', '2026-11-20'), scope: 'afaqy', west: true });
    assert.deepEqual([st.total, st.winnerKnown, st.value], [1, 1, 90000], 'so the study of our scope keeps it, now with its winner');
  }
  // and a later reading that knows more can still bring a tender into scope
  const late = P('2026-11-21T09:00', [{ ref: '261100000022', title: 'عقد خدمات', activity: 'الاتصالات', status: 'active' }]);
  const early = P('2026-11-01T09:00', [{ ref: '261100000022', title: 'عقد خدمات', status: 'active' }]);
  assert.equal(core.radarMerge(core.radarMerge(null, early), late).tenders[0].scope, true);
});
// v9.66 (ADR-0139): industrial IoT as a field of its own in the market study
test('v9.66: an Etimad title is read into its industrial-IoT line, and look-alike words are not', () => {
  const L = (s) => core.etimadIiot(s);
  assert.deepEqual(['إعادة تأهيل نظام التحكم الآلي (سكادا/ دي سي اس) لمحطات الضخ', 'فحص وصيانة أنظمة التحكم DCS و PLC بأنظمة نقل المياه بالليث', 'توريد نظام مراقبة عن بعد للمضخات'].map(L), ['scada', 'scada', 'scada']);
  assert.deepEqual(['توريد وتركيب عدادات كهرباء للمدينة السكنية', 'ربط عدد (15) أجهزة قياس تدفق', 'مشروع العدادات الذكية'].map(L), ['meters', 'meters', 'meters']);
  assert.deepEqual(['مشروع توريد تركيب حساسات لقياس مستوى الوقود بمحطة التموين', 'مراقبة الخزانات الأرضية'].map(L), ['tanks', 'tanks']);
  assert.deepEqual(['إنشاء محطات رصد بيئي', 'قياس بيئي لجودة الهواء والماء', 'نظام إدارة الطاقة للمباني', 'كشف التسرب في الشبكة', 'مشروع الإنارة الذكية', 'توريد ميزان جسري'].map(L), ['env', 'env', 'energy', 'energy', 'city', 'city']);
  assert.equal(L('أجهزة تحكم منطقيPLC للآلات'), 'scada', 'a Latin word glued to an Arabic one is still read');
  // maintenance stays in; parts, lab and medical purchases and look-alikes stay out
  for (const no of ['توريد قطع غيار سكادا للمستشفى', 'توريد مقياس تدفق الهواء لجهاز SAS', 'باب كهربائي منزلق ذو قفل للتحكم اليدوي', 'خدمات الإعاشة لمنسوبي الوزارة', 'معالجة ارتفاع منسوب المياه الجوفية',
    'تطوير منظومة التوثيق السريري الذكي', 'تشغيل مكتب المشاريع بوكالة التحول الرقمي والمدن الذكية', 'Temperature and humidity mini data logger', 'معايرة عدادات تدفق الغاز', 'توريد كاميرات مراقبة', ''])
    assert.equal(L(no), '', no);
});
test('v9.66: the market study can be read for industrial IoT alone, or with our scope, and by line', () => {
  const R = core.parseRadar({ schema: core.RADAR_SCHEMA, pulledAt: '2026-11-18T09:00', tenders: [
    { ref: '261100000031', title: 'صيانة نظام التحكم المنطقي (PLC) بمنظومة التحلية في جدة', entity: 'هيئة المياه', status: 'awarded', published: '2026-02-01' },
    { ref: '261100000032', title: 'توريد وتركيب عدادات كهرباء', entity: 'الإسكان', status: 'awarded', published: '2026-03-01' },
    { ref: '261100000033', title: 'توريد كاميرات مراقبة', entity: 'أمانة جدة', status: 'active', published: '2026-04-01' },
    { ref: '261100000034', title: 'حساسات لقياس مستوى الوقود', entity: 'وزارة الدفاع', status: 'active', published: '2026-05-01' },
    { ref: '261100000035', title: 'توريد أثاث مكتبي', entity: 'جهة', status: 'awarded', published: '2026-05-02' },
    { ref: '251100000036', title: 'تحديث نظام سكادا', entity: 'هيئة المياه', status: 'awarded', published: '2025-05-02' }],
  awards: [{ ref: '261100000031', winner: 'شركة ألف', value: 500000 }, { ref: '261100000032', winner: 'شركة باء', value: 70000 }, { ref: '251100000036', winner: 'شركة ألف', value: 900000 }] });
  const y = core.marketPeriod('2026', '2026-11-18'), S = core.marketStats(R, { ...y, scope: 'iiot' });
  assert.deepEqual([S.total, S.awarded, S.winnerKnown, S.value], [3, 2, 2, 570000]);
  assert.deepEqual(S.tenders.map((x) => x.line).sort(), ['meters', 'scada', 'tanks']);
  assert.deepEqual(S.lines.map((l) => [l.name, l.n, l.awarded, l.value]).sort(), [['meters', 1, 1, 70000], ['scada', 1, 1, 500000], ['tanks', 1, 0, 0]]);
  assert.deepEqual(S.winners.map((w) => [w.name, w.wins, w.value]), [['شركة ألف', 1, 500000], ['شركة باء', 1, 70000]]);
  assert.deepEqual(core.marketStats(R, { ...y, scope: 'iiot', who: { kind: 'line', name: 'scada' } }).tenders.map((x) => x.ref), ['261100000031']);
  // the fuel sensors are in both fields and are counted once; furniture is in neither
  assert.deepEqual([core.marketStats(R, { ...y, scope: 'afaqy' }).total, core.marketStats(R, { ...y, scope: 'both' }).total, core.marketStats(R, { ...y, scope: 'all' }).total], [2, 4, 5]);
  assert.deepEqual(core.marketStats(R, { from: '2025-01-01', to: '2026-12-31', scope: 'iiot' }).winners[0], { name: 'شركة ألف', wins: 2, value: 1400000, valued: 2, us: false });
});
// v9.68 (ADR-0140): the market study answers a search by winner or activity, and a pressed number by its own tenders
test('v9.68: the market search also finds a winner, a bidder or an activity; a pressed number keeps only its own tenders', () => {
  const R = core.parseRadar({ schema: core.RADAR_SCHEMA, pulledAt: '2026-11-18T09:00', tenders: [
    { ref: '261100000041', title: 'توريد كاميرات مراقبة', entity: 'أمانة جدة', activity: 'تقنية المعلومات', status: 'awarded', published: '2026-02-01' },
    { ref: '261100000042', title: 'صيانة شبكة الحاسب', entity: 'جامعة الملك عبدالعزيز', activity: 'الاتصالات', status: 'awarded', published: '2026-03-01' },
    { ref: '261100000043', title: 'نظام تتبع المركبات', entity: 'أمانة جدة', activity: 'تقنية المعلومات', status: 'active', published: '2026-04-01' }],
  awards: [{ ref: '261100000041', winner: 'شركة ألف للتقنية', value: 500000 }, { ref: '261100000042', winner: 'مؤسسة باء' }],
  offers: [{ ref: '261100000041', bidder: 'شركة ألف للتقنية', price: 500000, tech: 'pass' }, { ref: '261100000041', bidder: 'شركة جيم المحدودة', price: 620000, tech: 'pass' }] });
  const refs = (f) => core.marketStats(R, f).tenders.map((x) => x.ref).sort();
  assert.deepEqual(refs({ q: 'ألف للتقنيه' }), ['261100000041'], 'by the winner, however the name is typed');
  assert.deepEqual(refs({ q: 'جيم' }), ['261100000041'], 'by a company that only bid');
  assert.deepEqual(refs({ q: 'الاتصالات' }), ['261100000042'], 'by the activity');
  assert.deepEqual(refs({ q: '261100000043' }), ['261100000043'], 'by the number, as before');
  assert.deepEqual(refs({ q: 'أمانة جدة' }), ['261100000041', '261100000043'], 'by the entity, as before');
  assert.deepEqual(refs({ q: 'لا يوجد هذا' }), []);
  // a pressed number: the tenders behind «total of the published values» and behind «middle number of bidders»
  assert.deepEqual(refs({ only: 'valued' }), ['261100000041']);
  assert.deepEqual(refs({ only: 'bids' }), ['261100000041']);
  const S = core.marketStats(R, { only: 'valued' });
  assert.deepEqual([S.total, S.awarded, S.value, S.winners.length], [1, 1, 500000, 1], 'every number follows the narrowing');
  assert.deepEqual(refs({}), ['261100000041', '261100000042', '261100000043']);
});
const key = (s) => String(s || '').replace(/^\s*((re|fw|fwd)\s*:\s*)+/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
test('v9.60: a register row finds its Etimad tender by number or exact title; a looser match is only suggested', () => {
  const L = core.radarFromSheets(radarSheets(), ['261139000002']).tenders;
  assert.equal(core.radarFind({ etimadNo: '261139004629', subject: 'x' }, L, key).ref, '261139004629', 'Etimad’s reference number');
  assert.equal(core.radarFind({ etimadNo: '126526/130720', subject: 'x' }, L, key).ref, '261139004629', 'the entity’s own tender number');
  assert.equal(core.radarFind({ etimadNo: '', subject: 'RE: WM - توريد وتركيب داش كام' }, L, key).ref, '261139004629', 'same title');
  assert.equal(core.radarFind({ etimadNo: '', subject: 'توريد وتركيب داش كام - الشؤون الصحية' }, L, key), null, 'a different title is not linked by itself');
  assert.deepEqual(core.radarSuggest({ subject: 'توريد وتركيب داش كام - الشؤون الصحية بوزارة الحرس الوطني', entity: '' }, L).map((x) => x.ref), ['261139004629']);
  assert.deepEqual(core.radarSuggest({ subject: 'توريد كاميرات للمستودع' }, L), [], 'one shared word is not enough');
});
test('v9.62: an Etimad pull never changes what the mail or the study gave — it fills only what is empty, and says where it differs', () => {
  const x = core.radarFromSheets(radarSheets(), []).tenders[0];
  const item = { id: 'a', subject: 's', due: '2026-11-19', dueTime: '', askDue: '', fees: 0, etimadNo: '', entity: 'Entity typed', dateSources: { due: 'analyzer' }, fieldSources: { fees: 'analyzer' } };
  const r = core.applyEtimad(item, x);
  assert.equal(r.patch.due, undefined, 'the study’s date stays'); assert.equal(r.patch.fees, undefined, 'the study’s fee stays');
  assert.deepEqual(r.differs, [{ field: 'due', have: '2026-11-19', etimad: '2026-11-30 09:59', src: 'analyzer' }, { field: 'fees', have: '0', etimad: '200', src: 'analyzer' }]);
  assert.deepEqual([r.patch.askDue, r.patch.etimadNo, r.patch.entity], ['2026-11-25', '261139004629', undefined], 'only empty fields are filled; a typed entity stays');
  assert.deepEqual(core.etimadLinkPatch(item, x), { etimadNo: '261139004629', link: 'https://tenders.etimad.sa/Tender/DetailsForVisitor?STenderId=abc' }, 'linking gives the number and the page, nothing else');
  assert.deepEqual(core.etimadLinkPatch({ etimadNo: '261139004629', link: x.link }, x), {}, 'linked already: nothing');
  const it = core.radarToItem(x, '2026-11-17', key);
  assert.deepEqual([it.id, it.subject, it.date, it.stage, it.etimadNo, it.due, it.dueTime, it.fees, it.dateSources.due], ['wm - توريد وتركيب داش كام', 'WM - توريد وتركيب داش كام', '2026-11-17', 'received', '261139004629', '2026-11-30', '09:59', 200, 'etimad']);
  // a followed tender starts with the pull's dates; the study and the mail take their place when they arrive
  const st = core.parseTenderStudy({ schema: 'afaqy-tender-study/v1', tenders: [{ subject: 'x', fees: 150, dates: { due: { date: '2026-11-26', time: '09:30' } } }] }).tenders[0];
  const a = core.applyTenderStudy(it, st);
  assert.deepEqual([a.patch.due, a.patch.dueTime, a.patch.fees, a.patch.dateSources.due, a.patch.fieldSources.fees], ['2026-11-26', '09:30', 150, 'analyzer', 'analyzer']); assert.deepEqual(a.differs, []);
  const mailed = core.applyTenderEmailDates({ ...it, messages: [{ key: 'm', date: '2026-11-17', schedule: { due: [{ date: '2026-11-27', time: '10:00' }], askDue: [], visit: [], openAt: [] } }] });
  assert.deepEqual([mailed.due, mailed.dueTime, mailed.dateSources.due], ['2026-11-27', '10:00', 'mail']);
  const clean = core.cleanTenderDetails({ ...it, link: 'https://evil.example/x', dateSources: { due: 'etimad' }, fieldSources: { fees: 'etimad' } });
  assert.equal(clean.link, ''); assert.equal(clean.dateSources.due, 'etimad'); assert.equal(clean.fieldSources.fees, 'etimad');
});
test('v9.62: what 9.60–9.61 replaced with Etimad’s value goes back to the mail’s or the study’s; a value typed since stays', () => {
  const was = [{ field: 'due', was: '2026-11-19', src: 'analyzer' }, { field: 'fees', was: '0', src: 'analyzer' }, { field: 'askDue', was: '2026-11-20 10:00', src: 'mail' }];
  const u = core.tenderUndoEtimad({ due: '2026-11-30', dueTime: '09:59', fees: 200, askDue: '2026-11-25', askDueTime: '', dateSources: { due: 'etimad', askDue: 'manual' }, fieldSources: { fees: 'etimad' }, etimadWas: was });
  assert.deepEqual([u.patch.due, u.patch.dueTime, u.patch.dateSources.due, u.patch.fees, u.patch.fieldSources.fees], ['2026-11-19', '', 'analyzer', 0, 'analyzer']);
  assert.equal(u.patch.askDue, undefined, 'typed by hand since: stays'); assert.deepEqual(u.patch.etimadWas, []); assert.deepEqual(u.fields.sort(), ['due', 'fees']);
  assert.equal(core.tenderUndoEtimad({ etimadWas: [] }), null);
});
// ---------- v9.61 (ADR-0133): the market and the result ----------
const marketRadar = () => core.parseRadar({ schema: core.RADAR_SCHEMA, pulledAt: '2026-11-17 08:00', tenders: [
  { ref: '261139000100', title: 'توريد وتركيب كاميرات مراقبة أمنية للمستودعات', entity: 'جهة أ', status: 'awarded', published: '2026-09-01' },
  { ref: '261139000101', title: 'توريد وتركيب كاميرات مراقبة أمنية للمباني', entity: 'جهة ب', status: 'awarded', published: '2026-10-01' },
  { ref: '261139000102', title: 'صيانة كاميرات مراقبة أمنية بالبلدية', entity: 'جهة ج', status: 'awarded', published: '2026-08-01' },
  { ref: '261139000103', title: 'تجديد رخص نظام الموارد', activity: 'تقنية المعلومات', entity: 'جهة د', status: 'awarded', published: '2026-08-01' },
  { ref: '261139000104', title: 'توريد كاميرات مراقبة أمنية', entity: 'جهة هـ', status: 'active', due: '2026-12-10 09:59' }],
  awards: [{ ref: '261139000100', winner: 'شركة رامي قاسم', value: 300000 }, { ref: '261139000101', winner: 'شركة أفاقي لتقنية المعلومات', value: 500000 },
    { ref: '261139000102', winner: 'شركة رامي قاسم', value: 100000 }, { ref: '261139000103', winner: 'مؤسسة لينا حرب', value: 90000 }],
  offers: [{ ref: '261139000100', bidder: 'مؤسسة زيد فارس', price: 250000, tech: 'fail' }, { ref: '261139000100', bidder: 'شركة رامي قاسم', price: 300000, tech: 'pass' },
    { ref: '261139000100', bidder: 'شركة أفاقي لتقنية المعلومات', price: 340000, tech: 'pass' }, { ref: '261139000100', bidder: 'مؤسسة لينا حرب', price: null, tech: 'pass' },
    { ref: '261139000101', bidder: 'شركة أفاقي لتقنية المعلومات', price: 500000, tech: 'pass' }, { ref: '261139000101', bidder: 'شركة رامي قاسم', price: 520000, tech: 'pass' },
    { ref: '261139000102', bidder: 'شركة أفاقي لتقنية المعلومات', price: 90000, tech: 'fail' }, { ref: '261139000102', bidder: 'شركة رامي قاسم', price: 100000, tech: 'pass' }] });
test('v9.61: a tender’s own result — prices ranked among the technically compliant, where AFAQY stood, and who won', () => {
  const R = marketRadar(), r = core.radarResult('261139000100', R);
  assert.equal(r.n, 4); assert.equal(r.winner.name, 'شركة رامي قاسم'); assert.equal(r.winner.us, false);
  assert.deepEqual(r.offers.map((o) => o.bidder), ['شركة رامي قاسم', 'شركة أفاقي لتقنية المعلومات', 'مؤسسة زيد فارس', 'مؤسسة لينا حرب'], 'ranked first; the cheaper non-compliant offer and the one without a price are listed after, unranked');
  assert.equal(r.lowest.price, 300000); assert.equal(r.usRank, 2); assert.equal(r.usOf, 2); assert.equal(r.us.price, 340000);
  const f = core.radarResult('261139000102', R); assert.equal(f.us.tech, 'fail'); assert.equal(f.usRank, null, 'a non-compliant offer has no rank');
  assert.equal(core.radarResult('261139000999', R), null); assert.equal(core.radarResult('', R), null);
});
test('v9.61: the outcome Etimad points to is offered for a tender still open, never for a closed one, and only with a winner', () => {
  const R = marketRadar(), open = { stage: 'submitted' };
  assert.deepEqual(core.tenderOutcome(open, core.radarResult('261139000101', R)), { stage: 'won', value: 500000 });
  assert.deepEqual(core.tenderOutcome(open, core.radarResult('261139000100', R)), { stage: 'lost', winner: 'شركة رامي قاسم', value: 300000, usPrice: 340000, usTech: 'pass', rank: 2, of: 2 });
  assert.equal(core.tenderOutcome({ stage: 'lost' }, core.radarResult('261139000100', R)), null, 'already closed');
  assert.equal(core.tenderOutcome(open, core.radarResult('261139000103', R)), null, 'our offer is not on the list');
  assert.equal(core.tenderOutcome(open, core.radarResult('261139000104', R)), null, 'no winner yet');
});
test('v9.61: similar awarded tenders, with the median award, the usual number of offers and who wins most', () => {
  const R = marketRadar(), m = core.radarSimilar('توريد كاميرات مراقبة أمنية', R, { ref: '261139000104' });
  assert.deepEqual(m.rows.map((r) => r.ref).sort(), ['261139000100', '261139000101', '261139000102'], 'the licence renewal is not similar; the tender itself is not listed');
  assert.equal(m.medianValue, 300000); assert.equal(m.medianBidders, 2); assert.deepEqual(m.wins[0], { name: 'شركة رامي قاسم', n: 2 });
  const r100 = m.rows.find((r) => r.ref === '261139000100'); assert.deepEqual([r100.bidders, r100.low, r100.high, r100.us], [4, 250000, 340000, true]);
  assert.equal(core.radarSimilar('توريد أدوية', R).n, 0);
  const ours = core.radarOurBids(R);
  assert.deepEqual(ours.map((o) => o.ref), ['261139000101', '261139000100', '261139000102'], 'newest first');
  assert.equal(ours[0].winner.us, true); assert.equal(ours[2].us.tech, 'fail');
});

// ---------- v9.61 (ADR-0134): execution, the archive and the year funnel ----------
test('v9.61: Etimad’s work start is read from the pull, and a won tender has a work-start field of its own', () => {
  const x = core.parseRadar({ schema: core.RADAR_SCHEMA, pulledAt: '2026-11-17 08:00', tenders: [{ ref: '261139000100', title: 't', status: 'awarded', workStart: '2026-12-01' }] }, ['261139000100']).tenders[0];   // kept because the register follows it
  assert.equal(x.workStart, '2026-12-01', 'read from the pull');
  assert.equal(core.applyEtimad({ etimadNo: '261139000100', workStart: '' }, x).patch.workStart, undefined, 'v9.62: shown on the card from the pull, never written into the tender');
  assert(core.tenderShownFields({ stage: 'won' }).includes('workStart')); assert(!core.tenderShownFields({ stage: 'prep' }).includes('workStart'));
});
test('v9.61: the year as a funnel — published within scope (West and Kingdom), reached, decided, submitted, won', () => {
  const key = (s) => String(s || '').trim().toLowerCase();
  const R = core.parseRadar({ schema: core.RADAR_SCHEMA, pulledAt: '2026-11-17 08:00', partial: true, tenders: [
    { ref: '261139000001', title: 'توريد كاميرات مراقبة', entity: 'أمانة محافظة جدة', status: 'active', published: '2026-03-01' },
    { ref: '261139000002', title: 'توريد كاميرات مراقبة للمباني', entity: 'أمانة منطقة الرياض', status: 'active', published: '2026-04-01' },
    { ref: '261139000003', title: 'توريد كاميرات حرارية', entity: 'جهة بالمدينة المنورة', status: 'awarded', published: '2026-05-01' },
    { ref: '251139000004', title: 'توريد كاميرات', entity: 'أمانة محافظة جدة', status: 'awarded', published: '2025-05-01' },
    { ref: '261139000005', title: 'توريد أدوية', entity: 'أمانة محافظة جدة', status: 'active', published: '2026-05-01' }] });
  const items = [{ subject: 'a', date: '2026-03-05', stage: 'won', etimadNo: '261139000001' }, { subject: 'b', date: '2026-05-04', stage: 'lost' },
    { subject: 'c', date: '2026-06-01', stage: 'received', studyDecision: 'no-go' }, { subject: 'd', date: '2026-07-01', stage: 'screen' }, { subject: 'e', date: '2025-07-01', stage: 'won' }];
  const f = core.tenderFunnel(items, core.radarMerge(null, R), '2026', key);
  assert.deepEqual([f.published, f.publishedWest, f.reached, f.linked, f.decided, f.submitted, f.won], [3, 2, 4, 1, 3, 2, 1]);
  assert.deepEqual(f.rates, { reached: 200, decided: 75, submitted: 67, won: 50 }); assert.equal(f.partial, true); assert.equal(f.covered.length, 1);
  assert.equal(core.tenderFunnel(items, null, '2026', key).published, 0, 'no radar: nothing published is claimed');
});
test('v9.61: the archive lists every closed tender, newest closure first, and nothing still open', () => {
  const A = core.tenderArchive([{ id: '1', subject: 'a', date: '2026-01-01', stage: 'won', stageAt: '2026-03-01', value: 100, files: [1, 2] }, { id: '2', subject: 'b', date: '2026-02-01', stage: 'prep' },
    { id: '3', subject: 'c', date: '2025-05-01', stage: 'lost', stageAt: '2025-08-01', reason: 'price' }, { id: '4', subject: 'd', date: '2026-04-01', stage: 'missed', stageAt: '2026-04-20' }]);
  assert.deepEqual(A.map((x) => [x.id, x.year, x.files]), [['4', '2026', 0], ['1', '2026', 2], ['3', '2025', 0]]); assert.equal(A[2].reason, 'price'); assert.equal(A[1].value, 100);
});

// v9.69 (ADR-0141): the Analyzer may run on Ollama's cloud, and then the card must not say «no file goes out to the internet»
test('v9.69: the program says when a study would go to the cloud, and the card repeats it', () => {
  const hello = (engine) => core.parseAnalyzerHello({ schema: 'afaqy-analyzer-link/v1', app: 'TenderAnalyzer', version: '3.4.0', engine, busy: false, job: null });
  assert.equal(hello('cloud').engine, 'cloud', 'kept as said: reading it as «local» made the card promise that nothing leaves the computer');
  assert.equal(hello('local').engine, 'local');
  assert.equal(hello('bridge').engine, 'bridge');
  assert.equal(hello('anything else').engine, 'local', 'an unknown word is not a promise of anything');
  assert.equal(core.analyzerNote('cloud'), 'an_note_cloud');
  assert.equal(core.analyzerNote('local'), 'an_note');
  assert.equal(core.analyzerNote(undefined), 'an_note', 'before the program has answered, the plain note');
  for (const lang of ['ar', 'en', 'ur']) {
    const S = STRINGS[lang];
    assert.ok(S.an_note_cloud && S.an_note_cloud.includes('{n}'), `${lang}: the cloud note exists and counts the files`);
    assert.ok(!/no file goes out to the internet|لا يخرج أي ملف إلى الإنترنت|کوئی فائل انٹرنیٹ پر نہیں جاتی/.test(S.an_note), `${lang}: the plain note no longer promises what the program may not keep`);
  }
});
// v9.71 (ADR-0142): one step — a mail dropped on the register is registered and studied. The switch is turned on once, under
// the place the program said the text would go that day; a study never starts by itself toward another place.
test('v9.71: a new tender is studied by itself only when it is safe to start without asking', () => {
  const hello = (engine, busy = false) => core.parseAnalyzerHello({ schema: 'afaqy-analyzer-link/v1', app: 'TenderAnalyzer', version: '3.5.0', engine, busy, job: null });
  assert.equal(hello('api').engine, 'api', 'the key mode is kept as said: read as «local», the card promised that the text stays on the computer');
  assert.equal(core.analyzerNote('api'), 'an_note_api');
  const files = { files: [{ id: 'f1', name: 'كراسة.pdf' }], skipped: 0 }, none = { files: [], skipped: 0 };
  const on = (engine) => core.cleanAnalyzerAuto(JSON.stringify({ on: true, engine }));
  assert.deepEqual(core.cleanAnalyzerAuto(null), { on: false, engine: 'local' }, 'never turned on');
  assert.deepEqual(core.cleanAnalyzerAuto('{broken'), { on: false, engine: 'local' });
  assert.deepEqual(core.cleanAnalyzerAuto(JSON.stringify({ on: true, engine: 'mars' })), { on: true, engine: 'local' }, 'an unknown place is no consent to anything but the computer');
  assert.equal(core.analyzerAuto(core.cleanAnalyzerAuto(null), hello('local'), files), 'off');
  assert.equal(core.analyzerAuto(on('local'), hello('local'), none), 'nofiles', 'a mail with no documents is registered and left alone');
  assert.equal(core.analyzerAuto(on('local'), null, files), 'closed', 'the program does not answer: nothing is opened behind the user\'s back');
  assert.equal(core.analyzerAuto(on('local'), hello('local'), files), 'run');
  assert.equal(core.analyzerAuto(on('local'), hello('cloud'), files), 'ask', 'turned on when the text stayed on the computer: it does not start by itself toward Ollama');
  assert.equal(core.analyzerAuto(on('local'), hello('api'), files), 'ask');
  assert.equal(core.analyzerAuto(on('cloud'), hello('api'), files), 'ask', 'one place agreed to is not another');
  assert.equal(core.analyzerAuto(on('cloud'), hello('cloud'), files), 'run');
  assert.equal(core.analyzerAuto(on('api'), hello('api'), files), 'run');
  assert.equal(core.analyzerAuto(on('api'), hello('local'), files), 'run', 'the computer itself is always inside what was agreed to');
  assert.equal(core.analyzerAuto(on('local'), hello('bridge'), files), 'ask', 'the copy-and-paste way needs the person');
  assert.equal(core.analyzerAutoNote({ on: false, engine: 'local' }), 'an_auto_hint');
  assert.equal(core.analyzerAutoNote(on('local')), 'an_auto_note_local');
  assert.equal(core.analyzerAutoNote(on('cloud')), 'an_auto_note_cloud');
  assert.equal(core.analyzerAutoNote(on('api')), 'an_auto_note_api');
  for (const lang of ['ar', 'en', 'ur']) {
    const S = STRINGS[lang];
    for (const k of ['an_auto', 'an_auto_hint', 'an_auto_note_local', 'an_auto_note_cloud', 'an_auto_note_api', 'an_auto_closed', 'an_auto_changed', 'an_note_api']) assert.ok(S[k] && S[k].length > 20, `${lang}: ${k}`);
    assert.ok(S.an_note_api.includes('{n}'), `${lang}: the key note counts the files`);
  }
});
// v9.73 (ADR-0143): every date of a tender in one agenda — the platform's dates and head office's internal ones — with a notice
test('v9.73: a tender\'s dates, the internal ones included, come out as one agenda', () => {
  const T = { id: 't1', subject: 'كاميرات', stage: 'prep', askDue: '2026-11-26', due: '2026-12-02', dueTime: '11:00', openAt: '2026-12-03', bond: '1%' };
  const m = core.tenderMilestones(T), day = (k) => (m.find((x) => x.key === k) || {}).day;
  assert.deepEqual(m.map((x) => x.key), ['askUp', 'askDue', 'bondCost', 'handover', 'due', 'openAt'], 'in the order of the calendar');
  assert.equal(day('askUp'), '2026-11-25', 'the inquiries go up a working day before their last day');
  assert.equal(day('bondCost'), '2026-11-29', 'three working days before a Wednesday closing is Sunday');
  assert.equal(day('handover'), '2026-11-30');
  assert.equal(m.find((x) => x.key === 'due').time, '11:00');
  assert.ok(!core.tenderMilestones({ ...T, bond: 'لا يوجد' }).some((x) => x.key === 'bondCost'), 'no guarantee asked: no cost to send');
  assert.ok(core.tenderMilestones({ ...T, bond: '' }).some((x) => x.key === 'bondCost'), 'not known yet: the date is kept so it is not missed');
  assert.deepEqual(core.tenderMilestones({ ...T, stage: 'submitted' }).map((x) => x.key), ['openAt'], 'once submitted only the opening is left');
  assert.deepEqual(core.tenderMilestones({ ...T, stage: 'ready', readyOn: '2026-11-28' }).map((x) => x.key), ['due', 'openAt'], 'handed over: the internal dates are done');
  assert.deepEqual(core.tenderMilestones({ ...T, stage: 'lost' }), [], 'a closed tender has no agenda');
  assert.deepEqual(core.tenderMilestones(null), []);
  const A = core.tenderAgenda([T, { id: 't2', subject: 'بصمة', stage: 'decide', askDue: '2026-11-22', due: '2026-12-03', dueTime: '09:59', bond: 'لا يوجد' }, { id: 't3', subject: 'قديمة', stage: 'won', due: '2026-11-24' }], '2026-11-24', 7);
  assert.deepEqual(A.map((x) => `${x.id}:${x.key}:${x.left}:${x.tone}`), ['t1:askUp:1:soon', 't1:askDue:2:soon', 't1:bondCost:5:later', 't1:handover:6:later', 't2:handover:7:later'],
    'the next seven days, nearest first; a platform date already past is history, and a closed tender is not in');
  const late = core.tenderAgenda([T], '2026-12-01', 7);
  assert.deepEqual(late.map((x) => `${x.key}:${x.left}:${x.tone}`), ['bondCost:-2:late', 'handover:-1:late', 'due:1:soon', 'openAt:2:soon'], 'an internal date missed while the tender is still open stays on top, in red');
  assert.equal(core.tenderAgenda([T], '2026-11-25', 7)[0].tone, 'today');
  const due = core.tenderNotices(core.tenderAgenda([T], '2026-11-25', 14), ['t1:askUp:2026-11-25']);
  assert.deepEqual(due.map((x) => x.key), [], 'v9.76: the upload day was said, and it carried the deadline with it — not said again the next day');
  const due2 = core.tenderNotices(core.tenderAgenda([T], '2026-11-25', 14), []);
  assert.deepEqual(due2.map((x) => `${x.key}+${x.also ? x.also.key : ''}`), ['askUp+askDue'], 'one notice for the upload day and the deadline after it');
  assert.equal(core.tenderNoticeId(due2[0].also), 't1:askDue:2026-11-26');
  for (const lang of ['ar', 'en', 'ur']) for (const k of ['td_col_askUp', 'td_col_bondCost', 'ag_h', 'ag_empty', 'ag_today', 'ag_tomorrow', 'ag_late', 'ag_bell', 'ag_bell_on', 'ag_bell_note', 'ag_bell_denied', 'ag_ics', 'ag_notice', 'ag_days'])
    assert.ok(STRINGS[lang][k], `${lang}: ${k}`);
});
// v9.75 (ADR-0145): Power Automate saves each tender mail as a file in a folder synced to the computer; the register reads that
// folder. Which files are new is decided here: mails only, never a hidden or half-written one, oldest first, a few at a time.
test('v9.75: the mail folder gives the register only new mails, oldest first, a few at a time', () => {
  const names = ['2026-11-21_090500_b.eml', '2026-11-20_181500_a.EML', 'desktop.ini', '~$draft.msg', '.sync.eml', 'old-tender.msg', 'x.eml.tmp', 'notes.txt', '2026-11-21_101000_c.eml'];
  const r = core.mailDirNew(names, ['old-tender.msg'], 2);
  assert.deepEqual(r.fresh, ['2026-11-20_181500_a.EML', '2026-11-21_090500_b.eml'], 'mails only, the flow\'s names sort oldest first, two at a time');
  assert.equal(r.waiting, 1, 'the third new mail waits for the next round');
  assert.equal(r.mails, 4, 'four mails in the folder: no hidden file, no temporary one, no other kind');
  assert.deepEqual(core.mailDirNew(names, [...names], 10).fresh, [], 'everything seen: nothing to read');
  assert.deepEqual(core.mailDirNew(null, null).fresh, [], 'an empty folder');
  assert.equal(core.mailDirNew(names, []).fresh.length, 4, 'ten at a time by default');
  assert.deepEqual(core.mailDirSeen(['gone.eml', 'old-tender.msg'], names, ['2026-11-21_090500_b.eml', '2026-11-21_090500_b.eml']),
    ['old-tender.msg', '2026-11-21_090500_b.eml'], 'what left the folder is forgotten, what was read is kept, once');
  assert.equal(core.MAILDIR_ASK, 25, 'a folder that already holds more mails than this asks before it reads them all');
  for (const lang of ['ar', 'en', 'ur']) for (const k of ['md_connect', 'md_how', 'md_allow', 'md_read', 'md_off', 'md_on', 'md_last', 'md_none', 'md_new', 'md_wait', 'md_ask', 'md_ask_all', 'md_ask_new', 'md_hint', 'md_allow_hint', 'md_lost', 'md_unsupported', 'md_done', 'md_h', 'md_lead', 'md_s1', 'md_s2', 'md_s3', 'md_s4', 'md_s5', 'md_s6', 'md_s7', 'md_note', 'md_name_h', 'md_copy', 'md_copied', 'md_private', 'an_auto_on_closed'])
    assert.ok(STRINGS[lang][k], `${lang}: ${k}`);
});
// v9.76 (ADR-0146): «Check the folder» — every mail file in the folder said against the register, so «were all of them read?» has
// an answer; and a mail that could not be registered is kept by name with its reason instead of being forgotten.
test('v9.76: the mail folder checked against the register, and the mails that could not be registered kept with their reason', () => {
  const items = [{ id: 'a', subject: 'Cameras', messages: [{ key: 'id:<m1>', hash: 'h1' }, { key: 'id:<m2>', hash: 'h2' }] }, { id: 'b', subject: 'Fuel', messages: [{ key: 'sha:h3', hash: 'h3' }] }];
  const files = [
    { name: '2026-11-20_0900_a.eml', size: 10, key: 'id:<m1>', hash: 'h1' },
    { name: '2026-11-20_0905_b.eml', size: 10, key: 'id:<m1>', hash: 'hx' },   // the same mail saved by both flows
    { name: '2026-11-20_0910_c.eml', size: 10, key: 'sha:h3', hash: 'h3' },
    { name: '2026-11-20_0915_d.eml', size: 10, key: 'id:<m9>', hash: 'h9' },   // read, not in the register: it failed
    { name: '2026-11-20_0920_e.eml', size: 10, key: 'id:<m8>', hash: 'h8' },   // read, not in the register, no failure on record
    { name: '2026-11-20_0925_f.eml', size: 10, key: 'id:<m7>', hash: 'h7' },   // not read yet
    { name: '2026-11-20_0930_g.eml', size: 0 },                                 // still being written
    { name: '2026-11-20_0935_h.eml', size: 10, bad: true },                      // the reader could not open it
    { name: 'desktop.ini', size: 10 }, { name: '~$lock.eml', size: 10 }];
  const seen = files.map((f) => f.name).filter((n) => !n.includes('_f.') && !n.includes('_g.'));
  const r = core.mailDirReport(files, items, seen, [{ name: '2026-11-20_0915_d.eml', key: 'td_mail_ambiguous' }]);
  assert.deepEqual(r.rows.map((x) => x.status), ['in', 'same', 'in', 'out', 'out', 'wait', 'empty', 'bad'], 'one row per mail, in the folder\'s order; other files are not mails');
  assert.deepEqual([r.rows[0].id, r.rows[1].id, r.rows[2].subject], ['a', 'a', 'Fuel'], 'a mail in the register names its tender, a second copy too');
  assert.equal(r.rows[3].why, 'td_mail_ambiguous', 'a mail that failed says why');
  assert.equal(r.rows[4].why, 'md_ck_gone', 'read but not in the register, no failure kept: removed from the register since, or never registered');
  assert.deepEqual(r.n, { mails: 8, in: 2, same: 1, tenders: 2, out: 2, wait: 1, empty: 1, bad: 1 }, 'the counts the window opens with');
  assert.deepEqual(core.mailDirReport(null, null, null, null).n, { mails: 0, in: 0, same: 0, tenders: 0, out: 0, wait: 0, empty: 0, bad: 0 });
  // what failed is kept by name until it leaves the folder or is registered
  const kept = core.mailDirFailed([{ name: 'gone.eml', key: 'td_mail_failed' }, { name: 'x.eml', key: 'td_mail_failed' }, { name: 'y.eml', key: 'td_mail_missing_date' }],
    ['x.eml', 'y.eml', 'z.eml'], [{ name: 'x.eml', kind: 'a' }, { name: 'z.eml', kind: 'f', key: 'td_mail_ambiguous' }]);
  assert.deepEqual(kept, [{ name: 'y.eml', key: 'td_mail_missing_date' }, { name: 'z.eml', key: 'td_mail_ambiguous' }], 'left the folder: forgotten; registered now: forgotten; a new failure: kept');
  assert.deepEqual(core.mailDirFailed(null, null, null), []);
  // the booklet's own Hijri dates table, as pdf.js gives it (letters reversed and spaced, the day glued to the year) and as a clean copy
  const bk = core.bookletHijriSchedule(['1448 / 06 / 08   : ﺔ ﺳ ا ﺮ ﻜ ﻟ ح ا ﺮ ﻃ   ﺦ ﻳ ر ﺎ ﺗ', '131448 / 06 /   رات ﺎ ﺴ ﻔ ﺘ ﺳ والا   ﺔ ﻠ ﺌ ﺳ ل الأ ﺎ ﺳ إر',
    '231448 / 06 /   وض ﺮ ﻌ ﻟ ا   ﻢ ﻳ ﺪ ﻘ ﺗ', '   فتح العروض', '221448 / 09 /   ﺔ ﻴ ﺳ ﺮ ﺘ ﻟ ا', '22 ص   09:00 1448 / 06 /   ﻢ ﻴ ﻠ ﺴ ﺘ ﻟ ا   ﺖ ﻗ و', '33 الأسئلة والاستفسارات'].join('\n'));
  assert.deepEqual(bk, { askDue: [{ date: '2026-11-23', hijri: '1448-06-13' }], due: [{ date: '2026-12-03', hijri: '1448-06-23' }], openAt: [] }, 'the inquiries and the submission rows; the empty opening row, the award, the paper delivery and the contents page give nothing');
  assert.deepEqual(core.bookletHijriSchedule('تقديم العروض 20/06/1448\nإرسال الأسئلة والاستفسارات 05/06/1448').due, [{ date: '2026-11-30', hijri: '1448-06-20' }], 'a clean copy: day, month, year');
  assert.deepEqual(core.bookletHijriSchedule('إرسال الأسئلة والاستفسارات 05/06/1448').askDue, [], 'day and month both possible both ways: not guessed');
  assert.deepEqual(core.tenderDocumentInsights([{ text: '231448 / 06 /   وض ﺮ ﻌ ﻟ ا   ﻢ ﻳ ﺪ ﻘ ﺗ', locator: '3' }]).schedule.due, [{ date: '2026-12-03', time: '', locator: '3' }], 'a booklet dropped on a tender offers its submission date for review');
  for (const lang of ['ar', 'en', 'ur']) for (const k of ['ag_also', 'md_ck', 'md_ck_h', 'md_ck_reading', 'md_ck_sum', 'md_ck_all_in', 'md_ck_in', 'md_ck_same', 'md_ck_out', 'md_ck_wait', 'md_ck_empty', 'md_ck_bad', 'md_ck_gone', 'md_ck_reg', 'md_ck_copy', 'md_ck_copied', 'md_ck_open', 'md_ck_none', 'md_failed', 'md_ck_col_file', 'md_ck_col_state', 'md_ck_col_tender', 'td_busy_card'])
    assert.ok(STRINGS[lang][k], `${lang}: ${k}`);
});
// v9.77 (ADR-0147): «Read the booklets again» — the open tenders' files read again with today's reader; what it changed is said.
test('v9.77: reading the booklets again says which dates changed and which wait for a choice', () => {
  const before = new Map([['a', { due: '2026-11-19', dueTime: '', askDue: '', askDueTime: '' }], ['b', { due: '2026-12-03', dueTime: '10:00' }], ['c', { due: '2026-11-17', dueTime: '10:00' }]]);
  const book = (field, date) => ({ id: 'f', name: 'booklet.pdf', analysis: { schedule: { [field]: [{ date, time: '', locator: '3' }] } } });
  const items = [
    { id: 'a', subject: 'Dash cams', due: '2026-11-30', dueTime: '', askDue: '2026-11-25', askDueTime: '', files: [book('due', '2026-11-30')] },
    { id: 'b', subject: 'Fingerprint', due: '2026-12-03', dueTime: '10:00', files: [] },
    { id: 'c', subject: 'Fuel', due: '', dueTime: '', messages: [{ key: 'k', subject: 'mail', schedule: { due: [{ date: '2026-11-17', time: '10:00' }] } }], files: [book('due', '2026-11-19')] },
    { id: 'd', subject: 'Not read', due: '2026-12-09' }];
  const r = core.tenderDateChanges(before, items);
  assert.deepEqual(r.map((x) => x.id), ['a', 'c'], 'only the tenders read and touched; one that did not change is not listed');
  assert.deepEqual(r[0].changed, [{ field: 'due', was: '2026-11-19', now: '2026-11-30' }, { field: 'askDue', was: '', now: '2026-11-25' }], 'a date put right and one found');
  assert.deepEqual(r[0].review, []);
  assert.deepEqual([r[1].changed, r[1].review], [[], ['due']], 'the mail and the booklet disagree: the field waits for a choice in the card, it is not «changed»');
  assert.deepEqual(core.tenderDateChanges(null, null), []);
  for (const lang of ['ar', 'en', 'ur']) for (const k of ['td_rr', 'td_rr_h', 'td_rr_sum', 'td_rr_none', 'td_rr_changed', 'td_rr_review', 'td_rr_nofiles', 'td_rr_reading'])
    assert.ok(STRINGS[lang][k], `${lang}: ${k}`);
});
// v9.78 (ADR-0148): the strip shows a tender once, on its nearest date, carrying the dates after it; and a reminder can be moved
// to another day (dragged, or picked) without touching the platform's date.
test('v9.78: one card per tender on the strip, and a reminder moved to another day', () => {
  const T = { id: 't1', subject: 'كاميرات', stage: 'prep', askDue: '2026-11-26', due: '2026-12-03', dueTime: '11:00', bond: '5%' };
  const A = core.tenderAgenda([T, { id: 't2', subject: 'بصمة', stage: 'decide', askDue: '2026-11-25', due: '2026-12-10' }], '2026-11-24', 14);
  const G = core.agendaByTender(A);
  assert.deepEqual(G.map((x) => `${x.id}:${x.key}`), ['t2:askUp', 't1:askUp'], 'each tender once, on its nearest date, nearest first');
  assert.deepEqual(G[1].later.map((x) => x.key), ['askDue', 'bondCost', 'handover', 'due'], 'the dates after it ride inside its card');
  // moved: the upload reminder of t1 from 25 Nov to 30 Nov — the platform's deadline stays 26 Nov
  const mv = core.tenderAgendaMove(T, 'askUp', '2026-11-25', '2026-11-30');
  assert.deepEqual(mv, { askUp: { from: '2026-11-25', to: '2026-11-30' } });
  const M = core.tenderMilestones({ ...T, agendaMoves: mv });
  assert.deepEqual(M.filter((x) => x.key === 'askUp' || x.key === 'askDue').map((x) => `${x.key}:${x.day}:${x.from || ''}`), ['askDue:2026-11-26:', 'askUp:2026-11-30:2026-11-25'], 'the reminder sits on its new day and remembers where it came from; the deadline does not move');
  assert.deepEqual(core.tenderAgendaMove({ ...T, agendaMoves: mv }, 'askUp', '2026-11-25', '2026-11-25'), {}, 'moved back to its own day: the move is forgotten');
  // the date under it changed (an extension): the old move no longer applies
  assert.equal(core.tenderMilestones({ ...T, askDue: '2026-12-01', agendaMoves: mv }).find((x) => x.key === 'askUp').from, undefined, 'a move made for another date is dropped when that date changes');
  assert.deepEqual(core.agendaByTender(null), []);
  assert.deepEqual(core.cleanTenderDetails({ id: 'x', subject: 's', date: '2026-11-20', agendaMoves: { askUp: { from: '2026-11-25', to: '2026-11-30' }, bad: { from: '2026-11-25', to: '2026-11-30' }, due: { from: 'x', to: '2026-11-30' } } }).agendaMoves,
    { askUp: { from: '2026-11-25', to: '2026-11-30' } }, 'kept when the register is saved; anything else is dropped');
  for (const lang of ['ar', 'en', 'ur']) for (const k of ['ag_then', 'ag_move', 'ag_moved', 'ag_unmove', 'ag_drop', 'ag_moved_toast', 'ag_none_day'])
    assert.ok(STRINGS[lang][k], `${lang}: ${k}`);
});
// v9.79 (ADR-0149): the backup and the sync file without one giant string — a ZIP of files, its pieces built and read here.
test('v9.79: a ZIP the backup is written in and read back, and the sync file sealed in pieces', () => {
  const enc = new TextEncoder();
  assert.equal(core.crc32(enc.encode('123456789')), 0xCBF43926, 'the CRC every ZIP reader checks');
  assert.equal(core.crc32(enc.encode('56789'), core.crc32(enc.encode('1234'))), 0xCBF43926, 'carried across pieces');
  // two entries — a stored file with an Arabic name, and a second one — then the directory, read back the way the page reads a file
  const a = enc.encode('%PDF-1.7 كراسة'), b = new Uint8Array([0, 1, 2, 250, 251, 252]);
  const e1 = { name: 'files/0001_كراسة الشروط.pdf', crc: core.crc32(a), size: a.length, method: 0, offset: 0 };
  const h1 = core.zipLocalHeader(e1), e2 = { name: 'files/0002_boq.xlsx', crc: core.crc32(b), size: b.length, method: 0, offset: h1.length + a.length };
  const h2 = core.zipLocalHeader(e2), dir = core.zipDirectory([e1, e2], e2.offset + h2.length + b.length);
  const zip = new Uint8Array([...h1, ...a, ...h2, ...b, ...dir]);
  assert.equal(new DataView(h1.buffer).getUint16(6, true) & 0x0800, 0x0800, 'names are marked UTF-8, so Windows shows Arabic names right');
  const end = core.zipFindEnd(zip.slice(-100), zip.length);
  assert.deepEqual([end.count, end.offset], [2, e2.offset + h2.length + b.length]);
  const list = core.zipEntries(zip.slice(end.offset, end.offset + end.size), end.count);
  assert.deepEqual(list.map((x) => [x.name, x.size, x.crc]), [[e1.name, a.length, e1.crc], [e2.name, b.length, e2.crc]]);
  const start = list[0].offset + core.zipDataStart(zip.slice(list[0].offset, list[0].offset + 30));
  assert.deepEqual([...zip.slice(start, start + list[0].csize)], [...a], 'a stored file is its own bytes, unchanged');
  assert.equal(core.zipFindEnd(new Uint8Array(40), 40), null, 'not a ZIP');
  assert.throws(() => core.zipLocalHeader({ name: 'x', crc: 0, size: 2 ** 32 }), /zip_too_big/, 'a file over 4 GB is refused, never written wrong');
  assert.equal(core.zipSafeName('a/b\\c:d*?"<>|.pdf'), 'a_b_c_d_.pdf');
  assert.equal(core.zipSafeName(''), 'file');
  // the sync file's pieces: each its own IV, and the last one marked, so a piece moved or cut off does not open
  const nonce = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), p0 = core.syncPieceIv(nonce, 0, false), p1 = core.syncPieceIv(nonce, 1, true);
  assert.notDeepEqual([...p0.iv], [...p1.iv]); assert.deepEqual([...p1.aad], [0, 0, 0, 1, 1]); assert.equal(core.SYNC_PIECE, 4 * 1048576);
  for (const lang of ['ar', 'en', 'ur']) for (const k of ['bk_building', 'bk_failed', 'bk_not_file', 'zip_too_big', 'bk_usage'])
    assert.ok(STRINGS[lang][k], `${lang}: ${k}`);
});
test('v9.83: the analyzer page downloads 3.7.2 and names the files it now writes', () => {
  const page = readFileSync(new URL('../tender-analyzer.html', import.meta.url), 'utf8');
  const link = 'IQChn8x4ZUkzSJVdTTsM8XNJAcopDqrEYPGdGNEabBt6q4k';
  assert.equal(page.split(link).length - 1, 2, 'the header button and the install step both point at 3.7.2');
  assert.ok(!page.includes('IQCb5C6IN4qRSqqUqBkSCB3LAcmcVg2U') && !page.includes('IQDdtynmxL_6S4Efi3dCGrwRARIOC') && !page.includes('IQAgyJcj5y0fT6dgEKIc2YjUAbscQ'), 'no link to an older version is left');
  for (const f of ['_Study_AR.docx', '_Study_EN.docx', '_Inquiries_AR.docx', '_BOQ_Priced_EN.xlsx', '_Offer_AR.pptx', '.tender-study.json'])
    assert.ok(page.includes(f), f);
  assert.ok(page.includes('السجلات والشهادات'), 'the certificates in the offer are described');
});
test('v9.84: «اشتراكاتي» is a place the card names, and a date read twice says whether the two readings meet', () => {
  assert.equal(core.parseAnalyzerHello({ schema: core.ANALYZER.schema, app: 'TenderAnalyzer', engine: 'subs' }).engine, 'subs', 'the program says «subs»');
  assert.equal(core.analyzerNote('subs'), 'an_note_subs', 'the card says the text goes to the user\'s own subscriptions');
  assert.equal(core.analyzerAuto({ on: true, engine: 'subs' }, { engine: 'subs' }, { files: [1] }), 'run', 'agreed once for «subs»: a new tender is studied by itself');
  assert.equal(core.analyzerAuto({ on: true, engine: 'local' }, { engine: 'subs' }, { files: [1] }), 'ask', 'agreed for the computer only: «subs» is asked first');
  const checks = { due: { agree: true, other: '', by: 'claude' }, askDue: { agree: false, other: '2026-11-26', by: 'claude' }, visit: { agree: false, other: '2026-11-20', by: 'gemini' },
    openAt: { agree: 'yes', other: '', by: 'claude' }, bogus: { agree: true, other: '', by: 'claude' } };
  const clean = core.cleanDateChecks(checks);
  assert.deepEqual(Object.keys(clean).sort(), ['askDue', 'due', 'visit'], 'only the four dates, only well-formed');
  const study = { schema: 'afaqy-tender-study/v1', tenders: [{ subject: 'كاميرات', etimadNo: '261139005826', dates: { due: { date: '2026-11-30', time: '' }, askDue: { date: '2026-11-25', time: '' } }, evidence: {}, checks }] };
  const parsed = core.parseTenderStudy(study).tenders[0];
  assert.deepEqual(parsed.checks, clean, 'the study file carries them in');
  const { patch } = core.applyTenderStudy({ id: 'x', due: '', askDue: '', dateSources: {} }, parsed);
  assert.deepEqual(patch.dateChecks, clean, 'the tender keeps them');
  const item = { ...core.cleanTenderDetails({ ...patch }), due: '2026-11-30', askDue: '2026-11-25', visit: '' };
  assert.deepEqual(item.dateChecks, clean, 'kept through the store');
  assert.equal(core.dateCheckTag(item, 'due').kind, 'agree');
  assert.deepEqual(core.dateCheckTag(item, 'askDue'), { kind: 'differ', by: 'claude', other: '2026-11-26' });
  assert.deepEqual(core.dateCheckTag(item, 'visit'), { kind: 'missing', by: 'gemini', other: '2026-11-20' }, 'the study found none: the second reading is offered');
  assert.equal(core.dateCheckTag({ ...item, dateSources: { askDue: 'manual' } }, 'askDue'), null, 'typed by hand: the manager decided, no mark');
  assert.equal(core.dateCheckTag({ ...item, askDue: '2026-11-26' }, 'askDue'), null, 'set to the second reading: nothing left to settle');
  assert.equal(core.applyTenderStudy({ ...item }, { ...parsed }).patch.dateChecks, undefined, 'the same study again changes nothing');
  for (const lang of ['ar', 'en', 'ur']) for (const k of ['an_note_subs', 'an_auto_note_subs', 'an_by_gemini', 'an_by_claude', 'an_by_codex', 'td_chk_agree', 'td_chk_differ', 'td_chk_missing', 'td_chk_agree_t', 'td_chk_bad_t'])
    assert.ok(STRINGS[lang][k], `${lang}: ${k}`);
});
// ---------- v9.85 (ADR-0152): the offer handed to the tenders team, read from the mail ----------
const HO_TEAM = (a) => String(a).toLowerCase() === 'tenders.team@example.com';
test('a mail from the branch carrying the offer deck and the priced BOQ hands the offer over; the tenders team\'s own mail does not', () => {
  const names = ['Supply of dash cams - Health Affairs.pptx', 'AFAQY_DashCam_BOQ_Priced_AR.xlsx', 'Datasheet.pdf'];
  assert.equal(core.mailHandsOver('m.ali@example.com', names, HO_TEAM), true);
  assert.equal(core.mailHandsOver('tenders.team@example.com', names, HO_TEAM), false, 'the tenders team sends tenders, it does not hand them over');
  assert.equal(core.mailHandsOver('m.ali@example.com', ['Offer.pptx', 'Datasheet.pdf'], HO_TEAM), false, 'no priced BOQ: not the whole offer');
  assert.equal(core.mailHandsOver('m.ali@example.com', ['BOQ.xlsx'], HO_TEAM), false, 'a BOQ alone is not the offer');
  assert.equal(core.mailHandsOver('', names, HO_TEAM), false);
});
test('the hand-over mail finds its tender by the Etimad number, else by the words of its subject and file names — and only when one tender stands out', () => {
  const items = [
    { id: 'a', subject: 'توريد وتركيب كاميرات مراقبة لفرع الوزارة بمنطقة جازان', stage: 'prep', etimadNo: '' },
    { id: 'b', subject: 'توريد وتركيب حساسات قياس مستوى الوقود لمحطة الإمداد', stage: 'prep', etimadNo: '260939000999' },
    { id: 'c', subject: 'توريد وتركيب كاميرات مراقبة لفرع الوزارة بمنطقة نجران', stage: 'prep', etimadNo: '' },
    { id: 'd', subject: 'توريد وتركيب كاميرات مراقبة لفرع الوزارة بمنطقة جازان', stage: 'lost', etimadNo: '' },
  ];
  assert.equal(core.tenderForHandover(items, 'الملفات النهائية - منافسة 260939000999', ['Offer.pptx', 'BOQ.xlsx']), 'b', 'the number decides');
  assert.equal(core.tenderForHandover(items, 'FW: ملفات العرض', ['توريد وتركيب كاميرات مراقبة لفرع الوزارة بمنطقة جازان.pptx', 'BOQ.xlsx']), 'a', 'the deck is named after the tender; a closed tender is not a candidate');
  assert.equal(core.tenderForHandover(items, 'الملفات النهائية لمنافسة كاميرات المراقبة', ['Offer.pptx', 'BOQ.xlsx']), null, 'Jazan and Najran both fit: nothing is guessed');
  assert.equal(core.tenderForHandover(items, 'RE: عرض حساسات الوقود لمحطة الإمداد', ['a.pptx', 'b.xlsx']), 'b');
  assert.equal(core.tenderForHandover(items, 'ملفات', ['a.pptx', 'b.xlsx']), null);
});
test('the hand-over moves the tender to «submitted» on the mail\'s day and marks the message; a tender already past it keeps its stage', () => {
  const item = { id: 'a', subject: 'x', stage: 'prep', readyOn: '', submittedOn: '', decidedOn: '2026-11-10',
    thread: [{ at: '2026-11-10T09:00', name: 'Tenders', addr: 'tenders.team@example.com', text: 'booklet' }, { at: '2026-11-22T14:05', name: 'M Ali', addr: 'm.ali@example.com', text: 'files attached' }] };
  const p = core.tenderHandoverPatch(item, { at: '2026-11-22T14:05', addr: 'm.ali@example.com', name: 'M Ali' });
  assert.equal(p.stage, 'submitted'); assert.equal(p.submittedOn, '2026-11-22'); assert.equal(p.readyOn, '2026-11-22'); assert.equal(p.stageAt, '2026-11-22');
  assert.deepEqual(p.thread.map((e) => e.mark || ''), ['', 'handover']);
  assert.equal(core.tenderThreadFacts({ ...item, ...p }).handover.at, '2026-11-22T14:05');
  const won = core.tenderHandoverPatch({ ...item, stage: 'won', submittedOn: '2026-11-20' }, { at: '2026-11-22T14:05', addr: 'm.ali@example.com' });
  assert.equal(won.stage, undefined); assert.equal(won.submittedOn, undefined); assert.equal(won.thread[1].mark, 'handover', 'the message is still marked');
  const kept = core.tenderHandoverPatch({ ...item, readyOn: '2026-11-21' }, { at: '2026-11-22T14:05', addr: 'm.ali@example.com' });
  assert.equal(kept.readyOn, '2026-11-21', 'an earlier «ready» day stays');
});
test('a hand-over mail registered before v9.85 as a tender of its own is moved into the tender it belongs to', () => {
  const team = { id: 'a', subject: 'توريد وتركيب كاميرات مراقبة لفرع الوزارة بمنطقة جازان', stage: 'prep', date: '2026-11-10', from: 'tenders.team@example.com',
    messages: [{ key: 'id:1', sender: 'tenders.team@example.com', date: '2026-11-10' }], files: [{ id: 'f1', name: 'booklet.pdf', kind: 'booklet' }],
    thread: [{ at: '2026-11-10T09:00', name: 'Tenders', addr: 'tenders.team@example.com', text: 'booklet' }], activity: [] };
  const stray = { id: 'الملفات النهائيه', subject: 'الملفات النهائية', stage: 'received', date: '2026-11-22', from: 'm.ali@example.com',
    messages: [{ key: 'id:2', sender: 'm.ali@example.com', date: '2026-11-22' }],
    files: [{ id: 'f2', name: 'mail.eml', kind: 'original' }, { id: 'f3', name: 'توريد وتركيب كاميرات مراقبة لفرع الوزارة بمنطقة جازان.pptx', kind: 'other' }, { id: 'f4', name: 'BOQ.xlsx', kind: 'sheet' }],
    thread: [{ at: '2026-11-22T14:05', name: 'M Ali', addr: 'm.ali@example.com', text: 'files attached' }], activity: [] };
  const other = { id: 'z', subject: 'ملاحظة', stage: 'received', date: '2026-11-21', from: 'x@example.com', messages: [{ key: 'id:3', sender: 'x@example.com' }], files: [], thread: [] };
  const r = core.tenderHandoverRelink([stray, team, other], HO_TEAM);
  assert.deepEqual(r.moved, [{ from: 'الملفات النهائيه', to: 'a' }]);
  assert.deepEqual(r.items.map((i) => i.id), ['a', 'z'], 'the stray card is gone, the unrelated one stays');
  const a = r.items[0];
  assert.equal(a.stage, 'submitted'); assert.equal(a.submittedOn, '2026-11-22');
  assert.deepEqual(a.messages.map((m) => m.key), ['id:1', 'id:2']);
  assert.deepEqual(a.files.map((f) => [f.id, f.kind]), [['f1', 'booklet'], ['f2', 'original'], ['f3', 'offer'], ['f4', 'boq']]);
  assert.deepEqual(a.thread.map((e) => [e.at, e.mark || '']), [['2026-11-10T09:00', ''], ['2026-11-22T14:05', 'handover']]);
  assert.equal(core.tenderHandoverRelink(r.items, HO_TEAM).moved.length, 0, 'run again: nothing moves');
});

test('the hand-over\'s two history lines survive a reload and a backup (the register keeps only actions it knows)', () => {
  const at = '2026-11-22T11:05:00.000Z';
  const kept = core.cleanTenderDetails({ id: 'a', subject: 'x', date: '2026-11-10', activity: [{ id: '1', action: 'handover', label: 'Sample Engineer', at }, { id: '2', action: 'relinked', label: 'Final files', at }] });
  assert.deepEqual(kept.activity.map((e) => e.action), ['handover', 'relinked']);
});

// v9.86 (ADR-0153): the history by the day things happened
test('a tender\'s history is by the mails\' own times, oldest first, with who wrote each — even for lines saved before v9.86', () => {
  // as 9.85 saved it: lines newest first, each stamped when the manager imported it (all on 23 Nov), not when the mail was written
  const item = { id: 'a', subject: 'Fuel sensors', date: '2026-07-03',
    messages: [{ key: '1', subject: 'Fuel sensors', sender: 'desk@example.com', date: '2026-07-03' }, { key: '2', subject: 'RE: Fuel sensors', sender: 'eng@example.com', date: '2026-07-20' }, { key: '3', subject: 'Final files', sender: 'me@example.com', date: '2026-08-02' }],
    thread: [{ at: '2026-07-03T09:10', name: 'Tenders Desk', addr: 'desk@example.com', text: 'booklet' }, { at: '2026-07-20T13:00', name: 'Eng Ali', addr: 'eng@example.com', text: 'q' }, { at: '2026-08-02T15:30', name: 'Safwat', addr: 'me@example.com', text: 'files', mark: 'handover' }],
    activity: [{ id: 'h', action: 'handover', label: 'Safwat', at: '2026-11-23T08:03:00.000Z' }, { id: 'e3', action: 'email', label: 'Final files', at: '2026-11-23T08:03:00.000Z' },
      { id: 'n', action: 'stage', label: 'prep', at: '2026-07-21T07:00:00.000Z' }, { id: 'e2', action: 'email', label: 'RE: Fuel sensors', at: '2026-11-23T08:02:00.000Z' }, { id: 'e1', action: 'email', label: 'Fuel sensors', at: '2026-11-23T08:01:00.000Z' }] };
  const h = core.tenderHistory(item);
  assert.deepEqual(h.map((r) => [r.action, r.at, r.who]), [['email', '2026-07-03T09:10', 'Tenders Desk'], ['email', '2026-07-20T13:00', 'Eng Ali'], ['stage', '2026-07-21T10:00', ''], ['email', '2026-08-02T15:30', 'Safwat'], ['handover', '2026-08-02T15:30', 'Safwat']]);
  // from v9.86 a line carries the mail's time itself
  const now = core.tenderHistory({ messages: [], thread: [], activity: [{ id: 'x', action: 'email', label: 'S', at: '2026-11-23T08:00:00.000Z', mailAt: '2026-07-05T08:00', who: 'Desk' }] });
  assert.deepEqual(now.map((r) => [r.at, r.who]), [['2026-07-05T08:00', 'Desk']]);
});
test('the mail\'s own time and writer survive a reload; mails of a day are counted by the mail\'s own day', () => {
  const c = core.cleanTenderDetails({ id: 'a', subject: 'x', date: '2026-11-10', messages: [{ key: 'k', at: '2026-11-23T09:15', name: 'Moamen', date: '2026-11-23' }],
    activity: [{ id: '1', action: 'email', label: 's', at: '2026-11-23T06:15:00.000Z', mailAt: '2026-11-23T09:15', who: 'Moamen' }] });
  assert.equal(c.messages[0].at, '2026-11-23T09:15'); assert.equal(c.messages[0].name, 'Moamen');
  assert.equal(c.activity[0].mailAt, '2026-11-23T09:15'); assert.equal(c.activity[0].who, 'Moamen');
  const items = [{ id: 'a', messages: [{ at: '2026-11-23T09:15', date: '2026-11-23' }, { date: '2026-11-22' }] }, { id: 'b', messages: [{ date: '2026-11-23' }] }, { id: 'c', messages: [] }];
  assert.deepEqual(core.mailsOnDay(items, '2026-11-23'), { mails: 2, tenders: 2 });
});
test('the register from a day: the tenders that arrived on or after it, oldest first, with what their mails say', () => {
  const items = [{ id: 'n', date: '2026-11-20' }, { id: 'j', date: '2026-06-30' }, { id: 'k', date: '2026-07-01' }];
  assert.deepEqual(core.tendersFrom(items, '2026-07-01').map((i) => i.id), ['k', 'n']);
  const f = core.tenderMailFacts({ messages: [{ sender: 'desk@example.com', date: '2026-07-01' }, { sender: 'me@example.com', date: '2026-07-09' }],
    thread: [{ at: '2026-07-01T10:00', name: 'Desk', addr: 'desk@example.com' }, { at: '2026-07-09T16:00', name: 'Safwat', addr: 'me@example.com', mark: 'handover' }] });
  assert.deepEqual(f, { mails: 2, first: { at: '2026-07-01T10:00', who: 'Desk' }, last: { at: '2026-07-09T16:00', who: 'Safwat' }, handover: { at: '2026-07-09T16:00', who: 'Safwat' } });
});

// v9.87 (ADR-0154): only tenders are registered, each once
test('a mail\'s Etimad reference is read from its subject, its file names or its text — and only when it is one number', () => {
  assert.equal(core.mailEtimadRef('RE: منافسة بالرقم المرجعي 261139004470', [], ''), '261139004470');
  assert.equal(core.mailEtimadRef('Fw: كاميرات', ['كراسة منافسة 261139003078.pdf', 'BOQ.xlsx'], ''), '261139003078');
  assert.equal(core.mailEtimadRef('Fw: كاميرات', [], 'الرقم المرجعي: ٢٦١٠٣٩٠٠٣٦٣٤ ... +966 58 150 0057'), '261039003634');
  assert.equal(core.mailEtimadRef('x', [], 'two tenders 261139002122 and 261139002820'), '');   // two numbers: not this mail's own
  assert.equal(core.mailEtimadRef('call 966581500057', [], ''), '');                             // a phone number is not a reference
});
test('a mail starts a tender only when something in it says «tender»', () => {
  const no = { subject: 'Terminated clients process', names: [], number: '', booklet: false, fromTeam: false, threadHasTeam: false };
  assert.equal(core.mailIsTender(no), false);
  assert.equal(core.mailIsTender({ ...no, subject: 'ملاحظات على نظام افاقي', names: ['image001.png', 'invoice.pdf'] }), false);
  assert.equal(core.mailIsTender({ ...no, number: '261139004470' }), true);
  assert.equal(core.mailIsTender({ ...no, booklet: true }), true);
  assert.equal(core.mailIsTender({ ...no, fromTeam: true }), true);
  assert.equal(core.mailIsTender({ ...no, threadHasTeam: true }), true);
  assert.equal(core.mailIsTender({ ...no, subject: 'مستندات المنافسة' }), true);
  assert.equal(core.mailIsTender({ ...no, subject: 'Tender for the supply of cameras' }), true);
  assert.equal(core.mailIsTender({ ...no, subject: 'RE: Enhancing Our Tendering & Bidding Process' }), false);
  assert.equal(core.mailIsTender({ ...no, names: ['كراسة الشروط والمواصفات.pdf'] }), true);
});
test('the register is checked: what does not look like a tender, and what is the same tender twice', () => {
  const team = (a) => a === 'desk@example.com';
  const items = [
    { id: 'w1', subject: 'تامين كاميرات مراقبة امنية للمنطقة الغربية', date: '2026-10-13', stage: 'received', messages: [{ key: 'a', subject: 'تامين كاميرات مراقبة امنية للمنطقة الغربية', sender: 'desk@example.com' }], files: [], thread: [] },
    { id: 'w2', subject: 'RE:  تامين كميرات مراقبة امنية للمنطقة الغربية', date: '2026-10-24', stage: 'submitted', messages: [{ key: 'b', subject: 'x', sender: 'boss@example.com' }, { key: 'c', subject: 'y', sender: 'boss@example.com' }], files: [{ id: 'f', name: 'كراسة الشروط.pdf', kind: 'booklet' }], thread: [] },
    { id: 'n1', subject: 'Terminated clients process', date: '2026-11-01', stage: 'received', messages: [{ key: 'd', subject: 'Terminated clients process', sender: 'boss@example.com' }], files: [], thread: [] },
    { id: 'r1', subject: 'RE: منافسة بالرقم المرجعي 261139004470', date: '2026-11-15', stage: 'received', messages: [{ key: 'e', subject: 'RE: منافسة بالرقم المرجعي 261139004470', sender: 'eng@example.com' }], files: [], thread: [] },
    { id: 'r2', subject: 'الرصد الذكي المتنقل', date: '2026-11-16', stage: 'received', etimadNo: '261139004470', byFrom: true, messages: [{ key: 'g', subject: 'الرصد', sender: 'desk@example.com' }], files: [], thread: [] },
    { id: 'm1', subject: 'ورشة', date: '2026-11-17', stage: 'received', manual: true, messages: [], files: [], thread: [] }];
  const c = core.tenderCleanup(items, team);
  assert.deepEqual(c.notTenders, ['n1']);
  assert.deepEqual(c.duplicates.map((g) => [...g].sort()), [['w1', 'w2'], ['r1', 'r2']]);
  assert.equal(core.tenderRefOf(items[3]), '261139004470');
});
test('two entries of one tender become one: the older arrival, the further stage, every mail and file once', () => {
  const a = { id: 'w1', subject: 'تامين كاميرات', date: '2026-10-13', dateSource: 'received', stage: 'received', stageAt: '2026-10-13', etimadNo: '', entity: 'رئاسة الأركان',
    messages: [{ key: 'a' }], files: [{ id: 'f1', name: 'a.pdf' }], thread: [{ at: '2026-10-13T10:00', name: 'Desk', addr: 'desk@example.com', text: 'one' }], activity: [{ id: '1', action: 'email', label: 's', at: '2026-11-23T08:00:00.000Z' }] };
  const b = { id: 'w2', subject: 'تامين كميرات', date: '2026-10-24', dateSource: 'received', stage: 'submitted', stageAt: '2026-10-25', etimadNo: '261039003634', entity: '', submittedOn: '2026-10-25',
    messages: [{ key: 'a' }, { key: 'b' }], files: [{ id: 'f1', name: 'a.pdf' }, { id: 'f2', name: 'b.pdf' }], thread: [{ at: '2026-10-24T11:00', name: 'Boss', addr: 'boss@example.com', text: 'two' }], activity: [{ id: '2', action: 'email', label: 't', at: '2026-11-23T09:00:00.000Z' }] };
  const m = core.tenderMerge(a, b);
  assert.equal(m.id, 'w1'); assert.equal(m.date, '2026-10-13'); assert.equal(m.stage, 'submitted'); assert.equal(m.stageAt, '2026-10-25'); assert.equal(m.submittedOn, '2026-10-25');
  assert.equal(m.etimadNo, '261039003634'); assert.equal(m.entity, 'رئاسة الأركان');
  assert.deepEqual(m.messages.map((x) => x.key), ['a', 'b']); assert.deepEqual(m.files.map((x) => x.id), ['f1', 'f2']); assert.equal(m.thread.length, 2);
  assert.deepEqual(m.activity.map((x) => x.action), ['merged', 'email', 'email']); assert.equal(m.activity[0].label, 'تامين كميرات');
  const c = core.cleanTenderDetails({ ...m, activity: m.activity });
  assert.equal(c.activity[0].action, 'merged');
});

// v9.88 (ADR-0155): where a tender stands, read from what its mails say
test('a mail says where the tender stands: the branch stepping aside, or the tenders team reporting the offer submitted', () => {
  assert.equal(core.mailSignal('السلام عليكم\nنوصي بعدم التقديم لعدم توفر الإيضاحات الفنية.\nتحياتي', false).kind, 'declined');
  assert.equal(core.mailSignal('السلام عليكم\nنوصي بعدم التقديم لعدم توفر الإيضاحات الفنية.\nتحياتي', false).quote, 'نوصي بعدم التقديم لعدم توفر الإيضاحات الفنية.');
  assert.equal(core.mailSignal('نعتذر عن المشاركة في هذه المنافسة', false).kind, 'declined');
  assert.equal(core.mailSignal('We will not participate in this tender.', false).kind, 'declined');
  assert.equal(core.mailSignal('تم تقديم العرضين على منصة اعتماد', true).kind, 'submitted');
  assert.equal(core.mailSignal('تم تقديم العرضين على منصة اعتماد', false), null);        // only the team that submits can say it is submitted
  assert.equal(core.mailSignal('نرجو عدم التأخر في التقديم', true), null);                  // the team does not decline for the branch
  assert.equal(core.mailSignal('مرفق لكم الكراسة للدراسة', false), null);
});
test('the latest such mail is offered as the tender\'s stage — unless the stage already says so, the tender is closed, or the manager put it aside', () => {
  const team = (a) => a === 'desk@example.com';
  const base = { id: 't', subject: 'x', date: '2026-11-01', stage: 'received', thread: [
    { at: '2026-11-01T09:00', name: 'Desk', addr: 'desk@example.com', text: 'مرفق الكراسة' },
    { at: '2026-11-10T17:30', name: 'Branch Manager', addr: 'boss@example.com', text: 'نوصي بعدم التقديم لعدم توفر الإيضاحات' }] };
  const s = core.tenderSignal(base, team);
  assert.deepEqual([s.kind, s.at, s.who], ['declined', '2026-11-10T17:30', 'Branch Manager']);
  assert.equal(core.tenderSignal({ ...base, stage: 'declined' }, team), null);
  assert.equal(core.tenderSignal({ ...base, stage: 'lost' }, team), null);
  assert.equal(core.tenderSignal({ ...base, sigOff: '2026-11-10T17:30' }, team), null);
  assert.equal(core.tenderSignal({ ...base, stage: 'submitted' }, team).kind, 'declined');   // a stage set by mistake is corrected too
  const later = { ...base, stage: 'prep', thread: [...base.thread, { at: '2026-11-18T13:39', name: 'Desk', addr: 'desk@example.com', text: 'تم تقديم العرضين على اعتماد' }] };
  assert.equal(core.tenderSignal(later, team).kind, 'submitted');
  assert.equal(core.tenderSignal({ ...later, stage: 'submitted' }, team), null);
  const p = core.tenderSignalPatch(base, s);
  assert.deepEqual([p.stage, p.stageAt, p.decidedOn, p.reason], ['declined', '2026-11-10', '2026-11-10', 'نوصي بعدم التقديم لعدم توفر الإيضاحات']);
  const q = core.tenderSignalPatch(later, core.tenderSignal(later, team));
  assert.deepEqual([q.stage, q.stageAt, q.submittedOn], ['submitted', '2026-11-18', '2026-11-18']);
  assert.equal(core.cleanTenderDetails({ activity: [{ id: 'a', action: 'signal', label: 'declined', at: '2026-11-24T00:00:00.000Z', mailAt: '2026-11-10T17:30', who: 'Branch Manager' }] }).activity[0].action, 'signal');
});

for (const [name, fn] of tests) {
  try { fn(); } catch (e) { failed++; console.error(`FAIL ${name}\n  ${e.message}`); }
}
if (failed) { console.error(`core.test.mjs: ${failed} failed`); process.exit(1); }
console.log(`core.test.mjs: ${tests.length - failed} passed`);
