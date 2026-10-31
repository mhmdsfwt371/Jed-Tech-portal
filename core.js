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
  if (!teamMode) return hash;
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
export const GUIDE = [['g_tools_h', 'g_tools_b'], ['g_me_h', 'g_me_b'], ['g_team_h', 'g_team_b'], ['g_weights_h', 'g_weights_b'], ['g_mgr_h', 'g_mgr_b'], ['g_pro_h', 'g_pro_b'], ['g_data_h', 'g_data_b'], ['g_parts_h', 'g_parts_b'], ['g_kpi_h', 'g_kpi_b'], ['g_privacy_h', 'g_privacy_b']];
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
export const saudiDay = (iso) => (iso ? ymd(new Date(Date.parse(iso) + 3 * 3600000)) : null);

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
      part: typeof raw.part === 'string' ? raw.part : null, sample: raw.sample === true,
      people, tasks: markRd(tasks, raw.rdTaskIds),
      rdKnown: Array.isArray(raw.rdTaskIds),
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
      sample: out[i].sample && incoming.sample,
      teamTypes: incoming.teamTypes && Object.keys(incoming.teamTypes).length ? incoming.teamTypes : out[i].teamTypes,
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
export function factor1(tasks, { range = null, team = null } = {}) {
  const keep = team ? new Set(team) : null;
  const rows = new Map();
  const row = (id, name) => {
    if (!rows.has(id)) rows.set(id, { id, name, assigned: 0, done: 0, cohortDone: 0, open: 0, cancelled: 0, created: 0, fromEmail: 0, selfLogged: 0, rd: 0, durations: [] });
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
    }
    if (doneHere) {
      r.done++;
      if (x.rd === true) r.rd++;
      if (x.completedAt) {
        const h = (Date.parse(x.completedAt) - Date.parse(x.createdAt)) / 3600000;
        if (h >= 0) r.durations.push(h);
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
    };
  };
  const people = [...rows.values()].filter((r) => r.id !== GROUP && (r.assigned > 0 || r.created > 0 || r.done > 0 || r.open > 0 || (keep && keep.has(r.id)))).map(finish)
    .sort((a, b) => b.done - a.done || b.assigned - a.assigned || String(a.name).localeCompare(String(b.name)));
  const group = rows.has(GROUP) ? finish(rows.get(GROUP)) : null;
  const all = { id: '__team__', name: '__team__', assigned: 0, done: 0, cohortDone: 0, open: 0, cancelled: 0, created: 0, fromEmail: 0, selfLogged: 0, rd: 0, durations: [] };
  for (const r of rows.values()) {
    all.assigned += r.assigned; all.done += r.done; all.cohortDone += r.cohortDone; all.open += r.open; all.cancelled += r.cancelled;
    all.fromEmail += r.fromEmail; all.selfLogged += r.selfLogged; all.rd += r.rd; all.created += r.created; all.durations.push(...r.durations);
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
    .map((r) => ({ c: String(r.c), a: (Array.isArray(r.a) ? r.a : []).map(String).slice(0, 40), d: Number(r.d) || 0, s: r.s == null ? null : String(r.s) }));
  return { reports: { key: rangeKey({ from, to }), schema: REPORTS_SCHEMA, range: { from, to }, branch: String(raw.branch || ''),
    extractedAt: toIso(raw.extractedAt), techPoints, afterSales: rows, activities, accounts, notes: Array.isArray(raw.notes) ? raw.notes.map(String).slice(0, 30) : [] } };
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
export function buildManagerBookmarklet(from, to, branch = JEDDAH_BRANCH, lang = 'ar', delivery = 'download', portalUrl = '') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) throw new Error('invalid range');
  const mode = delivery === 'auto' ? 'auto' : 'download';
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
  const code = `(async()=>{const M=${JSON.stringify(msg)},FROM=${JSON.stringify(from)},TO=${JSON.stringify(to)},BR=${JSON.stringify(String(branch))},DEL=${JSON.stringify(mode)},PORTAL=${JSON.stringify(targetUrl ? targetUrl.origin + targetUrl.pathname : '')},PACKET=${JSON.stringify(MANAGER_AUTO_SCHEMA)};
if(location.hostname!=='myafaqy.com'){alert(M[0]);return}
const tk=localStorage.getItem('token');if(!tk){alert(M[1]);return}
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
const post=async(path,body)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{method:'POST',headers:H,body:JSON.stringify(body)});if(!r.ok)throw new Error(path+' HTTP '+r.status);const j=await r.json();if(j&&j.success===false)throw new Error(j.message||path+' refused');return j};
const get=async(path)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{headers:H});if(!r.ok)throw new Error(path+' HTTP '+r.status);return r.json()};
const dl=(name,obj)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj)],{type:'application/json'}));a.download=name;document.body.append(a);a.click();a.remove()};
const taskBody=(b,n,size,co,grp)=>({donePageNumber:b==='done'?n:0,donePageSize:b==='done'?size:1,openPageNumber:b==='open'?n:0,openPageSize:b==='open'?size:1,toDoPageNumber:b==='toDo'?n:0,toDoPageSize:b==='toDo'?size:1,orderBy:1,taskGroupId:grp,searchKey:'',tasksGridStatusId:1,assignedBy:[],createdBy:[],agent:[],statusIds:[],type:[],priority:[],assignedOn:[],completedOn:co});
try{
const U=await post('Security/GetAllHierarchyUsersDropDown',{pageSize:1000,pageNumber:0,searchCriteria:'',selectedId:[]});
const udata=(U.data&&(U.data.data||U.data))||[];const uname={};for(const p of udata)uname[String(p.id)]=p;
const people=[];const teamsSeen={};
for(let pg=0;;pg++){const T=await post('Teams/GetAllTeams',{isSearchFilter:false,searchKey:'',search:{},pageSize:50,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(T.data&&(T.data.data||T.data))||[];for(const t of arr)teamsSeen[String(t.id)]=t;const tot=(T.data&&T.data.totalPages)||1;if(pg+1>=tot||!arr.length)break;await wait(200)}
const teamOf={};const teamTypes={};for(const id of Object.keys(teamsSeen)){const d=await get('Teams/GetTeamById/'+id);const td=(d&&d.data)||{};const bc=td.branchCode==null?null:String(td.branchCode);const jed=bc==='${branch}'||/jeddah/i.test(String(td.nameEn||td.name||''));if(jed){const tn=td.nameEn||td.name||id;for(const[k,v]of Object.entries(td))if(k!=='groupUsersDto'&&Array.isArray(v)&&v.length&&v.every(x=>x&&typeof x==='object'&&(x.nameEn||x.name)&&x.userId==null)){teamTypes[tn]=v.map(x=>({id:x.id??x.taskSettingId??null,nameEn:String(x.nameEn||x.name||''),nameAr:String(x.nameAr||'')}))}}for(const g of td.groupUsersDto||[]){const uid=String(g.userId);(teamOf[uid]=teamOf[uid]||{teams:[],branchCode:null,jeddah:false}).teams.push(td.nameEn||td.name||id);if(bc)teamOf[uid].branchCode=bc;if(jed)teamOf[uid].jeddah=true;if(!uname[uid]&&(g.nameEn||g.nameAr))uname[uid]={nameEn:g.nameEn,nameAr:g.nameAr}}await wait(150)}
const walk=async(grp,co,keepRd,buckets=['done','open','toDo'])=>{const out=[];const rd=[];say(M[2]+(keepRd?'R&D':'tasks'));for(const b of buckets){let size=500,pg=0,total=null;for(;;){const d=((await post('Task/GetMyTasksGrid',taskBody(b,pg,size,co,grp))).data||{})[b];if(!d)break;if(pg===0&&d.pageSize!==size)size=d.pageSize||20;total=d.listCount;for(const x of d.data||[]){if(keepRd){rd.push(String(x.id));continue;}out.push({i:String(x.id),title:x.title,taskType:x.taskType,taskSettingId:x.taskSettingId,statusId:x.statusId,isCancelled:x.isCancelled,createdOn:x.createdOn,closeDate:x.closeDate,createUserId:x.createUserId,assigneeId:x.assigneeId,moduleId:x.moduleId,customerTag:x.customerTag,bucket:b})}pg++;if(!d.data||!d.data.length||pg*size>=total)break;await wait(250)}}return{out,rd}};
const main=await walk(100001,[FROM&&'${fromZ}'||'',TO&&'${toZ}'||''],false,['done']);let tasks=main.out;const doneTotal=tasks.length;
const opn=await walk(100001,[],false,['open','toDo']);const seenO=new Set(tasks.map(t=>t.i));for(const t of opn.out)if(!seenO.has(t.i)){seenO.add(t.i);tasks.push(t)}const openTotal=opn.out.length;
${later ? `const late=await walk(100001,['${toZ}','${nowZ}'],false,['done']);const seen=new Set(tasks.map(t=>t.i));for(const t of late.out){const c=t.createdOn?t.createdOn+'Z':'';if(t.bucket==='done'&&!seen.has(t.i)&&c>='${fromZ}'&&c<'${toZ}')tasks.push(t)}` : ''}
const rdq=await walk(12,[FROM&&'${fromZ}'||'',TO&&'${toZ}'||''],true,['done']);const rdo=await walk(12,[],true,['open','toDo']);const rdIds=[...new Set([...rdq.rd,...rdo.rd])];
const mapTask=x=>{const uid=String(x.assigneeId||'');const tt=teamOf[uid]||{teams:[],branchCode:null};return{id:String(x.i),title:String(x.title||''),typeId:x.taskSettingId??null,type:String(x.taskType||''),statusId:x.statusId,state:x.isCancelled?'cancelled':x.statusId===3?'done':'open',createdAt:x.createdOn?x.createdOn+'Z':null,createdById:x.createUserId==null?null:String(x.createUserId),assigneeId:uid,completedAt:x.statusId===3&&!x.isCancelled&&x.closeDate?x.closeDate+'Z':null,moduleId:x.moduleId,customer:x.customerTag||null,bucket:x.bucket}};
const seenId=new Set();const taskRows=[];for(const x of tasks){if(seenId.has(x.i))continue;seenId.add(x.i);taskRows.push(mapTask(x))}
const pids=new Set();taskRows.forEach(t=>{if(t.assigneeId)pids.add(t.assigneeId);if(t.createdById)pids.add(t.createdById)});for(const[uid,tt]of Object.entries(teamOf))if(tt.jeddah)pids.add(uid);
for(const id of pids){const u=uname[id]||{};const tt=teamOf[id]||{teams:[],branchCode:null};people.push({id,nameEn:String(u.nameEn||''),nameAr:String(u.nameAr||''),teams:tt.teams,branchCode:tt.branchCode})}
const tasksFile={schema:'${SCHEMA}',range:{from:FROM,to:TO},extractedAt:new Date().toISOString(),taskGroupId:100001,source:{endpoint:'POST https://crmbackend.afaqy.sa/Task/GetMyTasksGrid',doneInRangeTotal:doneTotal,openTotal:openTotal,pageSize:500},people,tasks:taskRows,rdTaskIds:rdIds,teamTypes,notes:['manager bookmark; times UTC with Z added']};
say(M[2]+'reports');const techPoints=[];const MM=${JSON.stringify(months.map(m=>({month:m.key,yearId:m.yearId,quarterId:m.quarterId,monthId:m.monthId,rd:m.requestDate})))};
const KEEP=${JSON.stringify(TECH_FIELDS)};
for(const mo of MM){const rows=[];for(let pg=1;;pg++){const R=await post('TechnicianReport/GetTechnicianReportStatic',{pageNumber:pg,pageSize:100,searchKey:'',isSearchFilter:true,search:{yearId:mo.yearId,quarterId:mo.quarterId,monthId:mo.monthId,branchIds:BR,userIds:[],requestDate:mo.rd}});const g=(R.data&&R.data.gridResult)||{};const arr=g.data||[];for(const r of arr){const o={technicianId:r.technicianId,employeeId:r.employeeId,nameEn:r.nameEn,nameAr:r.nameAr};for(const f of KEEP)o[f]=r[f]||0;rows.push(o)}const tot=g.totalPages||1;if(pg>=tot||!arr.length)break;await wait(200)}techPoints.push({month:mo.month,listCount:rows.length,rows})}
say(M[2]+'activity log');const acts=[];for(let pg=0;pg<200;pg++){const R=await post('ActivityLog/GetTicketsGrid',{isSearchFilter:false,searchKey:'',search:{},pageSize:500,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(R.data&&(R.data.data||R.data))||[];if(!arr.length)break;let older=0;for(const r of arr){const d=String(r.createDate||'').slice(0,10);if(d<FROM){older++;continue}if(d>TO)continue;acts.push({ticketId:r.ticketId,taskId:r.taskId??null,customerId:r.customerId??null,categoryId:r.categoryId??null,category:r.category||'',caseId:r.caseId??null,case:r.case||'',statusId:r.statusId??null,status:r.status||'',createdById:r.createdById??null,createDate:r.createDate?r.createDate+'Z':null})}if(older===arr.length||(R.data&&R.data.totalPages&&pg+1>=R.data.totalPages))break;await wait(250)}
say(M[2]+'accounts');const ENG=((await post('AfterSales/GetAllAfterSalesEngineers')).data||[]);const byName={};for(const[uid,u]of Object.entries(uname)){const n=String((u&&u.nameEn)||'').trim().toLowerCase();if(n)byName[n]=uid}const emp2uid={};for(const e of ENG){const u=byName[String(e.nameEn||'').trim().toLowerCase()];if(u)emp2uid[String(e.id)]=u}const accts=[];let asz=500;for(let pg=0;pg<60;pg++){const R=await post('AfterSales/GetAfterSalesRequestGrid',{isSearchFilter:false,searchKey:'',search:{},pageSize:asz,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const d=R.data||{};const arr=d.data||[];if(pg===0&&d.pageSize&&d.pageSize<asz)asz=d.pageSize;for(const r of arr)if(String(r.branchCode)===BR)accts.push({c:String(r.customerId??r.id),a:(r.afterSalesManIds||[]).map(String).map(x=>emp2uid[x]||('e'+x)),d:+r.connectedDevices||0,s:r.segmentId??null});if(!arr.length||(pg+1)*asz>=(d.listCount||0))break;await wait(200)}
const AS=await post('AfterSalesBoardReport/GetAfterSalesAgentsGrid',{categoryId:null,createDate:['${fromZ}','${toZ}'],branch:BR,afterSalesId:null});
const asArr=(AS.data&&(AS.data.data||AS.data))||[];const afterSales={rows:asArr.map(r=>({id:r.id,name:r.afterSalesName,open:r.openTickets||0,pending:r.pendingTickets||0,done:r.doneTickets||0,total:r.totalTickets||0}))};
const repFile={schema:'${REPORTS_SCHEMA}',range:{from:FROM,to:TO},branch:BR,extractedAt:new Date().toISOString(),techPoints,afterSales,activities:{rows:acts},accounts:{rows:accts,unmatched:ENG.filter(e=>!emp2uid[String(e.id)]).length},notes:['manager bookmark']};
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
}catch(e){if(receiver)window.removeEventListener('message',receiver);box.style.background='#7a1f1f';say(M[3]+e.message);setTimeout(()=>box.remove(),12000)}})();`;
  return 'javascript:' + encodeURIComponent(code.replace(/\n/g, ''));
}

