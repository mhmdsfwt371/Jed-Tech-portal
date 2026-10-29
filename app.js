// app.js — everything on the page. Data stays in this browser (IndexedDB); nothing is sent anywhere.
import { PRIMARY, SYSTEMS, MORE, PORTAL_VERSION, MODULE_ALLOW } from './config.js';
import {
  t as tr, L, LANGS, dirOf, periodBlocks, buildPrompt, parseDataset, mergeDataset, completeness, factor1,
  formatHours, formatRate, sampleDataset, GROUP, GUIDE, DEFINITIONS, peopleOf, defaultTeam, nameOf,
  buildBookmarklet, parseMe, parseMePayload, myProfile, openTasks, profileMonths, upgradeMe,
  parseRoster, mergeRoster, positionOf, leaderOf, donutParts, ROSTER_SCHEMA, saudiDay, teamAlerts,
  buildReportsPrompt, parseReports, techTotals, afterSalesTotals, REPORTS_SCHEMA, buildManagerBookmarklet,
} from './core.js';

const $ = (id) => document.getElementById(id);
const KEY = 'afaqy-portal:';
const pref = (k, v) => { try { if (v === undefined) return localStorage.getItem(KEY + k); localStorage.setItem(KEY + k, v); } catch { return null; } return v; };

let lang = LANGS.includes(pref('lang')) ? pref('lang') : 'ar';
const t = (k, vars) => tr(lang, k, vars);

// ---------- element helper: drops null/false children so nothing prints the word "null" ----------
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(String(k)));
  return n;
}
const set = (node, ...kids) => { node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false)); };

function toast(msg) {
  const n = $('toast'); n.textContent = msg; n.classList.add('on');
  clearTimeout(toast.h); toast.h = setTimeout(() => n.classList.remove('on'), 3200);
}

// ---------- storage: IndexedDB, with an in-memory fallback where it is unavailable ----------
const store = (() => {
  let mem = []; let memMe = null; let memRep = []; let memRoster = null;
  const open = () => new Promise((res, rej) => {
    if (!('indexedDB' in window)) return rej(new Error('no idb'));
    const r = indexedDB.open('afaqy-portal', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const run = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const tx = db.transaction('kv', mode); const req = fn(tx.objectStore('kv')); tx.oncomplete = () => res(req && req.result); tx.onerror = () => rej(tx.error); }); };
  return {
    async get() { try { return (await run('readonly', (s) => s.get('datasets'))) || []; } catch { return mem; } },
    async put(list) { try { await run('readwrite', (s) => s.put(list, 'datasets')); } catch { mem = list; } },
    // "my KPIs" — an engineer's own profile, kept apart from the manager's datasets
    async getReports() { try { return (await run('readonly', (s) => s.get('reports'))) || []; } catch { return memRep; } },
    async putReports(v) { try { await run('readwrite', (s) => s.put(v, 'reports')); } catch { memRep = v; } },
    async getRoster() { try { return (await run('readonly', (s) => s.get('roster'))) || null; } catch { return memRoster; } },
    async putRoster(v) { try { await run('readwrite', (s) => (v ? s.put(v, 'roster') : s.delete('roster'))); } catch { memRoster = v; } },
    async getMe() { try { return (await run('readonly', (s) => s.get('me'))) || null; } catch { return memMe; } },
    async putMe(v) { try { await run('readwrite', (s) => (v ? s.put(v, 'me') : s.delete('me'))); } catch { memMe = v; } },
  };
})();
let datasets = [];
let reports = [];   // technician points and after-sales tickets per period (ADR-0012)

// ---------- icons for the three core tools ----------
const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>',
  data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5.5" rx="8" ry="2.5"/><path d="M4 5.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6M4 11.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/></svg>',
  kpi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v16H5.5A1.5 1.5 0 0 0 4 20.5zM4 20.5A1.5 1.5 0 0 0 5.5 22H20M8 7h8M8 11h6"/></svg>',
  system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  survey: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 42s-13-11.5-13-21a13 13 0 0 1 26 0c0 9.5-13 21-13 21z"/><path d="M18.5 20a6 6 0 0 1 11 0M21 22.5a3 3 0 0 1 6 0"/><circle cx="24" cy="25" r="1.2"/></svg>',
  heatmap: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="36" height="36" rx="4"/><circle cx="18" cy="19" r="5"/><circle cx="31" cy="29" r="7" opacity=".55"/><circle cx="31" cy="29" r="2.5"/><path d="M6 34h10M36 12h6"/></svg>',
  api: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14 7 24l10 10M31 14l10 10-10 10M27 10l-6 28"/></svg>',
  can: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 30V22l5-8h22l5 8v8"/><path d="M6 30h36v6H6z"/><circle cx="14" cy="36" r="3"/><circle cx="34" cy="36" r="3"/><path d="M18 22h12M24 22v-4"/></svg>',
};

// ---------- tools ----------
// A module opens inside the portal (#m-<id>); anything else opens in a new tab.
const MODULES = [...PRIMARY, ...MORE].filter((x) => x.module && x.status !== 'soon');
const moduleLink = (x, cls, ...kids) => (x.module
  ? el('a', { class: cls, href: `#m-${x.id}` }, ...kids)
  : el('a', { class: cls, href: x.url, target: '_blank', rel: 'noopener' }, ...kids));
function renderTools() {
  set($('primary'), PRIMARY.map((x) => {
    const icon = el('span', { 'aria-hidden': 'true' }); icon.innerHTML = ICONS[x.icon] || '';
    return moduleLink(x, 'tool', icon, el('span', { class: 'name', text: L(x.name, lang) }), el('span', { class: 'desc', text: L(x.desc, lang) }),
      x.module ? el('span', { class: 'badge', text: t('in_portal') }) : null, el('span', { class: 'go', text: t('open') }));
  }));
  set($('systems'), SYSTEMS.map((x) => el('a', { class: 'chip', href: x.url, target: '_blank', rel: 'noopener', text: L(x.name, lang) })));
  set($('more'), MORE.map((x) => (x.status === 'live'
    ? moduleLink(x, 'chip', L(x.name, lang))
    : el('span', { class: 'chip soon' }, L(x.name, lang), el('span', { class: 'tag', text: t('soon') })))));
}

