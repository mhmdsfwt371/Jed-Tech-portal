// core.js — pure logic. No DOM, no network, so tests/core.test.mjs runs it in Node.
// The portal never calls an Afaqy API. CRM data arrives as a file that Claude in Chrome produces from inside
// myafaqy, in the fixed format defined here (SCHEMA), so the portal never depends on the CRM's own field names.

export const SCHEMA = 'afaqy-crm-tasks/v2';   // v1 is still read (SCHEMAS below)
export const TZ_OFFSET = '+03:00';   // Saudi time, no daylight saving

// ===================== strings =====================
export const LANGS = ['ar', 'en', 'ur'];
// The wizard only guides the user. Bookmark creation and task retrieval remain on myafaqy.
export const TOUR_DEVICES = ['desktop', 'android', 'ios'];
export function tourState(step, device = 'desktop') {
  const n = Number.isInteger(step) ? Math.min(4, Math.max(0, step)) : 0;
  return { step: n, total: 5, progress: (n + 1) * 20, device: TOUR_DEVICES.includes(device) ? device : 'desktop' };
}

// Team and admin links share code and local storage. This selects visible routes, not access rights.
export function portalRoute(hash, teamMode = false) {
  if (!teamMode) return ({ counts: 'kpi', person: 'kpi' })[hash] || hash;   // ADR-0070: the two merged pages' old links open the board
  if (['tools', 'me', 'pro', 'guide'].includes(hash) || hash.startsWith('me-') || hash.startsWith('m-')) return hash;
  return 'me';
}
// A deterministic visual storyboard for a simulated browser; it never controls another tab.
export function tourDemoPlan(step, device = 'desktop') {
  const state = tourState(step, device);
  const desktop = [
    [[73, 83], [30, 69]],
    [[67, 70], [23, 28]],
    [[72, 78], [47, 21]],
    [[69, 71], [23, 28]],
    [[81, 79], [33, 65]],
  ];
  const android = [
    [[71, 80], [49, 67]],
    [[76, 75], [56, 69]],
    [[74, 78], [46, 18]],
    [[79, 80], [51, 58]],
    [[77, 75], [45, 63]],
  ];
  const ios = [
    [[71, 80], [47, 67]],
    [[75, 79], [53, 69]],
    [[72, 75], [47, 18]],
    [[70, 62], [35, 89]],
    [[75, 74], [47, 62]],
  ];
  const path = (state.device === 'desktop' ? desktop : state.device === 'ios' ? ios : android)[state.step];
  return { ...state, start: { x: path[0][0], y: path[0][1] },
    target: { x: path[1][0], y: path[1][1] },
    gesture: state.step === 1 && state.device === 'desktop' ? 'drag' : 'click' };
}
export const dirOf = (lang) => (lang === 'en' ? 'ltr' : 'rtl');

// The strings live in i18n/<lang>.js and load on demand: Arabic always (it is every key's fallback), plus the reader's language.
// Loading one language instead of three makes the first load much lighter (ADR-0023).
export const STRINGS = { ar: {}, en: {}, ur: {} };
const loadedLangs = new Set();
export async function loadStrings(langs = ['ar', 'en', 'ur']) {
  await Promise.all([...new Set(langs)].filter((l) => l in STRINGS && !loadedLangs.has(l) && !Object.keys(STRINGS[l]).length).map(async (l) => {
    const m = await import(new URL(`./i18n/${l}.js`, import.meta.url).href);
    Object.assign(STRINGS[l], m.default); loadedLangs.add(l);
  }));
}

// The user guide: one list, read by the page (Guide tab) and by scripts/build-manual.mjs, so they can never differ.
export const GUIDE = [['g_home_h', 'g_home_b'], ['g_tools_h', 'g_tools_b'], ['g_me_h', 'g_me_b'], ['g_projects_h', 'g_projects_b'], ['g_team_h', 'g_team_b'], ['g_weights_h', 'g_weights_b'], ['g_mailfile_h', 'g_mailfile_b'], ['g_dev_h', 'g_dev_b'], ['g_overtime_h', 'g_overtime_b'], ['g_planner_h', 'g_planner_b'], ['g_tenders_h', 'g_tenders_b'], ['g_mgr_h', 'g_mgr_b'], ['g_pro_h', 'g_pro_b'], ['g_data_h', 'g_data_b'], ['g_sync_h', 'g_sync_b'], ['g_cards_h', 'g_cards_b'], ['g_parts_h', 'g_parts_b'], ['g_kpi_h', 'g_kpi_b'], ['g_privacy_h', 'g_privacy_b'], ['g_readings_h', 'g_readings_b']];
export const DEFINITIONS = ['def_1', 'def_2', 'def_3', 'def_4', 'def_5', 'def_6', 'def_7', 'def_8', 'def_9', 'def_10'];

export function t(lang, key, vars = {}) {
  const s = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.ar[key] ?? key;
  return String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}
export const L = (obj, lang) => (obj && (obj[lang] || obj.ar || obj.en)) || '';

// ===================== dates and period blocks =====================
const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** "Today" in Saudi time, as a UTC-midnight date (so month arithmetic never drifts across a time zone). */
export function saudiToday(now = new Date()) {
  const s = new Date(now.getTime() + 3 * 3600000);
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
}

/**
 * Calendar-aligned blocks of `months` (3 = quarters, 6 = halves, 12 = years), most recent first.
 * The current block ends today and is marked partial.
 */
export function periodBlocks(months, count, now = new Date()) {
  if (![3, 6, 12].includes(months)) throw new Error('months must be 3, 6 or 12');
  const today = saudiToday(now);
  const startMonth = Math.floor(today.getUTCMonth() / months) * months;
  let start = new Date(Date.UTC(today.getUTCFullYear(), startMonth, 1));
  const out = [];
  for (let i = 0; i < Math.max(1, Math.min(count, 12)); i++) {
    const nextStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
    const lastDay = new Date(nextStart.getTime() - 86400000);
    const partial = i === 0 && lastDay > today;
    out.push({ from: ymd(start), to: ymd(partial ? today : lastDay), months, partial, label: blockLabel(start, months) });
    start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - months, 1));
  }
  return out;
}

function blockLabel(start, months) {
  const y = start.getUTCFullYear();
  if (months === 12) return String(y);
  if (months === 6) return `H${start.getUTCMonth() < 6 ? 1 : 2} ${y}`;
  return `Q${Math.floor(start.getUTCMonth() / 3) + 1} ${y}`;
}

export const rangeKey = (r) => `${r.from}_${r.to}`;

// ===================== the prompt for Claude in Chrome =====================
// Endpoints, fields and pitfalls below come from the capture of 28 Oct 2026 (summarised in docs/crm-api.md) —
// every one was observed in the app's own traffic. Nothing here is inferred from a screen name.

/** The app's own filter convention: a Saudi calendar day starts at 21:00Z the day before. */
export function saudiBoundsZ(from, to) {
  const start = new Date(Date.parse(`${from}T00:00:00${TZ_OFFSET}`)).toISOString();
  const end = new Date(Date.parse(`${to}T00:00:00${TZ_OFFSET}`) + 86400000).toISOString();
  return [start, end];
}

export function buildPrompt({ from, to, today = null }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) throw new Error('invalid range');
  const [fromZ, toZ] = saudiBoundsZ(from, to);
  const todayYmd = today || ymd(saudiToday());
  const [, nowZ] = saudiBoundsZ(todayYmd, todayYmd);
  const later = to < todayYmd;
  return `You are extracting task data from the myafaqy CRM (https://myafaqy.com, API at https://crmbackend.afaqy.sa) for a read-only KPI dashboard. I am signed in with my own manager account in this tab.

ABSOLUTE RULE — NOTHING MAY CHANGE IN MYAFAQY
- You may call ONLY these four endpoints, exactly as named:
    Security/GetAllHierarchyUsersDropDown · Teams/GetAllTeams · Teams/GetTeamById · Task/GetMyTasksGrid
- Never call anything else. Never call any endpoint whose name contains Add, Create, Insert, Edit, Update, Delete, Remove, Save, Assign, Reassign, Close, Complete, Approve, Reject, Sync, Send, Upload, Import, Change, Set, Mark, Read, Seen, Logout.
- Never press any button in the page. Never change any filter, sort, column or setting on screen.
- myafaqy uses POST to READ lists; that is expected. The four names above are reads.
- If anything is unclear, or the app now needs a different endpoint, STOP and ask me. Do not improvise.

PERIOD: ${from} to ${to}, Saudi time (UTC+3). In the app's own filter format that is:
  completedOn: ["${fromZ}", "${toZ}"]

STRICT RULES
1. READ-ONLY. Never press any button that writes or changes data (Save, Add, Create, Edit, Assign, Close, Complete, Approve, Delete, Sync, Send, Comment). Reading lists, opening details and paging are fine.
2. NEVER GUESS AN API PATH. The endpoints below were recorded from this app's own traffic on 28 Oct 2026. Before replaying any of them, open the screen that uses it once and confirm in the network traffic that the app still sends it the same way. If it differs, use what the app sends now and say so in "notes". Change only the date window, the page number and the page size.
3. Replaying an observed request from this page with your JavaScript tool is allowed: it is a read. Reuse the headers the app sends (Authorization, X-Timezone-Offset, X-Client-Id, lang). Wait 300 ms between calls.
4. Do NOT open tasks one by one. The completion time is in the grid row ("closeDate"); who completed a task is not needed.
5. Never put tokens, cookies, passwords, phone numbers, identity numbers or e-mail bodies in your answer.

STEP 1 — PEOPLE
a. POST https://crmbackend.afaqy.sa/Security/GetAllHierarchyUsersDropDown
   body {"pageSize":1000,"pageNumber":0,"searchCriteria":"","selectedId":[]} → id, nameEn, nameAr.
b. POST https://crmbackend.afaqy.sa/Teams/GetAllTeams with the standard grid body
   {"isSearchFilter":false,"searchKey":"","search":{},"pageSize":10,"pageNumber":0,"searchCriteria":"","dateRangeIntialDaysCount":0}
   (page through all pages), then GET https://crmbackend.afaqy.sa/Teams/GetTeamById/{id} for each team →
   groupUsersDto[].userId, the team's nameEn and branchCode.

STEP 2 — TASKS: POST https://crmbackend.afaqy.sa/Task/GetMyTasksGrid with "taskGroupId": 100001 (All Tasks), in the body the app sends:
   {"donePageNumber":0,"donePageSize":20,"openPageNumber":0,"openPageSize":20,"toDoPageNumber":0,"toDoPageSize":20,
    "orderBy":1,"taskGroupId":100001,"searchKey":"","tasksGridStatusId":1,
    "assignedBy":[],"createdBy":[],"agent":[],"statusIds":[],"type":[],"priority":[],"assignedOn":[],"completedOn":[]}
   The response has three buckets (toDo, open, done) that page INDEPENDENTLY: to walk one bucket, increment only its page number.
   Page size: send 500 (the server honoured 500 on 29 Oct 2026); if a bucket's "pageSize" comes back smaller, use what it returns.
a. DONE IN THE PERIOD: set "completedOn": ["${fromZ}", "${toZ}"]. Record done.listCount as "doneInRangeTotal". Walk the whole done bucket.${later ? `
b. CREATED IN THE PERIOD, DONE LATER: set "completedOn": ["${toZ}", "${nowZ}"]. Walk the done bucket and keep only rows whose createdOn falls inside the period.` : ''}
${later ? 'c' : 'b'}. OPEN NOW: send "completedOn": []. Walk the toDo and open buckets completely (ignore done here). Record toDo.listCount + open.listCount as "openTotal".
${later ? 'd' : 'c'}. THE R&D QUEUE: repeat ${later ? 'a and c' : 'a and b'} with "taskGroupId": 12 (R&D Tasks) instead of 100001, and list the ids of every task it returns as "rdTaskIds". Nothing else from these calls.

TIMES: createdOn and closeDate carry no time zone and are UTC (verified 29 Oct 2026: a task shown 12:30 PM on screen came back 09:30:41). Write every time as returned with "Z" added (for example 2026-10-29T09:30:41Z), and confirm the check on one task in "notes".

DO NOT USE: "dateOfCompletion" (always null), "isAutomaticTask" (contradicts itself between the grid and the detail), the "createdBy" / "assignee" name strings (unreliable — names come from step 1), "type" and "priorty" (always null).

WHAT TO RETURN
The result is one JSON document, exactly in this format:

{
  "schema": "${SCHEMA}",
  "range": { "from": "${from}", "to": "${to}" },
  "extractedAt": "<ISO date-time now>",
  "taskGroupId": 100001,
  "source": { "endpoint": "POST https://crmbackend.afaqy.sa/Task/GetMyTasksGrid", "doneInRangeTotal": <n>, "openTotal": <n>, "pageSize": <20 or 100> },
  "people": [
    { "id": "<user id>", "nameEn": "<nameEn>", "nameAr": "<nameAr>", "teams": ["<team nameEn>"], "branchCode": "<branch code of their team, or null>" }
  ],
  "tasks": [
    {
      "id": "<id>",
      "title": "<title>",
      "typeId": <taskSettingId>,
      "type": "<taskType>",
      "statusId": <statusId>,
      "state": "<open | done | cancelled>",
      "createdAt": "<createdOn with offset>",
      "createdById": "<createUserId>",
      "assigneeId": "<assigneeId>",
      "completedAt": "<closeDate with offset, only when state is done; otherwise null>",
      "moduleId": <moduleId>,
      "customer": "<customerTag or null>",
      "bucket": "<done | open | toDo>"
    }
  ],
  "rdTaskIds": ["<id of every task in the R&D queue (taskGroupId 12) from step 2>"],
  "notes": ["<the time offset you established, anything the app now sends differently, filters you could not apply>"]
}

MAPPING
- "state": "cancelled" when isCancelled is true; otherwise "done" when statusId is 3; otherwise "open".
- "people": only users who appear in "tasks" as assignee or creator.

THE RESULT — ONE FILE ON MY COMPUTER, NOT IN CHAT
Build the JSON in the page and save it as ONE file with a download (a Blob and an <a download> link) named afaqy-tasks-${from}_${to}.json. Do not paste it. Then reply with only four lines: the file name, the number of tasks in it, doneInRangeTotal, and "No write endpoint was called."
Only if a download is impossible: paste it instead, split into parts if needed — the same format in every part with an added field "part": "1/3", "2/3", "3/3", each holding a different slice of "tasks" (put "people" in part 1).`;
}

// ===================== reading what Claude in Chrome returns =====================
export const SCHEMAS = ['afaqy-crm-tasks/v1', SCHEMA];
const STATES = new Set(['open', 'done', 'cancelled']);
export const EMAIL_MODULE = 146;          // "Email Customer Activity" — the reliable e-mail marker (capture 28 Oct 2026)
export const JEDDAH_BRANCH = '2';

/** Pull the first JSON object out of free text (a code block, or a bare object). */
export function extractJson(text) {
  const s = String(text ?? '');
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : s;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(candidate.slice(start, end + 1)); } catch { return null; }
}

/**
 * myafaqy's raw times carry no zone mark and are UTC — verified 29 Oct 2026 against the screen on four tasks (shown
 * 12:30 PM, returned 09:30:41; X-Timezone-Offset -180). A zone-less time is therefore read as UTC, on any machine.
 * (Until v6.6 it was read as Saudi time: three hours late.) A time that carries its zone is respected as written.
 */
export function toIso(v) {
  if (v == null || v === '') return null;
  let s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) s += 'Z';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
const idOf = (v) => (v == null || v === '' ? null : String(v));

/** The Saudi calendar day of an ISO instant, as YYYY-MM-DD. */
const SAUDI_DAYS = new Map();   // the same instants are converted again and again across 20,000 tasks: remember them (bounded)
export const saudiDay = (iso) => {
  if (!iso) return null;
  let d = SAUDI_DAYS.get(iso); if (d !== undefined) return d;
  d = ymd(new Date(Date.parse(iso) + 3 * 3600000)); if (SAUDI_DAYS.size > 200000) SAUDI_DAYS.clear(); SAUDI_DAYS.set(iso, d); return d;
};

/**
 * Validate and normalise one uploaded part (v1 or v2). Returns { dataset, skipped } or { error, vars }.
 * Rows missing an id, a creation time or an assignee are skipped and counted, never invented.
 */
export function parseDataset(text) {
  const raw = typeof text === 'string' ? extractJson(text) : text;
  if (!raw || typeof raw !== 'object') return { error: 'err_json' };
  if (!SCHEMAS.includes(raw.schema)) return { error: 'err_schema', vars: { schema: SCHEMA } };
  const v2 = raw.schema === SCHEMA;
  const from = raw.range && raw.range.from, to = raw.range && raw.range.to;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '') || from > to) return { error: 'err_range' };
  if (!Array.isArray(raw.tasks)) return { error: 'err_tasks' };
  let skipped = 0;
  const tasks = [];
  for (const r of raw.tasks) {
    const createdAt = toIso(r && r.createdAt);
    if (!r || r.id == null || !createdAt || (r.assigneeId == null && !r.assigneeName)) { skipped++; continue; }
    const state = STATES.has(r.state) ? r.state : 'open';
    const moduleId = Number.isFinite(+r.moduleId) && r.moduleId !== null ? +r.moduleId : null;
    tasks.push({
      id: String(r.id), title: String(r.title || ''), type: String(r.type || ''),
      typeId: Number.isFinite(+r.typeId) && r.typeId !== null ? +r.typeId : null,
      state, createdAt, createdById: idOf(r.createdById), createdByName: String(r.createdByName || ''),
      assigneeId: idOf(r.assigneeId), assigneeName: String(r.assigneeName || ''),
      assignedToGroup: !v2 && r.assignedToGroup === true,
      completedAt: state === 'done' ? toIso(r.completedAt) : null,
      completedById: idOf(r.completedById), completedByName: String(r.completedByName || ''),
      // v2: the e-mail marker is the module, never the creator; v1 carried its own flag
      fromEmail: v2 ? moduleId === EMAIL_MODULE : (r.fromEmail === true ? true : r.fromEmail === false ? false : null),
      moduleId, customer: r.customer == null ? null : String(r.customer),
      bucket: ['done', 'open', 'toDo'].includes(r.bucket) ? r.bucket : null,
      ...(toIso(r.startedAt) ? { startedAt: toIso(r.startedAt) } : {}),   // ADR-0124: when someone first started it (last 7 days only)
    });
  }
  const people = Array.isArray(raw.people) ? raw.people.filter((p) => p && p.id != null).map((p) => ({
    id: String(p.id), nameEn: String(p.nameEn || ''), nameAr: String(p.nameAr || ''),
    teams: Array.isArray(p.teams) ? p.teams.map(String) : [], branchCode: p.branchCode == null ? null : String(p.branchCode),
  })) : [];
  const num = (v) => (v != null && Number.isFinite(+v) ? +v : null);
  const src = raw.source || {};
  return {
    dataset: {
      key: (raw.sample === true ? 'sample:' : '') + rangeKey({ from, to }), schema: raw.schema, range: { from, to },
      extractedAt: toIso(raw.extractedAt), endpoint: String(src.endpoint || ''),
      doneInRangeTotal: v2 ? num(src.doneInRangeTotal) : null, openTotal: v2 ? num(src.openTotal) : null,
      crmTotal: v2 ? null : num(src.crmTotal),
      notes: Array.isArray(raw.notes) ? raw.notes.map(String).slice(0, 50) : [],
      // ADR-0110: lists MyAFAQY refused for the account that pulled (the pull went on without them)
      pulledBy: raw.pulledBy && /^\d{1,12}$/.test(String(raw.pulledBy.id)) ? { id: String(raw.pulledBy.id), name: String(raw.pulledBy.name || '').slice(0, 80) } : null,   // ADR-0115: the account that pulled
      skippedLists: Array.isArray(raw.skippedLists) ? raw.skippedLists.map((x) => String(x).slice(0, 80)).filter((x) => /^[A-Za-z]+\/[A-Za-z]+$/.test(x)).slice(0, 20) : [],
      part: typeof raw.part === 'string' ? raw.part : null, sample: raw.sample === true,
      people, tasks: markRd(tasks, raw.rdTaskIds),
      rdKnown: Array.isArray(raw.rdTaskIds),
      employees: parseEmployees(raw.employees),
      teamTypes: Object.fromEntries(Object.entries(raw.teamTypes && typeof raw.teamTypes === 'object' ? raw.teamTypes : {}).slice(0, 40)
        .map(([tm, arr]) => [String(tm).slice(0, 80), (Array.isArray(arr) ? arr : []).slice(0, 200).filter((x) => x && (x.nameEn || x.nameAr)).map((x) => ({ id: x.id == null ? null : String(x.id), nameEn: String(x.nameEn || '').slice(0, 80), nameAr: String(x.nameAr || '').slice(0, 80) }))])),
    },
    skipped,
  };
}

const markRd = (tasks, ids) => {
  if (!Array.isArray(ids)) return tasks;
  const set = new Set(ids.map(String));
  return tasks.map((x) => (set.has(x.id) ? { ...x, rd: true } : x));
};

/** Add a part to the stored datasets: same period → tasks and people merged by id (the newer copy wins). */
/** A newer pull overrides older ones it fully covers (pull 1–15, then 1–20 of the month: the 1–15 one goes). ADR-0033 */
export const covers = (a, b) => a && b && a.from <= b.from && a.to >= b.to;
export function supersede(list, incoming) {
  // only real pulls override each other — the sample set never replaces, nor is replaced by, real data
  return (list || []).filter((d) => d.key === incoming.key || d.sample || incoming.sample || !covers(incoming.range, d.range));
}
export function mergeDataset(list, incoming) {
  const out = supersede(list, incoming).map((d) => ({ ...d }));
  const i = out.findIndex((d) => d.key === incoming.key);
  if (i < 0) { out.push({ ...incoming, people: incoming.people || [], parts: incoming.part ? [incoming.part] : [] }); }
  else {
    const byId = new Map(out[i].tasks.map((x) => [x.id, x]));
    for (const x of incoming.tasks) byId.set(x.id, x);
    const ppl = new Map((out[i].people || []).map((p) => [p.id, p]));
    for (const p of incoming.people || []) ppl.set(p.id, p);
    out[i] = {
      ...out[i], tasks: [...byId.values()], people: [...ppl.values()],
      crmTotal: incoming.crmTotal ?? out[i].crmTotal,
      doneInRangeTotal: incoming.doneInRangeTotal ?? out[i].doneInRangeTotal,
      openTotal: incoming.openTotal ?? out[i].openTotal,
      notes: [...new Set([...(out[i].notes || []), ...(incoming.notes || [])])],
      parts: [...new Set([...(out[i].parts || []), ...(incoming.part ? [incoming.part] : [])])],
      extractedAt: incoming.extractedAt || out[i].extractedAt,
      pulledBy: incoming.pulledBy || out[i].pulledBy || null,
      skippedLists: incoming.skippedLists || [],   // ADR-0110: the latest pull of the period decides — a full pull clears the warning
      sample: out[i].sample && incoming.sample,
      teamTypes: incoming.teamTypes && Object.keys(incoming.teamTypes).length ? incoming.teamTypes : out[i].teamTypes,
      employees: incoming.employees && incoming.employees.length ? incoming.employees : out[i].employees,
      rdKnown: out[i].rdKnown || incoming.rdKnown,
    };
  }
  return out.sort((a, b) => (a.range.from < b.range.from ? 1 : -1));
}

const inRange = (iso, range) => {
  if (!range) return true;
  const d = saudiDay(iso);
  return d != null && d >= range.from && d <= range.to;
};

/**
 * Complete when what arrived matches what the CRM itself counted. v2 checks both the tasks completed in the
 * period and the open ones; v1 checks its single total. Unknown when the CRM gave no count.
 */
export function completeness(ds) {
  if (ds.schema === SCHEMA) {
    const checks = [];
    if (ds.doneInRangeTotal != null) checks.push([ds.tasks.filter((x) => x.state === 'done' && inRange(x.completedAt, ds.range)).length, ds.doneInRangeTotal]);
    if (ds.openTotal != null) checks.push([ds.tasks.filter((x) => x.state === 'open').length, ds.openTotal]);
    if (!checks.length) return { known: false, complete: null, got: ds.tasks.length, want: null };
    const got = checks.reduce((s, c) => s + c[0], 0), want = checks.reduce((s, c) => s + c[1], 0);
    return { known: true, complete: checks.every(([g, w]) => g >= w), got, want };
  }
  if (ds.crmTotal == null) return { known: false, complete: null, got: ds.tasks.length, want: null };
  return { known: true, complete: ds.tasks.length >= ds.crmTotal, got: ds.tasks.length, want: ds.crmTotal };
}

// ===================== people and the team =====================
/** Everyone the data mentions: the people list first, then any assignee or creator it does not name. */
export function peopleOf(datasets) {
  const map = new Map();
  for (const d of datasets || []) {
    for (const p of d.people || []) map.set(p.id, { ...(map.get(p.id) || {}), ...p });
    for (const x of d.tasks || []) {
      if (x.assignedToGroup) continue;
      if (x.assigneeId && !map.has(x.assigneeId)) map.set(x.assigneeId, { id: x.assigneeId, nameEn: x.assigneeName, nameAr: x.assigneeName, teams: [], branchCode: null });
    }
  }
  return [...map.values()];
}
export const nameOf = (p, lang) => (p ? ((lang === 'en' ? p.nameEn : p.nameAr) || p.nameEn || p.nameAr || p.id) : '');

/** The default team: everyone in a Jeddah-branch team; if the data names no branches, everyone assigned a task. */
// Teams that are not technical: left out of the default when they are a person's only teams (the manager can tick them).
export const NON_TECH_TEAMS = /^jeddah[- ]+(sales|collection) team$/i;
const inJeddah = (p) => p.branchCode === JEDDAH_BRANCH || (p.teams || []).some((t) => /jeddah|جدة/i.test(t));
const onlyNonTech = (p) => (p.teams || []).length > 0 && p.teams.every((t) => NON_TECH_TEAMS.test(String(t).trim()));
export function defaultTeam(people, tasks) {
  // Jeddah = a team on branch 2, or a team whose name says Jeddah (a person's own branch code follows only one of their
  // teams — on 29 Oct 2026 an after-sales engineer carried a Riyadh code through his second team)
  const jeddah = (people || []).filter((p) => inJeddah(p) && !onlyNonTech(p)).map((p) => p.id);
  if (jeddah.length) return jeddah;
  return [...new Set((tasks || []).filter((x) => !x.assignedToGroup).map((x) => x.assigneeId).filter(Boolean))];
}

// ===================== Factor 1 =====================
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const GROUP = '__group__';

/**
 * A task its assignee opened for himself — in this team, the requests that arrive by WhatsApp or by phone and get logged
 * by the engineer. myafaqy records who created a task but not the channel, so WhatsApp and calls cannot be told apart.
 * From the manager's file: creator id equals assignee id. From «My KPIs»: the bookmark's own flag (it never hands over ids).
 */
export const isSelfLogged = (x) => x.fromEmail !== true && (x.own === true || (x.createdById != null && x.createdById === x.assigneeId));
/** ADR-0067 — the one definition of where a task came from: «email» (made by MyAFAQY's e-mail integration), «self» (the person opened
 * it for himself), «other» (assigned to him by a colleague, a manager, or the system from a request). Every page reads this. */
export const SOURCES = ['self', 'email', 'other'];
export const taskSource = (x) => (x.fromEmail === true ? 'email' : isSelfLogged(x) ? 'self' : 'other');

/**
 * Who a task counts for: its assignee. (The v1 format could mark a group task; it then counts for whoever completed
 * it, or stays on the group line. myafaqy rows carry no group flag — capture of 28 Oct 2026.)
 */
export function creditOf(task) {
  if (!task.assignedToGroup) return { id: task.assigneeId || task.assigneeName, name: task.assigneeName || task.assigneeId };
  if (task.state === 'done' && (task.completedById || task.completedByName)) return { id: task.completedById || task.completedByName, name: task.completedByName || task.completedById };
  return { id: GROUP, name: GROUP };
}

/**
 * Factor 1 for one period.
 *   received   tasks created in the period (the cohort)
 *   done       tasks completed in the period — what the CRM's own completedOn filter counts
 *   rate       share of the received cohort completed by the time of extraction, cancelled excluded
 *   avg/median creation → completion, over the tasks completed in the period
 *   open       open right now (a snapshot at extraction, whatever the creation date)
 * `team` (a list of ids) keeps only those people; without it everyone counts.
 */
const srcBlank = () => Object.fromEntries(SOURCES.map((k) => [k, { received: 0, done: 0, durations: [], cohort: [] }]));
export function factor1(tasks, { range = null, team = null } = {}) {
  const keep = team ? new Set(team) : null;
  const rows = new Map();
  const row = (id, name) => {
    if (!rows.has(id)) rows.set(id, { id, name, assigned: 0, done: 0, cohortDone: 0, open: 0, cancelled: 0, created: 0, fromEmail: 0, selfLogged: 0, rd: 0, durations: [], cohort: [], src: srcBlank() });
    const r = rows.get(id);
    if (name && (!r.name || r.name === r.id)) r.name = name;
    return r;
  };
  if (keep) for (const id of keep) row(id, id);
  for (const x of tasks || []) {
    const c = creditOf(x);
    if (keep && c.id !== GROUP && !keep.has(c.id)) continue;
    const received = inRange(x.createdAt, range);
    const doneHere = x.state === 'done' && (range ? inRange(x.completedAt, range) : true);
    if (!received && !doneHere && x.state !== 'open') continue;
    const r = row(c.id, c.name);
    if (received) {
      r.assigned++;
      if (x.state === 'done') r.cohortDone++;
      if (x.state === 'cancelled') r.cancelled++;
      if (x.fromEmail === true) r.fromEmail++;
      else if (isSelfLogged(x)) r.selfLogged++;
      r.src[taskSource(x)].received++;
      // the received cohort's own closing time (ADR-0067): what MyAFAQY's «Assigned on» export measures — no old backlog in it
      if (x.state === 'done' && x.completedAt) { const hc = (Date.parse(x.completedAt) - Date.parse(x.createdAt)) / 3600000; if (hc >= 0) { r.cohort.push(hc); r.src[taskSource(x)].cohort.push(hc); } }
    }
    if (doneHere) {
      r.done++;
      if (x.rd === true) r.rd++;
      const s = r.src[taskSource(x)]; s.done++;
      if (x.completedAt) {
        const h = (Date.parse(x.completedAt) - Date.parse(x.createdAt)) / 3600000;
        if (h >= 0) { r.durations.push(h); s.durations.push(h); }
      }
    }
    if (x.state === 'open') r.open++;
  }
  // "created" is a separate view: who opened tasks in the period themselves (e-mail tasks excluded)
  for (const x of tasks || []) {
    if (x.fromEmail === true || !(x.createdById || x.createdByName) || !inRange(x.createdAt, range)) continue;
    const id = x.createdById || x.createdByName;
    // a creator becomes a row only if chosen in the team, or already holding tasks — so the CRM's system account
    // (which opens the work-order tasks) never appears as if it were an employee
    if (keep ? !keep.has(id) : !rows.has(id)) continue;
    row(id, x.createdByName).created++;
  }
  const finish = (r) => {
    const counted = r.assigned - r.cancelled;
    return {
      id: r.id, name: r.name, assigned: r.assigned, done: r.done, open: r.open, cancelled: r.cancelled, created: r.created, fromEmail: r.fromEmail, selfLogged: r.selfLogged, rd: r.rd,
      rate: counted > 0 ? r.cohortDone / counted : null,
      avgHours: mean(r.durations), medianHours: median(r.durations), timed: r.durations.length,
      // per source: received in the period (the cohort), done in the period, and the time to close over the tasks done in the period
      cohortAvgHours: mean(r.cohort), cohortMedianHours: median(r.cohort), cohortClosed: r.cohort.length,
      bySource: Object.fromEntries(SOURCES.map((k) => [k, { received: r.src[k].received, done: r.src[k].done, avgHours: mean(r.src[k].durations), medianHours: median(r.src[k].durations), timed: r.src[k].durations.length,
        cohortClosed: r.src[k].cohort.length, cohortAvgHours: mean(r.src[k].cohort), cohortMedianHours: median(r.src[k].cohort) }])),
    };
  };
  const people = [...rows.values()].filter((r) => r.id !== GROUP && (r.assigned > 0 || r.created > 0 || r.done > 0 || r.open > 0 || (keep && keep.has(r.id)))).map(finish)
    .sort((a, b) => b.done - a.done || b.assigned - a.assigned || String(a.name).localeCompare(String(b.name)));
  const group = rows.has(GROUP) ? finish(rows.get(GROUP)) : null;
  const all = { id: '__team__', name: '__team__', assigned: 0, done: 0, cohortDone: 0, open: 0, cancelled: 0, created: 0, fromEmail: 0, selfLogged: 0, rd: 0, durations: [], cohort: [], src: srcBlank() };
  for (const r of rows.values()) {
    all.assigned += r.assigned; all.done += r.done; all.cohortDone += r.cohortDone; all.open += r.open; all.cancelled += r.cancelled;
    all.fromEmail += r.fromEmail; all.selfLogged += r.selfLogged; all.rd += r.rd; all.created += r.created; all.durations.push(...r.durations);
    all.cohort.push(...r.cohort);
    for (const k of SOURCES) { all.src[k].received += r.src[k].received; all.src[k].done += r.src[k].done; all.src[k].durations.push(...r.src[k].durations); all.src[k].cohort.push(...r.src[k].cohort); }
  }
  return { people, group, team: finish(all) };
}

/** Human duration: hours under two days, days above. */
export function formatHours(h, lang) {
  if (h == null) return '—';
  if (h < 48) return t(lang, 'hours', { n: Math.round(h * 10) / 10 });
  return t(lang, 'days', { n: Math.round((h / 24) * 10) / 10 });
}
export const formatRate = (r) => (r == null ? '—' : `${Math.round(r * 100)}%`);

// ===================== reports: technician points and after-sales tickets (ADR-0012) =====================
// Both are ready-made per-person reports inside myafaqy (capture of 29 Oct 2026). The technician report is monthly, so a
// period is pulled month by month; the after-sales board takes the period as a date window.
export const REPORTS_SCHEMA = 'afaqy-crm-reports/v1';
export const TECH_FIELDS = ['installedDeviceCount', 'maintainedDeviceCount', 'maintainedFixDeviceCount', 'reServiceDeviceCount', 'stopServiceDeviceCount',
  'installedAccessoriesCount', 'maintainedAccessoriesCount', 'maintainedFixAccessoriesCount', 'reServiceAccessoriesCount', 'stopServiceAccessoriesCount',
  'groupInstallationCount', 'additionalWorkCount', 'violationCount', 'totalPoint',
  'installedTransactionCount', 'maintainedTransactionCount', 'reServiceTransactionCount', 'stopServiceTransactionCount',
  'fridayWorkDaysCount', 'saturdayWorkDaysCount'];

/** The calendar months a period touches, each with the bounds the technician report expects. */
export function monthsOf(from, to) {
  const out = [];
  let y = +from.slice(0, 4), m = +from.slice(5, 7);
  while (`${y}-${pad(m)}` <= to.slice(0, 7)) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    out.push({ key: `${y}-${pad(m)}`, yearId: y, quarterId: Math.floor((m - 1) / 3) + 1, monthId: m,
      requestDate: [`${y}-${pad(m)}-01T00:00:00.000Z`, `${y}-${pad(m)}-${pad(last)}T00:00:00.000Z`] });
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}

export function buildReportsPrompt({ from, to, branch = JEDDAH_BRANCH }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) throw new Error('invalid range');
  const [fromZ, toZ] = saudiBoundsZ(from, to);
  const months = monthsOf(from, to);
  const body = (mo) => JSON.stringify({ pageNumber: 1, pageSize: 100, searchKey: '', isSearchFilter: true,
    search: { yearId: mo.yearId, quarterId: mo.quarterId, monthId: mo.monthId, branchIds: branch, userIds: [], requestDate: mo.requestDate } });
  return `You are reading two per-employee reports from the myafaqy CRM (https://myafaqy.com, API at https://crmbackend.afaqy.sa) for a read-only KPI dashboard. I am signed in with my own manager account in this tab.

ABSOLUTE RULE — NOTHING MAY CHANGE IN MYAFAQY
- You may call ONLY these three endpoints, exactly as named:
    TechnicianReport/GetTechnicianReportStatic · AfterSalesBoardReport/GetAfterSalesAgentsGrid · ActivityLog/GetTicketsGrid
- Never call anything else. Never call any endpoint whose name contains Add, Create, Insert, Edit, Update, Delete, Remove, Save, Assign, Reassign, Close, Complete, Approve, Reject, Sync, Send, Upload, Import, Change, Set, Mark, Read, Seen, Logout.
- Never press any button in the page. Never change any filter, sort, column or setting on screen.
- myafaqy uses POST to READ these reports; that is expected. The two names above are reads.
- If anything is unclear, or the app now needs a different endpoint, STOP and ask me. Do not improvise.
- Never put tokens, cookies, passwords, phone numbers, identity numbers or any pay or bonus value in your answer.

PERIOD: ${from} to ${to}, Saudi time.

HOW
- Open Technicians → Technicians Points once, and Dashboards → After Sales Board once, and confirm in the network traffic that the app sends the two requests as below. If either differs, STOP and tell me what changed.
- Replay with your JavaScript tool, reusing the headers the app sends (Authorization, X-Timezone-Offset, X-Client-Id, lang). Wait 300 ms between calls. Change only what is written below.

STEP 1 — TECHNICIAN POINTS, one call per month (the report is monthly). POST https://crmbackend.afaqy.sa/TechnicianReport/GetTechnicianReportStatic with:
${months.map((mo) => `  ${mo.key}: ${body(mo)}`).join('\n')}
   The rows are in data.gridResult.data; page with pageNumber (it starts at 1) until listCount is reached.
   From each row keep ONLY: technicianId, employeeId, nameEn, nameAr, ${TECH_FIELDS.join(', ')}.
   Do NOT keep phoneNumber, bonusValue, fridayWorkDaysBonus, saturdayWorkDaysPoints, evaluation, leadEvaluation or branchPercentage.

STEP 2 — AFTER-SALES TICKETS, one call. POST https://crmbackend.afaqy.sa/AfterSalesBoardReport/GetAfterSalesAgentsGrid with:
  {"categoryId":null,"createDate":["${fromZ}","${toZ}"],"branch":"${branch}","afterSalesId":null}
   Keep every row: id, afterSalesName, openTickets, pendingTickets, doneTickets, totalTickets.

STEP 3 — ACTIVITY LOG (the Tickets screen: every activity an engineer logs with a customer). POST https://crmbackend.afaqy.sa/ActivityLog/GetTicketsGrid with:
  {"isSearchFilter":false,"searchKey":"","search":{},"pageSize":500,"pageNumber":0,"searchCriteria":"","dateRangeIntialDaysCount":0}
   Rows come newest first. Page with pageNumber (0, 1, 2 …) and STOP as soon as a whole page is older than ${from}. If "pageSize" comes back smaller than 500, use what it returns.
   Keep ONLY the rows whose createDate falls between ${from} and ${to} (Saudi days), and from each row ONLY: ticketId, taskId, customerId, categoryId, category, caseId, case, statusId, status, createdById, createDate.
   Do NOT keep customerNameAr, customerNameEn, createdBy, description, salesMan or isVIP.

THE RESULT — ONE FILE ON MY COMPUTER, NOT IN CHAT
Save this JSON as ONE file with a download (a Blob and an <a download> link) named afaqy-reports-${from}_${to}.json:

{
  "schema": "${REPORTS_SCHEMA}",
  "range": { "from": "${from}", "to": "${to}" },
  "branch": "${branch}",
  "extractedAt": "<ISO date-time now>",
  "techPoints": [ { "month": "<YYYY-MM>", "listCount": <n>, "rows": [ { "technicianId": <n>, "employeeId": <n>, "nameEn": "<…>", "nameAr": "<…>", ${TECH_FIELDS.map((f) => `"${f}": <n>`).join(', ')} } ] } ],
  "afterSales": { "rows": [ { "id": <n>, "name": "<afterSalesName>", "open": <n>, "pending": <n>, "done": <n>, "total": <n> } ] },
  "activities": { "rows": [ { "ticketId": <n>, "taskId": <n or null>, "customerId": <n>, "categoryId": <n>, "category": "<…>", "caseId": <n>, "case": "<…>", "statusId": <n>, "status": "<…>", "createdById": <n>, "createDate": "<as returned, with Z added>" } ] },
  "notes": ["<anything the app sends differently>"]
}

Then reply with only five lines: the file name, the number of technician rows per month, the number of after-sales rows, the number of activity rows, and "No write endpoint was called."`;
}

/** Read a reports file. Returns { reports } or { error, vars }. Pay fields are dropped even if present. */
export function parseReports(text) {
  const raw = typeof text === 'string' ? extractJson(text) : text;
  if (!raw || typeof raw !== 'object') return { error: 'err_json' };
  if (raw.schema !== REPORTS_SCHEMA) return { error: 'err_schema', vars: { schema: REPORTS_SCHEMA } };
  const from = raw.range && raw.range.from, to = raw.range && raw.range.to;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '') || from > to) return { error: 'err_range' };
  const n = (v) => (Number.isFinite(+v) ? +v : 0);
  const techPoints = (Array.isArray(raw.techPoints) ? raw.techPoints : []).filter((m) => m && /^\d{4}-\d{2}$/.test(m.month || '')).map((m) => ({
    month: m.month, listCount: n(m.listCount),
    rows: (Array.isArray(m.rows) ? m.rows : []).filter((r) => r && (r.technicianId != null || r.nameEn || r.nameAr)).map((r) => {
      const o = { technicianId: r.technicianId == null ? null : String(r.technicianId), employeeId: r.employeeId == null ? null : String(r.employeeId),
        nameEn: String(r.nameEn || ''), nameAr: String(r.nameAr || '') };
      for (const f of TECH_FIELDS) o[f] = n(r[f]);
      return o;
    }),
  }));
  const rows = (raw.afterSales && Array.isArray(raw.afterSales.rows) ? raw.afterSales.rows : []).filter((r) => r && r.id != null).map((r) => ({
    id: String(r.id), name: String(r.name || r.afterSalesName || ''), open: n(r.open ?? r.openTickets), pending: n(r.pending ?? r.pendingTickets),
    done: n(r.done ?? r.doneTickets), total: n(r.total ?? r.totalTickets) }));
  const activities = (raw.activities && Array.isArray(raw.activities.rows) ? raw.activities.rows : []).filter((r) => r && r.ticketId != null && toIso(r.createDate)).map((r) => ({
    ticketId: String(r.ticketId), taskId: r.taskId == null ? null : String(r.taskId), customerId: r.customerId == null ? null : String(r.customerId),
    categoryId: r.categoryId == null ? null : String(r.categoryId), category: String(r.category || '').slice(0, 60), caseId: r.caseId == null ? null : String(r.caseId), caseName: String(r.case || r.caseName || '').slice(0, 60),
    statusId: r.statusId == null ? null : String(r.statusId), status: String(r.status || '').slice(0, 40), createdById: r.createdById == null ? null : String(r.createdById), createdAt: toIso(r.createDate) }));
  const accounts = (raw.accounts && Array.isArray(raw.accounts.rows) ? raw.accounts.rows : []).filter((r) => r && r.c != null).slice(0, 20000)
    .map((r) => ({ c: String(r.c), a: (Array.isArray(r.a) ? r.a : []).map(String).slice(0, 40), d: Number(r.d) || 0, s: r.s == null ? null : String(r.s), g: String(r.g || '').slice(0, 40),
      ...(Array.isArray(r.y) ? { y: r.y.filter((p) => Array.isArray(p) && p.length >= 1).slice(0, 40).map((p) => [String(p[0] || '?').slice(0, 40), String(p[1] || '').slice(0, 20)]) } : {}) }));
  // ADR-0120: who the unmatched engineers are (names stay on the device, never in the repo) and how much of the server-account list was read
  const accEng = raw.accounts && raw.accounts.eng && typeof raw.accounts.eng === 'object' ? Object.fromEntries(Object.entries(raw.accounts.eng).slice(0, 200).map(([k, v]) => [String(k), { en: String((v && v.en) || '').slice(0, 60), ar: String((v && v.ar) || '').slice(0, 60) }])) : {};
  const ss = raw.accounts && raw.accounts.systems, accSystems = ss && typeof ss === 'object' ? { read: Number(ss.read) || 0, total: Number(ss.total) || 0, complete: ss.complete === true } : null;
  return { reports: { key: rangeKey({ from, to }), schema: REPORTS_SCHEMA, range: { from, to }, branch: String(raw.branch || ''),
    extractedAt: toIso(raw.extractedAt), techPoints, afterSales: rows, activities, accounts, accEng, accSystems, notes: Array.isArray(raw.notes) ? raw.notes.map(String).slice(0, 30) : [] } };
}

/** Factor 2: technician points over the period — the months summed per technician; people with no field work left out. */
export function techTotals(reports) {
  const by = new Map();
  for (const m of reports.techPoints || []) for (const r of m.rows) {
    const key = r.technicianId || r.nameEn || r.nameAr;
    if (!by.has(key)) by.set(key, { technicianId: r.technicianId, nameEn: r.nameEn, nameAr: r.nameAr, months: 0, ...Object.fromEntries(TECH_FIELDS.map((f) => [f, 0])) });
    const t = by.get(key); t.months++;
    for (const f of TECH_FIELDS) t[f] += r[f];
  }
  const work = (t) => t.installedDeviceCount + t.maintainedDeviceCount + t.maintainedFixDeviceCount + t.reServiceDeviceCount + t.stopServiceDeviceCount
    + t.groupInstallationCount + t.additionalWorkCount + t.installedAccessoriesCount + t.maintainedAccessoriesCount + t.violationCount + t.totalPoint;
  const rows = [...by.values()].filter((t) => work(t) > 0).sort((a, b) => b.totalPoint - a.totalPoint || b.installedDeviceCount - a.installedDeviceCount);
  const total = Object.fromEntries(TECH_FIELDS.map((f) => [f, rows.reduce((s, t) => s + t[f], 0)]));
  return { rows, total };
}

/** Factor 3: after-sales tickets per person, busiest first; people with no tickets left out. */
/** Factor 4: the activity log per person — activities, distinct customers, by status and by category; busiest first. */
export function activityTotals(reports, team = null) {
  const { from, to } = reports.range;
  const rows = (reports.activities || []).filter((a) => a.createdById && saudiDay(a.createdAt) >= from && saudiDay(a.createdAt) <= to && (!team || team.includes(a.createdById)));
  const statuses = [...new Set(rows.map((a) => a.status).filter(Boolean))];
  const categories = [...new Set(rows.map((a) => a.category).filter(Boolean))];
  const by = new Map();
  for (const a of rows) {
    if (!by.has(a.createdById)) by.set(a.createdById, { id: a.createdById, activities: 0, customers: new Set(), withTask: 0, byStatus: {}, byCategory: {} });
    const r = by.get(a.createdById); r.activities++; if (a.customerId) r.customers.add(a.customerId); if (a.taskId) r.withTask++;
    if (a.status) r.byStatus[a.status] = (r.byStatus[a.status] || 0) + 1;
    if (a.category) r.byCategory[a.category] = (r.byCategory[a.category] || 0) + 1;
  }
  const people = [...by.values()].map((r) => ({ ...r, customers: r.customers.size })).sort((a, b) => b.activities - a.activities || b.customers - a.customers);
  const total = { activities: rows.length, customers: new Set(rows.map((a) => a.customerId).filter(Boolean)).size, withTask: rows.filter((a) => a.taskId).length,
    byStatus: Object.fromEntries(statuses.map((st) => [st, rows.filter((a) => a.status === st).length])), byCategory: Object.fromEntries(categories.map((c) => [c, rows.filter((a) => a.category === c).length])) };
  return { people, total, statuses, categories };
}

/** Factor 5: account coverage. For each engineer: accounts carried, devices on them, and how many were touched in the period. */
export function coverageTotals(reports, team = null, tasks = []) {
  const acc = reports.accounts || []; if (!acc.length) return { people: [], total: { accounts: 0, devices: 0, uncovered: 0 } };
  const { from, to } = reports.range;
  const inR = (iso) => { const d = saudiDay(iso); return d && d >= from && d <= to; };
  const touched = new Map();
  for (const a of reports.activities || []) if (a.createdById && a.customerId && inR(a.createdAt)) (touched.get(a.createdById) || touched.set(a.createdById, new Set()).get(a.createdById)).add(String(a.customerId));
  const ids = team ? new Set(team) : new Set(acc.flatMap((r) => r.a).filter((x) => !x.startsWith('e')));
  const people = [...ids].map((id) => {
    const mine = acc.filter((r) => r.a.includes(id)); const tch = touched.get(id) || new Set();
    return { id, accounts: mine.length, devices: mine.reduce((s, r) => s + r.d, 0), touched: mine.filter((r) => tch.has(r.c)).length, solo: mine.filter((r) => r.a.length === 1).length };
  }).filter((p) => p.accounts > 0).sort((a, b) => b.accounts - a.accounts);
  const uncovered = acc.filter((r) => !r.a.some((x) => ids.has(x))).length;
  return { people, total: { accounts: acc.length, devices: acc.reduce((s, r) => s + r.d, 0), uncovered, zeroDevices: acc.filter((r) => !r.d).length } };
}

// ADR-0120: the two steps of reading systems inside MyAFAQY, kept here so the tests run the very code the bookmark runs.
// The server-account list carries the server's address, not its system; the Server IP list names the system for each address.
// The match is exact, port included (212.70.48.37:9966 is vss_37); MyAFAQY leaves line breaks after some addresses, so both sides are trimmed.
export function serverIpMap(rows, into) { for (const r of rows || []) { const ip = String((r && r.serverIP) || '').trim(); if (ip && !(ip in into)) into[ip] = String(r.systemName || '').trim().slice(0, 40) || '?'; } return into; }
export function attachSystems(byCustomer, rows, ipSys) { let n = 0; for (const r of rows || []) { const x = byCustomer.get(String(r && r.customerId)); if (!x) continue; const ip = String(r.serverIp || '').trim(); (x.y || (x.y = [])).push([ip in ipSys ? ipSys[ip] : '?', String(r.status || '').slice(0, 20)]); n++; } return n; }
/** ADR-0120: the After-Sales Accounts board — the whole Jeddah list as MyAFAQY holds it on the day of the pull: accounts, devices,
 * segments, servers by system, and how many accounts each engineer carries. A system is counted by customers (one customer on two
 * vss servers is one VSS customer), never by adding rows. Systems are only claimed when the whole server-account list was read. */
export function accountsBoard(reports) {
  const acc = reports.accounts || [], sys = reports.accSystems || null;
  const total = { accounts: acc.length, devices: acc.reduce((s, r) => s + r.d, 0), zero: acc.filter((r) => !r.d).length, unassigned: acc.filter((r) => !r.a.length).length };
  const segBy = new Map();
  for (const r of acc) { const k = r.g || ''; const v = segBy.get(k) || { name: k, accounts: 0, devices: 0 }; v.accounts++; v.devices += r.d; segBy.set(k, v); }
  const segments = [...segBy.values()].sort((a, b) => b.accounts - a.accounts);
  const engBy = new Map();
  for (const r of acc) for (const id of new Set(r.a)) { const v = engBy.get(id) || { id, accounts: 0, devices: 0, solo: 0 }; v.accounts++; v.devices += r.d; if (r.a.length === 1) v.solo++; engBy.set(id, v); }
  const engineers = [...engBy.values()].sort((a, b) => b.accounts - a.accounts || b.devices - a.devices);
  const hasSystems = !!(sys && sys.complete && acc.some((r) => Array.isArray(r.y)));
  const working = (st) => /^working$/i.test(st);
  const sysBy = new Map(), fam = new Map(), FAMS = [['vss', /^vss_/i], ['cms', /^cms_/i]];
  let withServer = 0, withWorking = 0;
  if (hasSystems) for (const r of acc) {
    const y = r.y || []; if (y.length) withServer++; if (y.some(([, st]) => working(st))) withWorking++;
    const names = new Set(y.map(([n]) => n));
    for (const n of names) { const v = sysBy.get(n) || { name: n, customers: 0, working: 0, servers: 0, devices: 0 }; v.customers++; v.devices += r.d; if (y.some(([m, st]) => m === n && working(st))) v.working++; sysBy.set(n, v); }
    for (const [n] of y) sysBy.get(n).servers++;
    for (const [f, re] of FAMS) { const mine = y.filter(([n]) => re.test(n)); if (!mine.length) continue;
      const v = fam.get(f) || { id: f, customers: 0, working: 0, members: new Set() }; v.customers++; if (mine.some(([, st]) => working(st))) v.working++; mine.forEach(([n]) => v.members.add(n)); fam.set(f, v); }
  }
  const systems = [...sysBy.values()].sort((a, b) => b.customers - a.customers || a.name.localeCompare(b.name));
  const families = [...fam.values()].map((v) => ({ ...v, members: [...v.members].sort() }));
  return { total: { ...total, withServer, withWorking, noServer: hasSystems ? acc.length - withServer : null }, segments, engineers, systems, families, hasSystems,
    systemsRead: sys ? { read: sys.read, total: sys.total, complete: sys.complete } : null };
}

export function afterSalesTotals(reports) {
  const rows = (reports.afterSales || []).filter((r) => r.total > 0 || r.open > 0 || r.pending > 0 || r.done > 0)
    .sort((a, b) => b.total - a.total || b.done - a.done);
  const total = rows.reduce((s, r) => ({ open: s.open + r.open, pending: s.pending + r.pending, done: s.done + r.done, total: s.total + r.total }), { open: 0, pending: 0, done: 0, total: 0 });
  return { rows, total };
}

// ===================== my KPIs: an engineer's own profile, read through their own myafaqy session =====================
// ADR-0010. A bookmark runs on myafaqy's page, reads «My Tasks» (taskGroupId 100000 — only the signed-in person's tasks,
// enforced by myafaqy itself) with the engineer's own sign-in, and hands the portal ONLY these fields, through the
// address fragment (never sent to any server). The sign-in token never leaves myafaqy's page.
export const ME_SCHEMA = 'afaqy-me/v1';
export const ME_SCHEMA_V2 = 'afaqy-me/v2';   // v6.10: the person plus whatever myafaqy shows them (ADR-0014)
export const ME_MONTHS = 12;

/** The bookmark, as a javascript: address. portalUrl is where the portal lives (…/afaqy-portal/). */
/**
 * The manager bookmark. Runs on myafaqy with the manager's own sign-in and reads, for a period, everything the two
 * prompts read — all tasks, the R&D queue, technician points, after-sales tickets — then saves two files to download
 * (tasks + reports), the same files the Data page takes. Read-only; the token never leaves the page.
 */
// Same schemas as the manual file upload. Reject a mixed or partial pair before anything is stored.
export const MANAGER_AUTO_SCHEMA = 'afaqy-manager-import/v1';
export function parseManagerTransfer(message) {
  if (!message || message.type !== MANAGER_AUTO_SCHEMA ||
    !/^[0-9a-f]{32}$/.test(message.nonce || '') ||
    !message.tasks || !message.reports ||
    message.tasks.schema !== SCHEMA || message.tasks.taskGroupId !== 100001 ||
    message.reports.schema !== REPORTS_SCHEMA) return { error: 'mgr_auto_invalid' };
  const tasks = parseDataset(message.tasks), reports = parseReports(message.reports);
  if (tasks.error || reports.error) return { error: 'mgr_auto_invalid' };
  const a = tasks.dataset.range, b = reports.reports.range;
  if (a.from !== b.from || a.to !== b.to) return { error: 'mgr_auto_range' };
  return { dataset: tasks.dataset, reports: reports.reports, skipped: tasks.skipped || 0 };
}

/** A portal address a bookmark may send data to: https without credentials — or this machine, for local testing only. */
export function safePortalUrl(u) {
  try { const x = u instanceof URL ? u : new URL(u); if (x.username || x.password) return false;
    return x.protocol === 'https:' || (x.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(x.hostname)); } catch { return false; }
}
/** Every value the manager pull reads (ADR-0062): the bookmark writes them into its header; the browser extension passes them as data. */
export function managerPullRecipe(from, to, branch = JEDDAH_BRANCH, lang = 'ar', delivery = 'download', portalUrl = '') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) throw new Error('invalid range');
  const mode = delivery === 'auto' ? 'auto' : delivery === 'ext' ? 'ext' : 'download';
  const targetUrl = mode === 'auto' ? new URL(portalUrl) : null;
  if (targetUrl && !safePortalUrl(targetUrl)) throw new Error('invalid portal URL');
  const [fromZ, toZ] = saudiBoundsZ(from, to);
  const nowYmd = ymd(saudiToday());
  const [, nowZ] = saudiBoundsZ(nowYmd, nowYmd);
  const later = to < nowYmd;
  const months = monthsOf(from, to);
  const msg = {
    ar: ['افتح ماي أفاقي أولًا ثم اضغط الإشارة من هناك', 'سجّل دخولك في ماي أفاقي أولًا', 'جارٍ تحميل بيانات الفريق… ', 'تعذّر التحميل: ', 'تم — نزّل الملفين وارفعهما في البوابة', 'تم إرسال بيانات الفريق للوحة الإدارة وحفظها', 'تعذر الاستيراد المباشر؛ تم تنزيل الملفين للرفع اليدوي', 'جارٍ إرسال البيانات للبوابة…'],
    en: ['Open myafaqy first, then press the bookmark there', 'Sign in to myafaqy first', 'Loading team data… ', 'Could not load: ', 'Done — download both files and upload them in the portal', 'Team data was imported into the admin portal', 'Direct import did not finish; both files were downloaded for manual upload', 'Sending data to the portal…'],
    ur: ['پہلے مائی آفاقی کھولیں، پھر وہاں بک مارک دبائیں', 'پہلے مائی آفاقی میں لاگ اِن کریں', 'ٹیم کا ڈیٹا لوڈ ہو رہا ہے… ', 'لوڈ نہیں ہو سکا: ', 'ہو گیا — دونوں فائلیں ڈاؤن لوڈ کر کے پورٹل میں اپ لوڈ کریں', 'ٹیم کا ڈیٹا انتظامی پورٹل میں محفوظ ہوگیا', 'براہ راست ترسیل مکمل نہیں ہوئی؛ دستی اپ لوڈ کے لیے دونوں فائلیں محفوظ ہوگئیں', 'ڈیٹا پورٹل میں بھیجا جا رہا ہے…'],
  }[lang] || [];
    return { M: msg, FROM: from, TO: to, BR: String(branch), DEL: mode, PORTAL: targetUrl ? targetUrl.origin + targetUrl.pathname : '', PACKET: MANAGER_AUTO_SCHEMA,
    FZ: fromZ, TZ: toZ, NZ: nowZ, LATER: later, JED: String(branch) === String(JEDDAH_BRANCH), SCH: SCHEMA, RSCH: REPORTS_SCHEMA,
    MMS: months.map((m) => ({ month: m.key, yearId: m.yearId, quarterId: m.quarterId, monthId: m.monthId, rd: m.requestDate })), KEEP: TECH_FIELDS };
}
export const MANAGER_PULL_KEYS = ['M', 'FROM', 'TO', 'BR', 'DEL', 'PORTAL', 'PACKET', 'FZ', 'TZ', 'NZ', 'LATER', 'JED', 'SCH', 'RSCH', 'MMS', 'KEEP'];
/** ADR-0108: MyAFAQY's key lives 8 hours and is renewed in the same place a moment after the page opens; a pull that read it
 *  first got a stale key (HTTP 401). Every pull now waits for a valid key, and on a 401 waits for the renewed one and retries once.
 *  ADR-0110: MyAFAQY also answers 401 when the account has no permission for a list (an account outside the team structure).
 *  A refused key that has NOT expired waits only 5 s for a newer one, then stops with DENIED — never «press F5». `fx` uses the
 *  `tk` and `H` the script declares after this text. */
export const TOKEN_JS = "const RENEW='Your MyAFAQY session needs renewing: press F5 on this page, then press the button again. · جلسة ماي أفاقي محتاجة تتجدد: اضغط F5 في الصفحة دي وبعدين اضغط الزرار تاني.';const jwtExp=t=>{try{const p=JSON.parse(atob(String(t).split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return p&&p.exp?p.exp*1000:0}catch(e){return 0}};const tokOk=t=>!!t&&(!jwtExp(t)||jwtExp(t)-Date.now()>60000);const freshTok=async(old,ms)=>{for(let i=0;;i++){const t=localStorage.getItem('token');if(tokOk(t)&&t!==old)return t;if(i*1000>=ms)return null;await new Promise(r=>setTimeout(r,1000))}};const DENIED='MyAFAQY refused this account: it has no permission for this list. Pull with an account that can see the team. · ماي أفاقي رفض الحساب ده: مالوش صلاحية على القايمة دي. اسحب بحساب يقدر يشوف الفريق.';const fx=async(u,o)=>{let r=await fetch(u,o);if(r.status!==401)return r;const live=tokOk(tk);const n=await freshTok(tk,live?5000:60000);if(n){tk=n;H['Authorization']='Bearer '+n;r=await fetch(u,o);if(r.status!==401)return r;throw new Error(DENIED+' ('+String(u).split('/').slice(-2).join('/')+')')}throw new Error(live?DENIED+' ('+String(u).split('/').slice(-2).join('/')+')':RENEW)};";
/** The pull itself, with no values woven in: it reads only the recipe's names. The bookmark and the extension run this same text. */
export const MANAGER_PULL_BODY = `const RTO=(()=>{const d=new Date(Date.now()+108e5).toISOString().slice(0,10);return TO>d?d:TO})();

if(location.hostname!=='myafaqy.com'){alert(M[0]);return}
${TOKEN_JS}let tk=localStorage.getItem('token');if(!tk){alert(M[1]);return}if(!tokOk(tk)){const n=await freshTok(null,90000);if(!n){alert(RENEW);return}tk=n}
const WHO=(()=>{try{const p=JSON.parse(decodeURIComponent(escape(atob(tk.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))));return p&&p.UserId!=null?{id:String(p.UserId),name:String(p.UserName||'').slice(0,80)}:null}catch(e){return null}})();
let sink=null,nonce='',ready=false,acked=null,receiver=null;let targetOrigin='';
if(DEL==='auto'){
  try{
    nonce=Array.from(crypto.getRandomValues(new Uint32Array(4))).map(n=>n.toString(16).padStart(8,'0')).join('');
    const dest=new URL(PORTAL);targetOrigin=dest.origin;dest.searchParams.set('mgrImport',nonce);dest.hash='data';
    sink=window.open(dest.href,'_blank');
    if(sink){receiver=e=>{if(e.origin!==targetOrigin||e.source!==sink||!e.data||e.data.nonce!==nonce)return;
      if(e.data.type==='afaqy-manager-ready/v1')ready=true;
      if(e.data.type==='afaqy-manager-ack/v1')acked=e.data.ok===true?'ok':'failed';};
      window.addEventListener('message',receiver);
    }
  }catch(_){sink=null;}
}/* popup setup finished */
const box=document.createElement('div');box.style.cssText='position:fixed;inset:auto 16px 16px auto;z-index:2147483647;background:#0F2231;color:#fff;padding:12px 16px;border-radius:10px;font:14px system-ui;max-width:320px';box.textContent=M[2];document.body.append(box);
const H={'Authorization':'Bearer '+tk,'Content-Type':'application/json','X-Timezone-Offset':'-180','X-Client-Id':localStorage.getItem('browser_client_id')||'','lang':'en'};
const say=t=>{box.textContent=t};const wait=ms=>new Promise(r=>setTimeout(r,ms));
const post=async(path,body)=>{const r=await fx('https://crmbackend.afaqy.sa/'+path,{method:'POST',headers:H,body:JSON.stringify(body)});if(!r.ok)throw new Error(path+' HTTP '+r.status);const j=await r.json();if(j&&j.success===false)throw new Error(j.message||path+' refused');return j};
const get=async(path)=>{const r=await fx('https://crmbackend.afaqy.sa/'+path,{headers:H});if(!r.ok)throw new Error(path+' HTTP '+r.status);return r.json()};
const dl=(name,obj)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj)],{type:'application/json'}));a.download=name;document.body.append(a);a.click();a.remove()};
const taskBody=(b,n,size,co,grp)=>({donePageNumber:b==='done'?n:0,donePageSize:b==='done'?size:1,openPageNumber:b==='open'?n:0,openPageSize:b==='open'?size:1,toDoPageNumber:b==='toDo'?n:0,toDoPageSize:b==='toDo'?size:1,orderBy:1,taskGroupId:grp,searchKey:'',tasksGridStatusId:1,assignedBy:[],createdBy:[],agent:[],statusIds:[],type:[],priority:[],assignedOn:[],completedOn:co});
const SKIP=[];const opt=async(path,f)=>{try{return await f()}catch(e){if(String((e&&e.message)||'').indexOf(RENEW)===0)throw e;if(SKIP.indexOf(path)<0)SKIP.push(path);return {}}};const postO=(p,b)=>opt(p,()=>post(p,b));const getO=(p)=>opt(p.split('/').slice(0,2).join('/'),()=>get(p));
try{
const U=await postO('Security/GetAllHierarchyUsersDropDown',{pageSize:1000,pageNumber:0,searchCriteria:'',selectedId:[]});
const udata=(U.data&&(U.data.data||U.data))||[];const uname={};for(const p of udata)uname[String(p.id)]=p;
const people=[];const teamsSeen={};
for(let pg=0;;pg++){const T=await postO('Teams/GetAllTeams',{isSearchFilter:false,searchKey:'',search:{},pageSize:50,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(T.data&&(T.data.data||T.data))||[];for(const t of arr)teamsSeen[String(t.id)]=t;const tot=(T.data&&T.data.totalPages)||1;if(pg+1>=tot||!arr.length)break;await wait(200)}
const teamOf={};const teamTypes={};for(const id of Object.keys(teamsSeen)){const d=await getO('Teams/GetTeamById/'+id);const td=(d&&d.data)||{};const bc=td.branchCode==null?null:String(td.branchCode);const jed=bc===BR||(JED&&/jeddah/i.test(String(td.nameEn||td.name||'')));if(jed){const tn=td.nameEn||td.name||id;for(const[k,v]of Object.entries(td))if(k!=='groupUsersDto'&&Array.isArray(v)&&v.length&&v.every(x=>x&&typeof x==='object'&&(x.nameEn||x.name)&&x.userId==null)){teamTypes[tn]=v.map(x=>({id:x.id??x.taskSettingId??null,nameEn:String(x.nameEn||x.name||''),nameAr:String(x.nameAr||'')}))}}for(const g of td.groupUsersDto||[]){const uid=String(g.userId);(teamOf[uid]=teamOf[uid]||{teams:[],branchCode:null,jeddah:false}).teams.push(td.nameEn||td.name||id);if(bc)teamOf[uid].branchCode=bc;if(jed)teamOf[uid].jeddah=true;if(!uname[uid]&&(g.nameEn||g.nameAr))uname[uid]={nameEn:g.nameEn,nameAr:g.nameAr}}await wait(150)}
const employees=[];try{for(let pg=0;pg<200;pg++){const R=await post('EmployeeIC/GetAllEmployeesGrid',{isSearchFilter:false,searchKey:'',search:{},pageSize:10,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const D=(R&&R.data)||{};for(const e of D.data||[])employees.push({id:e.id==null?null:String(e.id),nameEn:e.nameEn,nameAr:e.nameAr,department:e.department,manager:e.manager,branch:e.branch,branchCode:e.branchCode,status:e.status});if(pg+1>=(D.totalPages||1))break;await wait(150)}}catch(e){if(String((e&&e.message)||'').indexOf(RENEW)===0)throw e;if(SKIP.indexOf('EmployeeIC/GetAllEmployeesGrid')<0)SKIP.push('EmployeeIC/GetAllEmployeesGrid')}
const walk=async(grp,co,keepRd,buckets=['done','open','toDo'])=>{const out=[];const rd=[];say(M[2]+(keepRd?'R&D':'tasks'));for(const b of buckets){let size=500,pg=0,total=null;for(;;){const d=((await post('Task/GetMyTasksGrid',taskBody(b,pg,size,co,grp))).data||{})[b];if(!d)break;if(pg===0&&d.pageSize!==size)size=d.pageSize||20;total=d.listCount;for(const x of d.data||[]){if(keepRd){rd.push(String(x.id));continue;}out.push({i:String(x.id),title:x.title,taskType:x.taskType,taskSettingId:x.taskSettingId,statusId:x.statusId,isCancelled:x.isCancelled,createdOn:x.createdOn,closeDate:x.closeDate,createUserId:x.createUserId,assigneeId:x.assigneeId,moduleId:x.moduleId,customerTag:x.customerTag,bucket:b})}pg++;if(!d.data||!d.data.length||pg*size>=total)break;await wait(250)}}return{out,rd}};
const main=await walk(100001,[FROM&&FZ||'',TO&&TZ||''],false,['done']);let tasks=main.out;const doneTotal=tasks.length;
const opn=await walk(100001,[],false,['open','toDo']);const seenO=new Set(tasks.map(t=>t.i));for(const t of opn.out)if(!seenO.has(t.i)){seenO.add(t.i);tasks.push(t)}const openTotal=opn.out.length;
if(LATER){const late=await walk(100001,[TZ,NZ],false,['done']);const seen=new Set(tasks.map(t=>t.i));for(const t of late.out){const c=t.createdOn?t.createdOn+'Z':'';if(t.bucket==='done'&&!seen.has(t.i)&&c>=FZ&&c<TZ)tasks.push(t)}}
const rdq=await walk(12,[FROM&&FZ||'',TO&&TZ||''],true,['done']);const rdo=await walk(12,[],true,['open','toDo']);const rdIds=[...new Set([...rdq.rd,...rdo.rd])];
const mapTask=x=>{const uid=String(x.assigneeId||'');const tt=teamOf[uid]||{teams:[],branchCode:null};return{id:String(x.i),title:String(x.title||''),typeId:x.taskSettingId??null,type:String(x.taskType||''),statusId:x.statusId,state:x.isCancelled?'cancelled':x.statusId===3?'done':'open',createdAt:x.createdOn?x.createdOn+'Z':null,createdById:x.createUserId==null?null:String(x.createUserId),assigneeId:uid,completedAt:x.statusId===3&&!x.isCancelled&&x.closeDate?x.closeDate+'Z':null,moduleId:x.moduleId,customer:x.customerTag||null,bucket:x.bucket}};
const seenId=new Set();const taskRows=[];for(const x of tasks){if(seenId.has(x.i))continue;seenId.add(x.i);taskRows.push(mapTask(x))}
say(M[2]+'start times');const firstStart=${firstStart.toString()};const since7=Date.now()-7*864e5;let stRead=0,stAsked=0;for(const t of taskRows){if(!t.createdAt||Date.parse(t.createdAt)<since7||t.state==='cancelled'||t.bucket==='toDo')continue;if(stAsked>=800)break;stAsked++;const d=await getO('Task/GetTask/'+t.id);const acts=d&&d.data&&Array.isArray(d.data.activities)?d.data.activities:null;if(acts){stRead++;const f=firstStart(acts);if(f)t.startedAt=f}if(stAsked%25===0)say(M[2]+'start times '+stAsked);await wait(120)}
const pids=new Set();taskRows.forEach(t=>{if(t.assigneeId)pids.add(t.assigneeId);if(t.createdById)pids.add(t.createdById)});for(const[uid,tt]of Object.entries(teamOf))if(tt.jeddah)pids.add(uid);
for(const id of pids){const u=uname[id]||{};const tt=teamOf[id]||{teams:[],branchCode:null};people.push({id,nameEn:String(u.nameEn||''),nameAr:String(u.nameAr||''),teams:tt.teams,branchCode:tt.branchCode})}
const tasksFile={schema:SCH,range:{from:FROM,to:RTO},skippedLists:SKIP,pulledBy:WHO,extractedAt:new Date().toISOString(),taskGroupId:100001,source:{endpoint:'POST https://crmbackend.afaqy.sa/Task/GetMyTasksGrid',doneInRangeTotal:doneTotal,openTotal:openTotal,pageSize:500},people,tasks:taskRows,rdTaskIds:rdIds,teamTypes,employees,notes:['manager bookmark; times UTC with Z added'],startTimes:{since:new Date(since7).toISOString(),asked:stAsked,read:stRead}};
say(M[2]+'reports');const techPoints=[];const MM=MMS;

for(const mo of MM){const rows=[];for(let pg=1;;pg++){const R=await postO('TechnicianReport/GetTechnicianReportStatic',{pageNumber:pg,pageSize:100,searchKey:'',isSearchFilter:true,search:{yearId:mo.yearId,quarterId:mo.quarterId,monthId:mo.monthId,branchIds:BR,userIds:[],requestDate:mo.rd}});const g=(R.data&&R.data.gridResult)||{};const arr=g.data||[];for(const r of arr){const o={technicianId:r.technicianId,employeeId:r.employeeId,nameEn:r.nameEn,nameAr:r.nameAr};for(const f of KEEP)o[f]=r[f]||0;rows.push(o)}const tot=g.totalPages||1;if(pg>=tot||!arr.length)break;await wait(200)}techPoints.push({month:mo.month,listCount:rows.length,rows})}
say(M[2]+'activity log');const acts=[];for(let pg=0;pg<200;pg++){const R=await postO('ActivityLog/GetTicketsGrid',{isSearchFilter:false,searchKey:'',search:{},pageSize:500,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(R.data&&(R.data.data||R.data))||[];if(!arr.length)break;let older=0;for(const r of arr){const d=String(r.createDate||'').slice(0,10);if(d<FROM){older++;continue}if(d>TO)continue;acts.push({ticketId:r.ticketId,taskId:r.taskId??null,customerId:r.customerId??null,categoryId:r.categoryId??null,category:r.category||'',caseId:r.caseId??null,case:r.case||'',statusId:r.statusId??null,status:r.status||'',createdById:r.createdById??null,createDate:r.createDate?r.createDate+'Z':null})}if(older===arr.length||(R.data&&R.data.totalPages&&pg+1>=R.data.totalPages))break;await wait(250)}
say(M[2]+'accounts');const ENG=((await postO('AfterSales/GetAllAfterSalesEngineers')).data||[]);const byName={};for(const[uid,u]of Object.entries(uname)){const n=String((u&&u.nameEn)||'').trim().toLowerCase();if(n)byName[n]=uid}const emp2uid={};for(const e of ENG){const u=byName[String(e.nameEn||'').trim().toLowerCase()];if(u)emp2uid[String(e.id)]=u}const accts=[];let asz=500;for(let pg=0;pg<60;pg++){const R=await postO('AfterSales/GetAfterSalesRequestGrid',{isSearchFilter:false,searchKey:'',search:{},pageSize:asz,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const d=R.data||{};const arr=d.data||[];if(pg===0&&d.pageSize&&d.pageSize<asz)asz=d.pageSize;for(const r of arr)if(String(r.branchCode)===BR)accts.push({c:String(r.customerId??r.id),a:(r.afterSalesManIds||[]).map(String).map(x=>emp2uid[x]||('e'+x)),d:+r.connectedDevices||0,s:r.segmentId??null,g:String(r.segment||'').slice(0,40)});if(!arr.length||(pg+1)*asz>=(d.listCount||0))break;await wait(200)}
const engN={};for(const e of ENG)if(!emp2uid[String(e.id)])engN['e'+e.id]={en:String(e.nameEn||'').slice(0,60),ar:String(e.nameAr||'').slice(0,60)};
say(M[2]+'systems');const serverIpMap=${serverIpMap.toString()};const attachSystems=${attachSystems.toString()};const LB=(pg,sz)=>({isSearchFilter:false,searchKey:'',search:{},pageSize:sz,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const ipSys={};let isz=100;for(let pg=0;pg<20;pg++){const R=await postO('TechniqueSystem/GetGridServerIPs',LB(pg,isz));const d=R.data||{};const arr=d.data||[];if(pg===0&&d.pageSize&&d.pageSize<isz)isz=d.pageSize;serverIpMap(arr,ipSys);if(!arr.length||(pg+1)*isz>=(d.listCount||0))break;await wait(200)}
const jed=new Map(accts.map(x=>[x.c,x]));let sysRows=0,sysTotal=0,ssz=500,sysDone=false;if(Object.keys(ipSys).length){for(let pg=0;pg<400;pg++){const R=await postO('CustomerServerAccount/GetAllCustomerAccounts',LB(pg,ssz));const d=R.data||{};const arr=d.data||[];if(pg===0){sysTotal=d.listCount||0;if(d.pageSize&&d.pageSize<ssz)ssz=d.pageSize}sysRows+=arr.length;attachSystems(jed,arr,ipSys);if(pg%5===4)say(M[2]+'systems '+sysRows+' / '+sysTotal);if(!arr.length||(pg+1)*ssz>=sysTotal){sysDone=sysRows>=sysTotal;break}await wait(200)}}

const AS=await postO('AfterSalesBoardReport/GetAfterSalesAgentsGrid',{categoryId:null,createDate:[FZ,TZ],branch:BR,afterSalesId:null});
const asArr=(AS.data&&(AS.data.data||AS.data))||[];const afterSales={rows:asArr.map(r=>({id:r.id,name:r.afterSalesName,open:r.openTickets||0,pending:r.pendingTickets||0,done:r.doneTickets||0,total:r.totalTickets||0}))};
const repFile={schema:RSCH,range:{from:FROM,to:RTO},branch:BR,extractedAt:new Date().toISOString(),techPoints,afterSales,activities:{rows:acts},accounts:{rows:accts,unmatched:ENG.filter(e=>!emp2uid[String(e.id)]).length,eng:engN,systems:{read:sysRows,total:sysTotal,complete:sysDone}},notes:['manager bookmark']};
if(DEL==='ext'){window.postMessage({type:PACKET,ext:true,tasks:tasksFile,reports:repFile},location.origin);box.style.background='#0A5F67';say(M[5]);setTimeout(()=>box.remove(),6000);return}
if(DEL==='auto'&&sink){
  say(M[7]);
  for(let k=0;k<40&&!ready;k++)await wait(500);
  if(ready){
    const packet={type:PACKET,nonce,tasks:tasksFile,reports:repFile};
    for(let k=0;k<3&&!acked;k++){try{sink.postMessage(packet,targetOrigin)}catch(_){break}
      for(let w=0;w<15&&!acked;w++)await wait(500)}
  }
  if(acked==='ok'){if(receiver)window.removeEventListener('message',receiver);
    box.style.background='#0A5F67';say(M[5]);setTimeout(()=>box.remove(),12000);return}
}/* direct transfer or fallback */
if(receiver)window.removeEventListener('message',receiver);
dl('afaqy-tasks-'+FROM+'_'+TO+'.json',tasksFile);await wait(400);dl('afaqy-reports-'+FROM+'_'+TO+'.json',repFile);
box.style.background=DEL==='auto'?'#7d5f15':'#0A5F67';
say((DEL==='auto'?M[6]:M[4])+' ('+taskRows.length+' / '+techPoints.reduce((s,m)=>s+m.rows.length,0)+' / '+afterSales.rows.length+' / '+acts.length+' / '+accts.length+')');
setTimeout(()=>box.remove(),14000);
}catch(e){if(receiver)window.removeEventListener('message',receiver);box.style.background='#7a1f1f';say(M[3]+e.message);setTimeout(()=>box.remove(),12000)}`;
export function buildManagerBookmarklet(from, to, branch = JEDDAH_BRANCH, lang = 'ar', delivery = 'download', portalUrl = '') {
  const R = managerPullRecipe(from, to, branch, lang, delivery, portalUrl);
  const code = `(async()=>{const {${MANAGER_PULL_KEYS.join(',')}}=${JSON.stringify(R)};\n${MANAGER_PULL_BODY}})();`;
  return 'javascript:' + encodeURIComponent(code.replace(/\n/g, ''));
}

/**
 * The assignment panel (ADR-0018). A bookmark that opens a panel INSIDE myafaqy with the manager's own sign-in: pick the
 * after-sales engineers, see the Jeddah coverage, pilot on ten accounts, then apply to the rest. The only write in the
 * whole portal: POST AfterSales/AssignAfterSales, ADD mode (existing ∪ chosen), branchCode "2" only, by a button press.
 */
/**
 * «أنواع الفرق» (ADR-0053): a light bookmark that reads only the teams and their linked task types from myafaqy and hands them to the
 * portal by the same secured hand-over as the data pull (a fresh nonce, the portal's own origin, an acknowledgement). No tasks, no
 * reports, and the sign-in token never leaves myafaqy. The reading and hand-over below are taken verbatim from the manager bookmark.
 */
export const TEAMTYPES_AUTO_SCHEMA = 'afaqy-teamtypes-import/v1';
export function buildTypesBookmarklet(portalUrl, branch = JEDDAH_BRANCH, lang = 'ar') {
  const targetUrl = new URL(portalUrl);
  if (!safePortalUrl(targetUrl)) throw new Error('invalid portal URL');
  const msg = {
    ar: ['افتح ماي أفاقي أولًا ثم اضغط الإشارة من هناك', 'سجّل دخولك في ماي أفاقي أولًا', 'جارٍ قراءة أنواع الفرق… ', 'تعذّرت القراءة: ', '', 'وصلت قائمة الأنواع للبوابة ✓', 'لم تصل القائمة للبوابة — افتحها من زر «حدّث قائمة الأنواع» ثم اضغط الإشارة مرة أخرى', 'جارٍ إرسال القائمة للبوابة…'],
    en: ['Open myafaqy first, then press the bookmark there', 'Sign in to myafaqy first', 'Reading the team task types… ', 'Could not read: ', '', 'The type list reached the portal ✓', 'The list did not reach the portal — open it from “Update the type list” and press the bookmark again', 'Sending the list to the portal…'],
    ur: ['پہلے مائی آفاقی کھولیں، پھر وہاں بک مارک دبائیں', 'پہلے مائی آفاقی میں لاگ اِن کریں', 'ٹیموں کی کام کی اقسام پڑھی جا رہی ہیں… ', 'پڑھا نہیں جا سکا: ', '', 'اقسام کی فہرست پورٹل تک پہنچ گئی ✓', 'فہرست پورٹل تک نہیں پہنچی — «اقسام کی فہرست تازہ کریں» سے کھولیں اور بک مارک دوبارہ دبائیں', 'فہرست پورٹل کو بھیجی جا رہی ہے…'],
  }[['en', 'ur'].includes(lang) ? lang : 'ar'];
  const code = `(async()=>{const M=${JSON.stringify(msg)},BR=${JSON.stringify(String(branch))},DEL='auto',PORTAL=${JSON.stringify(targetUrl.origin + targetUrl.pathname)},PACKET=${JSON.stringify(TEAMTYPES_AUTO_SCHEMA)};
if(location.hostname!=='myafaqy.com'){alert(M[0]);return}
${TOKEN_JS}let tk=localStorage.getItem('token');if(!tk){alert(M[1]);return}if(!tokOk(tk)){const n=await freshTok(null,90000);if(!n){alert(RENEW);return}tk=n}
let sink=null,nonce='',ready=false,acked=null,receiver=null;let targetOrigin='';
if(DEL==='auto'){
  try{
    nonce=Array.from(crypto.getRandomValues(new Uint32Array(4))).map(n=>n.toString(16).padStart(8,'0')).join('');
    const dest=new URL(PORTAL);targetOrigin=dest.origin;dest.searchParams.set('mgrImport',nonce);dest.hash='weights';
    sink=window.open(dest.href,'_blank');
    if(sink){receiver=e=>{if(e.origin!==targetOrigin||e.source!==sink||!e.data||e.data.nonce!==nonce)return;
      if(e.data.type==='afaqy-manager-ready/v1')ready=true;
      if(e.data.type==='afaqy-manager-ack/v1')acked=e.data.ok===true?'ok':'failed';};
      window.addEventListener('message',receiver);
    }
  }catch(_){sink=null;}
}/* popup setup finished */
const box=document.createElement('div');box.style.cssText='position:fixed;inset:auto 16px 16px auto;z-index:2147483647;background:#0F2231;color:#fff;padding:12px 16px;border-radius:10px;font:14px system-ui;max-width:320px';box.textContent=M[2];document.body.append(box);
const H={'Authorization':'Bearer '+tk,'Content-Type':'application/json','X-Timezone-Offset':'-180','X-Client-Id':localStorage.getItem('browser_client_id')||'','lang':'en'};
const say=t=>{box.textContent=t};const wait=ms=>new Promise(r=>setTimeout(r,ms));
const post=async(path,body)=>{const r=await fx('https://crmbackend.afaqy.sa/'+path,{method:'POST',headers:H,body:JSON.stringify(body)});if(!r.ok)throw new Error(path+' HTTP '+r.status);const j=await r.json();if(j&&j.success===false)throw new Error(j.message||path+' refused');return j};
const get=async(path)=>{const r=await fx('https://crmbackend.afaqy.sa/'+path,{headers:H});if(!r.ok)throw new Error(path+' HTTP '+r.status);return r.json()};
try{
const uname={};const teamsSeen={};
for(let pg=0;;pg++){const T=await post('Teams/GetAllTeams',{isSearchFilter:false,searchKey:'',search:{},pageSize:50,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(T.data&&(T.data.data||T.data))||[];for(const t of arr)teamsSeen[String(t.id)]=t;const tot=(T.data&&T.data.totalPages)||1;if(pg+1>=tot||!arr.length)break;await wait(200)}
const teamOf={};const teamTypes={};for(const id of Object.keys(teamsSeen)){const d=await get('Teams/GetTeamById/'+id);const td=(d&&d.data)||{};const bc=td.branchCode==null?null:String(td.branchCode);const jed=bc==='${branch}'||(${String(branch) === String(JEDDAH_BRANCH)}&&/jeddah/i.test(String(td.nameEn||td.name||'')));if(jed){const tn=td.nameEn||td.name||id;for(const[k,v]of Object.entries(td))if(k!=='groupUsersDto'&&Array.isArray(v)&&v.length&&v.every(x=>x&&typeof x==='object'&&(x.nameEn||x.name)&&x.userId==null)){teamTypes[tn]=v.map(x=>({id:x.id??x.taskSettingId??null,nameEn:String(x.nameEn||x.name||''),nameAr:String(x.nameAr||'')}))}}for(const g of td.groupUsersDto||[]){const uid=String(g.userId);(teamOf[uid]=teamOf[uid]||{teams:[],branchCode:null,jeddah:false}).teams.push(td.nameEn||td.name||id);if(bc)teamOf[uid].branchCode=bc;if(jed)teamOf[uid].jeddah=true;if(!uname[uid]&&(g.nameEn||g.nameAr))uname[uid]={nameEn:g.nameEn,nameAr:g.nameAr}}await wait(150)}
const nTypes=Object.values(teamTypes).reduce((s,v)=>s+v.length,0);
if(sink){say(M[7]);for(let k=0;k<40&&!ready;k++)await wait(500);
  if(ready){const packet={type:PACKET,nonce,teamTypes,extractedAt:new Date().toISOString()};
    for(let k=0;k<3&&!acked;k++){try{sink.postMessage(packet,targetOrigin)}catch(_){break}for(let w=0;w<15&&!acked;w++)await wait(500)}}
  if(acked==='ok'){if(receiver)window.removeEventListener('message',receiver);box.style.background='#0A5F67';say(M[5]+' ('+Object.keys(teamTypes).length+' / '+nTypes+')');setTimeout(()=>box.remove(),12000);return}
}
if(receiver)window.removeEventListener('message',receiver);box.style.background='#7d5f15';say(M[6]);setTimeout(()=>box.remove(),14000);
}catch(e){if(receiver)window.removeEventListener('message',receiver);box.style.background='#7a1f1f';say(M[3]+e.message);setTimeout(()=>box.remove(),12000)}})();`;
  return 'javascript:' + encodeURIComponent(code.replace(/\n/g, ''));
}
/** Check a team-types hand-over before anything is stored: an object of team → [{ id, nameEn, nameAr }], bounded. */
export function parseTeamTypesTransfer(m) {
  if (!m || m.type !== TEAMTYPES_AUTO_SCHEMA || !m.teamTypes || typeof m.teamTypes !== 'object' || Array.isArray(m.teamTypes)) return { error: 'tt_bad' };
  const out = {};
  for (const [team, list] of Object.entries(m.teamTypes).slice(0, 40)) {
    if (!Array.isArray(list)) continue;
    const rows = list.slice(0, 400).filter((x) => x && typeof x === 'object' && (x.nameEn || x.nameAr)).map((x) => ({ id: x.id ?? null, nameEn: String(x.nameEn || '').slice(0, 200), nameAr: String(x.nameAr || '').slice(0, 200) }));
    if (rows.length) out[String(team).slice(0, 120)] = rows;
  }
  if (!Object.keys(out).length) return { error: 'tt_empty' };
  const at = Date.parse(m.extractedAt); return { teamTypes: out, extractedAt: Number.isFinite(at) ? new Date(at).toISOString() : new Date().toISOString() };
}

/** v9.42 — one page of myafaqy's after-sales grid, taken into the assignment panel: each account once (pages can repeat accounts),
 *  Jeddah only, and how many accounts on the page were new — a page that brings nothing new tells the panel to stop reading. */
export function assignPage(seen, arr) { let fresh = 0; const rows = []; for (const r of arr || []) { const id = String(r.customerId ?? r.id); if (seen.has(id)) continue; seen.add(id); fresh += 1; if (String(r.branchCode)==='2') rows.push({ id, have: [...new Set((r.afterSalesManIds || []).map(String))], devices: +r.connectedDevices || 0 }); } return { rows, fresh }; }

export function buildAssignBookmarklet(lang = 'ar', defaultNames = []) {
  const M = {
    ar: { only: 'افتح ماي أفاقي أولًا ثم اضغط الإشارة من هناك', login: 'سجّل دخولك في ماي أفاقي أولًا', title: 'تعيين ما بعد البيع على حسابات جدة', pick: 'اختر المهندسين الذين يكونون على كل حساب', loading: 'جارٍ قراءة الحسابات…',
      total: 'حسابات جدة', complete: 'مكتملة بالمختارين', toUpdate: 'ستُحدَّث', cover: 'التغطية الحالية لكل مهندس', pilot: 'تجربة على ١٠', rest: 'تطبيق على الباقي', refresh: 'إعادة القراءة', close: 'إغلاق',
      before: 'قبل', after: 'بعد', ok: 'تمام', bad: 'لم يُطبَّق', progress: 'جارٍ التطبيق', done: 'انتهى — مكتملة الآن', failed: 'لم تنجح', log: 'تنزيل السجل', teamOnly: 'فريقك كما في البوابة — لا شيء محدد، اختر بنفسك', showAll: 'إظهار كل مهندسي ما بعد البيع', noTeam: 'لم أجد فريق ما بعد البيع في جدة — تُعرض القائمة كلها', mode: 'إضافة لمن تختارهم، وإزالة لمن تعلّم عليه في قسم الإزالة فقط', none: 'اختر مهندسًا واحدًا على الأقل أو علّم على من تزيله', removeH: 'إزالة من كل الحسابات — لمن غادر', removeHint: 'لا يُزال أحد إلا من تعلّم عليه هنا بنفسك. الرقم بجانب كل اسم = عدد حسابات جدة التي عليه.', unknown: 'ليس في قائمة المهندسين', toRemove: 'ستُزال منها', added: 'اتضاف', removed: 'اتشال', result: 'رد ماي أفاقي', notFound: 'ماي أفاقي رفض الحساب ده لأن القائمة اللي اتبعتت فيها شخص مش موجود أو مش نشط عنده. علّم على اللي مشيوا في قسم الإزالة وجرّب تاني.', unexpected: 'اتشال من الحساب ناس انت ما علّمتش عليهم — «تطبيق على الباقي» اتقفل لحد ما تراجع', blocked: 'مقفول: التجربة شالت ناس من غير ما تختارهم', partial: 'قرأت {n} من {m} حساب بس — ماي أفاقي ما رجّعش الباقي', stopped: 'وقفت بعد {n} أخطاء ورا بعض — راجع السجل قبل ما تكمّل', none2: '—' },
    en: { only: 'Open myafaqy first, then press the bookmark there', login: 'Sign in to myafaqy first', title: 'Assign after-sales to Jeddah accounts', pick: 'Choose the engineers who should be on every account', loading: 'Reading accounts…',
      total: 'Jeddah accounts', complete: 'complete with the chosen', toUpdate: 'to update', cover: 'Current coverage per engineer', pilot: 'Pilot on 10', rest: 'Apply to the rest', refresh: 'Re-read', close: 'Close',
      before: 'before', after: 'after', ok: 'ok', bad: 'not applied', progress: 'Applying', done: 'Done — complete now', failed: 'failed', log: 'Download the log', teamOnly: 'Your team as set in the portal — nothing ticked, choose yourself', showAll: 'Show every after-sales engineer', noTeam: 'Jeddah’s after-sales team was not found — showing the whole list', mode: 'Adds whoever you choose; removes only whoever you tick in the removal section', none: 'Choose at least one engineer or tick someone to remove', removeH: 'Remove from every account — for those who left', removeHint: 'Nobody is removed unless you tick them here yourself. The number beside each name is how many Jeddah accounts carry them.', unknown: 'not in the engineers list', toRemove: 'to remove from', added: 'added', removed: 'removed', result: 'MyAFAQY replied', notFound: 'MyAFAQY refused this account because the list sent carries someone it does not find or who is no longer active. Tick whoever left in the removal section and try again.', unexpected: 'People you did not tick were removed from the account — «Apply to the rest» is locked until you review it', blocked: 'Locked: the pilot removed people you did not choose', partial: 'Read only {n} of {m} accounts — MyAFAQY did not return the rest', stopped: 'Stopped after {n} errors in a row — check the log before going on', none2: '—' },
  }[lang === 'en' ? 'en' : 'ar'];   // Urdu reads the Arabic panel: it had no words of its own and opened empty
  const code = `(async()=>{const M=${JSON.stringify(M)},RTL=${lang === 'en' ? 'false' : 'true'};
if(location.hostname!=='myafaqy.com'){alert(M.only);return}
${TOKEN_JS}let tk=localStorage.getItem('token');if(!tk){alert(M.login);return}if(!tokOk(tk)){const n=await freshTok(null,90000);if(!n){alert(RENEW);return}tk=n}
const H={'Authorization':'Bearer '+tk,'Content-Type':'application/json','X-Timezone-Offset':'-180','X-Client-Id':localStorage.getItem('browser_client_id')||'','lang':'en'};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const get=async(path)=>{const r=await fx('https://crmbackend.afaqy.sa/'+path,{headers:H});const j=await r.json().catch(()=>({}));if(!r.ok||j.success===false)throw new Error(path+' '+(j.message||r.status));return j};
const post=async(path,body)=>{const r=await fx('https://crmbackend.afaqy.sa/'+path,{method:'POST',headers:H,body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok||j.success===false)throw new Error(path+' '+(j.message||r.status));return j};
const old=document.getElementById('afaqy-assign');if(old)old.remove();
const box=document.createElement('div');box.id='afaqy-assign';box.dir=RTL?'rtl':'ltr';box.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);width:min(760px,96vw);max-height:92vh;overflow:auto;z-index:2147483647;background:#FFFFFF;color:#0F2231;border:1px solid #C3CED7;border-radius:12px;box-shadow:0 12px 40px rgba(15,34,49,.25);font:14px/1.5 system-ui,sans-serif;padding:16px 18px';
const el=(t,a,...k)=>{const n=document.createElement(t);for(const[x,v]of Object.entries(a||{})){if(x==='text')n.textContent=v;else if(x.startsWith('on'))n.addEventListener(x.slice(2),v);else n.setAttribute(x,v)}for(const c of k.flat())if(c!=null)n.append(c.nodeType?c:String(c));return n};
const btn=(text,fn,primary)=>el('button',{type:'button',style:'font:inherit;padding:8px 14px;border-radius:8px;cursor:pointer;border:1px solid '+(primary?'#0E7C86':'#C3CED7')+';background:'+(primary?'#0E7C86':'#FFFFFF')+';color:'+(primary?'#FFFFFF':'#0F2231'),onclick:fn,text});
const status=el('div',{style:'margin:8px 0;color:#5A6B78'});const body=el('div');
box.append(el('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:10px'},el('b',{style:'font-size:16px',text:M.title}),btn(M.close,()=>box.remove())),el('div',{style:'font-size:12px;color:#B45309;margin:4px 0 8px',text:M.mode}),status,body);document.body.append(box);
const assignPage=${assignPage.toString()};let teamNames=null,showAll=false,engineers=[],rows=[],chosen=new Set(),removing=new Set(),listTotal=0,blocked=false,halted=0;const DEF=${JSON.stringify(defaultNames.map((n) => String(n).trim().toLowerCase()))};
const say=t=>{status.textContent=t};
const readTeam=async()=>{if(teamNames!==null)return;teamNames=[];try{for(let pg=0;pg<20;pg++){const T=await post('Teams/GetAllTeams',{isSearchFilter:false,searchKey:'',search:{},pageSize:50,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(T.data&&(T.data.data||T.data))||[];for(const t of arr){const n=String(t.nameEn||t.name||'').toLowerCase();if(n.includes('jeddah')&&/after\\s*-?\\s*sales/.test(n)){const d=await get('Teams/GetTeamById/'+t.id);for(const g of((d&&d.data&&d.data.groupUsersDto)||[]))if(g.nameEn)teamNames.push(String(g.nameEn).trim().toLowerCase())}}if(pg+1>=((T.data&&T.data.totalPages)||1)||!arr.length)break}}catch(e){teamNames=[]}};
const readAll=async()=>{say(M.loading);await readTeam();engineers=((await post('AfterSales/GetAllAfterSalesEngineers')).data||[]).map(e=>({id:String(e.id),name:e.nameEn||e.nameAr||String(e.id)}));
if(DEF.length)teamNames=DEF.slice();rows=[];const seen=new Set();let size=500,idle=0;listTotal=0;for(let pg=0;pg<200;pg++){const R=await post('AfterSales/GetAfterSalesRequestGrid',{isSearchFilter:false,searchKey:'',search:{},pageSize:size,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const d=R.data||{};const arr=d.data||[];if(pg===0&&d.pageSize&&d.pageSize<size)size=d.pageSize;listTotal=Math.max(listTotal,+d.listCount||0);const got=assignPage(seen,arr);rows.push(...got.rows);idle=got.fresh?0:idle+1;if(!arr.length||idle>=3||(listTotal&&seen.size>=listTotal))break;await wait(200)}say(listTotal&&seen.size<listTotal?M.partial.replace('{n}',seen.size).replace('{m}',listTotal):'')};
const present=()=>{const c=new Map();for(const r of rows)for(const h of r.have)c.set(h,(c.get(h)||0)+1);return[...c.entries()].sort((a,b)=>b[1]-a[1])};
const need=()=>{const want=[...chosen];return rows.filter(r=>want.some(w=>!r.have.includes(w))||r.have.some(h=>removing.has(h)))};
const union=r=>[...new Set([...r.have,...chosen])].filter(x=>!removing.has(x));
let logRows=[];
const apply=async(list,label)=>{let n=0,bad=[],run=0;for(const r of list){if(run>=5){logRows.push([r.id,r.have.join('|'),'','not sent: '+M.stopped.replace('{n}',run)]);continue}say(M.progress+' '+(++n)+'/'+list.length);const before=r.have.slice();const next=union(r);if(!next.length){logRows.push([r.id,before.join('|'),'','skipped: would leave nobody']);continue}try{await post('AfterSales/AssignAfterSales',{customerId:+r.id,afterSalesIds:next.map(Number)});logRows.push([r.id,before.join('|'),next.join('|'),'sent']);run=0}catch(e){bad.push(r.id);run++;logRows.push([r.id,before.join('|'),next.join('|'),'error:'+e.message])}await wait(300)}halted=run>=5?run:0;return bad};
const verify=async(ids)=>{await readAll();const set=new Set(ids);return rows.filter(r=>set.has(r.id)).map(r=>({id:r.id,ok:[...chosen].every(w=>r.have.includes(w))&&!r.have.some(h=>removing.has(h)),have:r.have}))};
const dl=()=>{const csv=['customerId,before,after,result',...logRows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(','))].join('\\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='afaqy-assign-log-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();a.remove()};
const render=(extra)=>{const todo=need();const cov=engineers.map(e=>({e,n:rows.filter(r=>r.have.includes(e.id)).length})).sort((a,b)=>b.n-a.n);
body.replaceChildren(el('div',{style:'font-weight:700;margin:6px 0',text:M.pick}),el('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;color:#5A6B78;margin-bottom:6px'},el('span',{text:(teamNames&&teamNames.length)?M.teamOnly+' ('+teamNames.length+')':M.noTeam}),(teamNames&&teamNames.length)?el('label',{style:'display:flex;gap:6px;align-items:center;cursor:pointer'},el('input',{type:'checkbox',...(showAll?{checked:''}:{}),onchange:ev=>{showAll=ev.target.checked;render()}}),M.showAll):null),el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin-bottom:10px'},engineers.filter(e=>showAll||!teamNames||!teamNames.length||teamNames.includes(String(e.name).trim().toLowerCase())||chosen.has(e.id)).map(e=>el('label',{style:'display:flex;gap:8px;align-items:center;padding:6px 8px;border:1px solid #DBE2E8;border-radius:8px'},el('input',{type:'checkbox',...(chosen.has(e.id)?{checked:''}:{}),onchange:ev=>{if(ev.target.checked){chosen.add(e.id);removing.delete(e.id)}else chosen.delete(e.id);localStorage.setItem('afaqy-assign-chosen',JSON.stringify([...chosen]));render()}}),el('span',{text:e.name}),el('span',{style:'margin-inline-start:auto;color:#5A6B78;font-size:12px',text:String(rows.filter(r=>r.have.includes(e.id)).length)})))),
el('details',{style:'margin:6px 0 10px;padding:8px 10px;border:1px solid #F0C9C5;border-radius:8px;background:#FFF8F7',...(removing.size?{open:''}:{})},el('summary',{style:'cursor:pointer;font-weight:700;color:#B42318',text:M.removeH+(removing.size?' ('+removing.size+')':'')}),el('div',{style:'font-size:12px;color:#5A6B78;margin:4px 0 8px',text:M.removeHint}),el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px'},present().map(([id,n])=>{const e=engineers.find(x=>x.id===id);return el('label',{style:'display:flex;gap:8px;align-items:center;padding:6px 8px;border:1px solid #F0C9C5;border-radius:8px;background:#FFFFFF'},el('input',{type:'checkbox',...(removing.has(id)?{checked:''}:{}),onchange:ev=>{if(ev.target.checked){removing.add(id);chosen.delete(id);localStorage.setItem('afaqy-assign-chosen',JSON.stringify([...chosen]))}else removing.delete(id);render()}}),el('span',{text:e?e.name:('#'+id+' — '+M.unknown)}),el('span',{style:'margin-inline-start:auto;color:#5A6B78;font-size:12px',text:String(n)}))}))),
el('div',{style:'display:flex;gap:16px;flex-wrap:wrap;margin:8px 0;padding:10px 12px;background:#EEF1F4;border-radius:8px'},el('span',{},el('b',{text:String(rows.length)}),' '+M.total),el('span',{},el('b',{text:String(rows.length-todo.length)}),' '+M.complete),el('span',{style:'color:#B45309'},el('b',{text:String(todo.length)}),' '+M.toUpdate),removing.size?el('span',{style:'color:#B42318'},el('b',{text:String(rows.filter(r=>r.have.some(h=>removing.has(h))).length)}),' '+M.toRemove):null),
el('div',{style:'display:flex;gap:8px;flex-wrap:wrap'},btn(M.pilot,async()=>{if(!chosen.size&&!removing.size){say(M.none);return}const list=need().slice(0,10);const bad=await apply(list,'pilot');const v=await verify(list.map(r=>r.id));const nm=id=>{const e=engineers.find(z=>z.id===id);return e?e.name:'#'+id};let lost=false;const lines=v.map(x=>{const lg=[...logRows].reverse().find(l=>l[0]===x.id)||[];const before=String(lg[1]||'').split('|').filter(Boolean),plus=x.have.filter(h=>!before.includes(h)),minus=before.filter(h=>!x.have.includes(h)),odd=minus.filter(h=>!removing.has(h));if(odd.length)lost=true;const res=String(lg[3]||'');return{x,plus,minus,odd,res}});if(lost)blocked=true;render(el('div',{},lost?el('div',{style:'margin-top:10px;padding:10px 12px;border-radius:8px;background:#FDECEA;color:#B42318;font-weight:700',text:M.unexpected}):null,lines.some(l=>/not found/i.test(l.res))?el('div',{style:'margin-top:10px;padding:10px 12px;border-radius:8px;background:#FDF1E1;color:#7A4A06',text:M.notFound}):null,el('table',{style:'width:100%;border-collapse:collapse;margin-top:10px;font-size:13px'},el('tr',{},['customerId',M.added,M.removed,M.result,''].map(h=>el('th',{style:'text-align:start;border-bottom:1px solid #DBE2E8;padding:4px',text:h}))),lines.map(l=>el('tr',{},el('td',{style:'padding:4px',text:l.x.id}),el('td',{style:'padding:4px;color:#15803D',text:l.plus.map(nm).join('، ')||M.none2}),el('td',{style:'padding:4px;color:'+(l.odd.length?'#B42318;font-weight:700':'#5A6B78'),text:l.minus.map(nm).join('، ')||M.none2}),el('td',{style:'padding:4px;color:#5A6B78',text:l.res.replace('error:AfterSales/AssignAfterSales ','')}),el('td',{style:'padding:4px;font-weight:700;color:'+(l.x.ok&&!l.odd.length?'#15803D':'#B42318'),text:l.x.ok&&!l.odd.length?M.ok:M.bad}))))))},true),btn(M.rest,async()=>{if(blocked){say(M.blocked);return}if(!chosen.size&&!removing.size){say(M.none);return}const list=need();const bad=await apply(list,'rest');await readAll();const left=need().length;render(el('div',{style:'margin-top:10px;padding:10px 12px;border-radius:8px;background:'+(left?'#FDF1E1':'#E6F4EA')},el('b',{text:M.done+': '+(rows.length-left)+'/'+rows.length}),halted?el('div',{style:'font-weight:700;color:#B42318',text:M.stopped.replace('{n}',halted)}):null,bad.length?el('div',{text:M.failed+': '+bad.join(', ')}):null))},true),btn(M.refresh,async()=>{await readAll();render()}),logRows.length?btn(M.log,dl):null),...(extra?[extra]:[]))};
try{await readAll();render()}catch(e){say(e.message)}})();`;
  return 'javascript:' + encodeURIComponent(code.replace(/\n/g, ''));
}

export function buildBookmarklet(portalUrl, lang = 'ar') {
  const msg = {
    ar: ['افتح ماي أفاقي أولًا ثم اضغط الإشارة من هناك', 'سجّل دخولك في ماي أفاقي أولًا', 'جارٍ قراءة شغلك…', 'تعذّرت القراءة: ', 'اسمح لماي أفاقي بفتح النوافذ ثم اضغط الإشارة مرة أخرى'],
    en: ['Open myafaqy first, then press the bookmark there', 'Sign in to myafaqy first', 'Reading your work…', 'Could not read: ', 'Allow myafaqy to open windows, then press the bookmark again'],
    ur: ['پہلے مائی آفاقی کھولیں، پھر وہاں بک مارک دبائیں', 'پہلے مائی آفاقی میں لاگ اِن کریں', 'آپ کا کام پڑھا جا رہا ہے…', 'پڑھا نہیں جا سکا: ', 'مائی آفاقی کو ونڈوز کھولنے کی اجازت دیں، پھر بک مارک دوبارہ دبائیں'],
  }[lang] || [];
  const code = `(async()=>{const M=${JSON.stringify(msg)},P=${JSON.stringify(portalUrl)},PO=new URL(P).origin;
if(location.hostname!=='myafaqy.com'){alert(M[0]);return}
${TOKEN_JS}let tk=localStorage.getItem('token');if(!tk){alert(M[1]);return}if(!tokOk(tk)){const n=await freshTok(null,90000);if(!n){alert(RENEW);return}tk=n}
let w=window.open(P+'#me-wait','afaqy-portal');
const box=document.createElement('div');box.style.cssText='position:fixed;inset:auto 16px 16px auto;z-index:2147483647;background:#0F2231;color:#fff;padding:12px 16px;border-radius:10px;font:14px system-ui';box.textContent=M[2];document.body.append(box);
try{const u=JSON.parse(decodeURIComponent(escape(atob(tk.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))));const me=String(u.UserId);
const H={'Authorization':'Bearer '+tk,'Content-Type':'application/json','X-Timezone-Offset':'-180','X-Client-Id':localStorage.getItem('browser_client_id')||'','lang':'en'};
const day=86400000,now=Date.now(),sa=d=>new Date(Date.parse(new Date(d+3*3600000).toISOString().slice(0,10)+'T00:00:00+03:00')).toISOString();
const since=sa(now-${ME_MONTHS}*30.5*day),end=sa(now+day);
const post=async(path,body)=>{const r=await fx('https://crmbackend.afaqy.sa/'+path,{method:'POST',headers:H,body:JSON.stringify(body)});if(!r.ok)throw new Error(path+' HTTP '+r.status);const j=await r.json();if(j&&j.success===false)throw new Error(j.message||'refused');return j};
const get=async(path)=>{const r=await fx('https://crmbackend.afaqy.sa/'+path,{headers:H});if(!r.ok)throw new Error(path+' HTTP '+r.status);return r.json()};
const soft=async f=>{try{return await f()}catch(e){return null}};
const base=(g,c,b,n,s)=>({donePageNumber:b==='done'?n:0,donePageSize:b==='done'?s:1,openPageNumber:b==='open'?n:0,openPageSize:b==='open'?s:1,toDoPageNumber:b==='toDo'?n:0,toDoPageSize:b==='toDo'?s:1,orderBy:1,taskGroupId:g,searchKey:'',tasksGridStatusId:1,assignedBy:[],createdBy:[],agent:[],statusIds:[],type:[],priority:[],assignedOn:[],completedOn:c});
const rows=new Map();let n=0;
for(const g of[100000,100001]){try{for(const[b,c]of[['done',[since,end]],['open',[]],['toDo',[]]]){let size=500,pg=0,total=null;
for(;;){const d=((await post('Task/GetMyTasksGrid',base(g,c,b,pg,size))).data||{})[b];if(!d)break;if(pg===0&&d.pageSize!==size)size=d.pageSize||20;total=d.listCount;
for(const x of d.data||[]){const id=String(x.id);if(rows.has(id))continue;const a=String(x.assigneeId==null?(g===100000?me:''):x.assigneeId);
rows.set(id,{i:id,c:x.createdOn,d:x.statusId===3&&!x.isCancelled?x.closeDate:null,s:x.isCancelled?'cancelled':x.statusId===3?'done':'open',m:x.moduleId,o:String(x.createUserId)===a,b,a,y:String(x.taskType||'').slice(0,60),t:a===me&&b!=='done'?String(x.title||x.taskType||'').slice(0,80):undefined})}
n+=(d.data||[]).length;box.textContent=M[2]+' '+n;pg++;if(!d.data||!d.data.length||pg*size>=total)break;await new Promise(r=>setTimeout(r,250))}}}catch(e){if(g===100000)throw e}}
const U=await soft(()=>post('Security/GetAllHierarchyUsersDropDown',{pageSize:1000,pageNumber:0,searchCriteria:'',selectedId:[]}));
const ud=(U&&U.data&&(U.data.data||U.data))||[];const nm={};for(const p of(Array.isArray(ud)?ud:[]))nm[String(p.id)]=p;
const tm={};await soft(async()=>{for(let pg=0;pg<20;pg++){const R=await post('Teams/GetAllTeams',{isSearchFilter:false,searchKey:'',search:{},pageSize:50,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(R.data&&(R.data.data||R.data))||[];
for(const t of arr){const D=await soft(()=>get('Teams/GetTeamById/'+t.id));const td=(D&&D.data)||{};const bc=td.branchCode==null?null:String(td.branchCode);for(const x of td.groupUsersDto||[]){const k=String(x.userId);(tm[k]=tm[k]||{teams:[],branchCode:null}).teams.push(String(td.nameEn||t.nameEn||''));if(bc)tm[k].branchCode=bc}}
if(pg+1>=((R.data&&R.data.totalPages)||1)||!arr.length)break}});
const ids=new Set([me]);for(const r of rows.values())if(r.a)ids.add(r.a);
const people=[...ids].map(id=>{const p=nm[id]||{},q=tm[id]||{teams:[],branchCode:null};return{id,nameEn:String(p.nameEn||''),nameAr:String(p.nameAr||''),teams:q.teams,branchCode:q.branchCode,h:id!==me&&!!nm[id]}});
const pay={schema:'${ME_SCHEMA_V2}',user:{id:me,name:String(u.UserName||'')},extractedAt:new Date().toISOString(),since,months:${ME_MONTHS},people,tasks:[...rows.values()]};
let ok=false;const ack=e=>{if(e.origin===PO&&e.data&&e.data.type==='afaqy-me-ack')ok=true};window.addEventListener('message',ack);
if(w&&!w.closed){for(let k=0;k<60&&!ok;k++){try{w.postMessage({type:'afaqy-me',payload:pay},PO)}catch(e){}await new Promise(r=>setTimeout(r,500))}}
window.removeEventListener('message',ack);
if(ok){box.remove();return}
let data=JSON.stringify(pay),enc='j';
if(window.CompressionStream){const cs=new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));const buf=new Uint8Array(await new Response(cs).arrayBuffer());let bin='';for(const c of buf)bin+=String.fromCharCode(c);data=btoa(bin);enc='z'}else{data=btoa(unescape(encodeURIComponent(data)))}
const url=P+'#me-'+enc+'.'+data.replace(/\\\\+/g,'-').replace(/\\\\//g,'_').replace(/=+$/,'');
if(url.length>1800000){box.textContent=M[4];setTimeout(()=>box.remove(),10000);return}
location.href=url;box.remove()}catch(e){box.textContent=M[3]+e.message;setTimeout(()=>box.remove(),8000)}})();`;
  return 'javascript:' + encodeURIComponent(code.replace(/\n/g, ''));
}

/** Read what the bookmark handed over — an object (by message) or the part of the address after #me- (fallback). */
export async function parseMe(fragmentOrObject) {
  let raw = fragmentOrObject;
  if (typeof raw === 'string') {
    const m = raw.match(/^([zj])\.([A-Za-z0-9_-]+)$/);
    if (!m) return { error: 'err_json' };
    try {
      const b64 = m[2].replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((m[2].length + 3) % 4);
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      let text;
      if (m[1] === 'z') text = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
      else text = new TextDecoder().decode(bytes);
      raw = JSON.parse(text);
    } catch { return { error: 'err_json' }; }
  }
  return parseMePayload(raw);
}

/** Validate and normalise a hand-over. Titles survive only on the person's own open tasks, whatever the payload says. */
export function parseMePayload(raw) {
  if (!raw || typeof raw !== 'object' || ![ME_SCHEMA, ME_SCHEMA_V2].includes(raw.schema) || !raw.user || raw.user.id == null || !Array.isArray(raw.tasks))
    return { error: 'err_schema', vars: { schema: ME_SCHEMA_V2 } };
  const uid = String(raw.user.id);
  const v2 = raw.schema === ME_SCHEMA_V2;
  const tasks = raw.tasks.filter((x) => x && x.i != null && toIso(x.c)).map((x) => {
    const state = ['open', 'done', 'cancelled'].includes(x.s) ? x.s : 'open';
    const moduleId = Number.isFinite(+x.m) && x.m !== null ? +x.m : null;
    const assigneeId = v2 ? String(x.a || '') : uid;
    const mine = assigneeId === uid;
    return { id: String(x.i), state, createdAt: toIso(x.c), completedAt: state === 'done' ? toIso(x.d) : null,
      title: mine && state !== 'done' ? String(x.t || '').slice(0, 80) : '', typeId: null, type: String(x.y || '').slice(0, 60),
      assigneeId, assigneeName: '', createdById: null, createdByName: '', assignedToGroup: !assigneeId,
      fromEmail: moduleId === EMAIL_MODULE, own: x.o === true, moduleId, bucket: x.b || null };
  });
  const people = v2 && Array.isArray(raw.people) ? raw.people.filter((p) => p && p.id != null).map((p) => ({
    id: String(p.id), nameEn: String(p.nameEn || '').slice(0, 80), nameAr: String(p.nameAr || '').slice(0, 80),
    teams: Array.isArray(p.teams) ? p.teams.map((t) => String(t).slice(0, 80)).slice(0, 12) : [],
    branchCode: p.branchCode == null ? null : String(p.branchCode), below: p.h === true && String(p.id) !== uid })) : [];
  if (!people.some((p) => p.id === uid)) people.push({ id: uid, nameEn: '', nameAr: '', teams: [], branchCode: null, below: false });
  return { me: { schema: raw.schema, user: { id: uid, name: String(raw.user.name || '') }, extractedAt: toIso(raw.extractedAt), since: toIso(raw.since), people, tasks } };
}

/** Bring a profile saved by an earlier version up to the current shape (a v6.9 device holds no people list). */
export function upgradeMe(me) {
  if (!me || !me.user || !Array.isArray(me.tasks)) return null;
  const uid = String(me.user.id);
  const people = Array.isArray(me.people) ? me.people : [];
  if (!people.some((p) => p.id === uid)) people.push({ id: uid, nameEn: '', nameAr: '', teams: [], branchCode: null, below: false });
  return { ...me, user: { id: uid, name: String(me.user.name || '') }, people, tasks: me.tasks.map((x) => ({ ...x, assigneeId: x.assigneeId || uid })) };
}

/** The open tasks a person has right now — their current work, newest first. Titles come through only for one's own tasks. */
export function openTasks(tasks, assigneeId = null) {
  return (tasks || []).filter((x) => x.state === 'open' && (!assigneeId || x.assigneeId === assigneeId))
    .map((x) => ({ id: x.id, title: x.title || '', type: x.type || '', typeId: x.typeId, createdAt: x.createdAt,
      customer: x.customer || null, fromEmail: x.fromEmail === true, ageHours: x.createdAt ? Math.max(0, (Date.now() - Date.parse(x.createdAt)) / 3600000) : null,
      bucket: x.bucket }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// ===================== tasks per day: arrived, started, late (ADR-0121) =====================
// The manager's response rule (14 November 2026): a task must be started (moved out of MyAFAQY's To-Do column) within its
// allowance of WORKING time. Sunday–Thursday the clock runs 09:00–18:00 and 19:00–22:00 with 1 hour allowed; Saturday
// 09:00–18:00 with 3 hours; Friday is off. A task that arrives outside these hours starts its clock at the next opening, and
// the allowance is the one of the day the clock starts on. Saudi time throughout.
export const RESPONSE_RULE = { windows: { 0: [[9, 18], [19, 22]], 1: [[9, 18], [19, 22]], 2: [[9, 18], [19, 22]], 3: [[9, 18], [19, 22]], 4: [[9, 18], [19, 22]], 5: [], 6: [[9, 18]] },
  allow: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 0, 6: 3 } };
/** The instant (ISO, UTC) by which a task created at `createdIso` must be started under `rule`; null for a bad date. */
export function startDue(createdIso, rule = RESPONSE_RULE) {
  const t0 = Date.parse(createdIso); if (!Number.isFinite(t0)) return null;
  const H = 3600000, off = 3 * H, D = 24 * H;
  let day = Math.floor((t0 + off) / D) * D - off, left = null;           // midnight Saudi of the creation day, as UTC ms
  for (let guard = 0; guard < 60; guard++, day += D) {
    const dow = new Date(day + off).getUTCDay();
    for (const [a, b] of rule.windows[dow] || []) {
      const ws = Math.max(day + a * H, t0), we = day + b * H; if (we <= ws) continue;
      if (left == null) left = (rule.allow[dow] || 0) * H;                 // the allowance of the day the clock starts on
      if (ws + left <= we) return new Date(ws + left).toISOString();
      left -= we - ws;
    }
  }
  return null;
}
/** ADR-0124: when a task first left MyAFAQY's To-Do column, from its activity log (GET Task/GetTask/{id} → data.activities):
 *  the earliest «Start» (actionId 8) or «Complete» (11) — a task closed without pressing Start left To-Do when it was closed.
 *  MyAFAQY writes the time in UTC without a zone; «Z» is added, as for every other time in the pull. */
export function firstStart(activities) { let best = null; for (const a of activities || []) { if (!a || (a.actionId !== 8 && a.actionId !== 11)) continue; const v = String(a.createDate || ''); if (!/^\d{4}-\d{2}-\d{2}T/.test(v)) continue; const z = /Z|[+-]\d{2}:?\d{2}$/.test(v) ? v : v + 'Z'; if (!best || Date.parse(z) < Date.parse(best)) best = z; } return best ? new Date(Date.parse(best)).toISOString() : null; }
/** Each day of [from, to] for the team: what arrived and where it stands at `asOf` (the pull's time — the To-Do column is
 *  only known as it was then). The columns add up: arrived = closed the same day + closed later + not started + open + cancelled.
 *  `complete(day)` says whether the pulls hold every task of that day (a later close needs a pull that covers it). */
export function dailyIntake(tasks, { from, to, asOf, team = null, rule = RESPONSE_RULE, complete = () => true }) {
  const at = Date.parse(asOf), inTeam = (x) => !team || team.includes(x.assigneeId);
  const due = (x) => startDue(x.createdAt, rule), late = (x) => { const d = due(x); return !!d && Date.parse(d) < at; };
  const notStarted = (x) => x.state === 'open' && x.bucket === 'toDo';
  const rows = new Map(), blank = (d) => ({ day: d, arrived: 0, sameDay: 0, later: 0, notStarted: 0, late: 0, open: 0, cancelled: 0, email: 0, ids: [], startKnown: 0, startedLate: 0, waitH: [] });
  for (let d = from, g = 0; d <= to && g < 400; d = nextDay(d), g++) rows.set(d, blank(d));   // a day with nothing (a Friday) is a row too
  for (const x of tasks || []) {
    if (!x.createdAt || !inTeam(x)) continue; const d = saudiDay(x.createdAt); if (d < from || d > to) continue;
    if (!rows.has(d)) rows.set(d, blank(d));
    const r = rows.get(d); r.arrived++; r.ids.push(x.id); if (x.fromEmail === true) r.email++;
    if (x.startedAt) { const du = due(x); r.startKnown++; if (du && Date.parse(x.startedAt) > Date.parse(du)) r.startedLate++; r.waitH.push(Math.max(0, (Date.parse(x.startedAt) - Date.parse(x.createdAt)) / 36e5)); }
    if (x.state === 'done') { if (x.completedAt && saudiDay(x.completedAt) === d) r.sameDay++; else r.later++; }
    else if (x.state === 'cancelled') r.cancelled++;
    else if (notStarted(x)) { r.notStarted++; if (late(x)) r.late++; }
    else r.open++;
  }
  const med = (v) => { if (!v.length) return null; const q = [...v].sort((a, b) => a - b), h = Math.floor(q.length / 2); return Math.round((q.length % 2 ? q[h] : (q[h - 1] + q[h]) / 2) * 10) / 10; };
  const days = [...rows.values()].map(({ waitH, ...r }) => ({ ...r, waitMedianH: med(waitH), complete: !!complete(r.day) })).sort((a, b) => (a.day < b.day ? 1 : -1));
  const lateNow = (tasks || []).filter((x) => inTeam(x) && notStarted(x) && x.createdAt && late(x)).map((x) => ({ id: x.id, due: due(x) }));
  const waiting = (tasks || []).filter((x) => inTeam(x) && notStarted(x)).length;
  const sum = (k) => days.reduce((s, r) => s + r[k], 0);
  return { days, lateNow, waiting, total: { startKnown: sum('startKnown'), startedLate: sum('startedLate'), arrived: sum('arrived'), sameDay: sum('sameDay'), later: sum('later'), notStarted: sum('notStarted'), late: sum('late'), open: sum('open'), cancelled: sum('cancelled') } };
}
/** Whether pulled ranges cover every day from `day` to `last` — so a task that arrived on `day` and closed later is in hand. */
export function coveredFrom(ranges, day, last) {
  const rs = (ranges || []).filter((r) => r && r.from && r.to).sort((a, b) => (a.from < b.from ? -1 : 1));
  let reach = null;
  for (const r of rs) { if (r.to < day) continue; if (reach == null) { if (r.from > day) return false; reach = r.to; } else if (r.from <= nextDay(reach)) { if (r.to > reach) reach = r.to; } else break; }
  return reach != null && reach >= last;
}
const nextDay = (d) => new Date(Date.parse(`${d}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);

// ===================== the team file: positions and leaders, by myafaqy id, never by name (ADR-0015) =====================
// team.json lives in the repository (public), so it holds ids, positions and who reports to whom — the names arrive from
// myafaqy with the bookmark. The manager fills it on the Team page; each device may also hold its own copy.
export const ROSTER_SCHEMA = 'afaqy-team/v1';
/** Departments a person can oversee — keys only; the names come from the language files. */
export const COVERS = ['aftersales', 'presales', 'rd', 'projects'];
export function parseRoster(raw) {
  if (!raw || typeof raw !== 'object' || !raw.people || typeof raw.people !== 'object') return { v: 1, schema: ROSTER_SCHEMA, people: {} };
  const people = {};
  for (const [id, p] of Object.entries(raw.people)) {
    if (!p || typeof p !== 'object') continue;
    const o = { position: String(p.position || '').slice(0, 80), leaderId: p.leaderId == null || p.leaderId === '' ? null : String(p.leaderId) };
    if (p.positionEn) o.positionEn = String(p.positionEn).slice(0, 80);
    if (p.onLeave === true) o.onLeave = true;
    if (Array.isArray(p.covers)) { const c = p.covers.filter((k) => COVERS.includes(k)); if (c.length) o.covers = c; }
    if (p.removed === true) { people[String(id)] = { removed: true }; continue; }   // a device-only marker: taken off the team
    if (o.position || o.leaderId || o.positionEn || o.onLeave) people[String(id)] = o;
  }
  return { v: 1, schema: ROSTER_SCHEMA, people };
}
/** The device's own entries win over the repository's. */
export function mergeRoster(repo, device) {
  const a = parseRoster(repo), b = parseRoster(device);
  const people = { ...a.people, ...b.people };
  for (const [id, p] of Object.entries(people)) if (p.removed) delete people[id];   // removed on this device: gone from scope and from the downloaded file
  return { v: 1, schema: ROSTER_SCHEMA, people };
}
/** The scope: everyone in the team file. When the file has people, nobody else is counted or shown anywhere. */
export const scopeIds = (roster) => Object.keys((roster && roster.people) || {});
export const inScope = (roster, id) => { const ids = scopeIds(roster); return ids.length === 0 || ids.includes(String(id)); };
/** The scope applies to a set of people only when at least one of them is in it — a file of strangers shows everyone rather than nobody. */
export const scopeApplies = (roster, ids) => scopeIds(roster).length > 0 && (ids || []).some((id) => inScope(roster, id));
export const positionOf = (roster, id, lang = 'ar') => { const p = roster && roster.people && roster.people[String(id)]; return p ? ((lang === 'en' && p.positionEn) || p.position || '') : ''; };
export const leaderOf = (roster, id) => { const p = roster && roster.people && roster.people[String(id)]; return p && p.leaderId ? p.leaderId : null; };
export function descendantsOf(roster, rootId) {
  const out = new Set(), queue = [String(rootId)];
  while (queue.length) { const id = queue.shift(); for (const k of reportsOf(roster, id)) if (!out.has(k) && k !== String(rootId)) { out.add(k); queue.push(k); } }
  return [...out];
}
export const reportsOf = (roster, leaderId) => Object.entries((roster && roster.people) || {}).filter(([, p]) => p.leaderId === String(leaderId)).map(([id]) => id);

// ===================== weights: points per task type and per activity category (ADR-0019) =====================
export const WEIGHTS_SCHEMA = 'afaqy-weights/v1';
export const WEIGHT_STEPS = [0, 1, 2, 3, 5, 8];
export const TIERS = ['admin', 'customer', 'integration', 'multistage'];
/** A task type's key: its English part, lowercased — "WASL Link | الربط مع وصل" and "التشييك … | check for devices config." both work. */
export function typeKey(name) {
  const parts = String(name || '').split('|').map((x) => x.trim()).filter(Boolean);
  const latin = parts.find((x) => /[a-z]/i.test(x)) || parts[0] || '';
  return latin.toLowerCase().replace(/\s+/g, ' ').trim();
}
export function parseWeights(raw) {
  const out = { v: 1, schema: WEIGHTS_SCHEMA, reviewed: '', default: 1, tasks: {}, activities: {}, editors: {}, rules: parseRules(null) };
  if (!raw || typeof raw !== 'object') return out;
  out.rules = parseRules(raw.rules);
  const num = (w) => { const n = Number(w); return Number.isFinite(n) && n >= 0 && n <= 20 ? n : null; };
  out.reviewed = String(raw.reviewed || '').slice(0, 10);
  if (num(raw.default) != null) out.default = num(raw.default);
  for (const [k, x] of Object.entries(raw.tasks || {})) {
    const w = num(x && typeof x === 'object' ? x.w : x); if (w == null) continue;
    const o = { w, tier: TIERS.includes(x && x.tier) ? x.tier : null, team: ['aftersales', 'rd', 'both', 'general'].includes(x && x.team) ? x.team : null };
    if (x && Array.isArray(x.f) && x.f.length === 4 && x.f.every((v) => [0, 1, 2].includes(Number(v)))) o.f = x.f.map(Number);
    { const md = x && x.mode === 'time' ? 'compare' : x && x.mode; if (POINT_MODES.includes(md) || isCustomMode(md)) o.mode = md; }
    if (x && Number(x.std) > 0 && Number(x.std) <= 400) o.std = Number(x.std);
    if (x && ['oct', 'est', 'set'].includes(x.stdSrc)) o.stdSrc = x.stdSrc;
    out.tasks[typeKey(k)] = o;
  }
  for (const [k, x] of Object.entries(raw.activities || {})) { const w = num(x); if (w != null) out.activities[String(k).toLowerCase().trim()] = w; }
  out.card = {}; for (const [k, v] of Object.entries(raw.card || {})) if (k in CARD_DEFAULTS && Number.isFinite(Number(v))) out.card[k] = Number(v);
  out.editors = {};
  for (const [uid, list] of Object.entries(raw.editors || {})) if (/^\d+$/.test(uid) && Array.isArray(list)) out.editors[uid] = list.map((k) => (k === '*' ? '*' : typeKey(k))).filter(Boolean).slice(0, 100);
  return out;
}
/** The device's own entries win over the repository's, type by type. */
export function mergeWeights(repo, device) {
  const a = parseWeights(repo), b = parseWeights(device);
  return { ...a, rules: device && device.rules ? b.rules : a.rules, default: device && device.default != null ? b.default : a.default, tasks: { ...a.tasks, ...b.tasks }, activities: { ...a.activities, ...b.activities }, editors: { ...a.editors, ...b.editors }, card: { ...a.card, ...b.card }, reviewed: b.reviewed || a.reviewed };
}
/** Editing rights: editors[userId] = ['*'] or a list of type keys; nobody else may change a weight on the page. */
export const canEditWeight = (wt, userId, key) => { const e = wt && wt.editors && wt.editors[String(userId)]; return !!(e && (e.includes('*') || e.includes(typeKey(key)) || e.includes(String(key).toLowerCase()))); };
export const isWeightsAdmin = (wt, userId) => { const e = wt && wt.editors && wt.editors[String(userId)]; return !!(e && e.includes('*')); };
/** A task type's name in the reader's language: the Arabic half in Arabic and Urdu, the Latin half in English — isolated so
 *  a name in the other script never reorders the sentence around it. */
export function typeLabel(name, lang = 'ar') {
  const parts = String(name || '').split('|').map((x) => x.trim()).filter(Boolean);
  const ar = parts.find((x) => /[\u0600-\u06FF]/.test(x)), la = parts.find((x) => /[a-z]/i.test(x));
  const pick = (lang === 'en' ? (la || ar) : (ar || la)) || parts[0] || '';
  return `\u2068${pick}\u2069`;
}
// One name for a type from the two name fields of a team's linked types. MyAFAQY fills BOTH fields with the same
// «English | Arabic» text for many types, so gluing the two fields printed every type twice and pushed the Weights
// table off the screen sideways. Each distinct part is kept once, in the order it first appears.
export function typeNameOf(nameEn, nameAr) {
  const out = [];
  for (const part of `${nameEn || ''}|${nameAr || ''}`.split('|').map((x) => x.trim()).filter(Boolean)) if (!out.some((o) => o.toLowerCase() === part.toLowerCase())) out.push(part);
  return out.join(' | ');
}
// ===================== the basis of a type's points (ADR-0031) =====================
// Base 1–5 from four stated factors (technical depth, outside party, field work, business impact — each 0, 1 or 2; sum of 8),
// times the method: "done" (the base on closing, time ignored), "speed" (×1.5 when closed within the type's standard time)
// or "time" (× working hours ÷ standard, between ×0.5 and ×2 — never rewarding slowness beyond twice the standard).
export const POINT_MODES = ['done', 'speed', 'compare'];   // ADR-0048: on completion, by speed, against the usual time (steps); the old «time» reads as «compare»
export const FACTORS = ['tech', 'outside', 'field', 'impact'];
// The scoring rules (ADR-0045) — published with the weights, editable by the weights admin. The defaults reproduce the original
// fixed engine exactly: equal factors, cut points 1/3/5/6 on the 0–8 sum, speed ×1.5, time between ×0.5 and ×2, no extras.
// Extra rules (ADR-0047): each rule has conditions joined by AND or OR, and a percentage; several matching rules add up or the highest wins, under a cap.
export const EXTRA_CONDS = ['email', 'after', 'weekend', 'fast', 'field', 'gov', 'impact'];
export const DEFAULT_RULES = Object.freeze({ fw: Object.freeze({ tech: 1, outside: 1, field: 1, impact: 1 }), cuts: Object.freeze([1, 3, 5, 6]), speedX: 1.5, cmpFast: 0.5, cmpSlow: 2, cmpFastX: 1.5, cmpSlowX: 0.5, extras: Object.freeze([]), stack: 'sum', capPct: 100, methods: Object.freeze([]) });
// the manager's own methods (ADR-0050): a name and steps against the usual time — «up to X% → ×Y», then «more → ×Z»; no steps = the point as it is
export const isCustomMode = (m) => /^m_[a-z0-9]{3,12}$/.test(String(m || ''));
export function parseRules(r) {
  const d = DEFAULT_RULES, o = { fw: { ...d.fw }, cuts: [...d.cuts], speedX: d.speedX, cmpFast: d.cmpFast, cmpSlow: d.cmpSlow, cmpFastX: d.cmpFastX, cmpSlowX: d.cmpSlowX, extras: [], stack: d.stack, capPct: d.capPct, methods: [] };
  if (!r || typeof r !== 'object') return o;
  const n = (v, lo, hi) => { const x = Number(v); return v !== '' && v != null && Number.isFinite(x) && x >= lo && x <= hi ? x : null; };
  for (const k of FACTORS) { const v = n(r.fw && r.fw[k], 0, 3); if (v != null) o.fw[k] = v; }
  if (Array.isArray(r.cuts) && r.cuts.length === 4) { const cc = r.cuts.map((v) => n(v, 0, 24)); if (cc.every((v) => v != null) && cc.every((v, i) => i === 0 || v > cc[i - 1])) o.cuts = cc; }
  const s = n(r.speedX, 1, 3); if (s != null) o.speedX = s;
  const cf = n(r.cmpFast, 0.1, 1), cs = n(r.cmpSlow, 1, 10), cfx = n(r.cmpFastX, 1, 3), csx = n(r.cmpSlowX, 0, 1);
  if (cf != null) o.cmpFast = cf; if (cs != null) o.cmpSlow = cs; if (cfx != null) o.cmpFastX = cfx; if (csx != null) o.cmpSlowX = csx;
  // the two fixed extras of v8.61 (email, outside hours) read as single-condition rules
  const src = Array.isArray(r.extras) ? r.extras : [...(n(r.bonusEmail, 0, 100) ? [{ when: ['email'], pct: r.bonusEmail }] : []), ...(n(r.bonusAfter, 0, 100) ? [{ when: ['after'], pct: r.bonusAfter }] : [])];
  for (const x of src.slice(0, 12)) {
    const when = [...new Set((x && Array.isArray(x.when) ? x.when : []).filter((k) => EXTRA_CONDS.includes(k)))], pct = n(x && x.pct, 0, 100);
    if (when.length && pct) o.extras.push({ when, join: x.join === 'or' ? 'or' : 'and', pct });
  }
  for (const m of (Array.isArray(r.methods) ? r.methods : []).slice(0, 12)) {
    if (!m || !isCustomMode(m.id) || o.methods.some((x) => x.id === m.id)) continue;
    const name = String(m.name || '').trim().slice(0, 40); if (!name) continue;
    const steps = []; for (const s of (Array.isArray(m.steps) ? m.steps : []).slice(0, 5)) { const up = n(s && s.upTo, 1, 1000), x = n(s && s.x, 0, 5); if (up != null && x != null && (!steps.length || up > steps[steps.length - 1].upTo)) steps.push({ upTo: up, x }); }
    const beyond = n(m.beyond, 0, 5); o.methods.push({ id: m.id, name, steps, beyond: beyond == null ? 1 : beyond });
  }
  o.stack = r.stack === 'max' ? 'max' : 'sum';
  const cap = n(r.capPct, 0, 300); if (cap != null) o.capPct = cap;
  return o;
}
export const rulesOf = (wt) => (wt && wt.rules) || parseRules(null);
export const rulesAreDefault = (r) => JSON.stringify(parseRules(r)) === JSON.stringify(parseRules(null));
/** The weighted factor score — each factor's 0/1/2 times its importance. */
const rulesIn = (r) => (r && r.fw && Array.isArray(r.cuts) ? r : DEFAULT_RULES);   // anything that is not a rules object (e.g. an index from .map) means the defaults
export const factorScore = (f, rules) => FACTORS.reduce((s, k, i) => s + Number((f || [])[i] || 0) * rulesIn(rules).fw[k], 0);
export const baseFromFactors = (f, rules) => { const n = factorScore(f, rules), c = rulesIn(rules).cuts; return n <= c[0] ? 1 : n <= c[1] ? 2 : n <= c[2] ? 3 : n <= c[3] ? 4 : 5; };
/** Outside working time in Saudi Arabia: Friday, Saturday, or before 08:00 / from 17:00. */
export const isWeekend = (iso) => { const dow = new Date(Date.parse(iso) + 3 * 3600000).getUTCDay(); return dow === 5 || dow === 6; };
export const afterHours = (iso) => { const d = new Date(Date.parse(iso) + 3 * 3600000), dow = d.getUTCDay(), h = d.getUTCHours() + d.getUTCMinutes() / 60; return dow === 5 || dow === 6 || h < 8 || h >= 17; };
export const tierFromBase = (b) => (b >= 4 ? 'multistage' : b === 3 ? 'integration' : b === 2 ? 'customer' : 'admin');
/** Working hours between two instants: Sunday–Thursday, 08:00–17:00 Saudi time. */
export function businessHours(fromIso, toIso) {
  const a = Date.parse(fromIso), b = Date.parse(toIso); if (!(b > a)) return 0;
  const H = 3600000, off = 3 * H; let total = 0;
  let day = Math.floor((a + off) / (24 * H)) * 24 * H - off;            // midnight Saudi of the start day, as UTC ms
  for (let guard = 0; day < b && guard < 400; guard++, day += 24 * H) {
    const dow = new Date(day + off).getUTCDay(); if (dow === 5 || dow === 6) continue;   // Friday, Saturday
    const s = Math.max(a, day + 8 * H), e = Math.min(b, day + 17 * H); if (e > s) total += (e - s) / H;
  }
  return total;
}
/** One task's points: its type's base, by its method. */
export function taskPoints(wt, task) {
  const r = rulesOf(wt), h = task && task.createdAt && task.completedAt ? businessHours(task.createdAt, task.completedAt) : null;
  const done = task && task.completedAt, uses = (k) => r.extras.some((e) => e.when.includes(k));
  return pointsDetail(wt, task && task.type, h, { email: !!(task && task.fromEmail === true), after: !!(done && uses('after') && afterHours(task.completedAt)), weekend: !!(done && uses('weekend') && isWeekend(task.completedAt)) }).total;
}
/** How a task's points are made, step by step — the engine itself (taskPoints) and the calculator on the weights page. */
export function pointsDetail(wt, typeName, hours, flags = {}) {
  const x = wt && wt.tasks[typeKey(typeName)], base = x ? x.w : (wt ? wt.default : 1), r = rulesOf(wt);
  let mult = 1, why = 'done', method = null, stepAt = null;
  const cm = x && isCustomMode(x.mode) ? r.methods.find((m) => m.id === x.mode) : null;
  if (cm) {                                          // one of the manager's methods
    method = cm.name;
    if (cm.steps.length && x.std && hours != null) { const pct = (hours / x.std) * 100, i = cm.steps.findIndex((s) => pct <= s.upTo); mult = i >= 0 ? cm.steps[i].x : cm.beyond; stepAt = i >= 0 ? cm.steps[i].upTo : null; why = i >= 0 ? 'custom_step' : 'custom_beyond'; }
    else why = cm.steps.length ? 'custom_notime' : 'custom_flat';
  } else if (x && isCustomMode(x.mode)) why = 'custom_missing';   // a method that no longer exists counts as «on completion»
  else if (x && x.mode && x.mode !== 'done' && x.std && hours != null) {
    if (x.mode === 'speed') { mult = hours <= x.std ? r.speedX : 1; why = hours <= x.std ? 'speed_in' : 'speed_out'; }
    else { const q = hours / x.std; mult = q <= r.cmpFast ? r.cmpFastX : q <= r.cmpSlow ? 1 : r.cmpSlowX; why = q <= r.cmpFast ? 'cmp_fast' : q <= r.cmpSlow ? 'cmp_ok' : 'cmp_slow'; }   // three steps against the usual time
  }
  const cond = { email: !!flags.email, after: !!flags.after, weekend: !!flags.weekend, fast: !!(x && x.std && hours != null && hours <= x.std),
    field: !!(x && x.f && x.f[2] === 2), gov: !!(x && x.f && x.f[1] === 2), impact: !!(x && x.f && x.f[3] === 2) };
  const hit = r.extras.filter((e) => (e.join === 'or' ? e.when.some((k) => cond[k]) : e.when.every((k) => cond[k])));
  const extra = Math.min(r.capPct, hit.length ? (r.stack === 'max' ? Math.max(...hit.map((e) => e.pct)) : hit.reduce((s, e) => s + e.pct, 0)) : 0), p = base * mult * (1 + extra / 100);
  return { base, mult: Math.round(mult * 100) / 100, extra, hit, cond, method, stepAt, mode: (x && x.mode) || 'done', std: (x && x.std) || null, why, f: (x && x.f) || null,
    score: x && x.f ? Math.round(factorScore(x.f, r) * 10) / 10 : null, total: p === base ? base : Math.round(p * 10) / 10 };
}
export const taskWeight = (wt, typeName) => { const x = wt && wt.tasks[typeKey(typeName)]; return x ? x.w : (wt ? wt.default : 1); };
export const activityWeight = (wt, category) => { const x = wt && wt.activities[String(category || '').toLowerCase().trim()]; return x != null ? x : (wt ? wt.default : 1); };
/**
 * Break down completed tasks that have already been filtered to a single person and period.
 * Count each completed task once; an unlisted type uses the published default with a visible warning.
 */
export function taskPointBreakdown(completedTasks, wt) {
  const types = new Map();
  for (const x of completedTasks || []) {
    if (x.state !== 'done' || !x.completedAt) continue;
    const key = typeKey(x.type) || '—';
    const weight = taskPoints(wt, x);
    if (!types.has(key)) types.set(key, {
      key, name: String(x.type || key), count: 0, weight, points: 0,
      unmapped: !Boolean(wt && wt.tasks && Object.prototype.hasOwnProperty.call(wt.tasks, key)),
    });
    const row = types.get(key);
    row.count += 1;
    row.points += weight;
  }
  const rows = [...types.values()].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return {
    rows, count: rows.reduce((n, row) => n + row.count, 0),
    points: rows.reduce((n, row) => n + row.points, 0),
    unmapped: rows.filter((row) => row.unmapped).length,
  };
}

/** The team always sees approved weights; local drafts are an explicit management preview. */
export const portalWeights = (repoWeights, draft, teamMode = false) =>
  teamMode ? parseWeights(repoWeights) : mergeWeights(repoWeights, draft);

/** Compare the proposed browser-local draft with the official repo file, ignoring review dates. */
export function weightPublishDiff(repoWeights, draft) {
  const base = parseWeights(repoWeights);
  const proposed = mergeWeights(repoWeights, draft);
  const different = (a, b) => JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
  const changed = (a, b, normalize = (v) => v) => {
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    return [...keys].filter((key) => different(normalize(a && a[key]), normalize(b && b[key]))).sort();
  };
  const tasks = changed(base.tasks, proposed.tasks);
  const rulesChanged = different(base.rules, proposed.rules);   // the scoring rules publish with the weights (ADR-0045)
  const activities = changed(base.activities, proposed.activities);
  const editors = changed(base.editors, proposed.editors, (v) => (v || []).slice().sort());
  const card = changed(base.card, proposed.card);
  const defaults = base.default !== proposed.default ? 1 : 0;
  return {
    tasks, activities, editors, card, defaults, rules: rulesChanged ? 1 : 0,
    count: tasks.length + activities.length + editors.length + card.length + defaults + (rulesChanged ? 1 : 0),
  };
}

/** Keep the reviewed tiers and other published metadata when exporting a proposed GitHub change. */
export function publishableWeights(repoWeights, draft, reviewed) {
  const merged = mergeWeights(repoWeights, draft);
  return {
    ...(repoWeights && typeof repoWeights === 'object' ? repoWeights : {}),
    ...merged, schema: WEIGHTS_SCHEMA, v: 1,
    reviewed: /^\d{4}-\d{2}-\d{2}$/.test(reviewed || '') ? reviewed : (merged.reviewed || ''),
  };
}

/**
 * Weighted points per person in a period: completed tasks (closed in the period, credited to the assignee, cancelled
 * left out) × their type's weight, plus activities with customers marked Done in the period × their category's weight.
 * The raw counts stay beside the points — points never replace them.
 */
export function weightedPoints(tasks, activities, wt, { range, team = null } = {}) {
  const keep = team ? new Set(team) : null, by = new Map();
  const row = (id) => { if (!by.has(id)) by.set(id, { id, taskPoints: 0, activityPoints: 0, tasks: 0, activities: 0, byType: {} }); return by.get(id); };
  if (keep) for (const id of keep) row(id);
  const inR = (iso) => { const d = saudiDay(iso); return d && (!range || (d >= range.from && d <= range.to)); };
  for (const x of tasks || []) {
    if (x.state !== 'done' || !x.assigneeId || !inR(x.completedAt) || (keep && !keep.has(x.assigneeId))) continue;
    const w = taskPoints(wt, x), r = row(x.assigneeId), k = typeKey(x.type) || '—';
    r.taskPoints += w; r.tasks++; (r.byType[k] = r.byType[k] || { n: 0, points: 0 }); r.byType[k].n++; r.byType[k].points += w;
  }
  for (const a of activities || []) {
    if (!/^done$/i.test(a.status || '') || !a.createdById || !inR(a.createdAt) || (keep && !keep.has(a.createdById))) continue;
    const r = row(a.createdById); r.activityPoints += activityWeight(wt, a.category); r.activities++;
  }
  const people = [...by.values()].map((r) => ({ ...r, total: r.taskPoints + r.activityPoints })).sort((a, b) => b.total - a.total);
  return { people, total: people.reduce((s, r) => s + r.total, 0), byId: new Map(people.map((r) => [r.id, r])) };
}

// ===================== the monthly card (ADR-0020): a work pattern described from the numbers, every line with its "why" =====================
export const CARD_DEFAULTS = { minN: 5, spec: 1.5, speed: 0.3, selfLogged: 0.4, agingDays: 7, rate: 0.85, minPoints: 10, tierIdx: 1.3 };
export const ARCHETYPES = ['field', 'voice', 'volume', 'balanced', 'early'];
const monthOf = (iso) => (saudiDay(iso) || '').slice(0, 7);
export const monthRange = (ym) => { const [y, m] = ym.split('-').map(Number); const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); return { from: `${ym}-01`, to: `${ym}-${pad(last)}` }; };
export const prevMonth = (ym) => { const [y, m] = ym.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`; };
const medianOf = (arr) => { const a = arr.filter((v) => v != null).sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };
const hoursBetween = (a, b) => (a && b ? (Date.parse(b) - Date.parse(a)) / 3600000 : null);
const isoWeek = (iso) => { const d = new Date(Date.parse(iso) + 3 * 3600000); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day + 3); const w1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return `${d.getUTCFullYear()}-${pad(1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getUTCDay() + 6) % 7)) / 7))}`; };

/**
 * One person's card for a month, against their team. ctx = { tasks, activities, weights, team (ids), roster, now, thresholds }.
 * Nothing here is a verdict without its numbers: strengths, gaps and suggestions each carry the figures that produced them.
 */
export function monthCard(ctx, personId, ym) {
  const T = { ...CARD_DEFAULTS, ...((ctx.weights && ctx.weights.card) || {}), ...(ctx.thresholds || {}) };
  const wt = ctx.weights, team = ctx.team || [], range = monthRange(ym), prev = monthRange(prevMonth(ym));
  const inM = (iso, r) => { const d = saudiDay(iso); return d && d >= r.from && d <= r.to; };
  const doneIn = (r) => (ctx.tasks || []).filter((x) => x.state === 'done' && x.completedAt && inM(x.completedAt, r) && x.assigneeId);
  const done = doneIn(range), donePrev = doneIn(prev);
  const tierOf = (type) => { const x = wt && wt.tasks[typeKey(type)]; return (x && x.tier) || 'admin'; };
  const pts = (rows) => rows.reduce((s, x) => s + taskPoints(wt, x), 0);
  const mine = done.filter((x) => x.assigneeId === personId), minePrev = donePrev.filter((x) => x.assigneeId === personId);
  const teamRows = done.filter((x) => team.includes(x.assigneeId));
  // volume: points against the team's median, and the quartile band
  const perPerson = team.map((id) => ({ id, points: pts(done.filter((x) => x.assigneeId === id)), done: done.filter((x) => x.assigneeId === id).length }));
  const breakdown = taskPointBreakdown(mine, wt);
  const myPoints = breakdown.points, teamMedian = medianOf(perPerson.map((p) => p.points)) || 0;
  const sorted = [...perPerson].sort((a, b) => b.points - a.points);
  const rank = sorted.findIndex((p) => p.id === personId) + 1;
  const quartile = rank ? Math.min(4, Math.ceil((rank / sorted.length) * 4)) : null;
  const prevPoints = pts(minePrev);
  // fingerprint: points by tier, mine against the team's
  const known = (x) => !!(wt && wt.tasks[typeKey(x.type)]);
  const mineK = wt && Object.keys(wt.tasks).length ? mine.filter(known) : mine, teamK = wt && Object.keys(wt.tasks).length ? teamRows.filter(known) : teamRows;
  const otherWork = mine.length - mineK.length;
  const byTier = (rows) => { const o = { admin: 0, customer: 0, integration: 0, multistage: 0 }; for (const x of rows) o[tierOf(x.type)] += taskPoints(wt, x); return o; };
  const mineT = byTier(mineK), teamT = byTier(teamK);
  const share = (o) => { const tot = Object.values(o).reduce((a, b) => a + b, 0) || 1; return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v / tot])); };
  const ms = share(mineT), ts = share(teamT);
  const idx = Object.fromEntries(TIERS.map((k) => [k, ts[k] > 0 ? ms[k] / ts[k] : (ms[k] > 0 ? 2 : 1)]));
  let archetype = 'balanced';
  const knownPoints = Object.values(mineT).reduce((a, b) => a + b, 0);
  if (knownPoints < T.minPoints) archetype = 'early';   // judged on the teams' own work only
  else if ((ms.integration + ms.multistage) / Math.max(0.01, ts.integration + ts.multistage) >= T.tierIdx) archetype = 'field';
  else if (idx.customer >= T.tierIdx) archetype = 'voice';
  else if (idx.admin >= T.tierIdx && myPoints >= teamMedian) archetype = 'volume';
  // strengths: specialisation (my share of the team's work on a type vs my share overall), speed, initiative
  const myShare = teamK.length ? mineK.length / teamK.length : 0;
  const types = [...new Set(teamK.map((x) => typeKey(x.type)))];
  const perType = types.map((k) => {
    const tm = teamK.filter((x) => typeKey(x.type) === k), me = mineK.filter((x) => typeKey(x.type) === k);
    const name = (me[0] || tm[0]).type;
    const myMed = medianOf(me.map((x) => hoursBetween(x.createdAt, x.completedAt))), tmMed = medianOf(tm.map((x) => hoursBetween(x.createdAt, x.completedAt)));
    return { key: k, name, team: tm.length, mine: me.length, teamShare: tm.length / Math.max(1, teamK.length), spec: myShare > 0 && tm.length ? (me.length / tm.length) / myShare : 0, myMed, tmMed };
  });
  const strengths = [];
  for (const p of perType) if (p.mine >= T.minN && p.spec >= T.spec) strengths.push({ kind: 'spec', type: p.name, mine: p.mine, team: p.team, pct: Math.round((p.mine / p.team) * 100), myPct: Math.round(myShare * 100) });
  for (const p of perType) if (p.mine >= T.minN && p.myMed != null && p.tmMed != null && p.myMed <= p.tmMed * (1 - T.speed)) strengths.push({ kind: 'speed', type: p.name, myMed: p.myMed, teamMed: p.tmMed });
  const myActs = (ctx.activities || []).filter((a) => a.createdById === personId && /^done$/i.test(a.status || '') && inM(a.createdAt, range)).length;
  if (myActs > 0) strengths.push({ kind: 'initiative', n: myActs, customers: new Set((ctx.activities || []).filter((a) => a.createdById === personId && inM(a.createdAt, range)).map((a) => a.customerId)).size });
  // development: tier gaps, slow types, signals
  const development = [];
  for (const k of TIERS) if (ts[k] >= 0.10 && ms[k] <= ts[k] / 2 && myPoints >= T.minPoints) development.push({ kind: 'tierGap', tier: k, mine: Math.round(ms[k] * 100), team: Math.round(ts[k] * 100) });
  for (const p of perType) if (p.mine >= T.minN && p.myMed != null && p.tmMed != null && p.myMed >= p.tmMed * (1 + T.speed)) development.push({ kind: 'slow', type: p.name, myMed: p.myMed, teamMed: p.tmMed });
  const selfLogged = mine.filter((x) => !x.fromEmail && x.createdById && x.createdById === x.assigneeId).length;
  if (mine.length >= T.minN && selfLogged / mine.length > T.selfLogged) development.push({ kind: 'selfLogged', pct: Math.round((selfLogged / mine.length) * 100) });
  const nowIso = ctx.now ? ctx.now.toISOString() : new Date().toISOString();
  const aging = (ctx.tasks || []).filter((x) => x.assigneeId === personId && x.state === 'open' && x.createdAt && hoursBetween(x.createdAt, nowIso) > T.agingDays * 24).length;
  if (aging > 0) development.push({ kind: 'aging', n: aging, days: T.agingDays });
  const assigned = (ctx.tasks || []).filter((x) => x.assigneeId === personId && inM(x.createdAt, range) && x.state !== 'cancelled');
  const rate = assigned.length >= T.minN ? assigned.filter((x) => x.state === 'done').length / assigned.length : null;
  if (rate != null && rate < T.rate) development.push({ kind: 'rate', pct: Math.round(rate * 100) });
  // suggestions for the manager: stretch, invest, balance — each with its reason
  const suggestions = [];
  const myMainTier = TIERS.reduce((a, b) => (mineT[a] >= mineT[b] ? a : b));
  const upTier = TIERS[Math.min(TIERS.length - 1, TIERS.indexOf(myMainTier) + 1)];
  if (upTier !== myMainTier && myPoints >= T.minPoints) {
    const cand = perType.filter((p) => tierOf(p.name) === upTier && p.team >= T.minN).sort((a, b) => b.team - a.team)[0];
    if (cand) suggestions.push({ kind: 'stretch', type: cand.name, tier: upTier, teamN: cand.team, mine: cand.mine });
  }
  const fast = strengths.find((x) => x.kind === 'speed'); if (fast) suggestions.push({ kind: 'invest', type: fast.type, myMed: fast.myMed, teamMed: fast.teamMed });
  if (quartile === 4 && perPerson.length >= 3) { const quick = perType.filter((p) => tierOf(p.name) === 'admin' && p.team >= T.minN).sort((a, b) => b.team - a.team)[0]; if (quick) suggestions.push({ kind: 'balanceUp', type: quick.name }); }
  if (quartile === 1 && perPerson.length >= 3) { const deep = perType.filter((p) => tierOf(p.name) === 'multistage' && p.team >= 1).sort((a, b) => b.team - a.team)[0]; if (deep) suggestions.push({ kind: 'balanceDeep', type: deep.name }); }
  // consistency: points per week inside the month
  const weeks = {}; for (const x of mine) { const w = isoWeek(x.completedAt); weeks[w] = (weeks[w] || 0) + taskPoints(wt, x); }
  const wv = Object.values(weeks); const mean = wv.length ? wv.reduce((a, b) => a + b, 0) / wv.length : 0;
  const sd = wv.length > 1 ? Math.sqrt(wv.reduce((a, b) => a + (b - mean) ** 2, 0) / wv.length) : 0;
  const consistency = wv.length >= 3 && mean > 0 ? Math.max(0, Math.min(1, 1 - sd / mean)) : null;
  const onLeave = !!(ctx.roster && ctx.roster.people && ctx.roster.people[personId] && ctx.roster.people[personId].onLeave);
  return { month: ym, personId, onLeave, points: myPoints, breakdown, weightsReviewed: wt && wt.reviewed || '', done: mine.length, rank: rank || null, prevPoints, prevDone: minePrev.length, teamMedian, quartile, teamSize: perPerson.length,
    tiers: { mine: mineT, team: teamT, mineShare: ms, teamShare: ts }, archetype, strengths, development, suggestions, consistency, weeks: wv.length, activities: myActs, otherWork, selfLoggedPct: mine.length ? Math.round((selfLogged / mine.length) * 100) : 0 };
}
/** The team's month: a card per person, the heat map (people × tiers) and the next month's plan from the suggestions. */
export function teamMonth(ctx, ym) {
  const cards = (ctx.team || []).map((id) => monthCard(ctx, id, ym));
  const heat = cards.map((c) => ({ id: c.id || c.personId, ...c.tiers.mine, total: c.points }));
  return { month: ym, cards, heat, plan: cards.filter((c) => c.suggestions.length).map((c) => ({ id: c.personId, suggestions: c.suggestions, archetype: c.archetype })) };
}
/** Months fully inside the data and already over: these get closed cards. */
export function closableMonths(ranges, now = new Date()) {
  const today = ymd(saudiToday(now)); const out = new Set();
  for (const r of ranges || []) { let ym = r.from.slice(0, 7); while (ym <= r.to.slice(0, 7)) { const m = monthRange(ym); if (m.from >= r.from && m.to <= r.to && m.to < today) out.add(ym); ym = ym === r.to.slice(0, 7) ? '9999-99' : (([y, mm]) => (mm === 12 ? `${y + 1}-01` : `${y}-${pad(mm + 1)}`))(ym.split('-').map(Number)); } }
  return [...out].sort();
}

// ===================== the week, goals and the pattern's path (ADR-0021) =====================
/** The last 7 days against the 7 before, per person in scope: points, the movers, sharp drops, and work left open too long. */
export function weeklyDigest(tasks, wt, team, now = new Date(), T = CARD_DEFAULTS) {
  const end = Date.parse(now.toISOString()), d7 = 7 * 86400000;
  const win = (x, a, b) => { const t0 = x.completedAt ? Date.parse(x.completedAt) : NaN; return t0 > a && t0 <= b; };
  const rows = (team || []).map((id) => {
    const mine = (tasks || []).filter((x) => x.assigneeId === id && x.state === 'done');
    const thisW = mine.filter((x) => win(x, end - d7, end)), lastW = mine.filter((x) => win(x, end - 2 * d7, end - d7));
    const p = thisW.reduce((s, x) => s + taskPoints(wt, x), 0), q = lastW.reduce((s, x) => s + taskPoints(wt, x), 0);
    const aging = (tasks || []).filter((x) => x.assigneeId === id && x.state === 'open' && x.createdAt && end - Date.parse(x.createdAt) > (T.agingDays || 7) * 86400000).length;
    return { id, points: p, prev: q, delta: p - q, done: thisW.length, aging };
  });
  const drops = rows.filter((r) => r.prev >= 10 && r.points <= r.prev * 0.6).sort((a, b) => a.delta - b.delta);
  const movers = [...rows].filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3);
  const aging = rows.filter((r) => r.aging > 0).sort((a, b) => b.aging - a.aging);
  return { rows, drops, movers, aging, total: rows.reduce((s, r) => s + r.points, 0), prevTotal: rows.reduce((s, r) => s + r.prev, 0), from: new Date(end - d7).toISOString(), to: now.toISOString() };
}
/** A month's goals for one person: each goal is a task type with a target count, or a points target; progress from that month's completed work. */
export function goalProgress(tasks, wt, personId, ym, goals) {
  const r = monthRange(ym);
  const mine = (tasks || []).filter((x) => x.assigneeId === personId && x.state === 'done' && x.completedAt && saudiDay(x.completedAt) >= r.from && saudiDay(x.completedAt) <= r.to);
  return (goals || []).map((g) => {
    const got = g.key === '__points__' ? mine.reduce((s, x) => s + taskPoints(wt, x), 0) : mine.filter((x) => typeKey(x.type) === g.key).length;
    return { ...g, got, pct: g.target > 0 ? Math.min(100, Math.round((got / g.target) * 100)) : 0, met: got >= g.target };
  });
}
// ---------- quarter development plans (ADR-0040) ----------
/** 'YYYY-Qn' → the quarter's first and last Saudi day and its label. */
export function quarterRange(key) {
  const m = /^(\d{4})-Q([1-4])$/.exec(String(key || '')); if (!m) return null;
  const y = +m[1], q = +m[2], from = `${y}-${String((q - 1) * 3 + 1).padStart(2, '0')}-01`;
  const end = new Date(Date.UTC(y, q * 3, 0)).toISOString().slice(0, 10);
  return { key, from, to: end, label: `Q${q} ${y}`, months: [0, 1, 2].map((k) => `${y}-${String((q - 1) * 3 + 1 + k).padStart(2, '0')}`) };
}
/** The quarter holding a day, and the ones before and after it. */
export function quarterOf(day, shift = 0) {
  const y = +String(day).slice(0, 4), q = Math.floor((+String(day).slice(5, 7) - 1) / 3) + shift;
  const yy = y + Math.floor(q / 4), qq = ((q % 4) + 4) % 4 + 1; return quarterRange(`${yy}-Q${qq}`);
}
/** What one person delivered in a window: the plan's starting line. */
export function quarterBaseline(tasks, wt, personId, range) {
  const inR = (d) => d && saudiDay(d) >= range.from && saudiDay(d) <= range.to;
  const done = (tasks || []).filter((x) => x.assigneeId === personId && x.state === 'done' && inR(x.completedAt));
  const born = (tasks || []).filter((x) => x.assigneeId === personId && inR(x.createdAt) && x.state !== 'cancelled');
  const hrs = done.map((x) => (Date.parse(x.completedAt) - Date.parse(x.createdAt)) / 3600000).filter((h) => h >= 0);
  const byType = new Map(); for (const x of done) { const k = typeKey(x.type); byType.set(k, (byType.get(k) || 0) + 1); }
  return { done: done.length, points: Math.round(done.reduce((s, x) => s + taskPoints(wt, x), 0) * 10) / 10,
    avgHours: hrs.length ? Math.round((hrs.reduce((s, h) => s + h, 0) / hrs.length) * 10) / 10 : null,
    rate: born.length ? Math.round((born.filter((x) => x.state === 'done').length / born.length) * 100) / 100 : null,
    types: [...byType.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ k, n })) };
}
const LOWER_BETTER = new Set(['avgHours']);
/** Progress of each quarter goal from the work done in the quarter; a custom goal carries its own percentage. */
export function quarterGoalProgress(tasks, wt, personId, range, goals) {
  const b = quarterBaseline(tasks, wt, personId, range);
  return (goals || []).map((g) => {
    let got = null;
    if (g.metric === 'custom') got = Math.max(0, Math.min(100, Number(g.pct) || 0));
    else if (g.metric === 'type') got = (b.types.find((x) => x.k === g.type) || { n: 0 }).n;
    else got = b[g.metric];
    const tgt = Number(g.target) || 0;
    let pct = 0;
    if (g.metric === 'custom') pct = got;
    else if (got == null || !tgt) pct = 0;
    else if (LOWER_BETTER.has(g.metric)) pct = got <= tgt ? 100 : Math.max(0, Math.round((tgt / got) * 100));
    else pct = Math.min(100, Math.round((got / tgt) * 100));
    return { ...g, got, pct, met: pct >= 100 };
  });
}
/** The weighted progress of a whole plan (0–100), or null with no goals. */
export function planProgress(progress) {
  const w = (progress || []).reduce((s, g) => s + (Number(g.weight) || 1), 0); if (!w) return null;
  return Math.round(progress.reduce((s, g) => s + g.pct * (Number(g.weight) || 1), 0) / w);
}
/** Goals suggested from the baseline and the weakest axes: a stretch on what the person already does, aimed at what is weakest. */
export function suggestQuarterGoals(base, level) {
  const out = [], up = (v, f) => Math.max(1, Math.ceil(v * f));
  const weak = level && level.axes ? Object.entries(level.axes).filter(([, v]) => v != null).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([k]) => k) : [];
  out.push({ metric: 'points', base: base.points, target: up(base.points || 10, weak.includes('volume') ? 1.2 : 1.1), weight: 3 });
  out.push({ metric: 'done', base: base.done, target: up(base.done || 5, 1.1), weight: 2 });
  if (base.avgHours != null) out.push({ metric: 'avgHours', base: base.avgHours, target: Math.max(1, Math.round(base.avgHours * (weak.includes('speed') ? 0.8 : 0.9) * 10) / 10), weight: weak.includes('speed') ? 2 : 1 });
  out.push({ metric: 'rate', base: base.rate, target: Math.min(1, Math.max(0.9, Math.round(((base.rate || 0) + 0.05) * 100) / 100)), weight: weak.includes('reliability') ? 2 : 1 });
  if (base.types[0]) out.push({ metric: 'type', type: base.types[0].k, base: base.types[0].n, target: up(base.types[0].n, 1.1), weight: 1 });
  return out.map((g, i) => ({ id: `s${i + 1}`, ...g, weak: weak.includes({ points: 'volume', done: 'volume', avgHours: 'speed', rate: 'reliability' }[g.metric]) }));
}
/** The pattern's path: closed months in order, for one person — archetype, points, quartile. */
export function patternPath(closed, personId) {
  return Object.keys(closed || {}).sort().map((ym) => closed[ym][personId] ? { month: ym, archetype: closed[ym][personId].archetype, points: closed[ym][personId].points, quartile: closed[ym][personId].quartile } : null).filter(Boolean);
}

// ===================== repair quality from PRO (ADR-0022): did the device report again after the repair? =====================
/**
 * items: [{ ref, engineerId, at }] — ref is an IMEI, serial or unit name; at the repair time (ISO).
 * units: PRO units with imei / device_serial / name / last_update. A device "came back" if it reported after the repair;
 * "waiting" while inside the grace window; "failed" past it with no report; "unknown" when PRO has no such unit.
 */
export function repairCheck(units, items, now = new Date(), graceHours = 48) {
  const key = (v) => String(v || '').trim().toLowerCase();
  const idx = new Map();
  for (const u of units || []) for (const v of [u.imei, u.device_serial, u.name, u._id]) if (v) idx.set(key(v), u);
  const ts = (u) => { const lu = (u && u.last_update) || {}; const t = lu.dtt || lu.dts; if (!t) return 0; const n = +t; return Number.isFinite(n) ? (n < 1e12 ? n * 1000 : n) : (Date.parse(t) || 0); };
  const nowMs = now.getTime();
  const rows = (items || []).map((it) => {
    const u = idx.get(key(it.ref)); const at = Date.parse(it.at || '') || 0; const last = u ? ts(u) : 0;
    const status = !u ? 'unknown' : last > at ? 'ok' : nowMs - at <= graceHours * 3600000 ? 'waiting' : 'failed';
    return { ...it, unit: u ? String(u.name || u.imei || '') : null, last: last ? new Date(last).toISOString() : null, hoursToReport: u && last > at ? (last - at) / 3600000 : null, status };
  });
  const by = new Map();
  for (const r of rows) { if (!r.engineerId) continue; const x = by.get(r.engineerId) || { id: r.engineerId, ok: 0, failed: 0, waiting: 0, unknown: 0 }; x[r.status]++; by.set(r.engineerId, x); }
  const people = [...by.values()].map((x) => ({ ...x, decided: x.ok + x.failed, rate: x.ok + x.failed ? x.ok / (x.ok + x.failed) : null })).sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
  const decided = rows.filter((r) => r.status === 'ok' || r.status === 'failed');
  return { rows, people, rate: decided.length ? decided.filter((r) => r.status === 'ok').length / decided.length : null };
}
/** Lines pasted by a person: "IMEI", "IMEI, 2026-10-20 14:00" or "IMEI<TAB>date" — the date defaults to now. */
export function parseRepairLines(text, now = new Date()) {
  return String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 500).map((l) => {
    const [ref, ...rest] = l.split(/[,\t;]+/).map((x) => x.trim());
    const d = rest.join(' ').trim(); const at = d ? Date.parse(d.replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(d) ? '' : '+03:00')) : NaN;
    return { ref, at: new Date(Number.isFinite(at) ? at : now.getTime()).toISOString() };
  }).filter((x) => x.ref && x.ref.length >= 4);
}

// ===================== workload share (ADR-0028): each person's slice of the team's work, by day / week / month / quarter =====================
/** The calendar window ending on `day` (YYYY-MM-DD, Saudi): the day itself, its week (Sunday–Saturday, the Saudi work week),
 *  its month, or its quarter. */
export function shareWindow(kind, day) {
  const d = new Date(`${day}T00:00:00Z`), y = d.getUTCFullYear(), m = d.getUTCMonth();
  if (kind === 'day') return { from: day, to: day };
  if (kind === 'week') { const s = new Date(d); s.setUTCDate(d.getUTCDate() - d.getUTCDay()); const e = new Date(s); e.setUTCDate(s.getUTCDate() + 6); return { from: ymd(s), to: ymd(e) }; }
  if (kind === 'quarter') { const q = Math.floor(m / 3) * 3; return { from: ymd(new Date(Date.UTC(y, q, 1))), to: ymd(new Date(Date.UTC(y, q + 3, 0))) }; }
  return { from: ymd(new Date(Date.UTC(y, m, 1))), to: ymd(new Date(Date.UTC(y, m + 1, 0))) };
}
/** The last n calendar quarters ending with the one holding `day`, newest first: [{ label: 'Q4 2026', from, to }]. */
export function lastQuarters(day, n = 4) {
  const d = new Date(`${day}T00:00:00Z`); let y = d.getUTCFullYear(), q = Math.floor(d.getUTCMonth() / 3);
  const out = [];
  for (let i = 0; i < n; i++) { out.push({ label: `Q${q + 1} ${y}`, from: ymd(new Date(Date.UTC(y, q * 3, 1))), to: ymd(new Date(Date.UTC(y, q * 3 + 3, 0))) }); q--; if (q < 0) { q = 3; y--; } }
  return out;
}
/** Each person's share of the team's completed work in a window: tasks, weighted points, and email tasks (module 146). */
export function workloadShare(tasks, wt, team, win) {
  const inW = (iso) => { const d = saudiDay(iso); return d && d >= win.from && d <= win.to; };
  const done = (tasks || []).filter((x) => x.state === 'done' && x.completedAt && inW(x.completedAt) && (team || []).includes(x.assigneeId));
  const tot = { tasks: done.length, points: done.reduce((s, x) => s + taskPoints(wt, x), 0), email: done.filter((x) => Number(x.moduleId) === 146).length };
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  const people = (team || []).map((id) => {
    const mine = done.filter((x) => x.assigneeId === id);
    const p = { id, tasks: mine.length, points: mine.reduce((s, x) => s + taskPoints(wt, x), 0), email: mine.filter((x) => Number(x.moduleId) === 146).length };
    return { ...p, tasksPct: pct(p.tasks, tot.tasks), pointsPct: pct(p.points, tot.points), emailPct: pct(p.email, tot.email) };
  }).sort((a, b) => b.points - a.points || b.tasks - a.tasks);
  const fair = team && team.length ? Math.round(1000 / team.length) / 10 : 0;   // the even slice, for reference
  return { win, total: tot, people, fair };
}

// ===================== email replies from the manager's own mailbox (ADR-0029) =====================
// Every customer email reaches the manager (reply-all keeps the team in copy), so his inbox holds both the customers' messages and
// the engineers' replies. The portal reads it with his own Microsoft sign-in, classifies each customer thread by its words, and keeps
// ONLY: time, conversation hash, who (a scope person id, or "ext"/"x"), and the category. No subject, no body, no address is stored.
export const MAIL_CATEGORIES = [
  { k: 'integration', tier: 'hard', w: 3, words: ['api', 'integration', 'integrate', 'webhook', 'endpoint', 'json', 'sdk', 'token', 'تكامل', 'واجهة برمجية'] },
  // WASL linking is routine work (the manager's call, 30 Oct 2026): easy — unless real integration words above are present
  { k: 'wasl', tier: 'easy', w: 1, words: ['wasl', 'wasl link', 'منصة وصل', 'ربط وصل', 'ربط مع وصل', 'ربط بوصل', 'الربط مع وصل'] },
  { k: 'integration', tier: 'hard', w: 3, words: ['ربط'] },
  { k: 'request', tier: 'hard', w: 3, words: ['requirement', 'requirements', 'rfq', 'quotation', 'quote', 'proposal', 'new request', 'tender', 'متطلبات', 'عرض سعر', 'طلب جديد', 'تسعير', 'مناقصة', 'عرض فني'] },
  { k: 'issue', tier: 'medium', w: 2, words: ['issue', 'problem', 'error', 'not working', 'offline', 'fault', 'down', 'disconnected', 'مشكلة', 'عطل', 'لا يعمل', 'خطأ', 'متوقف', 'توقف', 'لا تعمل'] },
  { k: 'inquiry', tier: 'easy', w: 1, words: ['inquiry', 'enquiry', 'question', 'password', 'report', 'how to', 'استفسار', 'كلمة المرور', 'كلمة السر', 'تقرير', 'سؤال', 'كيف'] },
];
const MAIL_TIER_RANK = { hard: 3, medium: 2, easy: 1, other: 0 };
/** The category of a customer message from its subject and preview; the first matching category in the list wins. */
export function classifyMail(text) {
  const s = ` ${String(text || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  for (const c of MAIL_CATEGORIES) if (c.words.some((w) => s.includes(` ${w} `) || (/[\u0600-\u06FF]/.test(w) && s.includes(w)))) return c.k;
  return 'other';
}
export const mailTier = (k) => (MAIL_CATEGORIES.find((c) => c.k === k) || { tier: 'other' }).tier;
const fnv = (str) => { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); };
const normName = (n) => String(n || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
/** Who sent it: a person from the given list by display name (or by the address's local part), "x" for an unmatched colleague, "ext" for a customer. */
export function mailSender(from, people, isInternal) {
  const addr = String((from && from.address) || '').toLowerCase(), name = normName(from && from.name);
  if (!isInternal(addr)) return 'ext';
  const local = normName(addr.split('@')[0].replace(/[._-]+/g, ' '));
  for (const p of people || []) {
    const n = normName(p.nameEn), a = normName(p.nameAr);
    if (n && (n === name || (local && local.split(' ').length > 1 && local.split(' ').every((t) => n.split(' ').includes(t))))) return p.id;
    if (a && a === name) return p.id;
  }
  return 'x';
}
/** A Graph message → the stored row (nothing personal kept). */
export function mailRow(msg, people, isInternal) {
  const w = mailSender(msg.from && msg.from.emailAddress, people, isInternal);
  return { i: fnv(String(msg.id || '')), t: msg.receivedDateTime, c: fnv(String(msg.conversationId || '')), w: w, k: w === 'ext' ? classifyMail(`${msg.subject || ''} ${msg.bodyPreview || ''}`) : null };
}
/** Per person in a window: replies, threads, the thread categories they answered, the hard share, and the median first-reply time. */
export function mailStats(rows, team, win) {
  const inW = (iso) => { const d = saudiDay(iso); return d && d >= win.from && d <= win.to; };
  const conv = new Map();
  for (const r of [...(rows || [])].sort((a, b) => Date.parse(a.t) - Date.parse(b.t))) { if (!conv.has(r.c)) conv.set(r.c, []); conv.get(r.c).push(r); }
  const per = new Map((team || []).map((id) => [id, { id, replies: 0, threads: new Set(), cats: { hard: 0, medium: 0, easy: 0, other: 0 }, firsts: [] }]));
  let customerThreads = 0, unanswered = 0, otherColleagues = 0;
  for (const msgs of conv.values()) {
    const cust = msgs.filter((m) => m.w === 'ext');
    const cat = cust.reduce((best, m) => (MAIL_TIER_RANK[mailTier(m.k)] > MAIL_TIER_RANK[mailTier(best)] ? m.k : best), 'other');
    const firstCust = cust.find((m) => inW(m.t));
    if (firstCust) {
      customerThreads++;
      const reply = msgs.find((m) => m.w !== 'ext' && Date.parse(m.t) > Date.parse(firstCust.t));
      if (!reply) unanswered++;
      else if (per.has(reply.w)) per.get(reply.w).firsts.push((Date.parse(reply.t) - Date.parse(firstCust.t)) / 60000);
    }
    for (const m of msgs) {
      if (m.w === 'ext' || !inW(m.t)) continue;
      if (!per.has(m.w)) { otherColleagues++; continue; }
      const p = per.get(m.w); p.replies++;
      if (cust.length && !p.threads.has(msgs)) { p.threads.add(msgs); p.cats[mailTier(cat)]++; }
    }
  }
  const total = [...per.values()].reduce((s, p) => s + p.replies, 0);
  const med = (a) => { const x = [...a].sort((m, n) => m - n); return x.length ? x[Math.floor(x.length / 2)] : null; };
  const people = [...per.values()].map((p) => { const th = p.threads.size;
    return { id: p.id, replies: p.replies, share: total ? Math.round((p.replies / total) * 1000) / 10 : 0, threads: th, cats: p.cats,
      hardPct: th ? Math.round((p.cats.hard / th) * 100) : 0, firstReplyMin: med(p.firsts), firsts: p.firsts.length }; })
    .sort((a, b) => b.replies - a.replies);
  return { win, total, customerThreads, unanswered, otherColleagues, people };
}

// ===================== the engineer's level (ADR-0030): four axes against teammates, a level, a trend and a forecast =====================
export const LEVELS = [{ n: 1, k: 'starter' }, { n: 2, k: 'practitioner' }, { n: 3, k: 'specialist' }, { n: 4, k: 'reference' }];
const pctRank = (vals, v, higherBetter = true) => {
  const others = vals.filter((x) => x != null); if (v == null || others.length < 2) return null;
  const better = others.filter((x) => (higherBetter ? x < v : x > v)).length, same = others.filter((x) => x === v).length - 1;
  return Math.round(((better + same / 2) / (others.length - 1)) * 100);
};
/** Raw axes for one person in a window (tasks; plus email stats when the manager's device has them). */
function rawAxes(tasks, wt, id, win, mail) {
  const inW = (iso) => { const d = saudiDay(iso); return d && d >= win.from && d <= win.to; };
  const known = (x) => !wt || !Object.keys(wt.tasks || {}).length || !!wt.tasks[typeKey(x.type)];
  const tierOf = (type) => { const x = wt && wt.tasks[typeKey(type)]; return (x && x.tier) || 'admin'; };
  const done = (tasks || []).filter((x) => x.assigneeId === id && x.state === 'done' && x.completedAt && inW(x.completedAt) && known(x));
  const points = done.reduce((a, x) => a + taskPoints(wt, x), 0);
  const hardPts = done.filter((x) => ['integration', 'multistage'].includes(tierOf(x.type))).reduce((a, x) => a + taskPoints(wt, x), 0);
  const hrs = done.map((x) => (Date.parse(x.completedAt) - Date.parse(x.createdAt)) / 3600000).filter((h) => h >= 0).sort((a, b) => a - b);
  const assigned = (tasks || []).filter((x) => x.assigneeId === id && x.createdAt && inW(x.createdAt) && x.state !== 'cancelled');
  const m = mail && mail.people.find((p) => p.id === id);
  return { points, difficulty: points >= 10 ? hardPts / points : null, speed: hrs.length >= 5 ? hrs[Math.floor(hrs.length / 2)] : null,
    reliability: assigned.length >= 5 ? assigned.filter((x) => x.state === 'done').length / assigned.length : null,
    mailHard: m && m.threads >= 5 ? m.hardPct : null, mailFirst: m && m.firsts >= 5 ? m.firstReplyMin : null };
}
/** Levels for everyone in `team` for one window; `prev` windows (oldest first) give the trend and the forecast. */
export function engineerLevels(tasks, wt, team, win, { prev = [], mailRows = null } = {}) {
  const at = (w) => { const mail = mailRows && mailRows.length ? mailStats(mailRows, team, w) : null;
    const raw = Object.fromEntries(team.map((id) => [id, rawAxes(tasks, wt, id, w, mail)]));
    const col = (k) => team.map((id) => raw[id][k]);
    const avg = (...xs) => { const v = xs.filter((x) => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
    return Object.fromEntries(team.map((id) => { const r = raw[id];
      const axes = { volume: r.points >= 10 ? pctRank(col('points'), r.points) : null,
        difficulty: avg(pctRank(col('difficulty'), r.difficulty), pctRank(col('mailHard'), r.mailHard)),
        speed: avg(pctRank(col('speed'), r.speed, false), pctRank(col('mailFirst'), r.mailFirst, false)),
        reliability: pctRank(col('reliability'), r.reliability) };
      const vals = Object.values(axes).filter((x) => x != null);
      const score = vals.length >= 2 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      const level = r.points < 10 || score == null ? null : score >= 80 && (axes.difficulty ?? 0) >= 60 ? 4 : score >= 60 ? 3 : score >= 35 ? 2 : 1;
      return [id, { id, raw: r, axes, score, level, mailUsed: !!mail }]; })); };
  const now = at(win), before = prev.map(at);
  for (const id of team) {
    const series = [...before.map((b) => b[id].score), now[id].score].filter((x) => x != null);
    const last = before.length ? before[before.length - 1][id].score : null;
    now[id].trend = now[id].score == null || last == null ? null : now[id].score - last >= 8 ? 'up' : last - now[id].score >= 8 ? 'down' : 'steady';
    if (series.length >= 3) { const n = series.length, xs = series.map((_, i) => i), mx = (n - 1) / 2, my = series.reduce((a, b) => a + b, 0) / n;
      const slope = xs.reduce((a, x, i) => a + (x - mx) * (series[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
      now[id].forecast = Math.max(0, Math.min(100, Math.round(series[n - 1] + slope))); } else now[id].forecast = null;
    now[id].history = series;
  }
  return now;
}
/** The manager's development suggestions from the weakest axes — never shown to the engineer. */
export function developmentPlan(levels, id) {
  const me = levels[id]; if (!me || me.score == null) return [];
  const weak = Object.entries(me.axes).filter(([, v]) => v != null).sort((a, b) => a[1] - b[1]).slice(0, 2).filter(([, v]) => v < 50);
  return weak.map(([axis, v]) => { const top = Object.values(levels).filter((p) => p.id !== id && p.axes[axis] != null).sort((a, b) => b.axes[axis] - a.axes[axis])[0];
    return { axis, pct: v, buddy: top ? top.id : null }; });
}

// ===================== load sustainability (ADR-0032): workload signals that come weeks before burnout or resignation =====================
// Signals, never a diagnosis: when each person's completed work and email replies happen (outside Sun–Thu 08:00–17:00 Saudi time,
// weekends, late night 21:00–05:00), their slice of the team's points against an even slice, and whether after-hours work is rising.
export const LOAD_LIMITS = { afterAmber: 15, afterRed: 30, weekendAmber: 5, weekendRed: 15, lateAmber: 5, shareAmber: 1.5, shareRed: 2, riseAmber: 10, minEvents: 15 };
const saClock = (iso) => { const d = new Date(Date.parse(iso) + 3 * 3600000); return { dow: d.getUTCDay(), h: d.getUTCHours() + d.getUTCMinutes() / 60 }; };
export function loadSustainability(tasks, wt, team, endDay, { mailRows = null, L = LOAD_LIMITS } = {}) {
  const end = Date.parse(`${endDay}T21:00:00Z`), start = end - 28 * 86400000, mid = end - 14 * 86400000;
  const inW = (iso, a, b) => { const t0 = Date.parse(iso); return t0 > a && t0 <= b; };
  const pts = Object.fromEntries(team.map((id) => [id, 0]));
  for (const x of tasks || []) if (x.state === 'done' && x.completedAt && inW(x.completedAt, start, end) && x.assigneeId in pts) pts[x.assigneeId] += taskPoints(wt, x);
  const total = Object.values(pts).reduce((a, b) => a + b, 0), fair = team.length ? total / team.length : 0;
  const out = {};
  for (const id of team) {
    const ev = (tasks || []).filter((x) => x.assigneeId === id && x.state === 'done' && x.completedAt && inW(x.completedAt, start, end)).map((x) => x.completedAt)
      .concat((mailRows || []).filter((r) => r.w === id && inW(r.t, start, end)).map((r) => r.t));
    const off = (t0) => { const c = saClock(t0); return c.dow === 5 || c.dow === 6 || c.h < 8 || c.h >= 17; };
    const pct = (arr, f) => (arr.length ? Math.round((arr.filter(f).length / arr.length) * 100) : 0);
    const after = pct(ev, off), weekend = pct(ev, (t0) => [5, 6].includes(saClock(t0).dow)), late = pct(ev, (t0) => { const h = saClock(t0).h; return h >= 21 || h < 5; });
    const recent = ev.filter((t0) => Date.parse(t0) > mid), earlier = ev.filter((t0) => Date.parse(t0) <= mid);
    const rise = recent.length >= 8 && earlier.length >= 8 ? pct(recent, off) - pct(earlier, off) : null;
    const share = fair ? pts[id] / fair : 0;
    const signals = [];
    if (ev.length >= L.minEvents) {
      if (after >= L.afterAmber) signals.push({ k: 'after', v: after, level: after >= L.afterRed ? 'red' : 'amber' });
      if (weekend >= L.weekendAmber) signals.push({ k: 'weekend', v: weekend, level: weekend >= L.weekendRed ? 'red' : 'amber' });
      if (late >= L.lateAmber) signals.push({ k: 'late', v: late, level: 'amber' });
      if (rise != null && rise >= L.riseAmber) signals.push({ k: 'rise', v: rise, level: 'amber' });
    }
    if (share >= L.shareAmber && pts[id] >= 20) signals.push({ k: 'share', v: Math.round(share * 10) / 10, level: share >= L.shareRed ? 'red' : 'amber' });
    const reds = signals.filter((x) => x.level === 'red').length, ambers = signals.length - reds;
    const status = ev.length < L.minEvents && !signals.length ? 'quiet' : reds || ambers >= 3 ? 'red' : ambers ? 'amber' : 'green';
    out[id] = { id, events: ev.length, after, weekend, late, rise, points: Math.round(pts[id]), share: Math.round(share * 10) / 10, signals, status };
  }
  return { from: new Date(start).toISOString(), to: new Date(end).toISOString(), people: out, fairPoints: Math.round(fair) };
}

/** Parts of a whole as donut segments: each gets its share, and the SVG dash pair for a circle of radius r. */
export function donutParts(parts, r = 40) {
  const C = 2 * Math.PI * r;
  const total = parts.reduce((s, p) => s + Math.max(0, p.value || 0), 0);
  let offset = 0;
  return { total, parts: parts.filter((p) => p.value > 0).map((p) => {
    const share = total ? p.value / total : 0, len = share * C;
    const seg = { ...p, share, dasharray: `${len.toFixed(2)} ${(C - len).toFixed(2)}`, dashoffset: (-offset).toFixed(2) };
    offset += len; return seg;
  }) };
}

/** This month so far, and the same days of last month — a fair comparison (whole months would not be). */
export function monthWindows(now = new Date()) {
  const today = ymd(saudiToday(now));
  const [y, m, d] = today.split('-').map(Number);
  const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1;
  const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
  return { day: d, this: { from: `${y}-${pad(m)}-01`, to: today }, last: { from: `${py}-${pad(pm)}-01`, to: `${py}-${pad(pm)}-${pad(Math.min(d, lastDay))}` } };
}

/** A period so far against the same number of days before it: this month, this quarter, or the last six months. */
export function periodWindows(kind = 'month', now = new Date()) {
  if (kind === 'month') return { kind, ...monthWindows(now) };
  const today = ymd(saudiToday(now));
  const [y, m] = today.split('-').map(Number);
  const dayMs = 86400000, at = (d) => Date.parse(`${d}T00:00:00Z`), toYmd = (ms) => new Date(ms).toISOString().slice(0, 10);
  let start, prevStart;
  if (kind === 'quarter') {
    const qm = Math.floor((m - 1) / 3) * 3 + 1;
    start = `${y}-${pad(qm)}-01`;
    prevStart = qm === 1 ? `${y - 1}-10-01` : `${y}-${pad(qm - 3)}-01`;
  } else {               // 'half': the last six months against the six before — both inside the twelve months the bookmark reads
    start = toYmd(at(today) - 182 * dayMs);
    prevStart = toYmd(at(start) - 183 * dayMs);
  }
  const span = Math.round((at(today) - at(start)) / dayMs);
  const prevEnd = toYmd(at(prevStart) + span * dayMs);
  const lastCap = kind === 'quarter' ? toYmd(at(start) - dayMs) : toYmd(at(start) - dayMs);
  return { kind, day: span + 1, this: { from: start, to: today }, last: { from: prevStart, to: prevEnd < lastCap ? prevEnd : lastCap } };
}

/** Two things a leader looks for first: who needs a look, and who clearly improved — with the reasons. */
export function teamAlerts(below) {
  const rows = below.filter((r) => r.this.assigned >= 5 || r.this.done >= 5);
  if (!rows.length) return { attention: null, improved: null };
  const meds = rows.map((r) => r.this.medianHours).filter((v) => v != null).sort((a, b) => a - b);
  const teamMed = meds.length ? meds[Math.floor(meds.length / 2)] : null;
  const opens = rows.map((r) => r.this.open);
  const maxOpen = Math.max(...opens);
  let attention = null;
  for (const r of rows) {
    const why = [];
    if (r.this.rate != null && r.this.rate < 0.85) why.push({ k: 'rate', v: r.this.rate });
    if (r.this.open >= 8 && r.this.open === maxOpen) why.push({ k: 'open', v: r.this.open });
    if (teamMed && r.this.medianHours != null && r.this.medianHours > 2 * teamMed) why.push({ k: 'median', v: r.this.medianHours });
    const score = why.length + (why.some((w) => w.k === 'rate') ? 1 : 0);
    if (why.length && (!attention || score > attention.score)) attention = { id: r.id, why, score };
  }
  let improved = null;
  for (const r of rows) { const d = r.this.done - r.last.done; if (d >= 3 && (!improved || d > improved.delta)) improved = { id: r.id, delta: d }; }
  return { attention, improved };
}

/** Who the hand-over lets this person see: assignees in the data, the default team, and the people below them. */
export function scopeOf(me, roster = null) {
  const visible = [...new Set(me.tasks.filter((x) => x.assigneeId).map((x) => x.assigneeId))];
  const others = visible.filter((id) => id !== me.user.id);
  const applies = scopeApplies(roster, visible);
  const def = (applies ? scopeIds(roster) : defaultTeam(me.people, me.tasks)).filter((id) => visible.includes(id));
  const team = def.length > 1 ? def : (applies ? visible.filter((id) => inScope(roster, id)) : visible);
  const byMyafaqy = me.people.filter((p) => p.below && visible.includes(p.id)).map((p) => p.id);
  const byRoster = descendantsOf(roster, me.user.id).filter((id) => visible.includes(id) && id !== me.user.id);
  const below = [...new Set([...byMyafaqy, ...byRoster])].filter((id) => !applies || inScope(roster, id));
  return { visible, others, team, below };
}

/** The person's month against last month, the team average (no names) and the rows of the people below them. */
export function profileMonths(me, now = new Date(), roster = null, kind = 'month') {
  const w = periodWindows(kind, now);
  const zero = { assigned: 0, done: 0, rate: null, medianHours: null, open: 0, selfLogged: 0, fromEmail: 0 };
  const row = (range, id) => factor1(me.tasks, { range, team: [id] }).people[0] || { ...zero, id };
  const sc = scopeOf(me, roster);
  const mine = { this: row(w.this, me.user.id), last: row(w.last, me.user.id) };
  let average = null;
  if (sc.team.filter((id) => id !== me.user.id).length) {
    const rows = factor1(me.tasks, { range: w.this, team: sc.team }).people.filter((r) => r.assigned || r.done);
    if (rows.length > 1) {
      const mean = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0) / rows.length;
      const rates = rows.map((r) => r.rate).filter((v) => v != null);
      const meds = rows.map((r) => r.medianHours).filter((v) => v != null).sort((a, b) => a - b);
      average = { n: rows.length, assigned: mean('assigned'), done: mean('done'), selfLogged: mean('selfLogged'), fromEmail: mean('fromEmail'),
        rate: rates.length ? rates.reduce((s, v) => s + v, 0) / rates.length : null,
        medianHours: meds.length ? (meds.length % 2 ? meds[(meds.length - 1) / 2] : (meds[meds.length / 2 - 1] + meds[meds.length / 2]) / 2) : null };
    }
  }
  const below = sc.below.map((id) => ({ id, this: row(w.this, id), last: row(w.last, id) }))
    .sort((a, b) => b.this.done - a.this.done || b.this.assigned - a.this.assigned);
  const doneThis = me.tasks.filter((x) => x.assigneeId === me.user.id && x.state === 'done' && x.completedAt && saudiDay(x.completedAt) >= w.this.from && saudiDay(x.completedAt) <= w.this.to);
  const sources = { email: doneThis.filter((x) => x.fromEmail).length, self: doneThis.filter((x) => !x.fromEmail && x.own === true).length };
  sources.other = doneThis.length - sources.email - sources.self;
  return { windows: w, scope: sc, mine, average, below, sources };
}

/** The profile: Factor 1 for this one person, per quarter, newest first, over what the bookmark read. */
export function myProfile(me, now = new Date()) {
  const quarters = periodBlocks(3, 5, now);
  const since = me.since ? saudiDay(me.since) : null;
  return quarters.filter((q) => !since || q.to >= since).map((q) => {
    const range = { from: since && q.from < since ? since : q.from, to: q.to };
    const f = factor1(me.tasks, { range, team: [me.user.id] });
    return { ...q, range, partial: q.partial || (since && q.from < since), row: f.people[0] || null };
  });
}

// ===================== sample data (clearly marked) =====================
/** A deterministic v2 sample so the dashboard can be seen before the first real pull. Marked sample:true. */
export function sampleDataset(range, seed = 7) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const people = [['901', 'Engineer A', 'مهندس أ'], ['902', 'Engineer B', 'مهندس ب'], ['903', 'Engineer C', 'مهندس ج'], ['904', 'Engineer D', 'مهندس د'], ['905', 'Engineer E', 'مهندس هـ']];
  const from = Date.parse(`${range.from}T00:00:00${TZ_OFFSET}`), to = Date.parse(`${range.to}T23:59:00${TZ_OFFSET}`);
  const tasks = [];
  const n = 60 + Math.floor(rnd() * 40);
  for (let i = 0; i < n; i++) {
    const p = people[Math.floor(rnd() * people.length)];
    const created = from + rnd() * (to - from);
    const roll = rnd();
    const state = roll < 0.72 ? 'done' : roll < 0.8 ? 'cancelled' : 'open';
    const done = state === 'done' ? new Date(Math.min(created + (2 + rnd() * rnd() * 160) * 3600000, to)).toISOString() : null;
    const email = rnd() < 0.45;
    tasks.push({
      id: `S${range.from}-${i}`, title: 'مهمة تجريبية', typeId: email ? 62 : 16, type: email ? 'Email Customer Activity' : 'Prepare the visit',
      statusId: state === 'done' ? 3 : 2, state, createdAt: new Date(created).toISOString(),
      createdById: email ? '681' : people[Math.floor(rnd() * people.length)][0], assigneeId: p[0],
      completedAt: done, moduleId: email ? EMAIL_MODULE : 179, customer: null, bucket: state === 'open' ? 'open' : 'done',
    });
  }
  const doneIn = tasks.filter((x) => x.state === 'done').length;
  return { schema: SCHEMA, range, extractedAt: new Date().toISOString(), taskGroupId: 100001, sample: true,
    source: { endpoint: 'sample', doneInRangeTotal: doneIn, openTotal: tasks.filter((x) => x.state === 'open').length, pageSize: 20 },
    people: people.map(([id, en, ar]) => ({ id, nameEn: en, nameAr: ar, teams: ['Aftersales Jeddah'], branchCode: JEDDAH_BRANCH })),
    tasks, notes: [] };
}

// ===================== the hierarchy MyAFAQY holds (ADR-0060) =====================
// The employee list in a pull names each employee's manager. The employee ID No. is not the user id the tasks carry, so employees are
// tied to the portal's people by NAME. Only eight non-personal fields are ever kept — never a phone number or an identity number.
const orgNorm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
export function parseEmployees(rows) {
  if (!Array.isArray(rows)) return [];
  const seen = new Set(), out = [];
  for (const e of rows.slice(0, 3000)) {
    if (!e || typeof e !== 'object') continue;
    const nameEn = String(e.nameEn || '').trim().slice(0, 120), nameAr = String(e.nameAr || '').trim().slice(0, 120);
    if (!nameEn && !nameAr) continue;
    const key = orgNorm(nameEn) || orgNorm(nameAr); if (seen.has(key)) continue; seen.add(key);
    out.push({ id: e.id == null ? null : String(e.id).slice(0, 20), nameEn, nameAr, department: String(e.department || '').slice(0, 80), manager: String(e.manager || '').trim().slice(0, 120),
      branch: String(e.branch || '').slice(0, 60), branchCode: e.branchCode == null ? '' : String(e.branchCode).slice(0, 12), status: String(e.status || '').slice(0, 24) });
  }
  return out;
}
export function buildOrg(employees, people) {
  const emps = Array.isArray(employees) ? employees : [], none = '\u0000';
  const pidByEn = new Map(), pidByAr = new Map(), keyOfPid = new Map();
  for (const p of people || []) { const id = String(p.id), en = orgNorm(p.nameEn), ar = orgNorm(p.nameAr);
    if (en && !pidByEn.has(en)) pidByEn.set(en, id); if (ar && !pidByAr.has(ar)) pidByAr.set(ar, id); keyOfPid.set(id, en || ar); }
  // «On Leave» is someone still on the team: he keeps his place under his manager. Only a status that is neither empty,
  // «Active» nor «On Leave» takes a person out — calling a man on leave «inactive» invited removing him from accounts.
  const isLeave = (s) => /^on[\s-]*leave$/i.test(String(s || '').trim());
  const isActive = (s) => !String(s || '').trim() || /^active$/i.test(String(s).trim()) || isLeave(s);
  const nodes = new Map();
  for (const e of emps) { const key = orgNorm(e.nameEn) || orgNorm(e.nameAr); if (!key || nodes.has(key)) continue;
    nodes.set(key, { key, pid: pidByEn.get(orgNorm(e.nameEn)) ?? pidByAr.get(orgNorm(e.nameAr)) ?? null, e, mgrKey: orgNorm(e.manager) || null, active: isActive(e.status), leave: isLeave(e.status) }); }
  const kids = new Map();
  for (const n of nodes.values()) if (n.mgrKey && n.mgrKey !== n.key) { if (!kids.has(n.mgrKey)) kids.set(n.mgrKey, []); kids.get(n.mgrKey).push(n); }
  const activeKids = (key) => (kids.get(key) || []).filter((n) => n.active);
  const under = (pid) => { const root = keyOfPid.get(String(pid)); if (!root) return []; const out = [], seen = new Set([root]), q = [root];
    while (q.length) { const k = q.shift(); for (const n of activeKids(k)) { if (seen.has(n.key)) continue; seen.add(n.key); out.push(n); q.push(n.key); } } return out; };
  const rowOf = (pid) => nodes.get(keyOfPid.get(String(pid)) || none);
  const nameOfNode = (n) => n.e.nameEn || n.e.nameAr;
  return {
    size: nodes.size, under, hasRow: (pid) => !!rowOf(pid), branchOf: (pid) => { const n = rowOf(pid); return n && n.e.branchCode ? { code: String(n.e.branchCode), name: n.e.branch || '' } : null; }, isActive: (pid) => { const n = rowOf(pid); return n ? n.active : null; }, isOnLeave: (pid) => { const n = rowOf(pid); return !!(n && n.leave); }, statusOf: (pid) => { const n = rowOf(pid); return n ? String(n.e.status || '').trim() : ''; }, isManager: (pid) => activeKids(keyOfPid.get(String(pid)) || none).length > 0,
    managerOf: (pid) => { const n = rowOf(pid); if (!n || !n.mgrKey) return null; const m = nodes.get(n.mgrKey); return { pid: pidByEn.get(n.mgrKey) ?? (m ? m.pid : null), name: m ? nameOfNode(m) : String(n.e.manager || '') }; },
    engineersOf: (pid) => under(pid).filter((n) => n.pid != null && !activeKids(n.key).length).map((n) => n.pid),
    managers: () => (people || []).map((p) => String(p.id)).filter((id) => activeKids(keyOfPid.get(id) || none).length > 0).map((pid) => ({ pid, n: under(pid).length })).sort((a, b) => b.n - a.n),
    unmatched: () => [...nodes.values()].filter((n) => n.active && n.pid == null).map(nameOfNode),
    unmatchedUnder: (pid) => under(pid).filter((n) => n.pid == null).map(nameOfNode),
  };
}
/** What differs between MyAFAQY's hierarchy and the team file, for the team under `rootPid`. Nothing changes by itself. */
export function compareOrg(org, roster, rootPid) {
  const ro = (roster && roster.people) || {}, out = { leader: [], missingInFile: [], notInOrg: [], inactive: [], onLeave: [], unmatched: org.unmatchedUnder(rootPid) };
  for (const [id, r] of Object.entries(ro)) {
    if (!r || !(r.leaderId || r.position)) continue;
    if (!org.hasRow(id)) { out.notInOrg.push(id); continue; }
    if (org.isActive(id) === false) out.inactive.push(id);
    if (org.isOnLeave(id) && !r.onLeave) out.onLeave.push(id);
    if (!r.leaderId) continue;
    const m = org.managerOf(id); if (!m || String(m.pid) !== String(r.leaderId)) out.leader.push({ id, file: String(r.leaderId), orgPid: m ? m.pid : null, orgName: m ? m.name : '' });
  }
  for (const id of org.engineersOf(rootPid)) if (!ro[id]) out.missingInFile.push(id);
  return out;
}

// ===================== the sync extension (ADR-0062) =====================
// The extension carries the same pull body as the bookmark, as a fixed file that runs inside myafaqy.com. It receives only DATA (the
// recipe) and never text code, so it works under any page policy. Regenerate extension/pull.js with scripts/build-extension.mjs.
export const EXT_RUN = 'afaqy-ext-run';
export function extensionPullScript() {
  return `// Generated from core.js by scripts/build-extension.mjs — do not edit. The same pull the bookmark runs (ADR-0062).
(() => {
  if (document.documentElement.dataset.afaqyPull) return;
  document.documentElement.dataset.afaqyPull = '1';
  const RUN = async (R) => { const {${MANAGER_PULL_KEYS.join(',')}} = R;${MANAGER_PULL_BODY.replace(/\n/g, '')}
  };
  window.addEventListener('message', (e) => {
    if (e.source !== window || e.origin !== location.origin || !e.data || e.data.type !== '${EXT_RUN}' || !e.data.recipe || e.data.recipe.DEL !== 'ext') return;
    RUN(e.data.recipe).catch((err) => window.postMessage({ type: 'afaqy-ext-failed', message: String((err && err.message) || err).slice(0, 200) }, location.origin));
  });
  window.postMessage({ type: 'afaqy-ext-pull-ready' }, location.origin);
})();
`;
}

// ===================== overtime estimated from task times (ADR-0063) =====================
// MyAFAQY records no working hours, so this is an estimate from what it does record: when a task was created, by whom, and when it was
// closed. Times are Saudi (UTC+3, no daylight saving). Saturday: from the first task the person worked on to the last task he closed.
// Sunday–Thursday: only what happens between 19:00 and midnight. Friday is not counted.
const OT_SA = 3 * 3600e3;
const otDate = (ms) => new Date(ms + OT_SA).toISOString().slice(0, 10);
const otMin = (ms) => { const d = new Date(ms + OT_SA); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
const otDow = (ms) => new Date(ms + OT_SA).getUTCDay();
export function overtimeOf(tasks, { from = '0000-00-00', to = '9999-12-31', people = null, evening = 'span', eveStart = 19 } = {}) {
  const groups = new Map();
  const add = (pid, ms, what, t) => {
    if (!pid || !Number.isFinite(ms) || (people && !people.has(String(pid)))) return;
    const date = otDate(ms); if (date < from || date > to) return;
    const dow = otDow(ms), kind = dow === 6 ? 'sat' : dow <= 4 && otMin(ms) >= eveStart * 60 ? 'eve' : null;
    if (!kind) return;
    const k = `${pid}|${date}`; if (!groups.has(k)) groups.set(k, { pid: String(pid), date, kind, items: [] });
    groups.get(k).items.push({ at: ms, what, id: String(t.id), title: String(t.title || '') });
  };
  for (const t of tasks || []) {
    const c = Date.parse(t.createdAt || ''), d = Date.parse(t.completedAt || '');
    if (t.state === 'done' && Number.isFinite(d)) {
      add(t.assigneeId, d, 'closed', t);
      if (Number.isFinite(c) && c <= d && otDate(c) === otDate(d)) add(t.assigneeId, c, 'started', t);   // created the same day he closed it: work on it began then
    }
    if (t.createdById && Number.isFinite(c)) add(t.createdById, c, 'created', t);
  }
  const rows = [...groups.values()].map((g) => {
    g.items.sort((a, b) => a.at - b.at);
    const closes = g.items.filter((x) => x.what === 'closed'), first = g.items[0], last = closes.length ? closes[closes.length - 1] : g.items[g.items.length - 1];
    const start = g.kind === 'eve' && evening === 'from' ? Date.parse(`${g.date}T${String(eveStart).padStart(2, '0')}:00:00+03:00`) : first.at;
    const end = Math.max(last.at, start);
    const batch = closes.length >= 3 && closes[closes.length - 1].at - closes[0].at <= 15 * 60e3;   // three or more closed within 15 minutes: the real work was longer than it shows
    const ids = [...new Set(g.items.map((x) => x.id))];
    return { pid: g.pid, date: g.date, kind: g.kind, start, end, hours: Math.round(((end - start) / 3600e3) * 100) / 100, first, last, tasks: ids.length, ids, batch };
  }).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.pid < b.pid ? -1 : 1));
  const byPerson = new Map();
  for (const r of rows) { if (!byPerson.has(r.pid)) byPerson.set(r.pid, { pid: r.pid, satDays: 0, satHours: 0, eveDays: 0, eveHours: 0, total: 0, batchDays: 0 });
    const s = byPerson.get(r.pid); if (r.batch) s.batchDays++; if (r.kind === 'sat') { s.satDays++; s.satHours += r.hours; } else { s.eveDays++; s.eveHours += r.hours; } s.total += r.hours; }
  for (const s of byPerson.values()) for (const k of ['satHours', 'eveHours', 'total']) s[k] = Math.round(s[k] * 100) / 100;
  return { rows, people: [...byPerson.values()].sort((a, b) => b.total - a.total) };
}

// ADR-0066's type-based split (Manual Task / Email Customer Activity) was replaced by ADR-0067: one source definition, in factor1.

// ---------- ADR-0071 / ADR-0072: the team planner — shown exactly as the manager uploads it ----------
// The manager uploads the structure file of his own part; it is shown as it is. Only its plans are read, for the line above it.
function jsonSpanAt(text, from) {
  const a = text.indexOf('{', from); if (a < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = a; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true; else if (c === '{') depth++; else if (c === '}' && --depth === 0) return [a, i + 1];
  }
  return null;
}

const plMembers = (p) => ((p && p.data && p.data.members) || []);
function plannerSeed(html) {
  const seedAt = String(html || '').indexOf('window.__SEED='); if (seedAt < 0) return null;
  const sp = jsonSpanAt(html, seedAt); if (!sp) return null;
  let seed; try { seed = JSON.parse(html.slice(sp[0], sp[1])); } catch { return null; }
  const plans = Array.isArray(seed.plans) ? seed.plans : []; return plans.length ? { seed, sp, plans } : null;
}
/** What a planner file holds, for the line above it: its plans and how many people. null when it is not one (it still shows). */
export function plannerSummary(html) {
  const S = plannerSeed(html); if (!S) return null;
  const who = new Set(S.plans.flatMap(plMembers).map((m) => String(((m && m.info) || {}).email || (m && m.name) || '').trim().toLowerCase()).filter(Boolean));
  return { plans: S.plans.map((p) => ({ name: p.name || '', people: plMembers(p).length })), people: who.size };
}

/** ADR-0075: one key per e-mail, not per copy — the global Message-ID when there is one, else who sent it, when and the subject. A message
 *  kept in two folders of a PST is two items (two node ids) but one e-mail, and counts once. */
export function mailKey(m) {
  const id = String((m && m.internetMessageId) || '').trim().toLowerCase();
  if (id) return `mid:${id}`;
  const when = m && (m.clientSubmitTime || m.messageDeliveryTime); const iso = when ? new Date(when).toISOString() : '';
  return `alt:${String((m && (m.senderEmailAddress || m.senderName)) || '').trim().toLowerCase()}|${iso}|${String((m && m.subject) || '').trim().toLowerCase()}`;
}

// ---------- ADR-0095: «Email Activity — Manager Inbox» — the extractor's file, merged, matched and counted ----------
export const MA_SCHEMA = 'afaqy-mail-activity/v1';
const MA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
/** Read an extractor file (JSON lines: a header, then one record per message). Bad lines are counted, never guessed. */
export function maParse(text) {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim());
  let head = null; try { head = JSON.parse(lines[0] || ''); } catch { head = null; }
  if (!head || head.schema !== MA_SCHEMA) return { error: 'ma_bad_schema' };
  const recs = []; let bad = 0;
  for (const l of lines.slice(1)) {
    let r; try { r = JSON.parse(l); } catch { bad++; continue; }
    const t = r.rt || r.st;
    if (!r || typeof r.k !== 'string' || !r.k || typeof r.fe !== 'string' || !MA_ISO.test(t || '')) { bad++; continue; }
    recs.push({ k: r.k, fb: !!r.fb, fe: r.fe.toLowerCase(), fn: String(r.fn || ''), s: String(r.s || ''), st: r.st || null, rt: r.rt || null, f: String(r.f || ''), to: +r.to || 0, cc: +r.cc || 0, rd: Array.isArray(r.rd) ? r.rd.slice(0, 20) : [] });
  }
  return { head, recs, bad };
}
/** Merge an import. A message is its key: importing the same period again replaces, never adds. The import keeps its
 *  source file, period and dates for audit; re-importing the same source and period replaces that import's entry. */
export function maMerge(state, head, recs, importedAt) {
  const st = { imports: [...((state && state.imports) || [])], recs: [...((state && state.recs) || [])] };
  const id = `${head.source || '?'}|${head.from || ''}|${head.to || ''}`;
  const prev = st.imports.findIndex((x) => x.id === id), entry = { id, source: head.source || '', bytes: head.source_bytes || null, from: head.from || null, to: head.to || null, scope: head.scope || '', extractedAt: head.extracted_at || null, importedAt, helper: head.helper || '', counts: head.counts || {}, n: recs.length };
  if (prev >= 0) st.imports[prev] = entry; else st.imports.push(entry);
  const byK = new Map(st.recs.map((r) => [r.k, r])); let added = 0, replaced = 0; const links = [];
  for (const r of recs) { const old = byK.get(r.k); if (old) { replaced++; if (old.fe && r.fe && old.fe !== r.fe) links.push([old.fe, r.fe]); } else added++; byK.set(r.k, { ...(old || {}), ...r, i: id, b: r.b || (old && old.b) || '' }); }
  st.recs = [...byK.values()];
  return { state: st, added, replaced, again: prev >= 0, links };   // links: one sender, two addresses (the same message proves it)
}
/** The Saudi day a message arrived (received time; sent time when there is none). */
export const maDay = (r) => saudiDay(r.rt || r.st);
/** Do the imports' periods cover every day of [from, to]? */
export function maCovers(imports, from, to) {
  const rs = (imports || []).filter((x) => x.from && x.to).map((x) => [x.from, x.to]).sort((p, q) => (p[0] < q[0] ? -1 : 1));
  let reach = from;
  for (const [a, b] of rs) { if (a > reach) break; if (b >= reach) { const n = new Date(`${b}T00:00:00Z`); n.setUTCDate(n.getUTCDate() + 1); reach = n.toISOString().slice(0, 10); } if (reach > to) return true; }
  return reach > to;
}
/** Count per engineer in [from, to]. Only confirmed addresses count (ids: address → employee id); an address with no
 *  confirmed engineer is «unmatched» and never counted; display names never decide. classify(subject) → category key. */
export function maStats(recs, ids, classify, from, to) {
  const per = new Map(), unmatched = new Map(); let total = 0, fallback = 0;
  for (const r of recs || []) {
    const d = maDay(r); if (!d || d < from || d > to) continue;
    total++; if (r.fb) fallback++;
    const id = r.fe && ids[r.fe];
    if (!id) { const u = unmatched.get(r.fe || `name:${r.fn}`) || { addr: r.fe, name: r.fn, n: 0 }; u.n++; unmatched.set(r.fe || `name:${r.fn}`, u); continue; }
    const p = per.get(id) || { id, total: 0, cats: {}, recs: [] }; const c = maCategory(r, classify);   // ADR-0099: the sender's own words
    p.total++; p.cats[c] = (p.cats[c] || 0) + 1; p.recs.push(r); per.set(id, p);
  }
  return { per, unmatched: [...unmatched.values()].sort((p, q) => q.n - p.n), total, fallback };
}
/** Suggest engineers for an address — a suggestion only; nothing counts until the manager confirms it. */
export function maSuggest(addr, name, people) {
  const tok = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ').filter((w) => w.length > 1);
  const local = tok(String(addr || '').split('@')[0].replace(/^ex:/, '').replace(/[._-]+/g, ' ')), nm = tok(name), want = new Set([...local, ...nm]);
  return (people || []).map((p) => { const ws = new Set([...tok(p.nameEn), ...tok(p.nameAr)]); let hit = 0; for (const w of want) if (ws.has(w)) hit++; return { id: p.id, score: hit }; })
    .filter((x) => x.score > 0).sort((p, q) => q.score - p.score).slice(0, 3);
}
/** ADR-0099: the sender's own words — the top of the body, before the quoted earlier messages. */
export function maOwnText(body) {
  const s = String(body || '').replace(/\r\n?/g, '\n');
  const cut = s.search(/^\s*(-{2,}\s*original message\s*-{2,}|_{8,}|from\s*:|de\s*:|von\s*:|من\s*:|المرسل\s*:|on .{4,120} wrote:|في .{4,120} كتب:)/im);
  return (cut >= 0 ? s.slice(0, cut) : s).replace(/\s+/g, ' ').trim().slice(0, 400);
}
export const maIsReply = (subject) => /^\s*((re|fw|fwd|رد|إعادة توجيه|تحويل)\s*:\s*)/i.test(String(subject || ''));
/** Classify by what the sender wrote: his own words first; a reply that matches no rule does not inherit its thread's subject;
 *  an original message (or one with no body read) falls back to the subject. classify(text) → a rule key or 'other'. */
export function maCategory(rec, classify) {
  if (rec && rec.b) { const c = classify(rec.b); if (c !== 'other') return c; if (maIsReply(rec.s)) return 'other'; }
  return classify(rec ? rec.s : '');
}

// ===================== monthly readings — the measurement basis of the Jeddah proposal (ADR-0111) =====================
/** The team the readings are measured on, as MyAFAQY names it. */
export const READINGS_TEAM = /jeddah\s+after\s*-?\s*sales\s+team/i;
/** Points of the four effort tiers (ADR-0111): the tier comes from the Weights page, the points from here. */
export const TIER_POINTS = { admin: 1, customer: 2, integration: 3, multistage: 5 };
/** Each MyAFAQY task type valued at its nearest item in Dammam's proposal (catalogue id of v2, or the task type of v1), with its points. */
export const DAMMAM_MAP = {
  'email customer activity': ['v1 Email-Integrated Task', 5], 'manual task': ['v1 Manual Task', 3], 'manual task - after sales': ['v1 Manual Task', 3], 'others': ['v1 Manual Task', 3],
  'wasl link': ['GI-01', 6], 'wasl inquiry': ['GI-03', 5], 'madinty link': ['GI-08 (nearest)', 6], 'rafed link': ['GI-08 (nearest)', 6], 'naqaba link': ['GI-08 (nearest)', 6],
  'st without tech visit': ['AA-03', 10], 'st with tech visit': ['AA-03', 10], 'mt request': ['IS-06', 12], 'account credentials': ['CS-02', 2], 'view units': ['CS-08', 3],
  'client units list': ['CS-04', 4], 'client inquiry': ['CS-15', 4], 'training request': ['CS-10', 15], 'tsu request': ['v1 TSU', 20], 'vss account creation': ['CS-01 (nearest)', 3],
  'cameras checking': ['IS-11', 12], 'active': ['AA-01', 5], 'inactive': ['AA-01', 5], 'mobile app issue': ['IS-01', 8],
};
const rdMedian = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), h = Math.floor(s.length / 2); return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const rdShare = (n, d) => (d ? n / d : null);
/**
 * The readings of one month for the after-sales team as MyAFAQY lists it — the same definitions as the proposal's workbook:
 * tasks created in the month (Saudi time) and assigned to the team; origin = e-mail (mail module), self (creator = assignee) or others;
 * time = creation to closure in clock hours; points = effort tier of the type; Dammam-equivalent = nearest Dammam item of the type.
 * `to` = the last day the pulls cover in that month (working days and «open at the end» are counted to it).
 */
export function monthReadings(tasks, people, weights, { month, to, target = 60, cap = 1.1, backlogPenalty = 25, scoreWeights = { output: 30, timeliness: 25, backlog: 10 } } = {}) {
  const team = (people || []).filter((p) => (p.teams || []).some((x) => READINGS_TEAM.test(x)) && !/\bsystem\b|مستخدم النظام/i.test(`${p.nameEn || ''} ${p.nameAr || ''}`));
  const ids = new Set(team.map((p) => p.id));
  const from = `${month}-01`; const end = to && to.slice(0, 7) === month ? to : (() => { const d = new Date(Date.parse(`${month}-01T00:00:00Z`)); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return d.toISOString().slice(0, 10); })();
  const endMs = Date.parse(`${end}T23:59:59+03:00`);
  let workingDays = 0; for (let d = new Date(Date.parse(`${from}T00:00:00Z`)); d.toISOString().slice(0, 10) <= end; d.setUTCDate(d.getUTCDate() + 1)) if ([0, 1, 2, 3, 4].includes(d.getUTCDay())) workingDays++;
  const mine = (tasks || []).filter((x) => ids.has(x.assigneeId));
  const inMonth = mine.filter((x) => x.createdAt && saudiDay(x.createdAt).slice(0, 7) === month);
  const origin = (x) => (x.fromEmail === true ? 'email' : (x.createdById && x.createdById === x.assigneeId ? 'self' : 'others'));
  const hours = (x) => (Date.parse(x.completedAt) - Date.parse(x.createdAt)) / 36e5;
  const closed = inMonth.filter((x) => x.completedAt);
  const W = (weights && weights.tasks) || {};
  const tierOf = (k) => (W[k] && TIER_POINTS[W[k].tier] ? W[k].tier : 'admin');
  const dist = (xs) => { const h = xs.map(hours); const le = (lim) => h.filter((v) => v <= lim).length; return { n: h.length, median: rdMedian(h), le5m: le(5 / 60), le8h: le(8), le24h: le(24), gt7d: h.filter((v) => v > 168).length }; };
  // types
  const byType = new Map();
  for (const x of inMonth) { const k = typeKey(x.type); if (!byType.has(k)) byType.set(k, { key: k, label: String(x.type || '').split('|').map((s) => s.trim()).find((s) => /[a-z]/i.test(s)) || x.type || k, rows: [] }); byType.get(k).rows.push(x); }
  const types = [...byType.values()].map((g) => { const cl = g.rows.filter((x) => x.completedAt), d = dist(cl), tier = tierOf(g.key), dm = DAMMAM_MAP[g.key] || null;
    return { key: g.key, label: g.label, arrived: g.rows.length, closed: cl.length, share: rdShare(g.rows.length, inMonth.length), median: d.median, le8h: d.le8h, le8hShare: rdShare(d.le8h, cl.length),
      tier, tierNo: TIERS.indexOf(tier) + 1, points: TIER_POINTS[tier], weighted: !!W[g.key], dammamItem: dm ? dm[0] : null, dammamPoints: dm ? dm[1] : 0 }; }).sort((a, b) => b.arrived - a.arrived || a.key.localeCompare(b.key));
  const tp = new Map(types.map((x) => [x.key, x]));
  const generic = types.filter((x) => x.key === 'email customer activity' || x.key === 'manual task').reduce((s, x) => s + x.arrived, 0);
  // members
  const members = team.map((p) => { const s = inMonth.filter((x) => x.assigneeId === p.id), cl = s.filter((x) => x.completedAt), sys = cl.filter((x) => origin(x) !== 'self');
    const open = mine.filter((x) => x.assigneeId === p.id && x.createdAt && Date.parse(x.createdAt) <= endMs && (!x.completedAt || Date.parse(x.completedAt) > endMs));
    const o = { email: 0, self: 0, others: 0 }; for (const x of s) o[origin(x)]++;
    const pts = cl.reduce((a, x) => a + tp.get(typeKey(x.type)).points, 0), dpts = cl.reduce((a, x) => a + tp.get(typeKey(x.type)).dammamPoints, 0);
    return { id: p.id, arrived: s.length, closed: cl.length, email: o.email, self: o.self, others: o.others, points: pts, pointsPerDay: workingDays ? pts / workingDays : null,
      dammamPoints: dpts, dammamPerDay: workingDays ? dpts / workingDays : null, sysClosed: sys.length, sysLe8h: sys.filter((x) => hours(x) <= 8).length,
      sysLe8hShare: rdShare(sys.filter((x) => hours(x) <= 8).length, sys.length), open: open.length, openOver7: open.filter((x) => (endMs - Date.parse(x.createdAt)) / 864e5 > 7).length, median: rdMedian(cl.map(hours)) }; })
    .sort((a, b) => b.closed - a.closed || b.arrived - a.arrived || a.id.localeCompare(b.id)).map((m, i) => ({ ...m, no: i + 1 }));
  const baseTarget = rdMedian(members.map((m) => m.points));
  for (const m of members) { const out = baseTarget ? Math.min(m.points / baseTarget, cap) * 100 : 0, tim = (m.sysLe8hShare ?? 0) * 100, back = Math.max(0, 100 - backlogPenalty * m.openOver7);
    m.score = { output: out, timeliness: tim, backlog: back, auto: (out * scoreWeights.output + tim * scoreWeights.timeliness + back * scoreWeights.backlog) / 100 }; }
  const sum = (k) => members.reduce((a, m) => a + m[k], 0);
  const all = dist(closed), em = dist(closed.filter((x) => origin(x) === 'email')), se = dist(closed.filter((x) => origin(x) === 'self'));
  const perDay = members.map((m) => m.dammamPerDay).filter((v) => v != null), cl = members.map((m) => m.closed);
  return { month, from, to: end, workingDays, accounts: team.length, arrived: inMonth.length, closed: closed.length, closureRate: rdShare(closed.length, inMonth.length),
    genericShare: rdShare(generic, inMonth.length), generic, typeCount: types.length, email: sum('email'), self: sum('self'), others: sum('others'),
    medianAll: all.median, medianEmail: em.median, medianSelf: se.median, selfLe5m: se.le5m, selfClosed: se.n, selfLe5mShare: rdShare(se.le5m, se.n),
    emailClosed: em.n, emailLe8h: em.le8h, emailLe8hShare: rdShare(em.le8h, em.n), emailLe24hShare: rdShare(em.le24h, em.n), emailGt7dShare: rdShare(em.gt7d, em.n),
    sysClosed: sum('sysClosed'), sysLe8h: sum('sysLe8h'), sysLe8hShare: rdShare(sum('sysLe8h'), sum('sysClosed')),
    points: sum('points'), dammamPoints: sum('dammamPoints'), dammamMedianPerDay: rdMedian(perDay), dammamMaxPerDay: perDay.length ? Math.max(...perDay) : null, target,
    atTarget: perDay.filter((v) => v >= target).length, spread: cl.length && Math.min(...cl) > 0 ? Math.max(...cl) / Math.min(...cl) : null, open: sum('open'), openOver7: sum('openOver7'),
    baseTarget, autoPoints: scoreWeights.output + scoreWeights.timeliness + scoreWeights.backlog, scoreWeights, types, members };
}

// Tender mail is read as text, without rendering any message HTML.
export const tenderDigits = (value) => String(value || '').trim().replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) % 16));
const tenderDeadlineFields = {
  due: {
    pattern: /(?:اخر\s*(?:موعد|تاريخ)\s*)?(?:ل?تقديم|ل?تسليم)\s*(?:العروض|العرض|العطاءات)|موعد\s+(?:التقديم|التسليم)|^\s*(?:التقديم|تقديم)(?=\s|:|$)|\b(?:bid|proposal|tender)\s+(?:submission\s+)?deadline\b|\bsubmission\s+(?:deadline|date)\b|\b(?:deadline|due date)\s+for\s+(?:bid\s+)?submission\b/
  },
  askDue: {
    pattern: /(?:اخر\s*(?:موعد|تاريخ)\s*(?:ل(?:رفع|طرح|تقديم|ارسال|استقبال)\s*)?|موعد\s*)(?:ال|لل|ل)?(?:استفسارات|استيضاحات|اسئله)|^\s*(?:الاستفسارات|الاستيضاحات|الاسئله)(?=\s|:|$)|\b(?:inquiries|inquiry|enquiries|enquiry|clarifications?|questions?)\s+(?:deadline|due date)\b|\b(?:deadline|due date)\s+for\s+(?:inquiries|enquiries|clarifications?|questions?)\b/
  },
  // v9.47: the site visit and the bid opening are read the same way — a labelled line with a date; one clear date fills the field
  visit: {
    pattern: /(?:اخر\s*(?:موعد|تاريخ)\s*)?(?:ل|ال)?(?:زياره|معاينه)\s*(?:ال)?(?:موقع|مواقع|ميدانيه)|موعد\s+الزياره|\bsite\s+(?:visit|survey|inspection)(?:\s+(?:date|deadline))?\b/
  },
  openAt: {
    pattern: /(?:(?:تاريخ|موعد)\s*)?فتح\s*(?:العروض|المظاريف|العطاءات)|\b(?:bids?|tender|proposals?)\s+opening(?:\s+date)?\b|\bopening\s+of\s+(?:the\s+)?(?:bids|offers|proposals|envelopes)\b/
  }
};
export const TENDER_DATE_FIELDS = Object.keys(tenderDeadlineFields);
const tenderNoDates = () => Object.fromEntries(TENDER_DATE_FIELDS.map((k) => [k, []]));
export function tenderEmailSchedule(body, html) {
  // Keep table rows intact and strip markup without loading remote content.
  const htmlText = String(html || '').slice(0,300000)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'')
    .replace(/<\/tr\s*>|<br\s*\/?>|<\/(?:p|div|li)\s*>/gi,'\n')
    .replace(/<[^>]+>/g,' ')
    .replace(/&(?:nbsp|rlm|lrm);|&#(?:160|8206|8207);/gi,' ')
    .replace(/&#(\d+);|&#x([0-9a-f]+);/gi,(raw,decimal,hex) => {
      const code = decimal ? Number(decimal) : parseInt(hex,16);
      return code <= 0x10ffff ? String.fromCodePoint(code) : raw;
    });
  const months = ['يناير','فبراير','مارس','ابريل','مايو','يونيو','يوليو','اغسطس','سبتمبر','اكتوبر','نوفمبر','ديسمبر'];
  const pattern = new RegExp('\\b(?:(20\\d{2})[-/.](\\d{1,2})[-/.](\\d{1,2})|(\\d{1,2})[-/.](\\d{1,2})[-/.](20\\d{2}))\\b|(?<!\\d)(\\d{1,2})\\s+('+months.join('|')+')\\s+(20\\d{2})\\b','g');
  const result = tenderNoDates();
  const fields = Object.entries(tenderDeadlineFields);
  for (const text of [body,htmlText]) {
    const lines = tenderDigits(String(text || '').slice(0,180000)).normalize('NFKC')
      .replace(/[إأآ]/g,'ا').replace(/ة/g,'ه').replace(/[ـً-ْ\u200e\u200f\u202a-\u202e]/g,'')
      .toLowerCase().split(/\r?\n/);
    for (const [index,line] of lines.entries()) {
      const hits = fields.flatMap(([field,{pattern}]) =>
        [...line.matchAll(new RegExp(pattern.source,'g'))].map(match => ({field,match}))
      ).sort((a,b) => a.match.index - b.match.index);
      for (const [position,{field,match}] of hits.entries()) {
        let section = line.slice(match.index + match[0].length,hits[position+1]?.match.index);
        if (!position && ![...section.matchAll(pattern)].length) {
          const before = line.slice(0,match.index);
          if (/^\s*\d/.test(before) && [...before.matchAll(pattern)].length) section = before;
          else if (/^[\s:–-]*$/.test(section)) {
            const next = lines[index+1] || '';
            if (/^\s*(?:\d{1,2}[-/.]\d|20\d{2}[-/.]|\d{1,2}\s+\p{L})/u.test(next)) section = next;
          }
        }
        const dates = [...section.matchAll(pattern)];
        for (const [offset,date] of dates.entries()) {
          const [,isoYear,isoMonth,isoDay,day,month,year,namedDay,namedMonth,namedYear] = date;
          const value = [isoYear || year || namedYear,String(isoMonth || month || months.indexOf(namedMonth)+1).padStart(2,'0'),String(isoDay || day || namedDay).padStart(2,'0')].join('-');
          const parsed = new Date(value+'T00:00:00Z');
          if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0,10) !== value) continue;
          const tail = section.slice(date.index+date[0].length,dates[offset+1]?.index).replace(/^[مM](?=\s|$)/,'');
          const clock = tail.match(/^[\s(),،:|–-]*(?:الساعه\s*|at\s+)?(\d{1,2}):(\d{2})(?:\s*(am|pm|صباحا|مساء|ص|م)(?![\p{L}]))?/u);
          const hour = clock ? Number(clock[1]) : -1;
          const period = clock?.[3];
          const adjusted = period && hour <= 12 ? hour % 12 + (/^(pm|م)/.test(period) ? 12 : 0) : hour;
          const time = clock && adjusted >= 0 && adjusted < 24 && Number(clock[2]) < 60 ? String(adjusted).padStart(2,'0')+':'+clock[2] : '';
          if (!result[field].some(entry => entry.date === value && entry.time === time)) result[field].push({date:value,time});
        }
      }
    }
  }
  return result;
}
export function tenderDeadlineCandidates(item, field) {
  const entries = [
    ...(item.messages || []).flatMap(mail => (mail.schedule?.[field] || []).map(entry => ({...entry, source:{kind:'mail',id:mail.key || '',label:mail.subject || '',locator:''}}))),
    ...(item.files || []).flatMap(file => (file.analysis?.schedule?.[field] || []).map(entry => ({...entry, source:{kind:'file',id:file.id,label:file.name,locator:entry.locator || ''}})))
  ];
  const byDate = new Map();
  for (const entry of entries) {
    const key = entry.date+' '+entry.time;
    const candidate = byDate.get(key) || {date:entry.date,time:entry.time,sources:[]};
    candidate.sources.push(entry.source); byDate.set(key,candidate);
  }
  const unique = [...byDate.values()];
  // A date-only source supports an explicit time on the same day; it must remain visible as evidence.
  for (const candidate of unique) if (candidate.time) candidate.sources.push(...unique.filter(other => other.date === candidate.date && !other.time).flatMap(other => other.sources));
  return unique.filter(entry => entry.time || !unique.some(other => other.date === entry.date && other.time));
}
export function applyTenderEmailDates(item) {
  item = {...item,dateSources:{...item.dateSources}};
  for (const field of Object.keys(tenderDeadlineFields)) {
    if (item.dateSources[field] === 'manual' || (item[field] && !['mail','document','etimad'].includes(item.dateSources[field]))) continue;   // v9.62: the mail replaces a date only Etimad gave
    const candidates = tenderDeadlineCandidates(item,field);
    if (!candidates.length) {
      if (['mail','document'].includes(item.dateSources[field])) { item[field] = ''; item[field+'Time'] = ''; delete item.dateSources[field]; }
      continue;
    }
    item.dateSources[field] = candidates.some(candidate => candidate.sources.some(source => source.kind === 'mail')) ? 'mail' : 'document';
    item[field] = candidates.length === 1 ? candidates[0].date : '';
    item[field+'Time'] = candidates.length === 1 ? candidates[0].time : '';
  }
  return item;
}

/** v9.55: how old the only safe copy is. The register keeps its emails, booklets and offers on one device; the backup file is
 *  the only other copy. With nothing typed or attached there is nothing to lose and nothing is asked. `days` is null when no
 *  backup was ever saved from this device. A clock set wrong (a backup «in the future») counts as saved today. */
export function backupDue(lastIso, nowIso, { items = 0, every = 7 } = {}) {
  if (!(items > 0)) return { due: false, days: null };
  const last = Date.parse(lastIso || ''), now = Date.parse(nowIso);
  if (Number.isNaN(last) || Number.isNaN(now)) return { due: true, days: null };
  const days = Math.max(0, Math.floor((now - last) / 864e5));
  return { due: days >= every, days };
}
/** v9.55: what applyTenderEmailDates() decided, as the patch to save — every date field, not only the two the register began with.
 *  Until now the pages saved «due» and «askDue» by name, so a site visit or a bid opening read from an attached booklet was
 *  worked out and then dropped. */
export function tenderDatePatch(dated) {
  const patch = { dateSources: { ...(dated.dateSources || {}) } };
  for (const k of Object.keys(tenderDeadlineFields)) patch[k] = dated[k] || '';
  patch.dueTime = dated.due ? dated.dueTime || '' : ''; patch.askDueTime = dated.askDue ? dated.askDueTime || '' : '';
  return patch;
}
export const TENDER_FILE_KINDS = ['original', 'booklet', 'boq', 'sheet', 'other', 'study', 'technical', 'financial', 'offer', 'proof'];
export const TENDER_INSIGHT_TOPICS = ['scope','visit','duration','bond','evaluation','delivery','requirements'];
const tenderNormalizeText = text => tenderDigits(text).normalize('NFKC').replace(/[إأآ]/g,'ا').replace(/ة/g,'ه').replace(/[ـً-ْ\u200e\u200f\u202a-\u202e]/g,'').toLowerCase();
/** Evidence snippets, not an inferred bid decision: negations, quantities and wording remain intact. */
export function tenderDocumentInsights(segments) {
  const patterns = {
    scope: /نطاق (?:العمل|المشروع)|وصف (?:العمل|المشروع)|scope of (?:work|supply)|project (?:scope|description)/,
    visit: /زيار[هت] (?:الموقع|ميدانيه)|الزياره الميدانيه|site (?:visit|survey|inspection)/,
    duration: /مده (?:التنفيذ|العقد|المشروع)|فتره (?:التنفيذ|العقد)|(?:contract|project) (?:duration|period)|execution (?:period|duration)|delivery (?:period|time)/,
    bond: /ضمان (?:الابتدائي|النهائي|البنكي)|(?:bid|performance|bank) (?:bond|guarantee)|initial guarantee/,
    evaluation: /(?:معايير|اوزان|نسبه) التقييم|التقييم (?:الفني|المالي)|(?:technical|financial) (?:evaluation|weight)|evaluation criteria/,
    delivery: /(?:تشغيل|اختبار|استلام|تسليم|صيان[هت]|تدريب)|commissioning|acceptance|handover|maintenance|training/,
    requirements: /(?:يلتزم|يجب|اشتراط|متطلبات|شهادات)|\b(?:mandatory|shall|must|required|certification)\b/,
  };
  const highlights = [], schedule = tenderNoDates();
  const seen = new Set(); let kind = '', count = 0;
  for (const segment of (Array.isArray(segments) ? segments : []).slice(0,120)) {
    const text = String(segment.text || '').slice(0, Math.max(0,180000-count)); count += text.length;
    const norm = tenderNormalizeText(text), locator = String(segment.locator || '').slice(0,120);
    if (/كراسه الشروط|شروط ومواصفات|terms and conditions|tender specification/.test(norm)) kind ||= 'booklet';
    if ((/جدول (?:الكميات|البنود)|bill of quantities|\bboq\b/.test(norm)) || (/\b(?:qty|quantity)\b|الكميه/.test(norm) && /\b(?:item|description|unit)\b|وصف البند|وحده القياس/.test(norm))) kind = 'boq';
    const dates = tenderEmailSchedule(text);
    for (const field of TENDER_DATE_FIELDS) for (const date of dates[field]) schedule[field].push({...date,locator});
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    for (const [index,line] of lines.entries()) {
      const normalized = tenderNormalizeText(line);
      for (const [topic,pattern] of Object.entries(patterns)) {
        if (!pattern.test(normalized) || highlights.filter(entry => entry.topic === topic).length >= 3) continue;
        const match = normalized.match(pattern);
        const headingOnly = /^[\s:：-]*$/.test(normalized.slice(match.index+match[0].length));
        const snippet = (headingOnly && lines[index+1] ? line+'\n'+lines[index+1] : line).slice(0,700);
        const key = topic+' '+snippet;
        if (!seen.has(key)) { highlights.push({topic,text:snippet,locator}); seen.add(key); }
        break;
      }
    }
  }
  return {kind,highlights,schedule};
}
export function cleanTenderAnalysis(value) {
  if (!value || !['read','partial','empty','unsupported','large','error','locked'].includes(value.state)) return undefined;
  const str = (v,n) => typeof v === 'string' ? v.slice(0,n) : '';
  const list = v => Array.isArray(v) ? v : [];
  return {
    state:value.state, format:['pdf','docx','sheet','text'].includes(value.format) ? value.format : '', readAt:str(value.readAt,35),
    highlights:list(value.highlights).filter(h => h && TENDER_INSIGHT_TOPICS.includes(h.topic)).slice(0,21).map(h => ({topic:h.topic,text:str(h.text,700),locator:str(h.locator,120)})),
    schedule:Object.fromEntries(TENDER_DATE_FIELDS.map(field => [field,list(value.schedule?.[field]).filter(d => d && /^20\d{2}-\d{2}-\d{2}$/.test(d.date) && !Number.isNaN(Date.parse(d.date+'T00:00:00Z')) && new Date(d.date+'T00:00:00Z').toISOString().slice(0,10) === d.date).slice(0,100).map(d => ({date:d.date,time:/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(d.time) ? d.time : '',locator:str(d.locator,120)}))])),
    tables:list(value.tables).filter(table => table && Array.isArray(table.rows)).slice(0,5).map(table => ({name:str(table.name,120),rows:table.rows.slice(0,31).map(row => list(row).slice(0,16).map(cell => str(String(cell ?? ''),300)))})),
  };
}
// ===================== the Tender Analyzer's study file (ADR-0126) =====================
// The analyzer reads the whole booklet with Claude and writes `afaqy-tender-study/v1` beside its study. The register reads it and
// fills only what is empty; a value typed by hand, or read from the mail with a different value, is never replaced — it is listed
// as a difference to check. «Not found» and «as stated on Etimad» arrive as null and fill nothing.
export const TENDER_STUDY_FIELDS = ['etimadNo', 'fees', 'bond', 'value'];
/** v9.55: an amount as the register keeps it — a number, or nothing. An empty box, null and a missing value are all «nothing»;
 *  they must never turn into 0 (a tender worth 0 riyals is a value, and it hides the field from «still to fill»). A number
 *  written as text is read when it is only a number: digits, thousands commas, and the riyal's name around it. */
export function tenderAmount(v) {
  if (v === '' || v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : null;
  if (typeof v !== 'string') return null;
  const x = tenderDigits(v).replace(/\u066c/g, ',').replace(/\u066b/g, '.').replace(/(?:sar|sr|ريال(?:\s*سعودي)?|ر\.?\s*س\.?)/gi, '').replace(/\s+/g, '');
  if (!/^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/.test(x)) return null;
  return Math.round(Number(x.replace(/,/g, '')) * 100) / 100;
}
export function parseTenderStudy(raw) {
  let j = raw; if (typeof raw === 'string') { try { j = JSON.parse(raw); } catch { return { error: 'json' }; } }
  if (!j || j.schema !== 'afaqy-tender-study/v1' || !Array.isArray(j.tenders)) return { error: 'schema' };
  const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : ''), day = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v ? v : '');
  // «not found», written out in words, is the same as an empty value: it fills nothing and is not reported as unreadable
  const NONE = /^(?:[-–—.]+|n\/?a|none|null|nil|tbd|not\s+(?:found|stated|mentioned|specified|available|applicable)|غير\s+(?:مذكور[هة]?|محدد[هة]?|متوفر[هة]?|موجود[هة]?|متاح[هة]?)|لا\s+يوجد|لم\s+(?:يذكر|يحدد|ترد)|حسب\s.{0,40}اعتماد.{0,20})$/i;
  const time = (v) => (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')) ? v : ''), given = (v) => !(v === '' || v == null || (typeof v === 'string' && (!v.trim() || NONE.test(v.trim()))));
  // v9.55: a date may come as {date, time} or as plain text «2026-12-05» / «2026-12-05 14:30» — the same value, written the short way.
  // Anything else (a day-first date, words) is not guessed at: it is listed in `skipped` so the register can say what it left out.
  const when = (d) => {
    if (d && typeof d === 'object') return day(d.date) ? { date: day(d.date), time: time(d.time) } : null;
    const m = typeof d === 'string' ? d.trim().match(/^(\d{4}-\d{2}-\d{2})(?:[T\s]+(\d{2}:\d{2})(?::\d{2})?)?$/) : null;
    return m && day(m[1]) ? { date: m[1], time: time(m[2]) } : null;
  };
  const tenders = j.tenders.slice(0, 200).map((x) => {
    if (!x || typeof x !== 'object') return null;
    const evidence = {}; for (const [k, v] of Object.entries(x.evidence && typeof x.evidence === 'object' ? x.evidence : {})) if ([...TENDER_STUDY_FIELDS, ...TENDER_DATE_FIELDS].includes(k) && v && typeof v === 'object')
      evidence[k] = { file: str(v.file, 160), page: Number.isSafeInteger(v.page) && v.page > 0 ? v.page : null, quote: str(v.quote, 240) };
    const dates = {}, skipped = [], fixed = [];
    for (const k of TENDER_DATE_FIELDS) { const d = x.dates && x.dates[k]; if (!given(d) || (typeof d === 'object' && !given(d.date))) continue; const w = when(d); if (!w) { skipped.push(k); continue; }
      // v9.60 (ADR-0132): a date whose own quote is a Hijri date is converted here and compared; a wrong conversion is corrected
      // when the quote allows one reading, and left out when it allows several
      const hc = evidence[k] && evidence[k].quote ? hijriCheck(w.date, evidence[k].quote) : { ok: true };
      if (!hc.ok) { if (!hc.date) { skipped.push(k); continue; } fixed.push({ field: k, was: w.date, hijri: hc.hijri, now: hc.date }); w.date = hc.date; }
      dates[k] = w; }
    const money = (k) => { if (!given(x[k])) return null; const n = tenderAmount(x[k]); if (n == null) skipped.push(k); return n; };
    const no = String(x.etimadNo ?? '').replace(/[^\d]/g, '').slice(0, 40), fees = money('fees'), value = money('value');
    return { subject: str(x.subject, 300), etimadNo: no,
      entity: str(x.entity, 160), dates, fees, bond: str(typeof x.bond === 'number' ? String(x.bond) : x.bond, 120), value,
      decision: ['go', 'no-go', 'review'].includes(x.decision) ? x.decision : '', why: str(x.decisionWhy, 400), summary: str(x.summary, 4000), studyFile: str(x.studyFile, 300), evidence, skipped, fixed };
  }).filter((x) => x && (x.subject || x.etimadNo));
  return tenders.length ? { tenders, generatedAt: str(j.generatedAt, 35), tool: str(j.tool, 80) } : { error: 'empty' };
}
/** The register row a study belongs to: the same Etimad number first, then the same subject key (the key the register files
 *  tenders by). Several rows with that subject: none is chosen — the manager imports it from the tender's own window. */
export function matchTenderStudy(items, study, keyOf) {
  if (study.etimadNo) { const byNo = items.filter((i) => String(i.etimadNo || '').replace(/[^\d]/g, '') === study.etimadNo); if (byNo.length === 1) return byNo[0]; if (byNo.length > 1) return null; }
  const k = study.subject ? keyOf(study.subject) : ''; if (!k) return null;
  const bySubject = items.filter((i) => i.id === k || keyOf(i.subject) === k); return bySubject.length === 1 ? bySubject[0] : null;
}
/** What a study changes on a row: `patch` holds only empty fields it fills; `differs` lists fields that already hold another value. */
const TENDER_TIMED = ['due', 'askDue'];   // the two dates the register keeps an hour for; an hour written for the others was held until the next reload, then lost
export function applyTenderStudy(item, study, at = new Date().toISOString()) {
  const patch = {}, filled = [], differs = [], empty = (v) => v === '' || v == null;
  const fieldSources = { ...(item.fieldSources || {}) }, dateSources = { ...(item.dateSources || {}) }, evidence = { ...(item.evidence || {}) };
  for (const k of TENDER_STUDY_FIELDS) {
    const v = study[k]; if (empty(v)) continue;
    if (empty(item[k]) || fieldSources[k] === 'etimad') { patch[k] = v; fieldSources[k] = 'analyzer'; if (study.evidence[k]) evidence[k] = study.evidence[k]; filled.push(k); }
    else if (String(item[k]).replace(/[^\d.]/g, '') !== String(v).replace(/[^\d.]/g, '') || (k === 'bond' && String(item[k]).trim() !== String(v).trim())) differs.push({ field: k, have: String(item[k]), study: String(v) });
  }
  for (const k of TENDER_DATE_FIELDS) {
    const d = study.dates[k]; if (!d) continue;
    if (empty(item[k]) || dateSources[k] === 'etimad') { patch[k] = d.date; if (TENDER_TIMED.includes(k)) patch[`${k}Time`] = d.time || ''; dateSources[k] = 'analyzer'; if (study.evidence[k]) evidence[k] = study.evidence[k]; filled.push(k); }   // v9.62: what only Etimad gave yields to the study
    else if (item[k] !== d.date) differs.push({ field: k, have: item[k], study: d.date });
    else if (d.time && empty(item[`${k}Time`]) && `${k}Time` in item) { patch[`${k}Time`] = d.time; filled.push(`${k}Time`); }   // same day, the study adds the hour
  }
  if (study.summary && empty(item.studySummary)) { patch.studySummary = study.summary; filled.push('studySummary'); }
  if (study.studyFile && empty(item.study)) { patch.study = study.studyFile; filled.push('study'); }
  if (study.entity && empty(item.entity)) { patch.entity = study.entity; filled.push('entity'); }   // v9.58: the card names the entity
  // v9.55: the same study read again is not news — no new stamp, no history line. Only a decision or a reason that changed is written.
  const decided = !!study.decision && (item.studyDecision !== study.decision || (item.studyWhy || '') !== (study.why || ''));
  if (decided) { patch.studyDecision = study.decision; patch.studyWhy = study.why; patch.studyAt = at; }
  if (filled.length) Object.assign(patch, { fieldSources, dateSources, evidence });
  return { patch, filled, differs };
}

/** v9.47: what the manager still has to fill on a tender, by its stage — the fields the detail window marks and the list counts.
 *  Before a decision: who owns the file, the Etimad number and the submission deadline. While preparing: also the value and the
 *  guarantee. Once submitted: when and under which number. Closed without joining (declined, cancelled): nothing is asked. */
export function tenderNeeds(item) {
  const st = item.stage || 'received', empty = (k) => item[k] === '' || item[k] == null;
  // ADR-0128: a closed tender (won, lost, declined, cancelled) asks for nothing; the rest is a reminder, never a condition
  const want = ['declined', 'cancelled', 'won', 'lost', 'missed'].includes(st) ? [] : ['owner', 'etimadNo', 'due',
    ...(['prep', 'ready', 'submitted'].includes(st) ? ['value', 'bond'] : []),
    ...(st === 'submitted' ? ['submittedOn', 'submitNo'] : [])];
  return want.filter(empty);
}
/** ADR-0125: which line a project belongs to — a tender (a public bid) or upselling (more work for a customer we already serve).
 *  The manager's own choice wins. Otherwise only clear signals decide: a tender-register row, a terms booklet, the tenders
 *  sender or the «tender» kind make it a tender; the «commercial offer» kind (an offer to a client) makes it upselling.
 *  Anything else stays «not sorted» rather than guessed. `auto` says the line was derived, not chosen. */
export function projectLine(r) {
  if (!r) return { line: '', auto: false };
  if (r.cat === 'tender' || r.cat === 'upsell') return { line: r.cat, auto: false };
  if (r.fromTender || r.tender || r.kind === 'tender' || r.kraasa || r.aibrahim) return { line: 'tender', auto: true };
  if (r.kind === 'commercial') return { line: 'upsell', auto: true };
  return { line: '', auto: true };
}
/** ADR-0125: what «delete all shown» removes, and what it cannot: a register item is removed, a mail thread is hidden (it does not
 *  come back with the next pull); a row that comes from the tender register is left — it is deleted in the tender register. */
export function projectDeletePlan(rows) {
  const items = [], keys = [], kept = [];
  for (const r of rows || []) { if (r.fromTender) kept.push(r.id); else if (r.item) items.push(r.item.id); else if (r.key) keys.push(r.key); else kept.push(r.id); }
  return { items: [...new Set(items)], keys: [...new Set(keys)], kept };
}
export function tenderCanAdvance(item, nextStage) {
  return !['ready', 'submitted', 'won', 'lost'].includes(nextStage) ||
    ['technical', 'financial'].every((kind) => item.files?.some((file) => file.kind === kind && file.blob.size > 0)) ||
    !!item.files?.some((file) => file.kind === 'offer' && file.blob.size > 0);   // ADR-0127: one file that holds the technical and the financial offer
}
/** ADR-0127: the stage a tender moves to by itself when a file arrives, or null. A study that says «bid» moves a tender that is
 *  still before preparation into preparation; «do not bid» declines it with the study's reason (no reason, no move); the final
 *  offer file makes it ready. A tender already past that point, or closed, is never moved back or reopened. `back` holds what
 *  to restore on undo. Won, lost and submitted stay the manager's. */
export function tenderAutoStage(item, event, today) {
  const st = item.stage || 'received', early = ['received', 'screen', 'decide'];
  const back = { stage: st, stageAt: item.stageAt || '', decidedOn: item.decidedOn || '', reason: item.reason || '', readyOn: item.readyOn || '', status: item.status || 'open' };
  const base = { stageAt: today, decidedOn: item.decidedOn || today };
  if (event.type === 'study' && early.includes(st)) {
    if (event.decision === 'go') return { patch: { ...base, stage: 'prep' }, back };
    if (event.decision === 'no-go' && String(event.why || '').trim()) return { patch: { ...base, stage: 'declined', reason: String(event.why).trim().slice(0, 300) }, back };
  }
  if (event.type === 'offer' && [...early, 'prep'].includes(st)) return { patch: { ...base, stage: 'ready', readyOn: today, status: 'ready' }, back };
  return null;
}
/** ADR-0127: the study workbook can carry the register's data itself, in a sheet named «tender-register»: rows of
 *  [key, value, source file, page, quote]. This turns those rows into one `afaqy-tender-study/v1` file for parseTenderStudy(). */
export function tenderStudyFromSheet(rows, fileName = '') {
  const m = new Map(), ev = {};
  for (const r of rows || []) { const k = String((r && r[0]) ?? '').trim(); if (!k || m.has(k)) continue; m.set(k, r[1]);
    if (r[2] || r[4]) ev[k] = { file: String(r[2] ?? ''), page: Number.isSafeInteger(Number(r[3])) && Number(r[3]) > 0 ? Number(r[3]) : null, quote: String(r[4] ?? '') }; }
  if (m.get('schema') !== 'afaqy-tender-study/v1') return null;
  const txt = (k) => (m.get(k) == null ? '' : String(m.get(k)).trim()), amt = (k) => { const v = m.get(k); return v == null || v === '' ? null : v; };
  // a date cell arrives as a date (Excel) or as text; a time in its own «…Time» row wins over one written beside the date
  const when = (k) => { const v = m.get(k); if (v == null || v === '') return null; const d = v instanceof Date && !Number.isNaN(+v) ? new Date(+v + 3 * 36e5).toISOString().slice(0, 10) : String(v).trim(); return txt(`${k}Time`) && /^\d{4}-\d{2}-\d{2}$/.test(d) ? { date: d, time: txt(`${k}Time`) } : d; };
  const dates = {}; for (const k of TENDER_DATE_FIELDS) { const w = when(k); if (w) dates[k] = w; }
  return { schema: 'afaqy-tender-study/v1', generatedAt: txt('generatedAt'), tool: txt('tool'), tenders: [{ subject: txt('subject'), etimadNo: txt('etimadNo'), entity: txt('entity'), dates,
    fees: amt('fees'), bond: txt('bond'), value: amt('value'), decision: txt('decision'), decisionWhy: txt('decisionWhy'), summary: txt('summary'), studyFile: txt('studyFile') || fileName, evidence: ev }] };
}
// ---------- v9.60 (ADR-0132): Etimad — the platform's own facts, and a Hijri date checked before it is taken ----------
// The Tender Analyzer reads dates from the booklet. A booklet often writes them in Hijri, and a wrong conversion became a wrong
// deadline on the card (WM dash-cam tender: the booklet's 16/06/1448 was written as 19 Nov; Umm al-Qura gives 26 Nov). The
// register now converts the booklet's own words itself and compares. And the platform is the authority for its own dates and
// fee: a file from the Etimad pull tool sets them, whatever the booklet, the mail or the study said, unless the manager typed one.
const HIJRI_FMT = (() => { try { return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }); } catch { return null; } })();
const hijriParts = (ms) => { const p = HIJRI_FMT.formatToParts(new Date(ms)), g = (k) => Number((p.find((x) => x.type === k) || {}).value); return [g('year'), g('month'), g('day')]; };
/** A Hijri day (Umm al-Qura, the calendar Etimad and the booklets use) as a Gregorian `YYYY-MM-DD`; '' when the day does not exist. */
export function hijriToGregorian(y, m, d) {
  if (!HIJRI_FMT || !(y >= 1400 && y <= 1500 && m >= 1 && m <= 12 && d >= 1 && d <= 30)) return '';
  const guess = Date.UTC(2024, 6, 7) + ((y - 1446) * 354.36707 + (m - 1) * 29.530589 + (d - 1)) * 864e5;   // 1 Muharram 1446 = 7 July 2024
  for (let k = 0; k <= 5; k++) for (const s of k ? [k, -k] : [0]) { const ms = guess + s * 864e5, [yy, mm, dd] = hijriParts(ms); if (yy === y && mm === m && dd === d) return new Date(ms).toISOString().slice(0, 10); }
  return '';
}
/** The Hijri days a quote can mean. Text pulled out of a right-to-left PDF often comes out of order («16ص 09:30 1448/06/»), so the
 *  year is found first, clock times and Gregorian dates are set aside, and the day and month are read from the numbers left —
 *  every order that makes a real day is kept. More than three numbers left is too loose to read: nothing is returned. */
export function hijriInQuote(quote) {
  let s = tenderDigits(quote).replace(/\b20\d{2}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*\d{1,2}\b|\b\d{1,2}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*20\d{2}\b/g, ' ').replace(/\b\d{1,2}\s*:\s*\d{2}\b/g, ' ');
  const yr = s.match(/\b14\d{2}\b/); if (!yr) return [];
  s = s.replace(yr[0], ' '); const nums = (s.match(/\b\d{1,2}\b/g) || []).map(Number);
  if (!nums.length || nums.length > 3) return [];
  const y = Number(yr[0]), out = new Map();
  for (const d of nums) for (const m of nums) { if (d === m && nums.filter((n) => n === d).length < 2) continue; const g = hijriToGregorian(y, m, d); if (g) out.set(g, { hijri: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, date: g }); }
  return [...out.values()];
}
/** Does a date match the Hijri date in its own quote? ok:true when the quote holds no Hijri date or one reading matches. Otherwise
 *  `date` is the one reading the quote allows ('' when it allows several), so the caller can take it or leave the field empty. */
export function hijriCheck(date, quote) {
  const c = hijriInQuote(quote);
  if (!c.length || c.some((x) => x.date === date)) return { ok: true };
  return { ok: false, hijri: c.length === 1 ? c[0].hijri : '', date: c.length === 1 ? c[0].date : '' };
}

export const RADAR_SCHEMA = 'afaqy-etimad-radar/v1';
const rNorm = (s) => tenderDigits(s).normalize('NFKC').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ـً-ْ]/g, '').toLowerCase();
// AFAQY's scope, the Tender Analyzer's rule the manager approved (Nov 2026): IT, IoT, building systems, cameras, networks and software
// are in — with the civil and fibre works a technical project carries; general contracting, finishing and supplies are out.
const SCOPE_IN = /كامير|cctv|داش ?كام|مراقبه (امني|تلفزيون|بالكامير)|تتبع (ال)?(مركب|اسطول|سيار|اليات|الاليات|معدات|المعدات|اجهز|الاجهز)|اجهز(ه)? تتبع|\bavl\b|\bgps\b|حساس|انترنت الاشياء|\biot\b|rfid|بوابات (ذكي|الكترون|دخول)|تحكم (في|ب) ?(ال)?دخول|(ب|في )?(ال)?ابواب (ذكي|الكترون)|انظمه الدخول|الدخول الذكي|شبك(ه|ات) (ال)?(حاسب|بيانات|معلومات|اتصالات|محلي|لاسلكي|الياف|داخلي)|الشبكه المحليه|سويتش|\bswitch(es)?\b|راوتر|\brouters?\b|الياف ضوئي|فايبر|fib(er|re) optic|مركز (ال)?بيانات|خوادم|سيرفر|\bservers?\b|انظمه المباني|المباني الذكي|\bbms\b|ادار(ه)? (ال)?مباني|ادار(ه)? (ال)?اسطول|ادار(ه)? (ال)?مركبات|الذكاء الاصطناعي|منص(ه|ات) (ذكي|رقمي|الكترون)|نظام (ذكي|الكتروني|رقمي)|تطبيق|برمج|بنيه تحتيه تقنيه|البنيه التحتيه (التقنيه|للشبكات|الرقميه)|تقنيه المعلومات|لاسلكي|wi-?fi|انذار (ضد )?(السرق|التسلل|امني)|ذكي/;
const SCOPE_OUT = /قطع غيار|محرك|زورق|زوارق|نظافه|تشطيب|ترميم|ادويه|(^|\s)(ال)?طبي(ه)?(\s|$)|مستلزمات|تغذيه|اعاشه|اثاث|تصريف|سفلت|رصف|زراع|تشجير|ملابس|اغذيه|كساوي|اسمنت|مكيفات|تكييف|مولد|ديزل|اطارات|زيوت|بطاريات|توريد مركبات|توريد سيارات|قرطاسي|حبر/;
const SCOPE_ACT = /تقنيه المعلومات|الاتصالات/;
/** Is an Etimad tender inside AFAQY's scope? By its title first (a clear «out» word wins), then by Etimad's main activity. */
export function etimadInScope(title, activity = '') { const t = rNorm(title); if (SCOPE_OUT.test(t)) return false; return SCOPE_IN.test(t) || SCOPE_ACT.test(rNorm(activity)); }
// v9.66 (ADR-0139): industrial IoT is a field of its own beside AFAQY's scope. Read from the title alone — Etimad has no activity
// for it. `AR` stands for «not an Arabic letter»: «قياس» must not be the tail of «مقياس», nor «آلي» the head of «اليدوي».
const AR = '[^\\u0621-\\u064A]';
export const IIOT_LINES = [
  ['scada', new RegExp(`سكادا|scada|\\bplc\\b|\\brtu\\b|\\bdcs\\b|(ال)?تحكم الي(${AR}|$)|(ال)?(تحكم|مراقبه|قراءه|قياس) (الي )?عن بعد|تيليمتري`)],
  ['meters', new RegExp(`عدادات? (ال)?ذكي|العدادات الذكي|عدادات? (ال)?(مياه|كهرب|وقود|غاز|تدفق)|(^|${AR})(قياس|قياسات) (ال)?تدفق`)],
  ['tanks', new RegExp(`(^|${AR})(قياس|مراقبه|رصد) (ال)?(مستوي|منسوب)(${AR}|$)|مستوي (ال)?(وقود|خزان)|مراقبه (ال)?خزانات|اتمته (ال)?محطات|حساسات? (ال)?وقود`)],
  ['env', new RegExp(`رصد (ال)?(بيئ|هواء)|جوده الهواء|محطات? (ال)?رصد (ال)?(بيئ|جوي|هواء|زلزال|مائي)|رصد (ال)?ضوضاء`)],
  ['energy', new RegExp(`ادار(ه)? (ال)?طاقه|مراقبه (ال)?(طاقه|استهلاك|مضخات|مولدات)|كشف (ال)?تسرب|صيانه تنبؤي`)],
  ['city', new RegExp(`(ال)?اناره (ال)?ذكي|(ال)?مواقف (ال)?ذكي|(ال)?حاويات (ال)?ذكي|(^|${AR})(ال)?ري (ال)?ذكي|المدن الذكي|مدينه ذكي|(^|${AR})عد (ال)?(مركبات|حشود|زوار|مشاه)|ميزان جسري|موازين (ال)?(شاحنات|جسري)|الوزن المحوري`)],
];
// maintenance and operation stay in (the manager's choice, 18 Nov 2026); parts, consumables, lab and medical purchases are not projects
const IIOT_OUT = /قطع غيار|spare|part no|data logger|مسجل(ات)? (ال)?بيانات|اعاشه|مستلزمات|مختبر|معايره|ادويه|(^|\s)(ال)?طبي(ه)?(\s|$)|مريض|مرضي/;
/** The industrial-IoT line an Etimad tender falls in by its title — 'scada', 'meters', 'tanks', 'env', 'energy', 'city' — or ''. */
export function etimadIiot(title) { const t = rNorm(title).replace(/وكاله [^،,-]{0,40}المدن الذكيه/g, ' ');   // an agency's name is not a project
  if (!t || IIOT_OUT.test(t)) return '';  const hit = IIOT_LINES.find(([, re]) => re.test(t)); return hit ? hit[0] : ''; }
const iiotMemo = new WeakMap();
const iiotOf = (x) => { let v = iiotMemo.get(x); if (v === undefined) { v = etimadIiot(x.title); iiotMemo.set(x, v); } return v; };
// Etimad's own «region» column came empty for all 30,396 tenders of the first pull, so the West is read from the entity and the place
const WEST = /جده|مكه|المدينه المنوره|منطقه المدينه|ينبع|الطائف|رابغ|الليث|القنفذه|العلا|الغربيه|خليص|الجموم|بحره/;
export const etimadWest = (...s) => WEST.test(rNorm(s.join(' ')));
const AFAQY_NAME = /افاقي لتقنيه المعلومات|\bafaqy\b/;
export const etimadIsUs = (name) => AFAQY_NAME.test(rNorm(name));
/** An Etimad time as the Saudi wall clock. The pull tool writes Excel dates (serial days) or text; a serial is read without any time
 *  zone, so the browser's own zone cannot shift it. A time of 00:00 means «no time» on Etimad. */
export function etimadWhen(v) {
  let iso = '';
  if (typeof v === 'number' && Number.isFinite(v) && v > 20000 && v < 80000) iso = new Date(Math.round((v * 864e5 + Date.UTC(1899, 11, 30)) / 6e4) * 6e4).toISOString().slice(0, 16);
  else if (typeof v === 'string') { const m = tenderDigits(v).trim().match(/^(\d{4}-\d{2}-\d{2})(?:[T\s]+(\d{2}:\d{2}))?/); if (m && !Number.isNaN(Date.parse(`${m[1]}T00:00:00Z`))) iso = `${m[1]}T${m[2] || '00:00'}`; }
  if (!iso) return { date: '', time: '' };
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) === '00:00' ? '' : iso.slice(11, 16) };
}
const rStr = (v, n) => (v == null ? '' : String(v).trim().slice(0, n));
const rRef = (v) => tenderDigits(rStr(v, 60)).replace(/^REF:/i, '').replace(/[^\d]/g, '').slice(0, 20);
const rLink = (v) => { const s = rStr(v, 400); return /^https:\/\/tenders\.etimad\.sa\//i.test(s) ? s.replace(/\s/g, '%20') : ''; };
const rMoney = (v) => (v === '' || v == null ? null : tenderAmount(typeof v === 'number' ? v : String(v)));
const rStatus = (v) => { const s = rNorm(v); return s === 'active' || s.includes('نشطه') ? 'active' : s === 'awarded' || s.includes('ترسيه') ? 'awarded' : 'other'; };
/** One tender, cleaned — from the pull tool's JSON (English keys) or from a sheet row already mapped to the same keys. */
function radarTender(x) {
  const ref = rRef(x.ref); if (!ref) return null;
  const w = (k) => etimadWhen(x[k]), pub = w('published'), ask = w('askDue'), due = w('due'), open = w('openAt'), ws = w('workStart'), seen = w('firstSeen');
  const title = rStr(x.title, 300), entity = rStr(x.entity, 200), activity = rStr(x.activity, 160), place = rStr(x.place, 300);
  return { ref, no: rStr(x.no, 60), title, entity, status: rStatus(x.status), type: rStr(x.type, 80), activity, published: pub.date,
    askDue: ask.date, askDueTime: ask.time, due: due.date, dueTime: due.time, openAt: open.date, openAtTime: open.time,
    fees: rMoney(x.fees), place, duration: rStr(x.duration, 80), link: rLink(x.link), workStart: ws.date, firstSeen: seen.date,
    scope: etimadInScope(title, activity), west: etimadWest(entity, place) };
}
const rOffer = (x) => { const ref = rRef(x.ref), bidder = rStr(x.bidder, 200); if (!ref || !bidder) return null; const tech = rNorm(x.tech);
  return { ref, bidder, price: rMoney(x.price), tech: tech === 'pass' || tech === 'مطابق' ? 'pass' : tech === 'fail' || tech.includes('غير مطابق') ? 'fail' : '' }; };
const rAward = (x) => { const ref = rRef(x.ref), winner = rStr(x.winner, 200); return ref && winner ? { ref, winner, value: rMoney(x.value) } : null; };
/** What a pull keeps. v9.63 (ADR-0136): everything it holds — the market study looks at every field of work, not only ours; each
 *  tender carries `scope` and `west` so the radar and the study can narrow it. (9.60–9.62 kept only our scope.) A tender seen twice
 *  in one file is kept once. `keepRefs` is still accepted and changes nothing now. */
function radarKeep(r, keepRefs = []) {
  const seen = new Set(), tenders = r.tenders.filter((x) => !seen.has(x.ref) && seen.add(x.ref)).slice(0, 200000);
  return { ...r, total: r.tenders.length, tenders, awards: r.awards, offers: r.offers };
}
/** The pull tool's own file (`afaqy-etimad-radar/v1`), cleaned. */
export function parseRadar(raw, keepRefs = []) {
  let j = raw; if (typeof raw === 'string') { try { j = JSON.parse(raw); } catch { return { error: 'json' }; } }
  if (!j || j.schema !== RADAR_SCHEMA || !Array.isArray(j.tenders)) return { error: 'schema' };
  const list = (v, f) => (Array.isArray(v) ? v : []).map((x) => (x && typeof x === 'object' ? f(x) : null)).filter(Boolean);
  const pulled = etimadWhen(j.pulledAt);
  const r = { schema: RADAR_SCHEMA, pulledAt: pulled.date ? `${pulled.date}T${pulled.time || '00:00'}` : '', partial: !!j.partial, tool: rStr(j.tool, 80),
    filter: j.filter && typeof j.filter === 'object' ? { from: etimadWhen(j.filter.from).date, to: etimadWhen(j.filter.to).date, category: rStr(j.filter.category, 200) } : null,
    tenders: list(j.tenders, radarTender), awards: list(j.awards, rAward), offers: list(j.offers, rOffer) };
  return r.tenders.length ? radarKeep(r, keepRefs) : { error: 'empty' };
}
// the pull tool's Excel names its columns in Arabic; they are found by name, so a column added or moved does not shift the others
const RADAR_COLS = { ref: ['الرقم المرجعي'], title: ['اسم المنافسة', 'المنافسة'], entity: ['الجهة الحكومية'], status: ['حالة المنافسة'], type: ['نوع المنافسة'],
  activity: ['النشاط الرئيسي', 'النشاط'], published: ['تاريخ النشر'], askDue: ['آخر موعد استفسارات'], due: ['آخر موعد تقديم'], openAt: ['موعد فتح العروض'],
  fees: ['سعر الكراسة ر.س'], no: ['رقم المنافسة'], duration: ['مدة التنفيذ'], place: ['مكان التنفيذ'], link: ['رابط اعتماد', 'رابط المصدر'], firstSeen: ['أول رصد'],
  workStart: ['تاريخ بدء الأعمال'], winner: ['اسم الفائز'], value: ['قيمة الترسية ر.س'], bidder: ['مقدم العرض'], price: ['سعر العرض المالي ر.س'], tech: ['نتيجة الفحص الفني'],
  started: ['بدأ'], ended: ['انتهى'], runStatus: ['الحالة'] };
function rRows(rows, keys) {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const head = rows[0].map((h) => String(h ?? '').trim()), at = Object.fromEntries(keys.map((k) => [k, head.findIndex((h) => RADAR_COLS[k].includes(h))]));
  return rows.slice(1).map((r) => Object.fromEntries(keys.map((k) => [k, at[k] >= 0 ? r[at[k]] : '']))); }
/** The pull tool's Excel workbook, as `get(sheetName)` → rows (header first), read into the same shape as parseRadar(). */
export function radarFromSheets(get, keepRefs = []) {
  const T = ['ref', 'title', 'entity', 'status', 'type', 'activity', 'published', 'askDue', 'due', 'openAt', 'fees', 'no', 'duration', 'place', 'link', 'firstSeen', 'workStart'];
  const all = get('جميع المنافسات') || get('المنافسات النشطة'); if (!all) return { error: 'nosheet' };
  const runs = rRows(get('سجل السحب'), ['started', 'ended', 'runStatus']).filter((x) => x.ended !== '' && x.ended != null);
  const last = runs.map((x) => etimadWhen(x.ended)).filter((x) => x.date).map((x) => `${x.date}T${x.time || '00:00'}`).sort().pop() || '';
  const r = { schema: RADAR_SCHEMA, pulledAt: last, partial: runs.some((x) => /partial|جزئي/i.test(String(x.runStatus))), tool: '', filter: null,
    tenders: rRows(all, T).map(radarTender).filter(Boolean),
    awards: rRows(get('تفاصيل الترسيات'), ['ref', 'winner', 'value']).map(rAward).filter(Boolean),
    offers: rRows(get('العروض المنشورة'), ['ref', 'bidder', 'price', 'tech']).map(rOffer).filter(Boolean) };
  if (!r.pulledAt) r.pulledAt = r.tenders.map((x) => x.firstSeen).filter(Boolean).sort().pop() || '';
  return r.tenders.length ? radarKeep(r, keepRefs) : { error: 'empty' };
}
/** A new pull added to what the radar holds. A pull covers a period or a category, not the whole platform, so nothing is dropped:
 *  a tender in the new pull replaces its older copy, and its awards and offers replace the older ones. */
export function radarMerge(have, add) {
  // v9.65 (ADR-0138): a new pull is written onto what is kept, never in its place. Every tender carries the time it was read
  // (`at`); for a tender both hold, the later reading's values win and an empty value never erases a known one — so a pull
  // made for the winners adds them without losing a date an earlier, fuller pull had, and an old file uploaded after a newer
  // one cannot take the register back in time. A tender the new pull does not hold stays exactly as it was.
  const stamp = (r) => r.tenders.map((x) => (x.at ? x : { ...x, at: r.pulledAt || '' }));
  const pull = { at: add.pulledAt, n: add.tenders.length, partial: add.partial, filter: add.filter };
  if (!have || !Array.isArray(have.tenders)) return { ...add, tenders: stamp(add), merged: { added: add.tenders.length, updated: 0 }, pulls: [pull] };
  const newer = (add.pulledAt || '') >= (have.pulledAt || ''), by = new Map(stamp(have).map((x) => [x.ref, x])), olderCopy = new Set();
  let added = 0, updated = 0;
  for (const x of stamp(add)) {
    const old = by.get(x.ref);
    if (!old) { by.set(x.ref, x); added++; continue; }
    const late = x.at >= old.at ? x : old, early = late === x ? old : x, m = { ...early };
    if (late === old) olderCopy.add(x.ref);
    for (const [k, v] of Object.entries(late)) if (!(v === '' || v == null)) m[k] = v;
    m.firstSeen = [old.firstSeen, x.firstSeen].filter(Boolean).sort()[0] || '';
    // a thin reading has no activity or entity, so its own verdict says «out»; the verdict belongs to the merged tender
    m.scope = etimadInScope(m.title, m.activity); m.west = etimadWest(m.entity, m.place);
    if (JSON.stringify(m) !== JSON.stringify(old)) updated++;
    by.set(x.ref, m);
  }
  // who won and what was offered: the later reading's list for a tender replaces the earlier one; a reading with none keeps what is known
  const lists = (key) => { const mine = new Set(have[key].map((x) => x.ref)), take = add[key].filter((x) => !(olderCopy.has(x.ref) && mine.has(x.ref))), got = new Set(take.map((x) => x.ref));
    return [...have[key].filter((x) => !got.has(x.ref)), ...take]; };
  return { schema: RADAR_SCHEMA, pulledAt: newer ? add.pulledAt : have.pulledAt, partial: newer ? add.partial : have.partial, tool: add.tool || have.tool, filter: add.filter,
    total: add.total, tenders: [...by.values()], awards: lists('awards'), offers: lists('offers'), merged: { added, updated },
    pulls: [...(have.pulls || []), pull].slice(-30) };
}
/** The Etimad tender a register row is: the same number (Etimad's reference number, or the entity's own tender number), then the same
 *  title key. Anything looser is only suggested (radarSuggest), never linked by itself. */
// v9.63: the whole pull (tens of thousands of tenders) is searched through an index built once per list, not scanned per tender
const radarIdx = new WeakMap();
function radarIndex(list, keyOf) {
  let ix = radarIdx.get(list); if (ix && ix.keyOf === keyOf) return ix;
  const add = (m, k, x) => { if (!k) return; const L = m.get(k); if (L) L.push(x); else m.set(k, [x]); };
  ix = { keyOf, byNo: new Map(), byKey: new Map() };
  for (const x of list) { add(ix.byNo, x.ref, x); const n = x.no ? x.no.replace(/[^\d]/g, '') : ''; if (n && n !== x.ref) add(ix.byNo, n, x); add(ix.byKey, keyOf(x.title), x); }
  radarIdx.set(list, ix); return ix;
}
export function radarFind(item, list, keyOf) {
  const ix = radarIndex(list, keyOf), no = String(item.etimadNo || '').replace(/[^\d]/g, '');
  if (no) { const L = [...new Set(ix.byNo.get(no) || [])]; if (L.length === 1) return L[0]; if (L.length > 1) return null; }
  const k = keyOf(item.subject); if (!k) return null;
  const L = ix.byKey.get(k) || []; return L.length === 1 ? L[0] : null;
}
const R_STOP = new Set(['توريد', 'وتركيب', 'تركيب', 'وتشغيل', 'تشغيل', 'وصيانه', 'صيانه', 'مشروع', 'منافسه', 'عمليه', 'لزوم', 'بشان', 'خاص', 'الخاص', 'الخاصه', 'عدد', 'تامين', 'تقديم', 'خدمات', 'اعمال', 'supply', 'and', 'the', 'for', 'of', 'installation']);
const rWordsMemo = new Map();
const rWords = (s) => { const k = String(s || ''); let w = rWordsMemo.get(k); if (!w) { if (rWordsMemo.size > 120000) rWordsMemo.clear(); w = rWordsRaw(k); rWordsMemo.set(k, w); } return w; };
const rWordsRaw = (s) => new Set(rNorm(s).split(/[^\p{L}\p{N}]+/u).map((w) => w.replace(/^(و|ب|ل)(?=ال)/, '').replace(/^ال(?=..)/, '')).filter((w) => w.length > 1 && !R_STOP.has(w) && !R_STOP.has(`ال${w}`)));
/** Etimad tenders that look like a register row: at least two words of the title shared, and most of the shorter title. Best first. */
export function radarSuggest(item, list, max = 3) {
  const a = rWords(`${item.subject} ${item.entity || ''}`);
  return list.map((x) => { const b = rWords(`${x.title} ${x.entity}`), shared = [...rWords(x.title)].filter((w) => a.has(w)).length, both = [...b].filter((w) => a.has(w)).length, small = Math.min(rWords(x.title).size, rWords(item.subject).size) || 1;
    return { x, score: shared / small, shared, both }; })
    .filter((s) => s.shared >= 2 && s.score >= 0.6).sort((p, q) => q.score - p.score || q.both - p.both).slice(0, max).map((s) => s.x);
}
const ETIMAD_DATES = ['due', 'askDue', 'openAt'];
/** v9.62 (ADR-0135): what an Etimad pull may do to a register row. The pull is a periodic market study (every three or six
 *  months); a tender's reference is its mail files, the analyzer's study and what the manager types. So the pull fills only
 *  what is still empty — and the page uses even that only for a tender the manager chose to follow from the radar. Every value
 *  the register already holds that Etimad states otherwise is returned in `differs`, for the card to mention, never to apply. */
export function applyEtimad(item, x) {
  const patch = {}, filled = [], differs = [], empty = (v) => v === '' || v == null;
  const dateSources = { ...(item.dateSources || {}) }, fieldSources = { ...(item.fieldSources || {}) };
  for (const k of ETIMAD_DATES) {
    const v = x[k]; if (!v) continue;
    const tm = TENDER_TIMED.includes(k) ? x[`${k}Time`] || '' : '', haveTm = TENDER_TIMED.includes(k) ? item[`${k}Time`] || '' : '';
    if (empty(item[k])) { patch[k] = v; if (TENDER_TIMED.includes(k)) patch[`${k}Time`] = tm; dateSources[k] = 'etimad'; patch.dateSources = dateSources; filled.push(k); continue; }
    if (item[k] !== v || (tm && haveTm && haveTm !== tm)) differs.push({ field: k, have: item[k] + (haveTm ? ` ${haveTm}` : ''), etimad: v + (tm ? ` ${tm}` : ''), src: dateSources[k] || '' });
  }
  if (x.fees != null) {
    if (empty(item.fees)) { patch.fees = x.fees; fieldSources.fees = 'etimad'; patch.fieldSources = fieldSources; filled.push('fees'); }
    else if (Number(item.fees) !== x.fees) differs.push({ field: 'fees', have: String(item.fees), etimad: String(x.fees), src: fieldSources.fees || '' });
  }
  if (empty(item.etimadNo)) { patch.etimadNo = x.ref; filled.push('etimadNo'); }
  if (empty(item.entity) && x.entity) { patch.entity = x.entity; filled.push('entity'); }
  if (x.link && empty(item.link)) patch.link = x.link;
  return { patch, filled, differs };
}
/** Linking a register row to its Etimad tender (the manager pressed «Link»): its number and its page, nothing else. */
export function etimadLinkPatch(item, x) {
  const patch = { etimadNo: x.ref };
  if (x.link) patch.link = x.link;
  return String(item.etimadNo || '').replace(/[^\d]/g, '') === x.ref && (!x.link || item.link === x.link) ? {} : patch;
}
/** v9.62: what 9.60 and 9.61 replaced with Etimad's value is put back — the mail's or the study's date or fee — with its source.
 *  A value typed since then (source no longer «etimad») is left alone. Returns the patch, or null when there is nothing to undo. */
export function tenderUndoEtimad(item) {
  const was = Array.isArray(item && item.etimadWas) ? item.etimadWas : [];
  if (!was.length) return null;
  const patch = { etimadWas: [] }, dateSources = { ...(item.dateSources || {}) }, fieldSources = { ...(item.fieldSources || {}) }, back = [];
  for (const w of [...was].reverse()) {   // the oldest replaced value is the original one
    if (back.includes(w.field)) continue;
    if (w.field === 'fees') {
      if (fieldSources.fees !== 'etimad') continue;
      const n = tenderAmount(w.was); patch.fees = n; if (w.src) fieldSources.fees = w.src; else delete fieldSources.fees; patch.fieldSources = fieldSources; back.push('fees'); continue;
    }
    if (!ETIMAD_DATES.includes(w.field) || dateSources[w.field] !== 'etimad') continue;
    const [d, tm = ''] = String(w.was || '').split(' ');
    patch[w.field] = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''; if (TENDER_TIMED.includes(w.field)) patch[`${w.field}Time`] = /^\d{2}:\d{2}$/.test(tm) ? tm : '';
    if (w.src) dateSources[w.field] = w.src; else delete dateSources[w.field]; patch.dateSources = dateSources; back.push(w.field);
  }
  return { patch, fields: back };
}
/** A register row made from an Etimad tender the manager chose to follow: the branch received it today; everything else is Etimad's. */
export function radarToItem(x, today, keyOf) {
  const it = { id: keyOf(x.title), subject: x.title, date: today, from: '', byFrom: false, byKr: false, manual: true, att: [], status: 'open', stage: 'received', stageAt: today,
    readyOn: '', due: '', visit: '', note: '', etimadNo: '', entity: '', dateSource: 'manual', dateSources: {}, fieldSources: {} };
  return { ...it, ...applyEtimad(it, x).patch };
}
// ---------- v9.61 (ADR-0133): the market and the result, from the same Etimad pulls ----------
/** A tender's own result on Etimad: who bid and at what price, their technical result, where AFAQY stood, and who won. Prices
 *  are compared only among offers that passed the technical check when any did; an offer without a price is listed, not ranked. */
export function radarResult(ref, radar) {
  if (!ref || !radar) return null;
  const x = (radar.tenders || []).find((t) => t.ref === ref); if (!x) return null;
  const offers = (radar.offers || []).filter((o) => o.ref === ref).map((o) => ({ ...o, us: etimadIsUs(o.bidder) }));
  const award = (radar.awards || []).filter((a) => a.ref === ref);
  const pool = offers.some((o) => o.tech === 'pass') ? offers.filter((o) => o.tech === 'pass') : offers;
  const ranked = pool.filter((o) => o.price != null).sort((a, b) => a.price - b.price);
  const us = offers.find((o) => o.us) || null, rank = us ? ranked.indexOf(us) + 1 : 0;
  const winner = award[0] ? { name: award[0].winner, value: award[0].value, us: award.some((a) => etimadIsUs(a.winner)), more: award.length - 1 } : null;
  return { status: x.status, n: offers.length, offers: [...ranked, ...offers.filter((o) => !ranked.includes(o))], lowest: ranked[0] || null, us,
    usRank: rank || null, usOf: ranked.length, winner, workStart: x.workStart || '' };
}
/** The outcome a result points to, for the manager to confirm — never applied by itself. Only for a tender we joined and that is
 *  not closed yet: our name among the winners → won; a winner published and our offer among the bidders → lost, with the reason
 *  in Etimad's own facts. Nothing when the result does not name a winner, or when our offer is not on the list. */
export function tenderOutcome(item, res) {
  if (!item || !res || !res.winner || TENDER_CLOSED.includes(item.stage)) return null;
  if (res.winner.us) return { stage: 'won', value: res.winner.value };
  if (!res.us) return null;
  return { stage: 'lost', winner: res.winner.name, value: res.winner.value, usPrice: res.us.price, usTech: res.us.tech, rank: res.usRank, of: res.usOf };
}
const rMedian = (L) => { const s = [...L].sort((a, b) => a - b), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
/** Awarded tenders that look like this one (two shared title words and half the shorter title), with what each was awarded for,
 *  to whom, and how many bid; and across them the median award, the usual number of bidders and who wins most. */
export function radarSimilar(title, radar, { ref = '', max = 8 } = {}) {
  if (!radar || !title) return { rows: [], n: 0 };
  const a = rWords(title), byRef = (L) => L.reduce((m, o) => m.set(o.ref, [...(m.get(o.ref) || []), o]), new Map());
  const offers = byRef(radar.offers || []), awards = byRef(radar.awards || []);
  const rows = (radar.tenders || []).filter((x) => x.status === 'awarded' && x.ref !== ref && awards.has(x.ref)).map((x) => {
    const b = rWords(x.title), shared = [...b].filter((w) => a.has(w)).length, small = Math.min(a.size, b.size) || 1;
    return { x, shared, score: shared / small };
  }).filter((s) => s.shared >= 2 && s.score >= 0.5).sort((p, q) => q.score - p.score || (q.x.published || '').localeCompare(p.x.published || '')).slice(0, max).map(({ x }) => {
    const of = offers.get(x.ref) || [], aw = awards.get(x.ref) || [], prices = of.map((o) => o.price).filter((p) => p != null);
    return { ref: x.ref, title: x.title, entity: x.entity, published: x.published, winner: aw[0].winner, value: aw[0].value, bidders: of.length,
      low: prices.length ? Math.min(...prices) : null, high: prices.length ? Math.max(...prices) : null, us: of.some((o) => etimadIsUs(o.bidder)) || aw.some((w) => etimadIsUs(w.winner)) };
  });
  const values = rows.map((r) => r.value).filter((v) => v != null), bids = rows.map((r) => r.bidders).filter((n) => n > 0);
  const wins = [...rows.reduce((m, r) => m.set(r.winner, (m.get(r.winner) || 0) + 1), new Map())].sort((p, q) => q[1] - p[1]).slice(0, 3).map(([name, n]) => ({ name, n }));
  return { rows, n: rows.length, medianValue: rMedian(values), medianBidders: rMedian(bids), wins };
}
/** AFAQY's own bids found on Etimad, newest first: the tender, our price, the technical result, our rank and the winner. */
export function radarOurBids(radar) {
  if (!radar) return [];
  const refs = new Set([...(radar.offers || []).filter((o) => etimadIsUs(o.bidder)).map((o) => o.ref), ...(radar.awards || []).filter((a) => etimadIsUs(a.winner)).map((a) => a.ref)]);
  return (radar.tenders || []).filter((x) => refs.has(x.ref)).map((x) => ({ ...radarResult(x.ref, radar), ref: x.ref, title: x.title, entity: x.entity, published: x.published }))
    .sort((p, q) => (q.published || '').localeCompare(p.published || ''));
}
// ---------- v9.64 (ADR-0137): the Tender Analyzer inside the card — a program on this computer, reached from the page ----------
/** The program's own address on this computer (never the network), the name of the protocol it speaks, and the address
 *  that opens it when it is closed. The page talks to nothing else here. */
export const ANALYZER = { schema: 'afaqy-analyzer-link/v1', base: 'http://127.0.0.1:47615', open: 'afaqy-tender://open' };
const AN_STATES = ['waiting', 'running', 'done', 'failed'];
const AN_SEND_KINDS = ['booklet', 'boq', 'sheet', 'other', 'proof'];
const AN_EXT = /\.(pdf|xlsx|xlsm|xls|docx|doc|csv|txt|png|jpe?g|zip|pptx)$/i;
const anStr = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
/** The program's greeting, checked: only a reply in our protocol counts as the program. */
export function parseAnalyzerHello(raw) {
  if (!raw || typeof raw !== 'object' || raw.schema !== ANALYZER.schema || raw.app !== 'TenderAnalyzer') return { error: 'schema' };
  return { version: anStr(raw.version, 20), engine: ['bridge', 'cloud', 'api'].includes(raw.engine) ? raw.engine : 'local', busy: raw.busy === true, job: anStr(raw.job, 48) };
}
// The line under the Analyzer's button. At every hello the program says what a study started now would run on. «cloud» is
// Ollama's servers and «api» is the subscription service reached with the user's own key: in both the documents' text leaves
// the computer, so the card says where it goes instead of the plain note (ADR-0141, ADR-0142).
export function analyzerNote(engine) { return engine === 'cloud' ? 'an_note_cloud' : engine === 'api' ? 'an_note_api' : 'an_note'; }
// v9.71 (ADR-0142): «register and study» in one step. The switch on the mail box is turned on once, and it remembers where the
// program said the text would go at that moment. A study starts by itself only toward that place or the computer itself —
// a place the user never saw named gets the card's button and its note, never a silent start.
const AN_PLACES = ['local', 'cloud', 'api'];
export function cleanAnalyzerAuto(raw) {
  let v = null; try { v = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { v = null; }
  return { on: !!(v && v.on === true), engine: v && AN_PLACES.includes(v.engine) ? v.engine : 'local' };
}
/** What to do with a tender just registered from a mail: 'off' | 'nofiles' | 'closed' | 'ask' | 'run'. */
export function analyzerAuto(pref, hello, send) {
  if (!pref || !pref.on) return 'off';
  if (!send || !send.files || !send.files.length) return 'nofiles';
  if (!hello) return 'closed';   // a closed program is not opened behind the user's back
  if (!AN_PLACES.includes(hello.engine)) return 'ask';   // the copy-and-paste way needs the person
  return hello.engine === 'local' || hello.engine === pref.engine ? 'run' : 'ask';
}
export function analyzerAutoNote(pref) { return pref && pref.on ? `an_auto_note_${AN_PLACES.includes(pref.engine) ? pref.engine : 'local'}` : 'an_auto_hint'; }
/** Where a study stands, checked. A file name is a name, never a path; a state we do not know is «failed». */
export function parseAnalyzerJob(raw) {
  if (!raw || typeof raw !== 'object' || raw.schema !== ANALYZER.schema || !anStr(raw.job, 48)) return { error: 'schema' };
  const p = Number(raw.progress), seen = new Set();
  const outputs = (Array.isArray(raw.outputs) ? raw.outputs : []).filter((o) => o && typeof o.name === 'string' && o.name.length && o.name.length <= 200 && !/[\\/\u0000-\u001f]/.test(o.name) && !o.name.startsWith('.')
    && Number.isSafeInteger(o.size) && o.size > 0 && !seen.has(o.name) && seen.add(o.name)).slice(0, 60).map((o) => ({ name: o.name, size: o.size }));
  return { job: anStr(raw.job, 48), state: AN_STATES.includes(raw.state) ? raw.state : 'failed', stage: Number.isSafeInteger(raw.stage) ? raw.stage : -1,
    progress: Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0, message: anStr(raw.message, 300), error: anStr(raw.error, 500), outputs };
}
/** A job's name for a tender: the same every time for the same tender, in letters the program's address accepts. */
export function analyzerJobId(id) {
  let h = 0x811c9dc5, g = 0x01000193;
  for (const ch of String(id || '')) { const c = ch.codePointAt(0); h = Math.imul(h ^ (c & 0xff), 0x01000193) >>> 0; h = Math.imul(h ^ (c >>> 8), 0x01000193) >>> 0; g = (Math.imul(g, 31) + c) >>> 0; }
  return `t-${h.toString(16).padStart(8, '0')}${g.toString(16).padStart(8, '0')}`;
}
/** What the card hands to the program: the tender's own documents — the booklet, the bill of quantities, annexes. Not the
 *  mail itself, and not a study or an offer the program (or we) wrote. Two files with one name get different names. */
export function analyzerSend(item) {
  const used = new Set(), files = [];
  let skipped = 0;
  for (const f of (item && item.files) || []) {
    if (!f || !AN_SEND_KINDS.includes(f.kind) || !AN_EXT.test(f.name || '') || String(f.mailKey || '').startsWith('analyzer:')) { if (f && f.kind !== 'original') skipped++; continue; }
    let name = String(f.name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
    for (let k = 2; used.has(name.toLowerCase()); k++) name = name.replace(/( \(\d+\))?(\.[^.]+)$/, ` (${k})$2`);
    used.add(name.toLowerCase()); files.push({ id: f.id, name });
  }
  return { files: files.slice(0, 60), skipped: skipped + Math.max(0, files.length - 60) };
}
/** The kind a file the program wrote takes on the card. */
export function analyzerOutputKind(name) {
  const n = String(name || '');
  if (/_Offer_(Technical_)?AR\.(pptx|pdf)$/i.test(n)) return 'offer';
  if (/_BOQ_Priced_|_Offer_(AR|EN)\.xlsx$/i.test(n)) return 'financial';
  if (/_Datasheets_/i.test(n)) return 'technical';
  return 'study';
}
/** The one file whose fields fill the card: the register file the program writes for the portal, else its study workbook. */
export function analyzerStudyFile(outputs) {
  const names = (outputs || []).map((o) => o.name);
  return names.find((n) => /\.tender-study\.json$/i.test(n)) || names.find((n) => /_Workbook_AR\.xlsx$/i.test(n)) || '';
}
/** What a tender remembers of its study by the program: the job, how it ended and when. */
export function cleanAnalyzer(a) {
  if (!a || typeof a !== 'object' || !/^t-[0-9a-f]{16}$/.test(a.job || '')) return null;
  return { job: a.job, state: ['running', 'done', 'failed'].includes(a.state) ? a.state : 'failed', at: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(a.at || '') ? a.at.slice(0, 16) : '',
    error: anStr(a.error, 300), files: Number.isSafeInteger(a.files) && a.files >= 0 ? a.files : 0 };
}
// ---------- v9.63 (ADR-0136): the market study — the pull read for a period, a field of work and a status ----------
const mGroup = (L) => { const m = new Map(); for (const x of L || []) { const a = m.get(x.ref); if (a) a.push(x); else m.set(x.ref, [x]); } return m; };
const mMedian = (L) => { const s = L.filter((v) => v != null).sort((a, b) => a - b), k = s.length >> 1; return s.length ? (s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2) : null; };
const mAdd = (m, k, init) => { let v = m.get(k); if (!v) { v = init(); m.set(k, v); } return v; };
/** Everything the market study shows for one filter: `from`/`to` (publication day), `scope` ('afaqy' or 'all'), `west`, `status`
 *  ('all', 'active', 'awarded'), `q` (words in the title, entity or number) and `who` (one winner, entity, activity or bidder,
 *  pressed in a list). Every list is complete — nothing is cut to a «top ten». A value is the award as Etimad published it; where it
 *  was not published it is not guessed, and `valueKnown` says how many tenders the sums rest on. */
export function marketStats(radar, f = {}) {
  const T = (radar && radar.tenders) || [], aw = mGroup(radar && radar.awards), of = mGroup(radar && radar.offers), q = f.q ? rNorm(f.q).trim() : '';
  let rows = T.filter((x) => (!f.from || (x.published && x.published >= f.from)) && (!f.to || (x.published && x.published <= f.to))
    && (f.scope !== 'afaqy' || x.scope) && (f.scope !== 'iiot' || iiotOf(x)) && (f.scope !== 'both' || x.scope || iiotOf(x)) && (!f.west || x.west) && (!f.status || f.status === 'all' || x.status === f.status)
    // v9.68: the search also finds a tender by who won it, who bid on it and its activity — the names are looked at only when the tender's own words do not match
    && (!q || rNorm(`${x.title} ${x.entity} ${x.ref} ${x.no || ''} ${x.activity || ''}`).includes(q)
      || (aw.get(x.ref) || []).some((a) => rNorm(a.winner).includes(q)) || (of.get(x.ref) || []).some((o) => rNorm(o.bidder).includes(q)))).map((x) => {
    const A = aw.get(x.ref) || [], O = of.get(x.ref) || [], prices = O.map((o) => o.price).filter((p) => p != null), vals = A.map((a) => a.value).filter((v) => v != null);
    return { ...x, line: iiotOf(x), winners: [...new Set(A.map((a) => a.winner))], value: vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) * 100) / 100 : null,
      bidders: O.length, low: prices.length ? Math.min(...prices) : null, high: prices.length ? Math.max(...prices) : null,
      us: O.some((o) => etimadIsUs(o.bidder)) || A.some((a) => etimadIsUs(a.winner)), usWon: A.some((a) => etimadIsUs(a.winner)) };
  });
  if (f.only === 'valued') rows = rows.filter((r) => r.value != null);          // v9.68: the tenders behind a pressed number
  else if (f.only === 'bids') rows = rows.filter((r) => r.bidders > 0);
  const w = f.who;
  if (w && w.name) rows = rows.filter((r) => w.kind === 'winner' ? r.winners.includes(w.name) : w.kind === 'entity' ? r.entity === w.name : w.kind === 'activity' ? r.activity === w.name : w.kind === 'line' ? r.line === w.name
    : w.kind === 'bidder' ? (of.get(r.ref) || []).some((o) => o.bidder === w.name) : true);
  const months = new Map(), entities = new Map(), winners = new Map(), activities = new Map(), bidders = new Map(), lines = new Map();
  for (const r of rows) {
    const mo = mAdd(months, (r.published || '').slice(0, 7) || '—', () => ({ month: (r.published || '').slice(0, 7) || '—', n: 0, awarded: 0, value: 0, valued: 0 }));
    const en = mAdd(entities, r.entity || '—', () => ({ name: r.entity || '—', n: 0, active: 0, awarded: 0, value: 0, valued: 0 }));
    const ac = mAdd(activities, r.activity || '—', () => ({ name: r.activity || '—', n: 0, awarded: 0, value: 0, valued: 0 }));
    const li = r.line ? mAdd(lines, r.line, () => ({ name: r.line, n: 0, awarded: 0, value: 0, valued: 0 })) : null;
    for (const g of li ? [mo, en, ac, li] : [mo, en, ac]) { g.n++; if (r.status === 'awarded') g.awarded++; if (r.value != null) { g.value += r.value; g.valued++; } }
    if (r.status === 'active') en.active++;
    for (const a of aw.get(r.ref) || []) {
      const wi = mAdd(winners, a.winner, () => ({ name: a.winner, wins: 0, value: 0, valued: 0, tenders: new Set(), us: etimadIsUs(a.winner) }));
      if (!wi.tenders.has(r.ref)) { wi.tenders.add(r.ref); wi.wins++; }
      if (a.value != null) { wi.value += a.value; wi.valued++; }
    }
    const won = new Set(r.winners);
    for (const o of of.get(r.ref) || []) {
      const b = mAdd(bidders, o.bidder, () => ({ name: o.bidder, bids: 0, wins: 0, pass: 0, fail: 0, us: etimadIsUs(o.bidder) }));
      b.bids++; if (won.has(o.bidder)) b.wins++; if (o.tech === 'pass') b.pass++; if (o.tech === 'fail') b.fail++;
    }
  }
  const round = (L) => L.map((x) => ({ ...x, value: Math.round(x.value * 100) / 100 }));
  const vals = rows.map((r) => r.value).filter((v) => v != null), awarded = rows.filter((r) => r.status === 'awarded');
  return {
    total: rows.length, active: rows.filter((r) => r.status === 'active').length, awarded: awarded.length, other: rows.filter((r) => r.status === 'other').length,
    winnerKnown: awarded.filter((r) => r.winners.length).length, valueKnown: vals.length, value: Math.round(vals.reduce((s, v) => s + v, 0) * 100) / 100,
    medianValue: mMedian(vals), medianBidders: mMedian(rows.map((r) => r.bidders).filter((n) => n > 0)), us: rows.filter((r) => r.us).length, usWon: rows.filter((r) => r.usWon).length,
    first: rows.map((r) => r.published).filter(Boolean).sort()[0] || '', last: rows.map((r) => r.published).filter(Boolean).sort().pop() || '',
    tenders: rows.sort((a, b) => (b.published || '').localeCompare(a.published || '') || (b.value || 0) - (a.value || 0)),
    months: round([...months.values()]).sort((a, b) => a.month.localeCompare(b.month)),
    entities: round([...entities.values()]).sort((a, b) => b.n - a.n || b.value - a.value || a.name.localeCompare(b.name)),
    winners: round([...winners.values()].map(({ tenders, ...x }) => x)).sort((a, b) => b.wins - a.wins || b.value - a.value || a.name.localeCompare(b.name)),
    activities: round([...activities.values()]).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)),
    lines: round([...lines.values()]).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)),
    bidders: [...bidders.values()].map((b) => ({ ...b, winRate: b.bids ? Math.round((b.wins / b.bids) * 100) : null })).sort((a, b) => b.bids - a.bids || b.wins - a.wins || a.name.localeCompare(b.name)),
  };
}
/** The period a choice means, as publication days: 'all', 'q' (the last 3 months), 'h' (the last 6 months), 'ytd' (this year so far),
 *  a year ('2025'), a quarter ('2025-Q3'), or 'custom' with the two days given. `today` is the Saudi day. */
export function marketPeriod(kind, today, from = '', to = '') {
  const back = (m) => { const d = new Date(`${today}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() - m); return d.toISOString().slice(0, 10); };
  if (kind === 'q') return { from: back(3), to: today };
  if (kind === 'h') return { from: back(6), to: today };
  if (kind === 'ytd') return { from: `${today.slice(0, 4)}-01-01`, to: today };
  let m = /^(\d{4})$/.exec(kind || ''); if (m) return { from: `${m[1]}-01-01`, to: `${m[1]}-12-31` };
  m = /^(\d{4})-Q([1-4])$/.exec(kind || ''); if (m) { const s = (Number(m[2]) - 1) * 3 + 1, e = s + 2, last = new Date(Date.UTC(Number(m[1]), e, 0)).getUTCDate();
    return { from: `${m[1]}-${String(s).padStart(2, '0')}-01`, to: `${m[1]}-${String(e).padStart(2, '0')}-${last}` }; }
  if (kind === 'custom') return { from: /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : '', to: /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : '' };
  return { from: '', to: '' };
}
// ---------- v9.62 (ADR-0134): execution and the archive — the year from what Etimad published to what we won ----------
/** The year as a funnel: tenders Etimad published within AFAQY's scope (and in the West), the tenders that reached the register,
 *  those we decided on (a study's decision or a stage past «decide»), submitted and won. The published counts come from the radar
 *  and say nothing about a period the pulls did not cover — `covered` lists the pulls behind them. */
export function tenderFunnel(items, radar, year, keyOf) {
  const y = String(year), rows = (items || []).filter((i) => String(i.date || '').startsWith(y)), pub = ((radar && radar.tenders) || []).filter((x) => x.scope && String(x.published || '').startsWith(y));
  const decided = rows.filter((i) => !['received', 'screen', 'decide'].includes(i.stage || 'received') || !!i.studyDecision);
  const sub = rows.filter((i) => ['submitted', 'won', 'lost'].includes(i.stage)), won = rows.filter((i) => i.stage === 'won');
  const linked = radar ? rows.filter((i) => radarFind(i, radar.tenders || [], keyOf)) : [];
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
  return { year: y, published: pub.length, publishedWest: pub.filter((x) => x.west).length, reached: rows.length, linked: linked.length, decided: decided.length,
    submitted: sub.length, won: won.length, rates: { reached: pct(rows.length, pub.filter((x) => x.west).length), decided: pct(decided.length, rows.length), submitted: pct(sub.length, decided.length), won: pct(won.length, sub.length) },
    covered: ((radar && radar.pulls) || []).map((p) => ({ at: p.at, n: p.n, partial: !!p.partial, filter: p.filter || null })), partial: !!(radar && radar.partial) };
}
/** The archive: every closed tender, newest decision first, with what it ended as, why, its value, files and Etimad number. */
export function tenderArchive(items) {
  return (items || []).filter((i) => TENDER_CLOSED.includes(i.stage)).map((i) => ({ id: i.id, subject: i.subject, entity: i.entity || '', date: i.date, closedOn: i.stageAt || i.date, year: String(i.stageAt || i.date).slice(0, 4),
    stage: i.stage, reason: i.reason || '', value: typeof i.value === 'number' ? i.value : null, files: (i.files || []).length, etimadNo: i.etimadNo || '', link: i.link || '', workStart: i.workStart || '' }))
    .sort((a, b) => (b.closedOn || '').localeCompare(a.closedOn || '') || a.subject.localeCompare(b.subject));
}
// ---------- v9.57 (ADR-0130): a tender's correspondence, read from the mail thread itself ----------
// A reply carries the whole conversation beneath it. The register reads that conversation into entries — who wrote, when, and
// what — so a tender's history can be read and copied without opening Outlook. Nothing is inferred: a time the mail program
// wrote in a form with two readings is left empty, and the one-line summary is cut from the writer's own words.
const MAIL_MONTH = { january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sept: 9, sep: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
  'يناير': 1, 'فبراير': 2, 'مارس': 3, 'ابريل': 4, 'مايو': 5, 'يونيو': 6, 'يونيه': 6, 'يوليو': 7, 'يوليه': 7, 'اغسطس': 8, 'سبتمبر': 9, 'اكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12 };
const MAIL_MONTH_RE = Object.keys(MAIL_MONTH).sort((a, b) => b.length - a.length).join('|');
const mailPlain = (s) => tenderDigits(s).normalize('NFKC').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ـً-ْ‎‏‪-‮⁦-⁩]/g, '').toLowerCase();
/** An instant as the Saudi wall clock, to the minute: `2026-11-17T08:31:01Z` → `2026-11-17T11:31`. */
export const mailWall = (iso) => { const ms = Date.parse(iso || ''); return Number.isNaN(ms) ? '' : new Date(ms + 3 * 36e5).toISOString().slice(0, 16); };
/** The date a mail program wrote above a quoted message («Sent: Tuesday, November 17, 2026 11:15 AM», «17 نوفمبر 2026 11:15 ص»),
 *  as `YYYY-MM-DDTHH:MM` — or the day alone when no time is written. It is the wall clock of whoever replied, kept as written.
 *  `03/04/2026` has two readings (3 April, 4 March): nothing is guessed, and the result is empty. */
export function mailWhen(raw) {
  const s = mailPlain(raw); let y, m, d, x, end = 0;
  if ((x = s.match(new RegExp(`(?<![\\p{L}])(${MAIL_MONTH_RE})(?![\\p{L}])\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?[,،]?\\s+(20\\d{2})`, 'u')))) [m, d, y] = [MAIL_MONTH[x[1]], +x[2], +x[3]];
  else if ((x = s.match(new RegExp(`(?<!\\d)(\\d{1,2})\\s+(${MAIL_MONTH_RE})(?![\\p{L}])\\.?[,،]?\\s+(20\\d{2})`, 'u')))) [d, m, y] = [+x[1], MAIL_MONTH[x[2]], +x[3]];
  else if ((x = s.match(/(?<!\d)(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/))) [y, m, d] = [+x[1], +x[2], +x[3]];
  else if ((x = s.match(/(?<!\d)(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})(?!\d)/))) { const a = +x[1], b = +x[2]; y = +x[3];
    if (a > 12 && b <= 12) { d = a; m = b; } else if (b > 12 && a <= 12) { m = a; d = b; } else if (a === b) { d = a; m = b; } else return ''; }
  else return '';
  const day = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, ok = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(ok.valueOf()) || ok.toISOString().slice(0, 10) !== day) return '';
  end = x.index + x[0].length;
  const CLOCK = /(?<!\d)(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.m\.|p\.m\.|am|pm|صباحا|مساء|ص|م)?(?![\p{L}])/u;
  const c = s.slice(end).match(CLOCK) || s.slice(0, x.index).match(CLOCK); if (!c) return day;
  let h = +c[1]; const half = c[3] || '';
  if (half && h <= 12) h = (h % 12) + (/^(p|م)/.test(half) ? 12 : 0);
  return h < 24 && +c[2] < 60 ? `${day}T${String(h).padStart(2, '0')}:${c[2]}` : day;
}
const mailWho = (value) => {
  const s = String(value || '').replace(/<mailto:[^>]*>/gi, ' ').replace(/\[mailto:([^\]]*)\]/gi, '<$1>').replace(/\s+/g, ' ').trim();
  const addr = (s.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/) || [''])[0].toLowerCase();
  const name = s.replace(/<[^<>]*>/g, ' ').replace(/[<>"']/g, ' ').replace(/\s+/g, ' ').trim();
  return { name: (name.toLowerCase() === addr ? '' : name).slice(0, 80), addr: addr.slice(0, 120) };
};
const mailTokens = (s) => mailPlain(s).split(/[^\p{L}]+/u).filter((w) => w.length >= 3 && !['eng', 'mrs', 'the'].includes(w));
const mailHeaderKey = (label) => ({ from: 'from', 'من': 'from', sent: 'date', date: 'date', 'sent on': 'date', 'تاريخ الارسال': 'date', 'تم الارسال': 'date', 'التاريخ': 'date', 'ارسلت': 'date',
  to: 'to', 'الى': 'to', cc: 'cc', bcc: 'cc', 'نسخه': 'cc', 'نسخه الى': 'cc', subject: 'subject', 'الموضوع': 'subject' }[mailPlain(label).replace(/[*>]/g, '').replace(/\s+/g, ' ').trim()] || '');
const MAIL_CLOSING = /^[،,]?\s*(?:best regards|kind regards|warm regards|regards|thanks and regards|many thanks|thanks|thank you|sincerely|yours sincerely|مع اطيب التحيات|مع خالص التحيات|مع خالص التحيه|مع التحيه|تحياتي|وتفضلوا بقبول.*|مع وافر الاحترام|وشكرا|شكرا لكم|ولكم جزيل الشكر|مع الشكر)[\s،,.!]*$/;
const MAIL_CONTACT = /^(?:(?:m|t|tel|mob|mobile|phone|fax|جوال|هاتف|موبايل)\s*[:.]?\s*)?\+?\d[\d\s().-]{7,}$|^www\.\S+$/i;
const MAIL_GREETING = /^(?:السلام عليكم|وعليكم السلام|تحيه طيبه|الزملاء الاعزاء|الاخوه الاعزاء|الساده المحترمين|الساده الكرام|عزيزي|(?:الاستاذ|الاستاذه|المهندس|المهندسه|استاذ|مهندس|الاخ|الاخت)\s|dear\b|hi\b|hello\b|good (?:morning|afternoon|evening)\b|صباح الخير|مساء الخير|مرحبا)/;
/** The words of one message: quote marks, link targets (a sharing link carries its key) and separators removed, and everything
 *  from the signature on — a closing phrase, the writer's own name on a short line, a phone number — cut away. */
function mailWords(lines, who) {
  const mine = new Set([...mailTokens(who.name), ...mailTokens(String(who.addr || '').split('@')[0])]);
  const rows = lines.map((l) => l.replace(/^\s*(?:>\s?)+/, '').replace(/<(?:https?:|mailto:|tel:)[^>]*>/gi, ' ').replace(/https?:\/\/\S+/gi, ' ').replace(/[‎‏‪-‮⁦-⁩]/g, '').replace(/\s+/g, ' ').trim())
    .filter((l) => l && !/^[_\-=*\s]{4,}$/.test(l) && !/^-+\s*(?:original message|forwarded message|الرساله الاصليه)\s*-+$/i.test(mailPlain(l)));
  let cut = rows.length, closing = '';
  for (const [k, row] of rows.entries()) {
    const plain = mailPlain(row);
    if (MAIL_CLOSING.test(plain)) { cut = k; closing = row; break; }
    if (MAIL_CONTACT.test(plain)) { cut = k; break; }
    if (row.length <= 60 && row.split(' ').length <= 6 && !/[.!؟?:؛]$/.test(row) && mailTokens(row).some((w) => mine.has(w))) { cut = k; break; }
  }
  const kept = rows.slice(0, cut);
  return (kept.length || !closing ? kept : [closing]).join('\n').slice(0, 1500);   // a message that is only «Thanks» still says it
}
/** A mail body split into the messages it carries, oldest first: `{ at, name, addr, text }` each. `top` is the mail itself (its
 *  own time, writer and address come from the file, not from the text). A quoted message is recognised by the header block the
 *  mail program wrote above it — «From:» followed by its date line, in English or Arabic — or by «On … wrote:». A line that only
 *  begins with «From:» is ordinary text. A header whose date cannot be read keeps its place with an empty time. */
export function mailThread(body, top = {}) {
  const lines = String(body || '').replace(/\r\n?/g, '\n').split('\n'), parts = [];
  let cur = { at: String(top.at || ''), ...mailWho(`${top.name || ''} <${top.addr || ''}>`), from: 0 };
  const field = (line) => { const m = line.replace(/^\s*(?:>\s?)*/, '').match(/^\*?([^:：]{1,24}?)\*?\s*[:：]\s*(.*)$/); const key = m ? mailHeaderKey(m[1]) : ''; return key ? [key, m[2].trim()] : null; };
  for (let i = 0; i < lines.length; i++) {
    let next = null, used = 0;
    const f = field(lines[i]);
    if (f && f[0] === 'from' && f[1]) {
      const got = { from: f[1] }; let j = i + 1, last = i, gap = 0;
      for (; j < lines.length && j <= i + 14; j++) {
        if (!lines[j].trim()) { if (++gap > 2) break; continue; }
        const g = field(lines[j]); if (!g || g[0] === 'from') break;
        gap = 0; last = j; if (!(g[0] in got)) got[g[0]] = g[1]; if (g[0] === 'subject') break;
      }
      if ('date' in got) { next = { at: mailWhen(got.date), ...mailWho(got.from) }; used = last - i + 1; }
    } else {
      const one = lines[i].replace(/^\s*(?:>\s?)*/, ''), two = /^on\s/i.test(one) && !/wrote:\s*$/i.test(one) && /wrote:\s*$/i.test(lines[i + 1] || '') ? `${one} ${lines[i + 1].replace(/^\s*(?:>\s?)*/, '')}` : one;
      const w = two.match(/^on\s+(.+?\d{1,2}:\d{2}(?:\s*[ap]\.?m\.?)?)[,\s]+(.+?)\s+wrote:\s*$/i);
      if (w) { next = { at: mailWhen(w[1]), ...mailWho(w[2]) }; used = two === one ? 1 : 2; }
    }
    if (!next) continue;
    parts.push({ ...cur, to: i }); cur = { ...next, from: i + used }; i += used - 1;
  }
  parts.push({ ...cur, to: lines.length });
  return parts.map((p) => ({ at: p.at, name: p.name, addr: p.addr, text: mailWords(lines.slice(p.from, p.to), p) }))
    .filter((e, k) => k || e.at || e.name || e.addr || e.text).reverse();
}
/** One line for a message, from its own words: the greeting is skipped, the lines joined, and a long text cut at a word. */
export function mailGist(text, max = 220) {
  const rows = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const said = rows.filter((l) => !(l.split(' ').length <= 8 && MAIL_GREETING.test(mailPlain(l))));
  const line = (said.length ? said : rows).join(' · ').replace(/\s+/g, ' ');
  if (line.length <= max) return line;
  const part = line.slice(0, max + 1), at = part.lastIndexOf(' ');
  return `${part.slice(0, at > max * 0.5 ? at : max).trim()}…`;
}
// the same writer: by address when both carry one; otherwise every word of the shorter name is in the longer («Eng. Zaid Fares»
// is «Zaid Fares»; two people who share a first name are not one)
function mailSameWriter(a, b) {
  if (a.addr && b.addr) return a.addr === b.addr;
  const words = (e, name) => new Set(name && e.name ? mailTokens(e.name) : mailTokens(String(e.addr || '').split('@')[0]));
  const both = !!(a.name && b.name), x = words(a, both), y = words(b, both), [small, big] = x.size <= y.size ? [x, y] : [y, x];
  return small.size > 0 && [...small].every((w) => big.has(w));
}
const mailMinutes = (x, y) => (x.length > 10 && y.length > 10 ? Math.round((Date.parse(`${y}:00Z`) - Date.parse(`${x}:00Z`)) / 6e4) : null);
/** Two readings of one conversation joined: a message already there (the same writer within a minute, or — with no readable
 *  time — the same writer and words) is not added again; it keeps its mark, gains an address and takes the fuller text. Dated
 *  entries come first, oldest to newest; the few without a readable time follow. */
export function tenderThreadMerge(have, add) {
  const out = [];
  for (const e of [...(have || []), ...(add || [])]) {
    if (!e) continue;
    const squash = (t) => mailPlain(t).replace(/\s+/g, '').slice(0, 60);
    const old = out.find((o) => mailSameWriter(o, e) && (o.at && e.at ? (o.at.length > 10 && e.at.length > 10 ? Math.abs(mailMinutes(o.at, e.at)) <= 1 : o.at.slice(0, 10) === e.at.slice(0, 10) && squash(o.text) === squash(e.text)) : !o.at && !e.at && squash(o.text) === squash(e.text)));
    if (!old) { out.push({ at: e.at || '', name: e.name || '', addr: e.addr || '', text: e.text || '', ...(e.mark ? { mark: e.mark } : {}) }); continue; }
    if (!old.addr && e.addr) old.addr = e.addr; if (!old.name && e.name) old.name = e.name;
    if ((e.text || '').length > old.text.length) old.text = e.text; if (e.mark && !old.mark) old.mark = e.mark;
  }
  const dated = out.filter((e) => e.at).sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return [...dated, ...out.filter((e) => !e.at)].slice(0, 300);
}
/** Full working days (Sunday to Thursday) strictly between two days — neither end counted, because the day a tender arrives and
 *  the day it closes are not whole days of work. `null` when a day is missing or the second is before the first. */
export function workDaysBetween(from, to) {
  const a = Date.parse(`${from}T00:00:00Z`), b = Date.parse(`${to}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '') || Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  let n = 0; for (let t = a + 864e5; t < b; t += 864e5) if (![5, 6].includes(new Date(t).getUTCDay())) n++;
  return n;
}
/** What a tender's correspondence says in numbers: how many messages and writers, the first and the last message, the
 *  submission deadline as the register holds it, the full working days between the first message and that deadline, and — only
 *  when the manager marked the message that handed the offer over — how many minutes before the deadline it was sent
 *  (negative: after it). Nothing is worked out from a time that was not read. */
export function tenderThreadFacts(item, thread = item && item.thread) {
  const list = Array.isArray(thread) ? thread : [], dated = list.filter((e) => e.at), first = dated[0] || null, last = dated.at(-1) || null;
  const writers = []; for (const e of list) if ((e.name || e.addr) && !writers.some((w) => mailSameWriter(w, e))) writers.push(e);
  const dueAt = item && item.due ? item.due + (item.dueTime ? `T${item.dueTime}` : '') : '';
  const handover = dated.filter((e) => e.mark === 'handover').at(-1) || null;
  return { n: list.length, people: writers.length, first, last, dueAt, workDays: first && item && item.due ? workDaysBetween(first.at.slice(0, 10), item.due) : null,
    handover, leadMin: handover && dueAt ? mailMinutes(handover.at, dueAt) : null };
}
// ---------- v9.58 (ADR-0131): following a tender from arrival to result ----------
/** The tenders team in Riyadh asks for the offer at least this many working days before the platform closes (their mail of 17 Nov 2026). */
export const TENDER_HANDOVER_DAYS = 2;
const tdDayShift = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const tdWorkDay = (day) => ![5, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay());
/** When the offer must reach the tenders team: TENDER_HANDOVER_DAYS working days (Sunday to Thursday) before the deadline, at the
 *  deadline's own hour when it has one. Empty without a deadline. */
export function tenderHandoverDue(item) {
  if (!item || !/^\d{4}-\d{2}-\d{2}$/.test(item.due || '')) return '';
  let day = item.due, left = TENDER_HANDOVER_DAYS;
  while (left > 0) { day = tdDayShift(day, -1); if (tdWorkDay(day)) left--; }
  return day + (item.dueTime ? `T${item.dueTime}` : '');
}
// ---------- v9.73 (ADR-0143): one agenda for every date of a tender ----------
/** Head office asks for the guarantee's cost this many working days before the platform closes (their mail of 17 Nov 2026). */
export const TENDER_BOND_DAYS = 3;
const tdBack = (day, n) => { let d = day, left = n; while (left > 0) { d = tdDayShift(d, -1); if (tdWorkDay(d)) left--; } return d; };
const tdNoBond = (v) => /^\s*(لا|بدون|غير مطلوب|none|no\b|n\/a|0\s*%?\s*$|—|-)/i.test(String(v || ''));
const TD_DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Every date still ahead of an open tender, in calendar order: the platform's own (inquiries, visit, closing, opening) and the
 *  internal ones worked out from them — inquiries uploaded a working day early, the guarantee's cost and the complete offer to
 *  head office. A date whose work is done is not listed: nothing internal once handed over, only the opening once submitted. */
export function tenderMilestones(item) {
  if (!item || TENDER_CLOSED.includes(item.stage)) return [];
  const ok = (v) => TD_DAY.test(v || ''), out = [], add = (key, day, time) => { if (ok(day)) out.push({ key, day, time: time || '' }); };
  const sent = item.stage === 'submitted', handed = sent || item.stage === 'ready' || !!tenderHandedAt(item);
  if (!handed) {
    if (ok(item.askDue)) { add('askUp', tdBack(item.askDue, 1)); add('askDue', item.askDue, item.askDueTime); }
    add('visit', item.visit, item.visitTime);
    if (ok(item.due)) { if (!tdNoBond(item.bond)) add('bondCost', tdBack(item.due, TENDER_BOND_DAYS)); add('handover', tenderHandoverDue(item).slice(0, 10), item.dueTime); }
  }
  if (!sent) add('due', item.due, item.dueTime);
  add('openAt', item.openAt, item.openAtTime);
  const order = ['askUp', 'askDue', 'visit', 'bondCost', 'handover', 'due', 'openAt'];
  return out.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : order.indexOf(a.key) - order.indexOf(b.key)));
}
const TD_INTERNAL = ['askUp', 'bondCost', 'handover'];
/** The agenda of all open tenders from `today` for `days` days, nearest first. An internal date that was missed stays on top
 *  while its tender can still be saved (a week at most); a platform date that passed is history and is not listed. */
export function tenderAgenda(items, today, days = 14) {
  const gap = (d) => Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 864e5), out = [];
  for (const item of Array.isArray(items) ? items : []) {
    const ms = tenderMilestones(item), askOpen = TD_DAY.test(item.askDue || '') && item.askDue >= today;
    for (const m of ms) {
      const left = gap(m.day);
      if (left > days || left < -7) continue;
      if (left < 0 && (!TD_INTERNAL.includes(m.key) || (m.key === 'askUp' && !askOpen))) continue;
      out.push({ id: item.id, subject: item.subject || '', entity: item.entity || '', ...m, left, tone: left < 0 ? 'late' : left === 0 ? 'today' : left <= 3 ? 'soon' : 'later' });
    }
  }
  return out.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
export const tenderNoticeId = (x) => `${x.id}:${x.key}:${x.day}`;
/** What deserves a notice now: a day away or less (or missed), and not said before. */
export function tenderNotices(agenda, seen) {
  const said = new Set(Array.isArray(seen) ? seen : []);
  return (Array.isArray(agenda) ? agenda : []).filter((x) => x.left <= 1 && !said.has(tenderNoticeId(x)));
}
/** When the offer was handed over: the message the manager marked as the hand-over, else the day it was marked ready. Never guessed. */
export function tenderHandedAt(item) {
  const marked = (Array.isArray(item && item.thread) ? item.thread : []).filter((e) => e && e.mark === 'handover' && e.at).at(-1);
  return marked ? marked.at : (item && item.readyOn) || '';
}
/** Was the offer handed over by the hand-over date? null when either side is unknown. By the hour when both carry one, by the day otherwise. */
export function tenderHandoverOnTime(item) {
  const due = tenderHandoverDue(item), at = tenderHandedAt(item);
  if (!due || !at) return null;
  return due.length > 10 && at.length > 10 ? at <= due : at.slice(0, 10) <= due.slice(0, 10);
}
/** The time a tender had: full working days between its arrival and the deadline; «short» under a working week; and whether
 *  the hand-over date fell before the tender even arrived. Nothing is claimed without a deadline. */
export function tenderLead(item) {
  const workDays = workDaysBetween(item.date, item.due), hand = tenderHandoverDue(item);
  return { workDays, short: workDays != null && workDays < 5, handoverBeforeArrival: !!hand && !!item.date && hand.slice(0, 10) < item.date };
}
/** Minutes from `now` to `at`, both on the Saudi wall clock (`YYYY-MM-DDTHH:MM`); a day alone ends at 23:59. null without a target. */
export function minutesUntil(at, now) {
  if (!at || !now) return null;
  const target = Date.parse(`${at.length > 10 ? at : `${at}T23:59`}:00Z`), from = Date.parse(`${now.slice(0, 16)}:00Z`);
  return Number.isNaN(target) || Number.isNaN(from) ? null : Math.round((target - from) / 6e4);
}
// the fields each stage needs, in the order the window lists them; a field that already holds a value is always shown
const TENDER_FIELDS_ARRIVED = ['date', 'owner', 'etimadNo', 'entity', 'site', 'askDue', 'askDueTime', 'visit', 'due', 'dueTime', 'fees', 'bond', 'note'];   // the booklet's own facts
const TENDER_FIELD_ORDER = ['date', 'owner', 'etimadNo', 'entity', 'site', 'value', 'fees', 'bond', 'askDue', 'askDueTime', 'visit', 'due', 'dueTime', 'openAt', 'decidedOn', 'readyOn', 'submittedOn', 'submitNo', 'workStart', 'study', 'reason', 'note'];
export const TENDER_CLOSED = ['won', 'lost', 'missed', 'cancelled', 'declined'];
export function tenderShownFields(item) {
  const st = item.stage || 'received', want = new Set(TENDER_FIELDS_ARRIVED);
  if (!['received', 'screen'].includes(st)) for (const k of ['value', 'openAt', 'study']) want.add(k);
  if (['prep', 'ready', 'submitted', 'won', 'lost', 'missed', 'declined'].includes(st)) want.add('decidedOn');
  if (['ready', 'submitted', 'won', 'lost', 'missed'].includes(st)) want.add('readyOn');
  if (['submitted', 'won', 'lost'].includes(st)) { want.add('submittedOn'); want.add('submitNo'); }
  if (st === 'won') want.add('workStart');   // v9.62: execution starts here
  if (['declined', 'lost', 'missed', 'cancelled'].includes(st)) want.add('reason');
  for (const k of TENDER_FIELD_ORDER) if (item[k] !== '' && item[k] != null) want.add(k);
  return TENDER_FIELD_ORDER.filter((k) => want.has(k));
}
/** A year of tenders in one place: what arrived, what we joined, submitted, won, lost or missed, and why; the money; how much time
 *  the tenders gave; whether the offers reached the tenders team on time; by month and by entity. Only tenders that arrived that year. */
export function tenderYearReport(items, year) {
  const rows = (items || []).filter((i) => String(i.date || '').startsWith(String(year))).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const is = (i, ...s) => s.includes(i.stage), early = ['received', 'screen', 'decide'];
  const joinedOf = (L) => L.filter((i) => !is(i, 'declined', 'cancelled', ...early)), subOf = (L) => L.filter((i) => is(i, 'submitted', 'won', 'lost'));
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null), sum = (L) => L.reduce((n, i) => n + (num(i.value) || 0), 0);
  const won = rows.filter((i) => is(i, 'won')), lost = rows.filter((i) => is(i, 'lost'));
  const leads = rows.map((i) => tenderLead(i).workDays).filter((n) => n != null);
  const hand = rows.map(tenderHandoverOnTime).filter((x) => x != null);
  const reasons = Object.fromEntries(['declined', 'lost', 'missed', 'cancelled'].map((s) => [s, rows.filter((i) => is(i, s)).map((i) => ({ subject: i.subject, reason: i.reason || '' }))]));
  const months = [...new Set(rows.map((i) => i.date.slice(0, 7)))].map((month) => { const L = rows.filter((i) => i.date.startsWith(month));
    return { month, n: L.length, joined: joinedOf(L).length, submitted: subOf(L).length, won: L.filter((i) => is(i, 'won')).length, missed: L.filter((i) => is(i, 'missed')).length }; });
  const entities = [...new Set(rows.map((i) => String(i.entity || '').trim()))].map((entity) => { const L = rows.filter((i) => String(i.entity || '').trim() === entity);
    return { entity, n: L.length, submitted: subOf(L).length, won: L.filter((i) => is(i, 'won')).length }; })
    .sort((a, b) => b.n - a.n || (!a.entity) - (!b.entity) || a.entity.localeCompare(b.entity));
  return { year: String(year), n: rows.length, joined: joinedOf(rows).length, submitted: subOf(rows).length, won: won.length, lost: lost.length,
    missed: rows.filter((i) => is(i, 'missed')).length, declined: rows.filter((i) => is(i, 'declined')).length, cancelled: rows.filter((i) => is(i, 'cancelled')).length,
    open: rows.filter((i) => is(i, ...early, 'prep', 'ready', 'submitted')).length,
    winRate: won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : null,
    value: { all: sum(rows), submitted: sum(subOf(rows)), won: sum(won), known: rows.filter((i) => num(i.value) != null).length },
    lead: { known: leads.length, avgWorkDays: leads.length ? Math.round((leads.reduce((a, b) => a + b, 0) / leads.length) * 10) / 10 : null, short: rows.filter((i) => tenderLead(i).short).length },
    handover: { known: hand.length, onTime: hand.filter(Boolean).length }, reasons, months, entities, rows };
}
export function cleanTenderDetails(item) {
  const string = (value, max) => typeof value === 'string' ? value.slice(0, max) : '';
  const list = (value) => Array.isArray(value) ? value : [];
  const time = (value) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : '';
  const day = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
  const fields = TENDER_DATE_FIELDS;
  return {
    dateSource: ['received','sent','manual','thread'].includes(item.dateSource) ? item.dateSource : '',   // 'thread' (v9.57): the day of the oldest message quoted in a reply
    studySummary: string(item.studySummary, 4000),
    dueTime: item.due ? time(item.dueTime) : '', askDueTime: item.askDue ? time(item.askDueTime) : '',
    dateSources: Object.fromEntries(fields.filter((key) => ['mail','document','manual','analyzer','etimad'].includes(item.dateSources?.[key])).map((key) => [key,item.dateSources[key]])),
    // ADR-0126: what the Tender Analyzer filled, its evidence, and its bid decision
    fieldSources: Object.fromEntries(TENDER_STUDY_FIELDS.filter((key) => ['analyzer','etimad'].includes(item.fieldSources?.[key])).map((key) => [key,item.fieldSources[key]])),
    // v9.60 (ADR-0132): the tender on Etimad — its page, when it was last read from a pull, and what Etimad replaced
    link: /^https:\/\/tenders\.etimad\.sa\//i.test(item.link || '') ? string(item.link, 400) : '', etimadAt: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(item.etimadAt || '') ? item.etimadAt : '',
    etimadWas: list(item.etimadWas).filter((w) => w && [...fields, 'fees'].includes(w.field)).slice(-10).map((w) => ({ field: w.field, was: string(w.was, 40), src: ['mail','document','manual','analyzer','etimad',''].includes(w.src) ? w.src : '' })),
    evidence: Object.fromEntries(Object.entries(item.evidence && typeof item.evidence === 'object' ? item.evidence : {}).filter(([key]) => [...TENDER_STUDY_FIELDS, ...fields].includes(key)).map(([key, v]) => [key, { file: string(v?.file, 160), page: Number.isSafeInteger(v?.page) && v.page > 0 ? v.page : null, quote: string(v?.quote, 240) }])),
    studyDecision: ['go','no-go','review'].includes(item.studyDecision) ? item.studyDecision : '', studyWhy: string(item.studyWhy, 400), studyAt: string(item.studyAt, 35),
    ...(cleanAnalyzer(item.analyzer) ? { analyzer: cleanAnalyzer(item.analyzer) } : {}),   // v9.64 (ADR-0137): the study by the program on this computer
    messages: list(item.messages).filter((m) => m && string(m.key, 400)).map((m) => ({
      key: string(m.key, 400), messageId: string(m.messageId, 320), hash: string(m.hash, 64),
      subject: string(m.subject, 300), sender: string(m.sender, 120), date: day(m.date), warnings: Number.isSafeInteger(m.warnings) && m.warnings > 0 ? m.warnings : 0,
      schedule: Object.fromEntries(fields.map((key) => [key,list(m.schedule?.[key]).filter((entry) => entry && day(entry.date)).map((entry) => ({date:day(entry.date),time:time(entry.time)}))]))
    })),
    files: list(item.files).filter((file) => file && string(file.id, 150) && TENDER_FILE_KINDS.includes(file.kind) && file.blob instanceof Blob).map((file) => ({
      id: string(file.id, 150), name: string(file.name, 240) || 'attachment', kind: file.kind, kindManual:!!file.kindManual, kindAt:string(file.kindAt,35), mailKey: string(file.mailKey, 400), blob:file.blob,
      ...(cleanTenderAnalysis(file.analysis) ? {analysis:cleanTenderAnalysis(file.analysis)} : {})
    })),
    removedFiles: [...new Set(list(item.removedFiles).filter((id) => typeof id === 'string' && id.length && id.length <= 150))],
    // v9.58 (ADR-0131): the questions raised to the entity on the platform — the branch cannot see them there, so they are kept here
    inquiries: list(item.inquiries).filter((q) => q && string(q.id, 80) && String(q.text || '').trim()).slice(0, 60).map((q) => ({
      id: string(q.id, 80), text: String(q.text).trim().slice(0, 600), askedOn: day(q.askedOn), answeredOn: day(q.answeredOn), answer: string(q.answer, 1500) })),
    // v9.57 (ADR-0130): the conversation read from the mails — a time, a writer and the words; a mark only where the manager set one
    thread: list(item.thread).filter((e) => e && (string(e.name, 80) || string(e.addr, 120) || string(e.text, 1500))).slice(0, 300).map((e) => ({
      at: /^\d{4}-\d{2}-\d{2}(?:T(?:[01]\d|2[0-3]):[0-5]\d)?$/.test(e.at) ? e.at : '', name: string(e.name, 80), addr: string(e.addr, 120), text: string(e.text, 1500), ...(e.mark === 'handover' ? { mark: 'handover' } : {})
    })),
    activity: list(item.activity).filter((entry) => entry && string(entry.id, 150) && ['email','add','remove','stage','date','study','read','category','thread','inq','etimad'].includes(entry.action)).map((entry) => ({
      id: string(entry.id, 150), action: entry.action, at: string(entry.at, 35), label: string(entry.label, 300)
    })),
  };
}
export function mergeTenderDetails(base, other) {
  const union = (a, b, key) => [...new Map([...(b || []), ...(a || [])].map((entry) => [entry[key], entry])).values()];
  const removedFiles = [...new Set([...(base.removedFiles || []), ...(other.removedFiles || [])])];
  const removed = new Set(removedFiles);
  const byFile = new Map((other.files || []).map(file => [file.id,file]));
  for (const file of base.files || []) {
    const older = byFile.get(file.id);
    if (!older) { byFile.set(file.id,file); continue; }
    const classification = [file,older].filter(entry=>entry.kindManual).sort((a,b)=>String(b.kindAt || '').localeCompare(String(a.kindAt || '')))[0] || file;
    const analysis = [file.analysis,older.analysis].filter(Boolean).sort((a,b)=>String(b.readAt || '').localeCompare(String(a.readAt || '')))[0];
    byFile.set(file.id,{...file,kind:classification.kind,kindManual:!!classification.kindManual,kindAt:classification.kindAt || '',...(analysis ? {analysis} : {})});
  }
  return {
    messages: union(base.messages,other.messages,'key'),
    files: [...byFile.values()].filter((file) => !removed.has(file.id)),
    removedFiles,
    thread: tenderThreadMerge(base.thread,other.thread),
    // an inquiry answered on one device stays answered, whichever side the merge starts from
    inquiries: [...new Map([...(other.inquiries || []), ...(base.inquiries || [])].map((q) => [q.id, q])).values()].map((q) => { const twin = [...(base.inquiries || []), ...(other.inquiries || [])].find((x) => x.id === q.id && (x.answer || x.answeredOn)); return twin || q; }),
    activity: union(base.activity,other.activity,'id').sort((a,b) => b.at.localeCompare(a.at)),
  };
}
// Project follow-up is additive: tender decisions and original register fields remain the source.
const PW_SCHEMA = 'afaqy-project-followup/v1';
const PW_FIELDS = ['owner','action','actionOwner','actionDue','risk','execution','award','collected','milestones'];
const pwText = (s,n=500) => String(s ?? '').trim().slice(0,n);
const pwDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
const pwMailRef = (s) => 'm:'+String(s||'').replace(/^\s*((re|fw|fwd)\s*:|رد\s*:|إعادة توجيه\s*:)\s*/gi,'').replace(/\s+/g,' ').trim().toLowerCase();
const pwRefs = (r) => [...new Set([r.id,r.tender && `t:${r.tender}`,...(r.threads||[]).filter(p=>p.project).map(p=>pwMailRef(p.project))].filter(Boolean))];
const pwMoney = (v) => v === '' || v == null ? null : Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.round(Number(v)*100)/100 : null;
export function cleanProjectWork(raw) {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {schema:PW_SCHEMA,revision:pwText(raw?.revision,120),items:items.filter(x=>x && typeof x.id==='string' && Array.isArray(x.refs)).map(x=>({
    id:pwText(x.id,200),refs:[...new Set(x.refs.map(s=>pwText(s,1000)).filter(Boolean))],owner:pwText(x.owner,120),action:pwText(x.action),actionOwner:pwText(x.actionOwner,120),actionDue:pwDate(x.actionDue)?x.actionDue:'',risk:pwText(x.risk),
    execution:['not_started','ongoing','on_hold','delivered'].includes(x.execution)?x.execution:'not_started',award:pwMoney(x.award),collected:pwMoney(x.collected),
    milestones:(Array.isArray(x.milestones)?x.milestones:[]).filter(m=>m && pwText(m.title,160)).map(m=>({id:pwText(m.id,120),title:pwText(m.title,160),weight:Number.isFinite(Number(m.weight))?Math.max(0,Number(m.weight)):0,done:!!m.done})),
    history:(Array.isArray(x.history)?x.history:[]).filter(e=>e && e.id && !Number.isNaN(Date.parse(e.at))).map(e=>({id:pwText(e.id,200),at:String(e.at),note:pwText(e.note,1000),changes:Object.fromEntries(Object.entries(e.changes||{}).filter(([k,v])=>PW_FIELDS.includes(k) && v && typeof v==='object').map(([k,v])=>[k,{before:v.before,after:v.after}]))}))
  }))};
}
export function projectWorkFind(data,row) {
  const refs = pwRefs(row), hits = (data?.items || []).filter(x=>x.refs.some(ref=>refs.includes(ref)));
  if(hits.length>1) throw Error('project identity conflict');
  return hits[0] || null;
}
export function projectProgress(work) {
  const list=work?.milestones || [], total=list.reduce((n,m)=>n+m.weight,0);
  return total>0?Math.round(100*list.filter(m=>m.done).reduce((n,m)=>n+m.weight,0)/total):null;
}
export function projectWorkUpdate(raw,row,patch,{at,id,note=''}={}) {
  if(!id || Number.isNaN(Date.parse(at))) throw Error('event required');
  const data=cleanProjectWork(raw), existing=projectWorkFind(data,row);
  const before=existing || cleanProjectWork({items:[{id,refs:pwRefs(row),execution:['ongoing','delivered'].includes(row.status)?row.status:'not_started'}]}).items[0];
  if(patch.actionDue && !pwDate(patch.actionDue)) throw Error('invalid date');
  for(const k of ['award','collected']) if(patch[k]!==undefined && patch[k]!==null && patch[k]!=='' && pwMoney(patch[k])===null) throw Error('invalid money');
  if(patch.execution && !['not_started','ongoing','on_hold','delivered'].includes(patch.execution)) throw Error('invalid execution');
  const merged={...before,...Object.fromEntries(PW_FIELDS.filter(k=>k in patch).map(k=>[k,patch[k]])),refs:[...new Set([...before.refs,...pwRefs(row)])]};
  if(merged.execution!=='not_started' && !['won','ongoing','delivered'].includes(row.bidStatus || row.status)) throw Error('award required');
  if((merged.milestones||[]).some(m=>!pwText(m.title,160)|| !Number.isFinite(Number(m.weight)) || Number(m.weight)<=0)) throw Error('invalid milestones');
  const next=cleanProjectWork({items:[merged]}).items[0];
  if(next.execution==='delivered' && next.milestones.some(m=>!m.done)) throw Error('unfinished milestones');
  const changes={};for(const key of PW_FIELDS) if(JSON.stringify(before[key])!==JSON.stringify(next[key])) changes[key]={before:before[key],after:next[key]};
  if(!Object.keys(changes).length && !pwText(note,1000) && existing && JSON.stringify(before.refs)===JSON.stringify(next.refs)) return data;
  next.history=[...before.history,{id,at,note:pwText(note,1000),changes}];
  if(existing) data.items[data.items.indexOf(existing)]=next;else data.items.push(next);
  return data;
}
export function mergeProjectWork(base,incoming) {
  const result=cleanProjectWork(base);
  for(const other of cleanProjectWork(incoming).items) {
    const hits=result.items.filter(x=>x.id===other.id || x.refs.some(ref=>other.refs.includes(ref)));
    if(hits.length>1) throw Error('project identity conflict');
    if(!hits.length) {result.items.push(other);continue;}
    const local=hits[0], seen=new Set(local.history.map(e=>e.id));
    // Local current fields win restore conflicts; unique history is retained as evidence.
    local.history=[...local.history,...other.history.filter(e=>!seen.has(e.id))].sort((a,b)=>a.at.localeCompare(b.at));
    local.refs=[...new Set([...local.refs,...other.refs])];
  }
  return result;
}
export function projectReport(rows,work,filters={},today=saudiDay(new Date().toISOString())) {
  if((filters.from && !pwDate(filters.from)) || (filters.to && !pwDate(filters.to)) || (filters.from && filters.to && filters.from>filters.to)) throw Error('invalid date range');
  const unique=new Map();
  for(const row of rows) {
    if(unique.has(row.id)) continue;
    const followup=projectWorkFind(work,row) || cleanProjectWork({items:[{id:row.id,refs:pwRefs(row),execution:['ongoing','delivered'].includes(row.status)?row.status:'not_started'}]}).items[0];
    const bidStatus=row.bidStatus || row.status;
    const status=['won','ongoing','delivered'].includes(bidStatus) && ['ongoing','delivered'].includes(followup.execution)?followup.execution:row.status;
    const r={...row,bidStatus,status,followup,progress:projectProgress(followup)};
    if(filters.client && r.client!==filters.client || filters.owner && followup.owner!==filters.owner || filters.status && r.status!==filters.status) continue;
    if(filters.q && !`${r.name} ${r.client||''} ${followup.owner} ${followup.action}`.toLowerCase().includes(filters.q.toLowerCase())) continue;
    unique.set(row.id,r);
  }
  const selected=[...unique.values()], events=[], actions=[];
  const within=at=>{const day=saudiDay(at);return (!filters.from||day>=filters.from)&&(!filters.to||day<=filters.to);};
  for(const r of selected) {
    for(const e of r.followup.history) if(within(e.at)) events.push({...e,projectId:r.id,project:r.name,source:'followup'});
    for(const e of r.tenderActivity||[]) if(e.at && within(e.at)) events.push({id:e.id||`${r.id}:${e.at}:${e.action}`,at:e.at,note:e.label||'',action:e.action,projectId:r.id,project:r.name,source:'tender',changes:{}});
    if(r.followup.action) actions.push({projectId:r.id,project:r.name,action:r.followup.action,owner:r.followup.actionOwner||r.followup.owner,due:r.followup.actionDue,overdue:!!r.followup.actionDue && r.followup.actionDue<today});
  }
  actions.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));events.sort((a,b)=>b.at.localeCompare(a.at));
  const sum=fn=>selected.reduce((n,r)=>n+(Number(fn(r))||0),0);
  return {rows:selected,events,actions,filters:{...filters},today,totals:{count:selected.length,offer:sum(r=>r.value),award:sum(r=>r.followup.award),collected:sum(r=>r.followup.collected),awardMissing:selected.filter(r=>['won','ongoing','delivered'].includes(r.status)&&r.followup.award==null).length,overdue:actions.filter(a=>a.overdue).length}};
}

/**
 * ADR-0119 — where each page of a long window begins. `boxes` are the things that must not be cut (rows, cards, paragraphs,
 * fields), in the window's own coordinates: { top, bottom, lead, head } — `lead` is the room a pinned table heading takes above a
 * row, `head` marks a heading. `view` is the window's height, `barH` the pager's, `inset` what is pinned at the top (the ✕ bar).
 * A page starts only where nothing is cut; a heading is never left alone at a page's foot; a thing taller than a page is shown in
 * screens, and a mostly empty page does not stop before it. Returns { starts: [{ y, top }], end }: `y` is where the page's first
 * thing begins, `top` the scroll position that shows it under what is pinned.
 */
export function pageStarts(boxes, { view, barH, inset = 0 }) {
  const list = (boxes || []).filter((b) => b && Number.isFinite(b.top) && Number.isFinite(b.bottom) && b.bottom > b.top).map((b) => ({ top: b.top, bottom: b.bottom, lead: b.lead || 0, head: !!b.head }));
  list.sort((x, y) => x.top - y.top || y.bottom - x.bottom);
  const end = list.reduce((m, b) => Math.max(m, b.bottom), 0), room = view - barH - inset;
  const cuts = []; let reach = 0;
  for (const b of list) {
    if (reach <= b.top + 1 && b.top > 1 && (!cuts.length || b.top - cuts[cuts.length - 1].y > 1)) cuts.push({ y: b.top, lead: b.lead, head: b.head });
    else if (cuts.length && Math.abs(cuts[cuts.length - 1].y - b.top) <= 1) cuts[cuts.length - 1].lead = Math.max(cuts[cuts.length - 1].lead, b.lead);
    reach = Math.max(reach, b.bottom);
  }
  const starts = [{ y: 0, top: 0 }];
  if (!(room > 0)) return { starts, end };
  for (let guard = 0; guard < 2000; guard += 1) {
    const cur = starts[starts.length - 1], limit = cur.top + view - barH; if (limit >= end - 1) break;
    let pick = null; for (const k of cuts) { if (k.y > limit + 0.5) break; if (k.y - inset - k.lead > cur.top + 1) pick = k; }
    if (pick) { const tallest = list.reduce((m, b) => (Math.abs(b.top - pick.y) <= 1 ? Math.max(m, b.bottom - b.top) : m), 0); if (tallest > room && pick.y - (cur.top + inset) < room * 0.5) pick = null; }
    if (pick) { const j = cuts.indexOf(pick); if (j > 0 && cuts[j - 1].head && cuts[j - 1].y - inset - cuts[j - 1].lead > cur.top + 1 && !list.some((b) => b.top > cuts[j - 1].y + 1 && b.top < pick.y - 1)) pick = cuts[j - 1]; }
    starts.push(pick ? { y: pick.y, top: Math.max(0, pick.y - inset - pick.lead) } : { y: cur.top + inset + room, top: cur.top + room });
  }
  return { starts, end };
}