/**
 * The assignment panel (ADR-0018). A bookmark that opens a panel INSIDE myafaqy with the manager's own sign-in: pick the
 * after-sales engineers, see the Jeddah coverage, pilot on ten accounts, then apply to the rest. The only write in the
 * whole portal: POST AfterSales/AssignAfterSales, ADD mode (existing ∪ chosen), branchCode "2" only, by a button press.
 */
export function buildAssignBookmarklet(lang = 'ar', defaultNames = []) {
  const M = {
    ar: { only: 'افتح ماي أفاقي أولًا ثم اضغط الإشارة من هناك', login: 'سجّل دخولك في ماي أفاقي أولًا', title: 'تعيين ما بعد البيع على حسابات جدة', pick: 'اختر المهندسين الذين يكونون على كل حساب', loading: 'جارٍ قراءة الحسابات…',
      total: 'حسابات جدة', complete: 'مكتملة بالمختارين', toUpdate: 'ستُحدَّث', cover: 'التغطية الحالية لكل مهندس', pilot: 'تجربة على ١٠', rest: 'تطبيق على الباقي', refresh: 'إعادة القراءة', close: 'إغلاق',
      before: 'قبل', after: 'بعد', ok: 'تمام', bad: 'لم يُطبَّق', progress: 'جارٍ التطبيق', done: 'انتهى — مكتملة الآن', failed: 'لم تنجح', log: 'تنزيل السجل', teamOnly: 'فريقك كما في البوابة — لا شيء محدد، اختر بنفسك', showAll: 'إظهار كل مهندسي ما بعد البيع', noTeam: 'لم أجد فريق ما بعد البيع في جدة — تُعرض القائمة كلها', mode: 'إضافة لمن تختارهم، وإزالة لمن تعلّم عليه في قسم الإزالة فقط', none: 'اختر مهندسًا واحدًا على الأقل أو علّم على من تزيله', removeH: 'إزالة من كل الحسابات — لمن غادر', removeHint: 'لا يُزال أحد إلا من تعلّم عليه هنا بنفسك. الرقم بجانب كل اسم = عدد حسابات جدة التي عليه.', unknown: 'ليس في قائمة المهندسين', toRemove: 'ستُزال منها' },
    en: { only: 'Open myafaqy first, then press the bookmark there', login: 'Sign in to myafaqy first', title: 'Assign after-sales to Jeddah accounts', pick: 'Choose the engineers who should be on every account', loading: 'Reading accounts…',
      total: 'Jeddah accounts', complete: 'complete with the chosen', toUpdate: 'to update', cover: 'Current coverage per engineer', pilot: 'Pilot on 10', rest: 'Apply to the rest', refresh: 'Re-read', close: 'Close',
      before: 'before', after: 'after', ok: 'ok', bad: 'not applied', progress: 'Applying', done: 'Done — complete now', failed: 'failed', log: 'Download the log', teamOnly: 'Your team as set in the portal — nothing ticked, choose yourself', showAll: 'Show every after-sales engineer', noTeam: 'Jeddah’s after-sales team was not found — showing the whole list', mode: 'Adds whoever you choose; removes only whoever you tick in the removal section', none: 'Choose at least one engineer or tick someone to remove', removeH: 'Remove from every account — for those who left', removeHint: 'Nobody is removed unless you tick them here yourself. The number beside each name is how many Jeddah accounts carry them.', unknown: 'not in the engineers list', toRemove: 'to remove from' },
  }[lang] || {};
  const code = `(async()=>{const M=${JSON.stringify(M)},RTL=${lang === 'en' ? 'false' : 'true'};
if(location.hostname!=='myafaqy.com'){alert(M.only);return}
const tk=localStorage.getItem('token');if(!tk){alert(M.login);return}
const H={'Authorization':'Bearer '+tk,'Content-Type':'application/json','X-Timezone-Offset':'-180','X-Client-Id':localStorage.getItem('browser_client_id')||'','lang':'en'};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const get=async(path)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{headers:H});const j=await r.json().catch(()=>({}));if(!r.ok||j.success===false)throw new Error(path+' '+(j.message||r.status));return j};
const post=async(path,body)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{method:'POST',headers:H,body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok||j.success===false)throw new Error(path+' '+(j.message||r.status));return j};
const old=document.getElementById('afaqy-assign');if(old)old.remove();
const box=document.createElement('div');box.id='afaqy-assign';box.dir=RTL?'rtl':'ltr';box.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);width:min(760px,96vw);max-height:92vh;overflow:auto;z-index:2147483647;background:#FFFFFF;color:#0F2231;border:1px solid #C3CED7;border-radius:12px;box-shadow:0 12px 40px rgba(15,34,49,.25);font:14px/1.5 system-ui,sans-serif;padding:16px 18px';
const el=(t,a,...k)=>{const n=document.createElement(t);for(const[x,v]of Object.entries(a||{})){if(x==='text')n.textContent=v;else if(x.startsWith('on'))n.addEventListener(x.slice(2),v);else n.setAttribute(x,v)}for(const c of k.flat())if(c!=null)n.append(c.nodeType?c:String(c));return n};
const btn=(text,fn,primary)=>el('button',{type:'button',style:'font:inherit;padding:8px 14px;border-radius:8px;cursor:pointer;border:1px solid '+(primary?'#0E7C86':'#C3CED7')+';background:'+(primary?'#0E7C86':'#FFFFFF')+';color:'+(primary?'#FFFFFF':'#0F2231'),onclick:fn,text});
const status=el('div',{style:'margin:8px 0;color:#5A6B78'});const body=el('div');
box.append(el('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:10px'},el('b',{style:'font-size:16px',text:M.title}),btn(M.close,()=>box.remove())),el('div',{style:'font-size:12px;color:#B45309;margin:4px 0 8px',text:M.mode}),status,body);document.body.append(box);
let teamNames=null,showAll=false,engineers=[],rows=[],chosen=new Set(),removing=new Set();const DEF=${JSON.stringify(defaultNames.map((n) => String(n).trim().toLowerCase()))};
const say=t=>{status.textContent=t};
const readTeam=async()=>{if(teamNames!==null)return;teamNames=[];try{for(let pg=0;pg<20;pg++){const T=await post('Teams/GetAllTeams',{isSearchFilter:false,searchKey:'',search:{},pageSize:50,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(T.data&&(T.data.data||T.data))||[];for(const t of arr){const n=String(t.nameEn||t.name||'').toLowerCase();if(n.includes('jeddah')&&/after\\s*-?\\s*sales/.test(n)){const d=await get('Teams/GetTeamById/'+t.id);for(const g of((d&&d.data&&d.data.groupUsersDto)||[]))if(g.nameEn)teamNames.push(String(g.nameEn).trim().toLowerCase())}}if(pg+1>=((T.data&&T.data.totalPages)||1)||!arr.length)break}}catch(e){teamNames=[]}};
const readAll=async()=>{say(M.loading);await readTeam();engineers=((await post('AfterSales/GetAllAfterSalesEngineers')).data||[]).map(e=>({id:String(e.id),name:e.nameEn||e.nameAr||String(e.id)}));
if(DEF.length)teamNames=DEF.slice();rows=[];let size=500;for(let pg=0;pg<100;pg++){const R=await post('AfterSales/GetAfterSalesRequestGrid',{isSearchFilter:false,searchKey:'',search:{},pageSize:size,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const d=R.data||{};const arr=d.data||[];if(pg===0&&d.pageSize&&d.pageSize<size)size=d.pageSize;for(const r of arr)if(String(r.branchCode)==='2')rows.push({id:String(r.customerId??r.id),have:(r.afterSalesManIds||[]).map(String),devices:+r.connectedDevices||0});if(!arr.length||(pg+1)*size>=(d.listCount||0))break;await wait(200)}say('')};
const present=()=>{const c=new Map();for(const r of rows)for(const h of r.have)c.set(h,(c.get(h)||0)+1);return[...c.entries()].sort((a,b)=>b[1]-a[1])};
const need=()=>{const want=[...chosen];return rows.filter(r=>want.some(w=>!r.have.includes(w))||r.have.some(h=>removing.has(h)))};
const union=r=>[...new Set([...r.have,...chosen])].filter(x=>!removing.has(x));
let logRows=[];
const apply=async(list,label)=>{let n=0,bad=[];for(const r of list){say(M.progress+' '+(++n)+'/'+list.length);const before=r.have.slice();const next=union(r);if(!next.length){logRows.push([r.id,before.join('|'),'','skipped: would leave nobody']);continue}try{await post('AfterSales/AssignAfterSales',{customerId:+r.id,afterSalesIds:next.map(Number)});logRows.push([r.id,before.join('|'),next.join('|'),'sent'])}catch(e){bad.push(r.id);logRows.push([r.id,before.join('|'),next.join('|'),'error:'+e.message])}await wait(300)}return bad};
const verify=async(ids)=>{await readAll();const set=new Set(ids);return rows.filter(r=>set.has(r.id)).map(r=>({id:r.id,ok:[...chosen].every(w=>r.have.includes(w))&&!r.have.some(h=>removing.has(h)),have:r.have}))};
const dl=()=>{const csv=['customerId,before,after,result',...logRows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(','))].join('\\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='afaqy-assign-log-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();a.remove()};
const render=(extra)=>{const todo=need();const cov=engineers.map(e=>({e,n:rows.filter(r=>r.have.includes(e.id)).length})).sort((a,b)=>b.n-a.n);
body.replaceChildren(el('div',{style:'font-weight:700;margin:6px 0',text:M.pick}),el('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;color:#5A6B78;margin-bottom:6px'},el('span',{text:(teamNames&&teamNames.length)?M.teamOnly+' ('+teamNames.length+')':M.noTeam}),(teamNames&&teamNames.length)?el('label',{style:'display:flex;gap:6px;align-items:center;cursor:pointer'},el('input',{type:'checkbox',...(showAll?{checked:''}:{}),onchange:ev=>{showAll=ev.target.checked;render()}}),M.showAll):null),el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin-bottom:10px'},engineers.filter(e=>showAll||!teamNames||!teamNames.length||teamNames.includes(String(e.name).trim().toLowerCase())||chosen.has(e.id)).map(e=>el('label',{style:'display:flex;gap:8px;align-items:center;padding:6px 8px;border:1px solid #DBE2E8;border-radius:8px'},el('input',{type:'checkbox',...(chosen.has(e.id)?{checked:''}:{}),onchange:ev=>{if(ev.target.checked){chosen.add(e.id);removing.delete(e.id)}else chosen.delete(e.id);localStorage.setItem('afaqy-assign-chosen',JSON.stringify([...chosen]));render()}}),el('span',{text:e.name}),el('span',{style:'margin-inline-start:auto;color:#5A6B78;font-size:12px',text:String(rows.filter(r=>r.have.includes(e.id)).length)})))),
el('details',{style:'margin:6px 0 10px;padding:8px 10px;border:1px solid #F0C9C5;border-radius:8px;background:#FFF8F7',...(removing.size?{open:''}:{})},el('summary',{style:'cursor:pointer;font-weight:700;color:#B42318',text:M.removeH+(removing.size?' ('+removing.size+')':'')}),el('div',{style:'font-size:12px;color:#5A6B78;margin:4px 0 8px',text:M.removeHint}),el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px'},present().map(([id,n])=>{const e=engineers.find(x=>x.id===id);return el('label',{style:'display:flex;gap:8px;align-items:center;padding:6px 8px;border:1px solid #F0C9C5;border-radius:8px;background:#FFFFFF'},el('input',{type:'checkbox',...(removing.has(id)?{checked:''}:{}),onchange:ev=>{if(ev.target.checked){removing.add(id);chosen.delete(id);localStorage.setItem('afaqy-assign-chosen',JSON.stringify([...chosen]))}else removing.delete(id);render()}}),el('span',{text:e?e.name:('#'+id+' — '+M.unknown)}),el('span',{style:'margin-inline-start:auto;color:#5A6B78;font-size:12px',text:String(n)}))}))),
el('div',{style:'display:flex;gap:16px;flex-wrap:wrap;margin:8px 0;padding:10px 12px;background:#EEF1F4;border-radius:8px'},el('span',{},el('b',{text:String(rows.length)}),' '+M.total),el('span',{},el('b',{text:String(rows.length-todo.length)}),' '+M.complete),el('span',{style:'color:#B45309'},el('b',{text:String(todo.length)}),' '+M.toUpdate),removing.size?el('span',{style:'color:#B42318'},el('b',{text:String(rows.filter(r=>r.have.some(h=>removing.has(h))).length)}),' '+M.toRemove):null),
el('div',{style:'display:flex;gap:8px;flex-wrap:wrap'},btn(M.pilot,async()=>{if(!chosen.size&&!removing.size){say(M.none);return}const list=need().slice(0,10);const bad=await apply(list,'pilot');const v=await verify(list.map(r=>r.id));render(el('table',{style:'width:100%;border-collapse:collapse;margin-top:10px;font-size:13px'},el('tr',{},['customerId',M.before,M.after,''].map(h=>el('th',{style:'text-align:start;border-bottom:1px solid #DBE2E8;padding:4px',text:h}))),v.map(x=>{const lg=logRows.find(l=>l[0]===x.id)||[];return el('tr',{},el('td',{style:'padding:4px',text:x.id}),el('td',{style:'padding:4px;color:#5A6B78',text:lg[1]||''}),el('td',{style:'padding:4px',text:x.have.join('|')}),el('td',{style:'padding:4px;font-weight:700;color:'+(x.ok?'#15803D':'#B42318'),text:x.ok?M.ok:M.bad}))})))},true),btn(M.rest,async()=>{if(!chosen.size&&!removing.size){say(M.none);return}const list=need();const bad=await apply(list,'rest');await readAll();const left=need().length;render(el('div',{style:'margin-top:10px;padding:10px 12px;border-radius:8px;background:'+(left?'#FDF1E1':'#E6F4EA')},el('b',{text:M.done+': '+(rows.length-left)+'/'+rows.length}),bad.length?el('div',{text:M.failed+': '+bad.join(', ')}):null))},true),btn(M.refresh,async()=>{await readAll();render()}),logRows.length?btn(M.log,dl):null),...(extra?[extra]:[]))};
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
const tk=localStorage.getItem('token');if(!tk){alert(M[1]);return}
let w=window.open(P+'#me-wait','afaqy-portal');
const box=document.createElement('div');box.style.cssText='position:fixed;inset:auto 16px 16px auto;z-index:2147483647;background:#0F2231;color:#fff;padding:12px 16px;border-radius:10px;font:14px system-ui';box.textContent=M[2];document.body.append(box);
try{const u=JSON.parse(decodeURIComponent(escape(atob(tk.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))));const me=String(u.UserId);
const H={'Authorization':'Bearer '+tk,'Content-Type':'application/json','X-Timezone-Offset':'-180','X-Client-Id':localStorage.getItem('browser_client_id')||'','lang':'en'};
const day=86400000,now=Date.now(),sa=d=>new Date(Date.parse(new Date(d+3*3600000).toISOString().slice(0,10)+'T00:00:00+03:00')).toISOString();
const since=sa(now-${ME_MONTHS}*30.5*day),end=sa(now+day);
const post=async(path,body)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{method:'POST',headers:H,body:JSON.stringify(body)});if(!r.ok)throw new Error(path+' HTTP '+r.status);const j=await r.json();if(j&&j.success===false)throw new Error(j.message||'refused');return j};
const get=async(path)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{headers:H});if(!r.ok)throw new Error(path+' HTTP '+r.status);return r.json()};
const soft=async f=>{try{return await f()}catch(e){return null}};
const base=(g,c,b,n,s)=>({donePageNumber:b==='done'?n:0,donePageSize:b==='done'?s:1,openPageNumber:b==='open'?n:0,openPageSize:b==='open'?s:1,toDoPageNumber:b==='toDo'?n:0,toDoPageSize:b==='toDo'?s:1,orderBy:1,taskGroupId:g,searchKey:'',tasksGridStatusId:1,assignedBy:[],createdBy:[],agent:[],statusIds:[],type:[],priority:[],assignedOn:[],completedOn:c});
const rows=new Map();let n=0;
for(const g of[100000,100001]){for(const[b,c]of[['done',[since,end]],['open',[]],['toDo',[]]]){let size=500,pg=0,total=null;
for(;;){const d=((await post('Task/GetMyTasksGrid',base(g,c,b,pg,size))).data||{})[b];if(!d)break;if(pg===0&&d.pageSize!==size)size=d.pageSize||20;total=d.listCount;
for(const x of d.data||[]){const id=String(x.id);if(rows.has(id))continue;const a=String(x.assigneeId==null?(g===100000?me:''):x.assigneeId);
rows.set(id,{i:id,c:x.createdOn,d:x.statusId===3&&!x.isCancelled?x.closeDate:null,s:x.isCancelled?'cancelled':x.statusId===3?'done':'open',m:x.moduleId,o:String(x.createUserId)===a,b,a,y:String(x.taskType||'').slice(0,60),t:a===me&&b!=='done'?String(x.title||x.taskType||'').slice(0,80):undefined})}
n+=(d.data||[]).length;box.textContent=M[2]+' '+n;pg++;if(!d.data||!d.data.length||pg*size>=total)break;await new Promise(r=>setTimeout(r,250))}}}
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

// ===================== the team file: positions and leaders, by myafaqy id, never by name (ADR-0015) =====================
// team.json lives in the repository (public), so it holds ids, positions and who reports to whom — the names arrive from
// myafaqy with the bookmark. The manager fills it on the Team page; each device may also hold its own copy.
export const ROSTER_SCHEMA = 'afaqy-team/v1';
export function parseRoster(raw) {
  if (!raw || typeof raw !== 'object' || !raw.people || typeof raw.people !== 'object') return { v: 1, schema: ROSTER_SCHEMA, people: {} };
  const people = {};
  for (const [id, p] of Object.entries(raw.people)) {
    if (!p || typeof p !== 'object') continue;
    const o = { position: String(p.position || '').slice(0, 80), leaderId: p.leaderId == null || p.leaderId === '' ? null : String(p.leaderId) };
    if (p.positionEn) o.positionEn = String(p.positionEn).slice(0, 80);
    if (p.onLeave === true) o.onLeave = true;
    if (o.position || o.leaderId || o.positionEn || o.onLeave) people[String(id)] = o;
  }
  return { v: 1, schema: ROSTER_SCHEMA, people };
}
/** The device's own entries win over the repository's. */
export function mergeRoster(repo, device) {
  const a = parseRoster(repo), b = parseRoster(device);
  return { v: 1, schema: ROSTER_SCHEMA, people: { ...a.people, ...b.people } };
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
  const out = { v: 1, schema: WEIGHTS_SCHEMA, reviewed: '', default: 1, tasks: {}, activities: {}, editors: {} };
  if (!raw || typeof raw !== 'object') return out;
  const num = (w) => { const n = Number(w); return Number.isFinite(n) && n >= 0 && n <= 20 ? n : null; };
  out.reviewed = String(raw.reviewed || '').slice(0, 10);
  if (num(raw.default) != null) out.default = num(raw.default);
  for (const [k, x] of Object.entries(raw.tasks || {})) {
    const w = num(x && typeof x === 'object' ? x.w : x); if (w == null) continue;
    const o = { w, tier: TIERS.includes(x && x.tier) ? x.tier : null, team: ['aftersales', 'rd', 'both', 'general'].includes(x && x.team) ? x.team : null };
    if (x && Array.isArray(x.f) && x.f.length === 4 && x.f.every((v) => [0, 1, 2].includes(Number(v)))) o.f = x.f.map(Number);
    if (x && POINT_MODES.includes(x.mode)) o.mode = x.mode;
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
  return { ...a, default: device && device.default != null ? b.default : a.default, tasks: { ...a.tasks, ...b.tasks }, activities: { ...a.activities, ...b.activities }, editors: { ...a.editors, ...b.editors }, card: { ...a.card, ...b.card }, reviewed: b.reviewed || a.reviewed };
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
// ===================== the basis of a type's points (ADR-0031) =====================
// Base 1–5 from four stated factors (technical depth, outside party, field work, business impact — each 0, 1 or 2; sum of 8),
// times the method: "done" (the base on closing, time ignored), "speed" (×1.5 when closed within the type's standard time)
// or "time" (× working hours ÷ standard, between ×0.5 and ×2 — never rewarding slowness beyond twice the standard).
export const POINT_MODES = ['done', 'speed', 'time'];
export const FACTORS = ['tech', 'outside', 'field', 'impact'];
export const baseFromFactors = (f) => { const n = (f || []).reduce((a, b) => a + Number(b || 0), 0); return n <= 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : n === 6 ? 4 : 5; };
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
  const x = wt && wt.tasks[typeKey(task && task.type)]; const base = x ? x.w : (wt ? wt.default : 1);
  if (!x || !x.mode || x.mode === 'done' || !x.std || !task.createdAt || !task.completedAt) return base;
  const h = businessHours(task.createdAt, task.completedAt);
  if (x.mode === 'speed') return h <= x.std ? Math.round(base * 1.5 * 10) / 10 : base;
  return Math.round(base * Math.min(2, Math.max(0.5, h / x.std)) * 10) / 10;
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
  const activities = changed(base.activities, proposed.activities);
  const editors = changed(base.editors, proposed.editors, (v) => (v || []).slice().sort());
  const card = changed(base.card, proposed.card);
  const defaults = base.default !== proposed.default ? 1 : 0;
  return {
    tasks, activities, editors, card, defaults,
    count: tasks.length + activities.length + editors.length + card.length + defaults,
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