// ---------- my KPIs (ADR-0010) ----------
let me = null;
let meKind = 'month';      // the profile's comparison window: month | quarter | half
let kpiSort = 'done';      // the board's order: done | median | open
let rosterRepo = null;      // team.json from the repository (ids, positions, leaders — never names)
let rosterDevice = null;    // this device's own entries, which win
const roster = () => mergeRoster(rosterRepo, rosterDevice);
// a donut: parts of a whole, drawn with circles — colours from the identity palette
const SVG = 'http://www.w3.org/2000/svg';
const DONUT_COLORS = ['var(--accent)', 'var(--signal)', 'var(--note)', 'var(--ok)', 'var(--warn)', 'var(--accent-dark)', 'var(--ink-soft)', 'var(--slate)'];
function donut(title, parts, { size = 120, fmt = (v) => String(v) } = {}) {
  const r = 40, d = donutParts(parts, r);
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', title);
  const base = document.createElementNS(SVG, 'circle');
  for (const [k, v] of Object.entries({ cx: 50, cy: 50, r, fill: 'none', stroke: 'var(--paper)', 'stroke-width': 14 })) base.setAttribute(k, v);
  svg.append(base);
  d.parts.forEach((p, i) => {
    const c = document.createElementNS(SVG, 'circle');
    for (const [k, v] of Object.entries({ cx: 50, cy: 50, r, fill: 'none', stroke: p.color || DONUT_COLORS[i % DONUT_COLORS.length], 'stroke-width': 14,
      'stroke-dasharray': p.dasharray, 'stroke-dashoffset': p.dashoffset, transform: 'rotate(-90 50 50)' })) c.setAttribute(k, v);
    svg.append(c);
  });
  const mid = document.createElementNS(SVG, 'text');
  for (const [k, v] of Object.entries({ x: 50, y: 55, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: 'var(--title)' })) mid.setAttribute(k, v);
  mid.textContent = fmt(d.total); svg.append(mid);
  return el('div', { class: 'donut' }, svg, el('div', {}, el('div', { class: 'donut-title', text: title }),
    el('div', { class: 'donut-legend' }, d.parts.map((p, i) => el('span', {}, el('i', { style: `background:${p.color || DONUT_COLORS[i % DONUT_COLORS.length]}` }),
      el('span', { text: p.label }), el('b', { text: `${fmt(p.value)} · ${Math.round(p.share * 100)}%` }))))));
}
const portalHome = () => location.origin + location.pathname.replace(/[^/]*$/, '');
function renderMe(waiting = false) {
  const body = $('me-body');
  const bm = buildBookmarklet(portalHome(), lang);
  const link = el('a', { class: 'btn primary bm', href: bm, draggable: 'true', text: `📊 ${t('me_bm')}`,
    onclick: (e) => { e.preventDefault(); toast(t('me_drag')); } });
  const setup = [
    el('p', { class: 'hint', text: t('me_step1') }), el('div', { class: 'row' }, link,
      el('button', { type: 'button', class: 'btn', text: t('me_copy'), onclick: async () => { try { await navigator.clipboard.writeText(decodeURIComponent(bm)); toast(t('me_copied')); } catch { toast(t('me_copy_fail')); } } })),
    el('p', { class: 'hint', text: t('me_step2') }),
    el('details', { class: 'me-phones' }, el('summary', { text: t('me_phones') }), el('p', { class: 'hint', text: t('me_android') }), el('p', { class: 'hint', text: t('me_ios') })),
    el('p', { class: 'note info', text: t('me_privacy') }),
  ];
  if (waiting) { set(body, el('div', { class: 'empty', text: t('me_wait') })); return; }
  if (!me) { set(body, el('div', { class: 'step me-setup' }, el('span', { class: 'n', text: '١' }), el('div', {}, el('h3', { text: t('me_how_h') }), ...setup))); return; }
  const qs = myProfile(me);
  const pm = profileMonths(me, new Date(), roster(), meKind);
  const fmtDate = (iso) => (iso ? `\u2066${iso.slice(0, 10)}\u2069` : '');
  const mine = openTasks(me.tasks, me.user.id);
  const hrsAge = (h) => (h == null ? '' : h < 48 ? t('hours', { n: Math.round(h) }) : t('days', { n: Math.round(h / 24) }));
  const self = me.people.find((p) => p.id === me.user.id) || {};
  const who = nameOf(self, lang) || me.user.name || me.user.id;
  const val = (k, r) => (r == null ? '—' : k === 'rate' ? formatRate(r.rate) : k === 'medianHours' ? (r.medianHours == null ? '—' : formatHours(r.medianHours, lang)) : String(Math.round((r[k] || 0) * 10) / 10));
  // better is up for counts and rate, down for time; an arrow says which way it moved and whether that is good
  const arrow = (k, now, before) => {
    const a = now && now[k], b = before && before[k];
    if (a == null || b == null || a === b) return el('span', { class: 'delta same', text: '=' });
    const up = a > b, judged = ['done', 'rate', 'medianHours'].includes(k), good = k === 'medianHours' ? !up : up;
    const diff = k === 'rate' ? `${Math.round(Math.abs(a - b) * 100)}%` : k === 'medianHours' ? formatHours(Math.abs(a - b), lang) : String(Math.round(Math.abs(a - b) * 10) / 10);
    return el('span', { class: `delta ${judged ? (good ? 'good' : 'bad') : 'neutral'}`, text: `${up ? '▲' : '▼'} \u2068${diff}\u2069` });
  };
  const METRICS = [['done', 'col_done'], ['assigned', 'col_assigned'], ['rate', 'col_rate'], ['medianHours', 'col_median'], ['selfLogged', 'col_self'], ['fromEmail', 'col_email']];
  const cards = (cmpA, cmpB, labelA, labelB) => el('div', { class: 'cmp-grid' }, METRICS.map(([k, label]) => el('div', { class: 'cmp' },
    el('span', { class: 'cmp-k', text: t(label) }),
    el('b', { class: 'cmp-v', text: `\u2068${val(k, cmpA)}\u2069` }),
    el('span', { class: 'cmp-was', text: `${labelB}: \u2068${val(k, cmpB)}\u2069` }),
    arrow(k, cmpA, cmpB))));
  const nm = (id) => nameOf(me.people.find((p) => p.id === id) || {}, lang) || id;
  const workCard = (x) => el('div', { class: `work${x.fromEmail ? ' email' : ''}` },
    el('div', { class: 'work-main' }, el('span', { class: 'work-title', text: x.title || t('me_untitled') }),
      x.customer ? el('span', { class: 'work-cust', text: x.customer }) : null),
    el('div', { class: 'work-meta' }, el('span', { text: x.type || '' }), el('span', { class: 'work-age', text: hrsAge(x.ageHours) })));
  const pills = (cur, kinds, onPick) => el('div', { class: 'pills' }, kinds.map(([k, label]) => el('button', { type: 'button', class: `pill-btn${cur === k ? ' on' : ''}`, text: label, onclick: () => onPick(k) })));
  const alerts = teamAlerts(pm.below);
  const whyText = (w) => (w.k === 'rate' ? t('why_rate', { r: formatRate(w.v) }) : w.k === 'open' ? t('why_open', { n: w.v }) : t('why_median', { h: formatHours(w.v, lang) }));
  const maxDone = Math.max(1, ...pm.below.map((r) => r.this.done));
  const bar = (v, max) => el('div', { class: 'bar-cell' }, el('b', { text: String(v) }), el('i', {}, el('span', { style: `width:${Math.round((v / max) * 100)}%` })));
  set(body,
    el('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:12px' },
      el('details', { class: 'me-again' }, el('summary', { text: t('me_setup_again') }), ...setup),
      el('a', { class: 'btn primary', href: 'https://myafaqy.com/', target: '_blank', rel: 'noopener', text: `↻ ${t('me_update')}`, onclick: () => toast(t('me_refresh_hint')) })),
    el('div', { class: 'me-card' },
      el('div', {}, el('h2', { class: 'me-name', text: who }),
        positionOf(roster(), me.user.id, lang) ? el('p', { class: 'me-pos', text: positionOf(roster(), me.user.id, lang) }) : null,
        self.teams && self.teams.length ? el('p', { class: 'me-teams', text: self.teams.join(' · ') }) : null,
        leaderOf(roster(), me.user.id) ? el('p', { class: 'me-teams', text: t('me_leader', { name: nm(leaderOf(roster(), me.user.id)) }) }) : null),
      el('div', { class: 'me-facts' },
        el('span', { text: t('me_updated', { date: fmtDate(me.extractedAt) }) }),
        el('span', { text: t('me_scope', { n: pm.scope.visible.length }) }))),
    el('div', { class: 'row', style: 'justify-content:space-between;align-items:flex-end' },
      el('h2', { style: 'margin:0', text: t(`me_cmp_h_${meKind}`, { d: pm.windows.day }) }),
      pills(meKind, [['month', t('me_period_month')], ['quarter', t('me_period_quarter')], ['half', t('me_period_half')]], (k) => { meKind = k; renderMe(); })),
    el('p', { class: 'hint', text: t('me_month_sub', { a: pm.windows.this.from, b: pm.windows.this.to, c: pm.windows.last.from, d: pm.windows.last.to }) }),
    cards(pm.mine.this, pm.mine.last, '', t('me_last_period')),
    (pm.sources.email + pm.sources.self + pm.sources.other) ? el('div', { class: 'donuts' },
      donut(t('me_sources_h'), [{ label: t('src_other'), value: pm.sources.other }, { label: t('src_email'), value: pm.sources.email }, { label: t('src_self'), value: pm.sources.self }])) : null,
    el('h2', { text: t('me_open_h', { n: mine.length }) }),
    mine.length ? [el('div', { class: 'worklist' }, mine.slice(0, 6).map(workCard)),
      mine.length > 6 ? el('details', { class: 'more-work' }, el('summary', { text: t('me_open_more', { n: mine.length - 6 }) }), el('div', { class: 'worklist' }, mine.slice(6).map(workCard))) : null]
      : el('div', { class: 'empty', text: t('me_open_none') }),
    el('h2', { text: t('me_avg_h') }),
    pm.average ? [el('p', { class: 'hint', text: t('me_avg_sub', { n: pm.average.n }) }), cards(pm.mine.this, pm.average, '', t('me_avg_team'))]
      : el('p', { class: 'note info', text: t('me_avg_none') }),
    pm.below.length ? [
      el('h2', { text: t('me_team_h', { n: pm.below.length }) }),
      el('p', { class: 'hint', text: t('me_team_sub') }),
      el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, ...['col_person', 'col_assigned', 'col_done', 'me_vs_last', 'col_rate', 'col_median', 'col_open'].map((k, i) => el('th', { class: i ? 'num' : '', text: t(k) })))),
        el('tbody', {}, pm.below.map((r) => el('tr', {},
          el('td', {}, el('div', { text: nm(r.id) }), positionOf(roster(), r.id, lang) ? el('div', { class: 'hint', text: positionOf(roster(), r.id, lang) }) : null), el('td', { class: 'num', text: String(r.this.assigned) }), el('td', { class: 'num' }, bar(r.this.done, maxDone)),
          el('td', { class: 'num' }, arrow('done', r.this, r.last)), el('td', { class: 'num', text: formatRate(r.this.rate) }),
          el('td', { class: 'num', text: r.this.medianHours == null ? '—' : formatHours(r.this.medianHours, lang) }), el('td', { class: 'num', text: String(r.this.open) })))))),
      (alerts.attention || alerts.improved) ? el('div', { class: 'alerts' },
        alerts.attention ? el('div', { class: 'alert warn', text: t('alert_attention', { name: nm(alerts.attention.id), why: alerts.attention.why.map(whyText).join('، ') }) }) : null,
        alerts.improved ? el('div', { class: 'alert ok', text: t('alert_improved', { name: nm(alerts.improved.id), n: alerts.improved.delta }) }) : null) : null] : null,
    el('h2', { text: t('me_history_h') }),
    el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, ...['me_q', 'col_assigned', 'col_done', 'col_rate', 'col_avg', 'col_median', 'col_email', 'col_self', 'col_cancelled'].map((k, i) => el('th', { class: i ? 'num' : '', text: t(k) })))),
      el('tbody', {}, qs.map((q) => {
        const r = q.row;
        return el('tr', {}, el('td', {}, q.label, q.partial ? el('span', { class: 'pill', text: ` ${t('me_partial')}` }) : null),
          ...(r ? [r.assigned, r.done].map((v) => el('td', { class: 'num', text: String(v) })) : [el('td', { class: 'num', text: '0' }), el('td', { class: 'num', text: '0' })]),
          el('td', { class: 'num', text: r ? formatRate(r.rate) : '—' }),
          el('td', { class: 'num', text: r && r.avgHours != null ? formatHours(r.avgHours, lang) : '—' }),
          el('td', { class: 'num', text: r && r.medianHours != null ? formatHours(r.medianHours, lang) : '—' }),
          el('td', { class: 'num', text: String(r ? r.fromEmail : 0) }), el('td', { class: 'num', text: String(r ? r.selfLogged : 0) }),
          el('td', { class: 'num', text: String(r ? r.cancelled : 0) }));
      })))),
    el('h2', { text: t('definitions') }), el('ul', { class: 'defs' }, DEFINITIONS.map((k) => el('li', { text: t(k) }))),
    el('details', { class: 'team' }, el('summary', { text: t('me_refresh_h') }), el('p', { class: 'hint', text: t('me_refresh') }), ...setup,
      el('button', { type: 'button', class: 'btn', text: t('me_forget'), onclick: async () => { me = null; await store.putMe(null); renderMe(); } })));
}
async function receiveMe(fragment) {
  const r = await parseMe(fragment);
  history.replaceState(null, '', '#me');            // the data never stays in the address or the history
  if (r.error) { toast(t(r.error, r.vars || {})); renderMe(); return; }
  me = r.me; await store.putMe(me);
  toast(t('me_loaded', { n: me.tasks.length })); renderMe();
}
// The bookmark hands the data over by message (ADR-0014): accepted only from myafaqy itself and only in our shape.
const MYAFAQY_ORIGIN = 'https://myafaqy.com';
let meReceived = '';
window.addEventListener('message', async (e) => {
  if (e.origin !== MYAFAQY_ORIGIN) return;
  if (!e.data || e.data.type !== 'afaqy-me' || !e.data.payload) return;
  try { e.source && e.source.postMessage({ type: 'afaqy-me-ack' }, e.origin); } catch { /* the sender stops on its own after a while */ }
  const stamp = String(e.data.payload.extractedAt || '');
  if (stamp && stamp === meReceived) return;          // the bookmark repeats until acknowledged — keep the first
  meReceived = stamp;
  const r = parseMePayload(e.data.payload);
  if (r.error) { toast(t(r.error, r.vars || {})); return; }
  me = r.me; await store.putMe(me);
  if (location.hash !== '#me') history.replaceState(null, '', '#me');
  route(); toast(t('me_loaded', { n: me.tasks.length })); renderMe();
});

