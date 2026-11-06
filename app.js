// app.js — everything on the page. Data stays in this browser (IndexedDB); nothing is sent anywhere.
import { PRIMARY, SYSTEMS as DEFAULT_SYSTEMS, SYSTEM_CATEGORIES as DEFAULT_SYSTEM_CATEGORIES, MORE, PORTAL_VERSION, MODULE_ALLOW } from './config.js';
import { mountTourDemo, replayTourDemo } from './tour-demo.js';
import {
  t as tr, L, LANGS, dirOf, tourState, TOUR_DEVICES, tourDemoPlan, periodBlocks, buildPrompt, parseDataset, mergeDataset, completeness, factor1, plannerSummary, mailKey,
  formatHours, formatRate, sampleDataset, GROUP, GUIDE, DEFINITIONS, peopleOf, defaultTeam, nameOf,
  buildBookmarklet, parseMe, parseMePayload, myProfile, openTasks, profileMonths, upgradeMe,
  parseRoster, mergeRoster, positionOf, leaderOf, donutParts, ROSTER_SCHEMA, saudiDay, teamAlerts, buildAssignBookmarklet,
  parseWeights, mergeWeights, weightedPoints, typeKey, taskWeight, taskPoints, activityWeight, baseFromFactors, tierFromBase, rulesOf, parseRules, rulesAreDefault, factorScore, DEFAULT_RULES, afterHours, pointsDetail, EXTRA_CONDS, businessHours, isCustomMode, TEAMTYPES_AUTO_SCHEMA, buildTypesBookmarklet, parseTeamTypesTransfer, buildOrg, compareOrg, JEDDAH_BRANCH, managerPullRecipe, overtimeOf, SOURCES, taskSource, POINT_MODES, FACTORS, typeLabel, loadStrings, weightPublishDiff, publishableWeights, portalWeights, WEIGHT_STEPS, TIERS, scopeIds, inScope, scopeApplies, canEditWeight, isWeightsAdmin,
  monthCard, teamMonth, closableMonths, monthRange, prevMonth, ARCHETYPES, ymd,
  weeklyDigest, goalProgress, patternPath, coverageTotals, CARD_DEFAULTS, shareWindow, workloadShare, repairCheck, parseRepairLines,
  mailRow, mailStats, MAIL_CATEGORIES, lastQuarters, supersede, engineerLevels, developmentPlan, LEVELS, loadSustainability,
  safePortalUrl, buildReportsPrompt, parseReports, techTotals, afterSalesTotals, activityTotals, REPORTS_SCHEMA, buildManagerBookmarklet, parseManagerTransfer, MANAGER_AUTO_SCHEMA, portalRoute,
  quarterRange, quarterOf, quarterBaseline, quarterGoalProgress, planProgress, suggestQuarterGoals,
} from './core.js';

import { validateSystems } from './systems-core.js';

let SYSTEMS = DEFAULT_SYSTEMS, SYSTEM_CATEGORIES = DEFAULT_SYSTEM_CATEGORIES;
const $ = (id) => document.getElementById(id);
// Same application, two presentation links. The existing URL stays the full admin portal.
// Team mode removes management navigation, but is deliberately NOT an authentication boundary.
const isTeamPortal = new URLSearchParams(location.search).get('portal') === 'team';
// A single temporary token pairs the myafaqy bookmarklet with the admin tab it opened.
const managerImportTokenParam = new URLSearchParams(location.search).get('mgrImport');
const managerImportNonce = !isTeamPortal && /^[0-9a-f]{32}$/.test(managerImportTokenParam || '') ? managerImportTokenParam : null;
let managerImportBusy = false, managerImportDone = false;
const KEY = 'afaqy-portal:';
const pref = (k, v) => { try { if (v === undefined) return localStorage.getItem(KEY + k); localStorage.setItem(KEY + k, v); } catch { return null; } return v; };

let lang = LANGS.includes(pref('lang')) ? pref('lang') : 'en';   // English by default; a reader's own choice is kept
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
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(String(k)));
  return n;
}
const set = (node, ...kids) => { node.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false)); };

function toast(msg) {
  const n = $('toast'); n.textContent = msg; n.classList.add('on');
  clearTimeout(toast.h); toast.h = setTimeout(() => n.classList.remove('on'), 3200);
}

// ---------- storage: IndexedDB, with an in-memory fallback where it is unavailable ----------
const store = (() => {
  let mem = []; let memPlanner = null; let memProj = null; let memReg = null; let memMe = null; let memRep = []; let memRoster = null; let memWeights = null; let memCards = {}; let memMeet = {}; let memRepairs = []; let memPriv = []; let memMail = [];
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
    async getPriv() { try { return (await run('readonly', (s) => s.get('privlinks'))) || []; } catch { return memPriv; } },
    async putPriv(v) { try { await run('readwrite', (s) => s.put(v, 'privlinks')); } catch { memPriv = v; } },
    async getProjects() { try { return (await run('readonly', (s) => s.get('projects'))) || null; } catch { return memProj; } },
    async getPlanner() { try { return (await run('readonly', (s) => s.get('planner'))) || null; } catch { return memPlanner; } },
    async putPlanner(v) { try { await run('readwrite', (s) => (v ? s.put(v, 'planner') : s.delete('planner'))); } catch { memPlanner = v; } },
    async putProjects(v) { try { await run('readwrite', (s) => s.put(v, 'projects')); } catch { memProj = v; } },
    async kvGet(k) { try { return (await run('readonly', (s) => s.get(k))) || null; } catch { return null; } },
    async kvPut(k, v) { try { await run('readwrite', (s) => (v == null ? s.delete(k) : s.put(v, k))); } catch { /* storage unavailable */ } },
    async getRegister() { try { return (await run('readonly', (s) => s.get('register'))) || null; } catch { return memReg; } },
    async putRegister(v) { try { await run('readwrite', (s) => s.put(v, 'register')); } catch { memReg = v; } },
    async getMail() { try { return (await run('readonly', (s) => s.get('mailrows'))) || []; } catch { return memMail; } },
    async putMail(v) { try { await run('readwrite', (s) => s.put(v, 'mailrows')); } catch { memMail = v; } },
    async getRepairs() { try { return (await run('readonly', (s) => s.get('repairs'))) || []; } catch { return memRepairs; } },
    async putRepairs(v) { try { await run('readwrite', (s) => s.put(v, 'repairs')); } catch { memRepairs = v; } },
    async getMeet() { try { return (await run('readonly', (s) => s.get('oneonone'))) || {}; } catch { return memMeet; } },
    async putMeet(v) { try { await run('readwrite', (s) => s.put(v, 'oneonone')); } catch { memMeet = v; } },
    async getCards() { try { return (await run('readonly', (s) => s.get('cards'))) || {}; } catch { return memCards; } },
    async putCards(v) { try { await run('readwrite', (s) => s.put(v, 'cards')); } catch { memCards = v; } },
    async getWeights() { try { return (await run('readonly', (s) => s.get('weights'))) || null; } catch { return memWeights; } },
    async putWeights(v) { try { await run('readwrite', (s) => (v ? s.put(v, 'weights') : s.delete('weights'))); } catch { memWeights = v; } },
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
  // every team tool as a card: what it does, and how it helps the team
  const allTools = [...PRIMARY, ...MORE.filter((x) => x.module && x.status === 'live')]; const toolById = new Map(allTools.map((x) => [x.id, x]));
  set($('primary'), sortByOrder(allTools.map((x) => x.id), 'tools').map((id) => toolById.get(id)).map((x) => {
    const icon = el('span', { 'aria-hidden': 'true' }); icon.innerHTML = ICONS[x.icon] || ICONS.api || '';
    return moduleLink(x, 'tool', icon, el('span', { class: 'name', text: L(x.name, lang) }), x.desc ? el('span', { class: 'desc', text: L(x.desc, lang) }) : null,
      x.helps ? el('span', { class: 'helps' }, el('b', { text: `${t('tool_helps')}: ` }), L(x.helps, lang)) : null,
      x.module ? el('span', { class: 'badge', text: t('in_portal') }) : null, el('span', { class: 'go', text: t('open') }));
  }));
  for (const c of $('primary').children) { const id = (c.getAttribute('href') || '').replace('#m-', ''); if (id) c.dataset.id = id; }
  { const cards = [...document.querySelectorAll('[data-intro]')], hide = () => { pref('intro_hidden', '1'); cards.forEach((c) => { c.hidden = true; }); toast(t('intro_hidden_toast')); };
    cards.forEach((c) => { c.hidden = pref('intro_hidden') === '1'; const x = c.querySelector('.intro-hide'); if (x) x.onclick = hide; }); }
  makeSortable($('primary'), 'tools');
  $('manage-systems').hidden = isTeamPortal;
  { const navHome = $('nav-home-mgr'); if (navHome) navHome.hidden = isTeamPortal;   // the control room is the manager's; on his link «الرئيسية» names the tools page
    if (!isTeamPortal) { const lbl = document.querySelector('.nav a[href="#tools"] [data-t="nav_home"], .nav a[href="#tools"] [data-t="nav_tools_mgr"]'); if (lbl) { lbl.dataset.t = 'nav_tools_mgr'; lbl.textContent = t('nav_tools_mgr'); } const top = document.querySelector('.topbar-home'); if (top) top.setAttribute('href', '#home'); } }
  set($('systems'), SYSTEM_CATEGORIES.map((c) => el('section', { class: 'systems-category' }, el('h3', { text: L(c.name, lang) }), el('div', { class: 'row' }, SYSTEMS.filter((x) => x.category === c.id).map((x) => el('a', { class: 'chip', href: x.url, target: '_blank', rel: 'noopener', text: L(x.name, lang) }))))));
  set($('more'), MORE.filter((x) => !x.module).map((x) => (x.status === 'live'
    ? moduleLink(x, 'chip', L(x.name, lang))
    : el('span', { class: 'chip soon' }, L(x.name, lang), el('span', { class: 'tag', text: t('soon') })))));
  renderPrivLinks();
}

// ---------- my KPIs (ADR-0010) ----------
// This guide can be reopened after importing KPIs; it does not start any CRM request itself.
let tourStep = 0;
let tourDevice = /iPad|iPhone|iPod/i.test(navigator.userAgent) ? 'ios'
  : /Android/i.test(navigator.userAgent) ? 'android' : 'desktop';
function renderMeTour() {
  if (!$('me-tour').open) return;
  const state = tourState(tourStep, tourDevice);
  tourStep = state.step; tourDevice = state.device;
  const count = t('tour_count', { n: state.step + 1, total: state.total });
  $('tour-count').textContent = count;
  $('tour-progress').setAttribute('aria-valuenow', String(state.progress));
  $('tour-progress').setAttribute('aria-valuetext', count);
  $('tour-progress-bar').style.width = state.progress + '%';
  const titles = ['tour_0_title', 'tour_1_title', 'tour_2_title', 'tour_3_title', 'tour_4_title'];
  const descs = [
    'tour_0_desc',
    { desktop: 'tour_1_desktop', android: 'tour_1_android', ios: 'tour_1_ios' },
    'tour_2_desc',
    { desktop: 'tour_3_desktop', android: 'tour_3_android', ios: 'tour_3_ios' },
    'tour_4_desc',
  ];
  const deviceLabels = { desktop: 'tour_desktop', android: 'tour_android', ios: 'tour_ios' };
  $('tour-title').textContent = t(titles[state.step]);
  const description = descs[state.step];
  $('tour-desc').textContent = t(typeof description === 'string' ? description : description[state.device]);
  const options = state.step === 0 ? TOUR_DEVICES.map((device) =>
    el('button', { type: 'button', class: 'tour-device' + (device === tourDevice ? ' picked' : ''),
      'aria-pressed': String(device === tourDevice), text: t(deviceLabels[device]),
      onclick: () => { tourDevice = device; renderMeTour(); } })) : [];
  set($('tour-options'), options);
  const action = [];
  if (state.step === 1) {
    if (state.device === 'desktop') {
      action.push(el('a', { class: 'btn primary bm', href: buildBookmarklet(portalHome(), lang), draggable: 'true',
        text: t('tour_bookmark'), onclick: (e) => { e.preventDefault(); toast(t('me_drag')); } }));
    } else {
      action.push(el('button', { type: 'button', class: 'btn primary', text: t('tour_copy'),
        onclick: async () => {
          try {
            await navigator.clipboard.writeText(decodeURIComponent(buildBookmarklet(portalHome(), lang)));
            toast(t('me_copied'));
          } catch { toast(t('me_copy_fail')); }
        } }));
    }
  }
  if (state.step === 2 || state.step === 3) action.push(el('a', {
    class: 'btn primary', href: 'https://myafaqy.com/', target: '_blank', rel: 'noopener',
    text: t('tour_open_site') }));
  set($('tour-actions'), action);
  $('tour-status').textContent = state.step === 4 ? t(me ? 'tour_4_present' : 'tour_4_pending') : '';
  $('tour-privacy').hidden = state.step !== 4;
  $('tour-privacy').textContent = t('tour_privacy_note');
  mountTourDemo($('tour-demo-stage'), tourDemoPlan(tourStep, tourDevice), t, location.origin + location.pathname);
  $('tour-demo-caption').textContent = t('tour_demo_hint');
  $('tour-demo-replay').textContent = t('tour_demo_replay');
  $('tour-demo-replay').setAttribute('aria-label', t('tour_demo_replay_aria'));
  $('tour-back').disabled = state.step === 0;
  $('tour-back').textContent = t('tour_back');
  $('tour-next').textContent = t(state.step === 4 ? 'tour_finish' : 'tour_next');
  // Re-enter the current slide after each step so its movement is visible.
  const slide = $('tour-slide');
  slide.classList.remove('tour-arrive');
  void slide.offsetWidth;
  slide.classList.add('tour-arrive');
}
function openMeTour() {
  tourStep = 0;
  $('me-tour').showModal();
  renderMeTour();
}
$('tour-demo-replay').addEventListener('click', () => replayTourDemo($('tour-demo-stage')));
$('me-tour-open').addEventListener('click', openMeTour);
$('me-tour-close').addEventListener('click', () => $('me-tour').close());
$('tour-back').addEventListener('click', () => { tourStep--; renderMeTour(); });
$('tour-next').addEventListener('click', () => {
  if (tourStep === 4) $('me-tour').close();
  else { tourStep++; renderMeTour(); }
});
$('me-tour').addEventListener('close', () => $('me-tour-open').focus());

let me = null;
// «اعرض كـ» (ADR-0042): the manager sees one person's «مؤشراتي» exactly as it is drawn for them, from the manager's own pulls.
// Read only — the real profile is put aside and restored; nothing is written while viewing.
let viewAs = null, realMe = null, meDerived = false;
function meFromPulls(id) {
  const ppl = peopleOf(datasets), when = datasets.map((d) => d.range && d.range.to).filter(Boolean).sort().pop();
  const since = datasets.map((d) => d.range && d.range.from).filter(Boolean).sort()[0];
  const person = ppl.find((p) => p.id === id) || { id };
  return upgradeMe({ schema: 'afaqy-me/v2', user: { id, name: nameOf(person, 'en') || id }, people: ppl,
    extractedAt: when ? `${when}T23:59:00.000Z` : new Date().toISOString(), since: since ? `${since}T00:00:00.000Z` : undefined,
    // ADR-0072: «own» means «he opened it himself» (isSelfLogged); it was set to «assigned to him», which turned every task
    // others assigned him into «self». The pulled tasks already carry who created them — keep them as they are.
    tasks: allTasks() });
}
// the manager: the team-file entry that covers departments (ADR-0045)
const managerIdOf = () => { const e = Object.entries(roster().people || {}).find(([, p]) => Array.isArray(p.covers) && p.covers.length); return e ? e[0] : null; };
function startViewAs(id) {
  const fake = meFromPulls(id);
  if (!fake) return;
  if (!viewAs) realMe = me;
  viewAs = id; me = fake; document.body.classList.add('viewing-as');
  renderMe(); if (location.hash !== '#me') location.hash = '#me';   // the router does not redraw «مؤشراتي», so draw it before going there
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function endViewAs(redraw = true) {
  if (!viewAs) return;
  me = realMe; realMe = null; viewAs = null; document.body.classList.remove('viewing-as');
  if (redraw) renderMe();
}
let storageKept = null;   // true when the browser promised to keep this site's data
// a "?" beside a heading: what it is and how to use it, in the reader's language
const helpQ = (key, titleKey) => el('button', { type: 'button', class: 'help-q', 'data-help': key, 'data-help-title': titleKey || '', 'aria-label': '?', text: '?' });
function openHelp(key, titleKey, fallbackTitle) {
  $('help-title').textContent = titleKey ? t(titleKey) : (fallbackTitle || '?');
  $('help-text').textContent = t(key);
  $('help-dialog').showModal();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('.help-q'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const h = b.closest('h1, h2, h3, summary'); const title = h ? h.textContent.replace(/\?\s*$/, '').trim() : '';
  openHelp(b.dataset.help, b.dataset.helpTitle, title);
});
// ---------- the monthly card: a work pattern described from the numbers, every line with its "why" ----------
let monthCards = {};        // closed months, frozen: { 'YYYY-MM': { personId: card } }
let cardMonth = null;       // the month shown on the profile
const fmtH = (h) => formatHours(h, lang);
const monthLabel = (ym) => { const [y, m] = ym.split('-').map(Number); return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-ca-gregory-nu-latn' : lang === 'ur' ? 'ur-PK-u-ca-gregory-nu-latn' : 'en-GB-u-ca-gregory', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 15))); };
function radar(mine, team, size = 180) {
  const svg = document.createElementNS(SVG, 'svg'); svg.setAttribute('viewBox', '-34 -16 268 232'); svg.style.overflow = 'visible'; svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', t('card_radar'));
  const c = 100, R = 78, axes = TIERS.map((k, i) => ({ k, a: -Math.PI / 2 + (i * Math.PI) / 2 }));
  const pt = (a, r) => [c + Math.cos(a) * r, c + Math.sin(a) * r];
  const mk = (tag, attrs) => { const n = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
  for (const f of [0.33, 0.66, 1]) svg.append(mk('polygon', { points: axes.map(({ a }) => pt(a, R * f).join(',')).join(' '), fill: 'none', stroke: 'var(--line-strong)', 'stroke-width': 1 }));
  for (const { a } of axes) { const [x, y] = pt(a, R); svg.append(mk('line', { x1: c, y1: c, x2: x, y2: y, stroke: 'var(--line-strong)', 'stroke-width': 1 })); }
  const poly = (sh, fill, stroke) => mk('polygon', { points: axes.map(({ k, a }) => pt(a, R * Math.min(1, sh[k] || 0)).join(',')).join(' '), fill, stroke, 'stroke-width': 2, 'fill-opacity': 0.35 });
  svg.append(poly(team, 'var(--slate)', 'var(--slate)'));
  svg.append(poly(mine, 'var(--accent)', 'var(--accent-dark)'));
  const fs = Math.ceil(12.5 * 268 / size);   // ≥ 12.5 px on screen
  for (const { k, a } of axes) { const [x, y] = pt(a, R + fs * 0.9); const tx = mk('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': fs, 'font-weight': 600, fill: 'var(--title)' }); tx.textContent = t(`tier_short_${k}`); svg.append(tx); }
  return svg;
}
const why = (text) => el('span', { class: 'why', text });
function renderCard(card, nm, { showRank = false, showSuggestions = false, compact = false } = {}) {
  if (!card) return null;
  const arch = t(`arch_${card.archetype}`), archWhy = t(`arch_${card.archetype}_why`);
  const q = card.quartile ? t(`quartile_${card.quartile}`) : '—';
  const delta = card.points - card.prevPoints;
  const S = card.strengths.slice(0, compact ? 2 : 4).map((s) => s.kind === 'spec' ? t('str_spec', { type: typeLabel(s.type, lang), pct: s.pct, my: s.myPct, n: s.mine })
    : s.kind === 'speed' ? t('str_speed', { type: typeLabel(s.type, lang), me: fmtH(s.myMed), team: fmtH(s.teamMed) }) : t('str_initiative', { n: s.n, c: s.customers }));
  const D = card.development.slice(0, compact ? 2 : 4).map((d) => d.kind === 'tierGap' ? t('dev_tierGap', { tier: t(`tier_${d.tier}`), mine: d.mine, team: d.team })
    : d.kind === 'slow' ? t('dev_slow', { type: typeLabel(d.type, lang), me: fmtH(d.myMed), team: fmtH(d.teamMed) }) : d.kind === 'selfLogged' ? t('dev_self', { pct: d.pct })
    : d.kind === 'aging' ? t('dev_aging', { n: d.n, days: d.days }) : t('dev_rate', { pct: d.pct }));
  const G = card.suggestions.map((g) => g.kind === 'stretch' ? t('sug_stretch', { type: typeLabel(g.type, lang), tier: t(`tier_${g.tier}`), n: g.teamN })
    : g.kind === 'invest' ? t('sug_invest', { type: typeLabel(g.type, lang), me: fmtH(g.myMed), team: fmtH(g.teamMed) }) : g.kind === 'balanceUp' ? t('sug_balanceUp', { type: typeLabel(g.type, lang), pts: card.points, med: card.teamMedian }) : t('sug_balanceDeep', { type: typeLabel(g.type, lang), pts: card.points, med: card.teamMedian }));
  return el('div', { class: `card-month${compact ? ' compact' : ''}` },
    el('div', { class: 'card-head' },
      el('div', {}, el('h3', { text: nm }), el('div', { class: 'arch' }, el('b', { text: arch }), why(archWhy))),
      card.onLeave ? el('span', { class: 'pill on-leave', text: t('card_on_leave') }) : null),
    el('div', { class: 'card-grid' },
      el('div', { class: 'card-volume' },
        el('div', { class: 'big' }, el('b', { text: String(card.points) }), el('span', { text: t('card_points') })),
        el('div', { class: 'hint', text: t('card_vs_prev', { d: (delta >= 0 ? '+' : '−') + Math.abs(delta), done: card.done }) }),
        el('div', { class: 'hint', text: showRank && card.rank ? t('card_rank', { r: card.rank, n: card.teamSize, med: card.teamMedian }) : t('card_quartile', { q, med: card.teamMedian }) }),
        card.consistency != null ? el('div', { class: 'hint', text: t('card_consistency', { pct: Math.round(card.consistency * 100), w: card.weeks }) }) : null),
      el('div', { class: 'card-radar' }, radar(card.tiers.mineShare, card.tiers.teamShare, compact ? 140 : 180), el('div', { class: 'hint radar-legend' }, el('i', { class: 'sw-me' }), t('card_me'), el('i', { class: 'sw-team' }), t('card_team_legend')))),
    el('div', { class: 'card-cols' },
      card.otherWork ? el('p', { class: 'hint other-work', text: t('card_other_work', { n: card.otherWork }) }) : null,
      el('div', { class: 'card-col good' }, el('h4', { text: t('card_strengths') }), S.length ? el('ul', {}, S.map((x) => el('li', { text: x }))) : el('p', { class: 'hint', text: t('card_none_yet') })),
      el('div', { class: 'card-col grow' }, el('h4', { text: t('card_development') }), D.length ? el('ul', {}, D.map((x) => el('li', { text: x }))) : el('p', { class: 'hint', text: t('card_none_dev') })),
      showSuggestions ? el('div', { class: 'card-col plan' }, el('h4', { text: t('card_suggestions') }), G.length ? el('ul', {}, G.map((x) => el('li', { text: x }))) : el('p', { class: 'hint', text: t('card_none_sug') })) : null),
    el('details', { class: 'points-details' },
      el('summary', { text: t('points_detail_title') }),
      card.breakdown ? [
        el('p', { class: 'hint', text: !isTeamPortal && weightPublishDiff(weightsRepo, weightsDevice).count
          ? t('points_source_draft') : t('points_source_official') }),
        card.breakdown.rows.length ? el('div', { class: 'table-wrap' },
          el('table', { class: 'points-table' },
            el('thead', {}, el('tr', {},
              ['points_col_type', 'points_col_count', 'points_col_weight', 'points_col_sum'].map((k) =>
                el('th', { text: t(k) })))),
            el('tbody', {}, card.breakdown.rows.map((r) => el('tr', {},
              el('td', {}, el('span', { text: typeLabel(r.name, lang) }), r.unmapped
                ? el('small', { class: 'points-unmapped', text: t('points_unknown') }) : null),
              el('td', { text: String(r.count) }),
              el('td', { text: String(r.weight) }),
              el('td', { text: String(r.points) }))),
              el('tr', { class: 'points-total' },
                el('td', { text: t('points_total') }),
                el('td', { text: String(card.breakdown.count) }),
                el('td', { text: '—' }),
                el('td', { text: String(card.breakdown.points) }))))) :
          el('p', { class: 'hint', text: t('points_none') }),
        card.breakdown.unmapped ? el('p', { class: 'note', text: t('points_unknown_summary', { n: card.breakdown.unmapped }) }) : null,
      ] : el('p', { class: 'hint', text: t('points_old_card') })));
}
// the card's context from the manager's data (board) or from a person's own hand-over (profile)
function cardCtxFromDatasets(team) {
  const tasks = allTasks(); const acts = reports.flatMap((r) => r.activities || []);
  return { tasks, activities: acts, weights: weights(), team, roster: roster(), now: new Date() };
}
// closing months: the first pull after a month ends freezes that month's cards for the scope; they never change afterwards
async function closeMonths() {
  if (!datasets.length) return;
  const ranges = datasets.filter((d) => !d.sample).map((d) => d.range);
  const months = closableMonths(ranges, new Date());
  const team = currentTeam(scoped(peopleOf(datasets)), allTasks());
  let added = [];
  for (const ym of months) {
    if (monthCards[ym] && team.every((id) => monthCards[ym][id])) continue;
    const tm = teamMonth(cardCtxFromDatasets(team), ym);
    monthCards[ym] = { ...(monthCards[ym] || {}), ...Object.fromEntries(tm.cards.filter((c) => !(monthCards[ym] || {})[c.personId]).map((c) => [c.personId, c])) };
    added.push(ym);
  }
  if (added.length) { await store.putCards(monthCards); toast(t('card_closed', { m: added.map(monthLabel).join('، ') })); }
}
// ---------- the monthly one-to-one: notes, what was agreed, and goals — kept on the leader's device, never in the repository ----------
let meet = {};   // { 'YYYY-MM': { personId: { note, agreed, done: bool, goals: [{ key, target }] } } }
const meetOf = (ym, id) => (meet[ym] && meet[ym][id]) || null;
const meetRefresh = () => { const dv = $('view-dev'); if (dv && !dv.hidden) renderDev(); else renderMe(); };   // the meeting redraws the page it was opened from
async function saveMeet(ym, id, v) { meet = { ...meet, [ym]: { ...(meet[ym] || {}), [id]: v } }; await store.putMeet(meet); }
function openMeet(ym, id, name, typeChoices) {
  const cur = meetOf(ym, id) || { note: '', agreed: '', done: false, goals: [] };
  const goals = cur.goals.map((g) => ({ ...g }));
  const dlg = el('dialog', { class: 'help-dialog meet-dialog' });
  const goalRows = el('div', { class: 'goal-rows' });
  const paintGoals = () => set(goalRows, goals.map((g, i) => el('div', { class: 'goal-row' },
    el('select', { class: 'w-sel', onchange: (e) => { g.key = e.target.value; } }, [['__points__', t('goal_points')], ...typeChoices].map(([k, n]) => el('option', { value: k, selected: k === g.key, text: n }))),
    el('input', { type: 'number', min: '1', max: '999', value: String(g.target || ''), class: 'goal-n', oninput: (e) => { g.target = Math.max(0, Number(e.target.value) || 0); } }),
    el('button', { type: 'button', class: 'btn quiet tiny', text: '✕', onclick: () => { goals.splice(i, 1); paintGoals(); } }))));
  paintGoals();
  const note = el('textarea', { rows: '3', placeholder: t('meet_note_ph') }); note.value = cur.note || '';
  const agreed = el('textarea', { rows: '2', placeholder: t('meet_agreed_ph') }); agreed.value = cur.agreed || '';
  dlg.append(el('h2', { text: t('meet_title', { name, m: monthLabel(ym) }) }),
    el('label', { class: 'meet-l', text: t('meet_note') }), note,
    el('label', { class: 'meet-l', text: t('meet_agreed') }), agreed,
    el('label', { class: 'meet-l', text: t('meet_goals') }), goalRows,
    el('button', { type: 'button', class: 'btn tiny', text: t('meet_add_goal'), onclick: () => { goals.push({ key: '__points__', target: 0 }); paintGoals(); } }),
    el('div', { class: 'row', style: 'margin-top:14px' },
      el('button', { type: 'button', class: 'btn primary', text: t('meet_save'), onclick: async () => { await saveMeet(ym, id, { note: note.value.slice(0, 2000), agreed: agreed.value.slice(0, 1000), done: !!cur.done, goals: goals.filter((g) => g.target > 0).slice(0, 8) }); dlg.close(); dlg.remove(); toast(t('meet_saved')); meetRefresh(); } }),
      el('button', { type: 'button', class: 'btn', text: t('close'), onclick: () => { dlg.close(); dlg.remove(); } })));
  document.body.append(dlg); dlg.showModal();
}
// the goals and last month's agreement, shown inside a card
function meetBlock(ym, id, tasks, editable, name, typeChoices) {
  const m = meetOf(ym, id), prev = meetOf(prevMonth(ym), id);
  const prog = m && m.goals && m.goals.length ? goalProgress(tasks, weights(), id, ym, m.goals) : [];
  const label = (g) => (g.key === '__points__' ? t('goal_points') : (typeChoices.find(([k]) => k === g.key) || [g.key, g.key])[1]);
  if (!prog.length && !(prev && prev.agreed) && !editable) return null;
  return el('div', { class: 'meet-block' },
    prev && prev.agreed ? el('div', { class: 'agreed' }, el('b', { text: t('meet_prev_agreed') }), el('span', { text: ` ${prev.agreed}` }),
      editable ? el('label', { class: 'done-tick' }, el('input', { type: 'checkbox', ...(prev.done ? { checked: '' } : {}), onchange: async (e) => { await saveMeet(prevMonth(ym), id, { ...prev, done: e.target.checked }); meetRefresh(); } }), t('meet_done')) : el('span', { class: 'hint', text: prev.done ? ` · ${t('meet_done')}` : '' })) : null,
    prog.length ? el('div', { class: 'goals' }, el('b', { text: t('meet_goals') }), prog.map((g) => el('div', { class: 'goal' }, el('span', { text: label(g) }), el('i', {}, el('span', { style: `width:${g.pct}%`, class: g.met ? 'met' : '' })), el('b', { class: 'ltr', text: `\u2066${g.got} / ${g.target}\u2069` })))) : null,
    editable ? el('button', { type: 'button', class: 'btn tiny', text: m ? t('meet_edit') : t('meet_open'), onclick: () => openMeet(ym, id, name, typeChoices) }) : null);
}
// ---------- after a repair: did the device report again? (the list stays on this device) ----------
let repairs = [];
function renderRepairs() {
  const scopePeople = scoped(peopleOf(datasets)).concat(me ? me.people.filter((p) => inScope(roster(), p.id) && !peopleOf(datasets).some((q) => q.id === p.id)) : []);
  const nmR = (id) => { const p = scopePeople.find((q) => q.id === id); return (p && nameOf(p, lang)) || id || '—'; };
  const rc = repairCheck(proUnits || [], repairs, new Date());
  const ta = el('textarea', { rows: '4', dir: 'ltr', class: 'repair-in', placeholder: t('repair_ph') });
  const eng = el('select', { class: 'w-sel' }, el('option', { value: '', text: t('repair_who') }), scopePeople.map((p) => el('option', { value: p.id, text: nameOf(p, lang) || p.id })));
  const add = async () => { const lines = parseRepairLines(ta.value, new Date()); if (!lines.length) { toast(t('repair_none_in')); return; }
    repairs = [...repairs, ...lines.map((x) => ({ ...x, engineerId: eng.value || null, added: new Date().toISOString() }))].slice(-2000); await store.putRepairs(repairs); ta.value = ''; renderPro(); };
  const csv = () => { const lines = ['ref,engineer,repairedAt,status,lastReport,hoursToReport', ...rc.rows.map((r) => [r.ref, nmR(r.engineerId), r.at, r.status, r.last || '', r.hoursToReport == null ? '' : r.hoursToReport.toFixed(1)].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))];
    const a2 = el('a', { href: URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv' })), download: `afaqy-repair-check-${ymd(new Date())}.csv` }); document.body.append(a2); a2.click(); a2.remove(); };
  const badge = (st) => el('span', { class: `rstat ${st}`, text: t(`repair_${st}`) });
  return el('section', { class: 'repairs' },
    el('h2', {}, t('repair_h'), helpQ('help_repair')),
    el('div', { class: 'repair-add' }, ta, el('div', { class: 'row' }, eng, el('button', { type: 'button', class: 'btn primary', text: t('repair_add'), onclick: add }))),
    repairs.length ? [
      el('div', { class: 'strip' },
        el('div', { class: 'lead' }, el('b', { text: rc.rate == null ? '—' : `${Math.round(rc.rate * 100)}%` }), el('span', { text: t('repair_rate') })),
        ...['ok', 'waiting', 'failed', 'unknown'].map((k) => el('div', {}, el('b', { text: String(rc.rows.filter((r) => r.status === k).length) }), el('span', { text: t(`repair_${k}`) })))),
      rc.people.length ? el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, ['col_person', 'repair_ok', 'repair_failed', 'repair_waiting', 'repair_rate'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
        el('tbody', {}, rc.people.map((p) => el('tr', {}, el('td', { text: nmR(p.id) }), el('td', { class: 'num', text: String(p.ok) }), el('td', { class: 'num', text: String(p.failed) }), el('td', { class: 'num', text: String(p.waiting) }), el('td', { class: 'num', text: p.rate == null ? '—' : `${Math.round(p.rate * 100)}%` })))))) : null,
      el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, ['repair_col_ref', 'repair_col_unit', 'col_person', 'repair_col_at', 'repair_col_last', 'repair_col_status', ''].map((k) => el('th', { text: k ? t(k) : '' })))),
        el('tbody', {}, [...rc.rows].reverse().slice(0, 300).map((r) => el('tr', {},
          el('td', { class: 'ltr', text: r.ref }), el('td', { text: r.unit || '—' }), el('td', { text: nmR(r.engineerId) }),
          el('td', { class: 'ltr', text: `\u2066${r.at.slice(0, 16).replace('T', ' ')}\u2069` }), el('td', { class: 'ltr', text: r.last ? `\u2066${new Date(Date.parse(r.last) + 3 * 3600000).toISOString().slice(0, 16).replace('T', ' ')}\u2069` : '—' }),
          el('td', {}, badge(r.status)),
          el('td', {}, el('button', { type: 'button', class: 'btn quiet tiny', text: '✕', onclick: async () => { repairs = repairs.filter((x) => !(x.ref === r.ref && x.at === r.at)); await store.putRepairs(repairs); renderPro(); } }))))))),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn', text: t('repair_csv'), onclick: csv }), el('button', { type: 'button', class: 'btn quiet', text: t('pro_refresh'), onclick: () => proLoad() }))]
      : el('p', { class: 'hint', text: t('repair_empty') }));
}
// ---------- the signatures the certificates tool prints (stored where the tool reads them: same origin, key afqFactory.sign) ----------
const SIGN_KEY = 'afqFactory.sign';
const SIGN_MAKERS = [['TZ', 'TZONE — TAG07B'], ['TF', 'TOPFLY — TSTH1-B']];
const signRead = () => { try { return JSON.parse(localStorage.getItem(SIGN_KEY) || '{}') || {}; } catch { return {}; } };
const signWrite = (all) => { try { localStorage.setItem(SIGN_KEY, JSON.stringify(all)); return true; } catch { return false; } };
function shrinkSignature(dataUrl) {
  return new Promise((res) => { const im = new Image(); im.onload = () => { const w = Math.min(600, im.width), h = Math.round(im.height * (w / im.width)); const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(im, 0, 0, w, h); const png = /png/i.test(dataUrl.slice(0, 30)); res({ img: cv.toDataURL(png ? 'image/png' : 'image/jpeg', 0.9), fmt: png ? 'PNG' : 'JPEG' }); }; im.onerror = () => res({ img: dataUrl, fmt: 'PNG' }); im.src = dataUrl; });
}
function renderSignatures() {
  const all = signRead();
  const card = ([m, label]) => { const st = all[m] || {};
    const file = el('input', { type: 'file', accept: 'image/png,image/jpeg', hidden: true, onchange: (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = async () => { const sh = await shrinkSignature(r.result); const next = signRead(); next[m] = { ...(next[m] || {}), ...sh }; if (signWrite(next)) { toast(t('sign_saved')); renderTeam(); } else toast(t('sign_fail')); }; r.readAsDataURL(f); e.target.value = ''; } });
    return el('div', { class: 'sign-card' },
      el('b', { text: label }),
      st.img ? el('img', { src: st.img, alt: '', class: 'sign-img' }) : el('div', { class: 'sign-empty', text: t('sign_none') }),
      el('input', { type: 'text', class: 'sign-name', placeholder: t('sign_name_ph'), value: st.name || '', onchange: (e) => { const next = signRead(); next[m] = { ...(next[m] || {}), name: e.target.value.trim() }; signWrite(next); } }),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn', text: st.img ? t('sign_replace') : t('sign_upload'), onclick: () => file.click() }), file,
        st.img ? el('button', { type: 'button', class: 'btn quiet', text: t('sign_remove'), onclick: () => { const next = signRead(); delete next[m]; signWrite(next); renderTeam(); } }) : null)); };
  const exp = () => { const a2 = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify({ schema: 'afaqy-signatures/v1', exportedAt: new Date().toISOString(), signatures: signRead() }, null, 2)], { type: 'application/json' })), download: `afaqy-signatures-${ymd(new Date())}.json` }); document.body.append(a2); a2.click(); a2.remove(); };
  const imp = el('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); if (j.schema !== 'afaqy-signatures/v1' || typeof j.signatures !== 'object') throw 0; const next = signRead(); for (const [m, v] of Object.entries(j.signatures)) if (['TZ', 'TF'].includes(m) && v && typeof v === 'object') next[m] = { ...(next[m] || {}), ...v }; signWrite(next); toast(t('sign_imported')); renderTeam(); } catch { toast(t('err_json')); } e.target.value = ''; } });
  return el('section', { class: 'signs' },
    el('h2', {}, t('sign_h'), helpQ('help_sign')),
    el('div', { class: 'sign-grid' }, SIGN_MAKERS.map(card)),
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn quiet', text: t('sign_export'), onclick: exp }), el('button', { type: 'button', class: 'btn quiet', text: t('sign_import'), onclick: () => imp.click() }), imp),);
}
// ---------- private links: internal addresses (VPN portals, device admin pages) kept on this device, never published (ADR-0026) ----------
let privLinks = [];
let myProjects = null;   // the projects-from-mail file, on this device only (ADR-0039)
let projAll = false, projOnlyMine = false, projQuery = '', projView = 'summary', projStatus = '';
let devPlans = {};   // quarter development plans (ADR-0040) — { 'YYYY-Qn': { personId: plan } }, device only
let devQ = pref('devq') === 'cur' ? 'cur' : 'next', devSel = pref('devsel') || null;
let myRegister = null;   // the projects register (won / submitted from the management deck, presales board) — device only
function cleanPrivLink(x) {
  try { const name = String((x && x.name) || '').trim().slice(0, 80), u = new URL(String((x && x.url) || '').trim());
    if (!name || !['http:', 'https:'].includes(u.protocol) || u.username || u.password) return null; return { name, url: u.href }; } catch { return null; }
}
function renderPrivLinks() {
  const box = $('private-links'); if (!box) return;
  const nameIn = el('input', { type: 'text', placeholder: t('priv_name_ph'), maxlength: '80' });
  const urlIn = el('input', { type: 'url', dir: 'ltr', placeholder: 'https://…', maxlength: '2048' });
  const add = async () => { const v = cleanPrivLink({ name: nameIn.value, url: urlIn.value }); if (!v) { toast(t('priv_invalid')); return; }
    privLinks = [...privLinks.filter((x) => x.url !== v.url), v].slice(0, 100); await store.putPriv(privLinks); renderPrivLinks(); };
  set(box, el('details', { class: 'priv', open: privLinks.length ? '' : null },
    el('summary', {}, `🔒 ${t('priv_h')}`, privLinks.length ? el('span', { class: 'hint', text: ` · ${privLinks.length}` }) : null),
    privLinks.length ? el('div', { class: 'row' }, privLinks.map((x) => el('span', { class: 'priv-chip' },
      el('a', { class: 'chip', href: x.url, target: '_blank', rel: 'noopener noreferrer', text: x.name }),
      el('button', { type: 'button', class: 'btn quiet tiny', 'aria-label': t('remove'), text: '✕', onclick: async () => { privLinks = privLinks.filter((y) => y.url !== x.url); await store.putPriv(privLinks); renderPrivLinks(); } })))) : null,
    el('div', { class: 'priv-add' }, nameIn, urlIn, el('button', { type: 'button', class: 'btn', text: t('priv_add'), onclick: add }))));
}
// ---------- Outlook inside the portal (ADR-0029) ----------
// The manager signs in with his own Microsoft account; the portal reads HIS inbox (Mail.Read, read-only) straight from Microsoft,
// keeps only time / thread hash / who / category, and forgets the token right after the read. Talks to two Microsoft addresses only.
const MS_LOGIN = 'https://login.microsoftonline.com', MS_GRAPH = 'https://graph.microsoft.com/v1.0';
const MS_SCOPE = 'openid profile Mail.Read';
let mailRows = [], mailKind = 'week', mailBusy = false;
const msCfg = () => { try { return JSON.parse(localStorage.getItem('afaqy-portal:ms') || 'null'); } catch { return null; } };
const msRedirect = () => location.origin + location.pathname.replace(/index\.html$/, '');
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function msSignIn() {
  const cfg = msCfg(); if (!cfg) return;
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48))), state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  sessionStorage.setItem('afaqy-portal:ms-pkce', JSON.stringify({ verifier, state }));
  const q = new URLSearchParams({ client_id: cfg.clientId, response_type: 'code', redirect_uri: msRedirect(), response_mode: 'query', scope: MS_SCOPE, state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account' });
  location.assign(`${MS_LOGIN}/${encodeURIComponent(cfg.tenantId)}/oauth2/v2.0/authorize?${q}`);
}
// back from Microsoft: exchange the one-time code, read the mailbox, then drop the token
async function msReturn() {
  const p = new URLSearchParams(location.search); const code = p.get('code'), state = p.get('state'), err = p.get('error');
  if (!code && !err) return false;
  history.replaceState(null, '', location.pathname + '#mailfile');   // ADR-0070: back to where the mailbox lives; the code never stays in the address or the history
  const saved = JSON.parse(sessionStorage.getItem('afaqy-portal:ms-pkce') || 'null'); sessionStorage.removeItem('afaqy-portal:ms-pkce');
  if (err) { toast(t('mail_err_signin', { e: err })); return true; }
  const cfg = msCfg(); if (!cfg || !saved || saved.state !== state) { toast(t('mail_err_state')); return true; }
  try {
    const r = await fetch(`${MS_LOGIN}/${encodeURIComponent(cfg.tenantId)}/oauth2/v2.0/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: cfg.clientId, grant_type: 'authorization_code', code, redirect_uri: msRedirect(), code_verifier: saved.verifier, scope: MS_SCOPE }) });
    const j = await r.json(); if (!r.ok || !j.access_token) throw new Error(j.error_description || j.error || r.status);
    await msReadMailbox(j.access_token);
  } catch (e) { toast(t('mail_err_token', { e: String(e.message || e).slice(0, 120) })); }
  return true;
}
async function msReadMailbox(token) {
  mailBusy = true; renderMailFile();
  const since = new Date(Date.now() - 370 * 86400000).toISOString();   // a full year: four quarters
  const people = [...peopleOf(datasets), ...(me ? me.people : [])].filter((p, i, arr) => arr.findIndex((q) => q.id === p.id) === i);
  const internal = (addr) => /@afaqy\b|@afaqy[.-]/i.test(addr);
  let url = `${MS_GRAPH}/me/mailFolders/inbox/messages?$select=id,from,receivedDateTime,conversationId,subject,bodyPreview&$filter=receivedDateTime ge ${since}&$orderby=receivedDateTime desc&$top=100`;
  let n = 0; const fresh = [];
  try {
    for (let page = 0; url && page < 200; page++) {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`${r.status}`);
      const j = await r.json();
      for (const m of j.value || []) fresh.push(mailRow(m, people, internal));   // subject and preview are read here and never kept
      n += (j.value || []).length; url = j['@odata.nextLink'] || null;
      if (page % 5 === 4) toast(t('mail_reading', { n }));
    }
    const known = new Set(mailRows.map((r) => r.i));
    mailRows = [...mailRows, ...fresh.filter((r) => !known.has(r.i))];
    await store.putMail(mailRows);
    localStorage.setItem('afaqy-portal:ms-last', new Date().toISOString());
    toast(t('mail_done', { n }));
  } catch (e) { toast(t('mail_err_read', { e: String(e.message || e) })); }
  finally { token = null; mailBusy = false; renderMailFile(); }
}
// ---------- end Outlook ----------
function kpiMailSection(team, peopleById) {
  const cfg = msCfg(); const nmM = (id) => nameOf(peopleById.get(id), lang) || id;
  const setup = () => { const cid = el('input', { type: 'text', dir: 'ltr', placeholder: 'Application (client) ID', value: (cfg && cfg.clientId) || '' }), tid = el('input', { type: 'text', dir: 'ltr', placeholder: 'Directory (tenant) ID', value: (cfg && cfg.tenantId) || '' });
    return el('div', { class: 'mail-setup' }, el('p', { class: 'hint', text: t('mail_setup_sub') }), cid, tid,
      el('button', { type: 'button', class: 'btn primary', text: t('mail_setup_save'), onclick: () => { const g = /^[0-9a-f-]{36}$/i; if (!g.test(cid.value.trim()) || !g.test(tid.value.trim())) { toast(t('mail_setup_bad')); return; } localStorage.setItem('afaqy-portal:ms', JSON.stringify({ clientId: cid.value.trim(), tenantId: tid.value.trim() })); renderMailFile(); } })); };
  if (!cfg) return el('section', { class: 'share mail', id: 'k-mail' }, el('h2', {}, t('mail_h'), helpQ('help_mail')), setup());
  const today = saudiDay(new Date().toISOString());
  if (mailKind === 'year') {
    const qs = lastQuarters(today, 4).reverse(); const per = qs.map((q) => mailStats(mailRows, team, q));
    return el('section', { class: 'share mail', id: 'k-mail' },
      el('div', { class: 'row', style: 'justify-content:space-between;align-items:center' }, el('h2', { style: 'margin:0' }, t('mail_h'), helpQ('help_mail')),
        el('div', {}, periodPicker('year', 0, today, (k) => { mailKind = k; renderMailFile(); }, () => {}))),
      el('div', { class: 'table-wrap' }, el('table', { class: 'share-table year' },
        el('thead', {}, el('tr', {}, el('th', { text: t('col_person') }), ...qs.map((q) => el('th', { class: 'num', text: q.label })))),
        el('tbody', {}, team.map((id) => el('tr', {}, el('td', { text: nmM(id) }), ...per.map((ms) => { const p = ms.people.find((x) => x.id === id);
          return el('td', { class: 'num', text: p && p.replies ? `${p.replies} · ${t('mail_hard')} ${p.hardPct}%` : '—' }); })))))),);
  }
  const win = pickWindow(mailKind, mailQ, today); const ms = mailStats(mailRows, team, win);
  const last = localStorage.getItem('afaqy-portal:ms-last');
  const chip = (k, label) => el('button', { type: 'button', class: `pill-btn${mailKind === k ? ' on' : ''}`, text: t(label), onclick: () => { mailKind = k; renderMailFile(); } });
  const mins = (m) => (m == null ? '—' : m < 60 ? `${Math.round(m)} ${t('mail_min')}` : `${(m / 60).toFixed(1)} ${t('mail_hr')}`);
  const max = Math.max(1, ...ms.people.map((p) => p.replies));
  return el('section', { class: 'share mail', id: 'k-mail' },
    el('div', { class: 'row', style: 'justify-content:space-between;align-items:center' },
      el('h2', { style: 'margin:0' }, t('mail_h'), helpQ('help_mail')),
      el('div', {}, periodPicker(mailKind, mailQ, today, (k) => { mailKind = k; renderMailFile(); }, (q) => { mailQ = q; renderMailFile(); }))),
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn primary', disabled: mailBusy ? '' : null, text: mailBusy ? t('mail_busy') : t('mail_read_year'), onclick: () => msSignIn() }),
      el('span', { class: 'hint', text: last ? t('mail_last', { d: last.slice(0, 16).replace('T', ' ') }) : t('mail_never') })),
    el('details', { class: 'mail-cfg' }, el('summary', { text: t('mail_setup_change') }), setup()),
    el('p', { class: 'hint', text: t('mail_window', { from: win.from, to: win.to, n: ms.total, c: ms.customerThreads, u: ms.unanswered }) }),
    ms.total ? el('div', { class: 'table-wrap' }, el('table', { class: 'share-table' },
      el('thead', {}, el('tr', {}, ['col_person', 'mail_col_replies', 'mail_col_threads', 'mail_col_hard', 'mail_col_mix', 'mail_col_first'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
      el('tbody', {}, ms.people.filter((p) => p.replies).map((p) => el('tr', {},
        el('td', { text: nmM(p.id) }),
        el('td', { class: 'num' }, el('div', { class: 'bar-cell' }, el('b', { text: `${p.replies} · ${p.share}%` }), el('i', {}, el('span', { style: `width:${Math.round((p.replies / max) * 100)}%` })))),
        el('td', { class: 'num', text: String(p.threads) }),
        el('td', { class: 'num' }, el('b', { class: p.hardPct >= 40 ? 'ok-t' : p.hardPct <= 10 && p.threads >= 5 ? 'warn-t' : null, text: `${p.hardPct}%` })),
        el('td', { class: 'num mix', text: `${t('mail_hard')} ${p.cats.hard} · ${t('mail_medium')} ${p.cats.medium} · ${t('mail_easy')} ${p.cats.easy + p.cats.other}` }),
        el('td', { class: 'num', text: mins(p.firstReplyMin) }))))))
      : el('div', { class: 'empty', text: mailRows.length ? t('share_none') : t('mail_empty') }),
    ms.otherColleagues ? el('p', { class: 'hint', text: t('mail_others', { n: ms.otherColleagues }) }) : null,);
}
// ---------- install on Android, iPhone and Windows ----------
let installPrompt = null;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; showInstall(); });
window.addEventListener('appinstalled', () => { installPrompt = null; showInstall(); toast(t('install_done')); });
function showInstall() { const b = $('install-btn'); if (b) b.hidden = standalone(); }
async function doInstall() {
  if (installPrompt) { installPrompt.prompt(); try { await installPrompt.userChoice; } catch { /* closed */ } installPrompt = null; showInstall(); return; }
  set($('install-steps'), el('p', { text: t(isIOS() ? 'install_ios' : /android/i.test(navigator.userAgent) ? 'install_android' : 'install_desktop') }));
  $('install-dialog').showModal();
}
let meKind = 'month';      // the profile's comparison window: month | quarter | half
let kpiSort = 'done';      // the board's order: done | median | open
let rosterRepo = null;      // team.json from the repository (ids, positions, leaders — never names)
let rosterDevice = null;    // this device's own entries, which win
const roster = () => mergeRoster(rosterRepo, rosterDevice);
let weightsRepo = null, weightsDevice = null;
// Only the official published file drives the team view. Managers preview local edits here until committing.
const weights = () => portalWeights(weightsRepo, weightsDevice, isTeamPortal);
async function refreshOfficialWeights() {
  try {
    const r = await fetch('./weights.json', { cache: 'no-store' });
    if (r.ok) {
      const published = await r.json();
      if (published && published.schema === 'afaqy-weights/v1') weightsRepo = published;
    }
  } catch { /* keep the latest weights when offline */ }
}
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
const portalHome = () => location.origin + location.pathname.replace(/[^/]*$/, '') + (isTeamPortal ? '?portal=team' : '');
// ADR-0072: «مؤشراتي» — the person's own month only (header, the shared personal view, his projects, setup)
function progressCard(pm) {
  const wt = weights(), uid = me.user.id, today = saudiDay(new Date().toISOString()), ymNow = today.slice(0, 7);
  // his team: those under the same team leader in the team file (not everyone in the pull), on duty, whose work is in this pull
  const ro = roster().people || {}, lead = ro[uid] && ro[uid].leaderId;
  const scope = lead ? Object.keys(ro).filter((k) => k === uid || (ro[k].leaderId === lead && !ro[k].onLeave)) : [...new Set([uid, ...((pm.scope && pm.scope.visible) || [])])];
  const present = scope.filter((id) => id === uid || me.tasks.some((x) => x.assigneeId === id));
  const ymShift = (ym, k) => { const d = new Date(Date.parse(`${ym}-01T00:00:00Z`)); d.setUTCMonth(d.getUTCMonth() + k); return d.toISOString().slice(0, 7); };
  const monthEnd = (ym) => { const d = new Date(Date.parse(`${ymShift(ym, 1)}-01T00:00:00Z`)); d.setUTCDate(0); return d.toISOString().slice(0, 10); };
  const rankIn = (ym) => memoTasks(me.tasks, ['rank', ym, present.join(','), ym === ymNow ? today : ''], () => {
    const pts = present.map((id) => ({ id, p: quarterBaseline(me.tasks, wt, id, { from: `${ym}-01`, to: ym === ymNow ? today : monthEnd(ym) }).points }));
    const mine = pts.find((x) => x.id === uid) || { p: 0 }, above = pts.filter((x) => x.p > mine.p).map((x) => x.p), below = pts.filter((x) => x.id !== uid && x.p <= mine.p).map((x) => x.p);
    return { r: 1 + above.length, n: pts.length, p: mine.p, gap: above.length ? Math.round((Math.min(...above) - mine.p) * 10) / 10 : null, lead: !above.length && below.length ? Math.round((mine.p - Math.max(...below)) * 10) / 10 : null };
  });
  // the rank
  let rankBox;
  const snap = rankSnaps[uid];
  if (present.length < 2) rankBox = snap ? el('div', { class: 'pg-rank' }, el('b', { class: 'pg-big', text: t('pg_rank', { r: snap.r, n: snap.n }) }), el('span', { class: 'hint', text: t(snap.partial ? 'rk_from_partial' : 'rk_from', { m: monthLabel(snap.ym), d: snap.at || '' }) }),
      el('div', { class: 'pg-gap', text: snap.gap != null ? t('pg_gap', { g: snap.gap }) : snap.lead != null ? t('pg_lead', { g: snap.lead }) : '' }))
    : el('div', { class: 'pg-rank' }, el('p', { class: 'hint', text: t('pg_rank_need') }), el('p', { class: 'hint', text: t('rk_ask') }));
  else { const now = rankIn(ymNow), before = rankIn(ymShift(ymNow, -1));
    const move = before.p > 0 ? (before.r > now.r ? el('span', { class: 'delta good', text: `▲ ${t('pg_up', { a: before.r })}` }) : before.r < now.r ? el('span', { class: 'delta bad', text: `▼ ${t('pg_down', { a: before.r })}` }) : el('span', { class: 'delta same', text: t('pg_same') })) : null;
    rankBox = el('div', { class: 'pg-rank' }, el('b', { class: 'pg-big', text: t('pg_rank', { r: now.r, n: now.n }) }), el('span', { class: 'hint', text: t('pg_rank_sub') }),
      el('div', { class: 'pg-gap', text: now.gap != null ? t('pg_gap', { g: now.gap }) : now.lead != null ? t('pg_lead', { g: now.lead }) : '' }), move); }
  // records — none of them repeat the Today card (current streak, yesterday, this week)
  const mine = me.tasks.filter((x) => x.assigneeId === uid && x.state === 'done' && x.completedAt), byMonth = new Map(), byDay = new Map();
  for (const x of mine) { const d = saudiDay(x.completedAt), m = d.slice(0, 7); byDay.set(d, (byDay.get(d) || 0) + 1);
    const v = byMonth.get(m) || { p: 0, n: 0, fast: 0 }; v.p += taskPoints(wt, x); v.n++; const k = wt.tasks[typeKey(x.type)];
    if (k && k.std && x.createdAt && businessHours(x.createdAt, x.completedAt) <= k.std) v.fast++; byMonth.set(m, v); }
  const months = [...byMonth.keys()].sort(), bestM = months.reduce((b, m) => (!b || byMonth.get(m).p > byMonth.get(b).p ? m : b), null);
  const isWork = (s) => ![5, 6].includes(new Date(Date.parse(`${s}T00:00:00Z`)).getUTCDay());
  const nextWork = (s) => { const d = new Date(Date.parse(`${s}T00:00:00Z`)); do d.setUTCDate(d.getUTCDate() + 1); while ([5, 6].includes(d.getUTCDay())); return d.toISOString().slice(0, 10); };
  let longest = 0, run = 0, prev = null; for (const s of [...byDay.keys()].sort()) { if (!isWork(s)) continue; run = prev && nextWork(prev) === s ? run + 1 : 1; longest = Math.max(longest, run); prev = s; }
  const mostDay = Math.max(0, ...byDay.values());
  const recs = el('ul', { class: 'pg-recs' }, bestM ? el('li', { text: t('pg_rec_month', { m: monthLabel(bestM), p: Math.round(byMonth.get(bestM).p * 10) / 10 }) }) : null,
    el('li', { text: t('pg_rec_streak', { n: longest }) }), el('li', { text: t('pg_rec_day', { n: mostDay }) }));
  // achievements — each from his own work
  const weekOf = (s) => { const dt = new Date(Date.parse(`${s}T00:00:00Z`)); dt.setUTCDate(dt.getUTCDate() - dt.getUTCDay()); return dt.toISOString().slice(0, 10); };
  const weeks = new Map(); for (const s of byDay.keys()) if (isWork(s)) weeks.set(weekOf(s), (weeks.get(weekOf(s)) || 0) + 1);
  const firstMonth = (f) => months.find(f) || null, maxOf = (k) => Math.max(0, ...months.map((m) => byMonth.get(m)[k]));
  const ach = [
    { k: 'week5', ok: [...weeks.values()].some((n) => n >= 5) },
    { k: 'm50', at: firstMonth((m) => byMonth.get(m).n >= 50), prog: [maxOf('n'), 50] },
    { k: 'fast10', at: firstMonth((m) => byMonth.get(m).fast >= 10), prog: [maxOf('fast'), 10] },
    { k: 'up20', at: firstMonth((m) => { const pv = byMonth.get(ymShift(m, -1)); return pv && pv.p >= 5 && byMonth.get(m).p >= 1.2 * pv.p; }) },
    { k: 'top', at: present.length >= 2 ? firstMonth((m) => rankIn(m).r === 1) : (snap && snap.r === 1 && !snap.partial ? snap.ym : null) },
    { k: 'streak10', ok: longest >= 10, prog: [longest, 10] },
  ].map((x) => ({ ...x, ok: x.ok != null ? x.ok : !!x.at }));
  const achBox = el('div', { class: 'pg-ach' }, ach.map((x) => el('div', { class: `pg-badge${x.ok ? ' on' : ''}` }, el('span', { class: 'pg-ico', 'aria-hidden': 'true', text: x.ok ? '★' : '☆' }),
    el('div', {}, el('b', { text: t(`ach_${x.k}`) }), el('small', { text: x.ok ? (x.at ? monthLabel(x.at) : t('ach_done')) : x.prog ? t('ach_prog', { a: Math.min(x.prog[0], x.prog[1]), b: x.prog[1] }) : t('ach_locked') })))));
  // the level and the shortest way up
  const { levels } = levelsFor(me.tasks, present, today, mailRows), fromMgr = present.length < 2 && snap && snap.lv;
  const lv = fromMgr ? { level: snap.lv.l, score: snap.lv.s, axes: snap.lv.ax || {} } : levels[uid];   // without colleagues in his pull, the level his manager computed
  let lvlBox;
  if (!lv || lv.level == null || lv.score == null) lvlBox = el('p', { class: 'hint', text: t(present.length < 2 ? 'rk_lv_need' : 'pg_lvl_early') });
  else { const nx = [35, 60, 80][lv.level - 1], weak = Object.entries(lv.axes || {}).filter(([, v]) => v != null).sort((p, q) => p[1] - q[1])[0];
    lvlBox = el('div', { class: 'pg-lvl' }, el('span', { class: `level-pill l${lv.level}`, text: `${lv.level} · ${t(`lvl_${LEVELS[lv.level - 1].k}`)}` }),
      nx ? el('div', { class: 'pg-bar' }, el('i', { style: `width:${Math.min(100, Math.round((lv.score / nx) * 100))}%` })) : null,
      el('small', { text: nx ? `${t('pg_lvl_next', { s: lv.score, nx, name: t(`lvl_${LEVELS[lv.level].k}`) })}${lv.level === 3 ? t('pg_lvl_next4') : ''}` : t('pg_lvl_top') }),
      weak ? el('small', { class: 'pg-tip', text: t('pg_tip', { t: t(`pg_tip_${weak[0]}`) }) }) : null,
      fromMgr ? el('small', { class: 'hint pg-lv-from', text: t('rk_lv_from', { d: snap.at || '' }) }) : null); }
  return el('section', { class: 'pg-card' }, el('h2', { text: t('pg_h') }),
    el('div', { class: 'pg-grid' }, rankBox, el('div', {}, el('h3', { text: t('pg_lvl_h') }), lvlBox), el('div', {}, el('h3', { text: t('pg_rec_h') }), recs)),
    el('h3', { text: t('pg_ach_h') }), achBox, el('p', { class: 'hint pg-private', text: t('pg_private') }));
}
function renderMe(waiting = false) {
  applyNameFixes();
  applyPending().then((changed) => { if (changed) { renderTeam(); renderKpi(); renderMe(); } });
  const body = $('me-body');
  const bm = buildBookmarklet(portalHome(), lang);
  const link = el('a', { class: 'btn primary bm va-hide', href: bm, draggable: 'true', text: `📊 ${t('me_bm')}`,
    onclick: (e) => { e.preventDefault(); toast(t('me_drag')); } });
  const setup = [
    el('ol', { class: 'dt-steps' }, el('li', {}, el('span', { text: t('me_step1') }), link), el('li', { text: t('me_step2') })),
    el('details', { class: 'me-phones' }, el('summary', { text: t('me_phones') }),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn', text: t('me_copy'), onclick: async () => { try { await navigator.clipboard.writeText(decodeURIComponent(bm)); toast(t('me_copied')); } catch { toast(t('me_copy_fail')); } } })),
      el('p', { class: 'hint', text: t('me_android') }), el('p', { class: 'hint', text: t('me_ios') })),
  ];
  if (waiting) { set(body, el('div', { class: 'empty', text: t('me_wait') })); return; }
  if (meDerived && !viewAs) { me = null; meDerived = false; }
  if (!me && !isTeamPortal && datasets.length) { const mid = managerIdOf(); if (mid) { const m = meFromPulls(mid); if (m) { me = m; meDerived = true; } } }
  const vaBar = (() => {
    if (isTeamPortal || !datasets.length) return null;
    if (viewAs) { const ppl = peopleOf(datasets), nmV = nameOf(ppl.find((p) => p.id === viewAs) || {}, lang) || viewAs;
      return el('div', { class: 'va-banner', role: 'status' }, el('span', { class: 'va-eye', 'aria-hidden': 'true', text: '👁' }),
        el('div', {}, el('b', { text: t('va_now', { n: nmV }) }), el('span', { text: t('va_note', { d: (me.extractedAt || '').slice(0, 10) }) })),
        el('button', { type: 'button', class: 'btn', text: `✕ ${t('va_exit')}`, onclick: () => endViewAs() })); }
    return null;
    const ppl = peopleOf(datasets), self = me && me.user ? me.user.id : null;
    const team = currentTeam(scoped(ppl), allTasks()).filter((id) => id !== self)
      .map((id) => ({ id, n: nameOf(ppl.find((p) => p.id === id) || {}, lang) || id })).sort((x, y) => x.n.localeCompare(y.n, lang));
    if (!team.length) return null;
    const sel = el('select', { 'aria-label': t('va_pick') }, [el('option', { value: '', text: t('va_pick') }), ...team.map((x) => el('option', { value: x.id, text: x.n }))]);
    return el('div', { class: 'va-picker' }, el('span', { text: `👁 ${t('va_label')}` }), sel,
      el('button', { type: 'button', class: 'btn tiny', text: t('va_go'), onclick: () => { if (sel.value) startViewAs(sel.value); else toast(t('va_pick')); } }),
      el('span', { class: 'hint', text: t('va_hint') }));
  })();
  if (!me) { const snap = isTeamPortal && mySnapId ? rankSnaps[mySnapId] : null;   // ADR-0078: his numbers as his manager sent them
    if (snap && snap.m) { set(body, snapView(snap), el('details', { class: 'me-again' }, el('summary', { text: t('ms_full') }), el('section', { class: 'dt-quick me-setup' }, ...setup))); return; }
    set(body, vaBar, el('section', { class: 'dt-quick me-setup' }, ...setup)); return; }   // the two steps carry their own numbers
  const qs = myProfile(me);
  const pm = profileMonths(me, new Date(), roster(), meKind);
  const fmtDate = (iso) => (iso ? `\u2066${iso.slice(0, 10)}\u2069` : '');
  const mine = openTasks(me.tasks, me.user.id);
  const hrsAge = (h) => (h == null ? '' : h < 48 ? t('hours', { n: Math.round(h) }) : t('days', { n: Math.round(h / 24) }));
  const self = me.people.find((p) => p.id === me.user.id) || {};
  const who = nameOf(self, lang) || me.user.name || me.user.id;
  const val = (k, r) => (r == null ? '—' : k === 'rate' ? formatRate(r.rate) : k === 'medianHours' || k === 'avgHours' ? (r[k] == null ? '—' : formatHours(r[k], lang)) : String(Math.round((r[k] || 0) * 10) / 10));
  // better is up for counts and rate, down for time; an arrow says which way it moved and whether that is good
  const arrow = (k, now, before) => {
    const a = now && now[k], b = before && before[k];
    if (a == null || b == null || a === b) return el('span', { class: 'delta same', text: '=' });
    const up = a > b, judged = ['done', 'rate', 'medianHours', 'avgHours', 'points'].includes(k), good = (k === 'medianHours' || k === 'avgHours') ? !up : up;
    const diff = k === 'rate' ? `${Math.round(Math.abs(a - b) * 100)}%` : (k === 'medianHours' || k === 'avgHours') ? formatHours(Math.abs(a - b), lang) : String(Math.round(Math.abs(a - b) * 10) / 10);
    return el('span', { class: `delta ${judged ? (good ? 'good' : 'bad') : 'neutral'}`, text: `${up ? '▲' : '▼'} \u2068${diff}\u2069` });
  };
  const METRICS = [['done', 'col_done'], ['assigned', 'col_assigned'], ['rate', 'col_rate'], ['avgHours', 'col_avg'], ['selfLogged', 'col_self'], ['fromEmail', 'col_email']];
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
  set(body, vaBar,
    el('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:12px' },
      el('details', { class: 'me-again va-hide' }, el('summary', { text: t('me_setup_again') }), ...setup),
      el('a', { class: 'btn primary va-hide', href: 'https://myafaqy.com/', target: '_blank', rel: 'noopener', text: `↻ ${t('me_update')}`, onclick: () => toast(t('me_refresh_hint')) })),
    el('div', { class: 'me-card' },
      el('div', {}, el('h2', { class: 'me-name', text: who }),
        positionOf(roster(), me.user.id, lang) ? el('p', { class: 'me-pos', text: positionOf(roster(), me.user.id, lang) }) : null,
        (roster().people[me.user.id] || {}).covers ? el('p', { class: 'me-teams', text: t('me_covers', { list: roster().people[me.user.id].covers.map((k) => t(`dept_${k}`)).join(' · ') }) })
          : self.teams && self.teams.length ? el('p', { class: 'me-teams', text: self.teams.join(' · ') }) : null,
        leaderOf(roster(), me.user.id) ? el('p', { class: 'me-teams', text: t('me_leader', { name: nm(leaderOf(roster(), me.user.id)) }) }) : null),
      el('div', { class: 'me-facts' },
        el('span', { text: t('me_updated', { date: fmtDate(me.extractedAt) }) }),
        el('span', { text: t(pm.scope.visible.length === 1 ? 'me_scope_1' : 'me_scope', { n: pm.scope.visible.length }) }))),
    // ADR-0072: «مؤشراتي» is the person's own month — the very view a row opens on «مؤشرات الفريق», from the same engine; no team data
    ...meMonthParts(),
    !isTeamPortal && !viewAs ? projectsCard() : null,   // the manager's own projects, on his own page only — as in v8.88
    // his place and progress — what his rank link carries: his own numbers and level, no colleague (ADR-0072 keeps it)
    (() => { if (!(isTeamPortal || viewAs)) return null; try { return progressCard(pm); } catch { return null; } })(),
    el('h2', { text: t('definitions') }), el('ul', { class: 'defs' }, KM_DEFS.map((k) => el('li', { text: t(k) }))),
    el('details', { class: 'team' }, el('summary', { text: t('me_refresh_h') }), el('p', { class: 'hint', text: t('me_refresh') }), ...setup,
      el('button', { type: 'button', class: 'btn va-hide', text: t('me_forget'), onclick: async () => { if (viewAs || meDerived) return; me = null; await store.putMe(null); renderMe(); } })));
}
// ---------- My KPIs as a dashboard (ADR-0034): openable tiles, a collapsible block for me and one for my team, tabs for a leader ----------
let meTab = 'me';
// ---------- drag-and-drop ordering for cards (kept on this device, per list) ----------
const ORDER_KEY = 'afaqy.order';
const orders = () => { try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '{}') || {}; } catch { return {}; } };
function sortByOrder(ids, key) { const o = orders()[key]; if (!Array.isArray(o)) return ids; const pos = new Map(o.map((id, i) => [id, i])); return [...ids].sort((x, y) => (pos.has(x) ? pos.get(x) : 1e9) - (pos.has(y) ? pos.get(y) : 1e9)); }
function makeSortable(box, key) {
  if (viewAs) return box;   // viewing someone else's page must not reorder the manager's own layout
  if (!box) return box; let dragged = null;
  for (const c of box.children) { if (!c.dataset.id) continue; c.draggable = true; c.classList.add('sortable');
    c.addEventListener('dragstart', (e) => { dragged = c; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.dataset.id); });
    c.addEventListener('dragend', () => { c.classList.remove('dragging'); for (const x of box.children) x.classList.remove('drop-before'); dragged = null; });
    c.addEventListener('dragover', (e) => { if (!dragged || dragged === c) return; e.preventDefault(); for (const x of box.children) x.classList.remove('drop-before'); c.classList.add('drop-before'); });
    c.addEventListener('drop', (e) => { e.preventDefault(); if (!dragged || dragged === c) return; box.insertBefore(dragged, c); c.classList.remove('drop-before');
      const o = orders(); o[key] = [...box.children].map((x) => x.dataset.id).filter(Boolean); localStorage.setItem(ORDER_KEY, JSON.stringify(o)); toast(t('order_saved')); }); }
  box.addEventListener('dragover', (e) => { if (dragged) e.preventDefault(); });
  box.addEventListener('drop', (e) => { if (!dragged || e.target !== box) return; box.append(dragged); const o = orders(); o[key] = [...box.children].map((x) => x.dataset.id).filter(Boolean); localStorage.setItem(ORDER_KEY, JSON.stringify(o)); });
  return box;
}
// long lists draw 200 rows at a time; a button under the table shows how many remain and draws the next page (ADR-0041)
function pagedBody(list, rowOf, step = 200) {
  const tbody = el('tbody', {}), more = el('button', { type: 'button', class: 'btn quiet more-rows' }); let shown = 0;
  const page = () => { const next = list.slice(shown, shown + step); tbody.append(...next.map(rowOf)); shown += next.length; const left = list.length - shown;
    more.hidden = left <= 0; more.textContent = t('rows_more', { n: Math.min(step, left), left }); };
  more.onclick = page; page(); return { tbody, more };
}
function sheet(title, views, csv) {
  // views: [{ k, label, node }] — a window with an information board and the list, and an export of the list
  let dlg = $('sheet-dlg');
  if (!dlg) { dlg = el('dialog', { id: 'sheet-dlg', class: 'sheet' }); document.body.append(dlg); }
  const exportCsv = () => { const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const blob = new Blob(['\ufeff' + csv.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const link = el('a', { href: URL.createObjectURL(blob), download: `${title.replace(/[^\p{L}\p{N}]+/gu, '-')}.csv` }); document.body.append(link); link.click(); link.remove(); };
  const list = Array.isArray(views) ? views : [{ k: 'one', label: '', node: views }];
  const bodyEl = el('div', { class: 'sheet-body' }, list[0].node);
  const switcher = list.length > 1 ? el('div', { class: 'sheet-views' }, list.map((v, n) => el('button', { type: 'button', class: `pill-btn${n === 0 ? ' on' : ''}`, 'data-k': v.k, text: v.label,
    onclick: (e) => { set(bodyEl, v.node); for (const b of e.currentTarget.parentNode.children) b.classList.toggle('on', b.getAttribute('data-k') === v.k); } }))) : null;
  set(dlg, el('div', { class: 'sheet-head' }, el('h3', { text: title }),
      el('div', { class: 'row' }, switcher, csv && csv.length > 1 ? el('button', { type: 'button', class: 'btn tiny', text: `⬇ ${t('sheet_export')}`, onclick: exportCsv }) : null,
        el('button', { type: 'button', class: 'btn quiet tiny', 'aria-label': t('close'), text: '✕', onclick: () => dlg.close() }))),
    bodyEl);
  dlg.showModal();
}
// ---------- the "Today" card (ADR-0038): a greeting, a streak, yesterday against your own average, what to start with, and the team's weekly bar ----------
// ---------- «مكانك وتقدمك» (ADR-0052): the engineer's rank among his team (no names, no one else's numbers), records, achievements, level ----------
// ---------- personal rank links (ADR-0054): the manager sends each engineer his own rank — nothing is published ----------
let rankSnaps = {};
const b64u = { enc: (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))) };
const ymPrev = (ym) => { const d = new Date(Date.parse(`${ym}-01T00:00:00Z`)); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };
const rankMonthDefault = () => { const today = saudiDay(new Date().toISOString()); return Number(today.slice(8, 10)) <= 7 ? ymPrev(today.slice(0, 7)) : today.slice(0, 7); };
function rankFor(id, ym) {   // his team: the same team leader in the team file, on duty — the same rule as the engineer's own card
  const tasks = allTasks(), wt = weights(), ro = roster().people || {}, lead = ro[id] && ro[id].leaderId, today = saudiDay(new Date().toISOString());
  const end = (() => { const d = new Date(Date.parse(`${ym}-01T00:00:00Z`)); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return d.toISOString().slice(0, 10); })(), to = ym === today.slice(0, 7) ? today : end;
  const peers = lead ? Object.keys(ro).filter((k) => k === id || (ro[k].leaderId === lead && !ro[k].onLeave)) : [id];
  const pts = peers.map((k) => ({ k, p: quarterBaseline(tasks, wt, k, { from: `${ym}-01`, to }).points }));
  const mine = pts.find((x) => x.k === id) || { p: 0 }, above = pts.filter((x) => x.p > mine.p).map((x) => x.p), below = pts.filter((x) => x.k !== id && x.p <= mine.p).map((x) => x.p);
  const team = currentTeam(scoped(peopleOf(datasets)), tasks), L = levelsFor(tasks, team, today, mailRows).levels[id];   // the same call as the person file
  const lv = L && L.level != null && L.score != null ? { l: L.level, s: Math.round(L.score), ax: Object.fromEntries(Object.entries(L.axes || {}).filter(([, v]) => v != null).map(([k, v]) => [k, Math.round(v)])) } : null;
  return { v: 1, id, ym, r: 1 + above.length, n: pts.length, gap: above.length ? Math.round((Math.min(...above) - mine.p) * 10) / 10 : null,
    lead: !above.length && below.length ? Math.round((mine.p - Math.max(...below)) * 10) / 10 : null, at: to, partial: ym === today.slice(0, 7), ...(lv ? { lv } : {}) };
}

// ---------- ADR-0081: the tender register — original tender mails from Outlook, one row each, his status and his dates ----------
let tenders = null;   // { items: [...], to, pulledAt } — on this device, carried by the backup
let tdKind = pref('tdkind') || 'month', tdPick = '', tdFrom = '', tdTo = '', tdBusy = '';
const TD_FROM = 'a.ibrahim@afaqy.com';
const tdNorm = (s) => String(s || '').replace(/[\u0640\u064B-\u0652]/g, '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim().toLowerCase();
const tdIsReply = (s) => /^\s*((re|fw|fwd|aw|wg)\s*:|رد\s*:|إعادة توجيه\s*:|اعادة توجيه\s*:|تحويل\s*:)/i.test(String(s || ''));
const tdKey = (s) => tdNorm(String(s || '').replace(/^\s*((re|fw|fwd)\s*:\s*)+/i, ''));
/** a.ibrahim as the SMTP address, or as the internal Exchange address a company PST keeps (…/cn=…-a.ibrahim). */
const tdIsAI = (addr) => { const e = String(addr || '').trim().toLowerCase(); return e === TD_FROM || /\/cn=(?:[^/]*-)?a\.ibrahim$/.test(e); };
const tdHasKraasa = (names) => (names || []).some((n) => tdNorm(n).includes(tdNorm('كراسة الشروط')));
const tdDay = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso || '')) ? saudiDay(String(iso).length > 10 ? String(iso) : `${iso}T12:00:00+03:00`) : null);
/** Check what Claude brought against the rules here too: originals only, from a.ibrahim or carrying the booklet. */
function tdImport(j) {
  if (!j || j.schema !== 'afaqy-tenders-from-mail/v1' || !Array.isArray(j.tenders)) return { err: 'td_bad' };
  const cur = tenders || { items: [] }, byKey = new Map(cur.items.map((x) => [x.id, x])); let added = 0, merged = 0, replies = 0, other = 0;
  for (const m of j.tenders) {
    const subject = String((m && m.subject) || '').trim().slice(0, 300), date = tdDay(m && m.received), from = String((m && m.from_address) || '').trim().toLowerCase().slice(0, 120);
    const att = (Array.isArray(m && m.attachments) ? m.attachments : []).map((x) => String(x).slice(0, 200)).slice(0, 20);
    if (!subject || !date) { other++; continue; }
    if (tdIsReply(subject)) { replies++; continue; }
    const byFrom = tdIsAI(from), byKr = tdHasKraasa(att); if (!m.manual && !byFrom && !byKr) { other++; continue; }
    const id = tdKey(subject), was = byKey.get(id);
    if (was) { if (date < was.date) { was.date = date; was.from = from; } was.byFrom = was.byFrom || byFrom; was.byKr = was.byKr || byKr; was.att = [...new Set([...(was.att || []), ...att.filter((n) => tdHasKraasa([n]))])]; merged++; continue; }
    const it = { id, subject, date, from: byFrom ? TD_FROM : from, byFrom, byKr, att: att.filter((n) => tdHasKraasa([n])), status: 'open', readyOn: '', due: '', visit: '', note: '', ...(m.manual ? { manual: true } : {}) };
    byKey.set(id, it); added++;
  }
  const items = [...byKey.values()].sort((x, y) => (x.date < y.date ? 1 : -1));
  const to = [cur.to, /^\d{4}-\d{2}-\d{2}$/.test(String(j.to || '')) ? j.to : null].filter(Boolean).sort().pop() || null;
  return { state: { items, to, pulledAt: new Date().toISOString() }, added, merged, replies, other };
}
const tdSave = async () => { await store.kvPut('tenders', tenders); };
function cleanTenders(x) {
  if (!x || !Array.isArray(x.items)) return null; const d = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? v : '');
  const items = x.items.filter((i) => i && i.id && i.subject && d(i.date)).slice(0, 5000).map((i) => ({ id: String(i.id).slice(0, 300), subject: String(i.subject).slice(0, 300), date: i.date,
    from: String(i.from || '').slice(0, 120), byFrom: !!i.byFrom, byKr: !!i.byKr, ...(i.manual ? { manual: true } : {}), att: (Array.isArray(i.att) ? i.att : []).map(String).slice(0, 20),
    status: i.status === 'ready' ? 'ready' : 'open', readyOn: d(i.readyOn), due: d(i.due), visit: d(i.visit), note: String(i.note || '').slice(0, 500) }));
  return { items, to: d(x.to) || null, pulledAt: String(x.pulledAt || '') };
}
const tdPeriodOf = (date, kind) => (kind === 'year' ? date.slice(0, 4) : kind === 'quarter' ? `${date.slice(0, 4)}-Q${Math.floor((Number(date.slice(5, 7)) - 1) / 3) + 1}` : kind === 'month' ? date.slice(0, 7) : 'all');
const tdLabel = (k) => (k === 'all' ? t('td_all') : /^\d{4}$/.test(k) ? k : periodLabel(k));
const tdDefaultFrom = () => (tenders && tenders.to) || '2026-01-01';
function tdPrompt(from = tdFrom || tdDefaultFrom(), to = tdTo || saudiDay(new Date().toISOString()), known = tenders ? tenders.items.map((i) => i.subject) : []) {
  return `Open Outlook on the web (https://outlook.office.com) — I am signed in with my AFAQY account.
Goal: list TENDER mails received ON OR AFTER ${from} AND ON OR BEFORE ${to}. Read only — do not send, reply, move, flag, delete or change read status.

A mail is a TENDER if it is an ORIGINAL message (not a reply or a forward: skip subjects starting with RE:, FW:, Fwd:, رد:, إعادة توجيه:) and ANY is true:
  A. it is FROM ${TD_FROM}
  B. it has an attachment whose file name contains «كراسة الشروط» (also «كراسه الشروط»)
For each conversation keep ONLY its first (earliest) matching message.

Search all folders (Archive included), scroll every result list to the end:
  from:${TD_FROM} received>=${from} received<=${to}
  attachmentnames:"كراسة الشروط" received>=${from} received<=${to}
  attachmentnames:"كراسه الشروط" received>=${from} received<=${to}

${known ? `ALREADY COLLECTED — skip any mail whose subject is one of these:
${known.map((k) => `- ${k}`).join('\n') || '- (none)'}
` : ''}
Keep ONLY: subject, sender address, received date-time, and the file names of the «كراسة الشروط» attachments — no body text, contacts, phone numbers or prices.

Save one JSON file named afaqy-tenders-from-mail-<today YYYY-MM-DD>.json:
{ "schema": "afaqy-tenders-from-mail/v1", "mailbox": "<my address>", "from": "${from}", "to": "${to}",
  "tenders": [ { "subject": "...", "from_address": "...", "received": "YYYY-MM-DDTHH:MM:SS+03:00", "attachments": ["..."] } ] }
If a search or folder failed, say exactly which one.`;
}

/** A bookmark to drag to the bar: asks the period, copies the instructions for Claude in Chrome, opens Outlook. It cannot start Claude itself. */
function tdBookmarklet() {
  const tpl = tdPrompt('__FROM__', '__TO__', null), def = tdDefaultFrom();
  const q = { f: t('td_bm_from'), t: t('td_bm_to'), ok: t('td_bm_ok'), copy: t('td_bm_copy') };
  const code = `(()=>{const T=${JSON.stringify(tpl)},Q=${JSON.stringify(q)},d=new Date(Date.now()+108e5).toISOString().slice(0,10),ok=(s)=>/^\\d{4}-\\d{2}-\\d{2}$/.test(s||'');`
    + `const f=prompt(Q.f,${JSON.stringify(def)});if(!ok(f))return;const t=prompt(Q.t,d);if(!ok(t))return;const P=T.replace(/__FROM__/g,f).replace(/__TO__/g,t);`
    + `const done=()=>alert(Q.ok);(navigator.clipboard?navigator.clipboard.writeText(P):Promise.reject()).then(done,()=>prompt(Q.copy,P));`
    + `if(!/outlook\\.(office|office365|live)\\.com$/.test(location.hostname))window.open('https://outlook.office.com/mail/','_blank');})()`;
  return `javascript:${encodeURIComponent(code)}`;
}
/** Tender mails out of a PST, on this device: the same rules and the same checks as the Claude file. */
async function tdFromPst(f) {
  tdBusy = t('td_pst_reading', { name: f.name, mb: Math.max(1, Math.round(f.size / 1048576)) }); renderTenders();
  try {
    await mfLoadLib(); const buf = await f.arrayBuffer(); await new Promise((r) => setTimeout(r, 30));
    const pst = new window.PSTFile(window.Buffer.from(buf)), from = tdFrom || '0000-01-01', to = tdTo || '9999-12-31', out = []; let read = 0, withAtt = 0;
    const walk = (fo) => { if (fo.hasSubfolders) for (const c of fo.getSubFolders()) walk(c);
      if (fo.contentCount > 0) { let m = fo.getNextChild(), g = 0;
        while (m && g++ < 500000) { read++; const d = m.clientSubmitTime || m.messageDeliveryTime, day = d ? saudiDay(new Date(d).toISOString()) : null;
          if (day && day >= from && day <= to) { const att = [];
            if (m.hasAttachments) { withAtt++; for (let i = 0; i < Math.min(30, m.numberOfAttachments || 0); i++) { try { const x = m.getAttachment(i); att.push(String(x.longFilename || x.filename || '')); } catch { /* an unreadable attachment is only its name missing */ } } }
            const addr = String(m.senderEmailAddress || '').trim();
            if (tdIsAI(addr) || tdHasKraasa(att)) out.push({ subject: String(m.subject || ''), from_address: addr, received: new Date(d).toISOString(), attachments: att }); }
          m = fo.getNextChild(); } } };
    walk(pst.getRootFolder());
    const r = tdImport({ schema: 'afaqy-tenders-from-mail/v1', from, to: tdTo || saudiDay(new Date().toISOString()), tenders: out }); if (r.err) throw new Error(r.err);
    tenders = r.state; await tdSave(); tdBusy = '';
    toast(`${t('td_pst_read', { n: read, w: withAtt })} ${t('td_loaded', { a: r.added, m: r.merged, r: r.replies, o: r.other })}`);
  } catch (err) { console.error(err); tdBusy = ''; toast(t('td_pst_fail')); }
  renderTenders();
}
/** One tender by hand — a tender with no mail, or one the pull missed. */
function tdAddManual() {
  const today = saudiDay(new Date().toISOString());
  const s = el('input', { type: 'text', class: 'td-m-subject', required: '', maxlength: 300, dir: 'auto' }), d = el('input', { type: 'date', class: 'td-m-date', value: today, max: today }),
    w = el('input', { type: 'text', class: 'td-m-from', maxlength: 120, dir: 'auto', placeholder: t('td_m_from_ph') });
  const dlg = el('dialog', { class: 'proj-edit td-add', 'aria-labelledby': 'td-add-h' }, el('h2', { id: 'td-add-h', text: t('td_add_h') }),
    el('label', { class: 'fl-label' }, el('span', { text: t('td_col_subject') }), s), el('label', { class: 'fl-label' }, el('span', { text: t('td_col_date') }), d),
    el('label', { class: 'fl-label' }, el('span', { text: t('td_col_from') }), w),
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary td-m-save', text: t('td_add_save'), onclick: async () => {
      const subject = s.value.trim(), date = d.value; if (!subject || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast(t('td_add_need')); return; }
      if (tenders && tenders.items.some((i) => i.id === tdKey(subject))) { toast(t('td_add_exists')); return; }
      const r = tdImport({ schema: 'afaqy-tenders-from-mail/v1', to: (tenders && tenders.to) || null, tenders: [{ subject, from_address: w.value.trim(), received: `${date}T12:00:00+03:00`, attachments: [], manual: true }] });
      if (r.err || !r.added) { toast(t('td_add_need')); return; } tenders = { ...r.state, to: (tenders && tenders.to) || null }; await tdSave(); dlg.close(); toast(t('td_add_done')); renderTenders(); } }),
      el('button', { type: 'button', class: 'btn quiet', text: t('close'), onclick: () => dlg.close() })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal(); s.focus();
}
async function tdExcel(rows) {
  const X = await loadXlsx(), H = [t('td_col_subject'), t('td_col_date'), t('td_col_from'), t('td_col_why'), t('td_col_status'), t('td_col_ready'), t('td_col_due'), t('td_col_visit'), t('td_col_note')];
  const why = (i) => [i.byFrom ? t('td_why_from') : '', i.byKr ? t('td_why_kr') : '', i.manual ? t('td_why_manual') : ''].filter(Boolean).join(' + ');
  const ws = X.utils.aoa_to_sheet([H, ...rows.map((i) => [i.subject, i.date, i.from, why(i), i.status === 'ready' ? t('td_ready') : t('td_open'), i.readyOn, i.due, i.visit, i.note])]);
  ws['!cols'] = [{ wch: 60 }, { wch: 12 }, { wch: 26 }, { wch: 24 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 40 }]; ws['!views'] = [{ RTL: lang !== 'en' }];
  const months = [...new Set(tenders.items.map((i) => i.date.slice(0, 7)))].sort();
  const sum = X.utils.aoa_to_sheet([[t('td_col_month'), t('td_k_in'), t('td_k_ready'), t('td_k_open')], ...months.map((m) => { const g = tenders.items.filter((i) => i.date.startsWith(m)); return [m, g.length, g.filter((i) => i.status === 'ready').length, g.filter((i) => i.status !== 'ready').length]; })]);
  sum['!views'] = [{ RTL: lang !== 'en' }]; const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, t('td_sheet')); X.utils.book_append_sheet(wb, sum, t('td_sheet_sum'));
  X.writeFile(wb, `AFAQY-tenders-${saudiDay(new Date().toISOString())}.xlsx`);
}
function renderTenders() {
  const body = $('tenders-body'); if (!body || isTeamPortal) return; const today = saudiDay(new Date().toISOString());
  const up = el('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    let j; try { j = JSON.parse(await f.text()); } catch { toast(t('td_bad')); return; }
    const r = tdImport(j); if (r.err) { toast(t(r.err)); return; } tenders = r.state; await tdSave();
    toast(t('td_loaded', { a: r.added, m: r.merged, r: r.replies, o: r.other })); renderTenders(); } });
  const pst = el('input', { type: 'file', accept: '.pst,.ost', hidden: true, onchange: (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) tdFromPst(f); } });
  const dIn2 = (cls, val, on) => el('input', { type: 'date', class: cls, value: val, max: today, onchange: (e) => on(e.target.value) });
  const pull = el('section', { class: 'dt-quick td-pull' }, el('h2', { text: t('td_pull_h') }),
    el('div', { class: 'row td-period' }, el('span', { text: t('td_from') }), dIn2('td-from', tdFrom || tdDefaultFrom(), (v) => { tdFrom = v; }), el('span', { text: t('td_to') }), dIn2('td-to', tdTo || today, (v) => { tdTo = v; })),
    el('div', { class: 'td-way' }, el('h3', { text: t('td_way_claude') }), el('p', { class: 'hint', text: t('td_pull_lead', { from: tdFrom || tdDefaultFrom() }) }),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary td-copy', text: `📋 ${t('td_copy')}`, onclick: () => copyText(tdPrompt(), t('td_copied')) }),
        el('a', { class: 'btn td-bm', href: tdBookmarklet(), title: t('td_bm_hint'), onclick: (e) => { e.preventDefault(); toast(t('td_bm_hint')); }, text: `📌 ${t('td_bm')}` }),
        el('a', { class: 'btn', href: 'https://outlook.office.com/mail/', target: '_blank', rel: 'noopener', text: t('proj_open_outlook') }),
        el('button', { type: 'button', class: 'btn', text: `⬆ ${t('td_upload')}`, onclick: () => up.click() }), up),
      el('p', { class: 'hint', text: t('td_bm_hint') })),
    el('div', { class: 'td-way' }, el('h3', { text: t('td_way_pst') }), el('p', { class: 'hint', text: t('td_pst_lead') }),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn td-pst-btn', disabled: !!tdBusy, text: `📂 ${t('td_pst_pick')}`, onclick: () => pst.click() }), pst),
      tdBusy ? el('p', { class: 'note td-busy', role: 'status', text: tdBusy }) : null),
    el('div', { class: 'td-way' }, el('h3', { text: t('td_way_manual') }), el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn td-add-btn', text: `＋ ${t('td_add')}`, onclick: tdAddManual }))),
    tenders && tenders.pulledAt ? el('p', { class: 'hint', text: t('td_last', { to: tenders.to || '—', n: tenders.items.length }) }) : null);
  if (!tenders || !tenders.items.length) { set(body, pull, el('p', { class: 'note', text: t('td_empty') })); return; }
  const periods = [...new Set(tenders.items.map((i) => tdPeriodOf(i.date, tdKind)))].sort().reverse();
  if (tdKind === 'all') tdPick = 'all'; else if (!periods.includes(tdPick)) tdPick = periods.includes(tdPeriodOf(today, tdKind)) ? tdPeriodOf(today, tdKind) : periods[0];
  const rows = tenders.items.filter((i) => tdKind === 'all' || tdPeriodOf(i.date, tdKind) === tdPick);
  const ready = rows.filter((i) => i.status === 'ready').length, soon = rows.filter((i) => i.status !== 'ready' && i.due && i.due >= today && i.due <= saudiDay(new Date(Date.now() + 7 * 864e5).toISOString())).length;
  const kinds = el('div', { class: 'pills' }, [['month', 'td_month'], ['quarter', 'td_quarter'], ['year', 'td_year'], ['all', 'td_all']].map(([k, l]) =>
    el('button', { type: 'button', class: `pill-btn${tdKind === k ? ' on' : ''}`, text: t(l), onclick: () => { tdKind = k; pref('tdkind', k); tdPick = ''; renderTenders(); } })));
  const pick = tdKind === 'all' ? null : el('select', { class: 'td-pick', 'aria-label': t('td_period'), onchange: (e) => { tdPick = e.target.value; renderTenders(); } }, periods.map((k) => el('option', { value: k, text: tdLabel(k), ...(k === tdPick ? { selected: '' } : {}) })));
  const tile = (cls, n, l) => el('div', { class: `km-tile ${cls}` }, el('b', { text: String(n) }), el('span', { text: t(l) }));
  const save = async (i, patch) => { Object.assign(i, patch); await tdSave(); };
  const dIn = (i, k) => el('input', { type: 'date', class: `td-${k}`, value: i[k] || '', 'aria-label': t(`td_col_${k === 'readyOn' ? 'ready' : k}`), onchange: async (e) => { await save(i, { [k]: e.target.value }); renderTenders(); } });
  const table = el('div', { class: 'table-wrap' }, el('table', { class: 'td-table' },
    el('thead', {}, el('tr', {}, ['td_col_subject', 'td_col_date', 'td_col_why', 'td_col_status', 'td_col_ready', 'td_col_due', 'td_col_visit', 'td_col_note', ''].map((k) => el('th', { text: k ? t(k) : '' })))),
    el('tbody', {}, rows.map((i) => el('tr', { 'data-id': i.id, class: i.status === 'ready' ? 'td-done' : '' },
      el('td', {}, el('div', { class: 'td-subj', text: i.subject, dir: 'auto' }), el('small', { class: 'hint', text: i.from })),
      el('td', { class: 'num', text: i.date }),
      el('td', {}, i.byFrom ? el('span', { class: 'chip', text: t('td_why_from') }) : null, i.byKr ? el('span', { class: 'chip', text: t('td_why_kr') }) : null, i.manual ? el('span', { class: 'chip td-manual', text: t('td_why_manual') }) : null),
      el('td', {}, el('select', { class: 'td-status', 'aria-label': t('td_col_status'), onchange: async (e) => { const st = e.target.value; await save(i, { status: st, readyOn: st === 'ready' ? (i.readyOn || today) : '' }); renderTenders(); } },
        el('option', { value: 'open', text: t('td_open'), ...(i.status !== 'ready' ? { selected: '' } : {}) }), el('option', { value: 'ready', text: t('td_ready'), ...(i.status === 'ready' ? { selected: '' } : {}) }))),
      el('td', {}, i.status === 'ready' ? dIn(i, 'readyOn') : el('span', { class: 'hint', text: '—' })),
      el('td', {}, dIn(i, 'due')), el('td', {}, dIn(i, 'visit')),
      el('td', {}, el('input', { type: 'text', class: 'td-note', value: i.note || '', dir: 'auto', maxlength: 500, 'aria-label': t('td_col_note'), onchange: (e) => save(i, { note: e.target.value.trim() }) })),
      el('td', {}, el('button', { type: 'button', class: 'icon-btn', title: t('td_del'), 'aria-label': t('td_del'), text: '✕', onclick: async () => { if (!confirm(t('td_del_confirm', { s: i.subject }))) return; tenders.items = tenders.items.filter((x) => x !== i); await tdSave(); renderTenders(); } })))))));
  set(body, pull,
    el('div', { class: 'row td-filter' }, kinds, pick),
    el('p', { class: 'answer-line', text: t('td_answer', { p: tdLabel(tdPick), n: rows.length, r: ready, o: rows.length - ready }) }),
    el('div', { class: 'km-tiles td-tiles' }, tile('km-total', rows.length, 'td_k_in'), tile('km-points', ready, 'td_k_ready'), tile('km-email', rows.length - ready, 'td_k_open'), tile('km-other', soon, 'td_k_soon')),
    el('div', { class: 'row', style: 'justify-content:flex-end' }, el('button', { type: 'button', class: 'btn tiny', text: `⬇ ${t('td_excel')}`, onclick: () => tdExcel(rows) })),
    rows.length ? table : el('p', { class: 'note', text: t('td_none_period') }));
}

// ---------- ADR-0079: the bento's small visuals — drawn from the same numbers as the tiles, never decoration ----------
/** The total's sources as one bar: from e-mail, opened himself, assigned by others — their real shares. */
function splitBar(T) {
  const parts = [['email', 'src_email', 'var(--sea)'], ['self', 'src_self', 'var(--live)'], ['other', 'src_other', 'var(--sig)']].map(([k, l, c]) => ({ v: Number(T[k]) || 0, l: t(l), c }));
  const sum = parts.reduce((s, p) => s + p.v, 0); if (!sum) return null; const pc = (v) => Math.round((v / sum) * 100);
  return el('div', { class: 'bt-split' },
    el('div', { class: 'bt-bar', role: 'img', 'aria-label': parts.map((p) => `${p.l} ${pc(p.v)}%`).join(' · ') }, parts.map((p) => el('i', { style: `width:${(p.v / sum) * 100}%;background:${p.c}`, title: `${p.l}: ${p.v}` }))),
    el('div', { class: 'lg' }, parts.map((p) => el('span', { style: `--c:${p.c}`, text: `${p.l} ${pc(p.v)}%` }))));
}
/** The closed share as a ring beside the average, named under it, the full sentence on hover. */
function closedRing(closed, total) {
  if (!total || closed == null) return null; const k = Math.min(1, closed / total), r = 22, C = 2 * Math.PI * r, p = Math.round(k * 100);
  const full = t('bt_closed_full', { p, c: closed, n: total }), box = el('div', { class: 'bt-ringbox', title: full });
  box.innerHTML = `<svg class="bt-ring" viewBox="0 0 54 54" role="img"><circle class="bg" cx="27" cy="27" r="${r}"/><circle class="fg" cx="27" cy="27" r="${r}" transform="rotate(-90 27 27)" stroke-dasharray="${C}" stroke-dashoffset="${C}"/><text x="27" y="31" text-anchor="middle">${p}%</text></svg>`;
  box.querySelector('svg').setAttribute('aria-label', full); box.append(el('span', { 'aria-hidden': 'true', text: t('bt_closed_rate') }));
  requestAnimationFrame(() => requestAnimationFrame(() => { const fg = box.querySelector('.fg'); if (fg) fg.style.strokeDashoffset = String(C * (1 - k)); }));
  return box;
}

// ---------- ADR-0078: the weekly message, the personal phone link (his month and week), and «this number looks wrong» ----------
let mySnapId = null;   // the engineer's own snapshot, from the last link he opened on this device
const SNAP_KEYS = ['email', 'self', 'other', 'total', 'closed', 'avg', 'points'];
const SNAP_LABEL = { email: 'src_email', self: 'src_self', other: 'src_other', total: 'km_total', closed: 'km_closed', avg: 'km_avg', rd: 'km_rd', points: 'col_points' };
const SNAP_KIND = { email: 'n', self: 'n', other: 'n', total: 'n', closed: 'h', avg: 'l', rd: 'n', points: 'h' };
const SNAP_DEF = { email: 'km_def_src', self: 'km_def_src', other: 'km_def_src', total: 'km_def_recv', closed: 'km_def_avg', avg: 'km_def_avg', rd: 'km_def_rd', points: 'km_def_pts' };
function copyText(text, ok) { (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject(new Error('no clipboard'))).then(() => toast(ok), () => window.prompt(t('rk_copy_manual'), text)); }
/** «This number looks wrong»: the number with where it comes from, and a note — copied or e-mailed; nothing is kept. */
function flagNumber(c) {
  const note = el('textarea', { rows: 3, class: 'fl-note', placeholder: t('fl_note_ph'), dir: 'auto' });
  const ctx = [['fl_who', c.who], ['fl_period', c.period], ['fl_number', `${c.label} = ${c.value}`], ['fl_prev', c.prev], ['fl_def', c.def], ['fl_asof', c.asOf || '—']];
  const text = () => [t('fl_h'), ...ctx.map(([k, v]) => `${t(k)}: ${v}`), `${t('fl_note')}: ${note.value.trim() || '—'}`, `— ${t('portal')} v${PORTAL_VERSION}`].join('\n');
  const dlg = el('dialog', { class: 'fl-dialog', 'aria-labelledby': 'fl-title' }, el('h2', { id: 'fl-title', text: t('fl_h') }),
    el('dl', { class: 'fl-ctx' }, ctx.flatMap(([k, v]) => [el('dt', { text: t(k) }), el('dd', { text: v })])),
    el('label', { class: 'fl-label' }, el('span', { text: t('fl_note') }), note),
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary fl-copy', text: `📋 ${t('fl_copy')}`, onclick: () => copyText(text(), t('fl_copied')) }),
      el('a', { class: 'btn fl-mail', href: '#', text: `✉ ${t('fl_mail')}`, onclick: (e) => { e.preventDefault(); location.href = `mailto:?subject=${encodeURIComponent(t('fl_subject', { label: c.label, who: c.who }))}&body=${encodeURIComponent(text())}`; } })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
const flagBtn = (c) => el('button', { type: 'button', class: 'km-flag', title: t('fl_btn'), 'aria-label': t('fl_btn'), text: '⚑', onclick: (e) => { e.stopPropagation(); flagNumber(c); } });
const dataAsOf = () => { const x = [...datasets.map((d) => d.extractedAt), me && me.extractedAt].filter(Boolean).sort().pop(); return x ? saudiDay(x) : '—'; };
/** A person's numbers for a range, in the snapshot's order; the average in minutes (-1 = none). */
function numsFor(id, range) { const x = monthNumbers(factor1(allTasks(), { range, team: [id] }), weightedPoints(allTasks(), allActivities(), weights(), { range, team: [id] }), id) || {};
  return SNAP_KEYS.map((k) => (k === 'avg' ? (x.avg == null ? -1 : Math.round(x.avg * 60)) : Math.round((x[k] || 0) * 10) / 10)); }
/** The Saudi work week, Sunday to Saturday: off 0 = this week to today, 1 = last week. */
function weekRange(off = 1, today = saudiDay(new Date().toISOString())) {
  const d = new Date(`${today}T00:00:00Z`), s = new Date(d); s.setUTCDate(d.getUTCDate() - d.getUTCDay() - 7 * off); const e = new Date(s); e.setUTCDate(s.getUTCDate() + 6);
  const iso = (x) => x.toISOString().slice(0, 10); return { from: iso(s), to: off === 0 ? today : iso(e) };
}
const prevWeekRange = (r) => { const s = new Date(`${r.from}T00:00:00Z`); s.setUTCDate(s.getUTCDate() - 7); const e = new Date(s); e.setUTCDate(s.getUTCDate() + 6); return { from: s.toISOString().slice(0, 10), to: e.toISOString().slice(0, 10) }; };
/** The personal link's snapshot: his rank (as before) plus his month and his week, each with the one before. Only his own numbers. */
function personSnap(id, ym, week) {
  return { ...rankFor(id, ym), v: 2, m: { n: numsFor(id, monthRangeOf(ym)), p: numsFor(id, monthRangeOf(prevMonthOf(ym))) }, w: { f: week.from, t: week.to, n: numsFor(id, week), p: numsFor(id, prevWeekRange(week)) } };
}
function copyWeekMessage(id, ym, nm, week) {
  const s = personSnap(id, ym, week), [e, sf, o, tot, cl, avg, pts] = s.w.n, P = s.w.p;
  copyText(t('wk_msg', { name: (nm(id) || '').split(' ')[0], a: s.w.f, b: s.w.t, total: tot, email: e, self: sf, other: o, closed: cl, avg: avg < 0 ? '—' : hmOf(avg / 60), points: pts, ptotal: P[3], ppoints: P[6], link: rankLink(s) }), t('wk_copied', { name: nm(id) }));
}
/** On a phone with no pull of his own: his numbers as his manager sent them. */
function snapView(s) {
  const fv = (k, v) => (k === 'avg' ? (v < 0 ? '—' : hmOf(v / 60)) : String(v)), hv = (k, v) => (k === 'avg' ? (v < 0 ? null : v / 60) : v);
  const tbl = (label, plabel, n, p) => el('table', { class: 'km-snap' }, el('thead', {}, el('tr', {}, el('th', {}), el('th', { class: 'num', text: label }), el('th', { class: 'num', text: plabel }), el('th', { class: 'num', text: t('km_change') }), el('th', {}))),
    el('tbody', {}, SNAP_KEYS.map((k, i) => el('tr', {}, el('td', { text: t(SNAP_LABEL[k]) }), el('td', { class: 'num' }, el('b', { text: fv(k, n[i]) })), el('td', { class: 'num', text: fv(k, p[i]) }),
      el('td', { class: 'num' }, kmDelta(hv(k, n[i]), hv(k, p[i]), SNAP_KIND[k], plabel)), el('td', {}, flagBtn({ who: t('ms_me'), period: label, label: t(SNAP_LABEL[k]), value: fv(k, n[i]), prev: fv(k, p[i]), def: t(SNAP_DEF[k]), asOf: s.at }))))));
  return el('section', { class: 'me-snap' }, el('h2', { text: t('ms_h') }), el('p', { class: 'hint', text: t('ms_lead', { at: s.at || '—' }) }),
    el('h3', { text: t('ms_month', { m: monthLabel(s.ym) }) }), el('div', { class: 'table-wrap' }, tbl(monthLabel(s.ym), monthLabel(prevMonthOf(s.ym)), s.m.n, s.m.p)),
    s.w ? [el('h3', { text: t('ms_week', { a: s.w.f, b: s.w.t }) }), el('div', { class: 'table-wrap' }, tbl(t('ms_this_week'), t('ms_prev_week'), s.w.n, s.w.p))] : null,
    el('p', { class: 'me-teams', text: t('pg_rank', { r: s.r, n: s.n }) }));
}
const rankLink = (snap) => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}?portal=team#rank=${b64u.enc(snap)}`;
function parseRankSnap(o) {   // only his own numbers; anything else is refused
  if (!o || ![1, 2].includes(o.v) || typeof o.id !== 'string' || !/^[0-9A-Za-z_-]{1,20}$/.test(o.id) || !/^\d{4}-\d{2}$/.test(o.ym) || !Number.isInteger(o.r) || !Number.isInteger(o.n) || o.r < 1 || o.n < 1 || o.r > o.n || o.n > 200) return null;
  const num = (v) => (v == null ? null : Number.isFinite(Number(v)) ? Math.round(Number(v) * 10) / 10 : null);
  const lv = o.lv && Number.isInteger(o.lv.l) && o.lv.l >= 1 && o.lv.l <= LEVELS.length && Number.isFinite(Number(o.lv.s))
    ? { l: o.lv.l, s: Math.max(0, Math.min(100, Math.round(Number(o.lv.s)))), ax: Object.fromEntries(Object.entries(o.lv.ax && typeof o.lv.ax === 'object' ? o.lv.ax : {}).filter(([k, v]) => /^[a-zA-Z]{1,16}$/.test(k) && Number.isFinite(Number(v))).slice(0, 8).map(([k, v]) => [k, Math.max(0, Math.min(100, Math.round(Number(v))))])) } : null;
  const arr = (x) => (Array.isArray(x) && x.length === 7 && x.every((y) => Number.isFinite(Number(y)) && Number(y) >= -1 && Number(y) < 1e7) ? x.map(Number) : null), day = (x) => /^\d{4}-\d{2}-\d{2}$/.test(String(x || ''));
  const m = o.m && arr(o.m.n) && arr(o.m.p) ? { n: arr(o.m.n), p: arr(o.m.p) } : null, w = o.w && day(o.w.f) && day(o.w.t) && arr(o.w.n) && arr(o.w.p) ? { f: o.w.f, t: o.w.t, n: arr(o.w.n), p: arr(o.w.p) } : null;
  return { v: o.v, ...(m ? { m } : {}), ...(w ? { w } : {}), id: o.id, ym: o.ym, r: o.r, n: o.n, gap: num(o.gap), lead: num(o.lead), at: /^\d{4}-\d{2}-\d{2}$/.test(o.at || '') ? o.at : null, partial: !!o.partial, ...(lv ? { lv } : {}) };
}
async function takeRankLink(redraw = false) {   // at start the page is drawn after loading; on an open portal it is redrawn here (the router does not redraw)
  if (!location.hash.startsWith('#rank=')) return;
  let snap = null; try { snap = parseRankSnap(b64u.dec(location.hash.slice(6))); } catch { snap = null; }
  history.replaceState(null, '', `${location.pathname}${location.search}#me`);   // the numbers leave the address bar at once
  if (!snap) { setTimeout(() => toast(t('rk_bad')), 700); return; }
  rankSnaps[snap.id] = snap; await store.kvPut('rankcards', rankSnaps); mySnapId = snap.id; await store.kvPut('mysnap', snap.id);
  if (redraw) renderMe();
  setTimeout(() => toast(t('rk_got', { r: snap.r, n: snap.n })), 700);
}
function copyRankMessage(id, ym, nm, week = weekRange(1)) {
  const snap = personSnap(id, ym, week), lvtxt = snap.lv ? t('rk_msg_lv', { lv: `${snap.lv.l} · ${t(`lvl_${LEVELS[snap.lv.l - 1].k}`)}` }) : '';
  const text = t('rk_msg', { name: (nm(id) || '').split(' ')[0], m: monthLabel(ym), r: snap.r, n: snap.n, lvtxt, link: rankLink(snap) });
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject(new Error('no clipboard'))).then(() => toast(t('rk_copied', { name: nm(id) })), () => window.prompt(t('rk_copy_manual'), text));
}
function rankLinksSection() {
  if (isTeamPortal || !datasets.length) return null;
  const ppl = peopleOf(datasets), nm = (id) => nameOf(ppl.find((p) => p.id === id) || {}, lang) || id, ro = roster().people || {};
  const cur = saudiDay(new Date().toISOString()).slice(0, 7); let ym = rankMonthDefault(), wk = weekRange(1);
  const team = currentTeam(scoped(ppl), allTasks()).filter((id) => ro[id] && ro[id].leaderId && !ro[id].onLeave), body = el('tbody', {});
  const draw = () => set(body, ...team.map((id) => ({ id, s: rankFor(id, ym) })).sort((p, q) => String(ro[p.id].leaderId).localeCompare(String(ro[q.id].leaderId)) || p.s.r - q.s.r).map(({ id, s }) => el('tr', {},
    el('td', { text: nm(id) }), el('td', { class: 'num', text: t('pg_rank', { r: s.r, n: s.n }) }), el('td', { text: s.gap != null ? t('pg_gap', { g: s.gap }) : s.lead != null ? t('pg_lead', { g: s.lead }) : '—' }),
    (() => { const n = numsFor(id, wk), p = numsFor(id, prevWeekRange(wk)); return el('td', { class: 'wk-cell' }, t('wk_cell', { n: n[3], p: n[6] }), ' ', kmDelta(n[6], p[6], 'h', t('ms_prev_week'))); })(),
    el('td', {}, el('button', { type: 'button', class: 'btn tiny rk-copy', text: `📋 ${t('rk_copy')}`, onclick: () => copyRankMessage(id, ym, nm, wk) }), ' ', el('button', { type: 'button', class: 'btn tiny wk-copy', text: `🗓 ${t('wk_copy')}`, onclick: () => copyWeekMessage(id, ym, nm, wk) })))));
  const sel = el('select', { class: 'rk-month', onchange: (e) => { ym = e.target.value; draw(); } }, [[cur, t('rk_cur', { m: monthLabel(cur) })], [ymPrev(cur), monthLabel(ymPrev(cur))]].map(([v, l]) => el('option', { value: v, selected: v === ym ? '' : null, text: l })));
  draw();
  return el('section', { class: 'rk-sec', id: 'k-ranks' }, el('h2', { text: t('rk_h') }), el('p', { class: 'hint', text: t('rk_lead') }), el('div', { class: 'row' }, el('span', { text: t('rk_month') }), sel, el('span', { text: t('wk_week') }), el('select', { class: 'wk-week', onchange: (e) => { wk = weekRange(Number(e.target.value)); draw(); } }, [[1, t('wk_last')], [0, t('wk_this')]].map(([v, l]) => el('option', { value: String(v), text: l })))),
    el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, [t('col_person'), t('rk_col_rank'), t('rk_col_gap'), t('wk_col'), ''].map((x) => el('th', { text: x })))), body)));
}
// ---------- my projects from mail (ADR-0039): imported from the file Claude in Chrome builds from Outlook web — device only ----------
function cleanProjects(raw) {
  if (!raw || raw.schema !== 'afaqy-projects-from-mail/v1' || !Array.isArray(raw.projects)) return null;
  const s = (v, n = 160) => String(v == null ? '' : v).slice(0, n), d = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : ''), n = (v) => Math.max(0, Math.round(Number(v) || 0));
  return { schema: raw.schema, from: d(raw.from), to: d(raw.to), importedAt: new Date().toISOString().slice(0, 10), note: s(raw.notes, 600),
    projects: raw.projects.map((p) => ({ project: s(p.project), tender: s(p.tender_no, 40), first: d(p.first_date), last: d(p.last_date), messages: n(p.messages),
      me: n(p.sent_by_me), akram: n(p.sent_by_akram), shaarawi: n(p.sent_by_shaarawi), aibrahim: !!p.with_a_ibrahim, kraasa: !!p.has_kraasa,
      rules: s(p.matched_rules, 20), worked: !!p.worked_on })).filter((p) => p.project),
    skipped: (Array.isArray(raw.skipped) ? raw.skipped : []).map((x) => ({ subject: s(x.subject), reason: s(x.reason, 120) })) };
}
function cleanRegister(raw) {
  if (!raw || raw.schema !== 'afaqy-projects-register/v1' || !Array.isArray(raw.items)) return null;
  const s = (v, n = 160) => String(v == null ? '' : v).slice(0, n), num = (v) => Math.max(0, Math.round(Number(v) || 0)), arr = (v) => (Array.isArray(v) ? v.map((x) => s(x, 40)).filter(Boolean) : []);
  const ST = ['delivered', 'ongoing', 'won', 'submitted', 'studied', 'worked', 'lost'], KD = ['project', 'commercial', 'tender'];
  const mail = raw.mail && typeof raw.mail === 'object' ? Object.fromEntries(Object.entries(raw.mail).slice(0, 3000).map(([k, v]) => [s(k, 200), { hide: !!(v && v.hide), item: s(v && v.item, 20), name: s(v && v.name, 160), status: ['worked', 'studied', 'seen'].includes(v && v.status) ? v.status : '', ok: !!(v && v.ok) }])) : {};
  return { schema: raw.schema, asOf: s(raw.asOf, 10), mail, sources: arr(raw.sources).map((x) => x), h1: raw.h1 && typeof raw.h1 === 'object' ? Object.fromEntries(Object.entries(raw.h1).map(([k, v]) => [s(k, 30), num(v)])) : {},
    items: raw.items.map((x) => ({ id: s(x.id, 12), name: s(x.name), client: s(x.client, 120), line: s(x.line, 60), value: num(x.value), status: ST.includes(x.status) ? x.status : 'submitted',
      period: s(x.period, 20), kind: KD.includes(x.kind) ? x.kind : 'commercial', match: arr(x.match).map((m) => m.toLowerCase()), not: arr(x.not), note: s(x.note, 300), source: s(x.source, 120), manual: !!x.manual, ok: !!x.ok, files: Math.max(0, Math.round(Number(x.files) || 0)), date: /^\d{4}-\d{2}-\d{2}$/.test(String(x.date || '')) ? x.date : '' })).filter((x) => x.name),
    board: (Array.isArray(raw.board) ? raw.board : []).slice(0, 2000).map((b) => ({ date: /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || '')) ? b.date : '', who: s(b.who, 60), task: s(b.task, 120), client: s(b.client, 80), type: s(b.type, 40), via: s(b.via, 30), done: !!b.done, mine: !!b.mine })) };
}
// one model from both files: register items carry the mail threads that match them; the other threads stand alone
const projKey = (s) => String(s || '').replace(/^\s*((re|fw|fwd)\s*:|رد\s*:|إعادة توجيه\s*:)\s*/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();
function projectsModel() {
  const rows = [], mail = (myProjects && myProjects.projects) || [], ed = (myRegister && myRegister.mail) || {};
  const lc = (x) => (x || '').toLowerCase(), taken = new Set();
  const live = mail.map((p) => ({ p, k: projKey(p.project) })).filter((x) => !(ed[x.k] && ed[x.k].hide));
  for (const it of (myRegister ? myRegister.items : [])) {
    const th = live.filter((x) => !taken.has(x.k) && ((ed[x.k] && ed[x.k].item === it.id) || (!(ed[x.k] && ed[x.k].item) && it.match.some((w) => lc(x.p.project).includes(w)) && !it.not.some((w) => lc(x.p.project).includes(w.toLowerCase())))));
    th.forEach((x) => taken.add(x.k));
    rows.push({ id: `i:${it.id}`, item: it, ok: it.ok, files: it.files || 0, name: it.name, client: it.client, line: it.line, status: it.status, kind: it.kind, value: it.value, period: it.period || (it.date || '').slice(0, 4), date: it.date, note: it.note, source: it.source, manual: it.manual, threads: th.map((x) => x.p), deck: true });
  }
  for (const x of live) if (!taken.has(x.k)) { const p = x.p, e2 = ed[x.k] || {}; rows.push({ id: `m:${x.k}`, key: x.k, ok: !!e2.ok, files: 0, name: e2.name || p.project, client: '', status: e2.status || (p.kraasa ? 'studied' : p.worked ? 'worked' : 'seen'), kind: p.kraasa ? 'tender' : '', value: 0, period: '', threads: [p], deck: false, tender: p.tender }); }
  for (const r of rows) { const t2 = r.threads; r.first = t2.map((p) => p.first).filter(Boolean).sort()[0] || r.date || ''; r.last = t2.map((p) => p.last).filter(Boolean).sort().pop() || r.date || '';
    r.messages = t2.reduce((x, p) => x + p.messages, 0); r.me = t2.reduce((x, p) => x + p.me, 0); r.akram = t2.reduce((x, p) => x + p.akram, 0); r.shaarawi = t2.reduce((x, p) => x + p.shaarawi, 0);
    r.worked = t2.some((p) => p.worked) || (r.manual && r.status !== 'seen'); r.aibrahim = t2.some((p) => p.aibrahim); r.kraasa = t2.some((p) => p.kraasa); r.rules = [...new Set(t2.flatMap((p) => (p.rules || '').split(',')).filter(Boolean))].sort().join(','); }
  return rows;
}
const PROJ_RANK = { delivered: 7, ongoing: 6, won: 5, lost: 4, submitted: 3, studied: 2, worked: 1, seen: 0 };
const WONISH = ['won', 'ongoing', 'delivered'], BIDISH = ['submitted', 'won', 'ongoing', 'delivered', 'lost'];
const regEnsure = () => { if (!myRegister) myRegister = { schema: 'afaqy-projects-register/v1', asOf: new Date().toISOString().slice(0, 10), sources: [], h1: {}, items: [], board: [], mail: {} }; if (!myRegister.mail) myRegister.mail = {}; return myRegister; };
const projSave = async () => { await store.putRegister(myRegister); projRefresh(); };
function projWorkspaceBody() {
  const up = el('input', { type: 'file', accept: '.json,application/json,.xlsx', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; e.target.value = '';
    if (/\.xlsx$/i.test(f.name)) { await projXlsxImport(f); return; }
    try { const j = JSON.parse(await f.text());
      if (j && j.schema === 'afaqy-projects-register/v1') { const r = cleanRegister(j); if (!r) throw 0;
        if (myRegister) { const have = new Set(myRegister.items.map((x) => x.id)); for (const x of r.items) if (!have.has(x.id)) myRegister.items.push(x); myRegister.board = r.board; myRegister.h1 = r.h1; myRegister.sources = r.sources; myRegister.asOf = r.asOf; }
        else myRegister = r;
        await store.putRegister(myRegister); toast(t('proj_reg_loaded', { n: myRegister.items.length, b: myRegister.board.length })); }
      else { const p = cleanProjects(j); if (!p) { toast(t('proj_bad')); return; }
        if (myProjects) { const have = new Map(myProjects.projects.map((x) => [projKey(x.project), x])); let added = 0;
          for (const x of p.projects) { const k = projKey(x.project), o = have.get(k);
            if (!o) { myProjects.projects.push(x); have.set(k, x); added++; }
            else { o.first = [o.first, x.first].filter(Boolean).sort()[0] || ''; o.last = [o.last, x.last].filter(Boolean).sort().pop() || ''; for (const f2 of ['messages', 'me', 'akram', 'shaarawi']) o[f2] = Math.max(o[f2], x[f2]); o.worked = o.worked || x.worked; o.aibrahim = o.aibrahim || x.aibrahim; o.kraasa = o.kraasa || x.kraasa; } }
          const sk = new Set(myProjects.skipped.map((x) => x.subject)); for (const x of p.skipped) if (!sk.has(x.subject)) myProjects.skipped.push(x);
          myProjects.to = [myProjects.to, p.to].sort().pop(); myProjects.importedAt = p.importedAt; toast(t('proj_merged', { n: added })); }
        else { myProjects = p; toast(t('proj_loaded', { n: p.projects.length })); }
        await store.putProjects(myProjects); }
      projRefresh(); } catch { toast(t('err_json')); } } });
  const head = el('div', { class: 'row', style: 'justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px' }, el('h2', { style: 'margin:0' }, t('proj_h'), helpQ('help_proj')),
    el('div', { class: 'row proj-actions' }, el('button', { type: 'button', class: 'btn primary tiny', text: `＋ ${t('proj_add')}`, onclick: () => projEdit(null) }),
      el('button', { type: 'button', class: 'btn tiny', text: `⇩ ${t('proj_pull')}`, onclick: projPrompt }), el('button', { type: 'button', class: 'btn tiny', text: `⬇ ${t('proj_excel')}`, onclick: projXlsx }),
      el('button', { type: 'button', class: 'btn tiny', text: `🖨 ${t('proj_pdf')}`, onclick: projReport }), el('button', { type: 'button', class: 'btn quiet tiny', text: t('proj_import_any'), onclick: () => up.click() }), up));
  if (!myProjects && !myRegister) return el('section', { class: 'proj' }, head, el('div', { class: 'empty', text: t('proj_none') }));
  const year = ((myProjects && myProjects.to) || (myRegister && myRegister.asOf) || '2026').slice(0, 4), y0 = `${year}-01-01`;
  const all = projectsModel(), inYear = (r) => (r.deck ? ((r.period || '').includes(year) || (r.date || '') >= y0) : (r.last || '') >= y0), scope = all.filter((r) => projAll || inYear(r));
  const sar = (v) => `${Math.round(v).toLocaleString('en-US')} ${t('sar')}`, sumV = (l) => l.reduce((x, r) => x + r.value, 0);
  const tabs = el('div', { class: 'pills proj-pages' }, [['mail', 'proj_p_mail'], ['bids', 'proj_p_bids'], ['summary', 'proj_p_summary'], ['clients', 'proj_v_clients']].map(([k, l]) =>
    el('button', { type: 'button', class: `pill-btn${projView === k ? ' on' : ''}`, text: t(l), onclick: () => { projView = k; projRefresh(); } })));
  const period = el('div', { class: 'pills' }, el('button', { type: 'button', class: `pill-btn${projAll ? '' : ' on'}`, text: t('proj_year', { y: year }), onclick: () => { projAll = false; projRefresh(); } }),
    el('button', { type: 'button', class: `pill-btn${projAll ? ' on' : ''}`, text: t('proj_all'), onclick: () => { projAll = true; projRefresh(); } }));
  const search = (ph) => el('input', { type: 'search', class: 'proj-q', placeholder: ph, value: projQuery, oninput: (e) => { projQuery = e.target.value; clearTimeout(projWorkspaceBody.t); projWorkspaceBody.t = setTimeout(projRefresh, 300); } });
  const q = (r) => !projQuery || `${r.name} ${r.client} ${r.tender || ''} ${r.threads.map((p) => p.project).join(' ')}`.toLowerCase().includes(projQuery.toLowerCase());
  const pill = (st) => el('span', { class: `st-pill st-${st}`, text: t(`proj_f_${st}`) });
  const acts = (r, { attach = false } = {}) => el('td', { class: 'row-acts' },
    el('button', { type: 'button', class: `icon-btn${r.ok ? ' on' : ''}`, title: t('proj_ok'), text: '✓', onclick: () => projToggleOk(r) }),
    el('button', { type: 'button', class: 'icon-btn', title: t('proj_edit'), text: '✎', onclick: () => projEdit(r) }),
    el('button', { type: 'button', class: 'icon-btn', title: t('proj_files'), text: r.files ? `📎${r.files}` : '📎', onclick: () => projFiles(r) }),
    attach ? el('button', { type: 'button', class: 'icon-btn', title: t('proj_attach'), text: '🔗', onclick: () => projAttach(r) }) : null,
    el('button', { type: 'button', class: 'icon-btn', title: t('proj_delete'), text: '✕', onclick: () => projDelete(r) }));
  const ordered = (rows, key) => { const ids = sortByOrder(rows.map((r) => r.id), key); const pos = new Map(ids.map((id, n) => [id, n])); return [...rows].sort((x, y) => pos.get(x.id) - pos.get(y.id)); };
  let page;
  if (projView === 'mail') {
    // page 1 — every project thread from the mail, each in its row, with the project it belongs to
    const rows = [];
    for (const r of scope) for (const p of r.threads) rows.push({ r, p });
    const shown = rows.filter(({ r, p }) => (!projOnlyMine || p.worked) && (!projQuery || `${r.name} ${p.project}`.toLowerCase().includes(projQuery.toLowerCase())))
      .sort((x, y) => (y.p.last || '').localeCompare(x.p.last || ''));
    page = el('div', {},
      el('p', { class: 'hint', text: t('proj_p_mail_hint', { n: rows.length, w: rows.filter((x) => x.p.worked).length, ok: rows.filter((x) => x.r.ok).length }) }),
      el('div', { class: 'row proj-tools' }, el('button', { type: 'button', class: `pill-btn${projOnlyMine ? ' on' : ''}`, text: t('proj_only_mine'), onclick: () => { projOnlyMine = !projOnlyMine; projRefresh(); } }), search(t('proj_find'))),
      el('div', { class: 'table-wrap fit' }, el('table', { class: 'proj-tbl' }, el('colgroup', {}, ['28%', '13%', '10%', '9%', '7%', '10%', '13%', '10%'].map((w) => el('col', { style: `width:${w}` }))), el('thead', {}, el('tr', {}, ['proj_c_subject', 'proj_c_belongs', 'proj_c_status', 'proj_c_last', 'proj_c_msgs', 'proj_c_who', 'proj_c_why', ''].map((k, n) => el('th', { class: n === 4 ? 'num' : null, text: k ? t(k) : '' })))),
        el('tbody', {}, shown.map(({ r, p }) => el('tr', { class: `${p.worked ? 'worked' : ''}${r.ok ? ' ok' : ''}` },
          el('td', {}, el('div', { text: r.deck ? p.project : r.name }), r.deck || r.name === p.project ? null : el('div', { class: 'hint', text: p.project })),
          el('td', { text: r.deck ? r.name : '—' }), el('td', {}, pill(r.status)), el('td', { class: 'ltr', text: p.last || '—' }), el('td', { class: 'num', text: String(p.messages) }),
          el('td', { text: [p.me && t('proj_who_me', { n: p.me }), p.akram && t('proj_who_akram', { n: p.akram }), p.shaarawi && t('proj_who_shaarawi', { n: p.shaarawi })].filter(Boolean).join(' · ') || '—' }),
          el('td', { text: projWhy({ ...r, deck: false, manual: false, aibrahim: p.aibrahim, kraasa: p.kraasa, rules: p.rules }) }), acts(r, { attach: !r.deck })))))),
      myProjects && myProjects.skipped.length ? el('details', { class: 'tucked' }, el('summary', { text: t('proj_skipped', { n: myProjects.skipped.length }) }),
        el('ul', { class: 'proj-skip' }, myProjects.skipped.map((x) => el('li', {}, el('b', { text: x.subject }), el('span', { class: 'hint', text: ` — ${x.reason}` }))))) : null);
  } else if (projView === 'bids') {
    // page 2 — what we bid on, with the money, in two groups: clients and large projects & tenders
    const bids = scope.filter((r) => BIDISH.includes(r.status) && q(r));
    const group = (key, label, list) => el('section', { class: 'bid-group' },
      el('div', { class: 'bg-head' }, el('h3', { text: label }), el('span', { class: 'hint', text: t('proj_bg_tot', { n: list.length, v: sar(sumV(list)), w: list.filter((r) => WONISH.includes(r.status)).length }) })),
      list.length ? el('div', { class: 'table-wrap fit' }, el('table', { class: 'proj-tbl' }, el('colgroup', {}, ['28%', '15%', '11%', '10%', '9%', '17%', '10%'].map((w) => el('col', { style: `width:${w}` }))), el('thead', {}, el('tr', {}, ['proj_c_name', 'proj_c_client', 'proj_c_status', 'proj_c_value', 'proj_c_date', 'proj_c_note', ''].map((k, n) => el('th', { class: n === 3 ? 'num' : null, text: k ? t(k) : '' })))),
        makeSortable(el('tbody', {}, ordered(list, key).map((r) => el('tr', { 'data-id': r.id, class: r.ok ? 'ok' : null },
          el('td', {}, el('div', { text: r.name }), el('div', { class: 'hint', text: [r.line, r.threads.length ? t('proj_threads', { n: r.threads.length }) : '', r.source && !r.manual ? r.source.replace(/^.*— /, '') : ''].filter(Boolean).join(' · ') })),
          el('td', { text: r.client && r.client !== r.name ? r.client : '—' }), el('td', {}, pill(r.status)), el('td', { class: 'num', text: r.value ? r.value.toLocaleString('en-US') : '—' }),
          el('td', { class: 'ltr', text: r.date || r.period || r.last || '—' }), el('td', { class: 'note-c', text: r.note || '' }), acts(r)))), key))) : el('div', { class: 'empty', text: t('proj_bg_none') }));
    page = el('div', {}, el('div', { class: 'row proj-tools' }, el('div', { class: 'pills' }, [['', 'proj_st_all'], ['submitted', 'proj_f_submitted'], ['won', 'proj_f_won'], ['ongoing', 'proj_f_ongoing'], ['delivered', 'proj_f_delivered'], ['lost', 'proj_f_lost']].map(([k, l]) =>
        el('button', { type: 'button', class: `pill-btn${projStatus === k ? ' on' : ''}`, text: t(l), onclick: () => { projStatus = k; projRefresh(); } }))), search(t('proj_find'))),
      group('bids-c', t('proj_g_clients'), bids.filter((r) => r.kind === 'commercial' && (!projStatus || r.status === projStatus))),
      group('bids-p', t('proj_g_big'), bids.filter((r) => r.kind !== 'commercial' && (!projStatus || r.status === projStatus))));
  } else if (projView === 'clients') {
    const board = myRegister ? myRegister.board : [], map = new Map();
    for (const b of board) { if (!b.client) continue; const c = map.get(b.client) || { client: b.client, n: 0, types: new Set(), last: '' }; c.n++; c.types.add(b.type); if (b.date > c.last) c.last = b.date; map.set(b.client, c); }
    const statusOf = (c) => { const lc = c.toLowerCase(); const it = all.filter((r) => r.deck && r.client && (lc.includes(r.client.toLowerCase()) || r.client.toLowerCase().includes(lc))); return it.length ? it.sort((x, y) => PROJ_RANK[y.status] - PROJ_RANK[x.status])[0].status : ''; };
    let list = [...map.values()].map((c) => ({ ...c, st: statusOf(c.client) })).filter((c) => !projQuery || c.client.toLowerCase().includes(projQuery.toLowerCase()));
    list.sort((x, y) => (PROJ_RANK[y.st] || 0) - (PROJ_RANK[x.st] || 0) || y.n - x.n); let cp;
    page = board.length ? el('div', {}, search(t('proj_find_client')),
      el('div', { class: 'table-wrap fit' }, el('table', { class: 'proj-tbl' }, el('colgroup', {}, ['34%', '14%', '9%', '31%', '12%'].map((w) => el('col', { style: `width:${w}` }))), el('thead', {}, el('tr', {}, ['proj_c_client', 'proj_c_status', 'proj_c_req', 'proj_c_types', 'proj_c_last'].map((k, n) => el('th', { class: n === 2 ? 'num' : null, text: t(k) })))),
        (cp = pagedBody(list, (c) => el('tr', {}, el('td', { text: c.client }), el('td', {}, c.st ? pill(c.st) : '—'), el('td', { class: 'num', text: String(c.n) }), el('td', { text: [...c.types].join(' · ') }), el('td', { class: 'ltr', text: c.last || '—' })))).tbody)), cp.more) : el('div', { class: 'empty', text: t('proj_need_reg') });
  } else {
    // page 3 — where I stand: bid, won, with us now, delivered, lost — counts and money, each opens its projects
    const bid = scope.filter((r) => BIDISH.includes(r.status)), by = (st) => scope.filter((r) => r.status === st), wonAll = scope.filter((r) => WONISH.includes(r.status));
    const decided = wonAll.length + by('lost').length, h1 = (myRegister && myRegister.h1) || {}, target = h1.yearTarget || 0;
    const tile = (k, list, cls = '') => el('button', { type: 'button', class: `sm-tile ${cls}`, onclick: () => projDetail(k, scope) }, el('span', { text: t(k === 'bid' ? 'proj_s_bid' : k === 'wonall' ? 'proj_s_won' : `proj_f_${k}`) }), el('b', { text: String(list.length) }), el('small', { text: list.some((r) => r.value) ? sar(sumV(list)) : '' }));
    const split = (kindTest) => { const l = bid.filter(kindTest); return [l.length, l.filter((r) => WONISH.includes(r.status)).length, sumV(l.filter((r) => WONISH.includes(r.status)))]; };
    const [cN, cW, cV] = split((r) => r.kind === 'commercial'), [pN, pW, pV] = split((r) => r.kind !== 'commercial');
    page = el('div', {},
      el('div', { class: 'sm-grid' }, tile('bid', bid, 'big'), tile('wonall', wonAll, 'won'), tile('ongoing', by('ongoing')), tile('delivered', by('delivered')), tile('submitted', by('submitted')), tile('lost', by('lost'), 'lost')),
      el('div', { class: 'sm-row' },
        el('div', { class: 'sm-card' }, el('span', { text: t('proj_s_rate') }), el('b', { text: decided ? `${Math.round((wonAll.length / decided) * 100)}%` : '—' }), el('small', { text: t('proj_s_rate_n', { w: wonAll.length, d: decided }) })),
        el('div', { class: 'sm-card' }, el('span', { text: t('proj_s_worked') }), el('b', { text: String(scope.filter((r) => r.worked).length) }), el('small', { text: t('proj_f_threads', { n: scope.reduce((x, r) => x + r.threads.filter((p) => p.worked).length, 0) }) })),
        el('div', { class: 'sm-card' }, el('span', { text: t('proj_f_studied') }), el('b', { text: String(scope.filter((r) => r.kraasa || r.status === 'studied').length) }), el('small', { text: t('proj_f_mailsrc') }))),
      target ? el('div', { class: 'team-goal' }, el('div', { class: 'tg-row' }, el('span', { text: t('proj_v_goal') }), el('b', { text: `${sar(sumV(wonAll))} / ${sar(target)} · ${Math.round((sumV(wonAll) / target) * 100)}%` })), el('i', {}, el('b', { style: `width:${Math.min(100, Math.round((sumV(wonAll) / target) * 100))}%` }))) : null,
      el('table', { class: 'proj-tbl sm-split' }, el('thead', {}, el('tr', {}, ['', 'proj_s_c_bid', 'proj_s_c_won', 'proj_s_c_val'].map((k) => el('th', { text: k ? t(k) : '' })))),
        el('tbody', {}, el('tr', {}, el('td', { text: t('proj_g_clients') }), el('td', { text: String(cN) }), el('td', { text: String(cW) }), el('td', { class: 'num', text: sar(cV) })),
          el('tr', {}, el('td', { text: t('proj_g_big') }), el('td', { text: String(pN) }), el('td', { text: String(pW) }), el('td', { class: 'num', text: sar(pV) })),
          el('tr', { class: 'tot' }, el('td', { text: t('proj_s_total') }), el('td', { text: String(cN + pN) }), el('td', { text: String(cW + pW) }), el('td', { class: 'num', text: sar(cV + pV) })))),
      el('p', { class: 'hint', text: t('proj_s_note') }));
  }
  const src = el('p', { class: 'hint' }, [myRegister ? t('proj_src_reg', { d: myRegister.asOf, n: myRegister.items.length, b: myRegister.board.length }) : t('proj_src_noreg'), myProjects ? ` · ${t('proj_src', { from: myProjects.from, to: myProjects.to, d: myProjects.importedAt })}` : ` · ${t('proj_src_nomail')}`].join(''));
  return el('section', { class: 'proj' }, head, src, el('div', { class: 'row proj-tools' }, tabs, period), page);
}
async function projFilesExport() {
  const out = {}; for (const it of (myRegister ? myRegister.items : [])) { if (!it.files) continue; const files = (await store.kvGet(`pf:${it.id}`)) || [];
    out[it.id] = await Promise.all(files.map((f) => new Promise((res) => { const fr = new FileReader(); fr.onload = () => res({ name: f.name, type: f.type, size: f.size, kind: f.kind, at: f.at, data: fr.result }); fr.onerror = () => res(null); fr.readAsDataURL(f.blob); }))).then((l) => l.filter(Boolean)); }
  return out;
}
async function projFilesImport(map) {
  for (const [id, list] of Object.entries(map)) { if (!Array.isArray(list) || (await store.kvGet(`pf:${id}`))) continue;
    const files = []; for (const f of list.slice(0, 50)) { try { const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(String(f.data)); if (!m) continue; const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]); const u8 = new Uint8Array(bin.length); for (let q = 0; q < bin.length; q++) u8[q] = bin.charCodeAt(q); const blob = new Blob([u8], { type: m[1] || 'application/octet-stream' }); files.push({ name: String(f.name).slice(0, 160), type: String(f.type || blob.type), size: blob.size, kind: ['technical', 'financial', 'photo', 'other'].includes(f.kind) ? f.kind : 'other', at: String(f.at || '').slice(0, 10), blob }); } catch { /* skip a broken file */ } }
    if (files.length) await store.kvPut(`pf:${id}`, files); }
}
async function projToggleOk(r) {
  const R = regEnsure(); if (r.item) r.item.ok = !r.item.ok; else if (r.key) R.mail[r.key] = { ...(R.mail[r.key] || {}), ok: !r.ok };
  await projSave();
}
// files on a project: technical and financial offers, photos — kept on this device, in the full backup
async function projFiles(r) {
  let it = r.item;
  if (!it) { const R = regEnsure(), id = `U${Date.now().toString(36)}`; it = { id, name: r.name, client: '', line: '', kind: 'commercial', status: r.status === 'seen' ? 'worked' : r.status, value: 0, date: r.last || '', period: (r.last || '').slice(0, 4), note: '', match: [], not: [], source: t('proj_why_manual'), manual: true, ok: r.ok, files: 0 };
    R.items.push(it); if (r.key) R.mail[r.key] = { ...(R.mail[r.key] || {}), item: id }; await store.putRegister(R); }
  const key = `pf:${it.id}`; let files = (await store.kvGet(key)) || [];
  const dlg = el('dialog', { class: 'proj-edit' }); const list = el('div', { class: 'pf-list' });
  const save = async () => { await store.kvPut(key, files.length ? files : null); it.files = files.length; await store.putRegister(myRegister); paint(); projRefresh(); };
  const paint = () => set(list, files.length ? files.map((f, n) => el('div', { class: 'pf-item' },
    f.type.startsWith('image/') ? el('img', { src: URL.createObjectURL(f.blob), alt: f.name }) : el('span', { class: 'pf-ico', text: /pdf/.test(f.type) ? 'PDF' : /sheet|excel/.test(f.type) ? 'XLS' : /word/.test(f.type) ? 'DOC' : /presentation|powerpoint/.test(f.type) ? 'PPT' : 'FILE' }),
    el('div', { class: 'pf-meta' }, el('b', { text: f.name }), el('span', { class: 'hint', text: `${t(`proj_fk_${f.kind}`)} · ${Math.max(1, Math.round(f.size / 1024)).toLocaleString('en-US')} KB · ${f.at}` })),
    el('a', { class: 'icon-btn', href: URL.createObjectURL(f.blob), download: f.name, text: '⬇', title: t('proj_f_dl') }),
    el('button', { type: 'button', class: 'icon-btn', text: '✕', title: t('proj_delete'), onclick: async () => { if (!confirm(t('proj_f_del_q', { n: f.name }))) return; files.splice(n, 1); await save(); } }))) : el('div', { class: 'empty', text: t('proj_f_none') }));
  let kind = 'technical';
  const pick = el('input', { type: 'file', multiple: '', hidden: true, onchange: async (e) => { for (const f of e.target.files) { if (f.size > 25 * 1024 * 1024) { toast(t('proj_f_big', { n: f.name })); continue; } files.push({ name: f.name.slice(0, 160), type: f.type || 'application/octet-stream', size: f.size, kind, at: new Date().toISOString().slice(0, 10), blob: f }); } e.target.value = ''; await save(); toast(t('proj_saved')); } });
  dlg.append(el('h2', { text: t('proj_files_h') }), el('p', { class: 'hint', text: it.name }),
    el('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, ['technical', 'financial', 'photo', 'other'].map((k) => el('button', { type: 'button', class: 'btn tiny', text: `＋ ${t(`proj_fk_${k}`)}`, onclick: () => { kind = k; pick.accept = k === 'photo' ? 'image/*' : ''; pick.click(); } })), pick),
    list, el('p', { class: 'hint', text: t('proj_f_note') }), el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn quiet', text: t('close'), onclick: () => dlg.close() })));
  paint(); dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
// Excel: four sheets (from mail, bids — clients, bids — large projects, summary); edit it and import it back by its ID column
async function loadXlsx() {
  if (window.XLSX) return window.XLSX;
  await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = res; s.onerror = rej; document.head.append(s); });
  return window.XLSX;
}
async function projXlsx() {
  let X; try { X = await loadXlsx(); } catch { toast(t('proj_x_fail')); projCsv(projectsModel()); return; }
  const rows = projectsModel(), wb = X.utils.book_new(), st = (s) => t(`proj_f_${s}`);
  const mail = []; for (const r of rows) for (const p of r.threads) mail.push({ ID: r.id, [t('proj_c_subject')]: p.project, [t('proj_c_name')]: r.name, [t('proj_c_status')]: st(r.status), [t('proj_c_first')]: p.first, [t('proj_c_last')]: p.last, [t('proj_c_msgs')]: p.messages, [t('proj_c_me')]: p.me, [t('proj_c_akram')]: p.akram, [t('proj_c_shaarawi')]: p.shaarawi, [t('proj_c_why')]: projWhy({ aibrahim: p.aibrahim, kraasa: p.kraasa, rules: p.rules }), [t('proj_ok')]: r.ok ? '✓' : '' });
  const bidRow = (r) => ({ ID: r.id, [t('proj_c_name')]: r.name, [t('proj_c_client')]: r.client, [t('proj_c_status')]: st(r.status), [t('proj_c_value')]: r.value || 0, [t('proj_c_date')]: r.date || '', [t('proj_c_period')]: r.period || '', [t('proj_c_line')]: r.line || '', [t('proj_c_note')]: r.note || '', [t('proj_c_threads')]: r.threads.length, [t('proj_files')]: r.files || 0, [t('proj_ok')]: r.ok ? '✓' : '' });
  const bids = rows.filter((r) => BIDISH.includes(r.status));
  const add = (data, name) => { const ws = X.utils.json_to_sheet(data.length ? data : [{ ID: '' }]); ws['!cols'] = Object.keys(data[0] || { ID: 1 }).map((k) => ({ wch: k === 'ID' ? 8 : Math.min(60, Math.max(12, ...data.map((d) => String(d[k] ?? '').length))) })); ws['!views'] = [{ RTL: lang !== 'en' }]; X.utils.book_append_sheet(wb, ws, name.slice(0, 31)); };
  add(mail, t('proj_p_mail')); add(bids.filter((r) => r.kind === 'commercial').map(bidRow), `${t('proj_p_bids')} — ${t('proj_g_clients_s')}`); add(bids.filter((r) => r.kind !== 'commercial').map(bidRow), `${t('proj_p_bids')} — ${t('proj_g_big_s')}`);
  const cnt = (f) => rows.filter(f).length, val = (f) => rows.filter(f).reduce((x, r) => x + r.value, 0);
  add([['proj_s_bid', (r) => BIDISH.includes(r.status)], ['proj_s_won', (r) => WONISH.includes(r.status)], ['proj_f_ongoing', (r) => r.status === 'ongoing'], ['proj_f_delivered', (r) => r.status === 'delivered'], ['proj_f_submitted', (r) => r.status === 'submitted'], ['proj_f_lost', (r) => r.status === 'lost'], ['proj_s_worked', (r) => r.worked]]
    .map(([k, f]) => ({ [t('proj_c_item')]: t(k), [t('proj_c_count')]: cnt(f), [t('proj_c_value')]: val(f) })), t('proj_p_summary'));
  X.writeFile(wb, `AFAQY-projects-${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast(t('proj_x_done'));
}
async function projXlsxImport(file) {
  let X; try { X = await loadXlsx(); } catch { toast(t('proj_x_fail')); return; }
  const wb = X.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' }), R = regEnsure(), stOf = new Map(Object.keys(PROJ_RANK).map((s) => [t(`proj_f_${s}`), s]));
  let n = 0, del = 0; const seen = new Set();
  for (const name of wb.SheetNames.slice(0, 3)) for (const row of X.utils.sheet_to_json(wb.Sheets[name], { defval: '' })) {
    const id = String(row.ID || ''); if (!id || seen.has(id)) continue; seen.add(id);
    const g = (k) => row[t(k)];
    if (String(g('proj_c_status') || '').trim() === t('proj_x_delete')) { const r = projectsModel().find((x) => x.id === id); if (r) { if (r.item) R.items = R.items.filter((x) => x.id !== r.item.id); else if (r.key) R.mail[r.key] = { hide: true }; del++; } continue; }
    if (id.startsWith('i:')) { const it = R.items.find((x) => `i:${x.id}` === id); if (!it) continue;
      const nm = g('proj_c_name'), cl = g('proj_c_client'), s2 = stOf.get(String(g('proj_c_status') || '').trim()), v = Number(g('proj_c_value')), nt = g('proj_c_note'), dt = String(g('proj_c_date') || '');
      if (nm) it.name = String(nm).slice(0, 160); if (cl !== undefined) it.client = String(cl).slice(0, 120); if (s2) it.status = s2; if (!Number.isNaN(v) && g('proj_c_value') !== undefined) it.value = Math.max(0, Math.round(v));
      if (nt !== undefined) it.note = String(nt).slice(0, 300); if (/^\d{4}-\d{2}-\d{2}$/.test(dt)) it.date = dt; it.ok = String(g('proj_ok') || '').trim() === '✓'; n++; }
    else if (id.startsWith('m:')) { const k = id.slice(2), nm = g('proj_c_name'), s2 = stOf.get(String(g('proj_c_status') || '').trim());
      R.mail[k] = { ...(R.mail[k] || {}), ...(nm ? { name: String(nm).slice(0, 160) } : {}), ...(['worked', 'studied', 'seen'].includes(s2) ? { status: s2 } : {}), ok: String(g('proj_ok') || '').trim() === '✓' }; n++; } }
  await store.putRegister(R); toast(t('proj_x_imported', { n, d: del })); projRefresh();
}

function projWhy(r) {
  return [r.manual && t('proj_why_manual'), r.deck && !r.manual && t('proj_why_deck'), r.aibrahim && t('proj_why_ai'), r.kraasa && t('proj_why_kraasa'), (r.rules || '').includes('R2') && t('proj_why_subject')].filter(Boolean).join(' · ') || '—';
}
function projCsv(rows) {
  const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const cols = ['proj_c_name', 'proj_c_client', 'proj_c_status', 'proj_c_kind', 'proj_c_value', 'proj_c_period', 'proj_c_note', 'proj_c_src', 'proj_c_why', 'proj_c_subjects', 'proj_c_first', 'proj_c_last', 'proj_c_msgs', 'proj_c_me', 'proj_c_akram', 'proj_c_shaarawi'];
  const lines = [cols.map((k) => t(k)), ...rows.map((r) => [r.name, r.client, t(`proj_f_${r.status}`), r.kind ? t(`proj_k_${r.kind}`) : '', r.value || '', r.period, r.note || '', r.manual ? t('proj_why_manual') : r.deck ? r.source : t('proj_src_mail'), projWhy(r), r.threads.map((p) => p.project).join(' | '), r.first, r.last, r.messages, r.me, r.akram, r.shaarawi])];
  const a2 = el('a', { href: URL.createObjectURL(new Blob(['\ufeff' + lines.map((l) => l.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })), download: `AFAQY-projects-${new Date().toISOString().slice(0, 10)}.csv` }); document.body.append(a2); a2.click(); a2.remove();
}
// the card on «أنا»: the headline numbers — the whole workspace opens in its own layer
function projectsCard() {
  const rows = (myProjects || myRegister) ? projectsModel() : [], won = rows.filter((r) => WONISH.includes(r.status));
  const n = (st) => rows.filter((r) => r.status === st).length;
  return el('button', { type: 'button', class: 'proj-card', onclick: projOpen },
    el('div', { class: 'pc-head' }, el('b', { text: t('proj_h') }), el('span', { class: 'pc-open', text: `${t('proj_open')} ↗` })),
    rows.length ? el('div', { class: 'pc-nums' }, [['proj_s_worked', rows.filter((r) => r.worked).length], ['proj_s_bid', rows.filter((r) => BIDISH.includes(r.status)).length], ['proj_s_won', rows.filter((r) => WONISH.includes(r.status)).length], ['proj_f_ongoing', n('ongoing')]].map(([k, v]) => el('div', {}, el('b', { text: String(v) }), el('span', { text: t(k) }))),
      el('div', { class: 'pc-val' }, el('b', { text: won.reduce((x, r) => x + r.value, 0).toLocaleString('en-US') }), el('span', { text: `${t('sar')} · ${t('proj_v_won')}` })))
      : el('p', { class: 'hint', text: t('proj_card_empty') }));
}
// every window in the portal: a header bar with ✕ pinned at the top while its content scrolls (added once, when it opens)
{ const open = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal = function showModalWithBar() {
    if (!this.querySelector(':scope > .dlg-bar, :scope > .pl-top')) {
      const bar = el('div', { class: 'dlg-bar' }, el('button', { type: 'button', class: 'dlg-x', 'aria-label': t('close'), text: `✕ ${t('close')}`, onclick: () => this.close() }));
      this.prepend(bar);
    }
    // the ✕ is made once; its words follow the language each time the window opens (it kept the first language before)
    const x = this.querySelector(':scope > .dlg-bar .dlg-x'); if (x) { x.textContent = `✕ ${t('close')}`; x.setAttribute('aria-label', t('close')); }
    return open.call(this);
  }; }
function projOpen() {
  let dlg = $('proj-dlg'); if (!dlg) { dlg = el('dialog', { id: 'proj-dlg', class: 'proj-layer' }); document.body.append(dlg); dlg.addEventListener('close', () => renderMe()); }
  set(dlg, el('div', { class: 'pl-top' }, el('button', { type: 'button', class: 'btn quiet', text: `✕ ${t('close')}`, onclick: () => dlg.close() })), el('div', { class: 'pl-body' }, projWorkspaceBody()));
  if (!dlg.open) dlg.showModal();
}
function projRefresh() { const dlg = $('proj-dlg'); if (dlg && dlg.open) { const b = dlg.querySelector('.pl-body'); if (b) set(b, projWorkspaceBody()); } else renderMe(); }
// details as cards: click a funnel step or a value and see each project behind it
function projDetail(k, scope) {
  const list = scope.filter((r) => (k === 'bid' ? BIDISH.includes(r.status) : k === 'wonall' ? WONISH.includes(r.status) : k === 'worked' ? r.worked : k === 'studied' ? (r.kraasa || r.status === 'studied') : k === 'submitted' ? PROJ_RANK[r.status] >= 3 : k === 'commercial' ? r.status === 'submitted' && r.kind === 'commercial' : k === 'tender' ? r.status === 'submitted' && r.kind === 'tender' : r.status === k))
    .sort((x, y) => y.value - x.value || (y.last || '').localeCompare(x.last || ''));
  const dlg = el('dialog', { class: 'proj-detail' });
  dlg.append(el('div', { class: 'row', style: 'justify-content:space-between;align-items:center' }, el('h2', { style: 'margin:0', text: `${t(k === 'commercial' ? 'proj_v_com' : k === 'tender' ? 'proj_v_ten' : k === 'bid' ? 'proj_s_bid' : k === 'wonall' ? 'proj_s_won' : `proj_f_${k}`)} — ${list.length}` })),
    el('div', { class: 'pd-grid' }, list.map((r) => el('button', { type: 'button', class: `pd-card st-b-${r.status}`, onclick: () => { dlg.close(); projEdit(r); } },
      el('span', { class: `st-pill st-${r.status}`, text: t(`proj_f_${r.status}`) }), el('b', { text: r.name }), r.client && r.client !== r.name ? el('span', { class: 'hint', text: r.client }) : null,
      r.value ? el('strong', { text: `${r.value.toLocaleString('en-US')} ${t('sar')}` }) : null,
      el('small', { class: 'hint', text: [r.last && `${t('proj_c_last')} ${r.last}`, r.messages && t('proj_msgs_n', { n: r.messages }), projWhy(r)].filter(Boolean).join(' · ') })))));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
// add or edit: a mail thread that gets edited becomes a project of its own, linked to that thread
function projEdit(r) {
  const it = r && r.item ? r.item : null;
  const f = { name: r ? r.name : '', client: r ? r.client || '' : '', line: it ? it.line : '', kind: r ? r.kind || 'commercial' : 'commercial', status: r ? (r.status === 'seen' ? 'worked' : r.status) : 'worked',
    value: r ? r.value || '' : '', date: it ? it.date || r.last || '' : r ? r.last || '' : new Date().toISOString().slice(0, 10), period: it ? it.period : '', note: it ? it.note : '', match: it ? it.match.join(', ') : '' };
  const inp = (k, type = 'text', extra = {}) => el('input', { type, value: f[k], ...extra, oninput: (e) => { f[k] = e.target.value; } });
  const sel = (k, opts) => el('select', { onchange: (e) => { f[k] = e.target.value; } }, opts.map(([v, l]) => el('option', { value: v, selected: f[k] === v ? '' : null, text: l })));
  const dlg = el('dialog', { class: 'proj-edit' });
  const save = async () => {
    if (!f.name.trim()) { toast(t('proj_need_name')); return; }
    const R = regEnsure(); const rec = { name: f.name.trim().slice(0, 160), client: f.client.trim().slice(0, 120), line: f.line.trim().slice(0, 60), kind: f.kind, status: f.status, value: Math.max(0, Math.round(Number(f.value) || 0)),
      date: /^\d{4}-\d{2}-\d{2}$/.test(f.date) ? f.date : '', period: f.period.trim().slice(0, 20) || (f.date || '').slice(0, 4), note: f.note.trim().slice(0, 300), match: f.match.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 12) };
    if (it) Object.assign(it, rec);
    else if (r && r.key && ['worked', 'studied'].includes(rec.status) && !rec.value && !rec.client) { R.mail[r.key] = { ...(R.mail[r.key] || {}), name: rec.name, status: rec.status }; }
    else { const id = `U${Date.now().toString(36)}`; R.items.push({ id, ...rec, not: [], source: t('proj_why_manual'), manual: true }); if (r && r.key) R.mail[r.key] = { item: id }; }
    dlg.close(); toast(t('proj_saved')); await projSave(); };
  dlg.append(el('h2', { text: r ? t('proj_edit_h') : t('proj_add_h') }),
    r && r.threads && r.threads.length ? el('p', { class: 'hint', text: t('proj_edit_threads', { n: r.threads.length, s: r.threads.slice(0, 2).map((p) => p.project).join(' | ') }) }) : null,
    el('div', { class: 'form-grid' },
      el('label', {}, el('span', { text: t('proj_c_name') }), inp('name')), el('label', {}, el('span', { text: t('proj_c_client') }), inp('client')),
      el('label', {}, el('span', { text: t('proj_c_status') }), sel('status', ['worked', 'studied', 'submitted', 'won', 'ongoing', 'delivered', 'lost'].map((s) => [s, t(`proj_f_${s}`)]))),
      el('label', {}, el('span', { text: t('proj_c_kind') }), sel('kind', ['project', 'commercial', 'tender'].map((s) => [s, t(`proj_k_${s}`)]))),
      el('label', {}, el('span', { text: t('proj_c_value') }), inp('value', 'number', { min: '0', step: '1' })), el('label', {}, el('span', { text: t('proj_c_date') }), inp('date', 'date')),
      el('label', {}, el('span', { text: t('proj_c_line') }), inp('line')), el('label', {}, el('span', { text: t('proj_c_period') }), inp('period', 'text', { placeholder: 'H2 2026' })),
      el('label', { class: 'wide' }, el('span', { text: t('proj_c_note') }), el('textarea', { rows: '2', oninput: (e) => { f.note = e.target.value; } }, f.note)),
      el('label', { class: 'wide' }, el('span', { text: t('proj_c_match') }), inp('match', 'text', { placeholder: t('proj_match_ph') }))),
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary', text: t('save'), onclick: save }), el('button', { type: 'button', class: 'btn quiet', text: t('cancel'), onclick: () => dlg.close() })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
async function projDelete(r) {
  if (!confirm(t('proj_delete_q', { n: r.name }))) return;
  const R = regEnsure();
  if (r.item) { R.items = R.items.filter((x) => x.id !== r.item.id); for (const [k, v] of Object.entries(R.mail)) if (v.item === r.item.id) delete R.mail[k]; }
  else if (r.key) R.mail[r.key] = { hide: true };
  toast(t('proj_deleted')); await projSave();
}
function projAttach(r) {
  const items = (myRegister ? myRegister.items : []); if (!items.length) { toast(t('proj_attach_none')); return; }
  const dlg = el('dialog', { class: 'proj-edit' }); let pick = items[0].id;
  dlg.append(el('h2', { text: t('proj_attach_h') }), el('p', { class: 'hint', text: r.name }),
    el('select', { onchange: (e) => { pick = e.target.value; } }, items.map((x) => el('option', { value: x.id, text: `${x.name}${x.client && x.client !== x.name ? ` — ${x.client}` : ''}` }))),
    el('div', { class: 'row', style: 'margin-top:12px' }, el('button', { type: 'button', class: 'btn primary', text: t('save'), onclick: async () => { regEnsure().mail[r.key] = { item: pick }; dlg.close(); toast(t('proj_saved')); await projSave(); } }),
      el('button', { type: 'button', class: 'btn quiet', text: t('cancel'), onclick: () => dlg.close() })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
// the prompt for Claude in Chrome — starts after the last pull and skips what is already here
function projPrompt() {
  const from = (myProjects && myProjects.to) || '2026-01-01', known = myProjects ? myProjects.projects.map((p) => projKey(p.project)) : [], skipped = myProjects ? myProjects.skipped.map((x) => projKey(x.subject)) : [];
  const text = `Open Outlook on the web (https://outlook.office.com) — I am signed in with my AFAQY account.
Goal: find NEW project conversations received or sent ON OR AFTER ${from} (up to today). Read only — do not send, reply, move, flag, delete or change read status.

A conversation is a PROJECT if ANY is true:
  R1. a message in it is from, to or cc a.ibrahim@afaqy.com
  R2. the subject contains: project, projects, tender, tenders, مشروع, المشروع, مشاريع, مناقصة, المناقصة, منافسة, المنافسة
  R3. it has an attachment whose file name contains: كراسة الشروط
worked_on = true if a message in it was sent by me, by Akram (AFAQY, display name Akram / أكرم) or by Mohamed Shaarawi (AFAQY, Shaarawi / شعراوي).

Search all folders (Sent Items and Archive included), scroll every result list to the end:
  participants:a.ibrahim@afaqy.com received>=${from}
  subject:<each keyword above> received>=${from}
  hasattachments:yes "كراسة الشروط" received>=${from}   and   attachmentnames:"كراسة الشروط"

ALREADY COLLECTED — skip any conversation whose subject (without RE:/FW:/رد:) is one of these:
${known.map((k) => `- ${k}`).join('\n') || '- (none)'}
Already set aside before — skip too:
${skipped.map((k) => `- ${k}`).join('\n') || '- (none)'}

Skip automated mail (no-reply, notifications, newsletters, calendar-only invites); list them under "skipped" with the reason.
Keep ONLY: subject, dates, counts — no body text, customer contacts, phone numbers, prices or attachments.

Save one JSON file named afaqy-projects-from-mail-<today YYYY-MM-DD>.json:
{ "schema": "afaqy-projects-from-mail/v1", "mailbox": "<my address>", "from": "${from}", "to": "<today>",
  "projects": [ { "project": "<subject without RE/FW>", "tender_no": "", "first_date": "YYYY-MM-DD", "last_date": "YYYY-MM-DD", "messages": 0,
                  "sent_by_me": 0, "sent_by_akram": 0, "sent_by_shaarawi": 0, "with_a_ibrahim": false, "has_kraasa": false, "matched_rules": "R1,R2", "worked_on": true } ],
  "skipped": [ { "subject": "...", "reason": "..." } ] }
If a search or folder failed, say exactly which one.`;
  const dlg = el('dialog', { class: 'proj-edit' }); const ta = el('textarea', { class: 'ltr', rows: '14', readonly: '' }); ta.value = text;
  dlg.append(el('h2', { text: t('proj_pull_h') }), el('p', { class: 'hint', text: t('proj_pull_hint', { from, n: known.length }) }), ta,
    el('div', { class: 'row', style: 'margin-top:10px' }, el('button', { type: 'button', class: 'btn primary', text: t('proj_copy'), onclick: async () => { try { await navigator.clipboard.writeText(text); toast(t('proj_copied')); } catch { ta.select(); } } }),
      el('a', { class: 'btn', href: 'https://outlook.office.com/mail/', target: '_blank', rel: 'noopener', text: t('proj_open_outlook') }), el('button', { type: 'button', class: 'btn quiet', text: t('close'), onclick: () => dlg.close() })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
// my projects report: AFAQY pages, each project in its place by status
function projReport() {
  const rows = projectsModel(), esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const logo = logoDataUrl(), rtl = lang !== 'en', fontUrl = (f) => new URL(`assets/fonts/${f}`, location.href).href, sum = (l) => l.reduce((x, r) => x + r.value, 0), f0 = (v) => v.toLocaleString('en-US');
  const by = (st) => rows.filter((r) => r.status === st).sort((x, y) => y.value - x.value || (y.last || '').localeCompare(x.last || ''));
  const groups = ['delivered', 'ongoing', 'won', 'submitted', 'lost', 'studied', 'worked'].map((st) => ({ st, list: by(st) })).filter((g) => g.list.length);
  const kpi = [['s_worked', rows.filter((r) => r.worked).length], ['s_bid', rows.filter((r) => BIDISH.includes(r.status)).length], ['s_won', rows.filter((r) => WONISH.includes(r.status)).length], ['f_delivered', by('delivered').length]];
  const table = (list) => `<table><thead><tr><th>${esc(t('proj_c_name'))}</th><th>${esc(t('proj_c_client'))}</th><th>${esc(t('proj_c_kind'))}</th><th>${esc(t('proj_c_value'))}</th><th>${esc(t('proj_c_last'))}</th><th>${esc(t('proj_c_why'))}</th></tr></thead><tbody>${list.map((r) => `<tr><td>${esc(r.name)}${r.note ? `<div class="n">${esc(r.note)}</div>` : ''}</td><td>${esc(r.client && r.client !== r.name ? r.client : '')}</td><td>${esc(r.kind ? t(`proj_k_${r.kind}`) : '')}</td><td class="v">${r.value ? f0(r.value) : '—'}</td><td class="d">${esc(r.last || '—')}</td><td>${esc(projWhy(r))}</td></tr>`).join('')}</tbody></table>`;
  const html = `<!doctype html><html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${esc(t('proj_pdf_title'))}</title><style>
  @font-face{font-family:NS;src:url('${fontUrl('NotoSansArabic-Regular.woff2')}')}@font-face{font-family:NS;font-weight:700;src:url('${fontUrl('NotoSansArabic-Bold.woff2')}')}
  body{margin:0;font-family:NS,'Segoe UI',Tahoma,sans-serif;color:#1C1E3D;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:14mm;page-break-after:always}
  header{display:flex;align-items:center;gap:14px;border-bottom:4px solid #2A7130;padding-bottom:10px;margin-bottom:14px}header img{height:34px}h1{font-size:22px;margin:0}h2{font-size:16px;margin:16px 0 8px;border-inline-start:5px solid #2A7130;padding-inline-start:8px}
  .k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.k div{background:#F1F5F8;border-radius:10px;padding:10px;border-top:4px solid #0E7C86}.k b{display:block;font-size:24px}.k .w{border-top-color:#2A7130}
  .v4{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.v4 div{border:1px solid #E3EAF0;border-radius:10px;padding:10px}.v4 b{display:block;font-size:18px}
  table{width:100%;border-collapse:collapse;font-size:11.5px}th{background:#1C1E3D;color:#FFFFFF;padding:6px;text-align:start}td{padding:5px 6px;border-bottom:1px solid #E3EAF0;vertical-align:top}tr:nth-child(even) td{background:#F1F5F8}.v{text-align:end;white-space:nowrap;font-weight:700}.d{white-space:nowrap}.n{color:#5A6B78;font-size:10.5px}
  footer{margin-top:14px;font-size:9.5px;color:#8797A3}@page{size:A4;margin:0}</style></head><body>
  <section class="page"><header><img src="${logo}" alt="AFAQY"><div><h1>${esc(t('proj_pdf_title'))}</h1><div>${esc(new Date().toISOString().slice(0, 10))}</div></div></header>
  <div class="k">${kpi.map(([k, v]) => `<div class="${k === 's_won' ? 'w' : ''}"><b>${v}</b>${esc(t(`proj_${k}`))}</div>`).join('')}</div>
  <div class="v4"><div>${esc(t('proj_v_won'))}<b>${f0(sum(rows.filter((r) => WONISH.includes(r.status))))} ${esc(t('sar'))}</b></div><div>${esc(t('proj_v_com'))}<b>${f0(sum(by('submitted').filter((r) => r.kind === 'commercial')))} ${esc(t('sar'))}</b></div><div>${esc(t('proj_v_ten'))}<b>${f0(sum(by('submitted').filter((r) => r.kind === 'tender')))} ${esc(t('sar'))}</b></div></div>
  ${groups.map((g) => `<h2>${esc(t(`proj_f_${g.st}`))} — ${g.list.length}${sum(g.list) ? ` · ${f0(sum(g.list))} ${esc(t('sar'))}` : ''}</h2>${table(g.list)}`).join('')}
  <footer>${esc(t('proj_pdf_foot'))}</footer></section></body></html>`;
  openReport(html, 'pdf', 'AFAQY-my-projects');
}
async function receiveMe(fragment) {
  const r = await parseMe(fragment);
  history.replaceState(null, '', '#me');            // the data never stays in the address or the history
  if (r.error) { toast(t(r.error, r.vars || {})); renderMe(); return; }
  endViewAs(false); meDerived = false; me = r.me; await store.putMe(me); await refreshOfficialWeights();
  toast(t('me_loaded', { n: me.tasks.length })); renderMe(); renderMeTour();
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
  endViewAs(false); meDerived = false; me = r.me; await store.putMe(me); await refreshOfficialWeights();
  if (location.hash !== '#me') history.replaceState(null, '', '#me');
  route(); toast(t('me_loaded', { n: me.tasks.length })); renderMe(); renderMeTour();
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
      el('p', { class: 'msg', id: 'pro-msg' }),)));
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
    rows.length > shown.length ? el('p', { class: 'hint', text: t('pro_more', { n: rows.length - shown.length }) }) : null,
    renderRepairs());
}

// ---------- the side menu ----------
const iconOf = (x) => ({ sensor: 'heatmap', apihelper: 'api', canval: 'can', nusuk: 'survey' }[x.id] || x.icon || 'system');
const svg = (name) => { const s = el('span', { 'aria-hidden': 'true', style: 'display:contents' }); s.innerHTML = ICONS[name] || ''; return s; };
function renderSide() {
  if (isTeamPortal) { $('nav-kpi').closest('[data-nav-section]').hidden = true; if ($('nav-inputs')) $('nav-inputs').closest('[data-nav-section]').hidden = true; }
  set($('nav-modules'), MODULES.map((m) => el('a', { href: `#m-${m.id}`, class: 'sub', 'data-module': m.id, title: [m.desc && L(m.desc, lang), m.helps && `${t('tool_helps')}: ${L(m.helps, lang)}`].filter(Boolean).join('\n'), text: L(m.name, lang) })));
  // company systems: one fold-away sub-group per category (closed by default, one open at a time), then a link to the full grid
  set($('nav-systems'), [...SYSTEM_CATEGORIES.map((c) => { const items = SYSTEMS.filter((x) => x.category === c.id); if (!items.length) return null;
    return el('details', { class: 'nav-cat', ontoggle: (e) => { if (e.target.open) for (const d of $('nav-systems').querySelectorAll('details.nav-cat')) if (d !== e.target) d.open = false; } },
      el('summary', {}, el('span', { text: L(c.name, lang) }), el('span', { class: 'nav-count', text: String(items.length) })),
      items.map((x) => (x.id === 'pro' ? el('a', { href: '#pro', class: 'sub', 'data-view': 'pro', text: L(x.name, lang) }) : el('a', { href: x.url, class: 'sub', target: '_blank', rel: 'noopener', title: L(x.name, lang) },
        el('span', { class: 'nav-name', text: L(x.name, lang) }), el('span', { class: 'ext', 'aria-hidden': 'true', text: '↗' }))))); }),
    el('a', { href: '#tools', class: 'sub nav-all', text: t('nav_all_systems') }),
    isTeamPortal ? null : el('a', { href: 'manage-systems.html', class: 'sub nav-all nav-manage', text: `⚙ ${t('manage_systems')}` })]);
}
// on a phone the open menu scrolls on its own and the page behind stays still (iOS passes swipes through otherwise); closing restores the position
let navScrollY = 0;
const setMenu = (open) => {
  const b = document.body, small = window.matchMedia('(max-width: 820px)').matches;
  if (open && small && !b.classList.contains('nav-locked')) { navScrollY = window.scrollY; b.style.top = `-${navScrollY}px`; b.classList.add('nav-locked'); }
  if (!open && b.classList.contains('nav-locked')) { b.classList.remove('nav-locked'); b.style.top = ''; window.scrollTo({ top: navScrollY, behavior: 'instant' }); }
  b.classList.toggle('nav-open', open); $('menu-btn').setAttribute('aria-expanded', String(open));
};
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

// A manager's opened tab accepts one authenticated browser hand-off from its myafaqy opener only.
// The temporary nonce is a pairing hint, not a login or an authorization boundary.
function managerImportStatus(key, vars = {}, failure = false) {
  const output = $('mgr-auto-status');
  if (!output) return;
  output.className = failure ? 'msg err' : 'msg';
  output.textContent = t(key, vars);
}
// «أنواع الفرق» (ADR-0053): the team types arrive by the same hand-over as a data pull — this tab's nonce, myafaqy's origin, its opener
let teamTypesLive = null;
const liveTeamTypes = () => {
  const ds = [...datasets].sort((x, y) => String(y.extractedAt || '').localeCompare(String(x.extractedAt || '')))[0];
  const fromPull = ds && ds.teamTypes && Object.keys(ds.teamTypes).length ? { extractedAt: ds.extractedAt || '', teamTypes: ds.teamTypes, from: 'pull' } : null;
  return teamTypesLive && (!fromPull || String(teamTypesLive.extractedAt) > String(fromPull.extractedAt)) ? { ...teamTypesLive, from: 'types' } : fromPull;
};
const newTypes = (wt) => { const live = liveTeamTypes(); if (!live) return [];
  const linked = Object.entries(live.teamTypes).filter(([n]) => /after\s*-?\s*sales|r\s*&\s*d/i.test(n)).flatMap(([, v]) => v);
  return [...new Map(linked.map((x) => [typeKey(x.nameEn || x.nameAr), x])).entries()].filter(([k]) => k && !wt.tasks[k]).map(([, x]) => (lang === 'en' ? x.nameEn || x.nameAr : x.nameAr || x.nameEn)); };
window.addEventListener('message', async (e) => {
  if (!managerImportNonce || isTeamPortal || e.origin !== MYAFAQY_ORIGIN || e.source !== window.opener || !e.data || e.data.type !== TEAMTYPES_AUTO_SCHEMA || e.data.nonce !== managerImportNonce) return;
  const r = parseTeamTypesTransfer(e.data);
  if (r.error) { managerImportAck(e, false); toast(t(r.error)); return; }
  teamTypesLive = { extractedAt: r.extractedAt, teamTypes: r.teamTypes }; await store.kvPut('teamtypes', teamTypesLive);
  managerImportAck(e, true);
  const n = Object.values(r.teamTypes).reduce((s, v) => s + v.length, 0), fresh = newTypes(weights()).length;
  toast(fresh ? t('tt_got_new', { n, f: fresh }) : t('tt_got', { n }));
  if (location.hash !== '#weights') location.hash = '#weights'; else renderWeights();
});
function typesBox(wt) {
  const live = liveTeamTypes(), fresh = newTypes(wt), linked = live ? Object.entries(live.teamTypes).filter(([n]) => /after\s*-?\s*sales|r\s*&\s*d/i.test(n)).reduce((s, [, v]) => s + v.length, 0) : 0;
  const bm = buildTypesBookmarklet(portalHome(), pullBranch().code, lang);
  const steps = el('ol', { class: 'tt-steps', hidden: '' },
    el('li', {}, el('span', { text: t('tt_s1') }), ' ', el('a', { class: 'btn tiny bm', href: bm, draggable: 'true', text: `📋 ${t('tt_bm')}`, onclick: (e) => { e.preventDefault(); toast(t('me_drag')); } })),
    el('li', {}, el('span', { text: t('tt_s2') }), ' ', el('a', { class: 'btn tiny', href: 'https://myafaqy.com/', target: '_blank', rel: 'noopener', text: `${t('tt_open')} ↗` })),
    el('li', { text: t('tt_s3') }));
  return el('section', { class: 'tt-box' },
    el('div', { class: 'tt-head' }, el('div', {}, el('b', { text: t('tt_h') }),
      el('small', { class: 'hint', text: live ? t('tt_when', { d: String(live.extractedAt || '').slice(0, 10), s: t(live.from === 'types' ? 'tt_src_types' : 'tt_src_pull'), n: linked }) : t('tt_never') })),
      el('button', { type: 'button', class: 'btn primary', text: `↻ ${t('tt_update')}`, onclick: () => { steps.hidden = !steps.hidden; } })),
    fresh.length ? el('p', { class: 'tt-new', text: t('tt_new', { n: fresh.length, list: fresh.slice(0, 6).join('، ') + (fresh.length > 6 ? ' …' : '') }) }) : el('p', { class: 'hint', text: live ? t('tt_all_set') : '' }),
    steps);
}
function managerImportAck(e, ok) {
  try {
    e.source.postMessage({ type: 'afaqy-manager-ack/v1', nonce: managerImportNonce, ok }, e.origin);
  } catch { /* the manager can still use the existing manual file downloads */ }
}
window.addEventListener('message', async (e) => {
  if (!managerImportNonce || isTeamPortal || managerImportBusy || e.origin !== MYAFAQY_ORIGIN ||
      e.source !== window.opener || !e.data || e.data.type !== MANAGER_AUTO_SCHEMA ||
      e.data.nonce !== managerImportNonce) return;
  if (managerImportDone) { managerImportAck(e, true); return; }
  managerImportBusy = true;
  managerImportStatus('mgr_auto_receiving');
  try {
    const result = parseManagerTransfer(e.data);
    if (result.error) {
      managerImportStatus(result.error, {}, true);
      managerImportAck(e, false);
      return;
    }
    // Both files are validated before either is stored. Never accept a mismatched reporting period.
    datasets = mergeDataset(datasets, result.dataset);
    reports = [...supersede(reports, result.reports).filter((x) => x.key !== result.reports.key), result.reports]
      .sort((a, b) => (a.range.from < b.range.from ? 1 : -1));
    await store.put(datasets);
    await store.putReports(reports);
    setTimeout(closeMonths, 0);
    renderDatasets(); renderBlocks(); renderKpi(); renderMe();
    managerImportDone = true;
    managerImportAck(e, true);
    const values = { n: result.dataset.tasks.length, period: `${result.dataset.range.from} → ${result.dataset.range.to}` };
    managerImportStatus('mgr_auto_success', values);
    toast(t('mgr_auto_success', values));
    history.replaceState(null, '', location.pathname + '#kpi');
    route();
  } catch {
    managerImportStatus('mgr_auto_store_error', {}, true);
    managerImportAck(e, false);
  } finally { managerImportBusy = false; }
});

// ---------- data: upload ----------
async function ingest(text) {
  const msg = $('read-msg');
  if (!String(text || '').trim()) { msg.className = 'msg err'; msg.textContent = t('paste_empty'); return false; }
  if (String(text).includes(REPORTS_SCHEMA)) {
    const r = parseReports(text);
    if (r.error) { msg.className = 'msg err'; msg.textContent = t(r.error, r.vars); return false; }
    reports = [...supersede(reports, r.reports).filter((x) => x.key !== r.reports.key), r.reports].sort((a, b) => (a.range.from < b.range.from ? 1 : -1));
    await store.putReports(reports);
    msg.className = 'msg';
    msg.textContent = t('reports_loaded', { range: `${r.reports.range.from} → ${r.reports.range.to}`, n: r.reports.techPoints.reduce((s, m) => s + m.rows.length, 0), a: r.reports.afterSales.length });
    renderDatasets(); renderBlocks();
    return true;
  }
  const out = parseDataset(text);
  if (out.error) { msg.className = 'msg err'; msg.textContent = t(out.error, out.vars); return false; }
  datasets = mergeDataset(datasets, out.dataset);
  setTimeout(closeMonths, 0);
  await store.put(datasets);
  msg.className = 'msg';
  msg.textContent = t('loaded', { n: out.dataset.tasks.length, range: `${out.dataset.range.from} → ${out.dataset.range.to}` }) + (out.skipped ? ` ${t('warn_rows', { n: out.skipped })}` : '');
  renderDatasets(); renderBlocks();
  return true;
}
function storageNote() {
  const n = $('storage-note'); if (!n) return;
  n.className = `note ${storageKept ? 'ok-note' : 'info'}`;
  n.textContent = storageKept === true ? t('storage_kept') : storageKept === false ? t('storage_not_kept') : t('storage_unknown');
}
function renderDatasets() {
  if ($('dt-branch')) { const b = pullBranch(); if (b.code !== renderDatasets.lastBranch) { renderDatasets.lastBranch = b.code; renderMgr(); extSend(false); }   // a new branch rebuilds the pull buttons
    renderExtBox();   // drawn with the page, so it follows the language and the data
    $('dt-branch').textContent = b.from === 'myafaqy' ? t('dt_branch_org', { name: b.name || b.code, code: b.code }) : t('dt_branch_default'); }
  if ($('dt-last')) { const d = [...datasets].sort((x, y) => String(y.extractedAt || '').localeCompare(String(x.extractedAt || '')))[0];
    $('dt-last').textContent = d ? t('dt_last', { d: saudiDay(d.extractedAt || new Date().toISOString()), n: (d.tasks || []).length }) : t('dt_last_none'); }
  storageNote();
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
// people the portal shows: the team file's people when it has any, else everyone in the data
const scopeOn = (people) => scopeApplies(roster(), people.map((p) => p.id));
const scoped = (people) => (scopeOn(people) ? people.filter((p) => inScope(roster(), p.id)) : people);
// ---------- MyAFAQY's own hierarchy (ADR-0060): who reports to whom, from the employee list in the pull ----------
let orgMemo = null;
const orgData = () => {
  const ds = [...datasets].filter((d) => d.employees && d.employees.length).sort((x, y) => String(y.extractedAt || '').localeCompare(String(x.extractedAt || '')))[0];
  if (!ds) return null; const sig = `${datasets.length}|${ds.extractedAt}|${ds.employees.length}`;
  if (!orgMemo || orgMemo.sig !== sig) orgMemo = { sig, v: { at: String(ds.extractedAt || '').slice(0, 10), n: ds.employees.length, org: buildOrg(ds.employees, peopleOf(datasets)) } };
  return orgMemo.v;
};
const orgRootId = (od) => { const saved = pref('orgRoot'); if (saved && od.org.under(saved).length) return saved; const mid = managerIdOf(); if (mid && od.org.under(mid).length) return mid; const m = od.org.managers()[0]; return m ? m.pid : null; };
// ADR-0061: the branch a pull filters teams by — the chosen manager's own row in MyAFAQY, Jeddah until a list exists
const pullBranch = () => { const od = orgData(); const r = od && orgRootId(od), b = r && od.org.branchOf(r); return b ? { ...b, from: 'myafaqy' } : { code: JEDDAH_BRANCH, name: '', from: 'default' }; };
const orgEngineerSet = () => { const od = orgData(); if (!od) return null; const r = orgRootId(od); return r ? new Set(od.org.engineersOf(r)) : null; };
let kpiMoreCols = false, teamEdit = false;   // ADR-0059: the board shows five columns until asked for more
function currentTeam(people, tasks, force) {   // force: 'org' or 'file' computes that default and ignores a saved manual choice (the preview uses it)
  const allowed = new Set(scoped(people).map((p) => p.id));
  if (!force) try { const saved = JSON.parse(pref('team') || 'null'); if (Array.isArray(saved)) { const kept = saved.filter((id) => allowed.has(id)); if (kept.length) return kept; } } catch { /* fall through */ }
  const ro = roster().people || {}, leads = new Set(Object.values(ro).map((p) => p && p.leaderId).filter(Boolean));
  const isLead = (id) => leads.has(id) || !!(ro[id] && ro[id].covers);   // ADR-0059: team figures compare engineers with engineers
  const og = (force ? force === 'org' : pref('orgTeam') === '1') ? orgEngineerSet() : null;   // ADR-0060: the team MyAFAQY's hierarchy gives, once the manager chose it
  const plain = () => (scopeOn(people) ? [...allowed] : defaultTeam(people, tasks));
  const base = () => (og ? [...allowed].filter((id) => og.has(id)) : plain());
  const def = base().filter((id) => !isLead(id));
  return def.length ? def : plain();
}
function renderTeamPicker(people, team) {
  const chosen = new Set(team);
  const save = (ids) => { pref('team', JSON.stringify(ids)); renderKpi(); };
  const sorted = [...people].sort((a, b) => String(nameOf(a, lang)).localeCompare(String(nameOf(b, lang))));
  return el('details', { class: 'team' },
    el('summary', {}, `${t('team_title')} — ${t('team_count', { n: chosen.size, total: people.length })}`),
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn', text: t('team_jeddah'), onclick: () => save(scopeOn(people) ? people.map((p) => p.id) : defaultTeam(people, allTasks())) }),
      el('button', { type: 'button', class: 'btn quiet', text: t('team_all'), onclick: () => save(people.map((p) => p.id)) })),
    (() => {
      const byTeam = new Map();
      for (const p of people) for (const tm of p.teams || []) if (/jeddah/i.test(tm) && !/collection/i.test(tm) && !(/sales/i.test(tm) && !/after\s*sales|pre\s*sales/i.test(tm))) (byTeam.get(tm) || byTeam.set(tm, []).get(tm)).push(p.id);
      const list = [...byTeam.entries()].sort((x, y) => y[1].length - x[1].length);
      return list.length ? el('div', { class: 'row team-presets' }, el('span', { class: 'hint', text: t('team_by_myafaqy') }),
        list.map(([tm, ids]) => el('button', { type: 'button', class: `pill-btn${ids.length === chosen.size && ids.every((i) => chosen.has(i)) ? ' on' : ''}`, text: `${tm} · ${ids.length}`, onclick: () => save(ids) }))) : null;
    })(),
    el('div', { class: 'team-list' }, sorted.map((p) => el('label', { class: 'team-item' },
      el('input', { type: 'checkbox', checked: chosen.has(p.id), onchange: (e) => {
        const next = new Set(currentTeam(people, allTasks()));
        if (e.target.checked) next.add(p.id); else next.delete(p.id);
        save([...next]);
      } }),
      el('span', { text: nameOf(p, lang) }),
      p.teams && p.teams.length ? el('span', { class: 'muted', text: p.teams.join('، ') }) : null))));
}
// The heavy engines keep their results until their inputs change: the tasks, the weights, the team file, the mail rows (ADR-0041).
let atSig = '', atList = [];
// ADR-0065: every task counts once. Two stored pulls can overlap (a year, then a month or the extension's two months) and the old
// one stays when the new one does not cover it whole — so a task is kept once, in its copy from the most recent pull (its newest status).
const allTasks = () => { const sig = datasets.map((d) => `${d.key}:${d.tasks.length}:${d.range ? d.range.to : ''}:${d.extractedAt || ''}`).join(','); if (sig !== atSig) { atSig = sig;
  const byId = new Map(); for (const d of [...datasets].sort((x, y) => String(x.extractedAt || '').localeCompare(String(y.extractedAt || '')))) for (const x of d.tasks) byId.set(String(x.id), x);
  atList = [...byId.values()]; } return atList; };
const hashStr = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h >>> 0; };
const MEMO = new WeakMap();
function memoTasks(tasks, parts, fn) {
  let m = MEMO.get(tasks); if (!m) { m = new Map(); MEMO.set(tasks, m); }
  const key = [...parts, hashStr(JSON.stringify(weights())), hashStr(JSON.stringify(roster().people || {})), mailRows.length].join('|');
  if (m.has(key)) return m.get(key); if (m.size > 40) m.clear(); const v = fn(); m.set(key, v); return v;
}
// Two bookmarklets share the exact same CRM reads: direct transfer or the original downloadable files.
let mgrPick = null;   // { from, to, label } — the range the bookmarks pull
function renderMgrPeriod() {
  const box = $('mgr-period'); if (!box) return;
  const today = saudiDay(new Date().toISOString()); const qs = lastQuarters(today, 4);
  const month = { from: `${today.slice(0, 8)}01`, to: today, label: t('mgr_p_month') };
  const year = { from: qs[3].from, to: today, label: t('mgr_p_year') };
  const opts = [month, ...qs.map((q) => ({ from: q.from, to: q.to > today ? today : q.to, label: q.label })), year];
  if (!mgrPick) mgrPick = month;
  const fromIn = el('input', { type: 'date', value: mgrPick.from, max: today }), toIn = el('input', { type: 'date', value: mgrPick.to, max: today });
  set(box, el('div', { class: 'pills' }, opts.map((o) => el('button', { type: 'button', class: `pill-btn${mgrPick.from === o.from && mgrPick.to === o.to ? ' on' : ''}`, text: o.label, onclick: () => { mgrPick = o; renderMgr(); } }))),
    el('div', { class: 'row mgr-dates' }, el('label', {}, el('span', { text: t('mgr_p_from') }), fromIn), el('label', {}, el('span', { text: t('mgr_p_to') }), toIn),
      el('button', { type: 'button', class: 'btn tiny', text: t('mgr_p_apply'), onclick: () => { if (!fromIn.value || !toIn.value || fromIn.value > toIn.value) { toast(t('mgr_p_bad')); return; } mgrPick = { from: fromIn.value, to: toIn.value, label: '' }; renderMgr(); } })),
    el('p', { class: 'hint ltr-dates', text: t('mgr_p_now', { from: mgrPick.from, to: mgrPick.to }) }));
}
function renderMgr() {
  const row = $('mgr-row'), direct = $('mgr-auto-row'); if (!row || !direct) return;
  renderMgrPeriod();
  const q = mgrPick || currentBlocks()[0];
  const bm = buildManagerBookmarklet(q.from, q.to, pullBranch().code, lang);
  // on an unsafe address (a preview, a file) the direct method is simply not offered — the page never breaks over it
  const auto = safePortalUrl(portalHome()) ? buildManagerBookmarklet(q.from, q.to, pullBranch().code, lang, 'auto', portalHome()) : null;
  const controls = (link, label, primary) => [
    el('a', { class: `btn ${primary ? 'primary ' : ''}bm`, href: link, draggable: 'true',
      text: label, onclick: (e) => { e.preventDefault(); toast(t('me_drag')); } }),
    el('button', { type: 'button', class: 'btn', text: t('me_copy'),
      onclick: async () => {
        try { await navigator.clipboard.writeText(decodeURIComponent(link)); toast(t('me_copied')); }
        catch { toast(t('me_copy_fail')); }
      } }),
  ];
  set(direct, auto ? controls(auto, `↪ ${t('mgr_auto_bm', { from: q.from, to: q.to })}`, true)[0] : el('p', { class: 'hint', text: t('mgr_auto_unsafe') }));
  if ($('mgr-auto-copy')) set($('mgr-auto-copy'), auto ? controls(auto, '', true)[1] : null);   // the code itself, for a phone bookmark, lives with the other ways
  set(row, controls(bm, `⬇ ${t('mgr_bm', { from: q.from, to: q.to })}`, false));
}
// ---------- My KPIs: the month's card, the team's cards with one-to-ones, and the pattern's path ----------
// ---------- the engineer's level (ADR-0030) ----------
// Each engineer is compared only with peers under the same leader; leaders themselves are not levelled.
function levelPools(ids) {
  const ro = roster().people || {}; const leaders = new Set(Object.values(ro).map((p) => p.leaderId).filter(Boolean));
  const pools = {}; for (const id of ids) { if (leaders.has(id)) continue; const l = (ro[id] && ro[id].leaderId) || '_'; (pools[l] = pools[l] || []).push(id); }
  return Object.values(pools);
}
function levelsFor(tasks, ids, today, mail) { return memoTasks(tasks, ['levels', ids.join(','), today, (mail || []).length], () => levelsForRaw(tasks, ids, today, mail)); }
const loadFor = (tasks, ids, endDay) => memoTasks(tasks, ['load', ids.join(','), endDay], () => loadSustainability(tasks, weights(), ids, endDay, { mailRows }));
function levelsForRaw(tasks, ids, today, mail) {
  const qs = lastQuarters(today, 4); const out = {};
  const ro = roster().people || {};
  for (const pool of levelPools(ids)) {
    const active = pool.filter((id) => !(ro[id] && ro[id].onLeave));   // someone on leave is neither judged nor a yardstick
    Object.assign(out, engineerLevels(tasks, weights(), active, qs[0], { prev: qs.slice(1).reverse(), mailRows: mail }));
    for (const id of pool.filter((x) => !active.includes(x))) out[id] = { id, onLeave: true, axes: {}, score: null, level: null, trend: null, forecast: null };
  }
  return { levels: out, quarter: qs[0] };
}
const AXES = ['volume', 'difficulty', 'speed', 'reliability'];
// ---------- load sustainability (ADR-0032) — the manager's eyes only ----------
// ---------- reports for management (ADR-0037): a branded PDF and an interactive HTML, per engineer or for a chosen team ----------
let reportPick = null;
function logoDataUrl() { try { const img = document.querySelector('img[src$="afaqy-logo.png"]'); if (!img || !img.naturalWidth) return new URL('assets/afaqy-logo.png', location.href).href;
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); return c.toDataURL('image/png'); } catch { return new URL('assets/afaqy-logo.png', location.href).href; } }
function reportData(ds, ids, peopleById) {
  const wt = weights(), range = ds.range, team = scopeIds(roster());
  const nmR = (id) => nameOf(peopleById.get(id), lang) || id;
  const f = factor1(ds.tasks, { range, team });
  const repK = reports.find((r) => r.key === ds.key);
  const wp = weightedPoints(ds.tasks, ds.activities || (repK ? repK.activities : []), wt, { range, team });
  const win = { from: range.from, to: range.to, label: `${range.from} → ${range.to}` };
  const ro = roster().people || {}; const onLeave = (id) => !!(ro[id] && ro[id].onLeave);   // on leave: neither rated nor a yardstick
  const levels = {}, load = {};
  for (const pool of levelPools(team)) { const active = pool.filter((id) => !onLeave(id)); if (active.length) { Object.assign(levels, engineerLevels(ds.tasks, wt, active, win)); Object.assign(load, loadSustainability(allTasks(), wt, active, range.to).people); }
    for (const id of pool.filter(onLeave)) load[id] = { id, status: 'leave', signals: [] }; }
  const inR = (iso) => { const d = saudiDay(iso); return d && d >= range.from && d <= range.to; };
  const weekOf = (iso) => { const d = new Date(Date.parse(iso) + 3 * 3600000); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d.toISOString().slice(5, 10); };
  const people = ids.map((id) => { const r = f.people.find((x) => x.id === id) || { assigned: 0, done: 0, rate: null, avgHours: null, open: 0, fromEmail: 0 };
    const done = ds.tasks.filter((x) => x.assigneeId === id && x.state === 'done' && inR(x.completedAt));
    const byType = new Map(); for (const x of done) { const k = x.type ? typeLabel(x.type, lang).replace(/[\u2066-\u2069]/g, '') : t('type_unknown'); const o = byType.get(k) || { n: 0, p: 0 }; o.n++; o.p += taskPoints(wt, x); byType.set(k, o); }
    const weeks = new Map(); for (const x of done) weeks.set(weekOf(x.completedAt), (weeks.get(weekOf(x.completedAt)) || 0) + 1);
    return { ...r, id, name: nmR(id), position: positionOf(roster(), id, lang) || '', points: Math.round(((wp.byId.get(id) || {}).total || 0) * 10) / 10,
      level: levels[id] || null, load: load[id] || null, byType: [...byType.entries()].map(([k, v]) => ({ k, n: v.n, p: Math.round(v.p * 10) / 10 })).sort((p, q) => q.p - p.p),
      weeks: [...weeks.entries()].sort((p, q) => (p[0] < q[0] ? -1 : 1)) }; }).sort((p, q) => q.points - p.points);
  const tot = (k) => people.reduce((s, p) => s + (p[k] || 0), 0);
  const asg = ds.tasks.filter((x) => ids.includes(x.assigneeId) && inR(x.createdAt) && x.state !== 'cancelled');
  const dur = ds.tasks.filter((x) => ids.includes(x.assigneeId) && x.state === 'done' && inR(x.completedAt) && x.createdAt).map((x) => (Date.parse(x.completedAt) - Date.parse(x.createdAt)) / 3600000).filter((h) => h >= 0);
  const author = me ? `${nameOf(me.people.find((p) => p.id === me.user.id) || {}, lang) || me.user.name || ''}${positionOf(roster(), me.user.id, lang) ? ` — ${positionOf(roster(), me.user.id, lang)}` : ''}` : '';
  return { range, people, author, levelsAll: levels, team: { done: tot('done'), points: Math.round(tot('points') * 10) / 10, rate: asg.length ? asg.filter((x) => x.state === 'done').length / asg.length : null,
    avgHours: dur.length ? dur.reduce((s, v) => s + v, 0) / dur.length : null, open: tot('open'), fromEmail: tot('fromEmail') } };
}
const RATING = (s) => (s == null ? 'na' : s >= 75 ? 'exceeds' : s >= 55 ? 'meets' : s >= 35 ? 'partial' : 'below');
function reportHtml(D, { single = false, summaryOnly = false } = {}) {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const rtl = lang !== 'en', logo = logoDataUrl(), fontUrl = (f) => new URL(`assets/fonts/${f}`, location.href).href;
  const rate = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`), hrs = (v) => (v == null ? '—' : formatHours(v, lang).replace(/[\u2066-\u2069]/g, ''));
  const axes = ['volume', 'difficulty', 'speed', 'reliability'];
  const avg = (k) => { const v = D.people.map((p) => p[k]).filter((x) => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const TA = { done: avg('done'), points: avg('points'), rate: avg('rate'), avgHours: avg('avgHours'), open: avg('open'), fromEmail: avg('fromEmail') };
  const fmt = (k, v) => (v == null ? '—' : k === 'rate' ? rate(v) : k === 'avgHours' ? hrs(v) : String(Math.round(v * 10) / 10));
  const vs = (k, v) => { const b = TA[k]; if (v == null || b == null || Math.abs(v - b) < 1e-9) return '<em class="eq">=</em>'; const better = (k === 'avgHours' || k === 'open') ? v < b : v > b; return `<em class="${better ? 'up' : 'down'}">${v > b ? '▲' : '▼'}</em>`; };
  const ratingOf = (p) => RATING(p.level ? p.level.score : null);
  const gauge = (s) => { const v = s == null ? 0 : s, ang = Math.PI * (1 - v / 100), x = 60 + 48 * Math.cos(ang), y = 60 - 48 * Math.sin(ang);
    return `<svg viewBox="0 0 120 70" class="gauge"><path d="M12 60 A48 48 0 0 1 108 60" class="g-bg"/><path d="M12 60 A48 48 0 ${v > 50 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}" class="g-fg r-${RATING(s)}"/><text x="60" y="56" text-anchor="middle" class="g-t">${s == null ? '—' : s}</text></svg>`; };
  const radar = (lv) => { if (!lv || lv.score == null) return `<div class="muted">${esc(t('rep_na'))}</div>`; const cx = 90, cy = 90, R = 66;
    const pt = (i, v) => { const a = -Math.PI / 2 + (i * Math.PI) / 2, r = (R * (v || 0)) / 100; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    const ring = (f2) => axes.map((_, i) => pt(i, f2 * 100).join(',')).join(' ');
    return `<svg viewBox="0 0 180 180" class="radar">${[0.25, 0.5, 0.75, 1].map((f2) => `<polygon points="${ring(f2)}" class="ring"/>`).join('')}<polygon points="${ring(0.5)}" class="mid"/>
      <polygon points="${axes.map((k, i) => pt(i, lv.axes[k]).join(',')).join(' ')}" class="shape"/>${axes.map((k, i) => { const [x, y] = pt(i, 120); return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${esc(t(`axis_${k}`))} ${lv.axes[k] == null ? '—' : lv.axes[k]}</text>`; }).join('')}</svg>`; };
  const bars = (rows) => { const max = Math.max(1, ...rows.map((r) => r.v)); return rows.map((r) => `<div class="bar" title="${esc(r.l)}: ${r.v}"><span class="bl">${esc(r.l)}</span><i><b style="width:${Math.round((r.v / max) * 100)}%"></b></i><span class="bv">${r.v}</span></div>`).join(''); };
  const loadTxt = (L2) => t(`rep_load_${L2 ? L2.status : 'quiet'}`);
  const pill = (r) => `<span class="pill r-${r}">${esc(t(`rep_rating_${r}`))}</span>`;
  // the matrix: volume (points) across, quality (axis score) up — four named quadrants, every engineer plotted
  const matrix = () => { const pts = D.people.filter((p) => p.level && p.level.score != null); if (!pts.length) return '';
    const maxP = Math.max(1, ...pts.map((p) => p.points)), midP = maxP / 2, W = 320, H = 220, X = (v) => 30 + (v / maxP) * (W - 50), Y = (s) => H - 24 - (s / 100) * (H - 44);
    return `<svg viewBox="0 0 ${W} ${H}" class="matrix"><rect x="30" y="20" width="${W - 50}" height="${H - 44}" class="m-bg"/>
      <line x1="${X(midP)}" y1="20" x2="${X(midP)}" y2="${H - 24}" class="m-ax"/><line x1="30" y1="${Y(55)}" x2="${W - 20}" y2="${Y(55)}" class="m-ax"/>
      <text x="${W - 24}" y="32" text-anchor="end" class="m-q">${esc(t('rep_q_star'))}</text><text x="36" y="32" class="m-q">${esc(t('rep_q_quality'))}</text>
      <text x="${W - 24}" y="${H - 30}" text-anchor="end" class="m-q">${esc(t('rep_q_volume'))}</text><text x="36" y="${H - 30}" class="m-q">${esc(t('rep_q_support'))}</text>
      <text x="${W / 2}" y="${H - 6}" text-anchor="middle" class="m-l">${esc(t('rep_axis_volume'))} →</text><text x="10" y="${H / 2}" text-anchor="middle" class="m-l" transform="rotate(-90 10 ${H / 2})">${esc(t('rep_axis_quality'))} →</text>
      ${pts.map((p) => `<g class="m-pt" data-name="${esc(p.name)}"><title>${esc(p.name)} — ${p.points} · ${p.level.score}</title><circle cx="${X(p.points)}" cy="${Y(p.level.score)}" r="5" class="r-${ratingOf(p)}"/><text x="${X(p.points) + 7}" y="${Y(p.level.score) + 3}" class="m-n">${esc(p.name.split(' ')[0])}</text></g>`).join('')}</svg>`; };
  const teamMax = Math.max(1, ...D.people.map((p) => p.points));
  const recs = (p) => { if (!p.level || p.level.score == null) return [t('rep_rec_na')]; const plan = developmentPlan(D.levelsAll || {}, p.id);
    const out = plan.map((x) => t(`plan_${x.axis}`, { buddy: x.buddy ? (D.people.find((q) => q.id === x.buddy) || {}).name || '—' : '—', p: x.pct }));
    if (ratingOf(p) === 'exceeds') { const best = axes.filter((k) => p.level.axes[k] != null).sort((a2, b2) => p.level.axes[b2] - p.level.axes[a2])[0]; out.unshift(t('rep_rec_ref', { axis: t(`axis_${best}`) })); }
    return out.length ? out : [t('rep_rec_keep')]; };
  const KP = [['col_done', 'done'], ['col_points', 'points'], ['col_rate', 'rate'], ['col_avg', 'avgHours'], ['col_open', 'open'], ['col_email', 'fromEmail']];
  const personPage = (p, i) => { const lv = p.level, r = ratingOf(p), lvl = lv && lv.level ? `${lv.level} · ${t(`lvl_${LEVELS[lv.level - 1].k}`)}` : t('rep_na');
    const ax = lv ? axes.filter((k) => lv.axes[k] != null).sort((a2, b2) => lv.axes[b2] - lv.axes[a2]) : [];
    return `<section class="page person" data-name="${esc(p.name)}"><header class="ph"><img src="${logo}" alt="AFAQY" class="logo"/><div class="who"><h2>${esc(p.name)}</h2><p>${esc(p.position)}</p></div><div class="rank">${esc(t('rep_rank', { r: i + 1, n: D.people.length }))}</div></header>
      <div class="verdict r-${r}"><div>${gauge(lv ? lv.score : null)}</div><div><span class="v-k">${esc(t('rep_overall'))}</span><b class="v-v">${esc(t(`rep_rating_${r}`))}</b><span class="v-s">${esc(t('rep_level'))}: ${esc(lvl)} · ${esc(loadTxt(p.load))}</span></div>
        <div class="v-ax">${ax.length ? `<span>▲ ${esc(t('rep_strong'))}: <b>${esc(t(`axis_${ax[0]}`))}</b></span><span>▼ ${esc(t('rep_develop'))}: <b>${esc(t(`axis_${ax[ax.length - 1]}`))}</b></span>` : ''}</div></div>
      <div class="kpis">${KP.map(([k, f2]) => `<div class="kpi"><span>${esc(t(k))}</span><b>${esc(fmt(f2, p[f2]))} ${vs(f2, p[f2])}</b><small>${esc(t('rep_team_avg'))}: ${esc(fmt(f2, TA[f2]))}</small></div>`).join('')}</div>
      <div class="grid2"><div class="card"><h3>${esc(t('rep_axes'))}</h3>${radar(lv)}</div>
        <div class="card"><h3>${esc(t('sheet_points_by_type'))}</h3>${p.byType.length ? bars(p.byType.slice(0, 8).map((x) => ({ l: x.k, v: x.p }))) : `<div class="muted">${esc(t('sheet_none'))}</div>`}</div></div>
      <div class="grid2"><div class="card"><h3>${esc(t('sheet_by_week'))}</h3>${p.weeks.length ? bars(p.weeks.map(([l, v]) => ({ l, v }))) : `<div class="muted">${esc(t('sheet_none'))}</div>`}
          <h3 style="margin-top:12px">${esc(t('rep_share'))}</h3><div class="share"><i><b style="width:${Math.round((p.points / teamMax) * 100)}%"></b></i></div></div>
        <div class="card rec"><h3>${esc(t('rep_recs'))}</h3><ul>${recs(p).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <h3>${esc(t('rep_load'))}</h3><p class="big s-${p.load ? p.load.status : 'quiet'}">${esc(loadTxt(p.load))}</p>${p.load && p.load.signals && p.load.signals.length ? `<p class="note">${p.load.signals.map((s) => esc(t(`load_sig_${s.k}`, { v: s.v }))).join(' · ')}</p>` : ''}</div></div>
      <footer>${esc(t('rep_footer', { from: D.range.from, to: D.range.to }))}${D.author ? ` · ${esc(t('rep_by', { who: D.author }))}` : ''}</footer></section>`; };
  const ratings = ['exceeds', 'meets', 'partial', 'below', 'na'].map((r) => ({ r, n: D.people.filter((p) => ratingOf(p) === r).length })).filter((x) => x.n);
  const top = D.people.slice(0, 3).map((p) => p.name).join('، ');
  const attention = D.people.filter((p) => p.load && p.load.status === 'red').map((p) => p.name);
  const cover = single ? '' : `<section class="page cover"><div class="c-top"><img src="${logo}" alt="AFAQY" class="logo big"/></div><div class="c-mid"><span class="c-eyebrow">${esc(t('rep_confidential'))}</span><h1>${esc(t('rep_title_team'))}</h1>
      <p class="period">${esc(D.range.from)} → ${esc(D.range.to)}</p><div class="c-stats"><div><b>${D.people.length}</b><span>${esc(t('rep_people_k'))}</span></div><div><b>${D.team.done}</b><span>${esc(t('col_done'))}</span></div><div><b>${D.team.points}</b><span>${esc(t('col_points'))}</span></div><div><b>${rate(D.team.rate)}</b><span>${esc(t('col_rate'))}</span></div></div></div>
      ${D.author ? `<p class="by">${esc(t('rep_by', { who: D.author }))}</p>` : ''}</section>
    <section class="page"><header class="ph"><img src="${logo}" alt="AFAQY" class="logo"/><h2>${esc(t('rep_exec'))}</h2></header>
      <div class="kpis">${KP.map(([k, f2]) => `<div class="kpi"><span>${esc(t(k))}</span><b>${esc(fmt(f2, D.team[f2]))}</b></div>`).join('')}</div>
      <ul class="exec"><li>${esc(t('rep_exec_1', { done: D.team.done, points: D.team.points, rate: rate(D.team.rate), avg: hrs(D.team.avgHours) }))}</li><li>${esc(t('rep_exec_top', { names: top || '—' }))}</li>
        <li>${esc(attention.length ? t('rep_exec_attn', { names: attention.join('، ') }) : t('rep_exec_ok'))}</li></ul>
      <div class="grid2"><div class="card"><h3>${esc(t('rep_matrix'))}</h3>${matrix()}</div><div class="card"><h3>${esc(t('rep_ratings'))}</h3><div class="dist">${ratings.map((x) => `<div class="d-row"><span class="pill r-${x.r}">${esc(t(`rep_rating_${x.r}`))}</span><i><b class="r-${x.r}" style="width:${Math.round((x.n / D.people.length) * 100)}%"></b></i><b>${x.n}</b></div>`).join('')}</div>
        <h3 style="margin-top:14px">${esc(t('rep_points_team'))}</h3>${bars(D.people.map((p) => ({ l: p.name, v: p.points })))}</div></div>
      <div class="card"><h3>${esc(t('rep_table'))} <input class="find no-print" placeholder="${esc(t('rep_find'))}" oninput="spot(this.value)"/></h3><table class="tbl"><thead><tr>${['col_person', 'rep_overall', 'col_points', 'col_done', 'col_rate', 'col_avg', 'lvl_col_level', 'rep_load'].map((k, n) => `<th onclick="sortBy(${n})">${esc(t(k))}</th>`).join('')}</tr></thead><tbody>
        ${D.people.map((p) => `<tr data-name="${esc(p.name)}"><td>${esc(p.name)}</td><td data-v="${p.level && p.level.score != null ? p.level.score : -1}">${pill(ratingOf(p))}</td><td data-v="${p.points}">${p.points}</td><td data-v="${p.done}">${p.done}</td><td data-v="${p.rate ?? -1}">${rate(p.rate)}</td><td data-v="${p.avgHours ?? 1e9}">${hrs(p.avgHours)}</td><td data-v="${p.level && p.level.level || 0}">${esc(p.level && p.level.level ? p.level.level : '—')}</td><td>${esc(loadTxt(p.load))}</td></tr>`).join('')}</tbody></table></div>
      <footer>${esc(t('rep_footer', { from: D.range.from, to: D.range.to }))}</footer></section>`;
  const css = `@font-face{font-family:NS;src:url('${fontUrl('NotoSansArabic-Regular.woff2')}')}@font-face{font-family:NS;font-weight:700;src:url('${fontUrl('NotoSansArabic-Bold.woff2')}')}
    :root{--navy:#1C1E3D;--green:#2A7130;--teal:#0E7C86;--line:#E3EAF0;--soft:#F1F5F8;--ex:#15803D;--me:#0E7C86;--pa:#B45309;--be:#B42318;--na:#8797A3}*{box-sizing:border-box}body{margin:0;font-family:NS,'Segoe UI',Tahoma,sans-serif;color:var(--navy);background:#EEF1F4;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{width:210mm;min-height:297mm;margin:12px auto;background:#FFFFFF;padding:15mm 14mm 16mm;position:relative;box-shadow:0 2px 14px rgba(28,30,61,.08);border-top:6px solid var(--green)}
    .cover{padding:0;display:flex;flex-direction:column;background:var(--navy);color:#FFFFFF;border-top:0}.c-top{padding:18mm 14mm 0}.c-mid{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 14mm}.c-eyebrow{color:#6CC7CF;letter-spacing:.12em;font-size:12px}.cover h1{font-size:36px;margin:8px 0 6px;line-height:1.25}.period{opacity:.85;font-size:16px;margin:0 0 26px}
    .c-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.c-stats div{border-top:3px solid var(--green);padding-top:8px}.c-stats b{display:block;font-size:26px}.c-stats span{font-size:12px;opacity:.8}.cover .by{margin:0;padding:10mm 14mm 14mm;background:#FFFFFF;color:var(--navy);font-weight:700;border-top:6px solid var(--green)}
    .logo{height:32px}.logo.big{height:62px;background:#FFFFFF;padding:10px 16px;border-radius:10px}.ph{display:flex;align-items:center;gap:14px;border-bottom:2px solid var(--line);padding-bottom:10px;margin-bottom:12px}.ph h2{margin:0;font-size:21px}.ph p{margin:2px 0 0;color:#5A6B78;font-size:13px}.rank{margin-inline-start:auto;background:var(--navy);color:#FFFFFF;border-radius:999px;padding:6px 14px;font-weight:700;font-size:12px}
    .verdict{display:grid;grid-template-columns:120px 1fr auto;gap:14px;align-items:center;border-radius:14px;padding:10px 16px;margin-bottom:12px;background:var(--soft);border-inline-start:6px solid var(--na)}.verdict.r-exceeds{border-color:var(--ex)}.verdict.r-meets{border-color:var(--me)}.verdict.r-partial{border-color:var(--pa)}.verdict.r-below{border-color:var(--be)}
    .v-k{display:block;font-size:12px;color:#5A6B78}.v-v{display:block;font-size:24px;margin:2px 0}.v-s{font-size:12px;color:#2F4A5E}.v-ax{display:grid;gap:4px;font-size:12px}.gauge{width:120px}.g-bg{fill:none;stroke:var(--line);stroke-width:10;stroke-linecap:round}.g-fg{fill:none;stroke-width:10;stroke-linecap:round;stroke:var(--na)}.g-t{font-size:20px;font-weight:700;fill:var(--navy)}
    .g-fg.r-exceeds,.m-pt circle.r-exceeds{stroke:var(--ex);fill:var(--ex)}.g-fg.r-meets,.m-pt circle.r-meets{stroke:var(--me);fill:var(--me)}.g-fg.r-partial,.m-pt circle.r-partial{stroke:var(--pa);fill:var(--pa)}.g-fg.r-below,.m-pt circle.r-below{stroke:var(--be);fill:var(--be)}.g-fg{fill:none!important}
    .kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:12px}.kpi{background:var(--soft);border-radius:10px;padding:8px 10px;border-inline-start:4px solid var(--teal)}.kpi span{display:block;font-size:11px;color:#5A6B78}.kpi b{font-size:18px;display:flex;align-items:center;gap:4px}.kpi small{font-size:10px;color:#8797A3}
    em{font-style:normal;font-size:12px}em.up{color:var(--ex)}em.down{color:var(--be)}em.eq{color:var(--na)}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}.card{border:1px solid var(--line);border-radius:12px;padding:12px}.card h3{margin:0 0 10px;font-size:13.5px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .radar{width:100%;max-width:220px;display:block;margin:auto}.radar .ring{fill:none;stroke:var(--line)}.radar .mid{fill:none;stroke:#8797A3;stroke-dasharray:3 3}.radar .shape{fill:rgba(42,113,48,.22);stroke:var(--green);stroke-width:2}.radar text{font-size:9px;fill:var(--navy)}
    .bar{display:grid;grid-template-columns:38% 1fr 40px;gap:8px;align-items:center;font-size:12px;margin:4px 0}.bl{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.bar i,.share i,.d-row i{display:block;height:10px;background:var(--soft);border-radius:5px;overflow:hidden}.bar b,.share b{display:block;height:100%;background:linear-gradient(90deg,var(--teal),var(--green))}.bv{font-weight:700;text-align:end}.share i{height:14px}
    .pill{display:inline-block;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:700;color:#FFFFFF;background:var(--na)}.pill.r-exceeds,.d-row b.r-exceeds{background:var(--ex)}.pill.r-meets,.d-row b.r-meets{background:var(--me)}.pill.r-partial,.d-row b.r-partial{background:var(--pa)}.pill.r-below,.d-row b.r-below{background:var(--be)}.d-row b{display:block;height:100%;background:var(--na)}
    .dist{display:grid;gap:8px}.d-row{display:grid;grid-template-columns:auto 1fr 26px;gap:8px;align-items:center;font-size:12px}.d-row>b{text-align:end}
    .matrix{width:100%}.m-bg{fill:var(--soft)}.m-ax{stroke:#8797A3;stroke-dasharray:4 3}.m-q{font-size:9px;fill:#5A6B78;font-weight:700}.m-l{font-size:9px;fill:#5A6B78}.m-n{font-size:8.5px;fill:var(--navy)}
    .rec ul{margin:0 0 10px;padding-inline-start:18px;font-size:12.5px;line-height:1.7}.big{font-size:17px;font-weight:700;margin:0 0 4px}.s-red{color:var(--be)}.s-amber{color:var(--pa)}.s-green{color:var(--ex)}.s-quiet,.s-leave{color:var(--na)}.note{font-size:11.5px;color:#2F4A5E;margin:0}.muted{color:#8797A3;font-size:12px}
    .exec{margin:0 0 12px;padding-inline-start:18px;line-height:1.9}.tbl{width:100%;border-collapse:collapse;font-size:12px}.tbl th{background:var(--navy);color:#FFFFFF;padding:7px;cursor:pointer;text-align:start}.tbl td{padding:6px 7px;border-bottom:1px solid var(--line)}.tbl tr:nth-child(even) td{background:var(--soft)}
    .find{margin-inline-start:auto;font:inherit;font-size:12px;padding:4px 8px;border:1px solid var(--line);border-radius:8px}footer{position:absolute;bottom:7mm;inset-inline:14mm;font-size:9.5px;color:#8797A3;border-top:1px solid var(--line);padding-top:4px}
    .dim{opacity:.16}@media print{body{background:#FFFFFF}.page{margin:0;box-shadow:none;page-break-after:always}.no-print{display:none}}@page{size:A4;margin:0}`;
  const js = `function sortBy(n){const tb=document.querySelector('.tbl tbody');if(!tb)return;const rows=[...tb.rows];const dir=tb.dataset.c==n&&tb.dataset.d==='1'?-1:1;tb.dataset.c=n;tb.dataset.d=dir===1?'1':'0';rows.sort((a,b)=>{const x=a.cells[n],y=b.cells[n];const vx=x.dataset.v!=null?+x.dataset.v:x.textContent,vy=y.dataset.v!=null?+y.dataset.v:y.textContent;return (vx>vy?1:vx<vy?-1:0)*(n===0?dir:-dir);});rows.forEach(r=>tb.append(r));}
    function spot(q){q=q.trim().toLowerCase();document.querySelectorAll('section.person,[data-name]').forEach(e=>{const m=!q||(e.dataset.name||'').toLowerCase().includes(q);e.classList.toggle('dim',!m);});const hit=q&&[...document.querySelectorAll('section.person')].find(e=>(e.dataset.name||'').toLowerCase().includes(q));if(hit)hit.scrollIntoView({behavior:'smooth'});}`;
  return `<!doctype html><html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(single ? `${t('rep_title_one')} — ${D.people[0] ? D.people[0].name : ''}` : t('rep_title_team'))}</title><style>${css}</style></head>
    <body>${cover}${summaryOnly ? '' : D.people.map(personPage).join('')}<script>${js}<\/script></body></html>`;
}
function openReport(html, mode, fileBase) {
  if (mode === 'html') { const a = el('a', { href: URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })), download: `${fileBase}.html` }); document.body.append(a); a.click(); a.remove(); toast(t('rep_saved_html')); return; }
  const w = window.open('', '_blank'); if (!w) { toast(t('rep_popup')); return; }
  w.document.open(); w.document.write(html.replace('</body>', '<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),600))<\/script></body>')); w.document.close();
}
function kpiReportSection(ds, team, peopleById) {
  if (!ds) return null; const engineers = levelPools(team).flat();
  if (!reportPick) reportPick = new Set(engineers);
  const nmR = (id) => nameOf(peopleById.get(id), lang) || id;
  const base = (s) => `AFAQY-${s}-${ds.range.from}_${ds.range.to}`;
  const run = (ids, mode, kind) => { if (!ids.length) { toast(t('rep_pick_one')); return; } const D = reportData(ds, ids, peopleById);
    openReport(reportHtml(D, { single: kind === 'single', summaryOnly: kind === 'summary' }), mode, base(kind === 'single' ? (D.people[0] ? D.people[0].name.replace(/\s+/g, '-') : 'engineer') : kind === 'summary' ? 'team-summary' : 'team-full')); };
  return el('section', { class: 'share', id: 'k-report' },
    el('h2', {}, t('rep_h', { from: ds.range.from, to: ds.range.to }), helpQ('help_report')),
    el('div', { class: 'rep-pick' }, team.map((id) => el('label', { class: 'rep-person' },
      el('input', { type: 'checkbox', ...(reportPick.has(id) ? { checked: '' } : {}), onchange: (e) => { if (e.target.checked) reportPick.add(id); else reportPick.delete(id); } }),
      el('span', { text: nmR(id) }),
      el('button', { type: 'button', class: 'btn quiet tiny', title: t('rep_one_pdf'), text: 'PDF', onclick: (e) => { e.preventDefault(); run([id], 'pdf', 'single'); } })))),
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn primary', text: `⬇ ${t('rep_summary_pdf')}`, onclick: () => run([...reportPick].filter((id) => team.includes(id)), 'pdf', 'summary') }),
      el('button', { type: 'button', class: 'btn primary', text: `⬇ ${t('rep_full_pdf')}`, onclick: () => run([...reportPick].filter((id) => team.includes(id)), 'pdf', 'full') }),
      el('button', { type: 'button', class: 'btn', text: `✦ ${t('rep_team_html')}`, onclick: () => run([...reportPick].filter((id) => team.includes(id)), 'html', 'full') })));
}
function kpiLoadSection(team, peopleById) {
  const tasks = allTasks(); if (!tasks.length) return null;
  const nmL = (id) => nameOf(peopleById.get(id), lang) || id; const ro = roster().people || {};
  const lastDay = tasks.reduce((m, x) => { const d = saudiDay(x.completedAt); return d && d > m ? d : m; }, '');
  const today = saudiDay(new Date().toISOString()); const endDay = lastDay && lastDay < today ? lastDay : today;
  // engineers are compared with peers under the same leader; a leader is read on his own (no share signal); leave is skipped
  const leaders = team.filter((id) => !levelPools(team).some((p) => p.includes(id)));
  const res = {}; let win = null;
  for (const pool of [...levelPools(team), ...leaders.map((id) => [id])]) {
    const active = pool.filter((id) => !(ro[id] && ro[id].onLeave));
    if (active.length) { const r = loadFor(tasks, active, endDay); win = r; Object.assign(res, r.people);
      for (const id of active) res[id].pool = active; }
    for (const id of pool.filter((x) => !active.includes(x))) res[id] = { id, status: 'leave', signals: [] };
  }
  const order = { red: 0, amber: 1, green: 2, quiet: 3, leave: 4 };
  const rows = Object.values(res).sort((x, y) => order[x.status] - order[y.status] || (y.after || 0) - (x.after || 0));
  const lightest = (p) => (p.pool || []).filter((id) => id !== p.id && res[id] && res[id].status !== 'leave').sort((x, y) => (res[x].points || 0) - (res[y].points || 0))[0];
  const action = (p) => {
    if (p.status === 'leave' || p.status === 'quiet' || p.status === 'green') return '';
    const isLeader = leaders.includes(p.id); const out = [];
    if (p.signals.some((s) => s.k === 'share') && lightest(p)) { const fair = (p.pool || []).reduce((s, id) => s + (res[id].points || 0), 0) / (p.pool || [1]).length;
      out.push(t('load_act_move', { n: Math.max(1, Math.round((p.points - fair) / 4)), to: nmL(lightest(p)) })); }
    if (p.signals.some((s) => ['after', 'weekend', 'late', 'rise'].includes(s.k))) out.push(isLeader ? t('load_act_delegate') : t('load_act_hours'));
    return out.join(' · ');
  };
  const sig = (p) => p.signals.map((s) => el('span', { class: `sig ${s.level}`, text: t(`load_sig_${s.k}`, { v: s.v }) }));
  return el('section', { class: 'share', id: 'k-load' },
    el('h2', {}, t('load_h'), helpQ('help_load')),
    win ? el('p', { class: 'hint', text: t('load_window', { from: saudiDay(win.from), to: saudiDay(win.to) }) }) : null,
    el('div', { class: 'table-wrap' }, el('table', { class: 'share-table load' },
      el('thead', {}, el('tr', {}, ['col_person', 'load_col_status', 'load_col_after', 'load_col_weekend', 'load_col_share', 'load_col_signals', 'load_col_action'].map((k, i) => el('th', { class: [2, 3, 4].includes(i) ? 'num' : null, text: t(k) })))),
      el('tbody', {}, rows.map((p) => el('tr', { class: `st-${p.status}` },
        el('td', { text: nmL(p.id) }),
        el('td', {}, el('span', { class: `load-pill ${p.status}`, text: t(`load_st_${p.status}`) })),
        el('td', { class: 'num', text: p.status === 'leave' ? '—' : `${p.after}%` }), el('td', { class: 'num', text: p.status === 'leave' ? '—' : `${p.weekend}%` }),
        el('td', { class: 'num', text: p.status === 'leave' || leaders.includes(p.id) ? '—' : `×${p.share}` }),
        el('td', { class: 'sigs' }, sig(p)), el('td', { class: 'plan-cell', text: action(p) })))))));
}
// ---------- the board's sections, each its own function (ADR-0023) ----------
// the manager's view of each person's slice of the team's work — day / week / month / quarter
let mailQ = 0;
// the period picker both sections use: day · week · month · quarter (pick one of the last four) · year (the four side by side)
function periodPicker(kind, qi, today, onKind, onQ) {
  const qs = lastQuarters(today, 4);
  const chip = (k, label) => el('button', { type: 'button', class: `pill-btn${kind === k ? ' on' : ''}`, text: t(label), onclick: () => onKind(k) });
  return [el('div', { class: 'pills' }, [['day', 'share_day'], ['week', 'share_week'], ['month', 'share_month'], ['quarter', 'share_quarter'], ['year', 'share_year']].map(([k, l]) => chip(k, l))),
    kind === 'quarter' ? el('div', { class: 'pills qpick' }, qs.map((q, i) => el('button', { type: 'button', class: `pill-btn${qi === i ? ' on' : ''}`, text: q.label, onclick: () => onQ(i) }))) : null];
}
const pickWindow = (kind, qi, today) => (kind === 'quarter' ? lastQuarters(today, 4)[qi] : shareWindow(kind, today));
function kpiWeekSection(team, peopleById) { const wd = weeklyDigest(allTasks(), weights(), team, new Date(), { ...CARD_DEFAULTS, ...(weights().card || {}) });
      const leave = (id) => !!(roster().people[id] && roster().people[id].onLeave);
      const nmW = (id) => (nameOf(peopleById.get(id), lang) || id);
      const drops = wd.drops.filter((r) => !leave(r.id)), away = wd.drops.filter((r) => leave(r.id));
      const text = [t('week_h'), `${t('week_total', { p: wd.total, q: wd.prevTotal })}`,
        wd.movers.length ? `${t('week_movers')}: ${wd.movers.map((r) => `${nmW(r.id)} +${r.delta}`).join('، ')}` : null,
        drops.length ? `${t('week_drops')}: ${drops.map((r) => `${nmW(r.id)} ${r.prev}→${r.points}`).join('، ')}` : null,
        wd.aging.length ? `${t('week_aging')}: ${wd.aging.map((r) => `${nmW(r.id)} ${r.aging}`).join('، ')}` : null].filter(Boolean).join('\n');
      const share = async () => { try { if (navigator.share) await navigator.share({ title: t('week_h'), text }); else { await navigator.clipboard.writeText(text); toast(t('me_copied')); } } catch { /* closed */ } };
      return el('section', { class: 'week', id: 'k-week' },
        el('div', { class: 'row', style: 'justify-content:space-between;align-items:center' }, el('h2', { style: 'margin:0' }, t('week_h'), helpQ('help_week')), el('button', { type: 'button', class: 'btn tiny', text: t('week_share'), onclick: share })),
        el('div', { class: 'week-grid' },
          el('div', { class: 'week-tile' }, el('b', { text: String(wd.total) }), el('span', { text: t('week_total_l', { q: wd.prevTotal, d: (wd.total - wd.prevTotal >= 0 ? '+' : '−') + Math.abs(wd.total - wd.prevTotal) }) })),
          el('div', { class: 'week-list good' }, el('h4', { text: t('week_movers') }), wd.movers.length ? wd.movers.map((r) => el('div', { text: `${nmW(r.id)} · +${r.delta}` })) : el('div', { class: 'hint', text: '—' })),
          el('div', { class: 'week-list grow' }, el('h4', { text: t('week_drops') }), drops.length ? drops.map((r) => el('div', {}, `${nmW(r.id)} · `, el('span', { class: 'ltr', text: `\u2066${r.prev} → ${r.points}\u2069` }))) : el('div', { class: 'hint', text: '—' }), away.length ? el('div', { class: 'hint', text: t('week_on_leave', { who: away.map((r) => nmW(r.id)).join('، ') }) }) : null),
          el('div', { class: 'week-list plan' }, el('h4', { text: t('week_aging') }), wd.aging.length ? wd.aging.map((r) => el('div', { text: `${nmW(r.id)} · ${r.aging}` })) : el('div', { class: 'hint', text: '—' })))); }
// ---------- «التطوير»: one page for each person's quarter plan, its baseline, live progress, monthly follow-up and this month's suggestions (ADR-0040) ----------
const GOAL_METRICS = ['points', 'done', 'avgHours', 'rate', 'type', 'custom'];
async function devSave() { await store.kvPut('devplans', devPlans); }
// an edit in a plan redraws that plan and its card's ring only — the team's levels and workload are not recomputed (ADR-0041)
let devCtx = null;
function devRefresh() {
  const body = $('dev-body'), old = body && body.querySelector('.dev-panel');
  if (!old || !devCtx) { renderDev(); return; }
  old.replaceWith(devPanel(devSel, devCtx));
  const card = body.querySelector(`.dev-card[data-id="${CSS.escape(devSel)}"]`); if (!card) return;
  const p = (devPlans[devCtx.qPlan.key] || {})[devSel], pct = p && p.goals.length ? planProgress(quarterGoalProgress(devCtx.tasks, devCtx.wt, devSel, devCtx.qPlan, p.goals)) : null;
  const ring = card.querySelector('.ring'); if (ring) { ring.style.setProperty('--p', pct == null ? 0 : pct); ring.querySelector('b').textContent = pct == null ? '—' : `${pct}%`; }
  const lv = devCtx.levels[devSel], w = lv && lv.axes ? Object.entries(lv.axes).filter(([, v]) => v != null).sort((x, y) => x[1] - y[1])[0] : null, hint = card.querySelector('small.hint');
  if (hint) hint.textContent = [w ? t('dev_weak', { a: t(`axis_${w[0]}`) }) : '', p ? t('dev_goals_n', { n: p.goals.length }) : t('dev_no_plan'), p && p.status === 'agreed' ? t('dev_agreed') : ''].filter(Boolean).join(' · ');
}
function devPlanOf(qKey, id) { devPlans[qKey] = devPlans[qKey] || {}; return devPlans[qKey][id] || (devPlans[qKey][id] = { goals: [], buddy: '', actions: '', note: '', status: 'draft' }); }
// ---------- «غرفة المتابعة» (ADR-0043): the manager's first page — where the team stands, what needs attention, the way to each task ----------
// every comparison table keeps its rows; a person's name in it opens their file instead of repeating their details
function linkNames(root, ids, nm) {
  if (!root || isTeamPortal) return; const ppl = peopleOf(datasets), byName = new Map();
  for (const id of ids) { const pp = ppl.find((x) => x.id === id) || {}; for (const n of [nm(id), nameOf(pp, 'ar'), nameOf(pp, 'en')]) if (n && !byName.has(n.trim())) byName.set(n.trim(), id); }
  root.querySelectorAll('td, th[scope="row"], .person-name, td span, td b, td div, td strong').forEach((c) => { if (c.children.length || c.classList.contains('person-link') || c.closest('button, a, select')) return; const id = byName.get(c.textContent.trim()); if (!id) return;
    c.classList.add('person-link'); c.tabIndex = 0; c.title = t('pf_open_file'); c.onclick = (e) => { e.stopPropagation(); openPerson(id); }; c.onkeydown = (e) => { if (e.key === 'Enter') openPerson(id); }; });
}
// the board and the team page keep their comparison tables; after each redraw, names in them link to the person's file
{ const withNames = (fn, viewId) => function linkedRender(...args) { const out = fn.apply(this, args);
    try { if (datasets.length) { const ppl = peopleOf(datasets), team = currentTeam(scoped(ppl), allTasks()); linkNames($(viewId), team, (x) => nameOf(ppl.find((p) => p.id === x) || {}, lang) || x); } } catch { /* a table without names */ }
    return out; };
  renderKpi = withNames(renderKpi, 'view-kpi'); renderTeam = withNames(renderTeam, 'view-team'); }
// ---------- how points are made, and the rules behind them (ADR-0045) — on top of the weights page ----------
function pointsRulesBox(wt, admin) {
  const R = rulesOf(wt), fmtN = (v) => String(Math.round(v * 100) / 100), maxScore = 2 * FACTORS.reduce((s, k) => s + R.fw[k], 0);
  const stepsText = (m) => (m.steps.length ? [...m.steps.map((s) => t('pr_mstep', { p: s.upTo, x: fmtN(s.x) })), t('pr_mstep_more', { x: fmtN(m.beyond) })].join(' · ') : t('pr_mflat'));
  const ruleText = (e) => t('pr_rule', { w: e.when.map((k) => t(`pr_c_${k}`)).join(e.join === 'or' ? ` ${t('pr_or')} ` : ` ${t('pr_and')} `), p: e.pct });
  const step = (n, title, ...kids) => el('div', { class: 'pr-step' }, el('span', { class: 'pr-n', text: String(n) }), el('div', {}, el('b', { text: title }), ...kids));
  const steps = el('div', { class: 'pr-steps' },
    step(1, t('pr_s1'), el('ul', {}, FACTORS.map((k) => el('li', {}, el('span', { text: t(`factor_${k}`) }), el('em', { text: ` ×${fmtN(R.fw[k])}` }))))),
    step(2, t('pr_s2', { m: fmtN(maxScore) }), el('div', { class: 'pr-cuts' }, [1, 2, 3, 4, 5].map((b, i) => el('span', { text: t('pr_cut', { r: i < 4 ? `≤ ${fmtN(R.cuts[i])}` : `> ${fmtN(R.cuts[3])}`, b }) })))),
    step(3, t('pr_s3'), el('ul', {}, el('li', { text: t('pr_m_done') }), el('li', { text: t('pr_m_speed', { x: fmtN(R.speedX) }) }), el('li', { text: t('pr_m_cmp', { a: String(Math.round(R.cmpFast * 100)), fx: fmtN(R.cmpFastX), b: String(Math.round(R.cmpSlow * 100)), sx: fmtN(R.cmpSlowX) }) }), ...R.methods.map((m) => el('li', { text: `${m.name}: ${stepsText(m)}` })))),
    step(4, t('pr_s4'), R.extras.length ? el('ul', {}, R.extras.map((e) => el('li', { text: ruleText(e) })), el('li', { class: 'hint', text: t(R.stack === 'max' ? 'pr_stack_max_d' : 'pr_stack_sum_d', { c: R.capPct }) })) : el('p', { class: 'hint', text: t('pr_x_none') })));
  // the calculator — the same function the engine uses, so what it shows is what a task earns
  const clean = (s) => String(s).replace(/[\u2066-\u2069]/g, '');
  const types = Object.keys(wt.tasks).map((k) => ({ k, n: clean(typeLabel(k, lang)) })).sort((x, y) => x.n.localeCompare(y.n, lang));
  const sel = el('select', { class: 'pr-in wide' }, types.map((x) => el('option', { value: x.k, text: x.n })));
  const hrs = el('input', { type: 'number', class: 'pr-in', min: '0', step: '0.5', value: '4' }), cbE = el('input', { type: 'checkbox' }), cbA = el('input', { type: 'checkbox' }), cbW = el('input', { type: 'checkbox' });
  const out = el('div', { class: 'pr-out' });
  const calc = () => { const h = Number(hrs.value), d = pointsDetail(wt, sel.value, Number.isFinite(h) ? h : null, { email: cbE.checked, after: cbA.checked, weekend: cbW.checked });
    const lines = [d.f ? t('pr_c_base', { e: FACTORS.map((k, i) => `${t(`factor_short_${k}`)} ${d.f[i]}×${fmtN(R.fw[k])}`).join(' + '), s: d.score, b: d.base }) : t('pr_c_set', { b: d.base }),
      d.why === 'speed_in' ? t('pr_c_speed_in', { h, s: d.std, x: fmtN(d.mult) }) : d.why === 'speed_out' ? t('pr_c_speed_out', { h, s: d.std }) : d.why.startsWith('cmp_') ? t(`pr_c_${d.why}`, { h, s: d.std, x: fmtN(d.mult) }) : d.why.startsWith('custom_') ? t(`pr_c_${d.why}`, { n: d.method || '', h, s: d.std, p: d.stepAt, x: fmtN(d.mult) }) : t('pr_c_done'),
      d.hit.length ? t('pr_c_rules', { r: d.hit.map(ruleText).join(' · '), p: d.extra }) : ''].filter(Boolean);
    set(out, ...lines.map((l) => el('div', { text: l })), el('b', { class: 'pr-total', text: t('pr_c_total', { p: d.total }) })); };
  [sel, hrs, cbE, cbA, cbW].forEach((x) => x.addEventListener('input', calc)); calc();
  const calcBox = el('div', { class: 'pr-calc' }, el('h3', { text: t('pr_calc_h') }),
    el('div', { class: 'row' }, el('label', {}, el('span', { text: t('pr_calc_type') }), sel), el('label', {}, el('span', { text: t('pr_calc_hours') }), hrs),
      el('label', { class: 'cb' }, cbE, el('span', { text: t('pr_calc_email') })), el('label', { class: 'cb' }, cbA, el('span', { text: t('pr_calc_after') })), el('label', { class: 'cb' }, cbW, el('span', { text: t('pr_calc_weekend') }))), out);
  // the rules editor — admin only; a preview shows what changes before anything is applied
  let editor = el('p', { class: 'hint', text: t('pr_rules_ro') });
  if (admin) {
    const num = (v, mn, mx, st) => el('input', { type: 'number', class: 'pr-in', min: String(mn), max: String(mx), step: String(st), value: String(v) });
    const fwIn = Object.fromEntries(FACTORS.map((k) => [k, num(R.fw[k], 0, 3, 0.5)])), cutIn = R.cuts.map((v) => num(v, 0, 24, 0.5));
    const spIn = num(R.speedX, 1, 3, 0.1), cf = num(Math.round(R.cmpFast * 100), 10, 100, 5), cs = num(Math.round(R.cmpSlow * 100), 100, 1000, 10), cfx = num(R.cmpFastX, 1, 3, 0.1), csx = num(R.cmpSlowX, 0, 1, 0.1);
    // extra rules: conditions as toggles, joined by «كل الشروط (و)» or «أي شرط (أو)», each with its percentage
    const ex = R.extras.map((e) => ({ ...e, when: [...e.when] }));
    const stackSel = el('select', { class: 'pr-in wide' }, [['sum', t('pr_stack_sum')], ['max', t('pr_stack_max')]].map(([v, l]) => el('option', { value: v, selected: R.stack === v ? '' : null, text: l })));
    const capIn = num(R.capPct, 0, 300, 10), exBox = el('div', { class: 'pr-extras' });
    const drawEx = () => set(exBox, ...ex.map((e, i) => { const pct = num(e.pct, 1, 100, 5); pct.oninput = (ev) => { e.pct = Number(ev.target.value); };
      return el('div', { class: 'pr-ex' },
        el('div', { class: 'pr-chips' }, EXTRA_CONDS.map((k) => el('button', { type: 'button', class: `pr-chip${e.when.includes(k) ? ' on' : ''}`, 'aria-pressed': String(e.when.includes(k)), text: t(`pr_c_${k}`),
          onclick: () => { e.when = e.when.includes(k) ? e.when.filter((x) => x !== k) : [...e.when, k]; drawEx(); } }))),
        el('div', { class: 'row' }, el('select', { class: 'pr-in wide', 'aria-label': t('pr_join'), onchange: (ev) => { e.join = ev.target.value; } }, [['and', t('pr_and_l')], ['or', t('pr_or_l')]].map(([v, l]) => el('option', { value: v, selected: e.join === v ? '' : null, text: l }))),
          el('label', {}, el('span', { text: t('pr_pct') }), pct), el('button', { type: 'button', class: 'btn quiet tiny', text: `✕ ${t('pr_ex_del')}`, onclick: () => { ex.splice(i, 1); drawEx(); } }))); }),
      el('button', { type: 'button', class: 'btn tiny pr-ex-add', text: `+ ${t('pr_ex_add')}`, onclick: () => { ex.push({ when: ['email'], join: 'and', pct: 10 }); drawEx(); } }));
    drawEx();
    const ms = R.methods.map((m) => ({ ...m, steps: m.steps.map((s) => ({ ...s })) })), mBox = el('div', { class: 'pr-extras' });
    const newId = () => `m_${Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, 'x').padEnd(6, '0')}`;
    const drawM = () => set(mBox, ...ms.map((m, i) => {
      const nameIn = el('input', { type: 'text', class: 'pr-in wide', value: m.name, maxlength: '40', placeholder: t('pr_m_name') }); nameIn.oninput = (e) => { m.name = e.target.value; };
      const by = num(m.beyond, 0, 5, 0.1); by.oninput = (e) => { m.beyond = Number(e.target.value); };
      return el('div', { class: 'pr-ex pr-method' }, el('label', {}, el('span', { text: t('pr_m_name') }), nameIn),
        ...m.steps.map((s, j) => { const up = num(s.upTo, 1, 1000, 5), mx = num(s.x, 0, 5, 0.1); up.oninput = (e) => { s.upTo = Number(e.target.value); }; mx.oninput = (e) => { s.x = Number(e.target.value); };
          return el('div', { class: 'row' }, el('label', {}, el('span', { text: t('pr_m_upto') }), up), el('label', {}, el('span', { text: t('pr_m_x') }), mx),
            el('button', { type: 'button', class: 'btn quiet tiny', text: '✕', 'aria-label': t('pr_ex_del'), onclick: () => { m.steps.splice(j, 1); drawM(); } })); }),
        el('div', { class: 'row' }, m.steps.length < 5 ? el('button', { type: 'button', class: 'btn tiny', text: `+ ${t('pr_m_step_add')}`, onclick: () => { const last = m.steps[m.steps.length - 1]; m.steps.push({ upTo: last ? Math.min(1000, last.upTo * 2) : 50, x: 1 }); drawM(); } }) : null,
          el('label', {}, el('span', { text: t('pr_m_beyond') }), by), el('button', { type: 'button', class: 'btn quiet tiny', text: `✕ ${t('pr_m_del')}`, onclick: () => { ms.splice(i, 1); drawM(); } }))); }),
      ms.length < 12 ? el('button', { type: 'button', class: 'btn tiny pr-ex-add pr-m-add', text: `+ ${t('pr_m_add')}`, onclick: () => { ms.push({ id: newId(), name: '', steps: [{ upTo: 50, x: 1.5 }], beyond: 1 }); drawM(); } }) : null);
    drawM();
    const read = () => { const raw = cutIn.map((i) => Number(i.value)); if (!raw.every((v, i) => Number.isFinite(v) && (i === 0 || v > raw[i - 1]))) { toast(t('pr_bad_cuts')); return null; }
      if (ms.some((m) => !String(m.name).trim())) { toast(t('pr_m_noname')); return null; }
      if (ms.some((m) => m.steps.some((s, i) => i && !(s.upTo > m.steps[i - 1].upTo)))) { toast(t('pr_m_order')); return null; }
      return parseRules({ fw: Object.fromEntries(FACTORS.map((k) => [k, fwIn[k].value])), cuts: raw, speedX: spIn.value, cmpFast: Number(cf.value) / 100, cmpSlow: Number(cs.value) / 100, cmpFastX: cfx.value, cmpSlowX: csx.value, extras: ex.filter((e) => e.when.length), stack: stackSel.value, capPct: capIn.value, methods: ms }); };
    const plan = (nr) => { const patch = {}; for (const [k, x] of Object.entries(wt.tasks)) { if (!x.f || x.w !== baseFromFactors(x.f, R)) continue;   // a weight set by hand stays as it is
      const w = baseFromFactors(x.f, nr); if (w !== x.w) patch[k] = { ...x, w, ...(x.tier === tierFromBase(x.w) ? { tier: tierFromBase(w) } : {}) }; }
      for (const [k, x] of Object.entries(wt.tasks)) if (isCustomMode(x.mode) && !nr.methods.some((m) => m.id === x.mode)) patch[k] = { ...(patch[k] || x), mode: 'done' };   // a removed method: its types count «on completion», openly
      return patch; };
    const preview = el('div', { class: 'pr-preview' });
    const show = (nr) => { const patch = plan(nr), wNew = { ...wt, rules: nr, tasks: { ...wt.tasks, ...patch } }, ds = [...datasets].sort((x, y) => (y.range.to || '').localeCompare(x.range.to || ''))[0];
      const ch = Object.entries(patch).map(([k, x]) => el('li', { text: x.mode === 'done' && isCustomMode(wt.tasks[k].mode) ? t('pr_prev_gone', { n: clean(typeLabel(k, lang)), m: (R.methods.find((m) => m.id === wt.tasks[k].mode) || {}).name || wt.tasks[k].mode }) : t('pr_prev_type', { n: clean(typeLabel(k, lang)), a: wt.tasks[k].w, b: x.w }) }));
      let pts = null; if (ds) { const ppl = peopleOf(datasets), team = currentTeam(scoped(ppl), allTasks()), done = ds.tasks.filter((x) => x.state === 'done' && team.includes(x.assigneeId));
        pts = t('pr_prev_pts', { a: Math.round(done.reduce((s, x) => s + taskPoints(wt, x), 0)), b: Math.round(done.reduce((s, x) => s + taskPoints(wNew, x), 0)), n: done.length, f: ds.range.from, to: ds.range.to }); }
      set(preview, el('b', { text: t('pr_prev_h') }), ch.length ? el('ul', {}, ch.slice(0, 12)) : el('p', { class: 'hint', text: t('pr_prev_none') }), pts ? el('p', { class: 'pr-pts', text: pts }) : null,
        el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary', text: t('pr_apply'), onclick: async () => {
          weightsDevice = { ...(weightsDevice || {}), rules: nr, tasks: { ...((weightsDevice || {}).tasks || {}), ...patch } }; await store.putWeights(weightsDevice); toast(t('pr_applied')); renderWeights(); } }))); };
    editor = el('div', { class: 'pr-rules' },
      el('div', { class: 'pr-grid' }, FACTORS.map((k) => el('label', {}, el('span', { text: `${t('pr_fw')} — ${t(`factor_short_${k}`)}` }), fwIn[k])),
        ...cutIn.map((inp, i) => el('label', {}, el('span', { text: t('pr_cut_in', { b: i + 1 }) }), inp)),
        el('label', {}, el('span', { text: t('pr_speedx') }), spIn), el('label', {}, el('span', { text: t('pr_cf') }), cf), el('label', {}, el('span', { text: t('pr_cfx') }), cfx), el('label', {}, el('span', { text: t('pr_cs') }), cs), el('label', {}, el('span', { text: t('pr_csx') }), csx),
      ),
      el('h4', { class: 'pr-ex-h', text: t('pr_ex_h') }), el('p', { class: 'hint', text: t('pr_ex_hint') }), exBox,
      el('div', { class: 'pr-grid' }, el('label', {}, el('span', { text: t('pr_stack') }), stackSel), el('label', {}, el('span', { text: t('pr_cap') }), capIn)),
      el('h4', { class: 'pr-ex-h', text: t('pr_m_h') }), el('p', { class: 'hint', text: t('pr_m_hint') }), mBox,
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn', text: t('pr_preview'), onclick: () => { const nr = read(); if (nr) show(nr); } }),
        el('button', { type: 'button', class: 'btn quiet', text: t('pr_reset'), onclick: () => show(parseRules(null)) }),
        rulesAreDefault(R) ? null : el('span', { class: 'hint', text: t('pr_not_default') })),
      preview, el('p', { class: 'hint', text: t('pr_publish_note') }));
  }
  return el('details', { class: 'pr-box', open: '' }, el('summary', { text: t('pr_h') }), steps, calcBox, el('h3', { text: t('pr_rules_h') }), editor);
}
{ const withRules = (fn) => function weightsWithRules(...args) { const out = fn.apply(this, args);
    try { const body = $('weights-body'), wt = weights(), uid = (me && me.user ? me.user.id : null) || (!isTeamPortal ? managerIdOf() : null); if (body && wt) { const top = body.querySelector('.w-adv-top') || body; top.prepend(pointsRulesBox(wt, isWeightsAdmin(wt, uid))); if (!isTeamPortal) top.querySelector('.pr-box').after(typesBox(wt)); }
      // each cell carries its column's name, so on a phone a row reads as a card: the type on top, every field named under it (ADR-0049)
      if (body) body.querySelectorAll('table').forEach((tb) => { const hs = [...tb.querySelectorAll('thead th')].map((th) => th.textContent.trim()); tb.classList.add('w-cards');
        tb.querySelectorAll('tbody tr').forEach((tr) => [...tr.children].forEach((td, i) => { if (hs[i]) td.dataset.label = hs[i]; })); }); } catch (e) { console.error(e); }
    return out; };
  renderWeights = withRules(renderWeights); }
// ---------- what each tool does: a popup on hover, an ⓘ to tap on a phone (ADR-0051) ----------
const tipEl = () => document.getElementById('tool-tip') || document.body.appendChild(el('div', { id: 'tool-tip', role: 'tooltip', hidden: '' }));
function showTip(target, text) {
  const tp = tipEl(); tp.textContent = text; tp.hidden = false; tp.style.maxWidth = `${Math.min(320, innerWidth - 16)}px`;
  const r = target.getBoundingClientRect(), tr = tp.getBoundingClientRect();
  const left = Math.max(8, Math.min(innerWidth - tr.width - 8, r.left + r.width / 2 - tr.width / 2)); let top = r.bottom + 8; if (top + tr.height > innerHeight - 8) top = r.top - tr.height - 8;
  tp.style.left = `${left}px`; tp.style.top = `${Math.max(8, top)}px`;
}
const hideTip = () => { const tp = document.getElementById('tool-tip'); if (tp) { tp.hidden = true; tp.dataset.for = ''; } };
document.addEventListener('click', (e) => { if (!e.target.closest('.tip-i')) hideTip(); }); window.addEventListener('scroll', hideTip, { passive: true });
function attachTip(a, text, withButton = true) {
  if (!a || !text || a.dataset.tip) return; a.dataset.tip = text;
  a.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) showTip(a, text); }); a.addEventListener('mouseleave', hideTip);
  a.addEventListener('focus', () => showTip(a, text)); a.addEventListener('blur', hideTip);
  const key = a.getAttribute('href') || '';
  if (!withButton) return;   // a card that already shows its description needs no ⓘ
  a.after(el('button', { type: 'button', class: 'tip-i', 'aria-label': t('tip_what'), text: 'ⓘ', onclick: (e) => { e.preventDefault(); e.stopPropagation(); const tp = tipEl(); if (!tp.hidden && tp.dataset.for === key) hideTip(); else { showTip(e.currentTarget, text); tipEl().dataset.for = key; } } }));
}
function addTips() {
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
  const sysTip = new Map(SYSTEMS.map((x) => { const d = x.desc ? (x.desc[lang] || x.desc.en || x.desc.ar) : ''; const c = SYSTEM_CATEGORIES.find((k) => k.id === x.category);
    return [x.url, d || t('tip_none', { c: c ? L(c.name, lang) : '', d: `\u2066${host(x.url)}\u2069` })]; }));
  document.querySelectorAll('#systems a[href]').forEach((a) => attachTip(a, sysTip.get(a.getAttribute('href'))));
  for (const x of [...PRIMARY, ...MORE]) { const text = x.helps ? L(x.helps, lang) : x.desc ? L(x.desc, lang) : ''; if (!text) continue;
    document.querySelectorAll(`#view-tools a[href="#m-${x.id}"]${x.url ? `, #view-tools a[href="${x.url}"]` : ''}`).forEach((a) => attachTip(a, text, !a.closest('#primary'))); }
}
{ const withTips = (fn) => function toolsWithTips(...args) { const out = fn.apply(this, args); try { addTips(); } catch (e) { console.error(e); } return out; }; renderTools = withTips(renderTools); }
function renderHome() {
  const body = $('home-body'); if (!body) return;
  if (!datasets.length) { set(body, el('div', { class: 'cr-start' }, el('h2', { text: t('cr_start_h') }), el('p', { text: t('cr_start_b') }), el('a', { class: 'btn primary', href: '#data', text: `${t('cr_pull')} ↗` }))); return; }
  const tasks = allTasks(), wt = weights(), today = saudiDay(new Date().toISOString()), ro = roster().people || {};
  const ppl = peopleOf(datasets), team = currentTeam(scoped(ppl), tasks), nm = (id) => nameOf(ppl.find((p) => p.id === id) || {}, lang) || id;
  const latest = [...datasets].sort((x, y) => (y.range.to || '').localeCompare(x.range.to || ''))[0];
  const ageDays = Math.max(0, Math.round((Date.parse(today) - Date.parse(latest.range.to)) / 86400000)), fresh = ageDays <= 2;
  const inTeam = (x) => team.includes(x.assigneeId), mStart = `${today.slice(0, 7)}-01`;
  const prev = new Date(Date.parse(mStart) - 86400000).toISOString().slice(0, 10), pStart = `${prev.slice(0, 7)}-01`;
  const doneIn = (a2, b2) => tasks.filter((x) => inTeam(x) && x.state === 'done' && x.completedAt && saudiDay(x.completedAt) >= a2 && saudiDay(x.completedAt) <= b2);
  const doneM = doneIn(mStart, today), doneP = doneIn(pStart, prev), openNow = tasks.filter((x) => inTeam(x) && x.state === 'open');
  const hasPrev = datasets.some((d) => d.range && d.range.from <= pStart && d.range.to >= prev);   // ADR-0059: no «0» for a month the pull does not hold
  const load = {}; for (const pool of levelPools(team)) { const act = pool.filter((id) => !(ro[id] && ro[id].onLeave)); if (act.length) Object.assign(load, loadFor(tasks, act, today).people); }
  const red = team.filter((id) => load[id] && load[id].status === 'red');
  const qNext = quarterOf(today, 1), plans = devPlans[qNext.key] || {}, active = team.filter((id) => !(ro[id] && ro[id].onLeave));
  const noPlan = active.filter((id) => !(plans[id] && plans[id].status === 'agreed'));
  const old = openNow.filter((x) => x.createdAt && Date.now() - Date.parse(x.createdAt) > 7 * 86400000);
  const oldBy = [...old.reduce((m, x) => m.set(x.assigneeId, (m.get(x.assigneeId) || 0) + 1), new Map())].sort((x, y) => y[1] - x[1]);
  const pending = pendingList().length;
  const names = (ids) => ids.slice(0, 4).map(nm).join('، ') + (ids.length > 4 ? ` +${ids.length - 4}` : '');
  const go = (hash, prep) => () => { if (prep) prep(); location.hash = hash; };
  const att = [
    red.length && { k: 'red', title: t('cr_att_red', { n: red.length }), detail: names(red), href: '#dev' },
    noPlan.length && { k: 'plan', title: t('cr_att_plan', { n: noPlan.length, m: active.length, q: qNext.label }), detail: names(noPlan), href: '#dev', prep: () => { devQ = 'next'; pref('devq', 'next'); } },
    old.length && { k: 'old', title: t('cr_att_old', { n: old.length }), detail: oldBy.slice(0, 3).map(([id, n]) => `${nm(id)} ${n}`).join('، '), href: '#kpi', prep: () => { kpiMore = true; } },
    pending && { k: 'pending', title: t('cr_att_pending', { n: pending }), detail: '', href: '#team' },
    (() => { const f = newTypes(wt); return f.length ? { k: 'types', title: t('cr_att_types', { n: f.length }), detail: f.slice(0, 4).join('، '), href: '#weights' } : null; })(),
    (() => { const od = orgData(); if (!od) return null; const r = orgRootId(od); if (!r) return null; const fa = Object.keys(roster().people || {}).some((id) => od.org.hasRow(id)), c = fa ? compareOrg(od.org, roster(), r) : { leader: [], missingInFile: [], notInOrg: [], inactive: [], unmatched: od.org.unmatchedUnder(r) }, n = c.leader.length + c.missingInFile.length + c.notInOrg.length + c.inactive.length + c.unmatched.length; return n ? { k: 'org', title: t('cr_att_org', { n }), detail: '', href: '#team' } : null; })(),
  ].filter(Boolean);
  const num = (k, v, sub) => el('div', { class: 'cr-num' }, el('span', { text: t(k) }), el('b', { text: String(v) }), sub ? el('small', { text: sub }) : null);
  const job = (label, hash, prep) => el('button', { type: 'button', class: 'cr-job', onclick: go(hash, prep) }, el('b', { text: label }), el('span', { text: '↗' }));
  set(body,
    el('div', { class: `cr-fresh ${fresh ? 'ok' : 'old'}` },
      el('div', {}, el('span', { class: 'cr-k', text: t('cr_fresh_h') }), el('b', { text: fresh ? t('cr_fresh_ok', { to: latest.range.to }) : t('cr_fresh_old', { to: latest.range.to, n: ageDays }) }),
        el('small', { text: t('cr_fresh_meta', { n: tasks.length.toLocaleString('en-US'), d: (latest.extractedAt || '').slice(0, 10) }) })),
      el('a', { class: `btn${fresh ? '' : ' primary'}`, href: '#data', text: `${t('cr_pull_again')} ↗` })),
    el('p', { class: 'answer-line', text: t('cr_answer', { d: doneM.length, p: Math.round(doneM.reduce((s, x) => s + taskPoints(wt, x), 0)), o: openNow.length, old: old.length, n: team.length }) }),
    el('div', { class: 'cr-nums' }, num('cr_nums_done', doneM.length, hasPrev ? t('cr_nums_last', { n: doneP.length }) : t('cr_nums_nolast')), num('cr_nums_points', Math.round(doneM.reduce((s, x) => s + taskPoints(wt, x), 0)), hasPrev ? t('cr_nums_last', { n: Math.round(doneP.reduce((s, x) => s + taskPoints(wt, x), 0)) }) : t('cr_nums_nolast')),
      num('cr_nums_open', openNow.length, old.length ? t('cr_nums_old', { n: old.length }) : ''), num('cr_nums_team', team.length, '')),
    el('h2', { class: 'cr-h', text: t('cr_att_h') }),
    att.length ? el('div', { class: 'cr-att' }, att.map((x) => el('button', { type: 'button', class: `cr-item k-${x.k}`, onclick: go(x.href, x.prep) },
      el('div', {}, el('b', { text: x.title }), x.detail ? el('span', { text: x.detail }) : null), el('span', { class: 'cr-go', text: `${t('cr_go')} ↗` }))))
      : el('div', { class: 'cr-calm', text: t('cr_att_none') }),
    el('h2', { class: 'cr-h', text: t('cr_jobs_h') }),
    el('div', { class: 'cr-jobs' }, job(t('kpi_board'), '#kpi'), job(t('nav_dev'), '#dev'), job(t('nav_team'), '#team'),
      job(t('cr_job_reports'), '#kpi', () => { kpiMore = true; }), job(t('cr_job_viewas'), '#kpi')));
}
function renderDev() {
  const body = $('dev-body'); if (!body) return;
  if (!datasets.length) { set(body, el('div', { class: 'empty' }, t('dev_no_data'), ' ', el('a', { href: '#data', text: t('nav_data') }))); return; }
  const ds = datasets.find((d) => d.key === kpiKey) || datasets[0], tasks = allTasks(), wt = weights();
  const peopleById = new Map(peopleOf(datasets).map((p) => [p.id, p])), team = currentTeam(scoped(peopleOf(datasets)), tasks), nm = (id) => nameOf(peopleById.get(id), lang) || id;
  const today = saudiDay(new Date().toISOString()), qPlan = quarterOf(today, devQ === 'next' ? 1 : 0), qBase = quarterOf(qPlan.from, -1);
  const { levels } = levelsFor(tasks, team, today, mailRows), ro = roster().people || {};
  const load = {}; for (const pool of levelPools(team)) { const act = pool.filter((id) => !(ro[id] && ro[id].onLeave)); if (act.length) Object.assign(load, loadFor(tasks, act, today).people); }
  const plansQ = devPlans[qPlan.key] || {};
  const progOf = (id) => { const p = plansQ[id]; return p && p.goals.length ? planProgress(quarterGoalProgress(tasks, wt, id, qPlan, p.goals)) : null; };
  const ring = (pct) => el('div', { class: 'ring', style: `--p:${pct == null ? 0 : pct}` }, el('b', { text: pct == null ? '—' : `${pct}%` }));
  const weakest = (lv) => (lv && lv.axes ? Object.entries(lv.axes).filter(([, v]) => v != null).sort((x, y) => x[1] - y[1])[0] : null);
  if (!devSel || !team.includes(devSel)) devSel = team[0];
  const qPick = el('div', { class: 'pills' }, [['cur', quarterOf(today, 0)], ['next', quarterOf(today, 1)]].map(([k, q]) => el('button', { type: 'button', class: `pill-btn${devQ === k ? ' on' : ''}`, text: `${t(k === 'next' ? 'dev_q_next' : 'dev_q_cur')} — ${q.label}`, onclick: () => { devQ = k; pref('devq', k); renderDev(); } })));
  const cards = makeSortable(el('div', { class: 'dev-cards' }, sortByOrder(team, 'dev-people').map((id) => { const lv = levels[id], w = weakest(lv), p = plansQ[id], L2 = load[id];
    return el('button', { type: 'button', 'data-id': id, class: `dev-card${devSel === id ? ' on' : ''}`, onclick: () => { devSel = id; pref('devsel', id); renderDev(); } },
      el('div', { class: 'dc-top' }, el('div', {}, el('b', { text: nm(id) }), el('span', { class: 'hint', text: positionOf(ro[id] || {}) || (peopleById.get(id) || {}).position || '' })), ring(progOf(id))),
      el('div', { class: 'dc-tags' }, lv && lv.level ? el('span', { class: `level-pill l${lv.level}`, text: `${lv.level} · ${t(`lvl_${LEVELS[lv.level - 1].k}`)}` }) : el('span', { class: 'hint', text: ro[id] && ro[id].onLeave ? t('card_on_leave') : t('lvl_early') }),
        lv && lv.trend ? el('span', { class: 'dc-trend', text: { up: '▲', down: '▼', steady: '■' }[lv.trend] }) : null, L2 ? el('span', { class: `dc-load s-${L2.status}`, text: t(`rep_load_${L2.status}`) }) : null),
      el('small', { class: 'hint', text: [w ? t('dev_weak', { a: t(`axis_${w[0]}`) }) : '', p ? t('dev_goals_n', { n: p.goals.length }) : t('dev_no_plan'), p && p.status === 'agreed' ? t('dev_agreed') : ''].filter(Boolean).join(' · ') })); })), 'dev-people');
  set(body, el('div', { class: 'row dev-head' }, qPick, el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn tiny', text: `⬇ ${t('proj_excel')}`, onclick: () => devXlsx(team, nm, qPlan) }), el('span', { class: 'hint', text: t('dev_base_from', { q: qBase.label }) }))),
    cards, devPanel(devSel, (devCtx = { tasks, wt, nm, team, levels, load, qPlan, qBase, peopleById })),
    el('details', { class: 'tucked' }, el('summary', { text: t('dev_month_h') }), kpiMapPlanSection(ds, team, peopleById)));   // folded: each person's plan is in their file
}
function devPanel(id, ctx) {
  if (!id) return null;
  const { tasks, wt, nm, team, levels, qPlan, qBase } = ctx, plan = devPlanOf(qPlan.key, id), base = quarterBaseline(tasks, wt, id, qBase), lv = levels[id];
  const prog = quarterGoalProgress(tasks, wt, id, qPlan, plan.goals), total = planProgress(prog);
  const save = async () => { await devSave(); devRefresh(); };
  const label = (g) => (g.metric === 'type' ? typeLabel(g.type, lang) || g.type : g.metric === 'custom' ? g.title || t('dev_m_custom') : t(`dev_m_${g.metric}`));
  const fmt = (m, v) => (v == null ? '—' : m === 'rate' ? `${Math.round(v * 100)}%` : m === 'avgHours' ? formatHours(v, lang) : m === 'custom' ? `${v}%` : String(v));
  const typeOpts = Object.keys(wt.tasks || {});
  const suggest = async () => { const s = suggestQuarterGoals(base, lv); const have = new Set(plan.goals.map((g) => `${g.metric}:${g.type || ''}`));
    for (const g of s) if (!have.has(`${g.metric}:${g.type || ''}`)) plan.goals.push({ ...g, id: `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}` });
    if (!plan.buddy) { const dp = developmentPlan(levels, id).find((x) => x.buddy); if (dp) plan.buddy = dp.buddy; } toast(t('dev_suggested')); await save(); };
  const addGoal = async (metric) => { plan.goals.push({ id: `g${Date.now().toString(36)}`, metric, type: metric === 'type' ? typeOpts[0] : '', title: '', base: metric === 'type' ? 0 : metric === 'custom' ? 0 : base[metric], target: metric === 'rate' ? 0.9 : metric === 'custom' ? 100 : 1, weight: 1, pct: 0 }); await save(); };
  const goalRow = (g, p) => el('tr', { 'data-id': g.id },
    el('td', {}, g.metric === 'type' ? el('select', { onchange: async (e) => { g.type = e.target.value; g.base = (base.types.find((x) => x.k === g.type) || { n: 0 }).n; await save(); } }, typeOpts.map((k) => el('option', { value: k, selected: g.type === k ? '' : null, text: typeLabel(k, lang) || k })))
      : g.metric === 'custom' ? el('input', { type: 'text', value: g.title || '', placeholder: t('dev_custom_ph'), onchange: async (e) => { g.title = e.target.value.slice(0, 120); await save(); } }) : el('span', { text: label(g) }),
      g.weak ? el('span', { class: 'dev-weak', text: t('dev_weak_tag') }) : null),
    el('td', { class: 'num', text: g.metric === 'custom' ? '—' : fmt(g.metric, g.base) }),
    el('td', { class: 'num' }, el('input', { type: 'number', step: g.metric === 'rate' ? '0.01' : g.metric === 'avgHours' ? '0.5' : '1', min: '0', value: g.target, onchange: async (e) => { g.target = Number(e.target.value) || 0; await save(); } })),
    el('td', { class: 'num' }, el('input', { type: 'number', min: '1', max: '5', step: '1', value: g.weight || 1, onchange: async (e) => { g.weight = Math.max(1, Math.min(5, Number(e.target.value) || 1)); await save(); } })),
    el('td', { class: 'num' }, g.metric === 'custom' ? el('input', { type: 'range', min: '0', max: '100', step: '5', value: g.pct || 0, onchange: async (e) => { g.pct = Number(e.target.value); await save(); } }) : el('span', { text: fmt(g.metric, p.got) })),
    el('td', {}, el('div', { class: 'gbar' }, el('i', { style: `width:${p.pct}%`, class: p.met ? 'met' : '' })), el('small', { text: `${p.pct}%` })),
    el('td', {}, el('button', { type: 'button', class: 'icon-btn', title: t('proj_delete'), text: '✕', onclick: async () => { plan.goals = plan.goals.filter((x) => x.id !== g.id); await save(); } })));
  const months = qPlan.months.map((ym) => { const b = meetBlock(ym, id, tasks, true, nm(id), typeOpts.map((k) => [k, typeLabel(k, lang) || k])); return el('div', { class: 'dev-month' }, el('h4', { text: monthLabel(ym) }), b || el('p', { class: 'hint', text: t('dev_month_none') })); });
  return el('section', { class: 'dev-panel' },
    el('div', { class: 'dp-head' }, el('div', {}, el('h2', { style: 'margin:0', text: nm(id) }), el('span', { class: 'hint', text: t('dev_plan_for', { q: qPlan.label, b: qBase.label }) })),
      el('div', { class: 'row' }, el('div', { class: 'ring big', style: `--p:${total == null ? 0 : total}` }, el('b', { text: total == null ? '—' : `${total}%` })),
        el('button', { type: 'button', class: `btn tiny${plan.status === 'agreed' ? ' primary' : ''}`, text: plan.status === 'agreed' ? `✓ ${t('dev_agreed')}` : t('dev_mark_agreed'), onclick: async () => { plan.status = plan.status === 'agreed' ? 'draft' : 'agreed'; plan.agreedAt = plan.status === 'agreed' ? today0() : ''; await save(); } }),
        el('button', { type: 'button', class: 'btn tiny', text: `🖨 ${t('proj_pdf')}`, onclick: () => devPdf(id, ctx) }),
        el('button', { type: 'button', class: 'btn tiny', text: `${t('km_row_link')} ↗`, onclick: () => openPerson(id) }))),
    el('div', { class: 'dp-grid' },
      el('div', { class: 'card' }, el('h3', { text: t('dev_base_h', { q: qBase.label }) }),
        el('div', { class: 'cmp-grid' }, [['dev_m_done', base.done], ['dev_m_points', base.points], ['dev_m_avgHours', fmt('avgHours', base.avgHours)], ['dev_m_rate', fmt('rate', base.rate)]].map(([k, v]) => el('div', { class: 'cmp' }, el('span', { class: 'cmp-k', text: t(k) }), el('b', { class: 'cmp-v', text: String(v) })))),
        base.types.length ? el('p', { class: 'hint', text: t('dev_top_types', { l: base.types.slice(0, 4).map((x) => `${typeLabel(x.k, lang) || x.k} ${x.n}`).join(' · ') }) }) : null,
        lv && lv.axes ? el('div', { class: 'dev-axes' }, AXES.map((k) => el('div', {}, el('span', { text: t(`axis_${k}`) }), el('i', {}, el('b', { style: `width:${lv.axes[k] || 0}%` })), el('small', { text: lv.axes[k] == null ? '—' : String(lv.axes[k]) })))) : el('p', { class: 'hint', text: t('lvl_early') })),
      el('div', { class: 'card' }, el('h3', { text: t('dev_growth_h') }),
        el('label', { class: 'dev-f' }, el('span', { text: t('dev_buddy') }), el('select', { onchange: async (e) => { plan.buddy = e.target.value; await save(); } }, [el('option', { value: '', text: '—' }), ...team.filter((x) => x !== id).map((x) => el('option', { value: x, selected: plan.buddy === x ? '' : null, text: nm(x) }))])),
        el('label', { class: 'dev-f' }, el('span', { text: t('dev_actions') }), el('textarea', { rows: '3', placeholder: t('dev_actions_ph'), onchange: async (e) => { plan.actions = e.target.value.slice(0, 1000); await devSave(); } }, plan.actions || '')),
        el('label', { class: 'dev-f' }, el('span', { text: t('dev_note') }), el('textarea', { rows: '2', onchange: async (e) => { plan.note = e.target.value.slice(0, 1000); await devSave(); } }, plan.note || '')))),
    el('div', { class: 'row dev-goals-head' }, el('h3', { style: 'margin:0', text: t('dev_goals_h') }),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary tiny', text: `✨ ${t('dev_suggest')}`, onclick: suggest }),
        el('select', { class: 'btn tiny', onchange: (e) => { if (e.target.value) addGoal(e.target.value); e.target.value = ''; } }, [el('option', { value: '', text: `＋ ${t('dev_add_goal')}` }), ...GOAL_METRICS.map((m) => el('option', { value: m, text: t(`dev_m_${m}`) }))]))),
    plan.goals.length ? el('div', { class: 'table-wrap fit' }, el('table', { class: 'proj-tbl dev-goals' }, el('colgroup', {}, ['28%', '11%', '12%', '8%', '13%', '22%', '6%'].map((w) => el('col', { style: `width:${w}` }))),
      el('thead', {}, el('tr', {}, ['dev_c_goal', 'dev_c_base', 'dev_c_target', 'dev_c_weight', 'dev_c_got', 'dev_c_prog', ''].map((k) => el('th', { text: k ? t(k) : '' })))),
      makeSortable(el('tbody', {}, plan.goals.map((g, n) => goalRow(g, prog[n]))), `dev-goals-${id}`))) : el('div', { class: 'empty', text: t('dev_goals_none') }),
    el('details', { class: 'tucked', open: '' }, el('summary', { text: t('dev_follow_h', { q: qPlan.label }) }), el('div', { class: 'dev-months' }, months)));
}
const today0 = () => saudiDay(new Date().toISOString());
async function devXlsx(team, nm, qPlan) {
  let X; try { X = await loadXlsx(); } catch { toast(t('proj_x_fail')); return; }
  const tasks = allTasks(), wt = weights(), rows = [];
  for (const id of team) { const p = (devPlans[qPlan.key] || {})[id]; if (!p) continue; const pr = quarterGoalProgress(tasks, wt, id, qPlan, p.goals);
    for (const g of pr) rows.push({ [t('col_person')]: nm(id), [t('dev_c_goal')]: g.metric === 'type' ? (typeLabel(g.type, lang) || g.type) : g.metric === 'custom' ? (g.title || t('dev_m_custom')) : t(`dev_m_${g.metric}`), [t('dev_c_base')]: g.base ?? '', [t('dev_c_target')]: g.target, [t('dev_c_weight')]: g.weight || 1, [t('dev_c_got')]: g.got ?? '', [t('dev_c_prog')]: `${g.pct}%`, [t('dev_status')]: p.status === 'agreed' ? t('dev_agreed') : t('dev_draft'), [t('dev_buddy')]: p.buddy ? nm(p.buddy) : '' }); }
  if (!rows.length) { toast(t('dev_x_empty')); return; }
  const wb = X.utils.book_new(), ws = X.utils.json_to_sheet(rows); ws['!views'] = [{ RTL: lang !== 'en' }]; X.utils.book_append_sheet(wb, ws, qPlan.label); X.writeFile(wb, `AFAQY-development-${qPlan.key}.xlsx`);
}
function devPdf(id, ctx) {
  const { tasks, wt, nm, levels, qPlan, qBase } = ctx, plan = devPlanOf(qPlan.key, id), base = quarterBaseline(tasks, wt, id, qBase), pr = quarterGoalProgress(tasks, wt, id, qPlan, plan.goals), lv = levels[id];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]), fontUrl = (f) => new URL(`assets/fonts/${f}`, location.href).href;
  const fmt = (m, v) => (v == null ? '—' : m === 'rate' ? `${Math.round(v * 100)}%` : m === 'avgHours' ? formatHours(v, lang).replace(/[\u2066-\u2069]/g, '') : m === 'custom' ? `${v}%` : String(v));
  const name = (g) => (g.metric === 'type' ? typeLabel(g.type, lang) || g.type : g.metric === 'custom' ? g.title || t('dev_m_custom') : t(`dev_m_${g.metric}`));
  const html = `<!doctype html><html lang="${lang}" dir="${lang !== 'en' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${esc(t('dev_pdf_title'))} — ${esc(nm(id))}</title><style>
  @font-face{font-family:NS;src:url('${fontUrl('NotoSansArabic-Regular.woff2')}')}@font-face{font-family:NS;font-weight:700;src:url('${fontUrl('NotoSansArabic-Bold.woff2')}')}
  body{margin:0;font-family:NS,'Segoe UI',Tahoma,sans-serif;color:#1C1E3D;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:14mm}header{display:flex;align-items:center;gap:14px;border-bottom:4px solid #2A7130;padding-bottom:10px;margin-bottom:14px}header img{height:34px}h1{margin:0;font-size:21px}h2{font-size:15px;margin:16px 0 8px;border-inline-start:5px solid #2A7130;padding-inline-start:8px}
  .k{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.k div{background:#F1F5F8;border-radius:10px;padding:10px;border-top:4px solid #0E7C86}.k b{display:block;font-size:20px}.k .t{border-top-color:#2A7130}
  table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1C1E3D;color:#FFFFFF;padding:6px;text-align:start}td{padding:6px;border-bottom:1px solid #E3EAF0}.bar{height:8px;background:#E3EAF0;border-radius:4px;overflow:hidden}.bar i{display:block;height:8px;background:#2A7130}
  .box{border:1px solid #E3EAF0;border-radius:10px;padding:10px;white-space:pre-wrap;font-size:12.5px}.sig{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:30px;font-size:12px}.sig div{border-top:1px solid #8797A3;padding-top:6px}@page{size:A4;margin:0}</style></head><body><section class="page">
  <header><img src="${logoDataUrl()}" alt="AFAQY"><div><h1>${esc(t('dev_pdf_title'))} — ${esc(nm(id))}</h1><div>${esc(qPlan.label)} · ${esc(plan.status === 'agreed' ? `${t('dev_agreed')} ${plan.agreedAt || ''}` : t('dev_draft'))}</div></div></header>
  <h2>${esc(t('dev_base_h', { q: qBase.label }))}</h2><div class="k"><div><b>${base.done}</b>${esc(t('dev_m_done'))}</div><div><b>${base.points}</b>${esc(t('dev_m_points'))}</div><div><b>${esc(fmt('avgHours', base.avgHours))}</b>${esc(t('dev_m_avgHours'))}</div><div><b>${esc(fmt('rate', base.rate))}</b>${esc(t('dev_m_rate'))}</div><div class="t"><b>${planProgress(pr) ?? '—'}${planProgress(pr) == null ? '' : '%'}</b>${esc(t('dev_c_prog'))}</div></div>
  ${lv && lv.level ? `<p>${esc(t('rep_level'))}: ${lv.level} · ${esc(t(`lvl_${LEVELS[lv.level - 1].k}`))} — ${AXES.map((k) => `${esc(t(`axis_${k}`))} ${lv.axes[k] ?? '—'}`).join(' · ')}</p>` : ''}
  <h2>${esc(t('dev_goals_h'))}</h2><table><thead><tr><th>${esc(t('dev_c_goal'))}</th><th>${esc(t('dev_c_base'))}</th><th>${esc(t('dev_c_target'))}</th><th>${esc(t('dev_c_weight'))}</th><th>${esc(t('dev_c_got'))}</th><th>${esc(t('dev_c_prog'))}</th></tr></thead><tbody>
  ${pr.map((g) => `<tr><td>${esc(name(g))}</td><td>${esc(g.metric === 'custom' ? '—' : fmt(g.metric, g.base))}</td><td>${esc(fmt(g.metric, g.target))}</td><td>${g.weight || 1}</td><td>${esc(fmt(g.metric, g.got))}</td><td><div class="bar"><i style="width:${g.pct}%"></i></div>${g.pct}%</td></tr>`).join('')}</tbody></table>
  <h2>${esc(t('dev_growth_h'))}</h2><p>${esc(t('dev_buddy'))}: ${esc(plan.buddy ? nm(plan.buddy) : '—')}</p>${plan.actions ? `<div class="box">${esc(plan.actions)}</div>` : ''}${plan.note ? `<p class="box">${esc(plan.note)}</p>` : ''}
  <div class="sig"><div>${esc(t('dev_sig_emp'))}</div><div>${esc(t('dev_sig_mgr'))}</div></div></section></body></html>`;
  openReport(html, 'pdf', `AFAQY-development-${qPlan.key}-${id}`);
}
function kpiMapPlanSection(ds, team, peopleById) { const ym = ds.range.to.slice(0, 7); const tm = memoTasks(allTasks(), ['teamMonth', team.join(','), ym, reports.length], () => teamMonth(cardCtxFromDatasets(team), ym)); const nmB = (id) => (nameOf(peopleById.get(id), lang) || id);
      const max = Math.max(1, ...tm.heat.flatMap((h) => TIERS.map((k) => h[k])));
      const cell = (v) => el('td', { class: 'num heat', style: `--heat:${(v / max).toFixed(2)}`, text: v ? String(v) : '' });
      return [el('h2', { id: 'k-map' }, t('heat_h', { m: monthLabel(ym) }), helpQ('help_heat')),
        el('div', { class: 'table-wrap' }, el('table', { class: 'heatmap' },
          el('thead', {}, el('tr', {}, el('th', { text: t('col_person') }), ...TIERS.map((k) => el('th', { class: 'num', text: t(`tier_short_${k}`) })), el('th', { class: 'num', text: t('card_points') }), el('th', { text: t('card_arch') }))),
          el('tbody', {}, tm.cards.sort((x, y) => y.points - x.points).map((c) => el('tr', {}, el('td', { text: nmB(c.personId) }), ...TIERS.map((k) => cell(c.tiers.mine[k])), el('td', { class: 'num', text: String(c.points) }), el('td', { text: t(`arch_${c.archetype}`) })))))),
        el('h2', { id: 'k-plan' }, t('plan_h'), helpQ('help_plan')),
        tm.plan.length ? makeSortable(el('div', { class: 'cards-grid' }, sortByOrder(tm.plan.map((p) => p.id), 'plan').map((id) => { const c = tm.cards.find((x) => x.personId === id); const n = renderCard(c, nmB(id), { showRank: true, showSuggestions: true, compact: true }); if (n) n.dataset.id = id; return n; })), 'plan') : el('div', { class: 'empty', text: t('plan_none') })]; }
function coverageSection(rep, team, nm) { const cv = coverageTotals(rep, team); if (!cv.people.length && !cv.total.accounts) return null;
      const maxA = Math.max(1, ...cv.people.map((r) => r.accounts));
      return [el('h2', {}, t('f5_title'), helpQ('help_f5')), el('p', { class: 'hint', text: t('f5_sub', { n: cv.total.accounts, d: cv.total.devices, u: cv.total.uncovered, z: cv.total.zeroDevices }) }),
        cv.people.length ? el('div', { class: 'table-wrap' }, el('table', {},
          el('thead', {}, el('tr', {}, ['col_person', 'f5_accounts', 'f5_devices', 'f5_solo', 'f5_touched'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
          el('tbody', {}, cv.people.map((r) => el('tr', {}, el('td', { text: nm(r.id) }),
            el('td', { class: 'num' }, el('div', { class: 'bar-cell' }, el('b', { text: String(r.accounts) }), el('i', {}, el('span', { style: `width:${Math.round((r.accounts / maxA) * 100)}%` })))),
            el('td', { class: 'num', text: String(r.devices) }), el('td', { class: 'num', text: String(r.solo) }),
            el('td', { class: 'num', text: r.accounts ? `${r.touched} · ${Math.round((r.touched / r.accounts) * 100)}%` : '—' })))))) : el('div', { class: 'empty', text: t('f5_none') })]; }
// ---------- ADR-0070: the one place for «who did what in a month» ----------
// The board is chosen by MONTH, not by pull: a quarter pull gives three months, and pulls that overlap give each month
// once (allTasks() and allActivities() keep every record once). Every number here comes from factor1 (the three sources
// and the time to close) and weightedPoints (points) — the engine every other page reads. An employee has no page of his
// own: his row opens in place, this month against the month before.
let kpiMonth = pref('kpimonth') || null, kpiOpen = null, kpiMore = false, kpiMSort = 'points';
function allActivities() {
  const seen = new Set();
  return [...reports].sort((a, b) => String(b.extractedAt || '').localeCompare(String(a.extractedAt || '')))
    .flatMap((r) => r.activities || [])
    .filter((x) => { const k = x.id || `${x.createdById}|${x.createdAt}|${x.category}`; if (seen.has(k)) return false; seen.add(k); return true; });
}
const prevMonthOf = (ym) => { const [y, m] = ym.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; };
const monthRangeOf = (ym) => ({ from: `${ym}-01`, to: monthLast(ym) });
const hmOf = (h) => (h == null ? '—' : (() => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; })());
/** The months the pulls cover, newest first, each with how many of its days (up to today) a pull covers. */
function pulledMonths(ranges = datasets.map((d) => d.range)) {
  const today = saudiDay(new Date().toISOString()), days = new Set();
  for (const r of ranges) {
    if (!r || !r.from || !r.to) continue;
    for (let x = Date.parse(`${r.from}T00:00:00Z`), end = Date.parse(`${r.to}T00:00:00Z`); x <= end; x += 86400000) days.add(new Date(x).toISOString().slice(0, 10));
  }
  const yms = [...new Set([...days].map((s) => s.slice(0, 7)))].sort().reverse();
  return yms.map((ym) => {
    const last = monthLast(ym) < today ? monthLast(ym) : today; let need = 0, got = 0;
    for (let x = Date.parse(`${ym}-01T00:00:00Z`), end = Date.parse(`${last}T00:00:00Z`); x <= end; x += 86400000) { need++; if (days.has(new Date(x).toISOString().slice(0, 10))) got++; }
    return { ym, got, need: Math.max(need, 1), whole: got >= need };
  }).filter((m) => m.got > 0);
}
// ---------- ADR-0074: a period is a month (2026-10) or a quarter (2026-Q4); every KPI page compares it with the one before ----------
let kmKind = pref('kmkind') === 'quarter' ? 'quarter' : 'month';
const qOf = (ym) => { const [y, m] = ym.split('-').map(Number); return `${y}-Q${Math.ceil(m / 3)}`; };
const isQ = (k) => /-Q[1-4]$/.test(String(k));
const periodRangeOf = (k) => { if (!isQ(k)) return monthRangeOf(k); const [y, q] = k.split('-Q').map(Number), m1 = (q - 1) * 3 + 1;
  return { from: `${y}-${String(m1).padStart(2, '0')}-01`, to: monthLast(`${y}-${String(m1 + 2).padStart(2, '0')}`) }; };
const prevPeriodOf = (k) => { if (!isQ(k)) return prevMonthOf(k); let [y, q] = k.split('-Q').map(Number); q -= 1; if (!q) { q = 4; y -= 1; } return `${y}-Q${q}`; };
const periodLabel = (k) => (isQ(k) ? t('km_q_label', { q: k.split('-Q')[1], y: k.split('-Q')[0] }) : monthLabel(k));
/** The months or the quarters the pulls cover, newest first. A quarter is whole when each of its months up to today is pulled whole. */
function pulledPeriods(kind = kmKind, ranges = datasets.map((d) => d.range)) {
  const ms = pulledMonths(ranges); if (kind !== 'quarter') return ms;
  const today = saudiDay(new Date().toISOString()), by = new Map();
  for (const m of ms) { const q = qOf(m.ym), x = by.get(q) || { ym: q, got: 0, need: 0, whole: true, seen: new Set() }; x.got += m.got; x.need += m.need; x.whole = x.whole && m.whole; x.seen.add(m.ym); by.set(q, x); }
  for (const x of by.values()) {
    const r = periodRangeOf(x.ym);
    for (let d = new Date(`${r.from}T00:00:00Z`); d.toISOString().slice(0, 10) <= r.to && d.toISOString().slice(0, 10) <= today; d.setUTCMonth(d.getUTCMonth() + 1)) {
      const ym = d.toISOString().slice(0, 7); if (x.seen.has(ym)) continue;
      const last = monthLast(ym) < today ? monthLast(ym) : today; x.whole = false; x.need += Number(last.slice(8, 10));   // a month of the quarter nobody pulled
    }
    delete x.seen;
  }
  return [...by.values()].sort((p, q) => q.ym.localeCompare(p.ym));
}
/** The «month | quarter» switch both KPI pages carry; one choice for both, kept on this device. */
const kindPills = (redraw) => el('div', { class: 'pills km-kind' }, [['month', 'km_kind_month'], ['quarter', 'km_kind_quarter']].map(([k, l]) =>
  el('button', { type: 'button', class: `pill-btn${kmKind === k ? ' on' : ''}`, 'data-kind': k, text: t(l), onclick: () => { if (kmKind === k) return; kmKind = k; pref('kmkind', k); kpiMonth = null; meMonth = null; redraw(); } })));
/** ADR-0075: R&D is known for a period only when every pull that touches it carries the R&D queue's list (the button's pull does). */
const rdKnownFor = (range) => { const ds = datasets.filter((d) => d.range && d.range.from <= range.to && d.range.to >= range.from); return ds.length > 0 && ds.every((d) => d.rdKnown); };
/** One person's (or the team's) month in the numbers this page shows. */
function monthNumbers(f, wp, id) {
  const r = id === 'team' ? f.team : f.people.find((x) => x.id === id);
  if (!r) return null;
  const s = (k) => (r.bySource && r.bySource[k] ? r.bySource[k].received : 0);
  return { email: s('email'), self: s('self'), other: s('other'), total: r.assigned, closed: r.cohortClosed, avg: r.cohortAvgHours, rd: r.rd || 0,
    points: Math.round((id === 'team' ? wp.total : (wp.byId.get(id) || { total: 0 }).total) * 10) / 10 };
}
const KM_DEFS = ['km_def_recv', 'km_def_src', 'km_def_avg', 'km_def_rd', 'km_def_pts', 'km_def_month'];
/** A change beside a number: neutral for what arrived (n), green/red for what was done (h: higher is better, l: lower is better). */
function kmDelta(a, b, kind, pml) {
  if (a == null || b == null) return null;
  const d = Math.round((a - b) * 10) / 10; if (!d) return el('small', { class: 'km-dl eq', title: t('km_vs', { m: pml }), text: '=' });
  const good = kind === 'l' ? d < 0 : d > 0, cls = kind === 'n' ? 'nt' : good ? 'up' : 'down';
  return el('small', { class: `km-dl ${cls}`, title: t('km_vs', { m: pml }), text: `${d > 0 ? '▲' : '▼'} ${kind === 'l' ? hmOf(Math.abs(d)) : Math.abs(d)}` });
}
/** ADR-0072: one person's month — the same view, from the same engine, in a row of «مؤشرات الفريق» and on «مؤشراتي». */
function personMonthView({ id, tasks, acts = [], months, ym, head = '', share = null, actions = null }) {
  const wt = weights(), pm = prevPeriodOf(ym), hasPrev = months.some((m) => m.ym === pm), ml = periodLabel(ym), pml = periodLabel(pm);
  const ZERO = { email: 0, self: 0, other: 0, total: 0, closed: 0, avg: null, points: 0 };
  const one = (y) => { const r = periodRangeOf(y); return monthNumbers(factor1(tasks, { range: r, team: [id] }), weightedPoints(tasks, acts, wt, { range: r, team: [id] }), id) || ZERO; };
  const n = one(ym), p = hasPrev ? one(pm) : null;
  const rdOn = rdKnownFor(periodRangeOf(ym));
  const rows = [['src_email', 'email', 'n'], ['src_self', 'self', 'n'], ['src_other', 'other', 'n'], ['km_total', 'total', 'n'], ['km_closed', 'closed', 'h'], ['km_avg', 'avg', 'l'], ...(rdOn ? [['km_rd', 'rd', 'n']] : []), ['col_points', 'points', 'h']];
  const fmt = (k, v) => (k === 'avg' ? hmOf(v) : String(v ?? '—'));
  const hist = months.slice(0, 6).map((m) => ({ m, x: one(m.ym) }));
  // every open task, newest first — six shown, the rest one fold away (as «My KPIs» always listed them)
  const open = openTasks(tasks, id).sort((x, y) => String(y.createdAt || '').localeCompare(String(x.createdAt || '')));
  const item = (x) => el('li', {}, el('span', { text: x.title || typeLabel(x.type || '', lang) || '—' }),
    el('small', { class: 'hint', text: x.ageHours == null ? '' : t(x.ageHours < 48 ? 'hours' : 'days', { n: Math.round(x.ageHours < 48 ? x.ageHours : x.ageHours / 24) }) }));
  return el('div', { class: 'km-detail' }, head ? el('p', { class: 'hint km-head', text: head }) : null,
    el('div', { class: 'km-cmp' }, el('table', {},
      el('thead', {}, el('tr', {}, el('th', {}), el('th', { class: 'num', text: ml }), el('th', { class: 'num', text: pml }), el('th', { class: 'num', text: t('km_change') }), el('th', {}))),
      el('tbody', {}, rows.map(([lab, k, kind]) => el('tr', {}, el('td', { text: t(lab) }), el('td', { class: 'num' }, el('b', { text: fmt(k, n[k]) })),
        el('td', { class: 'num', text: p ? fmt(k, p[k]) : '—' }), el('td', { class: 'num' }, p ? kmDelta(n[k], p[k], kind, pml) : '—'),
        el('td', {}, flagBtn({ who: nameOf(peopleOf(datasets).find((x) => x.id === id) || {}, lang) || (me && me.user && String(me.user.id) === String(id) ? me.user.name : id), period: ml, label: t(lab), value: fmt(k, n[k]), prev: p ? fmt(k, p[k]) : '—', def: t(SNAP_DEF[k]), asOf: dataAsOf() })))))),
      share != null ? el('p', { class: 'hint', text: t('pf_share', { p: share }) }) : null),
    el('div', { class: 'km-side' },
      el('h4', { text: `${t('pf_open')} — ${open.length}` }),
      open.length ? [el('ul', { class: 'pf-open' }, open.slice(0, 6).map(item)),
        open.length > 6 ? el('details', { class: 'more-work' }, el('summary', { text: t('me_open_more', { n: open.length - 6 }) }), el('ul', { class: 'pf-open' }, open.slice(6).map(item))) : null]
        : el('p', { class: 'hint', text: t('pf_none') }),
      hist.length > 1 ? [el('h4', { text: t('km_hist_h') }), el('table', { class: 'km-hist' },
        el('thead', {}, el('tr', {}, el('th', { text: t('km_month') }), ['km_total', 'km_closed', 'km_avg', 'col_points'].map((k) => el('th', { class: 'num', text: t(k) })))),
        el('tbody', {}, hist.map(({ m, x }) => el('tr', { class: m.ym === ym ? 'on' : null }, el('td', { text: `${periodLabel(m.ym)}${m.whole ? '' : ' *'}` }),
          el('td', { class: 'num', text: String(x.total) }), el('td', { class: 'num', text: String(x.closed) }), el('td', { class: 'num', text: hmOf(x.avg) }), el('td', { class: 'num', text: String(x.points) })))))] : null,
      actions ? el('div', { class: 'row km-acts' }, actions) : null));
}
let meMonth = null;
/** The month picker and the personal view for «مؤشراتي»: months from the manager's pulls, or from the engineer's own pull. */
function meMonthParts() {
  const uid = String(me.user.id), tasks = me.tasks || [], fromPulls = meDerived || !!viewAs;
  const ranges = fromPulls ? datasets.map((d) => d.range) : [{ from: saudiDay(me.since || me.extractedAt), to: saudiDay(me.extractedAt) }];
  const months = pulledPeriods(kmKind, ranges);
  if (!months.length) return [el('p', { class: 'note', text: t('no_data') })];
  const thisMonth = saudiDay(new Date().toISOString()).slice(0, 7);
  const now = kmKind === 'quarter' ? qOf(thisMonth) : thisMonth;
  if (!meMonth || !months.some((m) => m.ym === meMonth)) meMonth = (months.find((m) => m.ym === now) || months[0]).ym;
  const cov = months.find((m) => m.ym === meMonth), pm = prevPeriodOf(meMonth), hasPrev = months.some((m) => m.ym === pm);
  return [
    el('div', { class: 'bar km-bar' }, kindPills(renderMe), el('label', {}, el('span', { text: t(kmKind === 'quarter' ? 'km_kind_quarter' : 'km_month') }), el('select', { id: 'me-month', onchange: (e) => { meMonth = e.target.value; renderMe(); } },
      months.map((m) => el('option', { value: m.ym, selected: m.ym === meMonth, text: `${periodLabel(m.ym)}${m.whole ? '' : ' *'}` })))),
      el('span', { class: 'hint', text: hasPrev ? t('km_vs', { m: periodLabel(pm) }) : t('km_no_prev', { m: periodLabel(pm) }) })),
    !cov.whole ? el('p', { class: 'note', text: t('km_partial', { got: cov.got, need: cov.need }) }) : null,
    personMonthView({ id: uid, tasks, acts: fromPulls ? allActivities() : [], months, ym: meMonth })];
}
function renderKpi() {
  applyNameFixes();
  applyPending().then((changed) => { if (changed) { renderTeam(); renderKpi(); renderMe(); } });
  const body = $('kpi-body');
  const months = datasets.length ? pulledPeriods(kmKind) : [];
  if (!months.length) { set(body, el('div', { class: 'empty', text: t('no_data') })); return; }
  const thisMonth = saudiDay(new Date().toISOString()).slice(0, 7);
  const nowKey = kmKind === 'quarter' ? qOf(thisMonth) : thisMonth;
  if (!kpiMonth || !months.some((m) => m.ym === kpiMonth)) kpiMonth = (months.find((m) => m.ym === nowKey) || months[0]).ym;
  const ym = kpiMonth, pm = prevPeriodOf(ym), cov = months.find((m) => m.ym === ym), pcov = months.find((m) => m.ym === pm);
  const range = periodRangeOf(ym), prange = periodRangeOf(pm);
  const tasks = allTasks(), acts = allActivities(), wt = weights();
  const people = scoped(peopleOf(datasets)), peopleById = new Map(peopleOf(datasets).map((p) => [p.id, p]));
  // ADR-0072: «مؤشرات الفريق» is the team without the one using the portal — his own numbers are on «مؤشراتي»
  // who «me» is, known from the first moment: the profile if built, else (manager link) the one the team file says covers the teams —
  // the same rule «مؤشراتي» uses; before, he showed until «مؤشراتي» had been built once, then vanished
  const selfId = String((((viewAs ? realMe : me) || {}).user || {}).id || (!isTeamPortal ? managerIdOf() || '' : ''));
  const team = currentTeam(people, tasks).filter((x) => String(x) !== selfId);
  const f = factor1(tasks, { range, team }), wp = weightedPoints(tasks, acts, wt, { range, team });
  const fp = pcov ? factor1(tasks, { range: prange, team }) : null, wpp = pcov ? weightedPoints(tasks, acts, wt, { range: prange, team }) : null;
  const nm = (id) => (id === GROUP ? t('group_bucket') : (nameOf(peopleById.get(id), lang) || id));
  const now = (id) => monthNumbers(f, wp, id), was = (id) => (fp ? monthNumbers(fp, wpp, id) : null);
  const ml = periodLabel(ym), pml = periodLabel(pm);
  // a change beside a number: neutral for what arrived, green or red for what was done and how fast
  const delta = (x, y, kind) => kmDelta(x, y, kind, pml);
  const T = now('team'), P = was('team');
  const tile = (k, label, v, pv, kind, sub) => el('div', { class: `km-tile km-${k}` }, el('b', { text: k === 'avg' ? hmOf(v) : String(v ?? '—') }),
    el('span', { text: label }), P ? el('small', { class: 'km-was' }, `${t('km_vs', { m: pml })}: ${k === 'avg' ? hmOf(pv) : (pv ?? '—')} `, delta(v, pv, kind)) : null, sub ? el('small', { class: 'hint', text: sub }) : null);
  const sorter = { points: (id) => (now(id) || {}).points || 0, total: (id) => (now(id) || {}).total || 0, avg: (id) => -(((now(id) || {}).avg) ?? 1e9) }[kpiMSort];
  const ids = f.people.map((r) => r.id).sort((a, b) => sorter(b) - sorter(a) || nm(a).localeCompare(nm(b), lang));
  const rdOn = rdKnownFor(range);   // ADR-0075: R&D shows when the period's pulls carry the R&D list, «—» otherwise
  const COLS = ['src_email', 'src_self', 'src_other', 'km_total', 'km_closed', 'km_avg', 'km_rd', 'col_points'];
  const cells = (n, p, withDelta) => [n.email, n.self, n.other].map((v) => el('td', { class: 'num', text: String(v) }))
    .concat(el('td', { class: 'num km-strong' }, el('b', { text: String(n.total) }), withDelta && p ? delta(n.total, p.total, 'n') : null),
      el('td', { class: 'num', text: String(n.closed) }),
      el('td', { class: 'num' }, hmOf(n.avg), withDelta && p ? delta(n.avg, p.avg, 'l') : null),
      el('td', { class: 'num km-rd', title: rdOn ? t('km_def_rd') : t('km_rd_unknown') }, rdOn ? String(n.rd) : '—'),
      el('td', { class: 'num km-strong' }, el('b', { text: String(n.points) }), withDelta && p ? delta(n.points, p.points, 'h') : null));
  const detail = (id) => {
    const n = now(id), share = wp.total ? Math.round((n.points / wp.total) * 100) : 0, mds = { key: `m:${ym}`, range, tasks, activities: acts };
    const ro = (roster().people || {})[id] || {};   // his role, his manager and leave (team file)
    const head = [positionOf(roster(), id, lang), ro.leaderId ? `${t('pf_leader')} ${nm(String(ro.leaderId))}` : '', ro.onLeave ? t('card_on_leave') : ''].filter(Boolean).join(' · ');
    return personMonthView({ id, tasks, acts, months, ym, head, share, actions: [
      el('button', { type: 'button', class: 'btn tiny', text: `🖨 ${t('pf_pdf')}`, onclick: () => openReport(reportHtml(reportData(mds, [id], peopleById), { single: true }), 'pdf', `AFAQY-${nm(id).replace(/\s+/g, '-')}-${ym}`) }),
      el('button', { type: 'button', class: 'btn tiny', text: `${t('pf_plan')} ↗`, onclick: () => { devSel = id; pref('devsel', id); location.hash = '#dev'; } }),
      el('button', { type: 'button', class: 'btn tiny', text: `👁 ${t('pf_viewas')}`, onclick: () => startViewAs(id) })] });
  };
  const line = (id) => {
    const n = now(id), p = was(id), on = kpiOpen === id, pos = positionOf(roster(), id, lang);
    const tr = el('tr', { class: `km-row${on ? ' on' : ''}`, 'data-id': id, tabIndex: 0, 'aria-expanded': String(on), title: t('km_click'),
      onclick: () => { kpiOpen = on ? null : id; renderKpi(); }, onkeydown: (e) => { if (e.key === 'Enter') { kpiOpen = on ? null : id; renderKpi(); } } },
      el('td', {}, el('div', { class: 'km-name' }, el('span', { text: nm(id) })), pos ? el('div', { class: 'hint', text: pos }) : null),
      ...cells(n, p, true));
    return on ? [tr, el('tr', { class: 'km-open' }, el('td', { colspan: String(COLS.length + 1) }, detail(id)))] : [tr];
  };
  const g = f.group ? { email: f.group.bySource ? f.group.bySource.email.received : 0, self: f.group.bySource ? f.group.bySource.self.received : 0, other: f.group.bySource ? f.group.bySource.other.received : 0,
    total: f.group.assigned, closed: f.group.cohortClosed, avg: f.group.cohortAvgHours, points: 0 } : null;
  const table = el('div', { class: 'table-wrap km-wrap' }, el('table', { class: 'km-table' },
    el('thead', {}, el('tr', {}, el('th', { text: t('col_person') }), COLS.map((k) => el('th', { class: 'num', text: t(k) })))),
    el('tbody', {}, ids.flatMap(line),
      g && g.total ? el('tr', { class: 'group' }, el('td', { text: t('group_bucket') }), ...cells(g, null, false)) : null,
      el('tr', { class: 'total' }, el('td', { text: t('team') }), ...cells(T, P, true)))));
  const csv = () => {
    const head = [t('col_person'), ...COLS.map((k) => t(k)), `${t('km_total')} — ${pml}`, `${t('col_points')} — ${pml}`];
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rowsCsv = ids.map((id) => { const n = now(id), p = was(id) || {}; return [nm(id), n.email, n.self, n.other, n.total, n.closed, hmOf(n.avg), rdOn ? n.rd : '', n.points, p.total ?? '', p.points ?? '']; });
    rowsCsv.push([t('team'), T.email, T.self, T.other, T.total, T.closed, hmOf(T.avg), rdOn ? T.rd : '', T.points, (P || {}).total ?? '', (P || {}).points ?? '']);
    download(`AFAQY-KPI-${ym}.csv`, '\ufeff' + [head, ...rowsCsv].map((r) => r.map(q).join(',')).join('\n'));
  };
  // what is not «who did what in the month» stays one fold away, each in its one place
  const rep = [...reports].filter((r) => r.range && r.range.from <= range.to && r.range.to >= range.from).sort((a, b) => String(b.extractedAt || '').localeCompare(String(a.extractedAt || '')))[0];
  const teamMonths = months.slice(0, 6).map((m) => { const r = periodRangeOf(m.ym); return { m, x: monthNumbers(factor1(tasks, { range: r, team }), weightedPoints(tasks, acts, wt, { range: r, team }), 'team') }; });
  const more = el('details', { class: 'km-more', open: kpiMore || null, ontoggle: (e) => { kpiMore = e.target.open; } },
    el('summary', { text: t('km_more') }),
    el('h2', { text: t('km_team_months') }),
    el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, el('th', { text: t('km_month') }), ['src_email', 'src_self', 'src_other', 'km_total', 'km_closed', 'km_avg', 'col_points'].map((k) => el('th', { class: 'num', text: t(k) })))),
      el('tbody', {}, teamMonths.map(({ m, x }) => el('tr', { class: m.ym === ym ? 'total' : null }, el('td', { text: `${periodLabel(m.ym)}${m.whole ? '' : ' *'}` }),
        [x.email, x.self, x.other, x.total, x.closed].map((v) => el('td', { class: 'num', text: String(v) })), el('td', { class: 'num', text: hmOf(x.avg) }), el('td', { class: 'num', text: String(x.points) })))))),
    kpiWeekSection(team, peopleById),
    kpiLoadSection(team, peopleById),
    kpiReportSection({ key: `m:${ym}`, range, tasks, activities: acts }, team, peopleById),
    rep ? [el('p', { class: 'hint km-from', text: t('km_tickets_from', { a: rep.range.from, b: rep.range.to }) }), renderReports(rep.key, team)] : null,
    rankLinksSection(),
    el('h2', { text: t('definitions') }),
    el('ul', { class: 'defs' }, KM_DEFS.map((k) => el('li', { text: t(k) }))));
  set(body,
    el('div', { class: 'bar km-bar' }, kindPills(renderKpi),
      el('label', {}, el('span', { text: t(kmKind === 'quarter' ? 'km_kind_quarter' : 'km_month') }), el('select', { id: 'kpi-month', onchange: (e) => { kpiMonth = e.target.value; if (!isQ(kpiMonth)) pref('kpimonth', kpiMonth); kpiOpen = kpiOpen; renderKpi(); } },
        months.map((m) => el('option', { value: m.ym, selected: m.ym === ym, text: `${periodLabel(m.ym)}${m.whole ? '' : ' *'}` })))),
      el('span', { class: 'hint', text: P ? t('km_vs', { m: pml }) : t('km_no_prev', { m: pml }) }),
      // anyone's page as he sees it — leads and managers too, who have no row in the counted team
      el('label', { class: 'km-va' }, el('span', { text: `👁 ${t('km_viewas_pick')}` }), el('select', { id: 'kpi-viewas', onchange: (e) => { const v = e.target.value; e.target.value = ''; if (v) startViewAs(v); } },
        el('option', { value: '', text: '—' }), peopleOf(datasets).filter((x) => !/\bsystem\b|مستخدم النظام/i.test(`${x.nameEn || ''} ${x.nameAr || ''}`)).map((x) => ({ x, n: nameOf(x, lang) || x.id }))
          .sort((a, b) => a.n.localeCompare(b.n, lang)).map(({ x, n }) => el('option', { value: x.id, text: n }))))),
    renderTeamPicker(people, team),
    datasets.some((d) => d.sample) ? el('p', { class: 'note sample', text: t('sample_note') }) : null,
    !cov.whole ? el('p', { class: 'note', text: t('km_partial', { got: cov.got, need: cov.need }) }) : null,
    el('p', { class: 'answer-line', text: t('km_answer', { m: ml, n: T.total, e: T.email, s: T.self, o: T.other, c: T.closed, h: hmOf(T.avg), p: T.points }) + (P ? ` ${t('km_answer_prev', { m: pml, n: P.total, p: P.points })}` : '') }),
    el('div', { class: 'km-tiles' },
      (() => { const x = tile('total', t('km_total'), T.total, P && P.total, 'n'), s = splitBar(T); if (s) x.append(s); return x; })(),
      tile('email', t('src_email'), T.email, P && P.email, 'n'),
      tile('self', t('src_self'), T.self, P && P.self, 'n'),
      tile('other', t('src_other'), T.other, P && P.other, 'n'),
      (() => { const x = tile('avg', t('km_avg'), T.avg, P && P.avg, 'l', t('km_closed_n', { n: T.closed })), g = closedRing(T.closed, T.total); if (g) x.append(g); return x; })(),
      tile('rd', t('km_rd'), rdOn ? T.rd : '—', rdOn && P && rdKnownFor(prange) ? P.rd : null, 'n', rdOn ? null : t('km_rd_unknown')),
      tile('points', t('col_points'), T.points, P && P.points, 'h')),
    el('div', { class: 'row', style: 'justify-content:space-between;align-items:center;margin:4px 0 8px' },
      el('div', { class: 'pills' }, el('span', { class: 'hint', text: `${t('cnt_sort')}:` }), [['points', 'col_points'], ['total', 'km_total'], ['avg', 'km_avg']].map(([k, label]) =>
        el('button', { type: 'button', class: `pill-btn${kpiMSort === k ? ' on' : ''}`, text: t(label), onclick: () => { kpiMSort = k; renderKpi(); } }))),
      el('button', { type: 'button', class: 'btn tiny quiet', text: t('km_csv'), onclick: csv })),
    el('p', { class: 'hint', text: t('km_click') }),
    table,
    more);
  if (kpiOpen) { const r = body.querySelector(`tr.km-row[data-id="${CSS.escape(kpiOpen)}"]`); if (r && kpiScroll) { kpiScroll = false; r.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
}
let kpiScroll = false;
/** Any name anywhere opens that person's row on the board — the one place for his month. */
function openPerson(id) { kpiOpen = id; kpiScroll = true; if (location.hash === '#kpi') renderKpi(); else location.hash = '#kpi'; }


// ---------- the Weights page: points per task type and per activity category, with their tier and reason ----------
function typeMedians() {
  return memoTasks(allTasks(), ['medians'], () => { const by = new Map();
    for (const x of allTasks()) { if (x.state !== 'done' || !x.createdAt || !x.completedAt) continue; const k = typeKey(x.type); if (!k) continue; (by.get(k) || by.set(k, []).get(k)).push(businessHours(x.createdAt, x.completedAt)); }
    const out = new Map(); for (const [k, hs] of by) { hs.sort((p, q) => p - q); const m = hs.length % 2 ? hs[(hs.length - 1) / 2] : (hs[hs.length / 2 - 1] + hs[hs.length / 2]) / 2; out.set(k, { med: m, n: hs.length }); } return out; });
}
let wPer = { k: 'all', from: '', to: '' };   // the period the weights page counts completed tasks in
function renderWeights() {
  const body = $('weights-body'); if (!body) return;
  const advOpen = !!(body.querySelector('.w-adv') && body.querySelector('.w-adv').open);   // the advanced part stays open across redraws
  const wt = weights();
  const ds = datasets[0];
  const seen = new Map();
  if (ds) for (const x of ds.tasks) { const k = typeKey(x.type); if (!k) continue; const v = seen.get(k) || { name: x.type, n: 0 }; v.n++; seen.set(k, v); }
  // who is looking: the person whose profile is on this device; rights come from the weights file
  const uid = (me && me.user ? me.user.id : null) || (!isTeamPortal ? managerIdOf() : null);   // on a phone with no bookmark profile, the manager is known from the team file
  const admin = isWeightsAdmin(wt, uid);
  const mayEdit = (k) => canEditWeight(wt, uid, k);
  // the groups: linked types as myafaqy lists them per team (from the latest file), else the weights file's own tags
  const ttLive = liveTeamTypes(), tt = (ttLive && ttLive.teamTypes) || {};   // the newest list: from «أنواع الفرق» or from the latest pull
  const findTeam = (re) => Object.entries(tt).find(([n]) => re.test(n));
  const asTeam = findTeam(/jeddah.*after\s*-?\s*sales/i), rdTeam = findTeam(/jeddah.*r\s*&\s*d/i);
  const fromFile = (team) => Object.entries(wt.tasks).filter(([, x]) => x.team === team || (team === 'aftersales' && x.team === 'both') || (team === 'rd' && x.team === 'both')).map(([k]) => k);
  const linked = (teamEntry, team) => (teamEntry ? teamEntry[1].map((x) => ({ key: typeKey(x.nameEn || x.nameAr), name: x.nameEn && x.nameAr ? `${x.nameEn} | ${x.nameAr}` : (x.nameEn || x.nameAr) })) : fromFile(team).map((k) => ({ key: k, name: (seen.get(k) || {}).name || k })));
  const groups = [
    { id: 'aftersales', title: t('wteam_aftersales'), live: !!asTeam, rows: linked(asTeam, 'aftersales') },
    { id: 'rd', title: t('wteam_rd'), live: !!rdTeam, rows: linked(rdTeam, 'rd') },
    { id: 'general', title: t('wteam_general'), live: false, rows: fromFile('general').map((k) => ({ key: k, name: (seen.get(k) || {}).name || k })) },
  ];
  const save = async (patch) => { weightsDevice = { ...(weightsDevice || {}), tasks: { ...((weightsDevice || {}).tasks || {}), ...(patch.tasks || {}) }, activities: { ...((weightsDevice || {}).activities || {}), ...(patch.activities || {}) }, editors: { ...((weightsDevice || {}).editors || {}) , ...(patch.editors || {}) } }; await store.putWeights(weightsDevice); renderWeights(); renderKpi(); renderMe(); };
  const stepSel = (cur, on, enabled) => el('select', { class: 'w-sel', ...(enabled ? {} : { disabled: '' }), onchange: (e) => on(Number(e.target.value)) }, WEIGHT_STEPS.map((w) => el('option', { value: String(w), selected: w === cur, text: String(w) })));
  const tierName = (tr) => (tr ? t(`tier_${tr}`) : t('tier_none'));
  const RR = rulesOf(wt), pctN = (v) => String(Math.round(v * 100)), fx = (v) => String(Math.round(v * 100) / 100);
  const customDesc = (m) => { const cm = RR.methods.find((q) => q.id === m); return !cm ? t('mode_d_gone') : cm.steps.length ? [...cm.steps.map((s) => t('pr_mstep', { p: s.upTo, x: fx(s.x) })), t('pr_mstep_more', { x: fx(cm.beyond) })].join(' · ') : t('mode_d_done'); };
  const modeDesc = (m) => (isCustomMode(m) ? customDesc(m) : m === 'speed' ? t('mode_d_speed', { x: fx(RR.speedX) }) : m === 'compare' ? t('mode_d_compare', { a: pctN(RR.cmpFast), fx: fx(RR.cmpFastX), b: pctN(RR.cmpSlow), sx: fx(RR.cmpSlowX) }) : t('mode_d_done'));
  const medHint = (k) => { const m = typeMedians().get(k); return m ? el('div', { class: 'hint med-hint', text: t('std_med', { h: formatHours(m.med, lang), n: m.n }) }) : null; };
  const pretty = (k) => k.replace(/(^|\s)([a-z])/g, (m, sp, c) => sp + c.toUpperCase());
  // the scope's people, for the admin to hand out editing rights
  const scopePeople = scoped(peopleOf(datasets)).concat(me ? me.people.filter((p) => inScope(roster(), p.id) && !peopleOf(datasets).some((q) => q.id === p.id)) : []);
  const nameById = (id) => { const p = scopePeople.find((q) => q.id === id) || (me && me.people.find((q) => q.id === id)); return (p && nameOf(p, lang)) || id; };
  const editorsOf = (k) => Object.entries(wt.editors).filter(([id, list]) => id !== String(uid) && (list.includes('*') || list.includes(k))).map(([id]) => id);
  const editorsCell = (k) => el('td', { class: 'editors' },
    el('span', { class: 'hint', text: editorsOf(k).length ? editorsOf(k).map(nameById).join('، ') : t('w_admin_only') }),
    admin ? el('button', { type: 'button', class: 'btn quiet tiny', text: t('w_grant'), onclick: () => grantDialog(k) }) : null);
  const grantDialog = (k) => {
    const dlg = $('help-dialog');
    $('help-title').textContent = t('w_grant_title', { type: pretty(k) });
    const list = el('div', { class: 'grant-list' }, scopePeople.filter((p) => p.id !== String(uid)).map((p) => {
      const cur = wt.editors[p.id] || []; const on = cur.includes('*') || cur.includes(k);
      return el('label', {}, el('input', { type: 'checkbox', ...(on ? { checked: '' } : {}), ...(cur.includes('*') ? { disabled: '' } : {}), onchange: async (e) => {
        const next = new Set(cur); if (e.target.checked) next.add(k); else next.delete(k);
        await save({ editors: { [p.id]: [...next] } }); dlg.close(); grantDialog(k);
      } }), el('span', { text: nameOf(p, lang) || p.id }), cur.includes('*') ? el('span', { class: 'hint', text: t('w_is_admin') }) : null);
    }));
    set($('help-text'), list);
    dlg.showModal();
  };
  // the basis of a type's points: four factors → the base, the method, the standard time (ADR-0031)
  const doneTasks = allTasks().filter((x) => x.state === 'done');
  const pointsOfType = (k) => doneTasks.filter((x) => typeKey(x.type) === k).reduce((s, x) => s + taskPoints(wt, x), 0);
  const basisCells = (r, g) => {
    const x = r.x || { w: wt.default, f: [0, 0, 0, 0], mode: 'done' }; const f = x.f || [0, 0, 0, 0]; const can = mayEdit(r.key);
    const put = (patch) => { const nf = patch.f || f, b = baseFromFactors(nf, rulesOf(weights())), mode = patch.mode || x.mode || 'done';
      const md0 = typeMedians().get(r.key), std = mode === 'done' ? undefined : (patch.std != null ? patch.std : x.std || (md0 ? Math.max(0.25, Math.round(md0.med * 4) / 4) : 2));   // a first value from the data — marked an estimate for the manager to set
      save({ tasks: { [r.key]: { w: b, tier: tierFromBase(b), team: x.team || g.id, f: nf, mode, ...(std ? { std, stdSrc: patch.std != null ? 'set' : (x.stdSrc || 'est') } : {}) } } }); };
    const fsel = (i) => el('select', { class: 'w-sel f-sel', title: t(`factor_${FACTORS[i]}`), 'aria-label': t(`factor_${FACTORS[i]}`), ...(can ? {} : { disabled: '' }),
      onchange: (e) => { const nf = [...f]; nf[i] = Number(e.target.value); put({ f: nf }); } }, [0, 1, 2].map((v) => el('option', { value: String(v), selected: v === f[i], text: String(v) })));
    return [
      r.x && !r.x.f ? el('td', { class: 'hint', text: t('w_direct') }) : el('td', { class: 'factors' }, el('div', { class: 'f-row' }, FACTORS.map((k, i) => el('label', {}, el('span', { text: t(`factor_short_${k}`) }), fsel(i))))),
      el('td', { class: 'num' }, el('b', { class: 'base', text: String(x.w) }), el('div', { class: 'hint', text: tierName(x.tier) })),
      el('td', {}, el('select', { class: 'w-sel', ...(can ? {} : { disabled: '' }), onchange: (e) => put({ mode: e.target.value }) }, [...POINT_MODES.map((m) => [m, t(`mode_${m}`)]), ...RR.methods.map((m) => [m.id, m.name]), ...(isCustomMode(x.mode) && !RR.methods.some((m) => m.id === x.mode) ? [[x.mode, t('mode_gone')]] : [])].map(([m, label]) => el('option', { value: m, selected: m === (x.mode || 'done'), text: label }))), el('div', { class: 'hint', text: modeDesc(x.mode || 'done') })),
      el('td', { class: 'num' }, (x.mode || 'done') === 'done' ? [el('span', { class: 'hint', text: '—' }), medHint(r.key)] : [
        el('input', { type: 'number', min: '0.25', max: '400', step: '0.25', class: 'std-in', value: String(x.std || ''), ...(can ? {} : { disabled: '' }), onchange: (e) => { const v = Number(e.target.value); if (v > 0 && v <= 400) put({ std: v }); } }),
        el('div', { class: 'hint', text: x.stdSrc === 'est' ? t('std_est') : x.stdSrc === 'oct' ? t('std_oct') : t('std_set') }), medHint(r.key)]),
    ];
  };
  const table = (g) => {
    const rows = g.rows.map((r) => { const x = wt.tasks[r.key]; const n = (seen.get(r.key) || {}).n || 0; const cur = x ? x.w : wt.default; return { ...r, x, n, cur }; })
      .sort((p, q) => (q.x ? q.x.w : -1) - (p.x ? p.x.w : -1) || q.n - p.n || p.key.localeCompare(q.key));
    return [el('h2', {}, g.title, el('span', { class: 'hint', text: ` — ${t('w_types_n', { n: rows.length })}${g.live ? ` · ${t('w_from_myafaqy')}` : ''}` })),
      el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, ['w_col_type', 'w_col_factors', 'w_col_weight', 'w_col_mode', 'w_col_std', 'w_col_n', 'w_col_points', 'w_col_editors'].map((k, i) => el('th', { class: [2, 4, 5, 6].includes(i) ? 'num' : null, text: t(k) })))),
        el('tbody', {}, rows.map((r) => el('tr', { class: r.x ? null : 'unweighted' },
          el('td', {}, el('div', { text: r.name || pretty(r.key) }), r.x ? null : el('div', { class: 'hint warn-text', text: t('w_new_type') })),
          ...basisCells(r, g), el('td', { class: 'num', text: String(r.n) }),
          el('td', { class: 'num', text: String(Math.round(pointsOfType(r.key) * 10) / 10) }), editorsCell(r.key))))))];
  };
  // ADR-0056: the plain page — the type, its points typed directly, how many in the data, and one grey line on how it counts
  // ADR-0064: the count is the completed tasks in a period the manager chooses, and the method and the usual time are fields of their own
  const doneAll = allTasks().filter((x) => x.state === 'done' && x.completedAt), doneDays = doneAll.map((x) => saudiDay(x.completedAt)).sort();
  const ymNow = saudiDay(new Date().toISOString()).slice(0, 7);
  const per = wPer.k === 'month' ? [`${ymNow}-01`, monthLast(ymNow)] : wPer.k === 'prev' ? [`${ymPrev(ymNow)}-01`, monthLast(ymPrev(ymNow))] : wPer.k === 'custom' && wPer.from && wPer.to && wPer.from <= wPer.to ? [wPer.from, wPer.to] : [doneDays[0] || '', doneDays[doneDays.length - 1] || ''];
  const doneN = new Map(); for (const x of doneAll) { const d = saudiDay(x.completedAt); if (d < per[0] || d > per[1]) continue; const k = typeKey(x.type); if (k) doneN.set(k, (doneN.get(k) || 0) + 1); }
  const perBox = el('div', { class: 'w-per' },
    el('div', { class: 'pills' }, [['all', t('w_per_all')], ['month', t('w_per_month')], ['prev', t('w_per_prev')], ['custom', t('w_per_custom')]].map(([k2, l]) => el('button', { type: 'button', class: `pill-btn${wPer.k === k2 ? ' on' : ''}`, text: l, onclick: () => { wPer = { ...wPer, k: k2 }; renderWeights(); } }))),
    wPer.k === 'custom' ? el('div', { class: 'row mgr-dates' }, el('label', {}, el('span', { text: t('mf_from') }), el('input', { type: 'date', value: wPer.from, onchange: (e) => { wPer = { ...wPer, from: e.target.value }; renderWeights(); } })),
      el('label', {}, el('span', { text: t('mf_to') }), el('input', { type: 'date', value: wPer.to, onchange: (e) => { wPer = { ...wPer, to: e.target.value }; renderWeights(); } }))) : null,
    el('p', { class: 'hint w-per-src', text: doneAll.length ? t('w_per_src', { from: per[0], to: per[1], n: [...doneN.values()].reduce((s, v) => s + v, 0) }) : t('ot_nodata') }),
    el('label', { class: 'w-speedx' }, el('span', { text: t('w_speedx') }), el('input', { type: 'number', min: '1', max: '3', step: '0.1', value: String(rulesOf(wt).speedX), ...(admin ? {} : { disabled: '' }),
      onchange: async (e) => { const v = Number(e.target.value); if (!(v >= 1 && v <= 3)) { e.target.value = String(rulesOf(wt).speedX); return; } weightsDevice = { ...(weightsDevice || {}), rules: parseRules({ ...rulesOf(weights()), speedX: v }) }; await store.putWeights(weightsDevice); toast(t('w_speedx_saved')); renderWeights(); renderKpi(); renderMe(); } })));
  const RRs = rulesOf(wt), fmtN = (v) => String(Math.round(v * 100) / 100);
  const methodLine = (x) => { const m = (x && x.mode) || 'done', h = x && x.std ? fmtN(x.std) : '';
    if (m === 'speed') return t('w_m_speed', { x: fmtN(RRs.speedX), h }); if (m === 'compare') return t('w_m_compare', { h });
    if (isCustomMode(m)) { const cm = (RRs.methods || []).find((q) => q.id === m); return cm ? t('w_m_own', { n: cm.name }) : t('w_m_done'); } return t('w_m_done'); };
  const putSimple = (r, g, patch) => { const x = r.x || {}, mode = patch.mode || x.mode || 'done', w = x.w != null ? x.w : wt.default;
    const std = mode === 'done' ? null : patch.std != null ? patch.std : x.std || null;   // never a value the manager did not set: a new method starts with no usual time
    const next = { ...x, w, tier: x.tier || tierFromBase(Math.round(w)), team: x.team || g.id, mode }; delete next.std; delete next.stdSrc;
    if (std) { next.std = std; next.stdSrc = patch.std != null ? 'set' : (x.stdSrc || 'set'); }
    save({ tasks: { [r.key]: next } }); };
  const simpleTable = (g) => {
    const rows = g.rows.map((r) => { const x = wt.tasks[r.key]; return { ...r, x, n: doneN.get(r.key) || 0, w: x ? x.w : wt.default }; }).sort((p, q) => q.w - p.w || q.n - p.n || p.key.localeCompare(q.key));
    if (!rows.length) return null;
    return [el('h2', {}, g.title, el('span', { class: 'hint', text: ` — ${t('w_types_n', { n: rows.length })}` })),
      el('div', { class: 'table-wrap' }, el('table', { class: 'w-cards w-simple' },
        el('thead', {}, el('tr', {}, ['w_col_type', 'w_col_pts', 'w_col_n', 'w_col_method', 'w_col_std'].map((k, i) => el('th', { class: i === 1 || i === 2 ? 'num' : null, text: t(k) })))),
        el('tbody', {}, rows.map((r) => { const can = mayEdit(r.key);
          const inp = el('input', { type: 'number', class: 'w-pts', min: '0.5', max: '10', step: '0.5', value: String(r.w), 'aria-label': t('w_col_pts'), ...(can ? {} : { disabled: '' }),
            onchange: (e) => { const v = Number(e.target.value); if (!(v >= 0.5 && v <= 10)) { e.target.value = String(r.w); toast(t('w_pts_bad')); return; }
              const x = r.x || {}; save({ tasks: { [r.key]: { w: v, tier: tierFromBase(Math.round(v)), team: x.team || g.id, mode: x.mode || 'done', ...(x.std ? { std: x.std, stdSrc: x.stdSrc || 'set' } : {}) } } }); } });   // typed directly: no factors behind it
          return el('tr', { class: r.x ? null : 'unweighted' },
            el('td', {}, el('div', { text: r.name || pretty(r.key) }), r.x ? null : el('div', { class: 'hint warn-text', text: t('w_new_type') })),
            el('td', { class: 'num', 'data-label': t('w_col_pts') }, inp), el('td', { class: 'num', 'data-label': t('w_col_n') }, String(r.n)),
            el('td', { 'data-label': t('w_col_method') }, el('select', { class: 'w-sel w-mode', 'aria-label': t('w_col_method'), ...(can ? {} : { disabled: '' }), onchange: (e) => putSimple(r, g, { mode: e.target.value }) },
              [...POINT_MODES.map((m) => [m, t(`mode_${m}`)]), ...(RRs.methods || []).map((m) => [m.id, m.name])].map(([m, label]) => el('option', { value: m, selected: m === ((r.x && r.x.mode) || 'done') ? '' : null, text: label }))),
              ['speed'].includes((r.x && r.x.mode) || 'done') || isCustomMode((r.x && r.x.mode) || 'done') ? el('div', { class: 'hint', text: methodLine(r.x) }) : null),   // only where the line adds something the fields do not already say
            el('td', { class: 'num', 'data-label': t('w_col_std') }, ((r.x && r.x.mode) || 'done') === 'done' ? el('span', { class: 'hint', text: '—' }) : [
              el('input', { type: 'number', min: '0.25', max: '400', step: '0.25', class: 'std-in', value: String((r.x && r.x.std) || ''), 'aria-label': t('w_col_std'), ...(can ? {} : { disabled: '' }), onchange: (e) => { const v = Number(e.target.value); if (v > 0 && v <= 400) putSimple(r, g, { std: v }); else { e.target.value = String((r.x && r.x.std) || ''); toast(t('w_std_bad')); } } }),
              el('div', { class: `hint${r.x && r.x.std && r.x.stdSrc !== 'set' ? ' warn-text' : ''}`, text: !(r.x && r.x.std) ? t('w_std_need') : r.x.stdSrc === 'est' ? t('std_est') : r.x.stdSrc === 'oct' ? t('std_oct') : t('std_set') })])); }))))];
  };
  const diff = weightPublishDiff(weightsRepo, weightsDevice);
  const approvedJson = () => JSON.stringify(publishableWeights(weightsRepo, weightsDevice, ymd(new Date())), null, 2) + '\n';
  const download = () => {
    const data = approvedJson();
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = el('a', { href: url, download: 'weights.json' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const upload = el('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async (e) => { const file = e.target.files[0]; if (!file) return; try { weightsDevice = parseWeights(JSON.parse(await file.text())); await store.putWeights(weightsDevice); toast(t('weights_loaded')); renderWeights(); renderKpi(); renderMe(); } catch { toast(t('err_json')); } e.target.value = ''; } });
  const myRights = uid ? (admin ? t('w_you_admin') : (Object.keys(wt.tasks).filter(mayEdit).length ? t('w_you_some', { n: Object.keys(wt.tasks).filter(mayEdit).length }) : t('w_you_none'))) : t('w_you_unknown');
  set(body,
    el('p', { class: 'note', text: myRights }),
    admin ? el('p', { class: diff.count ? 'note' : 'hint',
      text: diff.count ? t('weights_draft_notice', { n: diff.count }) : t('weights_official_notice') }) : null,
    perBox,
    groups.map(simpleTable),
    el('h2', {}, t('weights_acts_h'), helpQ('help_weights_acts')),
    el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, ['w_col_category', 'w_col_weight'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
      el('tbody', {}, Object.entries(wt.activities).map(([k, w]) => el('tr', {}, el('td', { text: pretty(k) }), el('td', { class: 'num' }, stepSel(w, (nw) => save({ activities: { [k]: nw } }), admin || mayEdit(k)))))))),
    el('div', { class: 'row', style: 'margin:12px 0' },
      admin ? el('button', { type: 'button', class: 'btn primary', text: `⇪ ${t('weights_publish_team')}`, onclick: () => { localStorage.setItem('afaqy.weights.publish', approvedJson()); window.open('./manage-systems.html#weights', '_blank', 'noopener'); toast(t('weights_publish_opened')); } }) : null,
      el('button', { type: 'button', class: 'btn', text: t('weights_download'), onclick: download }),
      admin ? el('button', { type: 'button', class: 'btn', text: t('weights_upload'), onclick: () => upload.click() }) : null, upload,
      weightsDevice ? el('button', { type: 'button', class: 'btn quiet', text: t('weights_reset'), onclick: async () => { weightsDevice = null; await store.putWeights(null); renderWeights(); renderKpi(); renderMe(); } }) : null,
      el('span', { class: 'hint', text: wt.reviewed ? t('weights_reviewed', { d: wt.reviewed }) : '' })),
    el('details', { class: 'w-adv', ...(advOpen ? { open: '' } : {}) }, el('summary', { text: t('w_adv') }), el('p', { class: 'hint', text: t('w_adv_lead') }), el('div', { class: 'w-adv-top' }),
      el('div', { class: 'tiers' }, TIERS.map((tr) => el('div', { class: 'tier' }, el('b', { text: String((weightsRepo && weightsRepo.tiers && weightsRepo.tiers[tr]) || { admin: 1, customer: 2, integration: 3, multistage: 5 }[tr]) }), el('div', {}, el('strong', { text: t(`tier_${tr}`) }), el('p', { text: t(`tier_${tr}_why`) }))))),
      groups.map(table),
      el('p', { class: 'hint', text: t('weights_seen_note', { range: ds ? `${ds.range.from} → ${ds.range.to}` : '—' }) })));
}

// ---------- the Team page: positions and leaders by myafaqy id, kept on this device and exportable as team.json ----------
// the team by department: management, after-sales, R&D — leaders first in each
function byDept(people, ro) {
  const dept = (id) => { const pos = ((ro.people[id] || {}).positionEn || ''); return /after-sales/i.test(pos) ? 'aftersales' : /r&d|presales|research/i.test(pos) ? 'rd' : 'mgmt'; };
  const lead = (id) => Object.values(ro.people).some((x) => x.leaderId === id) ? 0 : 1;
  const order = { mgmt: 0, aftersales: 1, rd: 2 }; const out = []; let cur = null;
  for (const p of [...people].sort((x, y) => order[dept(x.id)] - order[dept(y.id)] || lead(x.id) - lead(y.id))) {
    if (dept(p.id) !== cur) { cur = dept(p.id); out.push({ __head: t(`team_dept_${cur}`) }); } out.push(p); }
  return out;
}
// ---------- waiting by name (device only): people who join the team the first time they appear in a pull ----------
const PENDING_KEY = 'afaqy.pending';
const pendingList = () => { try { const v = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const cleanPending = (x) => (x && typeof x.name === 'string' && x.name.trim() ? { name: x.name.trim().slice(0, 80), position: String(x.position || '').slice(0, 80), positionEn: String(x.positionEn || '').slice(0, 80), leaderId: /^\d+$/.test(String(x.leaderId || '')) ? String(x.leaderId) : null, onLeave: !!x.onLeave } : null);
async function applyPending() {
  const list = pendingList(); if (!list.length) return false;
  const seen = new Map(); for (const d of datasets) for (const p of d.people || []) if (p.nameEn) seen.set(p.nameEn.trim().toLowerCase(), p.id);
  if (me) for (const p of me.people || []) if (p.nameEn && !seen.has(p.nameEn.trim().toLowerCase())) seen.set(p.nameEn.trim().toLowerCase(), p.id);
  const joined = [], left = [];
  for (const x of list) { const id = seen.get(x.name.toLowerCase()); if (!id) { left.push(x); continue; }
    rosterDevice = parseRoster(rosterDevice); rosterDevice.people[id] = { ...(rosterDevice.people[id] || {}), position: x.position, positionEn: x.positionEn, leaderId: x.leaderId, ...(x.onLeave ? { onLeave: true } : {}) }; joined.push(x.name); }
  if (!joined.length) return false;
  localStorage.setItem(PENDING_KEY, JSON.stringify(left)); await store.putRoster(rosterDevice); toast(t('pending_joined', { names: joined.join('، ') })); return true;
}
// ---------- name corrections (device only, never in the repository) ----------
const NAME_KEY = 'afaqy.names';
const nameFixes = () => { try { return JSON.parse(localStorage.getItem(NAME_KEY) || '{}') || {}; } catch { return {}; } };
function applyNameFixes() {
  const fx = nameFixes(); if (!Object.keys(fx).length) return;
  const fix = (p) => { const f = p && fx[p.id]; if (!f) return; if (f.ar) p.nameAr = f.ar; if (f.en) p.nameEn = f.en; };
  for (const d of datasets) for (const p of d.people || []) fix(p);
  if (me) for (const p of me.people || []) fix(p);
}
function orgCheckBox() {
  if (isTeamPortal) return null;
  const od = orgData(), mode = pref('orgTeam') === '1';
  const head = el('h2', { text: t('org_h') });
  if (!od) return el('section', { class: 'org-box' }, head, el('p', { class: 'hint', text: t('org_none') }));
  const ppl = peopleOf(datasets), nm = (id) => nameOf(ppl.find((p) => p.id === id) || {}, lang) || id, root = orgRootId(od), mgrs = od.org.managers();
  if (!root) return el('section', { class: 'org-box' }, head, el('p', { class: 'hint', text: t('org_nobody', { n: od.n }) }));
  const tasks = allTasks(), sc = scoped(ppl), cur = currentTeam(sc, tasks), wouldBe = currentTeam(sc, tasks, 'org'), reps = od.org.engineersOf(root);
  const add = wouldBe.filter((id) => !cur.includes(id)), rm = cur.filter((id) => !wouldBe.includes(id)), names = (ids) => (ids.length ? ids.map(nm).join(lang === 'en' ? ', ' : '، ') : t('org_chg_none'));
  const fileApplies = Object.keys(roster().people || {}).some((id) => od.org.hasRow(id));   // no team file for this team → nothing to compare against
  const cmp = fileApplies ? compareOrg(od.org, roster(), root) : { leader: [], missingInFile: [], notInOrg: [], inactive: [], unmatched: od.org.unmatchedUnder(root) };
  const lines = [...cmp.leader.map((x) => t('org_diff_leader', { name: nm(x.id), org: x.orgPid ? nm(x.orgPid) : (x.orgName || t('org_no_mgr')), file: nm(x.file) })),
    ...cmp.missingInFile.map((id) => t('org_diff_missing', { name: nm(id), root: nm(root) })), ...cmp.inactive.map((id) => t('org_diff_inactive', { name: nm(id) })), ...cmp.notInOrg.map((id) => t('org_diff_notin', { name: nm(id) })),
    ...cmp.unmatched.map((n) => t('org_diff_unmatched', { name: n }))];
  const redraw = () => { renderTeam(); renderKpi(); renderHome(); };
  const pick = el('select', { 'aria-label': t('org_root'), onchange: (e) => { pref('orgRoot', e.target.value); redraw(); } },
    mgrs.map(({ pid, n }) => el('option', { value: pid, selected: pid === root ? '' : null, text: `${nm(pid)} — ${n}` })));
  return el('section', { class: 'org-box' }, head,
    el('p', { class: 'hint', text: t('org_lead', { n: od.n, m: mgrs.length, d: od.at }) }),
    el('div', { class: 'row' }, el('label', {}, el('span', { text: `${t('org_root')} ` }), pick), el('span', { class: 'hint', text: t('org_reports', { n: reps.length }) })),
    el('p', { class: mode ? 'note' : 'org-preview', text: mode ? t('org_state_on', { n: cur.length }) : `${t('org_state_off')} ${t('org_preview', { a: wouldBe.length, b: cur.length, add: names(add), rm: names(rm) })}` }),
    el('div', { class: 'row' }, mode
      ? el('button', { type: 'button', class: 'btn', text: t('org_back'), onclick: () => { pref('orgTeam', '0'); toast(t('org_unused')); redraw(); } })
      : el('button', { type: 'button', class: 'btn primary', text: t('org_use'), onclick: () => { pref('team', ''); pref('orgTeam', '1'); toast(t('org_used')); redraw(); } })),
    !fileApplies && !lines.length ? el('p', { class: 'hint org-nofile', text: t('org_nofile') }) : el('details', { class: 'org-diffs', ...(lines.length ? { open: '' } : {}) }, el('summary', { text: t('org_diff_h', { n: lines.length }) }),
      lines.length ? el('ul', {}, lines.map((x) => el('li', { text: x }))) : el('p', { class: 'hint', text: t('org_none_diff') }), el('p', { class: 'hint', text: t('org_note_match') })));
}
// ---------- the sync extension (ADR-0062): the same pull, run by the browser when myafaqy opens — or by one click ----------
const extOn = () => !isTeamPortal && !!document.documentElement.dataset.afaqyExt;
let extState = null, extLastAt = null;
const monthLast = (ym) => { const d = new Date(Date.parse(`${ym}-01T00:00:00Z`)); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return d.toISOString().slice(0, 10); };
const extRecipe = () => { const ym = saudiDay(new Date().toISOString()).slice(0, 7); return managerPullRecipe(`${ymPrev(ym)}-01`, monthLast(ym), pullBranch().code, lang, 'ext'); };
const extSend = (now) => { if (extOn()) window.postMessage({ type: 'afaqy-ext-recipe', recipe: extRecipe(), now: !!now }, location.origin); };
window.addEventListener('message', async (e) => {
  if (!extOn() || e.source !== window || e.origin !== location.origin || !e.data) return;
  if (e.data.type === 'afaqy-ext-state') { extState = e.data; renderExtBox(); }
  if (e.data.type === 'afaqy-ext-packet' && e.data.packet && e.data.at !== extLastAt) {
    extLastAt = e.data.at;   // the same checks as a bookmark pull: both files, their schemas, one period, every row parsed
    const r = parseManagerTransfer({ type: MANAGER_AUTO_SCHEMA, nonce: 'e'.repeat(32), tasks: e.data.packet.tasks, reports: e.data.packet.reports });
    if (r.error) { toast(t(r.error)); return; }
    datasets = mergeDataset(datasets, r.dataset);
    reports = [...supersede(reports, r.reports).filter((x) => x.key !== r.reports.key), r.reports].sort((p, q) => (p.range.from < q.range.from ? 1 : -1));
    await store.put(datasets); await store.putReports(reports);
    setTimeout(closeMonths, 0);
    renderDatasets(); renderBlocks(); renderKpi(); renderMe(); renderHome(); renderExtBox();
    window.postMessage({ type: 'afaqy-ext-got' }, location.origin);
    toast(t('ext_got', { n: r.dataset.tasks.length, from: r.dataset.range.from, to: r.dataset.range.to }));
  }
});
function renderExtBox() {
  const box = $('ext-box'); if (!box || isTeamPortal) return;
  const on = extOn(), st = extState || {}, got = !!st.lastAt;
  const steps = [
    ['ext_step1', on, () => el('a', { class: 'btn tiny', href: './assets/afaqy-sync-extension.zip', download: 'afaqy-sync-extension.zip', text: `⬇ ${t('ext_dl')}` })],
    ['ext_step2', on, () => el('button', { type: 'button', class: 'btn tiny', text: t('ext_copy'), onclick: async () => { try { await navigator.clipboard.writeText('chrome://extensions'); toast(t('ext_copied')); } catch { toast('chrome://extensions'); } } })],
    ['ext_step3', on, () => el('button', { type: 'button', class: 'btn tiny', text: `↻ ${t('ext_reload')}`, onclick: () => location.reload() })],
    ['ext_step4', got, () => el('button', { type: 'button', class: 'btn tiny primary', text: t('ext_open'), onclick: () => window.open('https://myafaqy.com/#/home', '_blank') })],
    ['ext_step5', got, null]];
  const cur = steps.findIndex((s) => !s[1]);
  const list = el('ol', { class: 'ext-steps' }, steps.map(([k, done, act], i) => el('li', { class: done ? 'done' : i === cur ? 'current' : 'todo' },
    el('span', { class: 'ext-dot', text: done ? '✓' : String(i + 1) }),
    el('div', {}, el('strong', { text: t(`${k}_t`) }), el('p', { class: 'hint', text: t(`${k}_d`) }), !done && i === cur && act ? act() : null))));
  const how = el('details', { class: 'ext-how' }, el('summary', { text: t('ext_works_h') }), el('ul', {}, ['ext_works1', 'ext_works2', 'ext_works3'].map((k) => el('li', { text: t(k) }))));
  if (!on || !got) { set(box, el('p', { class: 'ext-line', text: on ? t('ext_almost') : t('ext_off') }), list, how); return; }
  const s = st, when = s.lastAt ? new Date(s.lastAt + 3 * 3600e3).toISOString().replace('T', ' ').slice(0, 16) : null;
  const msg = s.status === 'pulling' ? t('ext_pulling') : s.status === 'failed' ? t('ext_failed', { e: s.error || '' }) : s.status === 'needs-portal' ? t('ext_month') : when ? t('ext_last', { d: when }) : t('ext_never');
  set(box, el('p', { class: 'ext-line on', text: `${t('ext_on')} ${msg}` }),
    el('button', { type: 'button', class: 'btn primary ext-now', text: `↻ ${t('ext_now')}`, onclick: () => { extSend(true); window.open('https://myafaqy.com/#/home', '_blank'); toast(t('ext_now_toast')); } }),
    el('details', { class: 'ext-how' }, el('summary', { text: t('ext_setup_done') }), list), how);
}
// ---------- overtime estimated from task times (ADR-0063) ----------
const otState = { month: null, evening: 'span', scope: 'team' };
function renderOvertime() {
  const body = $('overtime-body'); if (!body || isTeamPortal) return;
  const tasks = allTasks();
  if (!tasks.length) { set(body, el('p', { class: 'note', text: t('ot_nodata') })); return; }
  const ppl = peopleOf(datasets), nm = (id) => nameOf(ppl.find((p) => p.id === id) || {}, lang) || id;
  const months = [...new Set(tasks.flatMap((x) => [x.completedAt, x.createdAt]).filter(Boolean).map((s) => saudiDay(s).slice(0, 7)))].sort().reverse().slice(0, 12);
  const now = saudiDay(new Date().toISOString()).slice(0, 7);
  if (!otState.month || !months.includes(otState.month)) otState.month = months.includes(now) ? now : months[0];
  const from = `${otState.month}-01`, to = monthLast(otState.month);
  const sys = new Set(ppl.filter((p) => /\bsystem\b|مستخدم النظام/i.test(`${p.nameEn || ''} ${p.nameAr || ''}`)).map((p) => p.id));   // automated accounts are not people (the System User created 1,024 tasks in October)
  const team = new Set((otState.scope === 'team' ? scoped(ppl).map((p) => p.id) : ppl.map((p) => p.id)).filter((id) => !sys.has(id)));   // the whole team file, leads and managers included
  const o = overtimeOf(tasks, { from, to, people: team, evening: otState.evening });
  const hm = (h) => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
  const tm = (ms) => new Date(ms + 3 * 3600e3).toISOString().slice(11, 16);
  const byId = new Map(tasks.map((x) => [String(x.id), x])), tag = (id) => { const x = byId.get(String(id)); return x ? ` · ${t(`src_${taskSource(x)}`)}` : ''; };
  const otGroup = (list) => { const hs = list.filter((x) => x.state === 'done' && x.completedAt && x.createdAt).map((x) => (Date.parse(x.completedAt) - Date.parse(x.createdAt)) / 3600e3).filter((h) => h >= 0);
    return { n: list.length, done: hs.length, avgHours: hs.length ? hs.reduce((s2, v) => s2 + v, 0) / hs.length : null }; };
  const otSrc = o.people.map((pp) => { const list = [...new Set(o.rows.filter((r) => r.pid === pp.pid).flatMap((r) => r.ids))].map((id) => byId.get(String(id))).filter(Boolean);
    return { pid: pp.pid, all: otGroup(list), by: Object.fromEntries(SOURCES.map((k) => [k, otGroup(list.filter((x) => taskSource(x) === k))])) }; });
  const day = (d) => new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));
  const pill = (key, val, label) => el('button', { type: 'button', class: `pill-btn${otState[key] === val ? ' on' : ''}`, text: label, onclick: () => { otState[key] = val; renderOvertime(); } });
  const csv = () => {
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`, lines = [['name', 'date', 'day', 'kind', 'first_time', 'first_task', 'last_time', 'last_task', 'tasks', 'hours'].join(',')];
    for (const r of o.rows) lines.push([nm(r.pid), r.date, day(r.date), r.kind === 'sat' ? 'saturday' : 'evening', tm(r.start), `${r.first.id} ${r.first.title}`, tm(r.last.at), `${r.last.id} ${r.last.title}`, r.tasks, r.hours].map(q).join(','));
    const url = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })); const a2 = el('a', { href: url, download: `overtime-${otState.month}.csv` }); document.body.append(a2); a2.click(); a2.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const tot = o.people.reduce((s, p) => ({ sd: s.sd + p.satDays, sh: s.sh + p.satHours, ed: s.ed + p.eveDays, eh: s.eh + p.eveHours, t: s.t + p.total }), { sd: 0, sh: 0, ed: 0, eh: 0, t: 0 });
  set(body,
    el('div', { class: 'ot-controls' },
      el('label', {}, el('span', { text: t('ot_month') }), el('select', { onchange: (e) => { otState.month = e.target.value; renderOvertime(); } }, months.map((m) => el('option', { value: m, selected: m === otState.month ? '' : null, text: m })))),
      el('div', { class: 'pills' }, pill('scope', 'team', t('ot_team')), pill('scope', 'all', t('ot_all'))),
      el('div', { class: 'pills' }, pill('evening', 'span', t('ot_eve_span')), pill('evening', 'from', t('ot_eve_from'))),
      o.rows.length ? el('button', { type: 'button', class: 'btn tiny', text: `⬇ ${t('ot_csv')}`, onclick: csv }) : null),
    el('p', { class: 'ot-answer', text: o.rows.length ? t('ot_answer', { n: o.people.length, h: hm(tot.t), s: tot.sd, e: tot.ed, m: otState.month, b: o.rows.filter((r) => r.batch).length }) : t('ot_none') }),
    o.rows.length ? el('div', { class: 'table-wrap' }, el('table', { class: 'ot-table' },
      el('thead', {}, el('tr', {}, ['ot_c_name', 'ot_c_sat_d', 'ot_c_sat_h', 'ot_c_eve_d', 'ot_c_eve_h', 'ot_c_total'].map((k) => el('th', { text: t(k) })))),
      el('tbody', {}, o.people.map((p) => el('tr', {}, el('td', { text: nm(p.pid) }), el('td', { text: String(p.satDays) }), el('td', { text: hm(p.satHours) }), el('td', { text: String(p.eveDays) }), el('td', { text: hm(p.eveHours) }), el('td', {}, el('strong', { text: hm(p.total) }))))),
      el('tfoot', {}, el('tr', {}, el('td', { text: t('ot_c_sum') }), el('td', { text: String(tot.sd) }), el('td', { text: hm(tot.sh) }), el('td', { text: String(tot.ed) }), el('td', { text: hm(tot.eh) }), el('td', {}, el('strong', { text: hm(tot.t) }))))) ) : null,
    o.rows.length ? el('h2', { class: 'ot-h', text: t('ot_src_h') }) : null,
    o.rows.length ? el('div', { class: 'table-wrap' }, el('table', { class: 'ot-table cnt-table ot-src' },
      el('thead', {}, el('tr', {}, el('th', { rowspan: '2', text: t('ot_c_name') }), ...['all', ...SOURCES].map((k) => el('th', { colspan: '2', text: t(`src_${k}`) }))),
        el('tr', {}, ...[0, 1, 2, 3].flatMap(() => [el('th', { class: 'num', text: t('ot_c_tasks') }), el('th', { class: 'num', text: t('cnt_c_avg') })]))),
      el('tbody', {}, otSrc.map((s) => el('tr', {}, el('td', { text: nm(s.pid) }), ...[s.all, ...SOURCES.map((k) => s.by[k])].flatMap((g) => [el('td', { class: 'num', text: String(g.n) }), el('td', { class: 'num', text: g.avgHours == null ? '—' : hm(g.avgHours) })])))))) : null,
    o.rows.length ? el('p', { class: 'hint', text: t('ot_src_note') }) : null,
    o.rows.length ? el('h2', { class: 'ot-h', text: t('ot_detail_h') }) : null,
    ...o.people.map((p) => el('details', { class: 'ot-person' }, el('summary', { text: `${nm(p.pid)} — ${hm(p.total)}` }),
      el('div', { class: 'table-wrap' }, el('table', { class: 'ot-table' },
        el('thead', {}, el('tr', {}, ['ot_c_date', 'ot_c_kind', 'ot_c_first', 'ot_c_last', 'ot_c_tasks', 'ot_c_hours'].map((k) => el('th', { text: t(k) })))),
        el('tbody', {}, o.rows.filter((r) => r.pid === p.pid).map((r) => el('tr', {}, el('td', { text: `${day(r.date)} ${r.date}` }), el('td', {}, el('span', { text: t(r.kind === 'sat' ? 'ot_k_sat' : 'ot_k_eve') }), r.batch ? el('div', { class: 'warn-text hint', text: `⚠ ${t('ot_batch')}` }) : null),
          el('td', { text: `${tm(r.start)} — ${r.first.title}${tag(r.first.id)}` }), el('td', { text: `${tm(r.last.at)} — ${r.last.title}${tag(r.last.id)}` }), el('td', { text: String(r.tasks) }), el('td', {}, el('strong', { text: hm(r.hours) }))))))))),
    el('details', { class: 'ot-how' }, el('summary', { text: t('ot_how_h') }), el('ul', {}, ['ot_how1', 'ot_how2', 'ot_how3', 'ot_how4', 'ot_how6', 'ot_how5'].map((k) => el('li', { text: t(k) })))));
}
// one way to show a person's or a team's tasks by source (ADR-0067): the same cards wherever they appear
// ---------- tasks: where they came from and how long they took to close (ADR-0067) — one engine: the board's factor1 ----------
function renderTeam() {
  applyNameFixes();
  applyPending().then((changed) => { if (changed) { renderTeam(); renderKpi(); renderMe(); } });
  const body = $('team-body'); if (!body) return;
  const known = new Map();
  for (const p of peopleOf(datasets)) known.set(p.id, p);
  if (me) for (const p of me.people) if (!known.has(p.id)) known.set(p.id, p);
  const pulled = new Set(known.keys());   // ADR-0069: a number in the team file that no pull knows is shown as such, never as a silent «5»
  for (const id of Object.keys(roster().people)) if (!known.has(id)) known.set(id, { id, nameEn: '', nameAr: '', teams: [] });
  const ro = roster();
  const everyone = [...known.values()].sort((a, b) => (nameOf(a, lang) || a.id).localeCompare(nameOf(b, lang) || b.id, lang));
  const on = scopeApplies(ro, everyone.map((p) => p.id));
  const people = on ? everyone.filter((p) => inScope(ro, p.id)) : everyone;
  const others = on ? everyone.filter((p) => !inScope(ro, p.id)) : [];
  const save = async (id, patch) => {
    rosterDevice = parseRoster(rosterDevice);
    rosterDevice.people[id] = { ...(ro.people[id] || {}), ...(rosterDevice.people[id] || {}), ...patch };
    if (!rosterDevice.people[id].position && !rosterDevice.people[id].positionEn && !rosterDevice.people[id].leaderId) delete rosterDevice.people[id];
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
    everyone.filter((p) => p.id !== id && (inScope(ro, p.id) || leaderOf(ro, id) === p.id)).map((p) => el('option', { value: p.id, text: nameOf(p, lang) || p.id, selected: leaderOf(ro, id) === p.id })));
  // the panel lists the whole team as set here (names stay on this device; the panel matches them in myafaqy's list) — nothing pre-ticked
  const afterSalesNames = scopeIds(ro).filter((id) => /after-sales/i.test((ro.people[id] || {}).positionEn || '')).map((id) => (known.get(id) || {}).nameEn).filter(Boolean);
  const ab = buildAssignBookmarklet(lang, afterSalesNames);
  set(body,
    orgCheckBox(),
    el('section', { class: 'assign-box' },
      el('h2', {}, t('assign_h'), helpQ('help_assign')),
      el('ol', { class: 'assign-steps' }, ['assign_s1', 'assign_s2', 'assign_s3', 'assign_s4'].map((k) => el('li', { text: t(k) }))),
      el('div', { class: 'row' },
        el('a', { class: 'btn primary bm', href: ab, draggable: 'true', text: `⚙ ${t('assign_bm')}`, onclick: (e) => { e.preventDefault(); toast(t('me_drag')); } }),
        el('button', { type: 'button', class: 'btn', text: t('me_copy'), onclick: async () => { try { await navigator.clipboard.writeText(decodeURIComponent(ab)); toast(t('me_copied')); } catch { toast(t('me_copy_fail')); } } })),
      el('p', { class: 'note', text: t('assign_warn') })),
    renderSignatures(),
    el('h2', {}, t('team_roster_h'), helpQ('help_roster')),
    el('div', { class: 'row', style: 'margin-bottom:14px' },
      el('button', { type: 'button', class: `btn${teamEdit ? ' primary' : ''} team-edit-btn`, text: teamEdit ? `✓ ${t('team_edit_done')}` : `✎ ${t('team_edit')}`, onclick: () => { teamEdit = !teamEdit; renderTeam(); } }),
      el('button', { type: 'button', class: 'btn primary', text: t('team_download'), onclick: download }),
      el('button', { type: 'button', class: 'btn', text: t('team_upload'), onclick: () => upload.click() }), upload,
      el('span', { class: 'hint', text: on ? t('team_scope_n', { n: people.length }) : t('team_filled', { n: Object.keys(ro.people).length, m: people.length }) })),
    people.length ? el('div', { class: 'table-wrap team-table' }, el('table', {},
      el('thead', {}, el('tr', {}, ['team_col_name', 'team_col_id', 'team_col_pos', 'team_col_leader'].map((k) => el('th', { text: t(k) })))),
      el('tbody', {}, byDept(people, ro).map((p) => p.__head ? el('tr', { class: 'team-dept' }, el('td', { colspan: '4', text: p.__head })) : el('tr', {},
        el('td', {}, el('div', { class: 'name-line' }, el('span', { text: nameOf(p, lang) || '—' }),
          el('button', { type: 'button', class: 'btn quiet tiny', title: t('team_fix_name'), 'aria-label': t('team_fix_name'), text: '✎', onclick: () => {
            const v = prompt(t('team_fix_name_q'), nameOf(p, lang) || ''); if (v == null) return; const fx = nameFixes();
            const key = lang === 'ar' ? 'ar' : 'en'; fx[p.id] = { ...(fx[p.id] || {}), [key]: v.trim() }; if (!v.trim()) delete fx[p.id][key];
            if (fx[p.id] && !fx[p.id].ar && !fx[p.id].en) delete fx[p.id]; localStorage.setItem(NAME_KEY, JSON.stringify(fx));
            if (!v.trim()) location.reload(); else { renderTeam(); renderMe(); renderKpi(); } } })),
          p.teams && p.teams.length ? el('div', { class: 'hint', text: p.teams.join(' · ') }) : null,
          pulled.has(p.id) ? null : el('div', { class: 'hint warn-text', text: t('team_unknown_id') })),
        el('td', { class: 'ltr', text: p.id }),
        el('td', {}, teamEdit   // both titles are fields while editing; otherwise the title in the page's language
          ? el('div', { class: 'pos-pair' }, el('input', { type: 'text', lang: 'ar', dir: 'rtl', value: (ro.people[p.id] || {}).position || '', placeholder: t('team_pos_ar_ph'), 'aria-label': t('team_pos_ar_ph'), onchange: (e) => save(p.id, { position: e.target.value.trim() }) }),
              el('input', { type: 'text', lang: 'en', dir: 'ltr', value: (ro.people[p.id] || {}).positionEn || '', placeholder: t('team_pos_en_ph'), 'aria-label': t('team_pos_en_ph'), onchange: (e) => save(p.id, { positionEn: e.target.value.trim() }) }))
          : el('span', { class: 'ro-val', text: positionOf(ro, p.id, lang === 'ar' ? 'ar' : 'en') || '—' })),
        el('td', {}, el('div', { class: 'row-actions' }, leaderSelect(p.id), el('button', { type: 'button', class: 'btn quiet tiny', title: t('team_remove'), 'aria-label': t('team_remove'), text: '✕', onclick: async () => {
          if (!confirm(t('team_remove_q', { who: nameOf(p, lang) || p.id }))) return;
          rosterDevice = parseRoster(rosterDevice); rosterDevice.people[p.id] = { removed: true }; await store.putRoster(rosterDevice); renderTeam(); renderMe(); renderKpi(); toast(t('team_removed')); } }))))))))
      : el('div', { class: 'empty', text: t('team_none') }),
    (() => { const list = pendingList();
      const up = el('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return;
        try { const j = JSON.parse(await f.text()); const rows = (Array.isArray(j) ? j : j.people || []).map(cleanPending).filter(Boolean);
          const have = new Set(pendingList().map((x) => x.name.toLowerCase())); localStorage.setItem(PENDING_KEY, JSON.stringify([...pendingList(), ...rows.filter((x) => !have.has(x.name.toLowerCase()))]));
          toast(t('pending_loaded', { n: rows.length })); renderTeam(); } catch { toast(t('err_json')); } e.target.value = ''; } });
      return el('section', { class: 'pending-box' }, el('h3', { text: t('pending_h', { n: list.length }) }),
        list.length ? el('ul', { class: 'pending-list' }, list.map((x) => el('li', {}, el('b', { class: 'ltr', text: x.name }), el('span', { class: 'hint', text: ` — ${lang === 'ar' ? x.position : (x.positionEn || x.position)}${x.onLeave ? ` · ${t('card_on_leave')}` : ''}` }),
          el('button', { type: 'button', class: 'btn quiet tiny', 'aria-label': t('remove'), text: '✕', onclick: () => { localStorage.setItem(PENDING_KEY, JSON.stringify(pendingList().filter((y) => y.name !== x.name))); renderTeam(); } })))) : null,
        el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn tiny', text: t('pending_upload'), onclick: () => up.click() }), up)); })(),
    (() => { const cand = everyone.filter((x) => pulled.has(x.id) && !ro.people[x.id]);   // only real people from the pull, not yet in the team
      const pick = el('select', { 'aria-label': t('team_add_pick') }, el('option', { value: '', text: t('team_add_pick') }), cand.map((x) => el('option', { value: x.id, text: `${nameOf(x, lang) || x.id} (${x.id})` })));
      const posAr = el('input', { type: 'text', lang: 'ar', dir: 'rtl', placeholder: t('team_pos_ar_ph') }), posEn = el('input', { type: 'text', lang: 'en', dir: 'ltr', placeholder: t('team_pos_en_ph') });
      return el('div', { class: 'row team-add' }, el('b', { text: t('team_add_h') }), pick, posAr, posEn,
        el('button', { type: 'button', class: 'btn tiny', text: t('team_add_btn'), onclick: () => { const id = pick.value;
          if (!id || !(posAr.value.trim() || posEn.value.trim())) { toast(t('team_add_bad2')); return; } save(id, { position: posAr.value.trim(), positionEn: posEn.value.trim() }); } })); })());
  // ADR-0059: the list reads as text until «Edit team»; editing shows the fields, the ✎ buttons and the file buttons
  if (!teamEdit) { const tb = body.querySelector('.team-table');
    if (tb) { for (const c of tb.querySelectorAll('input, select')) c.replaceWith(el('span', { class: 'ro-val', text: c.tagName === 'SELECT' ? (c.selectedOptions[0] && c.value ? c.selectedOptions[0].text : '—') : (c.value || '—') }));
      for (const b of tb.querySelectorAll('button')) b.remove(); }
    for (const n of body.querySelectorAll('.team-add, .signs')) n.hidden = true;
    for (const b of body.querySelectorAll('button')) if (b.textContent.trim() === t('pending_upload')) b.hidden = true;
    for (const b of body.querySelectorAll('.team-edit-btn ~ .btn, .team-edit-btn ~ input[type=file]')) b.hidden = true; }
}

// ---------- Factor 2 (technician points) and Factor 3 (after-sales tickets), from the reports file of the same period ----------
function renderReports(key, team = null) {
  const rep = reports.find((r) => r.key === key);
  if (!rep) return [el('h2', { text: t('f3_title') }), el('p', { class: 'note info', text: t('reports_none') })];
  const peopleById = new Map(peopleOf(datasets).map((p) => [p.id, p]));
  const nm = (id) => nameOf(peopleById.get(id), lang) || id;
  const tt = techTotals(rep), at0 = afterSalesTotals(rep), ac = activityTotals(rep, team);
  const at = scopeOn(peopleOf(datasets)) ? { ...at0, rows: at0.rows.filter((r) => inScope(roster(), String(r.id))) } : at0;
  const months = rep.techPoints.map((m) => m.month).join('، ');
  const tcols = [['f2_name', null], ['f2_installed', 'installedDeviceCount'], ['f2_maint', 'maintainedDeviceCount'], ['f2_fix', 'maintainedFixDeviceCount'],
    ['f2_reservice', 'reServiceDeviceCount'], ['f2_stop', 'stopServiceDeviceCount'], ['f2_group', 'groupInstallationCount'],
    ['f2_extra', 'additionalWorkCount'], ['f2_viol', 'violationCount'], ['f2_points', 'totalPoint']];
  const tline = (r, cls, label) => el('tr', { class: cls }, el('td', { text: label || ((lang === 'en' ? r.nameEn || r.nameAr : r.nameAr || r.nameEn) || r.technicianId) }), ...tcols.slice(1).map(([, f]) => el('td', { class: 'num', text: r[f] })));
  const maxAct = Math.max(1, ...ac.people.map((r) => r.activities));
  return [
    el('h2', { id: 'k-reports' }, t('f3_title'), helpQ('help_f3')),
    at.rows.length ? el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, ['f3_name', 'f3_open', 'f3_pending', 'f3_done', 'f3_total'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
      el('tbody', {}, at.rows.map((r) => el('tr', {}, el('td', { text: r.name }), ...[r.open, r.pending, r.done, r.total].map((v) => el('td', { class: 'num', text: v })))),
        el('tr', { class: 'total' }, el('td', { text: t('team') }), ...[at.total.open, at.total.pending, at.total.done, at.total.total].map((v) => el('td', { class: 'num', text: v })))))) : el('div', { class: 'empty', text: t('f3_none') }),
    el('h2', {}, t('f4_title'), helpQ('help_f4')),
    ac.people.length ? [
      el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, el('th', { text: t('col_person') }), el('th', { class: 'num', text: t('f4_activities') }), el('th', { class: 'num', text: t('f4_customers') }),
          el('th', { class: 'num', text: t('f4_with_task') }), ...ac.statuses.map((st) => el('th', { class: 'num', text: st })))),
        el('tbody', {}, ac.people.map((r) => el('tr', {},
          el('td', {}, el('div', { text: nm(r.id) }), positionOf(roster(), r.id, lang) ? el('div', { class: 'hint', text: positionOf(roster(), r.id, lang) }) : null),
          el('td', { class: 'num' }, el('div', { class: 'bar-cell' }, el('b', { text: String(r.activities) }), el('i', {}, el('span', { style: `width:${Math.round((r.activities / maxAct) * 100)}%` })))),
          el('td', { class: 'num', text: String(r.customers) }), el('td', { class: 'num', text: String(r.withTask) }),
          ...ac.statuses.map((st) => el('td', { class: 'num', text: String(r.byStatus[st] || 0) })))),
          el('tr', { class: 'total' }, el('td', { text: t('team') }), el('td', { class: 'num', text: String(ac.total.activities) }), el('td', { class: 'num', text: String(ac.total.customers) }),
            el('td', { class: 'num', text: String(ac.total.withTask) }), ...ac.statuses.map((st) => el('td', { class: 'num', text: String(ac.total.byStatus[st] || 0) })))))),
      el('div', { class: 'donuts' },
        ac.categories.length ? donut(t('f4_by_category'), ac.categories.map((c) => ({ label: c, value: ac.total.byCategory[c] }))) : null,
        ac.statuses.length ? donut(t('f4_by_status'), ac.statuses.map((st) => ({ label: st, value: ac.total.byStatus[st] }))) : null)]
      : (() => {
        const all = activityTotals(rep);
        if (!all.total.activities) return el('div', { class: 'empty', text: (rep.activities || []).length || rep.activities ? t('f4_zero') : t('f4_none') });
        return el('p', { class: 'note', text: t('f4_outside_n', { n: all.total.activities }) });
      })(),
    coverageSection(rep, team, nm),
    el('details', { class: 'tucked' }, el('summary', { text: t('f2_show') }),
      el('p', { class: 'hint', text: t('f2_sub', { months }) }),
      tt.rows.length ? el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, tcols.map(([k], i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
        el('tbody', {}, tt.rows.map((r) => tline(r)), tline(tt.total, 'total', t('team'))))) : el('div', { class: 'empty', text: t('f2_none') }))];
}

// ---------- guide: every feature is written here — a feature missing from the guide does not exist for the team ----------
function renderGuide() {
  // dates and version numbers are isolated, so right-to-left text never reverses 2026-10-29 into 29-10-2026
  const iso = (x) => `\u2066${x}\u2069`;
  const stamp = release ? t('g_version', { v: iso(release.version), date: iso(release.date) }) : t('g_version', { v: iso(PORTAL_VERSION), date: '' }).replace(/ — $/, '');
  set($('guide-body'),
    el('div', { class: 'guide-head' }, el('span', { class: 'guide-ver', text: stamp }),
      el('button', { type: 'button', class: 'btn no-print', text: t('g_print'), onclick: () => window.print() })),
    el('div', { class: 'intro-card' }, el('div', { class: 'ic-txt' }, el('b', { text: t('intro_h') }), el('span', { text: t('intro_b') })),
      el('div', { class: 'ic-acts' }, el('a', { class: 'btn primary', href: overviewDoc(lang === 'ar'), target: '_blank', rel: 'noopener', text: t('intro_view') }), el('a', { class: 'btn', href: overviewDoc(lang === 'ar'), download: '', text: t('intro_dl') }), el('a', { class: 'ic-alt', href: overviewDoc(lang !== 'ar'), target: '_blank', rel: 'noopener', text: t('intro_alt') }))),
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
    if (release && release.version && release.version !== PORTAL_VERSION) autoUpdate();
  } catch { /* offline: the notes simply are not shown */ }
}
function busyTyping() { const a = document.activeElement; return !!(a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !['checkbox', 'radio', 'file', 'button'].includes(a.type))) && a.value); }
let updating = false;
async function autoUpdate() {
  if (updating) return; updating = true;
  try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); } catch { /* offline */ }
  const target = release.version;
  let tried = null; try { tried = sessionStorage.getItem('afaqy-reload-for'); } catch { /* private */ }
  const go = () => {
    // one automatic reload per published version — if the page is still old after it, the button takes over (never a loop)
    if (busyTyping() || tried === target) { $('update-bar').hidden = false; return; }
    try { sessionStorage.setItem('afaqy-reload-for', target); sessionStorage.setItem('afaqy-updated-from', PORTAL_VERSION); } catch { $('update-bar').hidden = false; return; }
    location.reload();
  };
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('controllerchange', go, { once: true });
    setTimeout(() => { if (!document.hidden) go(); }, 8000);
  } else go();
}
function announceUpdate() {
  let from = null; try { from = sessionStorage.getItem('afaqy-updated-from'); sessionStorage.removeItem('afaqy-updated-from'); } catch { /* private */ }
  if (from && from !== PORTAL_VERSION) toast(t('updated_to', { v: PORTAL_VERSION }));
}
function openNews() {
  const notes = (release && release.notes && (release.notes[lang] || release.notes.ar)) || [];
  $('news-date').textContent = release ? `\u2066v${release.version} — ${release.date}\u2069` : `\u2066v${PORTAL_VERSION}\u2069`;
  set($('news-list'), notes.map((n) => el('li', { text: n })));
  $('news-dialog').showModal();
}

// ---------- language, theme, routing ----------
// the overview PDF: Arabic or English; the team link's edition leaves out the manager link
const overviewDoc = (arabic) => `assets/docs/AFAQY-Jeddah-Portal-Overview${isTeamPortal ? '-Team' : ''}${arabic ? '' : '-EN'}.pdf`;
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = dirOf(lang);
  document.querySelectorAll('[data-t]').forEach((n) => { n.textContent = t(n.dataset.t); });
  document.querySelectorAll('[data-tp]').forEach((n) => { n.placeholder = t(n.dataset.tp); });
  $('lang-select').value = lang;
  { const mine = overviewDoc(lang === 'ar'), other = overviewDoc(lang !== 'ar');   // the overview in the reader's language, the other one beside it; the team link gets the team edition
    document.querySelectorAll('[data-intro-doc]').forEach((x) => { x.href = x.dataset.introDoc === 'alt' ? other : mine; }); }
  $('menu-btn').setAttribute('aria-label', t('menu'));
  paintThemeButton();
  document.title = `${t('brand')} — ${t('portal')} — ${t(isTeamPortal ? 'title_team' : 'title_admin')}`;
  renderSide(); renderTools(); renderBlocks(); renderDatasets(); renderKpi(); renderGuide(); renderMe(); renderPro(); renderMgr(); renderTeam(); renderWeights();
  for (const [id, f] of frames) f.title = L((MODULES.find((m) => m.id === id) || {}).name, lang);
  route(); renderMeTour();
}
const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
function paintThemeButton() { $('theme-btn').textContent = isDark() ? t('theme_light') : t('theme_dark'); }
function applyTheme() {
  const v = pref('theme');
  if (v === 'light' || v === 'dark') document.documentElement.dataset.theme = v; else delete document.documentElement.dataset.theme;
  paintThemeButton();
}
// ---------- ADR-0071: «خطط الفريق» — the team planner, cut to the manager's own part, kept on this device only ----------
// ADR-0072: the manager uploads the structure of his own part and it is shown exactly as uploaded. It is kept in this browser
// only (IndexedDB) — never published, never sent — and shown in a sandboxed frame with no access to the portal's origin.
let plannerFile;   // undefined until read from the device
const isHtml = (s) => /<!doctype html|<html[\s>]|<body[\s>]/i.test(String(s || '').slice(0, 20000));
function renderPlanner() {
  const body = $('planner-body'); if (!body || isTeamPortal) return;
  if (plannerFile === undefined) { set(body, el('p', { class: 'hint', text: '…' })); store.getPlanner().then((v) => { plannerFile = v || null; renderPlanner(); }); return; }
  const status = el('p', { class: 'msg', role: 'status', 'aria-live': 'polite' });
  const input = el('input', { type: 'file', accept: '.html,.htm,text/html', hidden: true, onchange: async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const html = await f.text();
    if (!isHtml(html)) { status.textContent = t('pl_err_not_html'); status.classList.add('err'); return; }
    plannerFile = { name: f.name, at: new Date().toISOString(), html }; await store.putPlanner(plannerFile); toast(t('pl_saved')); renderPlanner(); } });
  const pick = (label, cls) => el('button', { type: 'button', class: `btn ${cls}`, text: label, onclick: () => input.click() });
  const remove = el('button', { type: 'button', class: 'btn tiny quiet', text: t('pl_remove'), onclick: async () => { if (!confirm(t('pl_remove_confirm'))) return; plannerFile = null; await store.putPlanner(null); renderPlanner(); } });
  if (!plannerFile) { set(body, el('div', { class: 'card pl-empty' }, el('p', { text: t('pl_empty') }), el('p', { class: 'hint', text: t('pl_private') }), el('div', { class: 'row' }, pick(t('pl_upload'), 'primary'), input), status)); return; }
  const sum = plannerSummary(plannerFile.html);
  // inside the sandbox the browser's storage is closed; the page gets an in-memory one, so its features work while it is open
  // (nothing is kept, as the page says) — the frame stays cut off from the portal and its data
  const SHIM = '<script>(()=>{const mk=()=>{const d=new Map();return{getItem:(k)=>(d.has(String(k))?d.get(String(k)):null),setItem:(k,v)=>{d.set(String(k),String(v));},removeItem:(k)=>{d.delete(String(k));},clear:()=>d.clear(),key:(i)=>[...d.keys()][i]??null,get length(){return d.size;}};};for(const n of [\'localStorage\',\'sessionStorage\']){try{void window[n].length;}catch(e){try{Object.defineProperty(window,n,{value:mk(),configurable:true});}catch(_){}}}})();<\/script>';   // «<\/script»: the same text, but cannot end an inline <script> (the single-file preview inlines this file)
  const doc = /<head[^>]*>/i.test(plannerFile.html) ? plannerFile.html.replace(/<head[^>]*>/i, (m) => m + SHIM) : SHIM + plannerFile.html;
  const frame = el('iframe', { class: 'pl-frame', title: t('nav_planner'), sandbox: 'allow-scripts allow-downloads allow-popups allow-modals allow-forms', referrerpolicy: 'no-referrer', srcdoc: doc });
  set(body,
    el('div', { class: 'pl-bar' },
      el('div', {}, el('b', { text: sum ? sum.plans.map((p) => p.name).join(' · ') : plannerFile.name }),
        el('div', { class: 'hint', text: t(sum ? 'pl_info' : 'pl_info_file', { n: sum ? sum.people : 0, file: plannerFile.name, at: saudiDay(plannerFile.at) }) })),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn tiny', text: t('pl_full'), onclick: () => { if (frame.requestFullscreen) frame.requestFullscreen(); } }), pick(t('pl_replace'), 'tiny quiet'), remove, input)),
    el('p', { class: 'hint', text: t('pl_private') }), status, frame);
}

// ---------- «البريد من ملف PST» (ADR-0058): who sent how many, and each subject sorted into three kinds — read on the device, never uploaded ----------
let mfState = { msgs: null, file: '', picked: new Set(), rules: null, cat: 'all', from: '', to: '' };
const MF_DEFAULT_RULES = () => [
  { k: 'upsell', words: ['new inquiry', 'inquiry', 'new request', 'new requirement', 'requirement', 'quotation', 'طلب جديد', 'استفسار', 'متطلب', 'عرض سعر'] },
  { k: 'advanced', words: ['integration', 'api', 'ربط', 'تكامل'] },
  { k: 'normal', words: ['wasl', 'وصل'] },
];
const mfRules = () => mfState.rules || MF_DEFAULT_RULES();
/** ADR-0077: the manager's own categories — any number up to 12, each a key, an optional name and its words; order is priority. */
function cleanMailRules(x) {
  if (!Array.isArray(x)) return null; const seen = new Set();
  const out = x.slice(0, 12).map((r) => ({ k: String((r && r.k) || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 24), name: String((r && r.name) || '').trim().slice(0, 40),
    words: (Array.isArray(r && r.words) ? r.words : []).map((w) => String(w).trim().slice(0, 60)).filter(Boolean).slice(0, 40) }))
    .filter((r) => r.k && r.k !== 'other' && !seen.has(r.k) && seen.add(r.k)).map((r) => (r.name ? r : { k: r.k, words: r.words }));
  return out.length ? out : null;
}
const mfCategory = (subject, rules) => { const s = String(subject || '').toLowerCase(); for (const r of rules) if (r.words.some((w) => w && s.includes(String(w).toLowerCase()))) return r.k; return 'other'; };
async function mfLoadLib() { if (window.PSTFile) return;
  await new Promise((res, rej) => { const sc = el('script', { src: './assets/vendor/pst-extractor.min.js' }); sc.onload = res; sc.onerror = () => rej(new Error('pst lib')); document.head.append(sc); }); }
function mfParse(buf) {
  const pst = new window.PSTFile(window.Buffer.from(buf)); const out = []; const seen = new Set(), seenMail = new Set(); let copies = 0;   // ADR-0075
  const walk = (f, path) => {
    if (f.hasSubfolders) for (const c of f.getSubFolders()) walk(c, path ? `${path}/${c.displayName}` : String(c.displayName || ''));
    if (f.contentCount > 0) { let m = f.getNextChild(), guard = 0;
      while (m && guard++ < 500000) { const key = m.descriptorNodeId != null ? m.descriptorNodeId : `${path}:${out.length}`;
        const mk = mailKey(m); if (!seen.has(key) && seenMail.has(mk)) copies++;   // the same e-mail kept in another folder
        if (!seen.has(key) && !seenMail.has(mk)) { seen.add(key); seenMail.add(mk); const d = m.clientSubmitTime || m.messageDeliveryTime;
          out.push({ id: key, folder: path || '/', subject: String(m.subject || '').slice(0, 300), sender: String(m.senderName || m.senderEmailAddress || '').trim().slice(0, 120), email: String(m.senderEmailAddress || '').slice(0, 160), to: String(m.displayTo || '').slice(0, 300), date: d ? new Date(d).toISOString() : '' }); }
        m = f.getNextChild(); } } };
  walk(pst.getRootFolder(), ''); out.copies = copies; return out;
}
async function mfLoadFile(f, say) {   // read a PST on the device — from one place only, the mail page (ADR-0068)
  say(t('mf_reading', { name: f.name, mb: Math.max(1, Math.round(f.size / 1048576)) }));
  try { await mfLoadLib(); const buf = await f.arrayBuffer(); await new Promise((r) => setTimeout(r, 30)); mfState.msgs = mfParse(buf); mfState.file = f.name; mfState.copies = mfState.msgs.copies || 0;
    const counts = new Map(); for (const m of mfState.msgs) counts.set(m.sender, (counts.get(m.sender) || 0) + 1);
    mfState.picked = new Set([...counts.entries()].sort((p, q) => q[1] - p[1]).slice(0, 5).map(([k]) => k)); toast(t('mf_done', { n: mfState.msgs.length })); return true; }
  catch (err) { console.error(err); say(t('mf_fail')); return false; }
}
function renderMailFile() {
  const body = $('mailfile-body'); if (!body || isTeamPortal) return;
  const rulesOpen = !!(body.querySelector('.mf-rules') && body.querySelector('.mf-rules').open);   // the rules box stays open while its words are edited
  const st = mfState, rules = mfRules(), catName = (k) => { const r = rules.find((x) => x.k === k); return (r && r.name) || (['normal', 'advanced', 'upsell', 'other'].includes(k) ? t(`mf_cat_${k}`) : k); };
  const CATS = [...rules.map((r) => r.k), 'other'];   // ADR-0077: the results follow the manager's categories
  const status = el('p', { class: 'msg', role: 'status', 'aria-live': 'polite', text: st.msgs ? t(st.copies ? 'mf_file_copies' : 'mf_file', { name: st.file, n: st.msgs.length, c: st.copies }) : '' });
  const fileIn = el('input', { type: 'file', accept: '.pst,.ost', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return;
    if (await mfLoadFile(f, (s) => { status.textContent = s; })) renderMailFile(); e.target.value = ''; } });
  const top = el('section', { class: 'dt-quick' },
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary', text: `📂 ${t('mf_pick_file')}`, onclick: () => fileIn.click() }), fileIn, el('span', { class: 'hint', text: t('mf_privacy') })), status,
    el('details', { class: 'me-phones' }, el('summary', { text: t('mf_how_h') }), el('p', { class: 'hint', text: t('mf_how') })));
  // ADR-0070: the Outlook mailbox lives here with the PST file — one place for mail, shown with or without a file
  const mailbox = datasets.length ? kpiMailSection(currentTeam(scoped(peopleOf(datasets)), allTasks()), new Map(peopleOf(datasets).map((p) => [p.id, p]))) : null;
  const saveRules = async (next) => { st.rules = next; await store.kvPut('mailrules', next); renderMailFile(); };
  const edit = (fn) => { const next = rules.map((x) => ({ ...x, words: [...x.words] })); fn(next); saveRules(cleanMailRules(next)); };
  const rulesBox = el('details', { class: 'me-phones mf-rules', ...(rulesOpen || !st.msgs ? { open: '' } : {}) }, el('summary', { text: t('mf_rules_h') }), el('p', { class: 'hint', text: t('mf_rules_lead') }),
    ...rules.map((r, i) => el('div', { class: 'mf-rule', 'data-k': r.k },
      el('input', { type: 'text', class: 'mf-rule-name', value: r.name || '', placeholder: catName(r.k), 'aria-label': t('mf_rule_name'), dir: 'auto', maxlength: 40,
        onchange: (e) => edit((n) => { n[i].name = e.target.value.trim(); }) }),
      el('input', { type: 'text', class: 'mf-rule-words', value: r.words.join('، '), dir: 'auto', 'aria-label': t('mf_rule_words'),
        onchange: (e) => edit((n) => { n[i].words = e.target.value.split(/[,،]/).map((w) => w.trim()).filter(Boolean).slice(0, 40); }) }),
      el('div', { class: 'mf-rule-acts' },
        el('button', { type: 'button', class: 'btn tiny quiet', title: t('mf_rule_up'), 'aria-label': t('mf_rule_up'), disabled: i === 0, text: '▲', onclick: () => edit((n) => { [n[i - 1], n[i]] = [n[i], n[i - 1]]; }) }),
        el('button', { type: 'button', class: 'btn tiny quiet', title: t('mf_rule_down'), 'aria-label': t('mf_rule_down'), disabled: i === rules.length - 1, text: '▼', onclick: () => edit((n) => { [n[i + 1], n[i]] = [n[i], n[i + 1]]; }) }),
        el('button', { type: 'button', class: 'btn tiny quiet', title: t('mf_rule_del'), 'aria-label': t('mf_rule_del'), disabled: rules.length === 1, text: '✕', onclick: () => { if (confirm(t('mf_rule_del_confirm', { name: catName(r.k) }))) edit((n) => { n.splice(i, 1); }); } })))),
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn tiny', disabled: rules.length >= 12, text: `＋ ${t('mf_rule_add')}`, onclick: () => edit((n) => { n.push({ k: `c${Date.now().toString(36)}`, name: t('mf_rule_new'), words: [] }); }) }),
      el('button', { type: 'button', class: 'btn tiny quiet', text: t('mf_rules_reset'), onclick: () => { if (confirm(t('mf_rules_reset_confirm'))) saveRules(null); } })));
  // ADR-0075 / ADR-0076: how this page counts and its classification rules — shown BEFORE a file is chosen too, so they can be read first
  const howBox = el('details', { class: 'tucked mf-howcount', open: true }, el('summary', { text: t('mf_count_h') }), el('ul', { class: 'defs' }, ['mf_count_1', 'mf_count_2', 'mf_count_3', 'mf_count_4', 'mf_count_5'].map((k) => el('li', { text: t(k) }))));
  if (!st.msgs) { set(body, mailbox, top, rulesBox, howBox); return; }
  const inRange = (m) => (!st.from || (m.date || '').slice(0, 10) >= st.from) && (!st.to || (m.date || '').slice(0, 10) <= st.to);
  const ranged = st.msgs.filter(inRange), counts = new Map(), emails = new Map();
  for (const m of ranged) { counts.set(m.sender, (counts.get(m.sender) || 0) + 1); if (!emails.has(m.sender) && m.email && !m.email.startsWith('/')) emails.set(m.sender, m.email); }
  const senders = [...counts.entries()].sort((p, q) => q[1] - p[1]);
  const dateRow = el('div', { class: 'row mgr-dates' }, el('label', {}, el('span', { text: t('mf_from') }), el('input', { type: 'date', value: st.from, onchange: (e) => { st.from = e.target.value; renderMailFile(); } })),
    el('label', {}, el('span', { text: t('mf_to') }), el('input', { type: 'date', value: st.to, onchange: (e) => { st.to = e.target.value; renderMailFile(); } })));
  const sendersBox = el('section', {}, el('h2', { text: t('mf_senders_h') }), el('p', { class: 'hint', text: t('mf_senders_lead') }),
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn tiny', text: t('mf_all'), onclick: () => { st.picked = new Set(senders.map(([k]) => k)); renderMailFile(); } }),
      el('button', { type: 'button', class: 'btn tiny', text: t('mf_none'), onclick: () => { st.picked = new Set(); renderMailFile(); } })),
    el('div', { class: 'table-wrap mf-senders' }, el('table', {}, el('thead', {}, el('tr', {}, ['', 'mf_col_sender', 'mf_col_email', 'mf_col_n'].map((k, i) => el('th', { class: i === 3 ? 'num' : null, text: k ? t(k) : '' })))),
      el('tbody', {}, senders.slice(0, 300).map(([s, n]) => el('tr', { class: st.picked.has(s) ? 'on' : null },
        el('td', {}, el('input', { type: 'checkbox', 'aria-label': s, ...(st.picked.has(s) ? { checked: '' } : {}), onchange: (e) => { if (e.target.checked) st.picked.add(s); else st.picked.delete(s); renderMailFile(); } })),
        el('td', { text: s || '—' }), el('td', { class: 'ltr hint', text: emails.get(s) || '' }), el('td', { class: 'num', text: String(n) })))))));
  const picked = ranged.filter((m) => st.picked.has(m.sender)).map((m) => ({ ...m, cat: mfCategory(m.subject, rules) }));
  const perSender = [...st.picked].map((s) => { const list = picked.filter((m) => m.sender === s); const row = { s, total: list.length }; for (const c of CATS) row[c] = list.filter((m) => m.cat === c).length; return row; }).sort((p, q) => q.total - p.total);
  const tot = { total: picked.length }; for (const c of CATS) tot[c] = picked.filter((m) => m.cat === c).length;
  const results = el('section', { id: 'mf-results' }, el('h2', { text: t('mf_results_h') }),
    el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, [t('mf_col_sender'), t('mf_col_total'), ...CATS.map(catName)].map((h, i) => el('th', { class: i ? 'num' : null, text: h })))),
      el('tbody', {}, perSender.map((r) => el('tr', {}, el('td', { text: r.s || '—' }), el('td', { class: 'num', text: String(r.total) }), ...CATS.map((c) => el('td', { class: 'num', text: String(r[c]) })))),
        el('tr', { class: 'mf-total' }, el('td', { text: t('mf_col_total') }), el('td', { class: 'num', text: String(tot.total) }), ...CATS.map((c) => el('td', { class: 'num', text: String(tot[c]) })))))));
  const shown = picked.filter((m) => st.cat === 'all' || m.cat === st.cat).sort((p, q) => (q.date || '').localeCompare(p.date || ''));
  const csv = () => { const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const rows = [[t('mf_col_date'), t('mf_col_sender'), t('mf_col_subject'), t('mf_col_cat'), t('mf_col_folder')], ...shown.map((m) => [(m.date || '').slice(0, 10), m.sender, m.subject, catName(m.cat), m.folder])];
    const blob = new Blob(['\ufeff' + rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const link = el('a', { href: URL.createObjectURL(blob), download: 'mail-by-kind.csv' }); document.body.append(link); link.click(); link.remove(); };
  const { tbody, more } = pagedBody([...shown], (m) => el('tr', {}, el('td', { class: 'ltr', text: (m.date || '').slice(0, 10) }), el('td', { text: m.sender }), el('td', { text: m.subject || '—' }), el('td', {}, el('span', { class: `mf-pill ${m.cat}`, text: catName(m.cat) })), el('td', { class: 'hint', text: m.folder })));
  const listBox = el('section', { id: 'mf-list' }, el('h2', { text: t('mf_list_h') }),
    el('div', { class: 'row' }, el('div', { class: 'pills' }, [['all', t('mf_all')], ...CATS.map((c) => [c, `${catName(c)} (${tot[c]})`])].map(([k, l]) => el('button', { type: 'button', class: `pill-btn${st.cat === k ? ' on' : ''}`, text: l, onclick: () => { st.cat = k; renderMailFile(); } }))),
      el('button', { type: 'button', class: 'btn tiny', text: `⬇ ${t('mf_export')}`, onclick: csv })),
    shown.length ? el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, [t('mf_col_date'), t('mf_col_sender'), t('mf_col_subject'), t('mf_col_cat'), t('mf_col_folder')].map((h) => el('th', { text: h })))), tbody), more) : el('div', { class: 'empty', text: t('mf_empty') }));
  set(body, mailbox, top, dateRow, sendersBox, rulesBox, results, howBox, listBox);
}
function route() {
  if (location.hash.startsWith('#rank=')) { takeRankLink(true).then(route); return; }   // a rank link can arrive while the portal is already open (only the hash changes)
  const views = ['home', 'tools', 'me', 'pro', 'data', 'kpi', 'team', 'weights', 'dev', 'guide', 'mailfile', 'overtime', 'planner', 'tenders'];
  const requested = location.hash.slice(1);
  let hash = portalRoute(requested, isTeamPortal);
  if (requested !== hash) history.replaceState(null, '', '#' + hash);
  if (viewAs && hash !== 'me') endViewAs(true);   // leaving «مؤشراتي» ends the view and redraws the manager's own page behind (the router does not redraw it)
  if (hash.startsWith('me-')) {
    if (hash === 'me-wait') {
      hash = 'me'; setTimeout(() => renderMe(true));
      // if the bookmark never delivers (it failed, or the person closed myafaqy), the page does not wait forever
      setTimeout(() => { if (location.hash === '#me-wait') { history.replaceState(null, '', '#me'); renderMe(); } }, 90000);
    }
    else { const payload = hash.slice(3); hash = 'me'; receiveMe(payload); }
  }
  const mod = hash.startsWith('m-') ? hash.slice(2) : null;
  const v = mod ? 'module' : views.includes(hash) ? hash : (!hash && !isTeamPortal ? 'home' : 'tools');   // the manager link opens on the control room
  for (const id of [...views, 'module']) $(`view-${id}`).hidden = id !== v;
  document.body.classList.toggle('in-module', v === 'module');
  if (mod) openModule(mod);
  else { document.title = `${t('brand')} — ${t('portal')} — ${t(isTeamPortal ? 'title_team' : 'title_admin')}`; $('page-title').textContent = t({ tools: 'portal', me: 'nav_me', pro: 'nav_pro', data: 'nav_data', kpi: 'kpi_board', team: 'nav_team', weights: 'nav_weights', dev: 'nav_dev', home: 'cr_title', guide: 'nav_guide' , overtime: 'nav_overtime', planner: 'nav_planner', mailfile: 'nav_mailfile', tenders: 'nav_tenders' }[v]); currentModule = null; }
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
  if (v === 'planner') renderPlanner();
  if (v === 'mailfile') renderMailFile();
  if (v === 'tenders') renderTenders();
  if (v === 'overtime') renderOvertime();
  if (v === 'pro' && proToken.get() && !proUnits && !proBusy) proLoad();
  if (v === 'team') renderTeam();
  if (v === 'weights') renderWeights();
  if (v === 'dev') renderDev();
  if (v === 'home') renderHome();
  if (v === 'me' && !isTeamPortal && !viewAs && (!me || meDerived)) renderMe();   // the manager's page drawn from his pulls is redrawn on opening — the router does not redraw «مؤشراتي» otherwise
}

// ---------- wiring ----------
$('menu-btn').addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
$('scrim').addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
$('lang-select').addEventListener('change', async (e) => { if (LANGS.includes(e.target.value)) { lang = e.target.value; pref('lang', lang); await loadStrings(['ar', lang]); applyLang(); } });
$('theme-btn').addEventListener('click', () => {
  pref('theme', isDark() ? 'light' : 'dark'); applyTheme();
});
['block-size', 'block-count'].forEach((id) => $(id).addEventListener('input', () => { renderBlocks(); renderMgr(); }));
$('read-text').addEventListener('click', async () => { if (await ingest($('paste').value)) $('paste').value = ''; });
$('file-in').addEventListener('change', async (e) => { for (const f of e.target.files) await ingest(await f.text()); e.target.value = ''; });
// The device backup carries EVERYTHING this device holds — data, reports, closed month cards, one-to-ones, the repair list,
// the weights draft, the team-file edits and the person's own profile — so a cleared browser loses nothing (ADR-0023).
$('export-btn').addEventListener('click', async () => {
  if (plannerFile === undefined) plannerFile = (await store.getPlanner()) || null;   // ADR-0071: the planner travels with the backup
  const all = { backup: 'afaqy-portal/v2', exportedAt: new Date().toISOString(), version: PORTAL_VERSION, planner: plannerFile || null, tenders: tenders || (await store.kvGet('tenders')) || null, mailrules: mfState.rules || (await store.kvGet('mailrules')) || null,
    datasets, reports, cards: monthCards, oneonone: meet, repairs, privlinks: privLinks, mailrows: mailRows, weights: weightsDevice || null, roster: rosterDevice || null, me: (viewAs ? (meDerived ? null : realMe) : (meDerived ? null : me)) || null, names: nameFixes(), pending: pendingList(), projects: myProjects, register: myRegister, projfiles: await projFilesExport(), devplans: devPlans };
  download(`afaqy-portal-backup-${ymd(new Date())}.json`, JSON.stringify(all, null, 1));
});
$('import-in').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (!['afaqy-portal/v1', 'afaqy-portal/v2'].includes(j.backup) || !Array.isArray(j.datasets)) throw new Error('format');
    for (const d of j.datasets) datasets = mergeDataset(datasets, d);
    await store.put(datasets);
    if (j.backup === 'afaqy-portal/v2') {
      // merge, never overwrite: what this device already has stays, what the backup adds joins it
      for (const r of Array.isArray(j.reports) ? j.reports : []) if (r && r.key && !reports.some((x) => x.key === r.key)) reports.push(r);
      await store.putReports(reports);
      for (const [ym, people] of Object.entries(j.cards || {})) monthCards[ym] = { ...(people || {}), ...(monthCards[ym] || {}) };
      await store.putCards(monthCards);
      for (const [ym, people] of Object.entries(j.oneonone || {})) meet[ym] = { ...(people || {}), ...(meet[ym] || {}) };
      await store.putMeet(meet);
      const seen = new Set(repairs.map((r) => `${r.ref}|${r.at}`));
      for (const r of Array.isArray(j.repairs) ? j.repairs : []) if (r && r.ref && !seen.has(`${r.ref}|${r.at}`)) repairs.push({ ref: String(r.ref), at: String(r.at), engineerId: r.engineerId || null, added: r.added || null });
      await store.putRepairs(repairs);
      const known = new Set(privLinks.map((x) => x.url));
      for (const x of Array.isArray(j.privlinks) ? j.privlinks : []) { const v = cleanPrivLink(x); if (v && !known.has(v.url)) privLinks.push(v); }
      if (j.projfiles && typeof j.projfiles === 'object') await projFilesImport(j.projfiles);
      if (j.devplans && typeof j.devplans === 'object') { for (const [q, ppl] of Object.entries(j.devplans)) devPlans[q] = { ...(ppl || {}), ...(devPlans[q] || {}) }; await store.kvPut('devplans', devPlans); }
      if (j.register && !myRegister) { const r = cleanRegister(j.register); if (r) { myRegister = r; await store.putRegister(r); } }
      // ADR-0077: the mail rules come back with the backup when this device has none of its own
      { const mr = cleanMailRules(j.mailrules); if (mr && !(await store.kvGet('mailrules'))) { mfState.rules = mr; await store.kvPut('mailrules', mr); } }
      if (plannerFile === undefined) plannerFile = (await store.getPlanner()) || null;
      if (j.planner && typeof j.planner.html === 'string' && !plannerFile && isHtml(j.planner.html)) { plannerFile = { name: String(j.planner.name || 'planner.html'), at: String(j.planner.at || new Date().toISOString()), html: j.planner.html }; await store.putPlanner(plannerFile); }
      { const td = cleanTenders(j.tenders); if (td && !(tenders && tenders.items.length)) { tenders = td; await store.kvPut('tenders', td); } }   // ADR-0081
      if (j.projects && !myProjects) { const p = cleanProjects(j.projects); if (p) { myProjects = p; await store.putProjects(myProjects); } }
      if (Array.isArray(j.pending)) { const have = new Set(pendingList().map((x) => x.name.toLowerCase())); localStorage.setItem(PENDING_KEY, JSON.stringify([...pendingList(), ...j.pending.map(cleanPending).filter((x) => x && !have.has(x.name.toLowerCase()))])); }
      if (j.names && typeof j.names === 'object') { const fx = nameFixes(); for (const [id, v] of Object.entries(j.names)) if (/^\d+$/.test(id) && v && typeof v === 'object' && !fx[id]) fx[id] = { ar: String(v.ar || '').slice(0, 80), en: String(v.en || '').slice(0, 80) }; localStorage.setItem(NAME_KEY, JSON.stringify(fx)); }
      await store.putPriv(privLinks);
      const seenMail = new Set(mailRows.map((r) => r.i));
      for (const r of Array.isArray(j.mailrows) ? j.mailrows : []) if (r && r.i && !seenMail.has(r.i)) mailRows.push({ i: String(r.i), t: String(r.t), c: String(r.c), w: String(r.w), k: r.k == null ? null : String(r.k) });
      await store.putMail(mailRows);
      if (j.weights && !weightsDevice) { weightsDevice = j.weights; await store.putWeights(weightsDevice); }
      if (j.roster && !(rosterDevice && Object.keys(rosterDevice.people || {}).length)) { rosterDevice = parseRoster(j.roster); await store.putRoster(rosterDevice); }
      if (viewAs) endViewAs(false);
      if (j.me && !me) { const m = upgradeMe(j.me); if (m) { me = m; await store.putMe(me); } }
    }
    renderDatasets(); renderBlocks(); renderKpi(); renderMe(); renderTeam(); renderWeights(); renderPrivLinks();
    toast(t(j.backup === 'afaqy-portal/v2' ? 'backup_restored_all' : 'loaded', { n: datasets.reduce((s, d) => s + d.tasks.length, 0), range: '' }));
  } catch { toast(t('err_json')); }
});
// ask the browser to keep this site's storage — without it, Safari clears it after seven days unused
async function keepStorage() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch { return null; }
}
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
  weightsDevice = await store.getWeights();
  monthCards = (await store.getCards()) || {};
  meet = (await store.getMeet()) || {};
  repairs = (await store.getRepairs()) || [];
  privLinks = (await store.getPriv()) || [];
  mailRows = (await store.getMail()) || [];
  myProjects = await store.getProjects(); tenders = cleanTenders(await store.kvGet('tenders'));
  myRegister = await store.getRegister();
  devPlans = (await store.kvGet('devplans')) || {};
  teamTypesLive = (await store.kvGet('teamtypes')) || null;
  rankSnaps = (await store.kvGet('rankcards')) || {}; mySnapId = (await store.kvGet('mysnap')) || null; await takeRankLink();
  mfState.rules = cleanMailRules(await store.kvGet('mailrules'));
  if (!isTeamPortal) { extSend(false); window.postMessage({ type: 'afaqy-ext-hello' }, location.origin); renderExtBox(); }   // ADR-0062
  await refreshOfficialWeights();
  try { const r = await fetch('./systems.json', { cache: 'no-store' }); const data = r.ok && validateSystems(await r.json()); if (data) { SYSTEMS = data.systems; SYSTEM_CATEGORIES = data.categories; } } catch { /* retain built-in links when unavailable */ }
  await loadStrings(['ar', lang]);   // Arabic is every key's fallback; the reader's language besides
  applyLang();   // renders everything and routes
  paintThemeButton();
  document.documentElement.classList.remove('booting');   // the first frame the reader sees is the finished, translated page
  if (managerImportNonce) {
    managerImportStatus('mgr_auto_wait');
    try {
      if (window.opener) window.opener.postMessage(
        { type: 'afaqy-manager-ready/v1', nonce: managerImportNonce }, MYAFAQY_ORIGIN);
      else managerImportStatus('mgr_auto_popup', {}, true);
    } catch { managerImportStatus('mgr_auto_popup', {}, true); }
  }
  keepStorage().then((ok) => { storageKept = ok; renderDatasets(); });
  if (!isTeamPortal) msReturn();
  loadRelease(); announceUpdate(); showInstall();
  setInterval(loadRelease, 15 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadRelease(); });
  $('install-btn').addEventListener('click', doInstall);
})();

// ---------- ADR-0079: motion that answers — the menu pill slides, tiles lean and light under the pointer, sections arrive as you scroll ----------
// «Live bento»: the small visuals come from the real numbers on the page; the tiles lean with the pointer; the menu pill slides.
(() => {
  // lean with the pointer — a few degrees, gone when motion is reduced
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.addEventListener('pointermove', (e) => { const t = e.target.closest && e.target.closest('.km-tile, .cr-num');
      document.querySelectorAll('.bt-lean').forEach((n) => { if (n !== t) { n.classList.remove('bt-lean'); n.style.transform = ''; } });
      if (!t) return; const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      t.classList.add('bt-lean'); t.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateZ(4px)`; }); }
  // the menu pill slides to the page you open
  const nav = document.querySelector('.sidebar .nav'); if (!nav) return; const ind = document.createElement('span'); ind.id = 'bt-ind'; ind.setAttribute('aria-hidden', 'true'); nav.prepend(ind);
  const place = () => { const a = nav.querySelector('a[aria-current="page"]'); if (!a || !a.offsetParent) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1; ind.style.width = `${a.offsetWidth}px`; ind.style.height = `${a.offsetHeight}px`; ind.style.transform = `translateY(${a.offsetTop}px)`; };
  new MutationObserver(place).observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current', 'aria-expanded', 'class'] });
  addEventListener('resize', place); addEventListener('hashchange', () => setTimeout(place, 60)); setTimeout(place, 300);
})();
// sections come into view once as you scroll; the light that follows the pointer on the tiles
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches; if (still || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('bt-seen'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .08 });
  const SEL = '.table-wrap, details.km-more, .cr-alerts > *, .me-card, .proj-card, section.share, .km-detail';
  const scan = () => document.querySelectorAll(SEL).forEach((n) => { if (n.dataset.btRv) return; n.dataset.btRv = '1';
    const r = n.getBoundingClientRect(); if (r.top < innerHeight * .94) return;   // what is already on screen is simply there
    n.classList.add('bt-rv'); io.observe(n); });
  new MutationObserver(() => requestAnimationFrame(scan)).observe(document.body, { childList: true, subtree: true }); scan();
  document.addEventListener('pointermove', (e) => { const t = e.target.closest && e.target.closest('.km-tile, .cr-num');
    document.querySelectorAll('.bt-lit').forEach((n) => { if (n !== t) { n.classList.remove('bt-lit'); n.style.setProperty('--o', 0); } });
    if (!t) return; const r = t.getBoundingClientRect(); t.classList.add('bt-lit'); t.style.setProperty('--mx', `${e.clientX - r.left}px`); t.style.setProperty('--my', `${e.clientY - r.top}px`); t.style.setProperty('--o', 1); });
})();

