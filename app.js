// app.js — everything on the page. Data stays in this browser (IndexedDB); nothing is sent anywhere.
import { PRIMARY, SYSTEMS as DEFAULT_SYSTEMS, SYSTEM_CATEGORIES as DEFAULT_SYSTEM_CATEGORIES, MORE, PORTAL_VERSION, MODULE_ALLOW } from './config.js';
import { mountTourDemo, replayTourDemo } from './tour-demo.js';
import {
  t as tr, L, LANGS, dirOf, tourState, TOUR_DEVICES, tourDemoPlan, periodBlocks, buildPrompt, parseDataset, mergeDataset, completeness, factor1,
  formatHours, formatRate, sampleDataset, GROUP, GUIDE, DEFINITIONS, peopleOf, defaultTeam, nameOf,
  buildBookmarklet, parseMe, parseMePayload, myProfile, openTasks, profileMonths, upgradeMe,
  parseRoster, mergeRoster, positionOf, leaderOf, donutParts, ROSTER_SCHEMA, saudiDay, teamAlerts, buildAssignBookmarklet,
  parseWeights, mergeWeights, weightedPoints, typeKey, taskWeight, taskPoints, baseFromFactors, tierFromBase, POINT_MODES, FACTORS, typeLabel, loadStrings, weightPublishDiff, publishableWeights, portalWeights, WEIGHT_STEPS, TIERS, scopeIds, inScope, scopeApplies, canEditWeight, isWeightsAdmin,
  monthCard, teamMonth, closableMonths, monthRange, prevMonth, ARCHETYPES, ymd,
  weeklyDigest, goalProgress, patternPath, coverageTotals, CARD_DEFAULTS, shareWindow, workloadShare, repairCheck, parseRepairLines,
  mailRow, mailStats, MAIL_CATEGORIES, lastQuarters, supersede, engineerLevels, developmentPlan, LEVELS, loadSustainability,
  safePortalUrl, buildReportsPrompt, parseReports, techTotals, afterSalesTotals, activityTotals, REPORTS_SCHEMA, buildManagerBookmarklet, parseManagerTransfer, MANAGER_AUTO_SCHEMA, portalRoute,
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
  let mem = []; let memMe = null; let memRep = []; let memRoster = null; let memWeights = null; let memCards = {}; let memMeet = {}; let memRepairs = []; let memPriv = []; let memMail = [];
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
  set($('primary'), PRIMARY.map((x) => {
    const icon = el('span', { 'aria-hidden': 'true' }); icon.innerHTML = ICONS[x.icon] || '';
    return moduleLink(x, 'tool', icon, el('span', { class: 'name', text: L(x.name, lang) }), el('span', { class: 'desc', text: L(x.desc, lang) }),
      x.module ? el('span', { class: 'badge', text: t('in_portal') }) : null, el('span', { class: 'go', text: t('open') }));
  }));
  $('manage-systems').hidden = isTeamPortal;
  set($('systems'), SYSTEM_CATEGORIES.map((c) => el('section', { class: 'systems-category' }, el('h3', { text: L(c.name, lang) }), el('div', { class: 'row' }, SYSTEMS.filter((x) => x.category === c.id).map((x) => el('a', { class: 'chip', href: x.url, target: '_blank', rel: 'noopener', text: L(x.name, lang) }))))));
  set($('more'), MORE.map((x) => (x.status === 'live'
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
function cardCtxFromMe(team) { return { tasks: me.tasks, activities: [], weights: weights(), team, roster: roster(), now: new Date() }; }
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
      el('button', { type: 'button', class: 'btn primary', text: t('meet_save'), onclick: async () => { await saveMeet(ym, id, { note: note.value.slice(0, 2000), agreed: agreed.value.slice(0, 1000), done: !!cur.done, goals: goals.filter((g) => g.target > 0).slice(0, 8) }); dlg.close(); dlg.remove(); toast(t('meet_saved')); renderMe(); } }),
      el('button', { type: 'button', class: 'btn', text: t('close'), onclick: () => { dlg.close(); dlg.remove(); } })));
  document.body.append(dlg); dlg.showModal();
}
function exportMeet() { const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify({ schema: 'afaqy-oneonone/v1', exportedAt: new Date().toISOString(), meet }, null, 2)], { type: 'application/json' })), download: `afaqy-one-to-one-${ymd(new Date())}.json` }); document.body.append(a); a.click(); a.remove(); }
async function importMeet(file) { try { const j = JSON.parse(await file.text()); if (j.schema !== 'afaqy-oneonone/v1' || typeof j.meet !== 'object') throw 0; for (const [ym, people] of Object.entries(j.meet)) for (const [id, v] of Object.entries(people || {})) meet[ym] = { ...(meet[ym] || {}), [id]: { ...(meet[ym] || {})[id], ...v } }; await store.putMeet(meet); toast(t('meet_imported')); renderMe(); } catch { toast(t('err_json')); } }
// the goals and last month's agreement, shown inside a card
function meetBlock(ym, id, tasks, editable, name, typeChoices) {
  const m = meetOf(ym, id), prev = meetOf(prevMonth(ym), id);
  const prog = m && m.goals && m.goals.length ? goalProgress(tasks, weights(), id, ym, m.goals) : [];
  const label = (g) => (g.key === '__points__' ? t('goal_points') : (typeChoices.find(([k]) => k === g.key) || [g.key, g.key])[1]);
  if (!prog.length && !(prev && prev.agreed) && !editable) return null;
  return el('div', { class: 'meet-block' },
    prev && prev.agreed ? el('div', { class: 'agreed' }, el('b', { text: t('meet_prev_agreed') }), el('span', { text: ` ${prev.agreed}` }),
      editable ? el('label', { class: 'done-tick' }, el('input', { type: 'checkbox', ...(prev.done ? { checked: '' } : {}), onchange: async (e) => { await saveMeet(prevMonth(ym), id, { ...prev, done: e.target.checked }); renderMe(); } }), t('meet_done')) : el('span', { class: 'hint', text: prev.done ? ` · ${t('meet_done')}` : '' })) : null,
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
  history.replaceState(null, '', location.pathname + '#kpi');   // the code never stays in the address or the history
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
  mailBusy = true; renderKpi();
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
  finally { token = null; mailBusy = false; renderKpi(); }
}
// ---------- end Outlook ----------
function kpiMailSection(team, peopleById) {
  const cfg = msCfg(); const nmM = (id) => nameOf(peopleById.get(id), lang) || id;
  const setup = () => { const cid = el('input', { type: 'text', dir: 'ltr', placeholder: 'Application (client) ID', value: (cfg && cfg.clientId) || '' }), tid = el('input', { type: 'text', dir: 'ltr', placeholder: 'Directory (tenant) ID', value: (cfg && cfg.tenantId) || '' });
    return el('div', { class: 'mail-setup' }, el('p', { class: 'hint', text: t('mail_setup_sub') }), cid, tid,
      el('button', { type: 'button', class: 'btn primary', text: t('mail_setup_save'), onclick: () => { const g = /^[0-9a-f-]{36}$/i; if (!g.test(cid.value.trim()) || !g.test(tid.value.trim())) { toast(t('mail_setup_bad')); return; } localStorage.setItem('afaqy-portal:ms', JSON.stringify({ clientId: cid.value.trim(), tenantId: tid.value.trim() })); renderKpi(); } })); };
  if (!cfg) return el('section', { class: 'share mail', id: 'k-mail' }, el('h2', {}, t('mail_h'), helpQ('help_mail')), setup());
  const today = saudiDay(new Date().toISOString());
  if (mailKind === 'year') {
    const qs = lastQuarters(today, 4).reverse(); const per = qs.map((q) => mailStats(mailRows, team, q));
    return el('section', { class: 'share mail', id: 'k-mail' },
      el('div', { class: 'row', style: 'justify-content:space-between;align-items:center' }, el('h2', { style: 'margin:0' }, t('mail_h'), helpQ('help_mail')),
        el('div', {}, periodPicker('year', 0, today, (k) => { mailKind = k; renderKpi(); }, () => {}))),
      el('div', { class: 'table-wrap' }, el('table', { class: 'share-table year' },
        el('thead', {}, el('tr', {}, el('th', { text: t('col_person') }), ...qs.map((q) => el('th', { class: 'num', text: q.label })))),
        el('tbody', {}, team.map((id) => el('tr', {}, el('td', { text: nmM(id) }), ...per.map((ms) => { const p = ms.people.find((x) => x.id === id);
          return el('td', { class: 'num', text: p && p.replies ? `${p.replies} · ${t('mail_hard')} ${p.hardPct}%` : '—' }); })))))),);
  }
  const win = pickWindow(mailKind, mailQ, today); const ms = mailStats(mailRows, team, win);
  const last = localStorage.getItem('afaqy-portal:ms-last');
  const chip = (k, label) => el('button', { type: 'button', class: `pill-btn${mailKind === k ? ' on' : ''}`, text: t(label), onclick: () => { mailKind = k; renderKpi(); } });
  const mins = (m) => (m == null ? '—' : m < 60 ? `${Math.round(m)} ${t('mail_min')}` : `${(m / 60).toFixed(1)} ${t('mail_hr')}`);
  const max = Math.max(1, ...ms.people.map((p) => p.replies));
  return el('section', { class: 'share mail', id: 'k-mail' },
    el('div', { class: 'row', style: 'justify-content:space-between;align-items:center' },
      el('h2', { style: 'margin:0' }, t('mail_h'), helpQ('help_mail')),
      el('div', {}, periodPicker(mailKind, mailQ, today, (k) => { mailKind = k; renderKpi(); }, (q) => { mailQ = q; renderKpi(); }))),
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
function renderMe(waiting = false) {
  applyNameFixes();
  const body = $('me-body');
  const bm = buildBookmarklet(portalHome(), lang);
  const link = el('a', { class: 'btn primary bm', href: bm, draggable: 'true', text: `📊 ${t('me_bm')}`,
    onclick: (e) => { e.preventDefault(); toast(t('me_drag')); } });
  const setup = [
    el('p', { class: 'hint', text: t('me_step1') }), el('div', { class: 'row' }, link,
      el('button', { type: 'button', class: 'btn', text: t('me_copy'), onclick: async () => { try { await navigator.clipboard.writeText(decodeURIComponent(bm)); toast(t('me_copied')); } catch { toast(t('me_copy_fail')); } } })),
    el('p', { class: 'hint', text: t('me_step2') }),
    el('details', { class: 'me-phones' }, el('summary', { text: t('me_phones') }), el('p', { class: 'hint', text: t('me_android') }), el('p', { class: 'hint', text: t('me_ios') })),
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
    pm.average ? [ cards(pm.mine.this, pm.average, '', t('me_avg_team'))]
      : el('p', { class: 'note info', text: t('me_avg_none') }),
    pm.below.length ? [
      el('h2', { 'data-tab': 'team', text: t('me_team_h', { n: pm.below.length }) }),
      el('div', { class: 'table-wrap', 'data-tab': 'team' }, el('table', {},
        el('thead', {}, el('tr', {}, ...['col_person', 'col_assigned', 'col_done', 'me_vs_last', 'col_rate', 'col_median', 'col_open'].map((k, i) => el('th', { class: i ? 'num' : '', text: t(k) })))),
        el('tbody', {}, pm.below.map((r) => el('tr', {},
          el('td', {}, el('div', { text: nm(r.id) }), positionOf(roster(), r.id, lang) ? el('div', { class: 'hint', text: positionOf(roster(), r.id, lang) }) : null), el('td', { class: 'num', text: String(r.this.assigned) }), el('td', { class: 'num' }, bar(r.this.done, maxDone)),
          el('td', { class: 'num' }, arrow('done', r.this, r.last)), el('td', { class: 'num', text: formatRate(r.this.rate) }),
          el('td', { class: 'num', text: r.this.medianHours == null ? '—' : formatHours(r.this.medianHours, lang) }), el('td', { class: 'num', text: String(r.this.open) })))))),
      (alerts.attention || alerts.improved) ? el('div', { class: 'alerts', 'data-tab': 'alerts' },
        alerts.attention ? el('div', { class: 'alert warn', text: t('alert_attention', { name: nm(alerts.attention.id), why: alerts.attention.why.map(whyText).join('، ') }) }) : null,
        alerts.improved ? el('div', { class: 'alert ok', text: t('alert_improved', { name: nm(alerts.improved.id), n: alerts.improved.delta }) }) : null) : null] : null,
    el('div', { class: 'row', style: 'justify-content:space-between;align-items:flex-end' },
      el('h2', { style: 'margin:0' }, t('card_h'), helpQ('help_card')),
      (() => { const months = [...new Set([...Object.keys(monthCards), ymd(new Date()).slice(0, 7)])].sort().reverse(); if (!cardMonth || !months.includes(cardMonth)) cardMonth = months[0];
        return el('select', { class: 'w-sel', onchange: (e) => { cardMonth = e.target.value; renderMe(); } }, months.map((m) => el('option', { value: m, selected: m === cardMonth, text: `${monthLabel(m)}${monthCards[m] ? '' : ` · ${t('card_live')}`}` }))); })()),
    meLevelSection(pm, who),
    meCardSection(pm, who, nm),
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
  meDashboard(body, pm, { METRICS, val, nm, arrow });
}
// ---------- My KPIs as a dashboard (ADR-0034): openable tiles, a collapsible block for me and one for my team, tabs for a leader ----------
let meTab = 'me';
function sheet(title, content, csv) {
  let dlg = $('sheet-dlg');
  if (!dlg) { dlg = el('dialog', { id: 'sheet-dlg', class: 'sheet' }); document.body.append(dlg); }
  const exportCsv = () => { const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const blob = new Blob(['\ufeff' + csv.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `${title.replace(/[^\p{L}\p{N}]+/gu, '-')}.csv` }); document.body.append(a); a.click(); a.remove(); };
  set(dlg, el('div', { class: 'sheet-head' }, el('h3', { text: title }),
      el('div', { class: 'row' }, csv && csv.length > 1 ? el('button', { type: 'button', class: 'btn tiny', text: `⬇ ${t('sheet_export')}`, onclick: exportCsv }) : null,
        el('button', { type: 'button', class: 'btn quiet tiny', 'aria-label': t('close'), text: '✕', onclick: () => dlg.close() }))),
    el('div', { class: 'sheet-body' }, content));
  dlg.showModal();
}
function meDashboard(body, pm, { METRICS, val, nm, arrow }) {
  const win = pm.windows.this, prev = pm.windows.last;
  const inW = (iso, w) => { const d = saudiDay(iso); return d && d >= w.from && d <= w.to; };
  const hrs = (x) => (x.createdAt && x.completedAt ? Math.round(((Date.parse(x.completedAt) - Date.parse(x.createdAt)) / 3600000) * 10) / 10 : '');
  const pick = (ids, k, w) => me.tasks.filter((x) => ids.includes(x.assigneeId) && (
    k === 'done' || k === 'medianHours' ? x.state === 'done' && inW(x.completedAt, w)
    : k === 'selfLogged' ? x.createdById === x.assigneeId && inW(x.createdAt, w)
    : k === 'fromEmail' ? x.fromEmail && inW(x.createdAt, w)
    : inW(x.createdAt, w) && x.state !== 'cancelled'));
  const taskCsv = (list) => [[t('col_person'), 'ID', t('col_type'), t('col_state'), t('col_created'), t('col_completed'), t('col_hours')],
    ...list.map((x) => [nm(x.assigneeId), x.id, x.type || '', x.state, (x.createdAt || '').slice(0, 16), (x.completedAt || '').slice(0, 16), hrs(x)])];
  const taskTable = (list) => list.length ? el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, [t('col_person'), t('col_type'), t('col_state'), t('col_created'), t('col_hours')].map((h, i) => el('th', { class: i === 4 ? 'num' : null, text: h })))),
      el('tbody', {}, list.slice(0, 300).map((x) => el('tr', {}, el('td', { text: nm(x.assigneeId) }), el('td', { text: typeLabel(x.type || '', lang) }), el('td', { text: t(`state_${x.state}`) }),
        el('td', { class: 'ltr', text: (x.createdAt || '').slice(0, 10) }), el('td', { class: 'num', text: String(hrs(x)) }))))))
    : el('div', { class: 'empty', text: t('sheet_none') });
  // my tiles open my own list
  const myGrid = body.querySelector('.cmp-grid');
  if (myGrid) [...myGrid.children].forEach((tile, i) => { const [k, label] = METRICS[i] || []; if (!k) return; tile.classList.add('tile-open'); tile.tabIndex = 0;
    tile.onclick = () => { const list = pick([me.user.id], k, win); sheet(`${t(label)} — ${win.from} → ${win.to}`, taskTable(list), taskCsv(list)); }; });
  // collapse my block: the heading row, the dates line and the tiles
  if (myGrid) { const dates = myGrid.previousElementSibling, headRow = dates && dates.previousElementSibling;
    const box = el('details', { class: 'tile-block', open: '' }, el('summary', { text: t('tiles_mine') }));
    myGrid.before(box); if (headRow) box.append(headRow); if (dates) box.append(dates); box.append(myGrid); }
  if (!pm.below.length) return;
  // my team's tiles: totals over the people below me, each opening a per-person table and the task list
  const ids = pm.below.map((r) => r.id);
  const sum = (rows, k) => rows.reduce((s, r) => s + ((r && r[k]) || 0), 0);
  const team = (side) => { const rows = pm.below.map((r) => r[side]); const a = sum(rows, 'assigned'), d = sum(rows, 'done');
    const h = pick(ids, 'medianHours', side === 'this' ? win : prev).map((x) => hrs(x)).filter((v) => v !== '').sort((p, q) => p - q);
    const asg = pick(ids, 'assigned', side === 'this' ? win : prev), rate = asg.length ? asg.filter((x) => x.state === 'done').length / asg.length : null;   // of what was assigned in the period, how much is done
    return { assigned: a, done: d, rate, medianHours: h.length ? h[Math.floor(h.length / 2)] : null, selfLogged: sum(rows, 'selfLogged'), fromEmail: sum(rows, 'fromEmail') }; };
  const now = team('this'), before = team('last');
  const teamGrid = el('div', { class: 'cmp-grid' }, METRICS.map(([k, label]) => el('div', { class: 'cmp tile-open', tabIndex: 0, onclick: () => {
      const list = pick(ids, k, win);
      const per = el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, [t('col_person'), t(label), t('me_last_period')].map((h, i) => el('th', { class: i ? 'num' : null, text: h })))),
        el('tbody', {}, [...pm.below].sort((p, q) => ((q.this && q.this[k]) || 0) - ((p.this && p.this[k]) || 0)).map((r) => el('tr', {}, el('td', { text: nm(r.id) }),
          el('td', { class: 'num', text: val(k, r.this) }), el('td', { class: 'num', text: val(k, r.last) }))))));
      sheet(`${t(label)} — ${t('tiles_team')} — ${win.from} → ${win.to}`, [per, el('h4', { text: t('sheet_tasks', { n: list.length }) }), taskTable(list)], taskCsv(list)); } },
    el('span', { class: 'cmp-k', text: t(label) }), el('b', { class: 'cmp-v', text: `\u2068${val(k, now)}\u2069` }),
    el('span', { class: 'cmp-was', text: `${t('me_last_period')}: \u2068${val(k, before)}\u2069` }), arrow(k, now, before))));
  const people = el('div', { class: 'people-grid' }, [...pm.below].sort((p, q) => ((q.this && q.this.done) || 0) - ((p.this && p.this.done) || 0)).map((r) => {
    const max = Math.max(1, ...pm.below.map((x) => (x.this && x.this.done) || 0));
    return el('button', { type: 'button', class: 'person-card', onclick: () => { const list = me.tasks.filter((x) => x.assigneeId === r.id && (x.state === 'open' || (x.state === 'done' && inW(x.completedAt, win))));
        sheet(nm(r.id), [el('div', { class: 'cmp-grid' }, METRICS.map(([k, label]) => el('div', { class: 'cmp' }, el('span', { class: 'cmp-k', text: t(label) }), el('b', { class: 'cmp-v', text: `\u2068${val(k, r.this)}\u2069` }), arrow(k, r.this, r.last)))),
          el('h4', { text: t('sheet_tasks', { n: list.length }) }), taskTable(list)], taskCsv(list)); } },
      el('b', { text: nm(r.id) }), el('span', { class: 'hint', text: positionOf(roster(), r.id, lang) || '' }),
      el('i', { class: 'pbar' }, el('span', { style: `width:${Math.round((((r.this && r.this.done) || 0) / max) * 100)}%` })),
      el('span', { class: 'hint', text: `${val('done', r.this)} · ${val('rate', r.this)}` })); }));
  // alerts: what was flagged, plus open work older than 7 days for me and my team
  const old = me.tasks.filter((x) => [me.user.id, ...ids].includes(x.assigneeId) && x.state === 'open' && x.createdAt && (Date.now() - Date.parse(x.createdAt)) > 7 * 86400000);
  // build the three panels and move the tagged sections into them
  const panels = { me: el('div', { class: 'tab-panel' }), team: el('div', { class: 'tab-panel' }), alerts: el('div', { class: 'tab-panel' }) };
  panels.team.append(el('details', { class: 'tile-block', open: '' }, el('summary', { text: t('tiles_team') }), teamGrid), el('h2', { text: t('me_people_h') }), people);
  panels.alerts.append(old.length ? el('div', { class: 'alert warn tile-open', onclick: () => sheet(t('alert_old', { n: old.length }), taskTable(old), taskCsv(old)), text: t('alert_old', { n: old.length }) }) : null);
  const card = body.querySelector('.me-card');
  const after = []; let n = card ? card.nextElementSibling : null; while (n) { after.push(n); n = n.nextElementSibling; }
  for (const x of after) { const tab = x.getAttribute('data-tab'); (panels[tab] || panels.me).append(x); }
  if (!panels.alerts.children.length) panels.alerts.append(el('div', { class: 'empty', text: t('alerts_none') }));
  const counts = { alerts: panels.alerts.querySelectorAll('.alert').length };
  const bar = el('div', { class: 'tabs', role: 'tablist' }, [['me', t('tab_me')], ['team', t('tab_team')], ['alerts', counts.alerts ? `${t('tab_alerts')} (${counts.alerts})` : t('tab_alerts')]].map(([k, label]) =>
    el('button', { type: 'button', role: 'tab', 'data-k': k, class: `tab${meTab === k ? ' on' : ''}`, 'aria-selected': String(meTab === k), text: label, onclick: () => { meTab = k; for (const [p, el2] of Object.entries(panels)) el2.hidden = p !== k; for (const b of bar.children) { const on = b.getAttribute('data-k') === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); } } })));
  for (const [p, el2] of Object.entries(panels)) el2.hidden = p !== meTab;
  (card || body.firstChild).after(bar, panels.me, panels.team, panels.alerts);
}
async function receiveMe(fragment) {
  const r = await parseMe(fragment);
  history.replaceState(null, '', '#me');            // the data never stays in the address or the history
  if (r.error) { toast(t(r.error, r.vars || {})); renderMe(); return; }
  me = r.me; await store.putMe(me); await refreshOfficialWeights();
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
  me = r.me; await store.putMe(me); await refreshOfficialWeights();
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
  if (isTeamPortal) $('nav-kpi').closest('[data-nav-section]').hidden = true;
  set($('nav-modules'), MODULES.map((m) => el('a', { href: `#m-${m.id}`, class: 'sub', 'data-module': m.id, text: L(m.name, lang) })));
  // company systems: one fold-away sub-group per category (closed by default, one open at a time), then a link to the full grid
  set($('nav-systems'), [...SYSTEM_CATEGORIES.map((c) => { const items = SYSTEMS.filter((x) => x.category === c.id); if (!items.length) return null;
    return el('details', { class: 'nav-cat', ontoggle: (e) => { if (e.target.open) for (const d of $('nav-systems').querySelectorAll('details.nav-cat')) if (d !== e.target) d.open = false; } },
      el('summary', {}, el('span', { text: L(c.name, lang) }), el('span', { class: 'nav-count', text: String(items.length) })),
      items.map((x) => (x.id === 'pro' ? el('a', { href: '#pro', class: 'sub', 'data-view': 'pro', text: L(x.name, lang) }) : el('a', { href: x.url, class: 'sub', target: '_blank', rel: 'noopener', title: L(x.name, lang) },
        el('span', { class: 'nav-name', text: L(x.name, lang) }), el('span', { class: 'ext', 'aria-hidden': 'true', text: '↗' }))))); }),
    el('a', { href: '#tools', class: 'sub nav-all', text: t('nav_all_systems') })]);
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

// A manager's opened tab accepts one authenticated browser hand-off from its myafaqy opener only.
// The temporary nonce is a pairing hint, not a login or an authorization boundary.
function managerImportStatus(key, vars = {}, failure = false) {
  const output = $('mgr-auto-status');
  if (!output) return;
  output.className = failure ? 'msg err' : 'msg';
  output.textContent = t(key, vars);
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
function currentTeam(people, tasks) {
  const allowed = new Set(scoped(people).map((p) => p.id));
  try { const saved = JSON.parse(pref('team') || 'null'); if (Array.isArray(saved)) { const kept = saved.filter((id) => allowed.has(id)); if (kept.length) return kept; } } catch { /* fall through */ }
  const def = scopeOn(people) ? [...allowed] : defaultTeam(people, tasks);
  return def;
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
const allTasks = () => datasets.flatMap((d) => d.tasks);
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
  const bm = buildManagerBookmarklet(q.from, q.to, undefined, lang);
  // on an unsafe address (a preview, a file) the direct method is simply not offered — the page never breaks over it
  const auto = safePortalUrl(portalHome()) ? buildManagerBookmarklet(q.from, q.to, undefined, lang, 'auto', portalHome()) : null;
  const controls = (link, label, primary) => [
    el('a', { class: `btn ${primary ? 'primary ' : ''}bm`, href: link, draggable: 'true',
      text: label, onclick: (e) => { e.preventDefault(); toast(t('me_drag')); } }),
    el('button', { type: 'button', class: 'btn', text: t('me_copy'),
      onclick: async () => {
        try { await navigator.clipboard.writeText(decodeURIComponent(link)); toast(t('me_copied')); }
        catch { toast(t('me_copy_fail')); }
      } }),
  ];
  set(direct, auto ? controls(auto, `↪ ${t('mgr_auto_bm', { from: q.from, to: q.to })}`, true) : el('p', { class: 'hint', text: t('mgr_auto_unsafe') }));
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
function levelsFor(tasks, ids, today, mail) {
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
function levelView(x, who, quarter) {
  if (!x) return null;
  const lvl = x.level ? LEVELS.find((l) => l.n === x.level) : null;
  return el('section', { class: 'level-card' },
    el('div', { class: 'level-head' },
      el('div', {}, el('h3', { text: who }), el('span', { class: 'hint', text: quarter.label })),
      el('div', { class: `level-badge l${x.level || 0}` }, el('b', { text: lvl ? String(lvl.n) : '—' }), el('span', { text: lvl ? t(`lvl_${lvl.k}`) : x.onLeave ? t('card_on_leave') : t('lvl_early') }))),
    x.score != null ? el('div', { class: 'level-score' }, el('b', { text: String(x.score) }), el('span', { text: t('lvl_score') })) : null,
    el('div', { class: 'level-axes' }, AXES.map((k) => el('div', { class: 'axis' },
      el('span', { text: t(`axis_${k}`) }),
      el('i', {}, el('span', { style: `width:${x.axes[k] ?? 0}%` })),
      el('b', { text: x.axes[k] == null ? '—' : t('lvl_better', { p: x.axes[k] }) })))),
    el('p', { class: 'level-trend' }, x.trend ? `${{ up: '▲', down: '▼', steady: '■' }[x.trend]} ${t(`lvl_trend_${x.trend}`)}` : t('lvl_trend_none'),
      ' · ', x.forecast != null ? t('lvl_forecast', { f: x.forecast }) : t('lvl_forecast_none')));
}
function meLevelSection(pm, who) {
  const today = saudiDay(new Date().toISOString()); const ids = [...new Set([me.user.id, ...(pm.scope.team || [])])];
  if (!levelPools(ids).some((p) => p.includes(me.user.id))) return null;   // leaders are not levelled
  const { levels, quarter } = levelsFor(me.tasks, ids, today, null);
  return [el('h2', {}, t('lvl_h'), helpQ('help_level')), levelView(levels[me.user.id], who, quarter)];
}
// ---------- load sustainability (ADR-0032) — the manager's eyes only ----------
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
    if (active.length) { const r = loadSustainability(tasks, weights(), active, endDay, { mailRows }); win = r; Object.assign(res, r.people);
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
function kpiLevelSection(team, peopleById) {
  const today = saudiDay(new Date().toISOString()); const nmL = (id) => nameOf(peopleById.get(id), lang) || id;
  const { levels, quarter } = levelsFor(allTasks(), team, today, mailRows);
  const rows = Object.values(levels).sort((a, b) => (b.score ?? -1) - (a.score ?? -1)); if (!rows.length) return null;
  const planText = (p) => t(`plan_${p.axis}`, { buddy: p.buddy ? nmL(p.buddy) : '—', p: p.pct });
  return el('section', { class: 'share', id: 'k-level' },
    el('h2', {}, t('lvl_team_h', { q: quarter.label }), helpQ('help_level')),
    el('div', { class: 'table-wrap' }, el('table', { class: 'share-table' },
      el('thead', {}, el('tr', {}, ['col_person', 'lvl_col_level', 'lvl_col_score', ...AXES.map((k) => `axis_${k}`), 'lvl_col_trend', 'lvl_col_plan'].map((k, i) => el('th', { class: i && i < 7 ? 'num' : null, text: t(k) })))),
      el('tbody', {}, rows.map((x) => el('tr', {},
        el('td', { text: nmL(x.id) }),
        el('td', { class: 'num' }, el('span', { class: `level-pill l${x.level || 0}`, text: x.level ? `${x.level} · ${t(`lvl_${LEVELS[x.level - 1].k}`)}` : x.onLeave ? t('card_on_leave') : t('lvl_early') })),
        el('td', { class: 'num', text: x.score == null ? '—' : String(x.score) }),
        ...AXES.map((k) => el('td', { class: 'num', text: x.axes[k] == null ? '—' : String(x.axes[k]) })),
        el('td', { class: 'num', text: x.trend ? { up: '▲', down: '▼', steady: '■' }[x.trend] : '—' }),
        el('td', { class: 'plan-cell' }, x.onLeave ? [] : developmentPlan(levels, x.id).map((p) => el('div', { text: planText(p) })))))))));
}
function meCardSection(pm, who, nm) { const ymNow = cardMonth; const team = pm.scope.team; const ctx = cardCtxFromMe(team);
      const own = (monthCards[ymNow] && monthCards[ymNow][me.user.id]) || monthCard(ctx, me.user.id, ymNow);
      const below = pm.below.map((r) => r.id);
      const typeChoices = Object.entries(weights().tasks).filter(([, x]) => x.team !== 'general').map(([k]) => [k, k.replace(/(^|\s)([a-z])/g, (mm, sp, ch) => sp + ch.toUpperCase())]);
      const withMeet = (cardEl, id, name, editable) => { if (cardEl) { const b = meetBlock(ymNow, id, me.tasks, editable, name, typeChoices); if (b) cardEl.append(b); } return cardEl; };
      const imp = el('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: (e) => { if (e.target.files[0]) importMeet(e.target.files[0]); e.target.value = ''; } });
      const path = (id) => patternPath(monthCards, id);
      const pathTable = (ids) => { const months = [...new Set(ids.flatMap((id) => path(id).map((p) => p.month)))].sort(); if (months.length < 2) return el('p', { class: 'hint', text: t('path_soon') });
        const cellOf = (id, m) => { const p = path(id).find((x) => x.month === m); return el('td', {}, p ? [el('div', { text: t(`arch_${p.archetype}`) }), el('div', { class: 'hint', text: `${p.points} · ${t(`quartile_${p.quartile}`)}` })] : '—'); };
        const head = el('thead', {}, el('tr', {}, el('th', { text: t('col_person') }), months.map((m) => el('th', { text: monthLabel(m) }))));
        const bodyRows = el('tbody', {}, ids.map((id) => el('tr', {}, el('td', { text: id === me.user.id ? who : nm(id) }), months.map((m) => cellOf(id, m)))));
        return el('div', { class: 'table-wrap' }, el('table', { class: 'path' }, head, bodyRows)); };
      return [withMeet(renderCard(own, who, { showRank: false, showSuggestions: false }), me.user.id, who, false),
        below.length ? [el('h3', { class: 'card-team-h', text: t('card_team_h', { n: below.length }) }),
          el('div', { class: 'cards-grid' }, below.map((id) => withMeet(renderCard((monthCards[ymNow] && monthCards[ymNow][id]) || monthCard(ctx, id, ymNow), nm(id), { showRank: true, showSuggestions: true, compact: true }), id, nm(id), true)))] : null,
        el('div', { class: 'row', style: 'margin-top:8px' }, el('button', { type: 'button', class: 'btn', text: t('card_print'), onclick: () => window.print() }),
          below.length ? [el('button', { type: 'button', class: 'btn quiet', text: t('meet_export'), onclick: exportMeet }), el('button', { type: 'button', class: 'btn quiet', text: t('meet_import'), onclick: () => imp.click() }), imp] : null),
        el('h2', {}, t('path_h'), helpQ('help_path')), pathTable([me.user.id, ...below])]; }
// ---------- the board's sections, each its own function (ADR-0023) ----------
// the manager's view of each person's slice of the team's work — day / week / month / quarter
let shareKind = 'week', shareBy = 'points', shareQ = 0, mailQ = 0;
// the period picker both sections use: day · week · month · quarter (pick one of the last four) · year (the four side by side)
function periodPicker(kind, qi, today, onKind, onQ) {
  const qs = lastQuarters(today, 4);
  const chip = (k, label) => el('button', { type: 'button', class: `pill-btn${kind === k ? ' on' : ''}`, text: t(label), onclick: () => onKind(k) });
  return [el('div', { class: 'pills' }, [['day', 'share_day'], ['week', 'share_week'], ['month', 'share_month'], ['quarter', 'share_quarter'], ['year', 'share_year']].map(([k, l]) => chip(k, l))),
    kind === 'quarter' ? el('div', { class: 'pills qpick' }, qs.map((q, i) => el('button', { type: 'button', class: `pill-btn${qi === i ? ' on' : ''}`, text: q.label, onclick: () => onQ(i) }))) : null];
}
const pickWindow = (kind, qi, today) => (kind === 'quarter' ? lastQuarters(today, 4)[qi] : shareWindow(kind, today));
function kpiYearShare(team, peopleById, anchor) {
  const qs = lastQuarters(anchor, 4).reverse(); const tasks = allTasks(); const nmS = (id) => nameOf(peopleById.get(id), lang) || id;
  const per = qs.map((q) => workloadShare(tasks, weights(), team, q));
  const cover = qs.map((q) => datasets.some((d) => d.range.from <= q.from && d.range.to >= q.to));
  return el('section', { class: 'share', id: 'k-share' },
    el('div', { class: 'row', style: 'justify-content:space-between;align-items:center' }, el('h2', { style: 'margin:0' }, t('share_h'), helpQ('help_share')),
      el('div', {}, periodPicker('year', 0, anchor, (k) => { shareKind = k; renderKpi(); }, () => {}))),
    cover.some((c) => !c) ? el('p', { class: 'note', text: t('share_year_partial') }) : null,
    el('div', { class: 'table-wrap' }, el('table', { class: 'share-table year' },
      el('thead', {}, el('tr', {}, el('th', { text: t('col_person') }), ...qs.map((q, i) => el('th', { class: 'num', text: `${q.label}${cover[i] ? '' : ' *'}` })))),
      el('tbody', {}, team.map((id) => el('tr', {}, el('td', { text: nmS(id) }), ...per.map((sh) => { const p = sh.people.find((x) => x.id === id) || { points: 0, pointsPct: 0 }; return el('td', { class: 'num', text: sh.total.tasks ? `${p.points} · ${p.pointsPct}%` : '—' }); })))))));
}
function kpiShareSection(team, peopleById) {
  const tasks = allTasks(); if (!tasks.length) return null;
  const lastDay = tasks.reduce((m, x) => { const d = saudiDay(x.completedAt); return d && d > m ? d : m; }, '');
  const today = saudiDay(new Date().toISOString()); const anchor = lastDay && lastDay < today ? lastDay : today;
  if (shareKind === 'year') return kpiYearShare(team, peopleById, anchor);
  const win = pickWindow(shareKind, shareQ, anchor); const sh = workloadShare(tasks, weights(), team, win);
  const covered = datasets.some((d) => d.range.from <= win.from && d.range.to >= win.to);
  const nmS = (id) => nameOf(peopleById.get(id), lang) || id;
  const key = { points: 'pointsPct', tasks: 'tasksPct', email: 'emailPct' }[shareBy];
  const max = Math.max(1, ...sh.people.map((p) => p[key]));
  const chip = (k, label, cur, set) => el('button', { type: 'button', class: `pill-btn${cur === k ? ' on' : ''}`, text: t(label), onclick: () => { set(k); renderKpi(); } });
  return el('section', { class: 'share', id: 'k-share' },
    el('div', { class: 'row', style: 'justify-content:space-between;align-items:center' },
      el('h2', { style: 'margin:0' }, t('share_h'), helpQ('help_share')),
      el('div', {}, periodPicker(shareKind, shareQ, anchor, (k) => { shareKind = k; renderKpi(); }, (q) => { shareQ = q; renderKpi(); }))),
    el('p', { class: 'hint ltr-dates', text: t('share_window', { from: win.from, to: win.to, n: sh.total.tasks, p: sh.total.points, e: sh.total.email }) }),
    !covered ? el('p', { class: 'note', text: t('share_partial') }) : null,
    el('div', { class: 'pills' }, [['points', 'share_by_points'], ['tasks', 'share_by_tasks'], ['email', 'share_by_email']].map(([k, l]) => chip(k, l, shareBy, (v) => { shareBy = v; }))),
    sh.total.tasks ? el('div', { class: 'table-wrap' }, el('table', { class: 'share-table' },
      el('thead', {}, el('tr', {}, ['col_person', 'share_col_share', 'share_col_points', 'share_col_tasks', 'share_col_email'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
      el('tbody', {}, [...sh.people].sort((x, y) => y[key] - x[key] || y.points - x.points).map((p) => el('tr', { class: p[key] >= sh.fair * 1.5 ? 'heavy' : p[key] <= sh.fair * 0.5 ? 'light' : null },
        el('td', { text: nmS(p.id) }),
        el('td', { class: 'num' }, el('div', { class: 'bar-cell' }, el('b', { text: `${p[key]}%` }), el('i', {}, el('span', { style: `width:${Math.round((p[key] / max) * 100)}%` })))),
        el('td', { class: 'num', text: `${p.points} · ${p.pointsPct}%` }), el('td', { class: 'num', text: `${p.tasks} · ${p.tasksPct}%` }), el('td', { class: 'num', text: `${p.email} · ${p.emailPct}%` })))))) :
      el('div', { class: 'empty', text: t('share_none') }),
    el('p', { class: 'hint', text: t('share_fair', { f: sh.fair }) }));
}
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
function kpiMapPlanSection(ds, team, peopleById) { const ym = ds.range.to.slice(0, 7); const tm = teamMonth(cardCtxFromDatasets(team), ym); const nmB = (id) => (nameOf(peopleById.get(id), lang) || id);
      const max = Math.max(1, ...tm.heat.flatMap((h) => TIERS.map((k) => h[k])));
      const cell = (v) => el('td', { class: 'num heat', style: `--heat:${(v / max).toFixed(2)}`, text: v ? String(v) : '' });
      return [el('h2', { id: 'k-map' }, t('heat_h', { m: monthLabel(ym) }), helpQ('help_heat')),
        el('div', { class: 'table-wrap' }, el('table', { class: 'heatmap' },
          el('thead', {}, el('tr', {}, el('th', { text: t('col_person') }), ...TIERS.map((k) => el('th', { class: 'num', text: t(`tier_short_${k}`) })), el('th', { class: 'num', text: t('card_points') }), el('th', { text: t('card_arch') }))),
          el('tbody', {}, tm.cards.sort((x, y) => y.points - x.points).map((c) => el('tr', {}, el('td', { text: nmB(c.personId) }), ...TIERS.map((k) => cell(c.tiers.mine[k])), el('td', { class: 'num', text: String(c.points) }), el('td', { text: t(`arch_${c.archetype}`) })))))),
        el('h2', { id: 'k-plan' }, t('plan_h'), helpQ('help_plan')),
        tm.plan.length ? el('div', { class: 'cards-grid' }, tm.plan.map((p) => { const c = tm.cards.find((x) => x.personId === p.id); return renderCard(c, nmB(p.id), { showRank: true, showSuggestions: true, compact: true }); })) : el('div', { class: 'empty', text: t('plan_none') })]; }
function coverageSection(rep, team, nm) { const cv = coverageTotals(rep, team); if (!cv.people.length && !cv.total.accounts) return null;
      const maxA = Math.max(1, ...cv.people.map((r) => r.accounts));
      return [el('h2', {}, t('f5_title'), helpQ('help_f5')), el('p', { class: 'hint', text: t('f5_sub', { n: cv.total.accounts, d: cv.total.devices, u: cv.total.uncovered, z: cv.total.zeroDevices }) }),
        cv.people.length ? el('div', { class: 'table-wrap' }, el('table', {},
          el('thead', {}, el('tr', {}, ['col_person', 'f5_accounts', 'f5_devices', 'f5_solo', 'f5_touched'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
          el('tbody', {}, cv.people.map((r) => el('tr', {}, el('td', { text: nm(r.id) }),
            el('td', { class: 'num' }, el('div', { class: 'bar-cell' }, el('b', { text: String(r.accounts) }), el('i', {}, el('span', { style: `width:${Math.round((r.accounts / maxA) * 100)}%` })))),
            el('td', { class: 'num', text: String(r.devices) }), el('td', { class: 'num', text: String(r.solo) }),
            el('td', { class: 'num', text: r.accounts ? `${r.touched} · ${Math.round((r.touched / r.accounts) * 100)}%` : '—' })))))) : el('div', { class: 'empty', text: t('f5_none') })]; }
function renderKpi() {
  applyNameFixes();
  const body = $('kpi-body');
  if (!datasets.length) { set(body, el('div', { class: 'empty', text: t('no_data') })); return; }
  if (!datasets.some((d) => d.key === kpiKey)) kpiKey = datasets[0].key;
  const ds = datasets.find((d) => d.key === kpiKey);
  const people = scoped(peopleOf(datasets));
  const peopleById = new Map(peopleOf(datasets).map((p) => [p.id, p]));
  const team = currentTeam(people, allTasks());
  const f = factor1(ds.tasks, { range: ds.range, team });
  const c = completeness(ds);
  const select = el('span', { class: 'period-pick' }, el('select', { id: 'kpi-period', onchange: (e) => { kpiKey = e.target.value; renderKpi(); } },
    datasets.map((d) => el('option', { value: d.key, selected: d.key === kpiKey, text: `${d.range.from} → ${d.range.to}${d.sample ? ' *' : ''}` }))),
    el('button', { type: 'button', class: 'btn quiet tiny', title: t('period_delete'), 'aria-label': t('period_delete'), text: '✕', onclick: async () => {
      const d = datasets.find((x) => x.key === kpiKey); if (!d || !confirm(t('period_delete_confirm', { from: d.range.from, to: d.range.to }))) return;
      datasets = datasets.filter((x) => x.key !== d.key); reports = reports.filter((r) => !(r.range.from === d.range.from && r.range.to === d.range.to));
      await store.put(datasets); await store.putReports(reports); kpiKey = datasets[0] ? datasets[0].key : null; renderDatasets(); renderBlocks(); renderKpi(); toast(t('period_deleted')); } }));
  const rateCell = (r) => el('span', { class: 'rate' }, el('i', {}, el('b', { style: `width:${Math.round((r || 0) * 100)}%` })), formatRate(r));
  const name = (r) => (r.id === GROUP ? t('group_bucket') : (nameOf(peopleById.get(r.id), lang) || r.name));
  const showCancel = f.team.cancelled > 0, showRd = ds.rdKnown && f.team.rd > 0;
  const cols = ['col_person', 'col_assigned', 'col_done', 'col_points', 'col_rate', 'col_avg', 'col_median', 'col_open', ...(showCancel ? ['col_cancelled'] : []), 'col_email', 'col_self', ...(showRd ? ['col_rd'] : []), 'col_created'];
  const repK = reports.find((r) => r.key === ds.key);
  const wp = weightedPoints(ds.tasks, repK ? repK.activities : [], weights(), { range: ds.range, team });
  const pts = (id) => (wp.byId.get(id) || { total: 0 }).total;
  const maxDone = Math.max(1, ...f.people.map((r) => r.done));
  const ordered = [...f.people].sort((a, b) => kpiSort === 'points' ? (pts(b.id) - pts(a.id)) : kpiSort === 'median' ? ((b.medianHours ?? -1) - (a.medianHours ?? -1)) : kpiSort === 'open' ? (b.open - a.open) : (b.done - a.done));
  const line = (r, cls) => el('tr', { class: cls },
    el('td', {}, el('div', { text: cls === 'total' ? t('team') : name(r) }), cls || !positionOf(roster(), r.id, lang) ? null : el('div', { class: 'hint', text: positionOf(roster(), r.id, lang) })),
    el('td', { class: 'num', text: r.assigned }), el('td', { class: 'num' }, cls ? String(r.done) : el('div', { class: 'bar-cell' }, el('b', { text: String(r.done) }), el('i', {}, el('span', { style: `width:${Math.round((r.done / maxDone) * 100)}%` })))),
    el('td', { class: 'num pts', text: cls === 'total' ? String(wp.total) : cls ? '' : String(pts(r.id)) }),
    el('td', { class: 'num' }, rateCell(r.rate)),
    el('td', { class: 'num', text: formatHours(r.avgHours, lang) }), el('td', { class: 'num', text: formatHours(r.medianHours, lang) }),
    el('td', { class: 'num', text: r.open }), showCancel ? el('td', { class: 'num', text: r.cancelled }) : null,
    el('td', { class: 'num', text: r.fromEmail }), el('td', { class: 'num', text: r.selfLogged }), showRd ? el('td', { class: 'num', text: r.rd }) : null, el('td', { class: 'num', text: r.created }));
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

  // quick links: the board is long on a phone — each jumps to its section (buttons, not hash links: the hash routes pages)
  const jump = (id) => { const n = document.getElementById(id); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  set(body,
    el('div', { class: 'bar' }, el('label', {}, el('span', { text: t('period') }), select)),
    el('nav', { class: 'jump', 'aria-label': t('jump_label') }, [['k-share', 'jump_share'], ['k-mail', 'jump_mail'], ['k-load', 'jump_load'], ['k-level', 'jump_level'], ['k-week', 'jump_week'], ['k-table', 'jump_table'], ['k-map', 'jump_map'], ['k-plan', 'jump_plan'], ['k-reports', 'jump_reports']]
      .map(([id, k]) => el('button', { type: 'button', class: 'pill-btn', text: t(k), onclick: () => jump(id) }))),
    renderTeamPicker(people, team),
    ds.sample ? el('p', { class: 'note sample', text: t('sample_note') }) : null,
    c.known && !c.complete ? el('p', { class: 'note', text: `${t('data_incomplete_warn')} (${t('incomplete', { got: c.got, want: c.want })})` }) : null,
    el('div', { class: 'strip six' },
      el('div', { class: 'lead' }, el('b', { text: f.team.done }), el('span', { text: t('col_done') })),
      el('div', {}, el('b', { text: String(wp.total) }), el('span', { text: t('col_points') })),
      el('div', {}, el('b', { text: f.team.assigned }), el('span', { text: t('col_assigned') })),
      el('div', {}, el('b', { text: formatRate(f.team.rate) }), el('span', { text: t('col_rate') })),
      el('div', {}, el('b', { text: formatHours(f.team.medianHours, lang) }), el('span', { text: t('col_median') })),
      el('div', {}, el('b', { text: f.team.open }), el('span', { text: t('col_open') })),
      el('div', {}, el('b', { text: `${f.team.fromEmail} · ${f.team.selfLogged}` }), el('span', { text: `${t('col_email')} · ${t('col_self')}` }))),
    el('p', { class: 'strip-note' }, t('kpi_strip_note'), helpQ('help_points')),
    el('div', { class: 'row', style: 'justify-content:space-between;align-items:center;margin-bottom:8px' },
      el('div', { class: 'pills' }, [['done', 'kpi_sort_done'], ['points', 'kpi_sort_points'], ['median', 'kpi_sort_median'], ['open', 'kpi_sort_open']].map(([k, label]) =>
        el('button', { type: 'button', class: `pill-btn${kpiSort === k ? ' on' : ''}`, text: t(label), onclick: () => { kpiSort = k; renderKpi(); } })))),
    el('div', { id: 'k-table' }),
    table,
    kpiShareSection(team, peopleById),
    kpiMailSection(team, peopleById),
    kpiLoadSection(team, peopleById),
    kpiLevelSection(team, peopleById),
    kpiWeekSection(team, peopleById),
    renderKpiDonuts(ds, f, team),
    kpiMapPlanSection(ds, team, peopleById),
    datasets.length > 1 ? [el('h2', { text: t('trend') }),
      el('div', { class: 'columns' }, trend.map(({ d, f: x }) => el('div', { class: `column${d.key === kpiKey ? ' on' : ''}` },
        el('b', { text: String(x.done) }), el('i', { style: `height:${Math.max(6, Math.round((x.done / Math.max(1, ...trend.map((q) => q.f.done))) * 140))}px` }),
        el('span', { class: 'ltr', text: `${d.range.from.slice(0, 7)} → ${d.range.to.slice(0, 7)}` }), el('small', { text: `${formatRate(x.rate)} · ${formatHours(x.medianHours, lang)}` })))),
      trendTable] : null,
    renderReports(ds.key, team),
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

// ---------- the Weights page: points per task type and per activity category, with their tier and reason ----------
function renderWeights() {
  const body = $('weights-body'); if (!body) return;
  const wt = weights();
  const ds = datasets[0];
  const seen = new Map();
  if (ds) for (const x of ds.tasks) { const k = typeKey(x.type); if (!k) continue; const v = seen.get(k) || { name: x.type, n: 0 }; v.n++; seen.set(k, v); }
  // who is looking: the person whose profile is on this device; rights come from the weights file
  const uid = me && me.user ? me.user.id : null;
  const admin = isWeightsAdmin(wt, uid);
  const mayEdit = (k) => canEditWeight(wt, uid, k);
  // the groups: linked types as myafaqy lists them per team (from the latest file), else the weights file's own tags
  const tt = (ds && ds.teamTypes) || {};
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
    const put = (patch) => { const nf = patch.f || f, b = baseFromFactors(nf), mode = patch.mode || x.mode || 'done';
      const std = mode === 'done' ? undefined : (patch.std != null ? patch.std : x.std || 2);
      save({ tasks: { [r.key]: { w: b, tier: tierFromBase(b), team: x.team || g.id, f: nf, mode, ...(std ? { std, stdSrc: patch.std != null ? 'set' : (x.stdSrc || 'est') } : {}) } } }); };
    const fsel = (i) => el('select', { class: 'w-sel f-sel', title: t(`factor_${FACTORS[i]}`), 'aria-label': t(`factor_${FACTORS[i]}`), ...(can ? {} : { disabled: '' }),
      onchange: (e) => { const nf = [...f]; nf[i] = Number(e.target.value); put({ f: nf }); } }, [0, 1, 2].map((v) => el('option', { value: String(v), selected: v === f[i], text: String(v) })));
    return [
      el('td', { class: 'factors' }, el('div', { class: 'f-row' }, FACTORS.map((k, i) => el('label', {}, el('span', { text: t(`factor_short_${k}`) }), fsel(i))))),
      el('td', { class: 'num' }, el('b', { class: 'base', text: String(x.w) }), el('div', { class: 'hint', text: tierName(x.tier) })),
      el('td', {}, el('select', { class: 'w-sel', ...(can ? {} : { disabled: '' }), onchange: (e) => put({ mode: e.target.value }) }, POINT_MODES.map((m) => el('option', { value: m, selected: m === (x.mode || 'done'), text: t(`mode_${m}`) })))),
      el('td', { class: 'num' }, (x.mode || 'done') === 'done' ? el('span', { class: 'hint', text: '—' }) : [
        el('input', { type: 'number', min: '0.25', max: '400', step: '0.25', class: 'std-in', value: String(x.std || ''), ...(can ? {} : { disabled: '' }), onchange: (e) => { const v = Number(e.target.value); if (v > 0 && v <= 400) put({ std: v }); } }),
        el('div', { class: 'hint', text: x.stdSrc === 'est' ? t('std_est') : x.stdSrc === 'oct' ? t('std_oct') : t('std_set') })]),
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
  const diff = weightPublishDiff(weightsRepo, weightsDevice);
  const approvedJson = () => JSON.stringify(publishableWeights(weightsRepo, weightsDevice, ymd(new Date())), null, 2) + '\n';
  const download = () => {
    const data = approvedJson();
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = el('a', { href: url, download: 'weights.json' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const preparePublication = () => {
    if (!admin || !weightsRepo || !diff.count) return;
    const dlg = el('dialog', { class: 'help-dialog weight-publish-dialog' });
    const prepared = approvedJson();
    const input = el('textarea', { class: 'ltr weight-publish-json', rows: '10', readonly: '' });
    input.value = prepared;
    const copy = async () => {
      try { await navigator.clipboard.writeText(prepared); toast(t('weights_json_copied')); }
      catch { input.focus(); input.select(); toast(t('weights_json_copy_fail')); }
    };
    dlg.append(
      el('h2', { text: t('weights_publish_title') }),
      el('p', { class: 'hint', text: t('weights_publish_intro', { n: diff.count }) }),
      el('ol', { class: 'weight-publish-steps' },
        ...['weights_publish_1', 'weights_publish_2', 'weights_publish_3'].map((k) =>
          el('li', { text: t(k) }))),
      el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn primary', text: t('weights_copy_json'), onclick: copy }),
        el('a', { class: 'btn', href: 'https://github.com/mhmdsfwt371/Jed-Tech-portal/edit/main/weights.json',
          target: '_blank', rel: 'noopener', text: t('weights_github_open') })),
      input,
      el('button', { type: 'button', class: 'btn quiet', text: t('close'), onclick: () => dlg.close() }));
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
  };
  const upload = el('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async (e) => { const file = e.target.files[0]; if (!file) return; try { weightsDevice = parseWeights(JSON.parse(await file.text())); await store.putWeights(weightsDevice); toast(t('weights_loaded')); renderWeights(); renderKpi(); renderMe(); } catch { toast(t('err_json')); } e.target.value = ''; } });
  const myRights = uid ? (admin ? t('w_you_admin') : (Object.keys(wt.tasks).filter(mayEdit).length ? t('w_you_some', { n: Object.keys(wt.tasks).filter(mayEdit).length }) : t('w_you_none'))) : t('w_you_unknown');
  set(body,
    el('div', { class: 'tiers' }, TIERS.map((tr) => el('div', { class: 'tier' }, el('b', { text: String((weightsRepo && weightsRepo.tiers && weightsRepo.tiers[tr]) || { admin: 1, customer: 2, integration: 3, multistage: 5 }[tr]) }), el('div', {}, el('strong', { text: t(`tier_${tr}`) }), el('p', { text: t(`tier_${tr}_why`) }))))),
    el('p', { class: 'note', text: myRights }),
    admin ? el('p', { class: diff.count ? 'note' : 'hint',
      text: diff.count ? t('weights_draft_notice', { n: diff.count }) : t('weights_official_notice') }) : null,
    el('div', { class: 'row', style: 'margin:12px 0' },
      el('button', { type: 'button', class: 'btn primary', text: t('weights_download'), onclick: download }),
      admin ? el('button', { type: 'button', class: 'btn', disabled: !diff.count || !weightsRepo,
        text: t('weights_publish_button'), onclick: preparePublication }) : null,
      admin ? el('button', { type: 'button', class: 'btn', text: t('weights_upload'), onclick: () => upload.click() }) : null, upload,
      weightsDevice ? el('button', { type: 'button', class: 'btn quiet', text: t('weights_reset'), onclick: async () => { weightsDevice = null; await store.putWeights(null); renderWeights(); renderKpi(); renderMe(); } }) : null,
      el('span', { class: 'hint', text: wt.reviewed ? t('weights_reviewed', { d: wt.reviewed }) : '' })),
    groups.map(table),
    el('h2', {}, t('weights_acts_h'), helpQ('help_weights_acts')),
    el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, ['w_col_category', 'w_col_weight'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
      el('tbody', {}, Object.entries(wt.activities).map(([k, w]) => el('tr', {}, el('td', { text: pretty(k) }), el('td', { class: 'num' }, stepSel(w, (nw) => save({ activities: { [k]: nw } }), admin || mayEdit(k)))))))),
    el('p', { class: 'hint', text: t('weights_seen_note', { range: ds ? `${ds.range.from} → ${ds.range.to}` : '—' }) }));
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
// ---------- name corrections (device only, never in the repository) ----------
const NAME_KEY = 'afaqy.names';
const nameFixes = () => { try { return JSON.parse(localStorage.getItem(NAME_KEY) || '{}') || {}; } catch { return {}; } };
function applyNameFixes() {
  const fx = nameFixes(); if (!Object.keys(fx).length) return;
  const fix = (p) => { const f = p && fx[p.id]; if (!f) return; if (f.ar) p.nameAr = f.ar; if (f.en) p.nameEn = f.en; };
  for (const d of datasets) for (const p of d.people || []) fix(p);
  if (me) for (const p of me.people || []) fix(p);
}
function renderTeam() {
  applyNameFixes();
  const body = $('team-body'); if (!body) return;
  const known = new Map();
  for (const p of peopleOf(datasets)) known.set(p.id, p);
  if (me) for (const p of me.people) if (!known.has(p.id)) known.set(p.id, p);
  for (const id of Object.keys(roster().people)) if (!known.has(id)) known.set(id, { id, nameEn: '', nameAr: '', teams: [] });
  const ro = roster();
  const everyone = [...known.values()].sort((a, b) => (nameOf(a, lang) || a.id).localeCompare(nameOf(b, lang) || b.id, lang));
  const on = scopeApplies(ro, everyone.map((p) => p.id));
  const people = on ? everyone.filter((p) => inScope(ro, p.id)) : everyone;
  const others = on ? everyone.filter((p) => !inScope(ro, p.id)) : [];
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
    everyone.filter((p) => p.id !== id && (inScope(ro, p.id) || leaderOf(ro, id) === p.id)).map((p) => el('option', { value: p.id, text: nameOf(p, lang) || p.id, selected: leaderOf(ro, id) === p.id })));
  // the panel lists the whole team as set here (names stay on this device; the panel matches them in myafaqy's list) — nothing pre-ticked
  const afterSalesNames = scopeIds(ro).filter((id) => /after-sales/i.test((ro.people[id] || {}).positionEn || '')).map((id) => (known.get(id) || {}).nameEn).filter(Boolean);
  const ab = buildAssignBookmarklet(lang, afterSalesNames);
  set(body,
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
          p.teams && p.teams.length ? el('div', { class: 'hint', text: p.teams.join(' · ') }) : null),
        el('td', { class: 'ltr', text: p.id }),
        el('td', {}, el('input', { type: 'text', value: positionOf(ro, p.id), placeholder: t('team_pos_ph'), onchange: (e) => save(p.id, { position: e.target.value.trim() }) })),
        el('td', {}, leaderSelect(p.id)))))))
      : el('div', { class: 'empty', text: t('team_none') }),
    (() => { const idIn = el('input', { type: 'text', inputmode: 'numeric', placeholder: t('team_add_id_ph'), class: 'ltr', style: 'max-width:160px' });
      const posIn = el('input', { type: 'text', placeholder: t('team_pos_ph') });
      return el('div', { class: 'row team-add' }, el('b', { text: t('team_add_h') }), idIn, posIn,
        el('button', { type: 'button', class: 'btn tiny', text: t('team_add_btn'), onclick: () => { const id = idIn.value.trim();
          if (!/^\d+$/.test(id) || !posIn.value.trim()) { toast(t('team_add_bad')); return; } save(id, { position: posIn.value.trim() }); } })); })());
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
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = dirOf(lang);
  document.querySelectorAll('[data-t]').forEach((n) => { n.textContent = t(n.dataset.t); });
  document.querySelectorAll('[data-tp]').forEach((n) => { n.placeholder = t(n.dataset.tp); });
  $('lang-select').value = lang;
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
function route() {
  const views = ['tools', 'me', 'pro', 'data', 'kpi', 'team', 'weights', 'guide'];
  const requested = location.hash.slice(1);
  let hash = portalRoute(requested, isTeamPortal);
  if (requested !== hash) history.replaceState(null, '', '#' + hash);
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
  else { document.title = `${t('brand')} — ${t('portal')} — ${t(isTeamPortal ? 'title_team' : 'title_admin')}`; $('page-title').textContent = t({ tools: 'portal', me: 'nav_me', pro: 'nav_pro', data: 'nav_data', kpi: 'kpi_board', team: 'nav_team', weights: 'nav_weights', guide: 'nav_guide' }[v]); currentModule = null; }
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
  if (v === 'weights') renderWeights();
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
  const all = { backup: 'afaqy-portal/v2', exportedAt: new Date().toISOString(), version: PORTAL_VERSION,
    datasets, reports, cards: monthCards, oneonone: meet, repairs, privlinks: privLinks, mailrows: mailRows, weights: weightsDevice || null, roster: rosterDevice || null, me: me || null, names: nameFixes() };
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
      if (j.names && typeof j.names === 'object') { const fx = nameFixes(); for (const [id, v] of Object.entries(j.names)) if (/^\d+$/.test(id) && v && typeof v === 'object' && !fx[id]) fx[id] = { ar: String(v.ar || '').slice(0, 80), en: String(v.en || '').slice(0, 80) }; localStorage.setItem(NAME_KEY, JSON.stringify(fx)); }
      await store.putPriv(privLinks);
      const seenMail = new Set(mailRows.map((r) => r.i));
      for (const r of Array.isArray(j.mailrows) ? j.mailrows : []) if (r && r.i && !seenMail.has(r.i)) mailRows.push({ i: String(r.i), t: String(r.t), c: String(r.c), w: String(r.w), k: r.k == null ? null : String(r.k) });
      await store.putMail(mailRows);
      if (j.weights && !weightsDevice) { weightsDevice = j.weights; await store.putWeights(weightsDevice); }
      if (j.roster && !(rosterDevice && Object.keys(rosterDevice.people || {}).length)) { rosterDevice = parseRoster(j.roster); await store.putRoster(rosterDevice); }
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
  await refreshOfficialWeights();
  try { const r = await fetch('./systems.json', { cache: 'no-store' }); const data = r.ok && validateSystems(await r.json()); if (data) { SYSTEMS = data.systems; SYSTEM_CATEGORIES = data.categories; } } catch { /* retain built-in links when unavailable */ }
  await loadStrings(['ar', lang]);   // Arabic is every key's fallback; the reader's language besides
  applyLang();   // renders everything and routes
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