// ---------- AFAQY PRO inside the portal (ADR-0011) ----------
// The integration API is the one AFAQY system that accepts the portal's address (checked in a real browser, 29 Oct 2026).
// Read-only: two requests only. The password is used once to obtain a session key and never stored; the key lives in this
// tab's sessionStorage and dies with the tab. Units are shown, never stored.
const PRO_API = 'https://api.afaqy.sa';
const PRO_KEY = 'afaqy-portal:pro-session';
let proUnits = null, proBusy = false, proQuery = '', proOpen = null;
const proToken = { get: () => { try { return sessionStorage.getItem(PRO_KEY); } catch { return null; } },
  set: (v) => { try { if (v) sessionStorage.setItem(PRO_KEY, v); else sessionStorage.removeItem(PRO_KEY); } catch { /* the tab keeps nothing */ } } };
async function proPost(path, data, token) {
  const res = await fetch(PRO_API + path + (token ? `?token=${encodeURIComponent(token)}` : ''), {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ data }) });
  return res.json().catch(() => ({}));
}
const proRefused = (j) => j && (j.status_code === 401 || j.status_code === 403);
const proTime = (t) => { if (!t) return 0; const n = +t; if (Number.isFinite(n)) return n < 1e12 ? n * 1000 : n; const d = Date.parse(t); return Number.isFinite(d) ? d : 0; };
function proState(u) {
  const t = proTime((u.last_update || {}).dtt || (u.last_update || {}).dts);
  if (!t) return 'never';
  const age = Date.now() - t;
  return age <= 3600000 ? 'live' : age <= 86400000 ? 'day' : 'stale';
}
async function proLoad() {
  const token = proToken.get(); if (!token) { proUnits = null; renderPro(); return; }
  proBusy = true; renderPro();
  try {
    const all = []; let total = null;
    for (let offset = 0; offset < 100000; offset += 1000) {
      // sections named in the official AVL Integration collection; job_order may say who installed a unit — shown in its detail
      const j = await proPost('/units/lists', { offset, limit: 1000, simplify: 0, projection: ['basic', 'last_update', 'groups', 'counters', 'job_order'] }, token);
      if (proRefused(j)) { proToken.set(null); proUnits = null; toast(t('pro_expired')); return; }
      const arr = (j && j.data && (Array.isArray(j.data) ? j.data : j.data.data)) || [];
      const pg = j && (j.pagination || (j.data && j.data.pagination));
      if (pg && pg.allCount != null) total = +pg.allCount;
      all.push(...arr); proProgress(all.length, total);
      if (arr.length < 1000 || (total != null && all.length >= total)) break;
    }
    proUnits = all;
  } catch { toast(t('pro_net')); } finally { proBusy = false; renderPro(); }
}
const proProgress = (n, total) => { const w = $('pro-wait'); if (w) w.textContent = t('pro_loading', { n, total: total ?? '…' }); };
async function proSignIn(user, pass) {
  const msg = $('pro-msg'); msg.className = 'msg'; msg.textContent = t('pro_signing');
  try {
    const j = await proPost('/auth/login', { username: user, password: pass });
    if (j && j.data && j.data.is_2fa) { msg.className = 'msg err'; msg.textContent = t('pro_2fa'); return; }
    const token = (j && j.data && (j.data.token || j.data.access_token)) || (j && j.token) || '';
    if (!token) { msg.className = 'msg err'; msg.textContent = j && j.message === 'invalid_credentials' ? t('pro_bad') : t('pro_refused', { why: String((j && (j.message || j.status_code)) || '') }); return; }
    proToken.set(token); msg.textContent = '';
    await proLoad();
  } catch { msg.className = 'msg err'; msg.textContent = t('pro_net'); }
}
function renderPro() {
  const body = $('pro-body'); if (!body) return;
  const site = el('a', { class: 'btn quiet', href: 'https://afaqy.pro/', target: '_blank', rel: 'noopener', text: `${t('pro_site')} ↗` });
  if (!proToken.get()) {
    const u = el('input', { type: 'text', id: 'pro-user', autocomplete: 'username', dir: 'ltr', required: true });
    const p = el('input', { type: 'password', id: 'pro-pass', autocomplete: 'current-password', dir: 'ltr', required: true });
    const go = () => { if (u.value.trim() && p.value) { const pw = p.value; p.value = ''; proSignIn(u.value.trim(), pw); } };
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    set(body, el('div', { class: 'step pro-login' }, el('span', { class: 'n', text: '١' }), el('div', {},
      el('h3', { text: t('pro_signin_h') }),
      el('label', {}, el('span', { text: t('pro_user') }), u), el('label', {}, el('span', { text: t('pro_pass') }), p),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary', text: t('pro_signin'), onclick: go }), site),
      el('p', { class: 'msg', id: 'pro-msg' }),
      el('p', { class: 'note info', text: t('pro_privacy') }))));
    return;
  }
  if (proBusy || !proUnits) { set(body, el('div', { class: 'empty', id: 'pro-wait', text: t('pro_loading', { n: 0, total: '…' }) })); return; }
  const count = { live: 0, day: 0, stale: 0, never: 0 };
  proUnits.forEach((u) => { count[proState(u)]++; });
  const q = proQuery.trim().toLowerCase();
  const rows = proUnits.filter((u) => !q || [u.name, u.imei, u.device_serial, u._id].some((v) => String(v || '').toLowerCase().includes(q)));
  const shown = rows.slice(0, 500);
  const search = el('input', { type: 'search', class: 'pro-search', placeholder: t('pro_search'), value: proQuery,
    oninput: (e) => { proQuery = e.target.value; const pos = e.target.selectionStart; renderPro(); const s = document.querySelector('.pro-search'); if (s) { s.focus(); s.setSelectionRange(pos, pos); } } });
  const iso = (x) => `\u2066${x}\u2069`;
  set(body,
    el('div', { class: 'row pro-bar' }, search,
      el('button', { type: 'button', class: 'btn', text: t('pro_refresh'), onclick: () => proLoad() }), site,
      el('button', { type: 'button', class: 'btn quiet', text: t('pro_out'), onclick: () => { proToken.set(null); proUnits = null; renderPro(); } })),
    el('div', { class: 'strip' },
      el('div', {}, el('b', { text: String(proUnits.length) }), el('span', { text: t('pro_total') })),
      el('div', {}, el('b', { text: String(count.live) }), el('span', { text: t('pro_live') })),
      el('div', {}, el('b', { text: String(count.day) }), el('span', { text: t('pro_day') })),
      el('div', {}, el('b', { text: String(count.stale + count.never) }), el('span', { text: t('pro_stale') }))),
    el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, ...['pro_col_name', 'pro_col_id', 'pro_col_last', 'pro_col_state', 'pro_col_where'].map((k) => el('th', { text: t(k) })))),
      el('tbody', {}, shown.length ? shown.flatMap((u) => {
        const lu = u.last_update || {}, ts = proTime(lu.dtt || lu.dts), st = proState(u), key = String(u._id || u.imei || u.name);
        const lat = +lu.lat, lng = +lu.lng;
        const tr = el('tr', { class: 'pro-row', onclick: () => { proOpen = proOpen === key ? null : key; renderPro(); } },
          el('td', { text: String(u.name || '—') }), el('td', { class: 'ltr', text: String(u.imei || u.device_serial || '—') }),
          el('td', { text: ts ? iso(new Date(ts + 3 * 3600000).toISOString().slice(0, 16).replace('T', ' ')) : '—' }),
          el('td', {}, el('span', { class: `pill pro-${st}`, text: t(`pro_st_${st}`) })),
          el('td', {}, Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)
            ? el('a', { href: `https://www.google.com/maps?q=${lat},${lng}`, target: '_blank', rel: 'noopener', text: t('pro_map'), onclick: (e) => e.stopPropagation() }) : '—'));
        return proOpen === key ? [tr, el('tr', { class: 'pro-detail' }, el('td', { colspan: '5' }, el('pre', { class: 'ltr', text: JSON.stringify(u, null, 1) })))] : [tr];
      }) : [el('tr', {}, el('td', { colspan: '5', text: t('pro_none') }))]))),
    rows.length > shown.length ? el('p', { class: 'hint', text: t('pro_more', { n: rows.length - shown.length }) }) : null);
}

// ---------- the side menu ----------
const iconOf = (x) => ({ sensor: 'heatmap', apihelper: 'api', canval: 'can', nusuk: 'survey' }[x.id] || x.icon || 'system');
const svg = (name) => { const s = el('span', { 'aria-hidden': 'true', style: 'display:contents' }); s.innerHTML = ICONS[name] || ''; return s; };
function renderSide() {
  set($('nav-modules'), MODULES.map((m) => el('a', { href: `#m-${m.id}`, class: 'sub', 'data-module': m.id, text: L(m.name, lang) })));
  set($('nav-systems'), SYSTEMS.map((x) => (x.id === 'pro' ? el('a', { href: '#pro', class: 'sub', 'data-view': 'pro', text: L(x.name, lang) }) : el('a', { href: x.url, class: 'sub', target: '_blank', rel: 'noopener' },
    el('span', { text: L(x.name, lang) }), el('span', { class: 'ext', 'aria-hidden': 'true', text: '↗' })))));
}
const setMenu = (open) => { document.body.classList.toggle('nav-open', open); $('menu-btn').setAttribute('aria-expanded', String(open)); };
// The groups fold as in the reference: one open at a time; the group holding the current page opens by itself.
function setGroup(section, open) {
  if (open) document.querySelectorAll('[data-nav-section]').forEach((o) => { if (o !== section) setGroup(o, false); });
  const btn = section.querySelector('[data-nav-group-toggle]');
  btn.setAttribute('aria-expanded', String(open));
  $(btn.getAttribute('aria-controls')).hidden = !open;
}
document.querySelectorAll('[data-nav-section]').forEach((section) => {
  const btn = section.querySelector('[data-nav-group-toggle]');
  // start every group in its stated state (Modules open, the others folded) — a fresh tab must not show them all
  $(btn.getAttribute('aria-controls')).hidden = btn.getAttribute('aria-expanded') !== 'true';
  btn.addEventListener('click', (e) => setGroup(section, e.currentTarget.getAttribute('aria-expanded') !== 'true'));
});

// ---------- modules: each tool's frame is created once and kept, hidden, while you work in another ----------
const frames = new Map();
function openModule(id) {
  const x = MODULES.find((m) => m.id === id);
  if (!x) { location.hash = '#tools'; return; }
  let frame = frames.get(id);
  if (!frame) {
    $('module-wait').hidden = false;
    frame = el('iframe', { src: x.url, title: L(x.name, lang), allow: MODULE_ALLOW, referrerpolicy: 'same-origin' });
    frame.addEventListener('load', () => { if (frames.get(currentModule) === frame) $('module-wait').hidden = true; });
    frames.set(id, frame);
    $('module-stage').append(frame);
  } else {
    $('module-wait').hidden = true;
  }
  for (const [k, f] of frames) f.hidden = k !== id;
  currentModule = id;
  $('module-open').href = x.url;
  $('page-title').textContent = L(x.name, lang);
  document.title = `${L(x.name, lang)} — ${t('brand')}`;
}
let currentModule = null;

// ---------- data: prompts ----------
function currentBlocks() {
  const months = +$('block-size').value || 3;
  const count = Math.max(1, Math.min(8, +$('block-count').value || 1));
  return periodBlocks(months, count);
}
function renderBlocks() {
  const have = new Set(datasets.map((d) => d.key));
  set($('blocks'), currentBlocks().map((b) => el('div', { class: 'block' },
    el('span', { class: 'lbl ltr', text: b.label }),
    el('span', { class: 'rng ltr', text: `${b.from} → ${b.to}` }),
    b.partial ? el('span', { class: 'pill', text: t('block_partial') }) : null,
    have.has(`${b.from}_${b.to}`) ? el('span', { class: 'have', text: '✓' }) : null,
    el('button', { type: 'button', class: 'btn', text: t('copy_prompt'), onclick: () => copyPrompt(b) }),
    reports.some((r) => r.key === `${b.from}_${b.to}`) ? el('span', { class: 'have', text: '✓' }) : null,
    el('button', { type: 'button', class: 'btn', text: t('copy_reports'), onclick: () => copyPrompt(b, buildReportsPrompt) }),
  )));
}
async function copyPrompt(b, build = buildPrompt) {
  const text = build({ from: b.from, to: b.to });
  try { await navigator.clipboard.writeText(text); toast(t('copied')); }
  catch {
    // clipboard blocked: show the text so it can be copied by hand
    $('paste').value = text; $('paste').select(); toast(t('copied'));
  }
}

// ---------- data: upload ----------
async function ingest(text) {
  const msg = $('read-msg');
  if (String(text).includes(REPORTS_SCHEMA)) {
    const r = parseReports(text);
    if (r.error) { msg.className = 'msg err'; msg.textContent = t(r.error, r.vars); return false; }
    reports = [...reports.filter((x) => x.key !== r.reports.key), r.reports].sort((a, b) => (a.range.from < b.range.from ? 1 : -1));
    await store.putReports(reports);
    msg.className = 'msg';
    msg.textContent = t('reports_loaded', { range: `${r.reports.range.from} → ${r.reports.range.to}`, n: r.reports.techPoints.reduce((s, m) => s + m.rows.length, 0), a: r.reports.afterSales.length });
    renderDatasets(); renderBlocks();
    return true;
  }
  const out = parseDataset(text);
  if (out.error) { msg.className = 'msg err'; msg.textContent = t(out.error, out.vars); return false; }
  datasets = mergeDataset(datasets, out.dataset);
  await store.put(datasets);
  msg.className = 'msg';
  msg.textContent = t('loaded', { n: out.dataset.tasks.length, range: `${out.dataset.range.from} → ${out.dataset.range.to}` }) + (out.skipped ? ` ${t('warn_rows', { n: out.skipped })}` : '');
  renderDatasets(); renderBlocks();
  return true;
}
function renderDatasets() {
  if (!datasets.length && !reports.length) { set($('datasets'), el('div', { class: 'empty', text: t('none_yet') })); return; }
  const reportRows = reports.map((r) => el('div', { class: 'ds' },
    el('span', { class: 'k ltr', text: `${r.range.from} → ${r.range.to}` }),
    el('span', { class: 'meta', text: t('reports_meta', { m: r.techPoints.length, a: r.afterSales.length }) }),
    el('button', { type: 'button', class: 'btn quiet', text: t('remove'), onclick: async () => { reports = reports.filter((x) => x.key !== r.key); await store.putReports(reports); renderDatasets(); renderBlocks(); } })));
  set($('datasets'), [...datasets.map((d) => {
    const c = completeness(d);
    return el('div', { class: 'ds' },
      el('span', { class: 'k ltr', text: `${d.range.from} → ${d.range.to}` }),
      el('span', { class: 'meta' }, t('tasks_n', { n: d.tasks.length }), d.parts && d.parts.length ? ` (${d.parts.join(', ')})` : ''),
      d.sample ? el('span', { class: 'pill', text: t('sample_note') }) : null,
      c.known ? el('span', { class: `pill ${c.complete ? 'ok' : 'warn'}`, text: c.complete ? t('complete') : t('incomplete', { got: c.got, want: c.want }) }) : null,
      el('button', { type: 'button', class: 'btn quiet', text: t('remove'), onclick: async () => { datasets = datasets.filter((x) => x.key !== d.key); await store.put(datasets); renderDatasets(); renderBlocks(); } }),
    );
  }), ...reportRows]);
}
function download(name, text) {
  const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name });
  document.body.append(a); a.click(); a.remove();
}

// ---------- KPIs ----------
let kpiKey = null;
// The team counted: chosen once and kept on this device. Until chosen, the Jeddah-branch teams from myafaqy.
function currentTeam(people, tasks) {
  try { const saved = JSON.parse(pref('team') || 'null'); if (Array.isArray(saved)) return saved; } catch { /* fall through */ }
  return defaultTeam(people, tasks);
}
function renderTeamPicker(people, team) {
  const chosen = new Set(team);
  const save = (ids) => { pref('team', JSON.stringify(ids)); renderKpi(); };
  const sorted = [...people].sort((a, b) => String(nameOf(a, lang)).localeCompare(String(nameOf(b, lang))));
  return el('details', { class: 'team' },
    el('summary', {}, `${t('team_title')} — ${t('team_count', { n: chosen.size, total: people.length })}`),
    el('p', { class: 'hint', text: t('team_hint') }),
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn', text: t('team_jeddah'), onclick: () => save(defaultTeam(people, allTasks())) }),
      el('button', { type: 'button', class: 'btn quiet', text: t('team_all'), onclick: () => save(people.map((p) => p.id)) })),
    el('div', { class: 'team-list' }, sorted.map((p) => el('label', { class: 'team-item' },
      el('input', { type: 'checkbox', checked: chosen.has(p.id), onchange: (e) => {
        const next = new Set(currentTeam(people, allTasks()));
        if (e.target.checked) next.add(p.id); else next.delete(p.id);
        save([...next]);
      } }),
      el('span', { text: nameOf(p, lang) }),
      p.teams && p.teams.length ? el('span', { class: 'muted', text: p.teams.join('، ') }) : null))));
}
const allTasks = () => datasets.flatMap((d) => d.tasks);
// the manager bookmark for the current quarter — one press inside myafaqy saves both files
function renderMgr() {
  const row = $('mgr-row'); if (!row) return;
  const q = currentBlocks()[0];
  const bm = buildManagerBookmarklet(q.from, q.to, undefined, lang);
  set(row, el('a', { class: 'btn primary bm', href: bm, draggable: 'true', text: `⬇ ${t('mgr_bm', { from: q.from, to: q.to })}`, onclick: (e) => { e.preventDefault(); toast(t('me_drag')); } }),
    el('button', { type: 'button', class: 'btn', text: t('me_copy'), onclick: async () => { try { await navigator.clipboard.writeText(decodeURIComponent(bm)); toast(t('me_copied')); } catch { toast(t('me_copy_fail')); } } }));
}
function renderKpi() {
  const body = $('kpi-body');
  if (!datasets.length) { set(body, el('div', { class: 'empty', text: t('no_data') })); return; }
  if (!datasets.some((d) => d.key === kpiKey)) kpiKey = datasets[0].key;
  const ds = datasets.find((d) => d.key === kpiKey);
  const people = peopleOf(datasets);
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const team = currentTeam(people, allTasks());
  const f = factor1(ds.tasks, { range: ds.range, team });
  const c = completeness(ds);
  const select = el('select', { id: 'kpi-period', onchange: (e) => { kpiKey = e.target.value; renderKpi(); } },
    datasets.map((d) => el('option', { value: d.key, selected: d.key === kpiKey, text: `${d.range.from} → ${d.range.to}${d.sample ? ' *' : ''}` })));
  const rateCell = (r) => el('span', { class: 'rate' }, el('i', {}, el('b', { style: `width:${Math.round((r || 0) * 100)}%` })), formatRate(r));
  const name = (r) => (r.id === GROUP ? t('group_bucket') : (nameOf(peopleById.get(r.id), lang) || r.name));
  const cols = ['col_person', 'col_assigned', 'col_done', 'col_rate', 'col_avg', 'col_median', 'col_open', 'col_cancelled', 'col_email', 'col_self', ...(ds.rdKnown ? ['col_rd'] : []), 'col_created'];
  const maxDone = Math.max(1, ...f.people.map((r) => r.done));
  const ordered = [...f.people].sort((a, b) => kpiSort === 'median' ? ((b.medianHours ?? -1) - (a.medianHours ?? -1)) : kpiSort === 'open' ? (b.open - a.open) : (b.done - a.done));
  const line = (r, cls) => el('tr', { class: cls },
    el('td', {}, el('div', { text: cls === 'total' ? t('team') : name(r) }), cls || !positionOf(roster(), r.id, lang) ? null : el('div', { class: 'hint', text: positionOf(roster(), r.id, lang) })),
    el('td', { class: 'num', text: r.assigned }), el('td', { class: 'num' }, cls ? String(r.done) : el('div', { class: 'bar-cell' }, el('b', { text: String(r.done) }), el('i', {}, el('span', { style: `width:${Math.round((r.done / maxDone) * 100)}%` })))),
    el('td', { class: 'num' }, rateCell(r.rate)),
    el('td', { class: 'num', text: formatHours(r.avgHours, lang) }), el('td', { class: 'num', text: formatHours(r.medianHours, lang) }),
    el('td', { class: 'num', text: r.open }), el('td', { class: 'num', text: r.cancelled }),
    el('td', { class: 'num', text: r.fromEmail }), el('td', { class: 'num', text: r.selfLogged }), ds.rdKnown ? el('td', { class: 'num', text: r.rd }) : null, el('td', { class: 'num', text: r.created }));
  const table = el('div', { class: 'table-wrap' }, el('table', {},
    el('thead', {}, el('tr', {}, cols.map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
    el('tbody', {}, ordered.map((r) => line(r)), f.group ? line({ ...f.group, id: GROUP }, 'group') : null, line(f.team, 'total'))));

  // comparison: team totals per uploaded period, oldest to newest
  const trend = [...datasets].reverse().map((d) => ({ d, f: factor1(d.tasks, { range: d.range, team }).team }));
  const trendTable = el('div', { class: 'table-wrap' }, el('table', {},
    el('thead', {}, el('tr', {}, el('th', { text: t('period') }), ['col_assigned', 'col_done', 'col_rate', 'col_median', 'col_email'].map((k) => el('th', { class: 'num', text: t(k) })))),
    el('tbody', {}, trend.map(({ d, f: x }) => el('tr', { class: d.key === kpiKey ? 'total' : null },
      el('td', { class: 'ltr', text: `${d.range.from} → ${d.range.to}${d.sample ? ' *' : ''}` }),
      el('td', { class: 'num', text: x.assigned }), el('td', { class: 'num', text: x.done }), el('td', { class: 'num', text: formatRate(x.rate) }),
      el('td', { class: 'num', text: formatHours(x.medianHours, lang) }), el('td', { class: 'num', text: x.fromEmail }))))));

  set(body,
    el('div', { class: 'bar' }, el('label', {}, el('span', { text: t('period') }), select)),
    renderTeamPicker(people, team),
    ds.sample ? el('p', { class: 'note sample', text: t('sample_note') }) : null,
    c.known && !c.complete ? el('p', { class: 'note', text: `${t('data_incomplete_warn')} (${t('incomplete', { got: c.got, want: c.want })})` }) : null,
    el('div', { class: 'strip six' },
      el('div', { class: 'lead' }, el('b', { text: f.team.done }), el('span', { text: t('col_done') })),
      el('div', {}, el('b', { text: f.team.assigned }), el('span', { text: t('col_assigned') })),
      el('div', {}, el('b', { text: formatRate(f.team.rate) }), el('span', { text: t('col_rate') })),
      el('div', {}, el('b', { text: formatHours(f.team.medianHours, lang) }), el('span', { text: t('col_median') })),
      el('div', {}, el('b', { text: f.team.open }), el('span', { text: t('col_open') })),
      el('div', {}, el('b', { text: `${f.team.fromEmail} · ${f.team.selfLogged}` }), el('span', { text: `${t('col_email')} · ${t('col_self')}` }))),
    el('div', { class: 'row', style: 'justify-content:space-between;align-items:center;margin-bottom:8px' },
      el('p', { class: 'hint', style: 'margin:0', text: t('kpi_table_sub') }),
      el('div', { class: 'pills' }, [['done', 'kpi_sort_done'], ['median', 'kpi_sort_median'], ['open', 'kpi_sort_open']].map(([k, label]) =>
        el('button', { type: 'button', class: `pill-btn${kpiSort === k ? ' on' : ''}`, text: t(label), onclick: () => { kpiSort = k; renderKpi(); } })))),
    table,
    renderKpiDonuts(ds, f, team),
    datasets.length > 1 ? [el('h2', { text: t('trend') }), el('p', { class: 'hint', text: t('trend_sub') }),
      el('div', { class: 'columns' }, trend.map(({ d, f: x }) => el('div', { class: `column${d.key === kpiKey ? ' on' : ''}` },
        el('b', { text: String(x.done) }), el('i', { style: `height:${Math.max(6, Math.round((x.done / Math.max(1, ...trend.map((q) => q.f.done))) * 140))}px` }),
        el('span', { class: 'ltr', text: `${d.range.from.slice(0, 7)} → ${d.range.to.slice(0, 7)}` }), el('small', { text: `${formatRate(x.rate)} · ${formatHours(x.medianHours, lang)}` })))),
      trendTable] : null,
    renderReports(ds.key),
    el('h2', { text: t('definitions') }),
    el('ul', { class: 'defs' }, DEFINITIONS.map((k) => el('li', { text: t(k) }))));
}

// ---------- the board's donuts: who did the work, where it came from, and the tickets' state ----------
function renderKpiDonuts(ds, f, team) {
  const peopleById = new Map(peopleOf(datasets).map((p) => [p.id, p]));
  const name = (id) => nameOf(peopleById.get(id), lang) || id;
  const byPerson = [...f.people].filter((r) => r.done > 0).sort((a, b) => b.done - a.done);
  const top = byPerson.slice(0, 6).map((r) => ({ label: name(r.id), value: r.done }));
  const rest = byPerson.slice(6).reduce((s, r) => s + r.done, 0);
  if (rest) top.push({ label: t('others'), value: rest, color: 'var(--line-strong)' });
  const inRange = (x) => x.state === 'done' && x.completedAt && saudiDay(x.completedAt) >= ds.range.from && saudiDay(x.completedAt) <= ds.range.to && team.includes(x.assigneeId);
  const done = ds.tasks.filter(inRange);
  const isSelf = (x) => x.own === true || (x.createdById && x.createdById === x.assigneeId);
  const email = done.filter((x) => x.fromEmail).length, self = done.filter((x) => !x.fromEmail && isSelf(x)).length;
  const rep = reports.find((r) => r.key === ds.key);
  const tk = rep ? afterSalesTotals(rep).total : null;
  return el('div', { class: 'donuts' },
    top.length ? donut(t('kpi_dist_h'), top) : null,
    done.length ? donut(t('kpi_src_h'), [{ label: t('src_other'), value: done.length - email - self }, { label: t('src_email'), value: email }, { label: t('src_self'), value: self }]) : null,
    tk && tk.total ? donut(t('kpi_tickets_h'), [{ label: t('f3_done'), value: tk.done, color: 'var(--ok)' }, { label: t('f3_pending'), value: tk.pending, color: 'var(--signal)' }, { label: t('f3_open'), value: tk.open, color: 'var(--note)' }]) : null);
}

// ---------- the Team page: positions and leaders by myafaqy id, kept on this device and exportable as team.json ----------
function renderTeam() {
  const body = $('team-body'); if (!body) return;
  const known = new Map();
  for (const p of peopleOf(datasets)) known.set(p.id, p);
  if (me) for (const p of me.people) if (!known.has(p.id)) known.set(p.id, p);
  for (const id of Object.keys(roster().people)) if (!known.has(id)) known.set(id, { id, nameEn: '', nameAr: '', teams: [] });
  const people = [...known.values()].sort((a, b) => (nameOf(a, lang) || a.id).localeCompare(nameOf(b, lang) || b.id, lang));
  const ro = roster();
  const save = async (id, patch) => {
    rosterDevice = parseRoster(rosterDevice);
    rosterDevice.people[id] = { ...(ro.people[id] || {}), ...(rosterDevice.people[id] || {}), ...patch };
    if (!rosterDevice.people[id].position && !rosterDevice.people[id].leaderId) delete rosterDevice.people[id];
    await store.putRoster(rosterDevice); renderTeam(); renderMe(); renderKpi();
  };
  const download = () => {
    const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(roster(), null, 2)], { type: 'application/json' })), download: 'team.json' });
    document.body.append(a); a.click(); a.remove();
  };
  const upload = el('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { rosterDevice = parseRoster(JSON.parse(await file.text())); await store.putRoster(rosterDevice); toast(t('team_loaded', { n: Object.keys(rosterDevice.people).length })); renderTeam(); renderMe(); renderKpi(); }
    catch { toast(t('err_json')); }
    e.target.value = '';
  } });
  const leaderSelect = (id) => el('select', { onchange: (e) => save(id, { leaderId: e.target.value || null }) },
    el('option', { value: '', text: t('team_no_leader'), selected: !leaderOf(ro, id) }),
    people.filter((p) => p.id !== id).map((p) => el('option', { value: p.id, text: nameOf(p, lang) || p.id, selected: leaderOf(ro, id) === p.id })));
  set(body,
    el('p', { class: 'note info', text: t('team_note') }),
    el('div', { class: 'row', style: 'margin-bottom:14px' },
      el('button', { type: 'button', class: 'btn primary', text: t('team_download'), onclick: download }),
      el('button', { type: 'button', class: 'btn', text: t('team_upload'), onclick: () => upload.click() }), upload,
      el('span', { class: 'hint', text: t('team_filled', { n: Object.keys(ro.people).length, m: people.length }) })),
    people.length ? el('div', { class: 'table-wrap team-table' }, el('table', {},
      el('thead', {}, el('tr', {}, ['team_col_name', 'team_col_id', 'team_col_pos', 'team_col_leader'].map((k) => el('th', { text: t(k) })))),
      el('tbody', {}, people.map((p) => el('tr', {},
        el('td', {}, el('div', { text: nameOf(p, lang) || '—' }), p.teams && p.teams.length ? el('div', { class: 'hint', text: p.teams.join(' · ') }) : null),
        el('td', { class: 'ltr', text: p.id }),
        el('td', {}, el('input', { type: 'text', value: positionOf(ro, p.id), placeholder: t('team_pos_ph'), onchange: (e) => save(p.id, { position: e.target.value.trim() }) })),
        el('td', {}, leaderSelect(p.id)))))))
      : el('div', { class: 'empty', text: t('team_none') }));
}

// ---------- Factor 2 (technician points) and Factor 3 (after-sales tickets), from the reports file of the same period ----------
function renderReports(key) {
  const rep = reports.find((r) => r.key === key);
  const head = [el('h2', { text: t('f2_title') })];
  if (!rep) return [...head, el('p', { class: 'note info', text: t('reports_none') })];
  const nm = (r) => (lang === 'en' ? r.nameEn || r.nameAr : r.nameAr || r.nameEn) || r.technicianId;
  const tt = techTotals(rep), at = afterSalesTotals(rep);
  const months = rep.techPoints.map((m) => m.month).join('، ');
  const tcols = [['f2_name', null], ['f2_installed', 'installedDeviceCount'], ['f2_maint', 'maintainedDeviceCount'], ['f2_fix', 'maintainedFixDeviceCount'],
    ['f2_reservice', 'reServiceDeviceCount'], ['f2_stop', 'stopServiceDeviceCount'], ['f2_group', 'groupInstallationCount'],
    ['f2_extra', 'additionalWorkCount'], ['f2_viol', 'violationCount'], ['f2_points', 'totalPoint']];
  const line = (r, cls, label) => el('tr', { class: cls }, el('td', { text: label || nm(r) }), ...tcols.slice(1).map(([, f]) => el('td', { class: 'num', text: r[f] })));
  return [...head,
    el('p', { class: 'hint', text: t('f2_sub', { months }) }),
    tt.rows.length ? el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, tcols.map(([k], i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
      el('tbody', {}, tt.rows.map((r) => line(r)), line(tt.total, 'total', t('team'))))) : el('div', { class: 'empty', text: t('f2_none') }),
    el('h2', { text: t('f3_title') }),
    el('p', { class: 'hint', text: t('f3_sub') }),
    at.rows.length ? el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, ['f3_name', 'f3_open', 'f3_pending', 'f3_done', 'f3_total'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
      el('tbody', {}, at.rows.map((r) => el('tr', {}, el('td', { text: r.name }), ...[r.open, r.pending, r.done, r.total].map((v) => el('td', { class: 'num', text: v })))),
        el('tr', { class: 'total' }, el('td', { text: t('team') }), ...[at.total.open, at.total.pending, at.total.done, at.total.total].map((v) => el('td', { class: 'num', text: v })))))) : el('div', { class: 'empty', text: t('f3_none') })];
}

// ---------- guide: every feature is written here — a feature missing from the guide does not exist for the team ----------
function renderGuide() {
  // dates and version numbers are isolated, so right-to-left text never reverses 2026-10-29 into 29-10-2026
  const iso = (x) => `\u2066${x}\u2069`;
  const stamp = release ? t('g_version', { v: iso(release.version), date: iso(release.date) }) : t('g_version', { v: iso(PORTAL_VERSION), date: '' }).replace(/ — $/, '');
  set($('guide-body'),
    el('div', { class: 'guide-head' }, el('span', { class: 'guide-ver', text: stamp }),
      el('button', { type: 'button', class: 'btn no-print', text: t('g_print'), onclick: () => window.print() })),
    GUIDE.map(([h, b]) => el('section', {}, el('h3', { text: t(h) }), el('p', { text: t(b) }))),
    el('section', {}, el('h3', { text: t('definitions') }), el('ul', { class: 'defs' }, DEFINITIONS.map((k) => el('li', { text: t(k) })))));
}

// ---------- version: what is new, and a newer version waiting ----------
// version.json is the one network read the page makes: it is this site's own file, read fresh to show the notes
// and to notice when the cached page is older than what is published.
let release = null;
async function loadRelease() {
  try {
    const res = await fetch('./version.json', { cache: 'no-store' });
    if (!res.ok) return;
    release = await res.json();
    renderGuide();
    if (release && release.version && release.version !== PORTAL_VERSION) $('update-bar').hidden = false;
  } catch { /* offline: the notes simply are not shown */ }
}
function openNews() {
  const notes = (release && release.notes && (release.notes[lang] || release.notes.ar)) || [];
  $('news-date').textContent = release ? `\u2066v${release.version} — ${release.date}\u2069` : `\u2066v${PORTAL_VERSION}\u2069`;
  set($('news-list'), notes.map((n) => el('li', { text: n })));
  $('news-dialog').showModal();
}

// ---------- language, theme, routing ----------
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = dirOf(lang);
  document.querySelectorAll('[data-t]').forEach((n) => { n.textContent = t(n.dataset.t); });
  document.querySelectorAll('[data-tp]').forEach((n) => { n.placeholder = t(n.dataset.tp); });
  $('lang-select').value = lang;
  $('menu-btn').setAttribute('aria-label', t('menu'));
  paintThemeButton();
  document.title = `${t('brand')} — ${t('portal')}`;
  renderSide(); renderTools(); renderBlocks(); renderDatasets(); renderKpi(); renderGuide(); renderMe(); renderPro(); renderMgr(); renderTeam();
  for (const [id, f] of frames) f.title = L((MODULES.find((m) => m.id === id) || {}).name, lang);
  route();
}
const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
function paintThemeButton() { $('theme-btn').textContent = isDark() ? t('theme_light') : t('theme_dark'); }
function applyTheme() {
  const v = pref('theme');
  if (v === 'light' || v === 'dark') document.documentElement.dataset.theme = v; else delete document.documentElement.dataset.theme;
  paintThemeButton();
}
function route() {
  const views = ['tools', 'me', 'pro', 'data', 'kpi', 'team', 'guide'];
  let hash = location.hash.slice(1);
  if (hash.startsWith('me-')) {
    if (hash === 'me-wait') {
      hash = 'me'; setTimeout(() => renderMe(true));
      // if the bookmark never delivers (it failed, or the person closed myafaqy), the page does not wait forever
      setTimeout(() => { if (location.hash === '#me-wait') { history.replaceState(null, '', '#me'); renderMe(); } }, 90000);
    }
    else { const payload = hash.slice(3); hash = 'me'; receiveMe(payload); }
  }
  const mod = hash.startsWith('m-') ? hash.slice(2) : null;
  const v = mod ? 'module' : views.includes(hash) ? hash : 'tools';
  for (const id of [...views, 'module']) $(`view-${id}`).hidden = id !== v;
  document.body.classList.toggle('in-module', v === 'module');
  if (mod) openModule(mod);
  else { document.title = `${t('brand')} — ${t('portal')}`; $('page-title').textContent = t({ tools: 'portal', me: 'nav_me', pro: 'nav_pro', data: 'nav_data', kpi: 'kpi_board', team: 'nav_team', guide: 'nav_guide' }[v]); currentModule = null; }
  $('module-open').hidden = v !== 'module';
  // one item in the menu is current — the open module, or the page — and its group is the open one
  let current = null;
  document.querySelectorAll('.nav a').forEach((a) => {
    const on = mod ? a.dataset.module === currentModule : a.dataset.view === v;
    a.classList.toggle('active', on);
    if (on) { a.setAttribute('aria-current', 'page'); current = a; } else a.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-nav-section]').forEach((section) => { section.dataset.active = String(!!current && section.contains(current)); });
  const holder = current && current.closest('[data-nav-section]');
  if (holder) setGroup(holder, true);
  setMenu(false);
  if (v === 'kpi') renderKpi();
  if (v === 'pro' && proToken.get() && !proUnits && !proBusy) proLoad();
  if (v === 'team') renderTeam();
}

// ---------- wiring ----------
$('menu-btn').addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
$('scrim').addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
$('lang-select').addEventListener('change', (e) => { if (LANGS.includes(e.target.value)) { lang = e.target.value; pref('lang', lang); applyLang(); } });
$('theme-btn').addEventListener('click', () => {
  pref('theme', isDark() ? 'light' : 'dark'); applyTheme();
});
['block-size', 'block-count'].forEach((id) => $(id).addEventListener('input', () => { renderBlocks(); renderMgr(); }));
$('read-text').addEventListener('click', async () => { if (await ingest($('paste').value)) $('paste').value = ''; });
$('file-in').addEventListener('change', async (e) => { for (const f of e.target.files) await ingest(await f.text()); e.target.value = ''; });
$('export-btn').addEventListener('click', () => download(`afaqy-kpi-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ backup: 'afaqy-portal/v1', datasets }, null, 1)));
$('import-in').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.backup !== 'afaqy-portal/v1' || !Array.isArray(j.datasets)) throw new Error('format');
    for (const d of j.datasets) datasets = mergeDataset(datasets, d);
    await store.put(datasets); renderDatasets(); renderBlocks(); toast(t('loaded', { n: datasets.reduce((s, d) => s + d.tasks.length, 0), range: '' }));
  } catch { toast(t('err_json')); }
});
$('sample-btn').addEventListener('click', async () => {
  for (const b of periodBlocks(3, 2)) { const out = parseDataset(sampleDataset({ from: b.from, to: b.to }, b.from.length + +b.from.slice(5, 7))); datasets = mergeDataset(datasets, out.dataset); }
  await store.put(datasets); renderDatasets(); renderBlocks(); location.hash = '#kpi';
});
window.addEventListener('hashchange', route);
$('version').addEventListener('click', openNews);
$('news-close').addEventListener('click', () => $('news-dialog').close());
$('update-btn').addEventListener('click', () => location.reload());

(async () => {
  $('version').textContent = `v${PORTAL_VERSION}`;
  // the service worker is scoped to this folder only, so it can never take over the other tools on the same domain
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  applyTheme();
  datasets = await store.get();
  reports = await store.getReports();
  me = upgradeMe(await store.getMe());   // a profile saved by an older version is brought up to shape, never dropped
  rosterDevice = parseRoster(await store.getRoster());
  try { const r = await fetch('./team.json', { cache: 'no-store' }); rosterRepo = r.ok ? parseRoster(await r.json()) : null; } catch { rosterRepo = null; }
  applyLang();   // renders everything and routes
  loadRelease();
})();
