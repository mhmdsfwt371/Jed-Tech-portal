// app.js — everything on the page. Data stays in this browser (IndexedDB); nothing is sent anywhere.
import { PRIMARY, SYSTEMS as DEFAULT_SYSTEMS, SYSTEM_CATEGORIES as DEFAULT_SYSTEM_CATEGORIES, MORE, PORTAL_VERSION, MODULE_ALLOW } from './config.js';
import { mountTourDemo, replayTourDemo } from './tour-demo.js';
import {
  t as tr, L, LANGS, dirOf, tourState, TOUR_DEVICES, tourDemoPlan, periodBlocks, buildPrompt, parseDataset, mergeDataset, completeness, factor1, plannerSummary, mailKey,
  formatHours, formatRate, sampleDataset, GROUP, GUIDE, DEFINITIONS, peopleOf, defaultTeam, nameOf,
  buildBookmarklet, parseMe, parseMePayload, myProfile, openTasks, profileMonths, upgradeMe,
  parseRoster, mergeRoster, positionOf, leaderOf, donutParts, ROSTER_SCHEMA, saudiDay, teamAlerts, buildAssignBookmarklet,
  monthReadings, READINGS_TEAM,
  parseWeights, mergeWeights, weightedPoints, typeKey, typeNameOf, accountsBoard, projectLine, projectDeletePlan, dailyIntake, startDue, coveredFrom, taskWeight, taskPoints, activityWeight, baseFromFactors, tierFromBase, rulesOf, parseRules, rulesAreDefault, factorScore, DEFAULT_RULES, afterHours, pointsDetail, EXTRA_CONDS, businessHours, isCustomMode, TEAMTYPES_AUTO_SCHEMA, buildTypesBookmarklet, parseTeamTypesTransfer, buildOrg, compareOrg, JEDDAH_BRANCH, managerPullRecipe, overtimeOf, SOURCES, taskSource, POINT_MODES, FACTORS, typeLabel, loadStrings, weightPublishDiff, publishableWeights, portalWeights, WEIGHT_STEPS, TIERS, scopeIds, inScope, scopeApplies, canEditWeight, isWeightsAdmin,
  monthCard, teamMonth, closableMonths, monthRange, prevMonth, ARCHETYPES, ymd,
  weeklyDigest, goalProgress, patternPath, coverageTotals, CARD_DEFAULTS, shareWindow, workloadShare, repairCheck, parseRepairLines, lastQuarters, supersede, engineerLevels, developmentPlan, LEVELS, loadSustainability,
  safePortalUrl, buildReportsPrompt, parseReports, techTotals, afterSalesTotals, activityTotals, REPORTS_SCHEMA, buildManagerBookmarklet, parseManagerTransfer, MANAGER_AUTO_SCHEMA, portalRoute,
  quarterRange, quarterOf, quarterBaseline, quarterGoalProgress, planProgress, suggestQuarterGoals,
  maParse, maMerge, maCovers, maStats, maSuggest, maDay, maOwnText, maCategory, maIsReply,
  tenderDigits, tenderEmailSchedule, tenderDeadlineCandidates, applyTenderEmailDates, TENDER_FILE_KINDS, TENDER_DATE_FIELDS, tenderNeeds, tenderAmount, tenderDatePatch, backupDue, parseTenderStudy, matchTenderStudy, applyTenderStudy, tenderAutoStage, tenderStudyFromSheet,
  RADAR_SCHEMA, parseRadar, radarFromSheets, radarMerge, radarFind, radarSuggest, applyEtimad, radarToItem, etimadLinkPatch, tenderUndoEtimad, radarResult, tenderOutcome, radarSimilar, radarOurBids, tenderFunnel, tenderArchive, marketStats, marketPeriod,
  ANALYZER, parseAnalyzerHello, analyzerNote, cleanAnalyzerAuto, analyzerAuto, analyzerAutoNote, parseAnalyzerJob, analyzerJobId, analyzerSend, analyzerOutputKind, analyzerStudyFile, dateCheckTag,
  cleanProjectWork, projectWorkFind, projectWorkUpdate, mergeProjectWork, projectProgress, projectReport,
  tenderCanAdvance, cleanTenderDetails, mergeTenderDetails, pageStarts,
  mailThread, mailWall, mailGist, tenderThreadMerge, tenderThreadFacts, mailHandsOver, tenderForHandover, tenderHandoverPatch, tenderHandoverRelink, tenderHandoverKind, tenderHistory, mailsOnDay, tenderMailFacts, tendersFrom, mailEtimadRef, mailIsTender, tenderRefOf, tenderCleanup, tenderMerge,
  TENDER_HANDOVER_DAYS, tenderMilestones, tenderAgenda, tenderNotices, tenderNoticeId, agendaFold, agendaByTender, tenderAgendaMove, MAILDIR_ASK, mailDirNew, mailDirSeen, mailDirReport, mailDirFailed, tenderDateChanges, crc32, zipLocalHeader, zipDirectory, zipFindEnd, zipEntries, zipDataStart, zipSafeName, SYNC_PIECE, syncPieceIv, TENDER_CLOSED, tenderHandoverDue, tenderHandedAt, tenderHandoverOnTime, tenderLead, minutesUntil, tenderShownFields, tenderYearReport, workDaysBetween } from './core.js';

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

// ---------- v9.81 (ADR-0150): no table scrolls sideways — on a narrow screen the end columns fold into a «the rest» row ----------
// Columns are hidden from the end until the table fits its box; the first column, a column marked `keep`, and a column holding a
// control (a field, a list, a button) always stay. Each row then gets one button that opens what was hidden under it, label by value.
// Works on every table inside a .table-wrap, wherever it is drawn (page or window), and again when the width changes.
function fitTable(tbl) {
  const wrap = tbl.parentElement; if (!wrap || !wrap.classList.contains('table-wrap') || tbl.classList.contains('w-cards')) return;
  // fitted already at this width with these rows: left alone, so a row someone opened stays open while the page changes elsewhere
  const key = `${wrap.clientWidth}:${tbl.querySelectorAll('tr:not(.ph-detail)').length}`; if (tbl.dataset.fit === key) return; tbl.dataset.fit = key;
  if (!wrap.clientWidth) return;
  const was = tbl.dataset.fitCols || '';
  // measured again with classes only — the rows and their buttons stay where they are, so nothing moves unless the fold changes
  tbl.querySelectorAll('.ph-h').forEach((c) => c.classList.remove('ph-h')); tbl.classList.remove('ph-fold');
  const hidden = new Set(); let hg = null, bg = null, body = null;
  tbl.classList.add('ph-measure'); const over = () => tbl.scrollWidth > wrap.clientWidth + 2;
  try {
    if (over() && tbl.tHead) {
      // which columns each cell covers, header rows (with their merged cells) included
      const span = (rows) => { const grid = []; rows.forEach((r, ri) => { let c = 0; grid[ri] = grid[ri] || [];
        for (const cell of r.cells) { while (grid[ri][c]) c++; for (let dr = 0; dr < cell.rowSpan; dr++) for (let dc = 0; dc < cell.colSpan; dc++) { grid[ri + dr] = grid[ri + dr] || []; grid[ri + dr][c + dc] = cell; } c += cell.colSpan; } }); return grid; };
      hg = span([...tbl.tHead.rows]); const n = hg[0].length;
      body = [...tbl.tBodies, ...(tbl.tFoot ? [tbl.tFoot] : [])].flatMap((b) => [...b.rows]).filter((r) => !r.classList.contains('ph-detail'));
      bg = body.map((r) => span([r])[0]);
      if (n >= 3 && hg.every((r) => r.length === n) && bg.every((r) => r.length === n)) {   // a row that does not line up: left as it is rather than folded wrong
        const cellsOf = (j) => new Set([...hg.map((r) => r[j]), ...bg.map((r) => r[j])]);
        const fixed = (j) => j === 0 || hg.some((r) => r[j].classList.contains('keep')) || bg.some((r) => r[j].colSpan === 1 && r[j].querySelector('input,select,textarea,button:not(.ph-more-btn)'));
        const apply = () => { const all = new Set(); for (let j = 0; j < n; j++) cellsOf(j).forEach((c) => all.add(c));
          for (const c of all) { const cs = []; for (let j = 0; j < n; j++) if (cellsOf(j).has(c)) cs.push(j); c.classList.toggle('ph-h', cs.every((j) => hidden.has(j))); } };
        for (let j = n - 1; j > 0 && n - hidden.size > 2 && over(); ) {
          const top = hg[0][j]; let a = j; while (a > 0 && hg[0][a - 1] === top) a--;   // a header group folds as one
          const unit = []; for (let k = a; k <= j; k++) unit.push(k);
          if (!unit.some(fixed) && n - hidden.size - unit.length >= 2) { unit.forEach((k) => hidden.add(k)); apply(); }
          j = a - 1;
        }
      }
    }
  } finally { tbl.classList.remove('ph-measure'); }
  if (hidden.size) tbl.classList.add('ph-fold');
  const now = [...hidden].sort((x, y) => x - y).join(','); tbl.dataset.fitCols = now;
  if (now === was) return;   // the same fold as before: its buttons, and any row someone opened, stay as they are
  tbl.querySelectorAll('tr.ph-detail, .ph-more-btn').forEach((x) => x.remove());
  if (!hidden.size) return;
  const n = hg[0].length, label = (j) => [...new Set(hg.map((r) => r[j]))].map((c) => c.textContent.trim()).filter(Boolean).join(' — ');
  const shown = n - hidden.size, cols = [...hidden].sort((x, y) => x - y);
  body.forEach((r, ri) => {
    const cells = [...new Set(cols.map((j) => bg[ri][j]))].filter((c) => c.classList.contains('ph-h'));
    if (!cells.some((c) => c.textContent.trim())) return;
    const btn = el('button', { type: 'button', class: 'ph-more-btn', 'aria-expanded': 'false', 'aria-label': t('ph_more'), title: t('ph_more') });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (r.nextElementSibling && r.nextElementSibling.classList.contains('ph-detail')) { r.nextElementSibling.remove(); btn.setAttribute('aria-expanded', 'false'); return; }
      const dl = el('dl', { class: 'ph-dl' }, cells.map((c) => { const js = cols.filter((j) => bg[ri][j] === c); return [el('dt', { text: label(js[0]) }), el('dd', {}, [...c.cloneNode(true).childNodes].filter((x) => !(x.classList && x.classList.contains('ph-more-btn'))))]; }));
      r.after(el('tr', { class: 'ph-detail' }, el('td', { colspan: String(shown) }, dl))); btn.setAttribute('aria-expanded', 'true');
    });
    bg[ri][0].prepend(btn);
  });
}
let fitBusy = false, fitW = 0;
function fitTables(root = document) { if (fitBusy) return; fitBusy = true; try { root.querySelectorAll('.table-wrap > table').forEach(fitTable); } finally { fitBusy = false; } }
(() => {
  let queued = false;
  const frame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f) => setTimeout(f, 16);   // the page tests run without a frame clock
  const later = () => { if (queued) return; queued = true; frame(() => { queued = false; fitTables(); if (obs) obs.takeRecords(); }); };
  if (typeof MutationObserver !== 'function') return;
  const obs = new MutationObserver((list) => { if (!fitBusy && list.some((m) => [...m.addedNodes].some((x) => x.nodeType === 1 && !x.matches('.ph-detail, .ph-more-btn') && !(x.closest && x.closest('.dlg-pager')) && (x.matches('.table-wrap, table, tbody, tr') || (x.querySelector && x.querySelector('.table-wrap > table')))))) later(); });
  const start = () => { obs.observe(document.body, { childList: true, subtree: true }); later(); };
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
  addEventListener('resize', () => { if (innerWidth !== fitW) { fitW = innerWidth; later(); } });
  addEventListener('hashchange', later);
  document.addEventListener('toggle', later, true);   // a window or a folded part opening: its tables now have a width to measure
})();
// A part of a long page that folds: only its title shows, and opening one closes the others in the same `group` (the `name` of
// <details>). Which part is open survives the page being redrawn, so editing inside it does not close it.
const foldOpen = {};
function fold(group, id, summary, body, cls = '') {
  const d = el('details', { class: `fold ${cls}`.trim(), name: group, 'data-fold': id, ...(foldOpen[group] === id ? { open: '' } : {}) }, el('summary', {}, summary), el('div', { class: 'fold-body' }, body));
  d.addEventListener('toggle', () => { if (d.open) foldOpen[group] = id; else if (foldOpen[group] === id) delete foldOpen[group]; });
  return d;
}
// print shows every part, folded or not, and every column
// (the group's name is lifted first: with it, opening one part would close the others)
addEventListener('beforeprint', () => { document.querySelectorAll('details.fold').forEach((d) => { d.dataset.printWas = `${d.open ? 1 : 0}${d.getAttribute('name') || ''}`; d.removeAttribute('name'); d.open = true; }); });
addEventListener('afterprint', () => { document.querySelectorAll('details.fold[data-print-was]').forEach((d) => { const w = d.dataset.printWas; delete d.dataset.printWas; d.open = w[0] === '1'; if (w.slice(1)) d.setAttribute('name', w.slice(1)); }); });

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
    async putTenders(next, revision) {
      const db = await open();
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction('kv', 'readwrite'), records = tx.objectStore('kv');
          const previous = records.get('tenders');
          previous.onsuccess = () => {
            if ((previous.result?.revision || '') !== revision) { tx.abort(); return; }
            records.put(next, 'tenders');
          };
          tx.oncomplete = resolve;
          tx.onabort = () => reject(tx.error || new Error('tender revision changed'));
        });
      } finally { db.close(); }
    },
    async getProjectFiles(id) { return (await run('readonly', s => s.get('pf:'+id))) || []; },
    async putProjectWork(next, revision) {
      const db=await open();
      try { await new Promise((resolve,reject)=>{
        const tx=db.transaction('kv','readwrite'), records=tx.objectStore('kv'), previous=records.get('projectwork');let conflict=false;
        previous.onsuccess=()=>{if((previous.result?.revision||'')!==revision){conflict=true;tx.abort();return;}records.put(next,'projectwork');};
        tx.oncomplete=resolve;tx.onabort=()=>reject(conflict?new Error('project revision changed'):tx.error||new Error('project storage failed'));
      }); } finally { db.close(); }
    },
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
  $('tour-progress').setAttribute('aria-valuetext', count); $('tour-progress').setAttribute('aria-label', t('tour_progress'));
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
/** ADR-0115: whose device this is on the manager link — the account whose pull last arrived here straight from MyAFAQY (the bookmark or
 *  the extension). An uploaded or synced file never changes it. With no such pull yet, the manager named in the team file, as before. */
const ownerId = () => { const o = pref('ownerId'); return o && (peopleOf(datasets).some((p) => p.id === o) || (roster().people || {})[o]) ? o : managerIdOf(); };
const setOwner = (id) => { if (pref('ownerId') !== String(id)) { pref('ownerId', String(id)); pref('team', ''); } };
const setOwnerFrom = (ds) => { if (ds && ds.pulledBy && ds.pulledBy.id) setOwner(ds.pulledBy.id); };
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
  // ADR-0105: a page's «?» also gives its steps, one per line (the after-sales manual, page by page)
  const sk = String(key || '').replace(/^g_(\w+)_b$/, 'hs_$1'), steps = sk !== key && t(sk) !== sk ? t(sk).split('\n').filter(Boolean) : [];
  const ol = $('help-steps'); if (ol) { set(ol, steps.map((s) => el('li', { text: s }))); ol.hidden = !steps.length; $('help-steps-h').hidden = !steps.length; }
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
    el('select', { class: 'w-sel', 'aria-label': t('a11y_goal_measure'), onchange: (e) => { g.key = e.target.value; } }, [['__points__', t('goal_points')], ...typeChoices].map(([k, n]) => el('option', { value: k, selected: k === g.key, text: n }))),
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
  const eng = el('select', { class: 'w-sel', 'aria-label': t('repair_who') }, el('option', { value: '', text: t('repair_who') }), scopePeople.map((p) => el('option', { value: p.id, text: nameOf(p, lang) || p.id })));
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
let projLineF = '';   // ADR-0125: '' all, 'tender', 'upsell', 'none' (not sorted)
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
// ---------- Outlook inside the portal (ADR-0029) — removed in ADR-0109 ----------
// The Microsoft sign-in (read access to the inbox) needed IT's admin consent; that route was dropped on 2026-11-08. Mail comes from a PST file
// (ADR-0095). Rows read before stay on the device and in the backup, so an old backup still restores cleanly.
let mailRows = [];
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
  else {
    const myRanges = (meDerived || viewAs) ? datasets.map((d) => d.range) : [{ from: saudiDay(me.since || me.extractedAt), to: saudiDay(me.extractedAt) }];
    const pulledM = pulledPeriods('month', myRanges).map((m) => m.ym);
    const ymRank = /^\d{4}-\d{2}$/.test(meMonth || '') && pulledM.includes(meMonth) ? meMonth : pulledM.includes(ymNow) ? ymNow : pulledM[0];
    const now = ymRank ? rankIn(ymRank) : null, prevYm = ymRank ? ymShift(ymRank, -1) : null, before = prevYm && pulledM.includes(prevYm) ? rankIn(prevYm) : { p: 0, r: 0 };
    if (!now || (now.p === 0 && now.r === 1)) rankBox = el('div', { class: 'pg-rank' }, el('p', { class: 'hint', text: t('pg_rank_empty', { m: ymRank ? monthLabel(ymRank) : '' }) }));
    else {
    const move = before.p > 0 ? (before.r > now.r ? el('span', { class: 'delta good', text: `▲ ${t('pg_up', { a: before.r })}` }) : before.r < now.r ? el('span', { class: 'delta bad', text: `▼ ${t('pg_down', { a: before.r })}` }) : el('span', { class: 'delta same', text: t('pg_same') })) : null;
    rankBox = el('div', { class: 'pg-rank', 'data-month': ymRank }, el('b', { class: 'pg-big', text: t('pg_rank', { r: now.r, n: now.n }) }), el('span', { class: 'hint', text: t('pg_rank_in', { m: monthLabel(ymRank) }) }),
      el('div', { class: 'pg-gap', text: now.gap != null ? t('pg_gap', { g: now.gap }) : now.lead === 0 ? t('pg_tie') : now.lead != null ? t('pg_lead', { g: now.lead }) : '' }), move); } }
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
  if (!me && !isTeamPortal && datasets.length) { const mid = ownerId(); if (mid) { const m = meFromPulls(mid); if (m) { me = m; meDerived = true; } } }
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
  { const ic = $('intro-card-me'); if (ic) ic.classList.toggle('intro-compact', !!(me || (isTeamPortal && mySnapId && rankSnaps[mySnapId]))); }   // ADR-0087: his numbers first
  if (!me) { const snap = isTeamPortal && mySnapId ? rankSnaps[mySnapId] : null;   // ADR-0078: his numbers as his manager sent them
    if (snap && snap.m) { set(body, snapView(snap), el('details', { class: 'me-again' }, el('summary', { text: t('ms_full') }), el('section', { class: 'dt-quick me-setup' }, ...setup))); return; }
    set(body, vaBar, !isTeamPortal ? projectsCard() : null, el('section', { class: 'dt-quick me-setup' }, ...setup)); return; }   // projects also work without a personal KPI import
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
      el('button', { type: 'button', class: 'btn quiet me-again va-hide', text: t('me_setup_again'), onclick: () => { const c = document.querySelector('#me-body .sec-card[data-sec=refresh]'); if (c) c.click(); } }),
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
    // ADR-0123: the definitions and «update my numbers» are cards that open in a window
    secCards('me', [
      { id: 'refresh', title: t('me_refresh_h'), v: '', sub: t('sc_me_refresh_sub'), node: el('div', { class: 'me-refresh' }, el('h2', { text: t('me_refresh_h') }), el('p', { class: 'hint', text: t('me_refresh') }), ...setup,
        el('button', { type: 'button', class: 'btn va-hide', text: t('me_forget'), onclick: async () => { if (viewAs || meDerived) return; me = null; await store.putMe(null); secDlg && secDlg.open && secDlg.close(); renderMe(); } })) },
      { id: 'defs', title: t('definitions'), v: String(KM_DEFS.length), sub: t('sc_defs_sub'), node: [el('h2', { text: t('definitions') }), el('ul', { class: 'defs' }, KM_DEFS.map((k) => el('li', { text: t(k) })))] },
    ]));
  dLive();
}
/** Direction D, after drawing: the rank moves into «your next step» (one place for it), and the headline numbers count up once. */
function dLive() {
  const root = $('view-me'), slot = root && root.querySelector('.pm-next-slot'); if (!slot) return;
  const rk = root.querySelector('.pg-rank'); if (rk) slot.append(rk); else slot.closest('.pm-next').hidden = true;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const e of root.querySelectorAll('.pm-d .pm-v, .pm-d .pm-count')) { const m = /^(\d+(?:\.\d+)?)(%?)$/.exec(e.textContent.trim()); if (!m) continue;
    const end = +m[1], dec = (m[1].split('.')[1] || '').length, t0 = performance.now(), fin = e.textContent;
    const step = (now) => { const k = Math.min(1, (now - t0) / 650), v = end * (1 - Math.pow(1 - k, 3)); e.textContent = k >= 1 ? fin : `${v.toFixed(dec)}${m[2]}`; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); }
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
let tdDlg = null;   // the tender's detail window (ADR-0122)
let tdKind = pref('tdkind') || 'month', tdPick = '', tdFrom = '', tdTo = '', tdBusy = '', tdOpenId = null, tdStageF = null, tdCardF = null;   // ADR-0102: a card's filter
let tdQuery = '', tdMailResult = null, tdStudyResult = null, tdMoreOpen = false;   // v9.74: «More» is a menu — closed when the page opens, kept open while it redraws   // tdStudyResult: the last analyzer import (ADR-0126)
const TD_FROM = 'a.ibrahim@afaqy.com';
// ADR-0083: the lifecycle. Open stages in order, then the closed ones. declined/lost need a reason.
const TD_STAGES = ['received', 'screen', 'decide', 'prep', 'ready', 'submitted', 'won', 'lost', 'missed', 'cancelled', 'declined'];   // missed (v9.58): we meant to bid and the platform closed first
const TD_OPEN = ['received', 'screen', 'decide', 'prep', 'ready', 'submitted'], TD_NEED_REASON = ['declined', 'lost', 'missed'];
const tdDaysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 864e5);
/** The nearest coming date of a tender and what it is, for the countdown. */
// ---------- v9.73 (ADR-0143): the agenda — every date of every open tender on one strip, with a notice on this device ----------
let agDays = Number(pref('td.agdays')) || 14;
const AG_ON = 'td.notify', AG_SEEN = 'td.noticed';
const agCan = () => typeof Notification !== 'undefined';
const agOn = () => agCan() && pref(AG_ON) === '1' && Notification.permission === 'granted';
const agDayName = (day) => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : lang === 'ur' ? 'ur-PK-u-nu-latn' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
const agWhen = (x) => (x.left < 0 ? t('ag_late') : x.left === 0 ? t('ag_today') : x.left === 1 ? t('ag_tomorrow') : agDayName(x.day));
/** Said once per date, and only while the portal is open in this browser — a page has no way to speak when it is closed. */
function tdNotify() {
  if (!tenders || !agOn()) return;
  let seen = []; try { seen = JSON.parse(pref(AG_SEEN) || '[]'); } catch { seen = []; }
  const due = tenderNotices(tenderAgenda(tenders.items, saudiDay(new Date().toISOString()), 2), seen);
  // v9.76: the inquiries' upload day carries the platform's deadline after it — one notice for both (agendaFold)
  const also = (x) => (x.also ? t('ag_also', { what: t(`td_col_${x.also.key}`), when: agWhen(x.also) + (x.also.time ? ` ${x.also.time}` : '') }) : '');
  for (const x of due.slice(0, 6)) { try { new Notification(t('ag_notice', { what: t(`td_col_${x.key}`), when: agWhen(x) + (x.time ? ` ${x.time}` : '') }), { body: [also(x), x.subject.slice(0, 140)].filter(Boolean).join('\n'), tag: tenderNoticeId(x), lang }); } catch { return; } }
  if (due.length) pref(AG_SEEN, JSON.stringify([...seen, ...due.flatMap((x) => [tenderNoticeId(x), ...(x.also ? [tenderNoticeId(x.also)] : [])])].slice(-400)));
}
function tdIcsAll(rows) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AFAQY Jeddah portal//tenders agenda//AR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const x of agendaFold(rows)) { const next = new Date(`${x.day}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
    L.push('BEGIN:VEVENT', `UID:${x.id.replace(/[^a-z0-9]/gi, '').slice(0, 40)}-${x.key}@afaqy-jeddah-portal`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${x.day.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, '')}`,
      `SUMMARY:${esc(`${t(`td_col_${x.key}`)}${x.time ? ` ${x.time}` : ''}${x.also ? ` · ${t('ag_also', { what: t(`td_col_${x.also.key}`), when: x.also.day + (x.also.time ? ` ${x.also.time}` : '') })}` : ''} — ${x.subject}`)}`, `DESCRIPTION:${esc(t('nav_tenders'))}`, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${esc(x.subject)}`, 'END:VALARM', 'END:VEVENT'); }
  L.push('END:VCALENDAR'); return L.join('\r\n');
}
function tdAgenda(today) {
  const all = tenderAgenda(tenders.items, today, agDays); if (!tenderAgenda(tenders.items, today, 90).length) return null;
  const open = (x) => { tdOpenId = x.id; tdKind = 'all'; tdStageF = tdCardF = null; tdQuery = ''; renderTenders(); requestAnimationFrame(() => { const r = document.querySelector(`#tenders-body tr.td-row.on`); if (r) r.scrollIntoView({ block: 'center', behavior: 'smooth' }); }); };
  const bell = agCan() ? el('button', { type: 'button', class: `btn tiny ag-bell${agOn() ? ' on' : ''}`, 'aria-pressed': String(agOn()), title: t('ag_bell_note'), text: `🔔 ${t(agOn() ? 'ag_bell_on' : 'ag_bell')}`, onclick: async () => {
    if (agOn()) { pref(AG_ON, ''); renderTenders(); return; }
    let perm = Notification.permission; if (perm === 'default') { try { perm = await Notification.requestPermission(); } catch { perm = 'denied'; } }
    if (perm !== 'granted') { toast(t('ag_bell_denied')); return; }
    pref(AG_ON, '1'); renderTenders(); toast(t('ag_bell_note')); tdNotify(); } }) : null;
  const ics = el('button', { type: 'button', class: 'btn tiny ag-ics', text: t('ag_ics'), onclick: () => { const rows = tenderAgenda(tenders.items, today, 120).filter((x) => x.left >= 0); const b = new Blob([tdIcsAll(rows)], { type: 'text/calendar' }), u = URL.createObjectURL(b);
    const a = el('a', { href: u, download: `tenders-agenda-${today}.ics` }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); } });
  const range = el('div', { class: 'pills ag-range', role: 'group', 'aria-label': t('ag_h') }, [7, 14, 30].map((n) => el('button', { type: 'button', class: `pill-btn${agDays === n ? ' on' : ''}`, 'aria-pressed': String(agDays === n), text: t('ag_days', { n }), onclick: () => { agDays = n; pref('td.agdays', String(n)); renderTenders(); } })));
  // v9.78 (ADR-0148): a tender once, on its nearest date, the dates after it inside its card; every day of the range is a column, so
  // a card can be dropped on a day that has nothing yet. Dropping (or picking a day on the card) moves the reminder only.
  const cards = agendaByTender(all), late = cards.filter((x) => x.left < 0), dayList = [];
  for (let k = 0; k <= agDays; k++) { const d = new Date(`${today}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + k); dayList.push(d.toISOString().slice(0, 10)); }
  const lab = (x) => t(`td_col_${x.key}`) + (x.time ? ` · ${x.time}` : '');
  const card = (x) => el('div', { class: `ag-item ag-${x.tone} ag-k-${x.key}${x.from ? ' ag-moved' : ''}`, 'data-id': x.id, 'data-key': x.key, draggable: 'true',
      ondragstart: (e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ id: x.id, key: x.key, from: x.from || x.day })); e.dataTransfer.effectAllowed = 'move'; e.currentTarget.classList.add('dragging'); },
      ondragend: (e) => e.currentTarget.classList.remove('dragging') },
    el('button', { type: 'button', class: 'ag-open', onclick: () => open(x) }, el('b', { text: lab(x) }), el('span', { dir: 'auto', text: x.subject.slice(0, 70) }),
      x.left < 0 ? el('small', { text: agDayName(x.day) }) : null, x.from ? el('small', { class: 'ag-from', text: t('ag_moved', { d: agDayName(x.from) }) }) : null),
    x.later.length ? el('ul', { class: 'ag-later' }, x.later.map((l) => el('li', { 'data-key': l.key, class: l.from ? 'ag-moved' : '', draggable: 'true', title: t('ag_move', { what: lab(l) }),
        ondragstart: (e) => { e.stopPropagation(); e.dataTransfer.setData('text/plain', JSON.stringify({ id: l.id, key: l.key, from: l.from || l.day })); e.dataTransfer.effectAllowed = 'move'; } },
      el('span', { text: t('ag_then', { when: agDayName(l.day), what: lab(l) }) }), l.from ? el('small', { class: 'ag-from', text: ` · ${t('ag_moved', { d: agDayName(l.from) })} ` }) : null,
      l.from ? el('button', { type: 'button', class: 'btn tiny quiet ag-unmove', text: t('ag_unmove'), onclick: () => { void tdAgMove(l, l.from); } }) : null))) : null,
    el('div', { class: 'ag-move-row' }, el('label', { class: 'ag-move' }, el('span', { 'aria-hidden': 'true', text: '↦' }),
      el('input', { type: 'date', class: 'ag-move-in', value: x.day, 'aria-label': t('ag_move', { what: lab(x) }), onchange: (e) => { if (e.target.value) void tdAgMove(x, e.target.value); } })),
      x.from ? el('button', { type: 'button', class: 'btn tiny quiet ag-unmove', text: t('ag_unmove'), onclick: () => { void tdAgMove(x, x.from); } }) : null));
  const column = (d, rows, isLate) => { const left = Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 864e5);
    return el('div', { class: `ag-day${isLate ? ' late' : left === 0 ? ' today' : ''}${rows.length ? '' : ' empty'}`, ...(isLate ? {} : { 'data-day': d, 'aria-label': t('ag_drop', { d: agDayName(d) }),
        ondragover: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('drop'); },
        ondragleave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.classList.remove('drop'); },
        ondrop: (e) => { e.preventDefault(); e.currentTarget.classList.remove('drop'); let m = null; try { m = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { m = null; } if (m && m.id && m.key) void tdAgMove(m, d); } }) },
      el('h3', { text: isLate ? t('ag_late') : left === 0 ? t('ag_today') : left === 1 ? t('ag_tomorrow') : agDayName(d) }),
      !isLate && left <= 1 ? el('small', { class: 'hint', text: agDayName(d) }) : null,
      rows.length ? rows.map(card) : el('small', { class: 'hint ag-none', text: t('ag_none_day') })); };
  return el('section', { class: 'td-agenda', 'aria-label': t('ag_h') },
    el('div', { class: 'ag-head' }, el('h2', { text: t('ag_h') }), el('span', { class: 'ag-count', text: String(cards.length) }), range, el('span', { class: 'ag-tools' }, bell, ics)),
    cards.length ? el('div', { class: 'ag-days', tabindex: '0', role: 'group', 'aria-label': t('ag_h'),
      // dragging near either edge scrolls the strip, so a day out of view can be reached
      ondragover: (e) => { const r = e.currentTarget.getBoundingClientRect(), edge = 70; if (e.clientX < r.left + edge) e.currentTarget.scrollBy({ left: -24 }); else if (e.clientX > r.right - edge) e.currentTarget.scrollBy({ left: 24 }); } }, late.length ? column('', late, true) : null, dayList.map((d) => column(d, cards.filter((x) => x.left >= 0 && x.day === d), false)))
      : el('p', { class: 'hint', text: t('ag_empty', { n: agDays }) }));
}
// v9.78 (ADR-0148): a reminder moved to another day — dragged onto it, or picked on its card. The platform's date is not touched.
async function tdAgMove(x, to) {
  const item = tenders && tenders.items.find((r) => r.id === x.id); if (!item || tdBusy) return;
  const from = x.from || x.day, moves = tenderAgendaMove(item, x.key, from, to);
  if (await tdUpdate(x.id, { agendaMoves: moves })) { renderTenders(); toast(t('ag_moved_toast', { what: t(`td_col_${x.key}`), when: agDayName(to) })); }
}
function tdNextDate(i, today) { return [['askDue', i.askDue], ['visit', i.visit], ['handover', ['received', 'screen', 'decide', 'prep'].includes(i.stage) && !tenderHandedAt(i) ? tenderHandoverDue(i).slice(0, 10) : ''], ['due', i.due], ['openAt', i.openAt]].filter(([, v]) => v && v >= today).sort((x, y) => (x[1] < y[1] ? -1 : 1))[0] || null; }
/** The period's own numbers: how many we joined, won, how long a decision took, how many were in on time. */
function tdKpis(rows, today) {
  const decided = rows.filter((i) => i.decidedOn), joined = rows.filter((i) => !['declined', 'cancelled'].includes(i.stage) && i.stage !== 'received' && i.stage !== 'screen' && i.stage !== 'decide');
  const submitted = rows.filter((i) => ['submitted', 'won', 'lost'].includes(i.stage)), closed = rows.filter((i) => ['won', 'lost'].includes(i.stage)), won = rows.filter((i) => i.stage === 'won');
  const dd = decided.map((i) => tdDaysBetween(i.date, i.decidedOn)).filter((n) => n >= 0), onTime = submitted.filter((i) => i.submittedOn && i.due && tdDaysBetween(i.submittedOn, i.due) >= 1);
  const waiting = rows.filter((i) => ['received', 'screen', 'decide'].includes(i.stage)), waitDays = waiting.map((i) => tdDaysBetween(i.date, today));
  return { n: rows.length, waiting: waiting.length, waitMax: waitDays.length ? Math.max(...waitDays) : 0, joined: joined.length, declined: rows.filter((i) => i.stage === 'declined').length,
    submitted: submitted.length, won: won.length, closed: closed.length, winRate: closed.length ? Math.round((won.length / closed.length) * 100) : null,
    avgDecision: dd.length ? Math.round((dd.reduce((s, x) => s + x, 0) / dd.length) * 10) / 10 : null, onTime: submitted.length ? Math.round((onTime.length / submitted.length) * 100) : null,
    value: rows.filter((i) => TD_OPEN.includes(i.stage)).reduce((s, i) => s + (i.value || 0), 0), soon: rows.filter((i) => TD_OPEN.includes(i.stage) && tdNextDate(i, today) && tdDaysBetween(today, tdNextDate(i, today)[1]) <= 7).length,
    late: rows.filter((i) => TD_OPEN.includes(i.stage) && i.due && i.due < today && !i.submittedOn).length };
}
/** The week's tender message for management: what arrived, what we decided, submitted, won and lost, what waits, and next week's dates. */
function tdWeekMessage() {
  const today = saudiDay(new Date().toISOString()), wk = { from: saudiDay(new Date(Date.now() - 6 * 864e5).toISOString()), to: today }, inWk = (d) => d && d >= wk.from && d <= wk.to, I = tenders ? tenders.items : [];   // the last 7 days, whatever the weekday
  const arrived = I.filter((i) => inWk(i.date)), decided = I.filter((i) => inWk(i.decidedOn)), joined = decided.filter((i) => i.stage !== 'declined'), declined = I.filter((i) => i.stage === 'declined' && inWk(i.stageAt));
  const submitted = I.filter((i) => inWk(i.submittedOn)), won = I.filter((i) => i.stage === 'won' && inWk(i.stageAt)), lost = I.filter((i) => i.stage === 'lost' && inWk(i.stageAt));
  const K = tdKpis(I, today), next = weekRange(0, saudiDay(new Date(Date.now() + 7 * 864e5).toISOString()));
  const coming = I.filter((i) => TD_OPEN.includes(i.stage)).flatMap((i) => [['askDue', i.askDue], ['visit', i.visit], ['due', i.due], ['openAt', i.openAt]].filter(([, v]) => v && v > today && v <= next.to).map(([k, v]) => ({ i, k, v }))).sort((x, y) => (x.v < y.v ? -1 : 1));
  const L = [t('td_wm_h', { a: wk.from, b: wk.to }), t('td_wm_flow', { a: arrived.length, d: decided.length, j: joined.length, x: declined.length, s: submitted.length, w: won.length, l: lost.length })];
  if (lost.length) L.push(t('td_wm_lost', { s: lost.map((i) => `${i.subject.slice(0, 50)}: ${i.reason || '—'}`).join(' · ') }));
  L.push(t('td_wm_wait', { n: K.waiting, d: K.waitMax, late: K.late })); if (coming.length) L.push(t('td_wm_next', { s: coming.slice(0, 8).map((c) => `${c.v} ${t(`td_col_${c.k}`)} — ${c.i.subject.slice(0, 50)}`).join(' · ') }));
  L.push(t('td_wm_rate', { r: K.winRate == null ? '—' : `${K.winRate}%`, n: K.closed, v: K.value ? K.value.toLocaleString('en') : '0' }), `— ${t('nav_tenders')} · ${t('portal')} v${PORTAL_VERSION}`);
  return L.join('\n');
}
/** An .ics file with the tender's dates — opens straight in Outlook, each date an all-day event with a reminder the day before. */
function tdIcs(i) {
  const ev = [['askDue', i.askDue], ['visit', i.visit], ['due', i.due], ['openAt', i.openAt]].filter(([, v]) => v);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AFAQY Jeddah portal//tenders//AR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const [k, v] of ev) { const d = v.replace(/-/g, ''), next = new Date(`${v}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
    lines.push('BEGIN:VEVENT', `UID:${i.id.replace(/[^a-z0-9]/gi, '').slice(0, 40)}-${k}@afaqy-jeddah-portal`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, '')}`,
      `SUMMARY:${esc(`${t(`td_col_${k}`)} — ${i.subject}`)}`, `DESCRIPTION:${esc(`${t('nav_tenders')}${i.etimadNo ? ` · ${t('td_col_etimadNo')} ${i.etimadNo}` : ''}`)}`, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${esc(i.subject)}`, 'END:VALARM', 'END:VEVENT'); }
  lines.push('END:VCALENDAR'); return lines.join('\r\n');
}
const tdNorm = (s) => String(s || '').replace(/[\u0640\u064B-\u0652]/g, '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim().toLowerCase();
const tdIsReply = (s) => /^\s*((re|fw|fwd|aw|wg)\s*:|رد\s*:|إعادة توجيه\s*:|اعادة توجيه\s*:|تحويل\s*:)/i.test(String(s || ''));
const tdKey = (s) => tdNorm(String(s || '').replace(/^\s*(((re|fw|fwd|aw|wg)\s*:|رد\s*:|إعادة توجيه\s*:|اعادة توجيه\s*:|تحويل\s*:)\s*)+/i, ''));   // the same tender, whatever its reply/forward prefix
/** a.ibrahim as the SMTP address, or as the internal Exchange address a company PST keeps (…/cn=…-a.ibrahim). */
const tdIsAI = (addr) => { const e = String(addr || '').trim().toLowerCase(); return e === TD_FROM || /\/cn=(?:[^/]*-)?a\.ibrahim$/.test(e); };
const tdHasKraasa = (names) => (names || []).some((n) => { const x = tdNorm(String(n || '').replace(/[_\-.]+/g, ' ')); return x.includes('كراسه الشروط') || x.includes('كراسه شروط') || (x.includes('كراسه') && x.includes('الشروط')); });   // ADR-0100
const tdDay = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso || '')) ? saudiDay(String(iso).length > 10 ? String(iso) : `${iso}T12:00:00+03:00`) : null);
/** Check what Claude brought against the rules here too: originals only, from a.ibrahim or carrying the booklet. */
function tdImport(j) {
  if (!j || j.schema !== 'afaqy-tenders-from-mail/v1' || !Array.isArray(j.tenders)) return { err: 'td_bad' };
  const cur = tenders || { items: [] }, byKey = new Map(cur.items.map((x) => [x.id, { ...x }])); let added = 0, merged = 0, replies = 0, other = 0;
  for (const m of j.tenders) {
    const subject = String((m && m.subject) || '').trim().slice(0, 300), date = tdDay(m && m.received), from = String((m && m.from_address) || '').trim().toLowerCase().slice(0, 120);
    const att = (Array.isArray(m && m.attachments) ? m.attachments : []).map((x) => String(x).slice(0, 200)).slice(0, 20);
    if (!subject || !date) { other++; continue; }
    const byFrom = tdIsAI(from), byKr = tdHasKraasa(att);
    if (tdIsReply(subject) && !byKr) { replies++; continue; }   // ADR-0100: a reply or forward counts only when it carries the booklet
    if (!m.manual && !byFrom && !byKr) { other++; continue; }
    const id = tdKey(subject), was = byKey.get(id);
    if (was) { if (date < was.date) { was.date = date; was.from = from; } was.byFrom = was.byFrom || byFrom; was.byKr = was.byKr || byKr; was.att = [...new Set([...(was.att || []), ...att.filter((n) => tdHasKraasa([n]))])]; merged++; continue; }
    const it = { id, subject, date, from: byFrom ? TD_FROM : from, byFrom, byKr, att: att.filter((n) => tdHasKraasa([n])), status: 'open', stage: 'received', stageAt: date, readyOn: '', due: '', visit: '', note: '', ...(m.manual ? { manual: true } : {}) };
    byKey.set(id, it); added++;
  }
  const items = [...byKey.values()].sort((x, y) => (x.date < y.date ? 1 : -1));
  const to = [cur.to, /^\d{4}-\d{2}-\d{2}$/.test(String(j.to || '')) ? j.to : null].filter(Boolean).sort().pop() || null;
  return { state: { ...cur, items, to, pulledAt: new Date().toISOString() }, added, merged, replies, other };
}
/** ADR-0088: the result from any assistant — a file, or text pasted from its chat (code fences and words around it are fine). */
function tdParse(text) {
  const s = String(text || ''), fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i), body = fence ? fence[1] : s;
  const i = body.indexOf('{'), j = body.lastIndexOf('}'); if (i < 0 || j <= i) return null;
  try { return JSON.parse(body.slice(i, j + 1)); } catch { return null; }
}
async function tdTake(text) {
  const j = tdParse(text); if (!j) { toast(t('td_bad')); return false; }
  const r = tdImport(j); if (r.err) { toast(t(r.err)); return false; } if (tdBusy) return false;
  try { await tdCommit(r.state); } catch { toast(t('td_store_failed')); return false; }
  toast(t('td_loaded', { a: r.added, m: r.merged, r: r.replies, o: r.other })); renderTenders(); return true;
}
// ---------- v9.74 (ADR-0144): one frame for the tender register's windows ----------
// The title, its tools and «Close» on one row pinned at the top; the body under it; the window's own actions in a row pinned at
// its foot. The row is the window's «.dlg-bar», so the shared hook (every window gets a close bar) finds it and adds no second
// one, and ADR-0119's pages start under it. Widths: tw-sm for a short form, tw-md for a list, tw-lg for a working window.
// The pinned rows tell their window how tall they are (--tw-head-h, --tw-foot-h): its scroll padding keeps whatever is brought into
// view — a fold opened from a button, a field reached with Tab — from landing under them.
function twSized(node, prop) {
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { const d = node.closest('dialog'); if (d) d.style.setProperty(prop, `${Math.ceil(node.offsetHeight)}px`); }).observe(node);
  return node;
}
function twHead(title, { tools = null, cls = '' } = {}) {
  return twSized(el('div', { class: `dlg-bar tw-head${cls ? ` ${cls}` : ''}` }, el('div', { class: 'tw-titles' }, title), tools ? el('div', { class: 'tw-tools' }, tools) : null,
    el('button', { type: 'button', class: 'dlg-x', autofocus: '', 'aria-label': t('close'), text: `✕ ${t('close')}`, onclick: (e) => e.currentTarget.closest('dialog').close() })), '--tw-head-h');
}
const twFoot = (...kids) => twSized(el('div', { class: 'tw-foot' }, kids), '--tw-foot-h');
function tdPasteDialog() {
  const ta = el('textarea', { rows: 10, class: 'td-paste-ta', dir: 'ltr', placeholder: '{ "schema": "afaqy-tenders-from-mail/v1", … }' });
  const dlg = el('dialog', { class: 'proj-edit td-paste tw tw-sm', 'aria-labelledby': 'td-paste-h' }, twHead(el('h2', { id: 'td-paste-h', text: t('td_paste_h') })), el('p', { class: 'hint', text: t('td_paste_lead') }), ta,
    twFoot(el('button', { type: 'button', class: 'btn primary td-paste-go', text: t('td_paste_go'), onclick: async () => { if (await tdTake(ta.value)) dlg.close(); } })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal(); ta.focus();
}
function cleanTenders(x) {
  if (!x || !Array.isArray(x.items)) return null; const d = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? v : '');
  const items = x.items.filter((i) => i && i.id && i.subject && d(i.date)).slice(0, 5000).map((i) => ({ id: String(i.id).slice(0, 300), subject: String(i.subject).slice(0, 300), date: i.date,
    from: String(i.from || '').slice(0, 120), byFrom: !!i.byFrom, byKr: !!i.byKr, ...(i.manual ? { manual: true } : {}), att: (Array.isArray(i.att) ? i.att : []).map(String).slice(0, 20),
    status: i.status === 'ready' ? 'ready' : 'open', readyOn: d(i.readyOn), due: d(i.due), visit: d(i.visit), note: String(i.note || '').slice(0, 500),
    // ADR-0083: the lifecycle — older rows get their stage from the old status
    stage: TD_STAGES.includes(i.stage) ? i.stage : (i.status === 'ready' ? 'ready' : 'received'), stageAt: d(i.stageAt) || d(i.readyOn) || i.date,
    reason: String(i.reason || '').slice(0, 300), owner: String(i.owner || '').slice(0, 80), etimadNo: String(i.etimadNo || '').slice(0, 40),
    value: tenderAmount(i.value), fees: tenderAmount(i.fees), bond: String(i.bond || '').slice(0, 120),
    askDue: d(i.askDue), openAt: d(i.openAt), submittedOn: d(i.submittedOn), submitNo: String(i.submitNo || '').slice(0, 60), workStart: d(i.workStart), decidedOn: d(i.decidedOn), study: String(i.study || '').slice(0, 300),
    entity: String(i.entity || '').slice(0, 200), site: String(i.site || '').slice(0, 300), ...cleanTenderDetails(i) }));   // entity, site: v9.58
  return { items, to: d(x.to) || null, pulledAt: String(x.pulledAt || ''), revision: String(x.revision || ''),
    radarIgnore: (Array.isArray(x.radarIgnore) ? x.radarIgnore : []).map((r) => String(r).replace(/[^\d]/g, '')).filter(Boolean).slice(-3000) };   // v9.60: Etimad tenders the manager put aside
}
const tdPeriodOf = (date, kind) => (kind === 'year' ? date.slice(0, 4) : kind === 'quarter' ? `${date.slice(0, 4)}-Q${Math.floor((Number(date.slice(5, 7)) - 1) / 3) + 1}` : kind === 'month' ? date.slice(0, 7) : 'all');
const tdLabel = (k) => (k === 'all' ? t('td_all') : /^\d{4}$/.test(k) ? k : periodLabel(k));
const tdDefaultFrom = () => (tenders && tenders.to) || '2026-01-01';
function tdPrompt(from = tdFrom || tdDefaultFrom(), to = tdTo || saudiDay(new Date().toISOString()), known = tenders ? tenders.items.map((i) => i.subject) : []) {
  return `Open Outlook on the web (https://outlook.office.com) — I am signed in with my AFAQY account.
Goal: list TENDER mails received ON OR AFTER ${from} AND ON OR BEFORE ${to}. Read only — do not send, reply, move, flag, delete or change read status.

A mail is a TENDER if ANY is true:
  A. it has an attachment whose file name contains «كراسة الشروط» (also «كراسه الشروط», «كراسة_الشروط», «كراسة شروط», «كراسة الشروط والمواصفات») — FROM ANYONE, and EVEN IF it is a reply or a forward (RE:, FW:, Fwd:, رد:, إعادة توجيه:)
  B. it is an ORIGINAL message (not a reply or a forward) FROM ${TD_FROM}
For each conversation keep ONLY its first (earliest) matching message.

Search all folders (Archive included), scroll every result list to the end:
  from:${TD_FROM} received>=${from} received<=${to}
  attachmentnames:"كراسة الشروط" received>=${from} received<=${to}
  attachmentnames:"كراسه الشروط" received>=${from} received<=${to}
  attachmentnames:"كراسة شروط" received>=${from} received<=${to}
  attachmentnames:"كراسة_الشروط" received>=${from} received<=${to}

${known ? `ALREADY COLLECTED — skip any mail whose subject is one of these:
${known.map((k) => `- ${k}`).join('\n') || '- (none)'}
` : ''}
Keep ONLY: subject, sender address, received date-time, and the file names of the «كراسة الشروط» attachments — no body text, contacts, phone numbers or prices.

Save one JSON file named afaqy-tenders-from-mail-<today YYYY-MM-DD>.json. If you cannot save files, print exactly the same JSON in ONE code block and nothing else inside it:
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
    const from = tdFrom || '0000-01-01', to = tdTo || '9999-12-31', out = []; let read = 0, withAtt = 0;   // ADR-0097: from the disk, in the background
    const recs = await pstRead(f, { attFrom: from, attTo: to }, (p) => { tdBusy = t('td_pst_progress', { n: p.n.toLocaleString('en'), mb: p.mb, size: Math.round(p.size / 1048576) }); renderTenders(); });
    for (const m of recs) { read++; const d = m.clientSubmitTime || m.messageDeliveryTime, day = d ? saudiDay(d) : null;
      if (day && day >= from && day <= to) { const att = m.att || []; if (att.length) withAtt++;
        const addr = String(m.senderEmailAddress || '').trim();
        if (tdIsAI(addr) || tdHasKraasa(att)) out.push({ subject: String(m.subject || ''), from_address: addr, received: d, attachments: att }); } }
    const r = tdImport({ schema: 'afaqy-tenders-from-mail/v1', from, to: tdTo || saudiDay(new Date().toISOString()), tenders: out }); if (r.err) throw new Error(r.err);
    await tdCommit(r.state); tdBusy = '';
    toast(`${t('td_pst_read', { n: read, w: withAtt })} ${t('td_loaded', { a: r.added, m: r.merged, r: r.replies, o: r.other })}`);
  } catch (err) { console.error(err); tdBusy = ''; toast(err && err.name === 'NotReadableError' ? t('mf_locked_h') : t('td_pst_fail')); }
  renderTenders();
}
/** One tender by hand — a tender with no mail, or one the pull missed. */
function tdAddManual() {
  const today = saudiDay(new Date().toISOString());
  const files = el('input', { type: 'file', multiple: '' });
  const s = el('input', { type: 'text', class: 'td-m-subject', required: '', maxlength: 300, dir: 'auto' }), d = el('input', { type: 'date', class: 'td-m-date', value: today, max: today }),
    w = el('input', { type: 'text', class: 'td-m-from', maxlength: 120, dir: 'auto', placeholder: t('td_m_from_ph') });
  const dlg = el('dialog', { class: 'proj-edit td-add tw tw-sm', 'aria-labelledby': 'td-add-h' }, twHead(el('h2', { id: 'td-add-h', text: t('td_add_h') })),
    el('label', { class: 'fl-label' }, el('span', { text: t('td_col_subject') }), s), el('label', { class: 'fl-label' }, el('span', { text: t('td_col_date') }), d),
    el('label', { class: 'fl-label' }, el('span', { text: t('td_col_from') }), w),
    el('label', { class: 'fl-label' }, el('span', { text: t('td_file_add') }), files),
    twFoot(el('button', { type: 'button', class: 'btn primary td-m-save', text: t('td_add_save'), onclick: async () => {
      const subject = s.value.trim(), date = d.value; if (!subject || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast(t('td_add_need')); return; }
      if (tenders && tenders.items.some((i) => i.id === tdKey(subject))) { toast(t('td_add_exists')); return; }
      const r = tdImport({ schema: 'afaqy-tenders-from-mail/v1', to: (tenders && tenders.to) || null, tenders: [{ subject, from_address: w.value.trim(), received: `${date}T12:00:00+03:00`, attachments: [], manual: true }] });
      if (r.err || !r.added) { toast(t('td_add_need')); return; }
      const next = { ...r.state, to: tenders?.to || null };
      const added = next.items.find((item) => item.id === tdKey(subject));
      added.files = [...files.files].map((file) => tdNewFile(file, 'other'));
      if (added.files.length) added.activity = [tdActivity('add', added.files.map((file) => file.name).join(', '))];
      try { await tdCommit(next); } catch { toast(t('td_store_failed')); return; }
      tdOpenId = added.id; tdPick = tdPeriodOf(added.date, tdKind); tdStageF = tdCardF = null; tdQuery = '';
      dlg.close(); toast(t('td_add_done')); renderTenders(); await tdAnalyzeFiles(added.id,(added.files || []).map(file=>file.id)); } }),
      el('button', { type: 'button', class: 'btn quiet', text: t('close'), onclick: () => dlg.close() })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal(); s.focus();
}
async function tdExcel(rows, from = '') {
  const X = await loadXlsx(), today = saudiDay(new Date().toISOString());
  // v9.86 (ADR-0153): what the mails say beside each tender's stage — how many, the last one and who wrote it, and the hand-over
  const H = ['td_col_subject', 'td_col_entity', 'td_col_handover', 'td_tile_lead', 'td_col_date', 'td_col_from', 'td_col_why', 'td_col_stage', 'td_col_stageAt', 'td_x_mails', 'td_x_last', 'td_x_last_who', 'td_x_handed', 'td_x_handed_who', 'td_col_days', 'td_col_reason', 'td_col_owner', 'td_col_etimadNo', 'td_col_value', 'td_col_fees', 'td_col_bond', 'td_col_askDue', 'td_col_visit', 'td_col_due', 'td_col_openAt', 'td_col_submittedOn', 'td_col_submitNo', 'td_col_decidedOn', 'td_col_study', 'td_col_studyDecision', 'td_col_note'].map((k) => t(k));
  const why = (i) => [i.messages?.length ? t('td_why_email') : '', i.byFrom ? t('td_why_from') : '', i.byKr ? t('td_why_kr') : '', i.manual ? t('td_why_manual') : ''].filter(Boolean).join(' + ');
  const mf = (i) => { const f = tenderMailFacts(i); return [f.mails, f.last ? f.last.at.replace('T', ' ') : '', f.last ? f.last.who : '', f.handover ? f.handover.at.replace('T', ' ') : '', f.handover ? f.handover.who : '']; };
  const ws = X.utils.aoa_to_sheet([H, ...rows.map((i) => [i.subject, i.entity || '', tenderHandoverDue(i).replace('T', ' '), tenderLead(i).workDays ?? '', i.date, i.from, why(i), t(`td_st_${i.stage}`), i.stageAt, ...mf(i), tdDaysBetween(i.stageAt, today), i.reason, i.owner, i.etimadNo, i.value, i.fees, i.bond, i.askDue, i.visit, i.due, i.openAt, i.submittedOn, i.submitNo, i.decidedOn, i.study, i.studyDecision ? t(`td_dec_${i.studyDecision.replace("-", "")}`) : '', i.note])]);
  ws['!cols'] = [60, 26, 16, 10, 12, 26, 24, 18, 12, 8, 16, 26, 16, 26, 8, 30, 16, 16, 14, 12, 18, 14, 14, 14, 14, 14, 16, 14, 30, 14, 40].map((w) => ({ wch: w })); ws['!views'] = [{ RTL: lang !== 'en' }];
  const base = from ? rows : tenders.items, months = [...new Set(base.map((i) => i.date.slice(0, 7)))].sort();
  const sum = X.utils.aoa_to_sheet([[t('td_col_month'), t('td_k_in'), t('td_k_joined'), t('td_st_declined'), t('td_k_submitted'), t('td_st_won'), t('td_st_lost'), t('td_k_winrate'), t('td_k_decision'), t('td_k_ontime')],
    ...months.map((m) => { const k = tdKpis(base.filter((i) => i.date.startsWith(m)), today); return [m, k.n, k.joined, k.declined, k.submitted, k.won, k.closed - k.won, k.winRate == null ? '' : `${k.winRate}%`, k.avgDecision == null ? '' : k.avgDecision, k.onTime == null ? '' : `${k.onTime}%`]; })]);
  sum['!views'] = [{ RTL: lang !== 'en' }]; const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, t('td_sheet')); X.utils.book_append_sheet(wb, sum, t('td_sheet_sum'));
  X.writeFile(wb, from ? `AFAQY-tenders-from-${from}-${today}.xlsx` : `AFAQY-tenders-${today}.xlsx`);
}
/** v9.86 (ADR-0153): the whole register from a day the manager picks — every kind and stage, oldest first. */
function tdExcelFrom() {
  const today = saudiDay(new Date().toISOString()), oldest = (tenders?.items || []).map((i) => i.date).filter(Boolean).sort()[0] || today;
  const d = el('input', { type: 'date', class: 'td-xf-date', value: oldest, max: today }), n = el('p', { class: 'hint td-xf-n', 'aria-live': 'polite' });
  const count = () => { n.textContent = t('td_xf_n', { n: tendersFrom(tenders?.items, d.value).length }); }; d.addEventListener('input', count); count();
  const dlg = el('dialog', { class: 'proj-edit td-xf tw tw-sm', 'aria-labelledby': 'td-xf-h' }, twHead(el('h2', { id: 'td-xf-h', text: t('td_xf_h') })),
    el('p', { class: 'hint', text: t('td_xf_lead') }), el('label', { class: 'fl-label' }, el('span', { text: t('td_xf_from') }), d), n,
    twFoot(el('button', { type: 'button', class: 'btn primary td-xf-go', text: `⬇ ${t('td_excel')}`, onclick: async () => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d.value)) { d.focus(); return; } const rows = tendersFrom(tenders?.items, d.value);
      if (!rows.length) { toast(t('td_xf_none')); return; } await tdExcel(rows, d.value); dlg.close(); } })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal(); d.focus();
}
// v9.87 (ADR-0154): the register tidied by the manager's own hand — what is not a tender is taken out, what is one tender twice is made one
function tdCleanup() {
  const c = tenderCleanup(tenders?.items, tdIsAI), by = new Map((tenders?.items || []).map((i) => [i.id, i]));
  const row = (cls, value, i, note) => el('label', { class: 'td-cl-row' }, el('input', { type: 'checkbox', class: cls, value, checked: '' }),
    el('span', { class: 'td-cl-t' }, el('b', { text: i.subject }), el('small', { text: note })));
  const facts = (i) => [tdWallText(i.date), i.from || '', t('td_cl_mails', { n: (i.messages || []).length }), t(`td_st_${i.stage || 'received'}`)].filter(Boolean).join(' · ');
  const groups = c.duplicates.map((g) => g.map((id) => by.get(id)).sort((a, b) => String(a.date).localeCompare(String(b.date)) || (b.messages || []).length - (a.messages || []).length));
  const dlg = el('dialog', { class: 'proj-edit td-cl tw tw-md', 'aria-labelledby': 'td-cl-h' }, twHead(el('h2', { id: 'td-cl-h', text: t('td_cl_h') })),
    el('p', { class: 'hint', text: t('td_cl_lead') }),
    c.notTenders.length ? el('section', { class: 'td-cl-sec td-cl-not' }, el('h3', { text: t('td_cl_not_h', { n: c.notTenders.length }) }), el('p', { class: 'hint', text: t('td_cl_not_lead') }),
      c.notTenders.map((id) => row('td-cl-x', id, by.get(id), facts(by.get(id))))) : null,
    groups.length ? el('section', { class: 'td-cl-sec td-cl-dup' }, el('h3', { text: t('td_cl_dup_h', { n: groups.length }) }), el('p', { class: 'hint', text: t('td_cl_dup_lead') }),
      groups.map((g, k) => row('td-cl-m', String(k), g[0], g.slice(1).map((o) => `${t('td_cl_with')} «${o.subject}» — ${facts(o)}`).join(' ؛ ')))) : null,
    twFoot(el('button', { type: 'button', class: 'btn primary td-cl-go', text: t('td_cl_go'), onclick: async () => {
      const out = new Set([...dlg.querySelectorAll('.td-cl-x:checked')].map((b) => b.value)), join = [...dlg.querySelectorAll('.td-cl-m:checked')].map((b) => groups[Number(b.value)]);
      if (!out.size && !join.length) { dlg.close(); return; }
      if (!confirm(t('td_cl_confirm', { x: out.size, m: join.length }))) return;
      let items = tenders.items.filter((i) => !out.has(i.id));
      for (const g of join) { const one = g.slice(1).reduce((keep, o) => tenderMerge(keep, o), g[0]), gone = new Set(g.slice(1).map((o) => o.id)); items = items.filter((i) => !gone.has(i.id)).map((i) => (i.id === one.id ? one : i)); }
      try { await tdCommit({ ...tenders, items }); dlg.close(); renderTenders(); toast(t('td_cl_done', { x: out.size, m: join.length })); } catch { toast(t('td_store_failed')); } } })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
let tdMailParser, tdDocumentReader;
const tdLoadMail = () => (tdMailParser ||= import('./assets/vendor/tender-mail.min.js').catch((error) => { tdMailParser = null; throw error; }));
// v9.57 (ADR-0130): the conversation a mail carries — its own message and every message quoted beneath it
const tdThreadOf = (mail) => mailThread(mail.body, { at: mailWall(mail.sentAt), name: mail.senderName, addr: mail.sender });
const tdFileFilters = new Map();
const tdActivity = (action, label, extra = {}) => ({ id: crypto.randomUUID(), action, label, at: new Date().toISOString(), ...extra });   // extra (v9.86): a mail's own time and writer
const tdNewFile = (blob, kind, mailKey = '', id = crypto.randomUUID()) => ({ id, name: blob.name, kind, mailKey, blob });
const tdFileKind = { technical: 'proj_fk_technical', financial: 'proj_fk_financial' };   // other kinds: td_file_<kind>
function tdDateText(day, time) { return day + (time ? ' · ' + time : ''); }

async function tdCommit(next) {
  // ADR-0127: the manager's name goes on every open tender that has no owner, so «file owner» is never a field to fill
  const own = (pref('tdowner') || '').trim();
  if (own) next = { ...next, items: next.items.map((i) => (!i.owner && !TENDER_CLOSED.includes(i.stage) ? { ...i, owner: own.slice(0, 80) } : i)) };
  const saved = { ...next, revision: crypto.randomUUID() };
  await store.putTenders(saved, next.revision || '');
  tenders = saved;
}
// ADR-0126: the Tender Analyzer's study files. From the toolbar each study finds its row by Etimad number, then subject; from a
// tender's window the study is applied to that tender. Only empty fields are filled; differences are listed, never overwritten.
const tdToday = () => saudiDay(new Date().toISOString());
// ADR-0127: a file moved the tender by itself — say so in its history and remember how to put it back
async function tdAutoMove(id, event, res) {
  const row = tenders?.items.find((i) => i.id === id); if (!row) return;
  const mv = tenderAutoStage(row, event, tdToday()); if (!mv) return;
  if (await tdUpdate(id, mv.patch, tdActivity('stage', t('td_auto_stage', { s: t(`td_st_${mv.patch.stage}`) })))) res.moves.push({ id, subject: row.subject, to: mv.patch.stage, back: mv.back });
}
async function tdReadStudyFile(f) {
  if (/\.(xlsx|xlsm)$/i.test(f.name)) {
    const X = await loadXlsx(), wb = X.read(await f.arrayBuffer(), { type: 'array', cellDates: true }), name = wb.SheetNames.find((n) => n.trim().toLowerCase() === 'tender-register');
    if (!name) return { error: 'nosheet' };
    const raw = tenderStudyFromSheet(X.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' }), f.name);
    return raw ? { ...parseTenderStudy(raw), keep: true } : { error: 'schema' };
  }
  return parseTenderStudy(await f.text());
}
const bidi = (x) => `\u2068${x}\u2069`;   // a name in another script, kept as one piece inside the sentence around it
const tdNewResult = () => ({ tenders: 0, fields: 0, differs: [], unmatched: [], bad: [], nosheet: [], skipped: [], fixed: [], moves: [] });
// v9.55: one test for «is this the analyzer's study?», used by the drop, the toolbar and a tender's own «add file»
async function tdIsStudyFile(f) {
  if (/\.json$/i.test(f.name)) return true;
  if (!/\.(xlsx|xlsm)$/i.test(f.name)) return false;
  try { const X = await loadXlsx(); return X.read(await f.arrayBuffer(), { type: 'array', bookSheets: true }).SheetNames.some((n) => n.trim().toLowerCase() === 'tender-register'); } catch { return false; }
}
async function tdImportStudies(files, onlyId = null) {
  const res = tdNewResult();
  for (const f of files) {
    let st; try { st = await tdReadStudyFile(f); } catch { st = { error: 'json' }; }
    if (st.error) { (st.error === 'nosheet' ? res.nosheet : res.bad).push(f.name); continue; }
    for (const study of st.tenders) {
      const items = tenders ? tenders.items : [];
      const row = onlyId ? (st.tenders.length === 1 ? items.find((i) => i.id === onlyId) : (matchTenderStudy(items, study, tdKey)?.id === onlyId ? items.find((i) => i.id === onlyId) : null)) : matchTenderStudy(items, study, tdKey);
      if (!row) { if (!onlyId) res.unmatched.push(study.subject || study.etimadNo); continue; }
      const { patch, filled, differs } = applyTenderStudy(row, study);
      if (study.skipped && study.skipped.length) res.skipped.push({ subject: row.subject, fields: study.skipped });
      for (const fx of study.fixed || []) res.fixed.push({ subject: row.subject, ...fx });   // v9.55: the incomplete is declared
      if (st.keep && !(row.files || []).some((x) => x.name === f.name && x.kind === 'study')) patch.files = [...(row.files || []), { ...tdNewFile(f, 'study'), kindManual: true }];   // the study workbook stays with its tender
      if (Object.keys(patch).length && await tdUpdate(row.id, patch, tdActivity('study', t('td_study_act', { n: filled.length, tool: st.tool || t('td_analyzer') })))) { res.tenders++; res.fields += filled.length; }
      for (const d of differs) res.differs.push({ subject: row.subject, ...d });
      if (study.decision) await tdAutoMove(row.id, { type: 'study', decision: study.decision, why: study.why }, res);
    }
  }
  tdStudyResult = res; renderTenders();
  toast(t('td_study_done', { n: res.fields, m: res.tenders, d: res.differs.length, u: res.unmatched.length }));
}
// ---------- v9.60 (ADR-0132): Etimad radar — the pull tool's file in the register ----------
// The pull tool (the manager's own program) reads Etimad and writes an Excel workbook or a small `afaqy-etimad-radar/v1` file. The
// register keeps only what concerns AFAQY (scope, followed tenders, our own bids), on this device. Etimad then sets the platform's
// dates and fee on the tenders it knows; a tender found there can be followed with one press, or put aside.
let etRadar = null, etResult = null, etTm = 0;
const etF = { scope: true, west: false, status: 'active', q: '', hidden: false };
const etRefs = () => (tenders ? tenders.items : []).map((i) => String(i.etimadNo || '').replace(/[^\d]/g, '')).filter(Boolean);
const etIgnored = () => new Set((tenders && tenders.radarIgnore) || []);
// a tender the pull saw open is open only until its deadline: the real pull listed tenders whose submission had closed hours earlier
const etOpenNow = (x, now = tdNowWall()) => x.status === 'active' && (!x.due || tdAt(x.due, x.dueTime || '23:59') >= now.slice(0, 16));
async function etIsFile(f) {
  if (/\.json$/i.test(f.name)) { try { return (await f.slice(0, 4000).text()).includes(RADAR_SCHEMA); } catch { return false; } }
  if (!/\.(xlsx|xlsm)$/i.test(f.name)) return false;
  try { const X = await loadXlsx(); return X.read(await f.arrayBuffer(), { type: 'array', bookSheets: true }).SheetNames.some((n) => ['جميع المنافسات', 'المنافسات النشطة'].includes(n.trim())); } catch { return false; }
}
async function etReadFile(f) {
  if (/\.json$/i.test(f.name)) return parseRadar(await f.text(), etRefs());
  const X = await loadXlsx(), wb = X.read(await f.arrayBuffer(), { type: 'array', dense: true, sheets: ['جميع المنافسات', 'المنافسات النشطة', 'تفاصيل الترسيات', 'العروض المنشورة', 'سجل السحب'] });
  return radarFromSheets((n) => (wb.Sheets[n] ? X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }) : null), etRefs());
}
// v9.62 (ADR-0135): a pull writes nothing into the register. It is a market study made every three or six months; a tender's
// reference is its mail files and the analyzer's study. The import only says how many register tenders the pull knows.
async function etImport(files) {
  const res = { read: 0, kept: 0, total: 0, found: 0, bad: [], partial: false, pulledAt: '', added: 0, updated: 0, all: 0 };
  tdBusy = t('et_reading'); renderTenders();
  try {
    for (const f of files) {
      let r; try { r = await etReadFile(f); } catch { r = { error: 'json' }; }
      if (r.error) { res.bad.push(f.name); continue; }
      etRadar = radarMerge(etRadar, r); res.added += etRadar.merged.added; res.updated += etRadar.merged.updated; res.all = etRadar.tenders.length; res.read++; res.total += r.total; res.kept += r.tenders.length; res.partial = res.partial || r.partial; res.pulledAt = r.pulledAt;
    }
    if (res.read) { await store.kvPut('radar', etRadar); res.found = (tenders ? tenders.items : []).filter((i) => radarFind(i, etRadar.tenders, tdKey)).length; }
  } finally { tdBusy = ''; }
  etResult = res; renderTenders();
  toast(res.read ? t('et_merged', { a: res.added, u: res.updated, t: res.all }) : t('et_bad', { list: res.bad.join(' · ') }));
}
async function etSave(next) { try { await tdCommit(next); return true; } catch { toast(t('td_store_failed')); return false; } }
async function etFollow(ref) {
  const x = etRadar && etRadar.tenders.find((y) => y.ref === ref); if (!x) return;
  const cur = tenders || { items: [], to: null, pulledAt: '' }, have = cur.items.find((i) => radarFind(i, [x], tdKey) || i.id === tdKey(x.title));
  if (have) { tdOpenId = have.id; renderTenders(); return have.id; }
  const it = radarToItem(x, tdToday(), tdKey); it.activity = [tdActivity('etimad', t('et_followed'))];
  if (!await etSave({ ...cur, items: [it, ...cur.items] })) return;
  tdOpenId = it.id; tdPick = tdPeriodOf(it.date, tdKind); tdStageF = tdCardF = null; tdQuery = ''; renderTenders(); toast(t('et_followed_toast'));
  return it.id;
}
async function etLink(id, ref) {
  const i = tenders && tenders.items.find((y) => y.id === id), x = etRadar && etRadar.tenders.find((y) => y.ref === ref); if (!i || !x) return;
  const patch = etimadLinkPatch(i, x); if (!Object.keys(patch).length) return;   // v9.62: linking gives the number and the page, nothing else
  if (await tdUpdate(id, patch, tdActivity('etimad', t('et_linked', { r: x.ref })))) { renderTenders(); toast(t('et_linked', { r: x.ref })); }
}
async function etIgnore(ref, on) {
  const cur = tenders || { items: [], to: null, pulledAt: '' }, s = new Set(cur.radarIgnore || []); on ? s.add(ref) : s.delete(ref);
  if (await etSave({ ...cur, radarIgnore: [...s].slice(-3000) })) etDraw();
}
const etWhen = (d, tm) => (d ? tdWhen(tdAt(d, tm)) : '—');
// v9.62 (ADR-0134): a won tender opens in «My projects», where its execution is followed; the archive lists every closed tender
function tdToProjects(i) {
  pwFilters.q = projQuery = tdTitle(i.subject).slice(0, 80); dlgCloseAll();   // the follow-up view is where execution, the award and the milestones are kept
  location.hash = '#me'; setTimeout(() => { projView = 'followup'; projOpen(); }, 300);
}
function dlgCloseAll() { for (const d of [...document.querySelectorAll('dialog[open]')]) d.close(); }
function tdArchiveOpen() {
  const A = tenderArchive(tenders ? tenders.items : []);
  if (!A.length) { toast(t('td_arch_none')); return; }
  const is = (s) => (k) => A[k].stage === s, money = (v) => (v != null ? tdMoney(v) : '—');
  crModal({ title: t('td_arch_h', { n: A.length }), lead: t('td_arch_lead'), file: 'AFAQY-tenders-archive', wrap: true, frame: 'md',
    tiles: ['won', 'lost', 'missed', 'declined', 'cancelled'].map((s) => [t(`td_st_${s}`), A.filter((x) => x.stage === s).length, null, is(s)]),
    bar: (k) => [A[k].year, 1],
    head: [t('td_col_subject'), t('td_col_entity'), t('td_col_date'), t('td_arch_closed'), t('td_col_stage'), t('td_col_reason'), t('td_col_value'), t('td_col_etimadNo'), t('td_arch_files')],
    rows: A.map((x) => [x.subject, x.entity || '—', x.date, x.closedOn, t(`td_st_${x.stage}`), x.reason || '—', money(x.value), x.etimadNo || '—', x.files]) });
}
// v9.61 (ADR-0133): the market around a tender — its own bids once published, and awarded tenders that look like it
function tdMarketFold(i, x, res) {
  const M = radarSimilar(x ? x.title : i.subject, etRadar, { ref: x ? x.ref : '' }), money = (v) => (v != null ? tdMoney(v) : '—');
  const bids = res && res.offers.length ? el('div', { class: 'table-wrap crm-list crm-wrap', tabindex: '0', role: 'group', 'aria-label': t('et_bids_h') }, el('table', { class: 'et-bids' },
    el('thead', {}, el('tr', {}, [t('et_c_rank'), t('et_c_bidder'), t('et_c_price'), t('et_c_tech')].map((h) => el('th', { text: h })))),
    el('tbody', {}, res.offers.map((o, k) => el('tr', { class: o.us ? 'et-us' : '' }, el('td', { class: 'num', text: o.price != null && k < res.usOf ? String(k + 1) : '—' }), el('td', { dir: 'auto', text: o.bidder }),
      el('td', { class: 'num', text: money(o.price) }), el('td', { text: o.tech ? t(`et_tech_${o.tech}`) : '—' })))))) : null;
  const sim = M.n ? el('div', { class: 'table-wrap crm-list crm-wrap', tabindex: '0', role: 'group', 'aria-label': t('et_sim_h', { n: M.n }) }, el('table', { class: 'et-sim' },
    el('thead', {}, el('tr', {}, [t('td_col_subject'), t('et_c_winner'), t('et_c_value'), t('et_c_bidders'), t('et_c_range')].map((h) => el('th', { text: h })))),
    el('tbody', {}, M.rows.map((r) => el('tr', { class: r.us ? 'et-us' : '' }, el('td', {}, el('div', { dir: 'auto', text: r.title }), el('small', { class: 'hint', dir: 'auto', text: `${r.entity} · ${r.published || ''}` })),
      el('td', { dir: 'auto', text: r.winner }), el('td', { class: 'num', text: money(r.value) }), el('td', { class: 'num', text: String(r.bidders || '—') }),
      el('td', { class: 'num', text: r.low != null ? `${money(r.low)} – ${money(r.high)}` : '—' })))))) : null;
  return tdFold('market', t('et_fold_market', { n: M.n + (res ? res.n : 0) }),
    res && res.n ? el('h4', { text: t('et_bids_h') }) : null, bids || (x ? el('p', { class: 'hint', text: t('et_bids_none') }) : el('p', { class: 'hint', text: t('et_market_unlinked') })),
    el('h4', { text: t('et_sim_h', { n: M.n }) }),
    M.n ? el('p', { class: 'et-sim-sum', text: t('et_sim_sum', { v: money(M.medianValue), b: M.medianBidders != null ? M.medianBidders : '—', w: M.wins.map((w) => `${bidi(w.name)} (${w.n})`).join(lang === 'en' ? ', ' : '، ') || '—' }) }) : el('p', { class: 'hint', text: t('et_sim_none') }), sim);
}
let etDraw = () => {};
function etOpen() {
  const body = el('div', { class: 'et-body' }), up = el('input', { type: 'file', accept: '.json,.xlsx,.xlsm', multiple: '', hidden: '', onchange: async (e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) { await etImport(fs); etDraw(); } } });
  const dlg = el('dialog', { class: 'cr-modal et-modal tw tw-lg', 'aria-labelledby': 'et-h' },
    twHead(el('h2', { id: 'et-h', class: 'et-head', text: `📡 ${t('et_title')}` })),   // v9.74: the title and «Close» on one row
    el('p', { class: 'hint', text: t('et_lead') }), body, up);
  etDraw = () => {
    if (!dlg.isConnected) return;
    const R = etRadar, now = tdNowWall(), today = tdToday(), hid = etIgnored(), linked = new Map();
    for (const i of tenders ? tenders.items : []) { const x = R && radarFind(i, R.tenders, tdKey); if (x) linked.set(x.ref, i.id); }
    const upBtn = el('button', { type: 'button', class: 'btn primary et-up', disabled: !!tdBusy, text: `⤒ ${t(R ? 'et_up_more' : 'et_up')}`, onclick: () => up.click() });
    if (!R) { set(body, el('p', { class: 'note', text: t('et_empty') }), upBtn); return; }
    const pill = (on, text, f) => el('button', { type: 'button', class: `pill-btn${on ? ' on' : ''}`, 'aria-pressed': String(on), text, onclick: () => { f(); etDraw(); } });
    const base = R.tenders.filter((x) => (!etF.scope || x.scope || linked.has(x.ref)) && (!etF.west || x.west) && (etF.status === 'all' || (etF.status === 'active' ? etOpenNow(x, now) : x.status === etF.status)));
    const q = tdNorm(tenderDigits(etF.q)), list = base.filter((x) => (etF.hidden ? hid.has(x.ref) : !hid.has(x.ref)) && (!q || tdNorm(tenderDigits(`${x.title} ${x.entity} ${x.ref} ${x.no}`)).includes(q)))
      .sort((a, b) => (etF.status === 'active' ? `${a.due || '9'}${a.dueTime}`.localeCompare(`${b.due || '9'}${b.dueTime}`) : (b.published || '').localeCompare(a.published || '')));
    const act = R.tenders.filter((x) => etOpenNow(x, now) && (x.scope || linked.has(x.ref)) && !hid.has(x.ref)), soon = act.filter((x) => x.due && x.due >= today && tdDaysBetween(today, x.due) <= 7);
    const sugg = (tenders ? tenders.items : []).filter((i) => !TENDER_CLOSED.includes(i.stage) && !String(i.etimadNo || '').trim() && !radarFind(i, R.tenders, tdKey))
      .map((i) => [i, radarSuggest(i, R.tenders.filter((x) => x.status === 'active' && !linked.has(x.ref)), 1)[0]]).filter(([, x]) => x);
    const row = (x) => { const id = linked.get(x.ref), off = hid.has(x.ref);
      return el('tr', { class: `et-row${id ? ' et-in' : ''}`, 'data-ref': x.ref },
        el('td', {}, el('b', { dir: 'auto', text: x.title }), el('div', { class: 'hint', dir: 'auto', text: x.entity }),
          el('div', { class: 'td-chips' }, [x.type, x.west ? t('et_west') : '', id ? t('et_in_reg') : '', `${t('td_card_etimad')} ${x.ref}`].filter(Boolean).map((c) => el('span', { class: 'chip', dir: 'auto', text: c })))),
        el('td', { class: 'num' }, el('div', { text: etWhen(x.due, x.dueTime) }), x.status === 'active' && x.due ? tdBadge(tdCountdown(tdAt(x.due, x.dueTime), now)) : el('span', { class: 'hint', text: t(`et_st_${x.status}`) }),
          (() => { const a = x.status === 'awarded' && (R.awards || []).find((w) => w.ref === x.ref); return a ? el('div', { class: 'hint et-won-by', dir: 'auto', text: t('et_won_by', { w: a.winner, v: a.value != null ? tdMoney(a.value) : t('et_novalue') }) }) : null; })()),
        el('td', { class: 'num', text: x.fees != null ? tdMoney(x.fees) : '—' }),
        el('td', { class: 'et-acts' },
          id ? el('button', { type: 'button', class: 'btn tiny et-open', text: t('et_open'), onclick: () => { tdOpenId = id; dlg.close(); renderTenders(); } })
            : el('button', { type: 'button', class: 'btn tiny primary et-follow', disabled: !!tdBusy, text: `＋ ${t('et_follow')}`, onclick: async () => { if (await etFollow(x.ref)) dlg.close(); } }),
          id ? null : el('button', { type: 'button', class: 'btn tiny quiet et-hide', text: off ? t('et_unhide') : t('et_hide'), onclick: () => etIgnore(x.ref, !off) }),
          x.link ? el('a', { class: 'btn tiny quiet', href: x.link, target: '_blank', rel: 'noopener noreferrer', text: `${t('et_page')} ↗` }) : null)); };
    const shown = list.slice(0, 200);
    set(body,
      el('div', { class: 'row et-pull' }, el('span', { class: 'hint', text: t('et_pulled', { at: R.pulledAt ? tdWhen(R.pulledAt) : '—', k: R.tenders.length, n: (R.pulls || []).length }) }), upBtn,
        el('button', { type: 'button', class: 'btn et-market', text: `📊 ${t('mk_btn')}`, onclick: () => { dlg.close(); mkOpen(); } }),
        el('button', { type: 'button', class: 'btn et-refs', text: `📋 ${t('et_copy_refs')}`, title: t('et_copy_refs_hint'), onclick: () => { const refs = [...new Set((tenders ? tenders.items : []).filter((i) => !['declined', 'cancelled'].includes(i.stage)).map((i) => { const y = radarFind(i, R.tenders, tdKey); return y ? y.ref : String(i.etimadNo || '').replace(/[^\d]/g, ''); }).filter((r) => r.length >= 10))];
          if (!refs.length) { toast(t('et_copy_refs_none')); return; } copyText(refs.join('\n'), t('et_copy_refs_done', { n: refs.length })); } })),
      R.partial ? el('p', { class: 'note et-partial', text: t('et_partial') }) : null,
      el('div', { class: 'crm-tiles et-tiles' },
        el('div', { class: 'km-tile' }, el('b', { text: String(act.length) }), el('span', { text: t('et_k_open') })),
        el('div', { class: 'km-tile' }, el('b', { text: String(act.filter((x) => x.west).length) }), el('span', { text: t('et_k_west') })),
        el('div', { class: 'km-tile' }, el('b', { text: String(soon.length) }), el('span', { text: t('et_k_soon') })),
        el('div', { class: 'km-tile' }, el('b', { text: String(linked.size) }), el('span', { text: t('et_k_reg') }))),
      sugg.length ? el('section', { class: 'td-box et-sugg' }, el('h3', { text: t('et_sugg_h', { n: sugg.length }) }),
        sugg.slice(0, 10).map(([i, x]) => el('p', { class: 'et-sugg-row' }, el('span', { text: t('et_sugg_line', { s: bidi(i.subject.slice(0, 90)), e: bidi(x.title.slice(0, 90)), r: x.ref }) }), ' ',
          el('button', { type: 'button', class: 'btn tiny et-link', text: t('et_link'), onclick: async () => { await etLink(i.id, x.ref); etDraw(); } })))) : null,
      el('div', { class: 'row et-filters' },
        el('div', { class: 'pills' }, pill(etF.scope, t('et_f_scope'), () => { etF.scope = true; }), pill(!etF.scope, t('et_f_anyscope'), () => { etF.scope = false; })),
        el('div', { class: 'pills' }, pill(etF.west, t('et_f_west'), () => { etF.west = true; }), pill(!etF.west, t('et_f_ksa'), () => { etF.west = false; })),
        el('div', { class: 'pills' }, ['active', 'awarded', 'all'].map((s) => pill(etF.status === s, t(`et_f_${s}`), () => { etF.status = s; }))),
        el('input', { type: 'search', class: 'et-q', value: etF.q, placeholder: t('et_q'), 'aria-label': t('et_q'), oninput: (e) => { etF.q = e.target.value; clearTimeout(etTm); etTm = setTimeout(() => { etDraw(); const n = dlg.querySelector('.et-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); } }),
        pill(etF.hidden, t('et_f_hidden', { n: hid.size }), () => { etF.hidden = !etF.hidden; })),
      (() => { const ours = radarOurBids(R); if (!ours.length) return null;   // v9.61: AFAQY's own bids on Etimad, whatever branch made them
        return el('details', { class: 'et-ours' }, el('summary', { text: t('et_ours_h', { n: ours.length, w: ours.filter((o) => o.winner && o.winner.us).length, f: ours.filter((o) => o.us && o.us.tech === 'fail').length }) }),
          el('div', { class: 'table-wrap crm-list crm-wrap', tabindex: '0', role: 'group', 'aria-label': t('et_ours_aria') }, el('table', {}, el('thead', {}, el('tr', {}, [t('td_col_subject'), t('et_c_price'), t('et_c_tech'), t('et_c_rank'), t('et_c_winner')].map((h) => el('th', { text: h })))),
            el('tbody', {}, ours.map((o) => el('tr', {}, el('td', {}, el('div', { dir: 'auto', text: o.title }), el('small', { class: 'hint', dir: 'auto', text: `${o.entity} · ${o.published || ''}` })),
              el('td', { class: 'num', text: o.us && o.us.price != null ? tdMoney(o.us.price) : '—' }), el('td', { text: o.us && o.us.tech ? t(`et_tech_${o.us.tech}`) : '—' }),
              el('td', { class: 'num', text: o.usRank ? `${o.usRank} / ${o.usOf}` : '—' }), el('td', { dir: 'auto', text: o.winner ? (o.winner.us ? t('et_us_won') : o.winner.name) : t('et_no_winner') }))))))); })(),
      list.length ? el('div', { class: 'table-wrap crm-list crm-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, [t('td_col_subject'), t('td_tile_due'), t('td_col_fees'), ''].map((h) => el('th', { text: h })))), el('tbody', {}, shown.map(row))))
        : el('p', { class: 'empty', text: t('et_none') }),
      list.length > shown.length ? el('p', { class: 'hint', text: t('crm_more', { n: list.length - shown.length }) }) : null);
  };
  dlg.addEventListener('close', () => { dlg.remove(); etDraw = () => {}; }); document.body.append(dlg); etDraw(); dlg.showModal();
}
// ---------- v9.63 (ADR-0136): «تحليل السوق» — the whole Etimad pull read for a period, a field of work and a status ----------
// v9.68 (ADR-0140): one screen, not pages. What chooses and counts stays in view and the list scrolls inside the window; a number
// or a name pressed opens its own window over this one, with its own numbers, its list and its Excel; every list has a search.
const MK_TABS = ['tenders', 'winners', 'entities', 'activities', 'lines', 'bidders', 'ours'];
const MK_SCOPES = ['all', 'afaqy', 'iiot', 'both'];   // v9.66 (ADR-0139): industrial IoT is a field of its own, alone or with ours
const MK_NAMED = ['winners', 'entities', 'activities', 'lines', 'bidders'];   // lists of names: a name pressed opens its tenders in their own window
const MK_KIND = { winners: 'winner', entities: 'entity', activities: 'activity', lines: 'line', bidders: 'bidder' };
const MK_SORTS = { tenders: ['new', 'value', 'bidders', 'due'], ours: ['new', 'value', 'bidders'], winners: ['wins', 'value'], entities: ['count', 'value', 'awarded'], activities: ['count', 'value'], lines: ['count', 'value'], bidders: ['bids', 'wins', 'rate'] };
const MK_STEP = 200;
const mkNew = (over = {}) => ({ period: 'all', from: '', to: '', scope: 'all', west: false, status: 'all', q: '', nq: '', who: null, only: '', tab: 'tenders', sort: {}, memo: null, ...over });
const mkF = mkNew();              // the main window's choice, kept while the page is open
let mkSeq = 0;
function mkPeriods(R) {   // the choices the pull can answer: the fixed spans, each year it holds and each quarter of those years
  const years = [...new Set(R.tenders.map((x) => (x.published || '').slice(0, 4)).filter((y) => /^\d{4}$/.test(y)))].sort().reverse();
  return [['all', t('mk_p_all')], ['q', t('mk_p_q')], ['h', t('mk_p_h')], ['ytd', t('mk_p_ytd')], ...years.map((y) => [y, t('mk_p_year', { y })]),
    ...years.flatMap((y) => [4, 3, 2, 1].map((q) => [`${y}-Q${q}`, t('mk_p_quarter', { q, y })])), ['custom', t('mk_p_custom')]];
}
function mkFilter(st) { const p = marketPeriod(st.period, tdToday(), st.from, st.to); return { ...p, scope: st.scope, west: st.west, status: st.status, q: st.q, who: st.who, only: st.only }; }
function mkStats(st) {
  const f = mkFilter(st), key = JSON.stringify(f);
  if (!st.memo || st.memo.radar !== etRadar || st.memo.key !== key) st.memo = { key, radar: etRadar, S: marketStats(etRadar, f) };
  return st.memo.S;
}
const mkNum = (v) => (v == null ? '—' : tdMoney(v));
const mkLine = (k) => (k ? t(`mk_line_${k}`) : '');
const mkName = (kind, name) => (kind === 'line' ? mkLine(name) : name);
const mkWhoText = (who) => t('mk_who', { k: t(`mk_who_k_${who.kind}`), n: mkName(who.kind, who.name) });
const mkStatus = (x) => t(`et_st_${x.status || 'other'}`);
const txFold = (s) => tenderDigits(s).normalize('NFKC').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ـً-ْ]/g, '').toLowerCase();
function mkSorted(S, st, tab) {
  const by = st.sort[tab] || MK_SORTS[tab][0], v = (n) => (n == null ? -1 : n);
  let L = tab === 'ours' ? S.tenders.filter((x) => x.us) : [...S[tab]];
  if (st.nq && MK_NAMED.includes(tab)) { const q = txFold(st.nq).trim(); if (q) L = L.filter((x) => txFold(mkName(MK_KIND[tab], x.name)).includes(q)); }   // a list of names is searched by name
  const cmp = { new: (a, b) => (b.published || '').localeCompare(a.published || ''), value: (a, b) => v(b.value) - v(a.value), bidders: (a, b) => b.bidders - a.bidders,
    due: (a, b) => `${a.due || '9'}${a.dueTime || ''}`.localeCompare(`${b.due || '9'}${b.dueTime || ''}`), wins: (a, b) => b.wins - a.wins || b.value - a.value,
    count: (a, b) => b.n - a.n || b.value - a.value, awarded: (a, b) => b.awarded - a.awarded || b.n - a.n, bids: (a, b) => b.bids - a.bids || b.wins - a.wins,
    rate: (a, b) => v(b.winRate) - v(a.winRate) || b.bids - a.bids }[by];
  return cmp ? L.sort(cmp) : L;
}
// one list's columns, the same for the page and the Excel: [header, value on the page, value in the file]
function mkCols(tab, inReg, onName = () => {}) {
  const who = (kind) => (x) => el('button', { type: 'button', class: 'linkish mk-who', dir: 'auto', text: mkName(kind, x.name), title: t('mk_press'), onclick: () => onName(kind, x.name) });
  const T = [[t('mk_c_title'), (x) => [el('b', { class: 'mk-ttl', dir: 'auto', text: x.title, title: x.title }), el('div', { class: 'hint mk-ent', dir: 'auto', text: [x.entity, x.activity].filter(Boolean).join(' · '), title: [x.entity, x.activity].filter(Boolean).join(' · ') }),
      el('div', { class: 'td-chips' }, [x.type, mkLine(x.line), x.west ? t('et_west') : '', inReg.has(x.ref) ? t('et_in_reg') : '', x.us ? t('mk_us') : '', `${t('td_card_etimad')} ${x.ref}`].filter(Boolean).map((c) => el('span', { class: 'chip', dir: 'auto', text: c })))], (x) => x.title],
    [t('mk_c_entity'), null, (x) => x.entity], [t('mk_c_activity'), null, (x) => x.activity], [t('mk_c_line'), null, (x) => mkLine(x.line)], [t('mk_c_type'), null, (x) => x.type],
    [t('mk_c_published'), (x) => x.published || '—', (x) => x.published], [t('mk_c_due'), (x) => (x.due ? etWhen(x.due, x.dueTime) : '—'), (x) => [x.due, x.dueTime].filter(Boolean).join(' ')],
    [t('mk_c_status'), mkStatus, mkStatus], [t('mk_c_winner'), (x) => x.winners.join(' · ') || '—', (x) => x.winners.join(' · ')],
    [t('mk_c_value'), (x) => mkNum(x.value), (x) => x.value], [t('mk_c_bidders'), (x) => String(x.bidders || '—'), (x) => x.bidders || null],
    [t('mk_c_low'), (x) => mkNum(x.low), (x) => x.low], [t('mk_c_high'), (x) => mkNum(x.high), (x) => x.high],
    [t('mk_c_ref'), null, (x) => x.ref], [t('mk_c_link'), (x) => (x.link ? el('a', { class: 'btn tiny quiet', href: x.link, target: '_blank', rel: 'noopener noreferrer', text: `${t('et_page')} ↗` }) : '—'), (x) => x.link]];
  const counted = (kind) => [[t('mk_c_name'), who(kind), (x) => mkName(kind, x.name)], [t('mk_c_n'), (x) => String(x.n), (x) => x.n], [t('mk_c_awarded'), (x) => String(x.awarded), (x) => x.awarded],
    [t('mk_c_value'), (x) => mkNum(x.value), (x) => x.value], [t('mk_c_valued'), (x) => String(x.valued), (x) => x.valued]];
  return {
    tenders: T, ours: T,
    winners: [[t('mk_c_name'), who('winner'), (x) => x.name], [t('mk_c_wins'), (x) => String(x.wins), (x) => x.wins], [t('mk_c_value'), (x) => mkNum(x.value), (x) => x.value],
      [t('mk_c_valued'), (x) => String(x.valued), (x) => x.valued], [t('mk_c_us'), (x) => (x.us ? '✓' : ''), (x) => (x.us ? t('mk_yes') : '')]],
    entities: [[t('mk_c_name'), who('entity'), (x) => x.name], [t('mk_c_n'), (x) => String(x.n), (x) => x.n], [t('mk_c_active'), (x) => String(x.active), (x) => x.active],
      [t('mk_c_awarded'), (x) => String(x.awarded), (x) => x.awarded], [t('mk_c_value'), (x) => mkNum(x.value), (x) => x.value], [t('mk_c_valued'), (x) => String(x.valued), (x) => x.valued]],
    activities: counted('activity'), lines: counted('line'),
    bidders: [[t('mk_c_name'), who('bidder'), (x) => x.name], [t('mk_c_bids'), (x) => String(x.bids), (x) => x.bids], [t('mk_c_wins'), (x) => String(x.wins), (x) => x.wins],
      [t('mk_c_rate'), (x) => (x.winRate == null ? '—' : `${x.winRate}%`), (x) => x.winRate], [t('mk_c_pass'), (x) => String(x.pass), (x) => x.pass], [t('mk_c_fail'), (x) => String(x.fail), (x) => x.fail],
      [t('mk_c_us'), (x) => (x.us ? '✓' : ''), (x) => (x.us ? t('mk_yes') : '')]],
  }[tab];
}
function mkFilterText(S, st) {
  const pick = mkPeriods(etRadar).find(([k]) => k === st.period), f = mkFilter(st);
  return [pick ? pick[1] : '', f.from || f.to ? `${f.from || '…'} → ${f.to || '…'}` : '', t(`mk_f_${st.scope}`), t(st.west ? 'mk_f_west' : 'mk_f_ksa'),
    t(`mk_f_st_${st.status}`), st.only ? t(`mk_only_${st.only}`) : '', st.q ? `«${st.q}»` : '', st.who ? mkWhoText(st.who) : '', t('mk_x_n', { n: S.total })].filter(Boolean).join(' · ');
}
async function mkExcel(st, all) {
  const S = mkStats(st), X = await loadXlsx(), wb = X.utils.book_new(), rtl = lang !== 'en', inReg = new Set();
  const sheet = (name, aoa, widths) => { const ws = X.utils.aoa_to_sheet(aoa); ws['!views'] = [{ RTL: rtl }]; ws['!cols'] = widths.map((w) => ({ wch: w })); X.utils.book_append_sheet(wb, ws, name.slice(0, 30)); };
  const list = (tab) => { const C = mkCols(tab, inReg); sheet(t(`mk_tab_${tab}`, { n: '' }).replace(/[()\s]+$/, ''), [C.map((c) => c[0]), ...mkSorted(S, st, tab).map((x) => C.map((c) => { const v = c[2](x); return v == null || v === '' ? null : v; }))], C.map((c, k) => (k ? 16 : 54))); };
  if (all) {
    sheet(t('mk_x_sum'), [[t('mk_x_filter'), mkFilterText(S, st)], [t('mk_k_total'), S.total], [t('mk_k_active'), S.active], [t('mk_k_awarded'), S.awarded], [t('mk_x_wknown'), S.winnerKnown],
      [t('mk_k_value'), S.value], [t('mk_x_vknown'), S.valueKnown], [t('mk_k_median'), S.medianValue], [t('mk_k_bidders'), S.medianBidders], [t('mk_k_entities'), S.entities.length],
      [t('mk_k_winners'), S.winners.length], [t('mk_k_us'), S.us], [t('mk_x_uswon'), S.usWon], [t('mk_x_pulled'), etRadar.pulledAt || '']], [34, 60]);
    for (const tab of MK_TABS) list(tab);
    sheet(t('mk_x_months'), [[t('mk_c_month'), t('mk_c_n'), t('mk_c_awarded'), t('mk_c_value'), t('mk_c_valued')], ...S.months.map((m) => [m.month, m.n, m.awarded, m.value, m.valued])], [12, 12, 12, 18, 14]);
  } else list(st.tab);
  X.writeFile(wb, `AFAQY-market-${all ? 'all' : st.tab}-${st.period}${st.who || st.q || st.nq || st.only ? '-filtered' : ''}-${tdToday()}.xlsx`);
}
// One market window. The main one has every choice; a window opened from a pressed number or name («drill») starts from the
// choice of the window under it, narrowed to what was pressed, and can itself be searched, sorted, narrowed by date and exported.
function mkWindow(st, title = '') {
  if (!etRadar || !etRadar.tenders.length) { toast(t('mk_empty')); return null; }
  const drill = !!title, id = `mk-h-${mkSeq += 1}`, body = el('div', { class: 'mk-body' });
  const dlg = el('dialog', { class: `cr-modal et-modal mk-modal tw${drill ? ' mk-drill' : ''}`, 'aria-labelledby': id, 'data-own-scroll': '' },
    twHead(el('h2', { id, dir: 'auto', text: drill ? title : `📊 ${t('mk_title')}` }), { cls: 'crm-head mk-head', tools: el('span', { class: 'row mk-xl' },
      el('button', { type: 'button', class: 'btn tiny mk-xl-one', text: `⬇ ${t('mk_xl_list')}`, onclick: () => mkExcel(st, false) }),
      el('button', { type: 'button', class: 'btn tiny primary mk-xl-all', text: `⬇ ${t('mk_xl_all')}`, onclick: () => mkExcel(st, true) })) }), body);
  let shownN = MK_STEP, tm = 0, folded = false;
  const inReg = new Set();
  for (const i of tenders ? tenders.items : []) { const x = radarFind(i, etRadar.tenders, tdKey); if (x) inReg.add(x.ref); }
  // what was pressed opens over this window, starting from this window's own choice
  const open = (over, name) => mkWindow(mkNew({ period: st.period, from: st.from, to: st.to, scope: st.scope, west: st.west, status: st.status, q: st.q, who: st.who, only: st.only, ...over }), name);
  const onName = (kind, name) => open({ who: { kind, name }, tab: 'tenders' }, mkWhoText({ kind, name }));
  const draw = (focus) => {
    if (!dlg.isConnected) return;
    const S = mkStats(st), f = mkFilter(st), tab = st.tab, named = MK_NAMED.includes(tab);
    const again = (sel) => { shownN = MK_STEP; draw(sel); };
    const pill = (on, text, fn, cls = '') => el('button', { type: 'button', class: `pill-btn${on ? ' on' : ''}${cls ? ` ${cls}` : ''}`, 'aria-pressed': String(on), text, onclick: () => { fn(); again(); } });
    // a number is a door: pressing it opens the tenders (or the names) it counts, in their own window
    const tile = (cls, v, l, s, over) => el('button', { type: 'button', class: `km-tile crm-tile-f mk-tile mk-k-${cls}`, title: [s, t('mk_tile_open')].filter(Boolean).join(' — '), onclick: () => open({ nq: '', ...over }, l) },
      el('b', { text: String(v) }), el('span', { text: l }));
    // the period and the two days say the same thing: a period chosen fills the days, a day changed makes it «a period I choose»
    const dateIn = (k) => el('label', { class: 'mk-date' }, el('span', { text: t(`mk_${k}`) }), el('input', { type: 'date', value: (st.period === 'custom' ? st[k] : f[k]) || '', class: `mk-${k}`,
      onchange: (e) => { if (st.period !== 'custom') { st.from = f.from || ''; st.to = f.to || ''; st.period = 'custom'; } st[k] = e.target.value; again(`.mk-${k}`); } }));
    const maxM = Math.max(1, ...S.months.map((m) => m.n));
    const C = mkCols(tab, inReg, onName), L = mkSorted(S, st, tab), cols = C.filter((c) => c[1]), count = (k) => (k === 'ours' ? S.us : k === 'tenders' ? S.total : S[k].length);
    const row = (x) => el('tr', { class: x.us || x.usWon ? 'et-us' : '' }, cols.map((c, ci) => el('td', { class: ci ? 'num' : '', dir: 'auto' }, c[1](x))));
    const tbody = el('tbody', {}, L.slice(0, shownN).map(row)), shownText = el('span', { class: 'hint mk-shown' }), moreBtn = el('button', { type: 'button', class: 'btn tiny mk-more' });
    const moreRow = el('p', { class: 'row mk-more-row' }, shownText, moreBtn);
    const tell = () => { const a = Math.min(shownN, L.length); moreRow.hidden = a >= L.length; shownText.textContent = t('mk_shown', { a, n: L.length }); moreBtn.textContent = t('mk_more', { n: Math.min(300, L.length - a) }); };
    const more = () => { if (shownN >= L.length) return; const from = shownN; shownN = Math.min(L.length, shownN + 300); tbody.append(...L.slice(from, shownN).map(row)); tell(); };   // rows are added under the ones in view: the place in the list is kept
    moreBtn.onclick = more; tell();
    const qVal = named ? st.nq : st.q, qText = t(named ? 'mk_nq' : 'mk_q');
    const search = el('input', { type: 'search', class: 'mk-q', value: qVal, placeholder: qText, 'aria-label': qText, oninput: (e) => { if (named) st.nq = e.target.value; else st.q = e.target.value; clearTimeout(tm); tm = setTimeout(() => again('.mk-q'), 250); } });
    const list = L.length ? el('div', { class: 'table-wrap crm-wrap mk-list', tabindex: '0', role: 'group', 'aria-label': t(`mk_tab_${tab}`, { n: L.length }),
        onscroll: (e) => { const n = e.currentTarget; if (n.scrollTop + n.clientHeight > n.scrollHeight - 260) more(); } },
        el('table', { class: `mk-t mk-t-${tab}` }, el('thead', {}, el('tr', {}, cols.map((c) => el('th', { text: c[0] })))), tbody), moreRow)
      : el('p', { class: 'empty mk-list', text: t(named && st.nq ? 'mk_nq_none' : 'mk_none') });
    set(body,
      el('div', { class: 'mk-top', hidden: folded ? '' : null },
        drill ? el('p', { class: 'hint mk-sub', dir: 'auto', text: mkFilterText(S, st) }) : el('details', { class: 'mk-about' }, el('summary', { text: t('mk_about') }), el('p', { class: 'hint', text: t('mk_lead') })),
        el('div', { class: 'row mk-filters' },
          el('label', { class: 'mk-period' }, el('span', { text: t('mk_p_label') }), el('select', { class: 'mk-p', 'aria-label': t('mk_p_label'), onchange: (e) => { st.period = e.target.value; if (st.period !== 'custom') { st.from = ''; st.to = ''; } again('.mk-p'); } },
            mkPeriods(etRadar).map(([k, l]) => el('option', { value: k, text: l, ...(k === st.period ? { selected: '' } : {}) })))),
          dateIn('from'), dateIn('to'),
          drill ? null : [el('div', { class: 'pills' }, MK_SCOPES.map((k) => pill(st.scope === k, t(`mk_f_${k}`), () => { st.scope = k; }, `mk-sc-${k}`))),
            el('div', { class: 'pills' }, pill(!st.west, t('mk_f_ksa'), () => { st.west = false; }), pill(st.west, t('mk_f_west'), () => { st.west = true; }, 'mk-west')),
            el('div', { class: 'pills' }, ['all', 'active', 'awarded'].map((k) => pill(st.status === k, t(`mk_f_st_${k}`), () => { st.status = k; }, `mk-st-${k}`)))]),
        el('p', { class: 'hint mk-span', text: S.total ? t('mk_span', { a: S.first || '—', b: S.last || '—', n: S.total }) : t('mk_none') }),
        el('div', { class: 'crm-tiles mk-tiles', role: 'group', 'aria-label': t('mk_tiles') },
          tile('total', S.total, t('mk_k_total'), '', { tab: 'tenders' }), tile('active', S.active, t('mk_k_active'), '', { status: 'active', tab: 'tenders' }),
          tile('awarded', S.awarded, t('mk_k_awarded'), '', { status: 'awarded', tab: 'tenders' }),
          tile('value', tdMoney(S.value), t('mk_k_value'), t('mk_k_value_s', { n: S.valueKnown }), { only: 'valued', tab: 'tenders', sort: { tenders: 'value' } }),
          tile('median', mkNum(S.medianValue), t('mk_k_median'), '', { only: 'valued', tab: 'tenders', sort: { tenders: 'value' } }),
          tile('bids', S.medianBidders == null ? '—' : S.medianBidders, t('mk_k_bidders'), '', { only: 'bids', tab: 'tenders', sort: { tenders: 'bidders' } }),
          tile('entities', S.entities.length, t('mk_k_entities'), '', { tab: 'entities' }), tile('winners', S.winners.length, t('mk_k_winners'), '', { tab: 'winners' }),
          tile('us', S.us, t('mk_k_us'), t('mk_k_us_s', { w: S.usWon }), { tab: 'ours' })),
        S.awarded ? el('p', { class: 'note mk-cover', text: t('mk_cover', { v: S.valueKnown, a: S.awarded, w: S.winnerKnown }) }) : null,
        S.months.length > 1 ? el('details', { class: 'mk-months' }, el('summary', { text: t('mk_months_h') }),
          el('div', { class: 'crm-bars', role: 'group', tabindex: '0', 'aria-label': t('mk_months_h') }, S.months.map((m, k) => el('div', { class: 'crm-bar', title: t('mk_month_tip', { n: m.n, a: m.awarded, v: tdMoney(m.value) }) },
            el('span', { class: 'crm-n', text: m.month }), el('span', { class: 'crm-track' }, el('i', { style: `--w:${(m.n / maxM) * 100}%;animation-delay:${Math.min(k, 20) * 30}ms` })), el('b', { text: String(m.n) }))))) : null),
      el('div', { class: 'mk-bar' },
        el('div', { class: 'pills mk-tabs', role: 'group', 'aria-label': t('mk_tabs') }, MK_TABS.map((k) => pill(tab === k, t(`mk_tab_${k}`, { n: count(k) }), () => { st.tab = k; }, `mk-tab mk-tab-${k}`))),
        el('div', { class: 'row mk-sortrow' }, search,
          el('label', { class: 'mk-sortl' }, el('span', { text: `${t('mk_sort')} ` }), el('select', { class: 'mk-sort', 'aria-label': t('mk_sort'), onchange: (e) => { st.sort[tab] = e.target.value; again('.mk-sort'); } },
            MK_SORTS[tab].map((k) => el('option', { value: k, text: t(`mk_s_${k}`), ...((st.sort[tab] || MK_SORTS[tab][0]) === k ? { selected: '' } : {}) })))),
          el('button', { type: 'button', class: 'btn tiny quiet mk-fold', 'aria-expanded': String(!folded), text: t(folded ? 'mk_fold_show' : 'mk_fold_hide'), onclick: () => { folded = !folded; draw('.mk-fold'); } }),
          named ? el('span', { class: 'hint mk-hint', text: t('mk_press') }) : null)),
      list);
    if (focus) { const n = dlg.querySelector(focus); if (n) { n.focus({ preventScroll: true }); if (n.type === 'search') n.setSelectionRange(n.value.length, n.value.length); } }
  };
  dlg.addEventListener('close', () => { clearTimeout(tm); dlg.remove(); }); document.body.append(dlg); draw(); dlg.showModal();
  return dlg;
}
function mkOpen() { return mkWindow(mkF); }
// ---------- v9.64 (ADR-0137): the Tender Analyzer inside the card ----------
// The card hands the tender's documents to the program on this computer (its own address only — nothing goes to the network), the
// free local model studies them there, and the study's files come back to the card by themselves. The page speaks our own
// protocol (`afaqy-analyzer-link/v1`); a reply that is not in it is not the program.
const anRun = new Map();          // tender id -> { phase, pct, msg, error, timer } while this page is following a study
const AN_T = { poll: 3000, wake: 2000, tries: 15 };   // how often the program is asked, and how long a closed program is given to open
async function anCall(path, init = {}) {   // the one door to the program: every request of the link goes through here
  const res = await fetch(ANALYZER.base + path, { cache: 'no-store', targetAddressSpace: 'loopback', ...init });   // Chrome asks the user once before a page reaches this computer
  return res;
}
async function anHello() { try { const r = await anCall('/v1/hello'); if (!r.ok) return null; const h = parseAnalyzerHello(await r.json()); return h.error ? null : h; } catch { return null; } }
async function anJob(job) { try { const r = await anCall(`/v1/jobs/${job}`); if (r.status === 404) return { missing: true }; if (!r.ok) return null; const j = parseAnalyzerJob(await r.json()); return j.job ? j : null; } catch { return null; } }   // a job's own «error» is its reason for failing, not a bad reply
const anSleep = (ms) => new Promise((r) => setTimeout(r, ms));
function anSet(id, patch) { const st = { ...(anRun.get(id) || {}), ...patch }; anRun.set(id, st); anDraw(id); return st; }
function anStop(id) { const st = anRun.get(id); if (st && st.timer) clearTimeout(st.timer); }
// the program is closed: the address Windows learned opens it, then it is asked again until it answers
async function anWake(id) {
  anSet(id, { phase: 'opening' });
  try { const a = el('a', { href: ANALYZER.open, hidden: '' }); document.body.append(a); a.click(); a.remove(); } catch { /* no handler: the wait below ends in «not found» */ }
  for (let k = 0; k < AN_T.tries; k++) { await anSleep(AN_T.wake); const h = await anHello(); if (h) return h; if (!anRun.has(id)) return null; }
  return null;
}
async function tdAnalyze(id) {
  const item = tenders?.items.find((r) => r.id === id); if (!item) return;
  const now = anRun.get(id); if (now && AN_BUSY.includes(now.phase)) return;
  const send = analyzerSend(item);
  if (!send.files.length) { anSet(id, { phase: 'nofiles', error: '' }); return; }
  anSet(id, { phase: 'connect', pct: 0, msg: '', error: '' });
  const hello = (await anHello()) || (await anWake(id));
  if (!hello) { anSet(id, { phase: 'missing' }); return; }
  anSet(id, { engine: hello.engine });   // «cloud»: the note under the button changes before anything is sent
  const job = analyzerJobId(id);
  if (hello.busy && hello.job !== job) { anSet(id, { phase: 'busy' }); return; }
  try {
    if (hello.job !== job) {
      anSet(id, { phase: 'sending', pct: 0 });
      let r = await anCall('/v1/jobs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: job, subject: tdTitle(item.subject).slice(0, 200) }) });
      if (!r.ok) throw new Error('job');
      for (const [k, f] of send.files.entries()) {
        const file = item.files.find((x) => x.id === f.id);
        r = await anCall(`/v1/jobs/${job}/files/${encodeURIComponent(f.name)}`, { method: 'PUT', body: file.blob });
        if (!r.ok) throw new Error('file');
        anSet(id, { pct: (k + 1) / send.files.length, msg: f.name });
      }
      r = await anCall(`/v1/jobs/${job}/start`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      if (r.status === 409) { anSet(id, { phase: 'busy' }); return; }
      if (!r.ok) throw new Error('start');
    }
    await tdUpdate(id, { analyzer: { job, state: 'running', at: tdNowWall().slice(0, 16), error: '', files: send.files.length } }, tdActivity('study', t('an_act_sent', { n: send.files.length })));
    anSet(id, { phase: 'running', pct: 0, msg: '' });
    anFollow(id);
  } catch { anSet(id, { phase: 'error' }); }
}
// follow a study the program is running: where it stands, every few seconds, until it ends
function anFollow(id) {
  anStop(id);
  const tick = async () => {
    const item = tenders?.items.find((r) => r.id === id), a = item && item.analyzer; if (!a || !anRun.has(id)) return;
    const j = await anJob(a.job);
    if (!j) { anSet(id, { phase: 'lost', timer: setTimeout(tick, AN_T.poll * 2) }); return; }   // the program was closed: keep asking, quietly
    if (j.missing) { await tdUpdate(id, { analyzer: { ...a, state: 'failed', error: 'gone' } }); anSet(id, { phase: 'failed', error: t('an_err_gone') }); return; }
    if (j.state === 'running' || j.state === 'waiting') { anSet(id, { phase: 'running', pct: j.progress, msg: j.message, timer: setTimeout(tick, AN_T.poll) }); return; }
    if (j.state === 'failed') { await tdUpdate(id, { analyzer: { ...a, state: 'failed', error: j.error === 'closed' ? 'closed' : j.error.slice(0, 300) } }); anSet(id, { phase: 'failed', error: j.error === 'closed' ? t('an_err_closed') : j.error }); renderTenders(); return; }
    await anTake(id, j);
  };
  anSet(id, { timer: setTimeout(tick, 400) });
}
// the study is done: its files come onto the card, and the register file fills the card's fields
async function anTake(id, j = null) {
  const item = tenders?.items.find((r) => r.id === id), a = item && item.analyzer; if (!a) return;
  j = j || await anJob(a.job);
  if (!j || j.missing || !j.outputs.length) { anSet(id, { phase: j && !j.missing ? 'failed' : 'lost', error: j && !j.missing ? t('an_err_nofiles') : '' }); return; }
  anSet(id, { phase: 'taking', pct: 0, msg: '' });
  try {
    const got = [];
    for (const [k, o] of j.outputs.entries()) {
      const r = await anCall(`/v1/jobs/${a.job}/outputs/${encodeURIComponent(o.name)}`);
      if (!r.ok) throw new Error('output');
      got.push(new File([await r.blob()], o.name));
      anSet(id, { pct: (k + 1) / j.outputs.length, msg: o.name });
    }
    const mark = `analyzer:${a.job}`, names = new Set(got.map((f) => f.name)), cur = tenders.items.find((r) => r.id === id);
    const files = [...(cur.files || []).filter((f) => !(f.mailKey === mark && names.has(f.name))),   // a study done again replaces its own earlier files, nothing else
      ...got.map((f) => ({ ...tdNewFile(f, analyzerOutputKind(f.name), mark), kindManual: true }))];
    if (!await tdUpdate(id, { files, analyzer: { ...a, state: 'done', at: tdNowWall().slice(0, 16), error: '', files: got.length } }, tdActivity('study', t('an_act_done', { n: got.length })))) throw new Error('store');
    const study = got.find((f) => f.name === analyzerStudyFile(j.outputs));
    anSet(id, { phase: 'done', pct: 1, msg: '' });
    if (study) await tdImportStudies([study], id); else renderTenders();
  } catch { anSet(id, { phase: 'error' }); }
}
function anText(i, st) {
  const a = i.analyzer, ph = st ? st.phase : a ? a.state : '';
  if (ph === 'running') return t('an_s_running', { p: Math.round(((st && st.pct) || 0) * 100), m: bidi((st && st.msg) || '…') });
  if (ph === 'sending' || ph === 'taking') return t(`an_s_${ph}`, { p: Math.round(((st && st.pct) || 0) * 100), m: bidi((st && st.msg) || '…') });
  if (ph === 'done') return t('an_s_done', { n: a ? a.files : 0, at: a && a.at ? tdWhen(a.at) : '—' });
  if (ph === 'failed') return t('an_s_failed', { e: bidi((st && st.error) || (a && a.error === 'closed' ? t('an_err_closed') : a && a.error === 'gone' ? t('an_err_gone') : (a && a.error) || '—')) });
  return ph ? t(`an_s_${ph}`) : t('an_s_idle');
}
// the box on the card: one button, what is happening in plain words, and what to do when the program is not there
function anBody(i) {
  const st = anRun.get(i.id), a = i.analyzer, ph = st ? st.phase : a ? a.state : '', busy = AN_BUSY.includes(ph);
  const send = analyzerSend(i);
  return [el('p', { class: `an-line an-${ph || 'idle'}`, role: 'status', text: anText(i, st) }),
    busy ? el('progress', { class: 'an-bar', max: '100', value: String(Math.round(((st && st.pct) || 0) * 100)), 'aria-label': t('an_h') }) : null,
    el('div', { class: 'row an-acts' },
      el('button', { type: 'button', class: 'btn tiny primary an-go', disabled: busy || !!tdBusy, text: t(a && a.state === 'done' ? 'an_again' : 'an_go', { n: send.files.length }), onclick: () => tdAnalyze(i.id) }),
      a && ['lost', 'error'].includes(ph) ? el('button', { type: 'button', class: 'btn tiny an-take', text: t('an_take'), onclick: () => { anSet(i.id, { phase: 'running' }); anFollow(i.id); } }) : null,
      ['missing', 'lost'].includes(ph) ? el('a', { class: 'btn tiny an-open', href: ANALYZER.open, text: t('an_open') }) : null,
      ph === 'missing' ? el('a', { class: 'btn tiny an-get', href: './tender-analyzer.html#install', target: '_blank', rel: 'noopener', text: `⬇ ${t('an_get')}` }) : null),
    ph === 'missing' ? el('p', { class: 'hint an-help', text: t('an_help') }) : el('p', { class: st && ['cloud', 'api', 'subs'].includes(st.engine) ? 'hint an-cloud' : 'hint', text: t(analyzerNote(st && st.engine), { n: send.files.length }) })];
}
const AN_BUSY = ['connect', 'opening', 'sending', 'running', 'taking'];
// the fold's own line says where the study stands in two words, so a closed fold still tells
function anShort(i) {
  const st = anRun.get(i.id), a = i.analyzer, ph = st ? st.phase : a ? a.state : '';
  if (AN_BUSY.includes(ph)) return t('an_f_work', { p: Math.round(((st && st.pct) || 0) * 100) });
  return t(ph === 'done' ? 'an_f_done' : ph === 'failed' ? 'an_f_failed' : ph ? 'an_f_wait' : 'an_f_idle');
}
// The card stays one window on a laptop (ADR-0131): the study lives in a fold, and one button in the card's row starts it.
function anBox(i) {
  if (i.analyzer && i.analyzer.state === 'running' && !anRun.has(i.id)) { anRun.set(i.id, { phase: 'running', pct: 0, msg: '' }); tdFoldSet.add('analyzer'); anFollow(i.id); }   // the page was reopened while the program works
  return tdFold('analyzer', t('an_fold', { s: anShort(i) }), el('div', { class: 'an-box', 'data-an': i.id }, anBody(i)));
}
function anStartBtn(i) {
  return el('button', { type: 'button', class: 'btn tiny primary an-start', disabled: !!tdBusy || AN_BUSY.includes((anRun.get(i.id) || {}).phase), title: t('an_h'), text: `🧠 ${t('an_start')}`,
    onclick: () => { tdOpenFold('analyzer'); tdAnalyze(i.id); } });
}
function anDraw(id) {
  const item = tenders?.items.find((r) => r.id === id); if (!item) return;
  for (const box of document.querySelectorAll('.an-box')) if (box.dataset.an === id) {
    set(box, anBody(item));
    const sum = box.parentElement && box.parentElement.querySelector(':scope > summary'); if (sum) sum.textContent = t('an_fold', { s: anShort(item) });
  }
}
// ADR-0127: the final offer (one file, or several) goes onto its tender and makes it ready
// v9.71 (ADR-0142): register and study in one step. Tenders a mail has just registered go to the program one after the other,
// because the program runs one study at a time. analyzerAuto() decides; anything short of «run» leaves the card's button.
const AN_AUTO = 'an.auto';
const anAutoPref = () => cleanAnalyzerAuto(pref(AN_AUTO));
async function anAutoRun(ids) {
  const p = anAutoPref(); if (!p.on || !ids.length) return;
  for (const id of ids) {
    const item = tenders?.items.find((r) => r.id === id); if (!item) continue;
    const plan = analyzerAuto(p, await anHello(), analyzerSend(item));
    if (plan === 'closed') { toast(t('an_auto_closed')); return; }
    if (plan === 'ask') { toast(t('an_auto_changed')); return; }
    if (plan !== 'run') continue;
    await tdAnalyze(id);
    while (AN_BUSY.includes((anRun.get(id) || {}).phase)) await anSleep(AN_T.poll);
  }
}
function anAutoSwitch() {
  const p = anAutoPref();
  const box = el('input', { type: 'checkbox', class: 'an-auto-box', checked: p.on ? '' : null, onchange: async (e) => {
    const want = e.target.checked;
    if (!want) { pref(AN_AUTO, JSON.stringify({ on: false, engine: 'local' })); renderTenders(); return; }
    e.target.disabled = true;
    const hello = await anHello();   // turned on only in front of the program: its answer is the place the user agrees to
    if (!hello) { toast(t('an_auto_on_closed')); renderTenders(); return; }   // v9.75: what to do to turn it on, not «the study did not start»
    pref(AN_AUTO, JSON.stringify({ on: true, engine: cleanAnalyzerAuto({ on: true, engine: hello.engine }).engine })); renderTenders();
  } });
  return el('div', { class: 'an-auto' }, el('label', { class: 'an-auto-l' }, box, el('span', { text: t('an_auto') })),
    el('p', { class: p.on && p.engine !== 'local' ? 'hint an-cloud' : 'hint', text: t(analyzerAutoNote(p)) }));
}
async function tdAddFilesAs(id, files, kind) {
  const cur = tenders?.items.find((i) => i.id === id); if (!cur || !files.length) return;
  const upload = files.map((f) => ({ ...tdNewFile(f, kind), kindManual: true }));
  if (!await tdUpdate(id, { files: [...(cur.files || []), ...upload] }, tdActivity('add', files.map((f) => f.name).join(', ')))) return;
  const res = tdStudyResult && tdStudyResult.moves ? tdStudyResult : tdNewResult();
  if (kind === 'offer') await tdAutoMove(id, { type: 'offer' }, res);
  if (res.moves.length) tdStudyResult = res;
  renderTenders(); toast(t('td_drop_added', { n: files.length, k: t(tdFileKind[kind] || `td_file_${kind}`) }));
  if (kind !== 'offer' && kind !== 'study') void tdAnalyzeFiles(id, upload.map((x) => x.id));
}
// ADR-0127: one place to drop anything. Mails register tenders, a study fills its tender, and any other file is asked about once:
// which tender, and what it is — the tender whose window is open, or the only one being prepared, is offered first.
async function tdRouteDrop(files, hintId = null) {
  if (!files.length) return;
  if (tdBusy) { toast(t('td_busy_wait')); return; }   // v9.55: files dropped while the page was reading others vanished without a word
  const mails = files.filter((f) => /\.(msg|eml)$/i.test(f.name)), rest = files.filter((f) => !mails.includes(f)), studies = [], other = [], pulls = [];
  for (const f of rest) (await etIsFile(f) ? pulls : await tdIsStudyFile(f) ? studies : other).push(f);   // v9.60: the Etimad pull is told apart before the study (both can be .json or .xlsx)
  if (pulls.length) await etImport(pulls);
  if (mails.length) await tdImportEmails(mails, hintId || '');
  if (studies.length) await tdImportStudies(studies, hintId);
  if (other.length) tdDropAsk(other, hintId);
}
function tdDropAsk(files, hintId) {
  const open = (tenders ? tenders.items : []).filter((i) => !TENDER_CLOSED.includes(i.stage));
  if (!open.length) { toast(t('td_drop_no_tender')); return; }
  const prep = open.filter((i) => i.stage === 'prep'), guess = hintId || (prep.length === 1 ? prep[0].id : (open.find((i) => i.etimadNo && files.some((f) => f.name.includes(i.etimadNo))) || {}).id) || '';
  const sel = el('select', { class: 'td-drop-tender', 'aria-label': t('td_drop_which') }, guess ? null : el('option', { value: '', text: t('td_drop_pick') }), open.map((i) => el('option', { value: i.id, selected: i.id === guess ? '' : null, text: `${i.subject.slice(0, 90)} — ${t(`td_st_${i.stage}`)}` })));
  const kind = el('select', { class: 'td-drop-kind', 'aria-label': t('td_file_type') }, ['offer', 'study', 'booklet', 'boq', 'proof', 'other'].map((k) => el('option', { value: k, text: t(tdFileKind[k] || `td_file_${k}`) })));
  const dlg = el('dialog', { class: 'proj-edit td-drop-dlg tw tw-sm', 'aria-labelledby': 'td-drop-h' }, twHead(el('h2', { id: 'td-drop-h', text: t('td_drop_h') })),
    el('p', { class: 'hint', dir: 'auto', text: files.map((f) => f.name).join(' · ').slice(0, 300) }),
    el('div', { class: 'form-grid' }, el('label', { class: 'wide' }, el('span', { text: t('td_drop_which') }), sel), el('label', { class: 'wide' }, el('span', { text: t('td_file_type') }), kind)),
    el('p', { class: 'hint', text: t('td_drop_note') }),
    twFoot(el('button', { type: 'button', class: 'btn primary td-drop-ok', text: t('td_drop_ok'), onclick: async () => { if (!sel.value) { toast(t('td_drop_pick')); return; } const id = sel.value, k = kind.value; dlg.close(); await tdAddFilesAs(id, files, k); } }),
      el('button', { type: 'button', class: 'btn quiet', text: t('cancel'), onclick: () => dlg.close() })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
const tdDropBind = (node, hint) => { node.addEventListener('dragover', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files') && !e.target.closest('.td-mail-drop')) e.preventDefault(); });
  node.addEventListener('drop', (e) => { if (e.target.closest('.td-mail-drop') || !e.dataTransfer || !e.dataTransfer.files.length) return; e.preventDefault(); void tdRouteDrop([...e.dataTransfer.files], hint ? hint() : null); }); };
const tdStudyInput = (onlyId = null) => el('input', { type: 'file', accept: '.json,application/json,.xlsx,.xlsm', multiple: onlyId ? null : '', hidden: '', onchange: (e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) tdImportStudies(fs, onlyId); } });
async function tdUpdate(id, patch, activity = null) {
  const item = tenders?.items.find((row) => row.id === id);
  if (!item) return false;
  const edited = { ...item, ...patch, ...(activity ? { activity: [activity, ...(item.activity || [])] } : {}) };
  try {
    await tdCommit({ ...tenders, items: tenders.items.map((row) => row.id === id ? edited : row) });
    return true;
  } catch {
    toast(t('td_store_failed'));
    return false;
  }
}
async function tdAnalyzeFiles(id, ids) {
  if (tdBusy || !ids.length) return;
  tdBusy = t('td_doc_reading'); renderTenders();
  try {
    const reader = await (tdDocumentReader ||= import('./assets/tender-documents.js').catch(error => { tdDocumentReader = null; throw error; }));
    for (const fileId of ids) {
      const current = tenders?.items.find(row => row.id === id);
      const file = current?.files?.find(entry => entry.id === fileId && entry.kind !== 'original');
      if (!file) continue;
      tdBusy = t('td_doc_reading_file', {name:file.name}); renderTenders();
      const result = await reader.readTenderDocument({ name:file.name, size:file.blob.size,
        arrayBuffer:()=>file.blob.arrayBuffer(), text:()=>file.blob.text() }, { loadXlsx });
      const latest = tenders.items.find(row => row.id === id);
      if (!latest) break;
      const files = latest.files.map(entry => entry.id === fileId ? {...entry,analysis:result.analysis,
        kind:!entry.kindManual && ['other','sheet'].includes(entry.kind) && result.kind ? result.kind : entry.kind} : entry);
      const dated = applyTenderEmailDates({...latest,files});
      if (!await tdUpdate(id, {files,...tenderDatePatch(dated)}, tdActivity('read',file.name))) break;
      await new Promise(resolve => setTimeout(resolve,0));
    }
  } catch { toast(t('td_doc_error')); }
  finally { tdBusy = ''; renderTenders(); }
}
async function tdImportEmails(files, id = '', { quiet = false } = {}) {   // quiet (v9.75): read from the mail folder — nothing opens, the period shown stays
  if (tdBusy || !files.length) return null;
  const imported = [], fresh = [], per = [];   // per (v9.76): what became of each file, for the mail folder
  let added = 0, linked = 0, skipped = 0, failed = 0, warnings = 0;
  const failures = [];
  tdBusy = t('td_mail_reading');
  renderTenders();
  try {
    const { parse, classify } = await tdLoadMail();
    for (const file of files) {
      try {
        const mail = await parse(file);
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())), (byte) => byte.toString(16).padStart(2, '0')).join('');
        const messageId = mail.id.slice(0, 320), key = messageId ? 'id:' + messageId : 'sha:' + hash;
        const state = tenders || { items: [], to: null, pulledAt: '' };
        if (state.items.some((row) => row.messages?.some((m) => m.key === key || m.hash === hash))) { skipped++; per.push({ name: file.name, kind: 's' }); continue; }
        const subject = mail.subject.slice(0, 300), subjectKey = tdKey(subject);
        // v9.87 (ADR-0154): the Etimad reference is read from the subject, the file names and the text — mails find their tender by it first
        const number = tenderDigits(mail.number) || mailEtimadRef(subject, mail.attachments.map((a) => a.name || ''), mail.body);
        const byNumber = number ? state.items.filter((row) => tenderDigits(row.etimadNo) === number) : [];
        const byThread = state.items.filter((row) => row.messages?.some((m) => mail.references.includes(m.messageId) && m.messageId));
        const bySubject = state.items.filter((row) => tdKey(row.subject) === subjectKey);
        let candidates = id ? state.items.filter((row) => row.id === id) : byNumber.length ? byNumber : byThread.length ? byThread : bySubject;
        // v9.85 (ADR-0152): the mail that carries the offer deck and the priced BOQ to the tenders team is the hand-over. Its subject
        // is often its own («the final files»), so it finds its tender by the Etimad number or the words of its subject and file
        // names; it never becomes a tender of its own.
        const names = mail.attachments.map((a) => a.name || ''), hands = mailHandsOver(mail.sender, names, tdIsAI);
        if (hands && !id && !candidates.length) { const hid = tenderForHandover(state.items, subject, names); if (hid) candidates = state.items.filter((row) => row.id === hid); }
        if (candidates.length > 1 || (id && !candidates.length)) throw new Error('td_mail_ambiguous');
        const existing = candidates[0];
        if (existing?.etimadNo && number && tenderDigits(existing.etimadNo) !== number) throw new Error('td_mail_ambiguous');
        // A missing receipt date must not turn today's import into a false arrival.
        if (!existing && hands) throw new Error('td_mail_no_tender');
        if (!existing && (!subjectKey || !mail.date)) throw new Error('td_mail_missing_date');
        const filesToSave = [tdNewFile(file, 'original', key)];
        const heard = existing ? [] : tdThreadOf(mail);
        for (const attachment of mail.attachments) { const k = await classify(attachment); filesToSave.push(tdNewFile(attachment, hands ? tenderHandoverKind({ name: attachment.name, kind: k }) : k, key)); }
        // v9.87 (ADR-0154): a mail opens a tender only when something in it says «tender»; one that follows a tender already here joins it whatever it says
        if (!existing && !mailIsTender({ subject, number, names, booklet: filesToSave.some((f) => f.kind === 'booklet'), fromTeam: tdIsAI(mail.sender), threadHasTeam: heard.some((e) => tdIsAI(e.addr)) })) throw new Error('td_mail_not_tender');
        const dateSource = mail.dateSource === 'ورود' ? 'received' : 'sent';
        const first = existing || {
          id: subjectKey, subject, date: mail.date, dateSource, from: mail.sender.slice(0, 120),
          byFrom: tdIsAI(mail.sender), byKr: filesToSave.some((entry) => entry.kind === 'booklet'), att: [],
          status: 'open', stage: 'received', stageAt: mail.date,
        };
        const mailAt = mailWall(mail.sentAt), who = String(mail.senderName || mail.sender || '').slice(0, 120);   // v9.86 (ADR-0153): the history is by the mail's own time
        const message = { key, messageId, hash, subject, sender: mail.sender.slice(0, 120), date: mail.date, ...(mailAt ? { at: mailAt } : {}), ...(mail.senderName ? { name: mail.senderName.slice(0, 80) } : {}),
          schedule: tenderEmailSchedule(mail.body, mail.html), warnings: mail.warnings.length };
        const thread = tenderThreadMerge(first.thread, tdThreadOf(mail)), oldest = (thread.find((e) => e.at) || { at: '' }).at.slice(0, 10);
        let entry = applyTenderEmailDates({ ...first, etimadNo: first.etimadNo || number,
          ...(dateSource === 'received' && (first.dateSource === 'sent' || (first.dateSource === 'received' && mail.date < first.date)) ? { date: mail.date, dateSource } : {}),
          // v9.57: a tender that first reaches the register as a reply did not arrive on the reply's day — the oldest message
          // quoted in it says when it did. A tender already in the register keeps the date it has.
          ...(!existing && oldest && oldest < mail.date ? { date: oldest, dateSource: 'thread', stageAt: oldest } : {}),
          messages: [...(first.messages || []), message], files: [...(first.files || []), ...filesToSave], thread,
          activity: [tdActivity('email', subject, { ...(mailAt ? { mailAt } : {}), who }), ...(first.activity || [])],
        });
        if (hands) { const ho = tenderHandoverPatch(entry, { at: mailWall(mail.sentAt) || mail.date, name: mail.senderName, addr: String(mail.sender || '').toLowerCase() });
          entry = { ...entry, ...ho, activity: [tdActivity('handover', mail.senderName || mail.sender, { ...(mailAt ? { mailAt } : {}), who }), ...entry.activity] }; }
        await tdCommit({ ...state, items: [entry, ...state.items.filter((row) => row.id !== entry.id)].sort((a, b) => b.date.localeCompare(a.date)) });
        imported.push(entry.id);
        if (existing) linked++; else { added++; fresh.push(entry.id); }
        per.push({ name: file.name, kind: existing ? 'l' : 'a', id: entry.id });
        warnings += mail.warnings.length;
      } catch (error) {
        const key = ['td_mail_ambiguous','td_mail_missing_date','td_mail_no_tender','td_mail_not_tender'].includes(error.message) ? error.message : 'td_mail_failed';
        failures.push({ name: file.name, key }); per.push({ name: file.name, kind: 'f', key });
        failed++;
      }
    }
  } catch {
    failures.push({ name: '', key: 'td_mail_failed' });
    failed += files.length; for (const f of files) if (!per.some((x) => x.name === f.name)) per.push({ name: f.name, kind: 'f', key: 'td_mail_failed' });
  } finally {
    tdBusy = '';
  }
  if (imported.length && !quiet) {
    const last = tenders.items.find((row) => row.id === imported.at(-1));
    tdOpenId = last.id;
    tdPick = tdPeriodOf(last.date, tdKind);
    tdStageF = tdCardF = null;
    tdQuery = '';
  }
  tdMailResult = { a: added, l: linked, s: skipped, f: failed, w: warnings, failures };
  renderTenders();
  for (const tenderId of new Set(imported)) {
    const item = tenders.items.find(row => row.id === tenderId);
    await tdAnalyzeFiles(tenderId, (item.files || []).filter(file => file.kind !== 'original' && !file.analysis).map(file => file.id));
  }
  void anAutoRun([...new Set(fresh)]);
  return { a: added, l: linked, s: skipped, f: failed, per };
}
function tdEmailPicker(id = '') {
  const input = el('input', { type: 'file', accept: '.msg,.eml', multiple: '', hidden: true, onchange: async (event) => {
    const files = [...event.target.files]; event.target.value = ''; await tdImportEmails(files, id);
  } });
  const drop = el('div', { class: 'td-mail-drop', ondragover: (event) => {
    event.preventDefault(); if (!tdBusy) event.currentTarget.classList.add('on');
  }, ondragleave: (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.classList.remove('on');
  }, ondrop: (event) => {
    event.preventDefault(); event.currentTarget.classList.remove('on');
    const files = [...event.dataTransfer.files];
    if (!files.length) { toast(t('td_mail_drop_failed')); return; }
    void tdImportEmails(files, id);
  } },
  el('button', { type: 'button', class: id ? 'btn tiny' : 'btn primary', disabled: !!tdBusy,
    text: t(id ? 'td_mail_link' : 'td_mail_import'), onclick: () => input.click() }), input,
  el('span', { class: 'hint', text: t('td_mail_hint') }), id ? null : anAutoSwitch());
  return drop;
}
// ---------- v9.75 (ADR-0145): the tender mail folder ----------
// Power Automate saves every tender mail that arrives as a file (eml) in a OneDrive folder kept on this computer. The manager
// connects that folder once; the page reads it — read only — every minute while it is open and whenever he comes back to it,
// and registers what is new exactly as a dropped mail (and studies it when the one-step switch is on, ADR-0142). The folder's
// handle stays in this browser's storage and is never in the backup; no file leaves the computer.
const MD_KEY = 'tdmaildir', MD_EVERY = 60000, MD_BATCH = 10;
const MD_FLOW_NAME = "concat(formatDateTime(triggerOutputs()?['body/receivedDateTime'],'yyyy-MM-dd_HHmmss'),'_',guid(),'.eml')";
let mdRec = null, mdTimer = 0, mdLoaded = false, mdBox = null;   // mdRec: { handle, name, seen: [], failed: [], at, first, keep }
let mdState = { perm: '', busy: false, last: '', got: 0, waiting: 0, ask: 0, names: [], error: '' };
const mdCan = () => typeof window.showDirectoryPicker === 'function';
// A private (incognito) window keeps the folder for the visit only: in Chromium's own test browser, a folder kept by such a window
// and read back closed the whole browser. It is told apart as the usual check does — its storage quota is well under twice the
// script heap, where a normal window's is a share of the disk.
async function mdKeepable() {
  try { const e = await navigator.storage.estimate(), heap = (performance.memory && performance.memory.jsHeapSizeLimit) || 1073741824;
    return !(e && typeof e.quota === 'number' && e.quota < 2 * heap); } catch { return true; }
}
async function mdSave() { if (mdRec && mdRec.keep) await store.kvPut(MD_KEY, mdRec); }   // kept in this browser only — never in the backup
async function mdLoad() {
  if (mdLoaded || isTeamPortal || !mdCan()) return; mdLoaded = true;
  const rec = await store.kvGet(MD_KEY); if (!rec || !rec.handle) return;
  mdRec = { seen: [], first: false, ...rec, keep: true }; await mdCheck(false);
}
// what the browser allows now; with «ask» (a press of «Allow») it asks — once per visit until «Allow on every visit» is chosen
async function mdCheck(ask) {
  if (!mdRec) return;
  try { let p = await mdRec.handle.queryPermission({ mode: 'read' }); if (p !== 'granted' && ask) p = await mdRec.handle.requestPermission({ mode: 'read' }); mdState.perm = p; }
  catch { mdState.perm = 'prompt'; }
  if (mdState.perm === 'granted') { mdArm(); await mdScan(); } else mdDraw();
}
function mdArm() { clearInterval(mdTimer); mdTimer = setInterval(() => { if (!document.hidden) void mdScan(); }, MD_EVERY); }
document.addEventListener('visibilitychange', () => { if (!document.hidden && mdRec && mdState.perm === 'granted') void mdScan(); });
async function mdConnect() {
  let h; try { h = await window.showDirectoryPicker({ id: 'afaqy-tender-mail', mode: 'read' }); }
  catch (e) { if (!e || e.name !== 'AbortError') toast(t('md_lost')); return; }
  mdRec = { handle: h, name: h.name, seen: [], at: '', first: true, keep: await mdKeepable() };
  mdState = { ...mdState, perm: 'granted', error: '', ask: 0, last: '', got: 0, waiting: 0 };
  await mdSave(); mdArm(); await mdScan();
}
async function mdOff() { clearInterval(mdTimer); mdRec = null; mdState = { perm: '', busy: false, last: '', got: 0, waiting: 0, ask: 0, names: [], error: '' }; await store.kvPut(MD_KEY, null); mdDraw(); }
// one round: list the folder, read what is new (ten at a time), hand it to the register; what could not be read yet (OneDrive is
// still bringing it down) is tried again next round, and a folder that already holds many mails asks once before reading them all
async function mdScan(all = false) {
  if (!mdRec || mdState.busy || mdState.perm !== 'granted') return;
  if (tdBusy) { setTimeout(() => { void mdScan(all); }, 3000); return; }
  mdState.busy = true; mdDraw();
  let again = false;
  try {
    const names = [], handles = new Map();
    for await (const h of mdRec.handle.values()) if (h.kind === 'file') { names.push(h.name); handles.set(h.name, h); }
    const { fresh, waiting, mails } = mailDirNew(names, mdRec.seen, MD_BATCH);
    if (mdRec.first && !all && !mdRec.seen.length && mails > MAILDIR_ASK) { mdState = { ...mdState, ask: mails, names }; return; }
    const read = [];
    for (const n of fresh) {
      try { const f = await handles.get(n).getFile(); if (!f.size) continue; read.push([n, new File([await f.arrayBuffer()], n, { type: f.type || 'message/rfc822', lastModified: f.lastModified })]); }
      catch { /* not on the computer yet: next round */ }
    }
    const res = read.length ? await tdImportEmails(read.map(([, f]) => f), '', { quiet: true }) : null;
    if (read.length && !res) { again = true; return; }   // the register was busy with something else: nothing was read
    // v9.76: a mail that could not be registered is still taken as read (it would fail every minute), but kept by name with its
    // reason until it is registered or leaves the folder, so the card says so and «Check the folder» lists it
    mdRec = { ...mdRec, first: false, seen: mailDirSeen(mdRec.seen, names, read.map(([n]) => n)), failed: mailDirFailed(mdRec.failed, names, res ? res.per : []), at: tdNowWall() };
    mdState = { ...mdState, last: mdRec.at, got: read.length, waiting: waiting + fresh.length - read.length, ask: 0, names: [], error: '' };
    await mdSave();
    if (res && (res.a || res.l)) toast(t('md_done', { a: res.a, l: res.l }));
    again = waiting > 0;
  } catch (e) {
    mdState.error = 'lost'; if (e && e.name === 'NotAllowedError') mdState.perm = 'prompt';
  } finally { mdState.busy = false; mdDraw(); }
  if (again) setTimeout(() => { void mdScan(true); }, 1500);
}
async function mdFromNow() {   // the mails already in the folder are taken as read: only what arrives from now on is registered
  mdRec = { ...mdRec, first: false, seen: mailDirSeen([], mdState.names, mailDirNew(mdState.names, [], 1e9).fresh), at: tdNowWall() };
  mdState = { ...mdState, ask: 0, names: [], last: mdRec.at, got: 0, waiting: 0 }; await mdSave(); mdDraw();
}
function mdRow() {
  if (isTeamPortal) return [];
  const how = el('button', { type: 'button', class: 'btn tiny quiet md-how-btn', text: `؟ ${t('md_how')}`, onclick: mdHow });
  if (!mdCan()) return matchMedia('(pointer: coarse)').matches ? [] : [el('p', { class: 'hint md-un', text: t('md_unsupported') })];
  if (!mdRec) return [el('div', { class: 'row md-row' }, el('button', { type: 'button', class: 'btn md-connect', text: `📂 ${t('md_connect')}`, onclick: () => { void mdConnect(); } }), how),
    el('p', { class: 'hint md-hint', text: t('md_hint') })];
  const name = el('span', { class: 'chip md-name', dir: 'auto', title: t('md_on', { name: mdRec.name }), text: `📂 ${mdRec.name}` });
  const off = el('button', { type: 'button', class: 'btn tiny quiet md-off', text: `✕ ${t('md_off')}`, onclick: () => { void mdOff(); } });
  if (mdState.perm !== 'granted') return [el('div', { class: 'row md-row' }, name, el('button', { type: 'button', class: 'btn primary md-allow', text: t('md_allow'), onclick: () => { void mdCheck(true); } }), off, how),
    el('p', { class: 'hint', text: t('md_allow_hint') })];
  const line = mdState.error ? t('md_lost') : mdState.busy ? t('td_mail_reading') : [mdState.last ? t('md_last', { at: tdWhen(mdState.last) }) : '',
    mdState.last ? (mdState.got ? t('md_new', { n: mdState.got }) : t('md_none')) : '', mdState.waiting ? t('md_wait', { n: mdState.waiting }) : ''].filter(Boolean).join(' · ');
  const bad = (mdRec.failed || []).length, ck = (cls) => el('button', { type: 'button', class: `btn tiny ${cls}`, disabled: mdState.busy, text: `🔍 ${t('md_ck')}`, onclick: () => { void mdAudit(); } });
  return [el('div', { class: 'row md-row' }, name, el('button', { type: 'button', class: 'btn tiny md-read', disabled: mdState.busy || !!tdBusy, text: `↻ ${t('md_read')}`, onclick: () => { void mdScan(); } }), ck('md-ck-btn'), off, how),
    el('p', { class: `hint md-line${mdState.error ? ' md-err' : ''}`, text: line }),   // not a live region: it changes every minute; what is new is said by the toast
    bad && !mdState.error ? el('p', { class: 'note md-failed' }, el('span', { text: t('md_failed', { n: bad }) })) : null,
    mdRec.keep ? null : el('p', { class: 'hint md-private', text: t('md_private') }),
    mdState.ask ? el('div', { class: 'md-ask' }, el('p', { text: t('md_ask', { n: mdState.ask }) }),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary md-all', text: t('md_ask_all'), onclick: () => { mdState.ask = 0; void mdScan(true); } }),
        el('button', { type: 'button', class: 'btn md-new', text: t('md_ask_new'), onclick: () => { void mdFromNow(); } }))) : null];
}
function mdDraw() { if (mdBox && mdBox.isConnected) set(mdBox, ...mdRow()); }
// the steps of the flow, where they are needed: in a window of the register's own frame, the file name ready to copy
function mdHow() {
  const dlg = el('dialog', { class: 'proj-edit md-how tw tw-md', 'aria-labelledby': 'md-how-h' }, twHead(el('h2', { id: 'md-how-h', text: t('md_h') })),
    el('p', { class: 'hint', text: t('md_lead') }),
    el('ol', { class: 'md-steps' }, ['md_s1', 'md_s2', 'md_s3', 'md_s4', 'md_s5', 'md_s6', 'md_s7', 'md_s8'].map((k) => el('li', { text: t(k) }))),
    el('p', { class: 'md-name-h', text: t('md_name_h') }),
    el('pre', { class: 'md-code', dir: 'ltr', tabindex: '0', 'aria-label': t('md_name_h'), text: MD_FLOW_NAME }),
    el('p', { class: 'note', text: t('md_note') }),
    twFoot(el('button', { type: 'button', class: 'btn md-copy', text: `📋 ${t('md_copy')}`, onclick: () => copyText(MD_FLOW_NAME, t('md_copied')) }),
      mdCan() && !mdRec ? el('button', { type: 'button', class: 'btn primary md-connect2', text: `📂 ${t('md_connect')}`, onclick: () => { dlg.close(); void mdConnect(); } }) : null));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
// v9.76 (ADR-0146): «Check the folder» — every mail file said against the register: in which tender it is, a second copy of a mail
// already there, not registered and why, not read yet, still being written, or one the reader cannot open. It reads the folder
// only; «Register the ones not in the register» hands those to the importer as the minute's reading does.
async function mdAudit() {
  if (!mdRec || mdState.perm !== 'granted') return;
  const sum = el('p', { class: 'md-ck-sum', role: 'status', text: t('md_ck_reading', { i: 0, n: '…' }) }), list = el('div', { class: 'md-ck-list' });
  const reg = el('button', { type: 'button', class: 'btn primary md-ck-reg', hidden: '' }), copy = el('button', { type: 'button', class: 'btn md-ck-copy', disabled: '', text: `📋 ${t('md_ck_copy')}` });
  const dlg = el('dialog', { class: 'proj-edit md-ck-dlg tw tw-lg', 'aria-labelledby': 'md-ck-h' }, twHead(el('h2', { id: 'md-ck-h', dir: 'auto', text: t('md_ck_h', { name: mdRec.name }) })),
    sum, list, twFoot(reg, copy));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
  const handles = new Map(); let rep = null;
  const ORDER = ['out', 'bad', 'wait', 'empty', 'in', 'same'];
  const state = (r) => [t(`md_ck_${r.status}`), r.why ? t(r.why) : ''].filter(Boolean).join(' — ');
  const draw = () => {
    const n = rep.n, todo = rep.rows.filter((r) => r.status === 'out' || r.status === 'wait');
    sum.textContent = !n.mails ? t('md_ck_none') : n.out + n.wait + n.bad + n.empty ? t('md_ck_sum', n) : t('md_ck_all_in', n);
    const rows = [...rep.rows].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || (a.name < b.name ? -1 : 1));
    set(list, n.mails ? el('div', { class: 'table-wrap' }, el('table', { class: 'md-ck-table' },
      el('thead', {}, el('tr', {}, ['md_ck_col_file', 'md_ck_col_state', 'md_ck_col_tender'].map((k) => el('th', { text: t(k) })))),
      el('tbody', {}, rows.map((r) => el('tr', { 'data-st': r.status },
        el('td', { class: 'md-ck-name', dir: 'ltr', text: r.name }), el('td', { text: state(r) }),
        el('td', {}, r.id ? el('button', { type: 'button', class: 'btn tiny quiet md-ck-open', dir: 'auto', title: t('md_ck_open'), text: tdTitle(r.subject).slice(0, 90),
          onclick: () => { dlg.close(); tdOpenId = r.id; renderTenders(); } }) : '—')))))) : null);
    reg.hidden = !todo.length; reg.disabled = !!tdBusy; reg.textContent = `＋ ${t('md_ck_reg', { n: todo.length })}`;
    reg.onclick = async () => {
      if (tdBusy) { toast(t('td_busy_wait')); return; }
      reg.disabled = true; const files = [];
      for (const r of todo) { try { const f = await handles.get(r.name).getFile(); if (f.size) files.push(new File([await f.arrayBuffer()], r.name, { type: f.type || 'message/rfc822', lastModified: f.lastModified })); } catch { /* not on the computer yet */ } }
      const res = files.length ? await tdImportEmails(files, '', { quiet: true }) : null;
      if (res && mdRec) { const names = [...handles.keys()];
        mdRec = { ...mdRec, seen: mailDirSeen(mdRec.seen, names, files.map((f) => f.name)), failed: mailDirFailed(mdRec.failed, names, res.per) }; await mdSave(); mdDraw();
        toast(t('md_done', { a: res.a, l: res.l })); }
      if (dlg.open) await run();
    };
    copy.disabled = !n.mails; copy.onclick = () => copyText([sum.textContent, ...rows.map((r) => [r.name, state(r), r.subject || ''].filter(Boolean).join(' · '))].join('\n'), t('md_ck_copied'));
  };
  const run = async () => {
    sum.textContent = t('md_ck_reading', { i: 0, n: '…' });
    try {
      const { parse } = await tdLoadMail(), all = [];
      for await (const h of mdRec.handle.values()) if (h.kind === 'file') all.push(h);
      const mails = all.filter((h) => mailDirNew([h.name], [], 1).mails), files = []; handles.clear();
      for (const [k, h] of mails.entries()) {
        if (!dlg.open) return; sum.textContent = t('md_ck_reading', { i: k + 1, n: mails.length }); handles.set(h.name, h);
        let f; try { f = await h.getFile(); } catch { files.push({ name: h.name, size: 0 }); continue; }   // not on the computer yet
        if (!f.size) { files.push({ name: h.name, size: 0 }); continue; }
        try { const buf = await f.arrayBuffer(), mail = await parse(new File([buf], h.name, { type: 'message/rfc822' }));
          const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buf)), (b) => b.toString(16).padStart(2, '0')).join(''), id = mail.id.slice(0, 320);
          files.push({ name: h.name, size: f.size, key: id ? 'id:' + id : 'sha:' + hash, hash }); }   // the key and hash exactly as the importer makes them
        catch { files.push({ name: h.name, size: f.size, bad: true }); }
      }
      rep = mailDirReport(files, tenders ? tenders.items : [], mdRec.seen, mdRec.failed); draw();
    } catch (e) { sum.textContent = t('md_lost'); if (e && e.name === 'NotAllowedError') { mdState.perm = 'prompt'; mdDraw(); } }
  };
  await run();
}
// v9.77 (ADR-0147): «Read the booklets again» — every open tender's files (not the mails themselves, not the signature pictures)
// are read again with today's reader, so what it learnt since (the booklet's Hijri dates table, v9.76) reaches the tenders already
// registered. A date typed by hand is never touched (applyTenderEmailDates); the window says what moved and what waits for a choice.
async function tdReread() {
  if (tdBusy || !tenders) return;
  const open = tenders.items.filter((i) => TD_OPEN.includes(i.stage) && i.stage !== 'submitted'), jobs = open.map((i) => [i, (i.files || []).filter((f) => f.kind !== 'original' && !tdIsMailPicture(f)).map((f) => f.id)]).filter(([, ids]) => ids.length);
  if (!jobs.length) { toast(t('td_rr_nofiles')); return; }
  const before = new Map(jobs.map(([i]) => [i.id, Object.fromEntries(TENDER_DATE_FIELDS.flatMap((f) => [[f, i[f] || ''], [`${f}Time`, i[`${f}Time`] || '']]))]));
  for (const [i, ids] of jobs) await tdAnalyzeFiles(i.id, ids);
  const res = tenderDateChanges(before, tenders.items), files = jobs.reduce((a, [, ids]) => a + ids.length, 0);
  const lab = (f) => t(`td_col_${f}`);
  const dlg = el('dialog', { class: 'proj-edit td-rr-dlg tw tw-md', 'aria-labelledby': 'td-rr-h' }, twHead(el('h2', { id: 'td-rr-h', text: t('td_rr_h') })),
    el('p', { class: 'td-rr-sum', text: t('td_rr_sum', { f: files, t: jobs.length, c: res.filter((x) => x.changed.length).length, r: res.filter((x) => x.review.length).length }) }),
    res.length ? el('ul', { class: 'td-rr-list' }, res.map((x) => el('li', {},
      el('button', { type: 'button', class: 'btn tiny quiet td-rr-open', dir: 'auto', text: tdTitle(x.subject).slice(0, 100), onclick: () => { dlg.close(); tdOpenId = x.id; renderTenders(); } }),
      x.changed.map((c) => el('div', { class: 'hint', text: t('td_rr_changed', { what: lab(c.field), was: c.was || '—', now: c.now || '—' }) })),
      x.review.map((f) => el('div', { class: 'note', text: t('td_rr_review', { what: lab(f) }) }))))) : el('p', { class: 'hint', text: t('td_rr_none') }));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
// ---------- v9.57 (ADR-0130): a tender's correspondence — who wrote, when and what, read from the mails dropped on it ----------
const tdWhen = (at) => (at ? new Date(`${at.length > 10 ? at : `${at}T00:00`}:00Z`).toLocaleString(lang === 'ur' ? 'ur-PK' : lang === 'ar' ? 'ar-SA' : 'en-GB',
  { timeZone: 'UTC', calendar: 'gregory', numberingSystem: 'latn', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', ...(at.length > 10 ? { hour: '2-digit', minute: '2-digit' } : {}) }) : t('td_thr_notime'));
const tdWhenShort = (at) => (at ? at.replace('T', ' ') : t('td_thr_notime'));   // in a table: the register's own compact form
const tdSpan = (min) => { const m = Math.abs(min); return m < 60 ? t('td_thr_min', { m }) : m < 2880 ? t('td_thr_hm', { h: Math.floor(m / 60), m: m % 60 }) : t('td_thr_dh', { d: Math.floor(m / 1440), h: Math.floor((m % 1440) / 60) }); };
// the lines under the list: the same wording on the page, in the copied text and in the summary window
function tdThreadLines(item, F = tenderThreadFacts(item)) {
  if (!F.n) return [];
  return [t('td_thr_facts', { n: F.n, p: F.people, a: F.first ? tdWhen(F.first.at) : '—', b: F.last ? tdWhen(F.last.at) : '—' }),
    F.dueAt ? t('td_thr_due', { d: tdWhen(F.dueAt), w: F.workDays == null ? '—' : F.workDays }) : t('td_thr_due_none'),
    F.handover ? (F.leadMin == null ? t('td_thr_handover_nolead', { a: tdWhen(F.handover.at) }) : t(F.leadMin < 0 ? 'td_thr_handover_late' : 'td_thr_handover', { a: tdWhen(F.handover.at), s: tdSpan(F.leadMin) })) : null].filter(Boolean);
}
function tdThreadText(item) {
  const who = (e) => e.name || e.addr || '—';
  return [t('td_thr_txt_h', { s: item.subject }), '', ...(item.thread || []).map((e) => `- ${tdWhen(e.at)} — ${who(e)}: ${mailGist(e.text) || t('td_thr_notext')}${e.mark ? ` [${t('td_thr_marked')}]` : ''}`), '', t('td_thr_txt_sum'), ...tdThreadLines(item)].join('\n');
}
// the mails kept on a tender before v9.57 were stored whole but never read as a conversation; this reads them, once
async function tdRebuildThread(id) {
  const item = tenders?.items.find((row) => row.id === id); if (!item || tdBusy) return;
  const mails = (item.files || []).filter((file) => file.kind === 'original' && /\.(?:msg|eml)$/i.test(file.name));
  if (!mails.length) { toast(t('td_thr_rebuild_none')); return; }
  let thread = item.thread || [], read = 0;
  tdBusy = t('td_mail_reading'); renderTenders();
  try {
    const { parse } = await tdLoadMail();
    for (const file of mails) { try { thread = tenderThreadMerge(thread, tdThreadOf(await parse(new File([file.blob], file.name)))); read++; } catch { /* a mail that cannot be read is left out of the count below */ } }
  } catch { /* the reader did not load: nothing was read */ } finally { tdBusy = ''; }
  if (!read) toast(t('td_thr_rebuild_none'));
  else if (JSON.stringify(thread) === JSON.stringify(item.thread || [])) toast(t('td_thr_same'));   // read again: nothing new, so nothing is written
  else if (await tdUpdate(id, { thread }, tdActivity('thread', String(thread.length)))) toast(t('td_thr_rebuilt', { n: thread.length, f: read }));
  renderTenders();
}
function tdThreadPanel(item) {
  const thread = item.thread || [], mails = (item.files || []).some((file) => file.kind === 'original' && /\.(?:msg|eml)$/i.test(file.name));
  const mark = async (k) => { const next = thread.map((e, j) => { const { mark: was, ...rest } = e; return j === k && !was ? { ...rest, mark: 'handover' } : rest; }); if (await tdUpdate(item.id, { thread: next })) renderTenders(); };
  return el('details', { class: 'td-subpanel td-thread td-fold td-fold-thread', ...(tdFoldSet.has('thread') ? { open: '' } : {}), ontoggle: (e) => { if (e.target.open) tdFoldSet.add('thread'); else tdFoldSet.delete('thread'); } },
    el('summary', { text: t('td_thr_h', { n: thread.length }) }),
    el('p', { class: 'hint', text: t(thread.length ? 'td_thr_lead' : 'td_thr_none') }),
    thread.length ? el('div', { class: 'td-thr-list' }, thread.map((e, k) => { const gist = mailGist(e.text);
      return el('div', { class: `td-thr-entry${e.mark ? ' td-thr-on' : ''}` },
        el('div', { class: 'td-thr-head' }, el('b', { class: 'td-thr-when', text: tdWhen(e.at) }), el('span', { class: 'td-thr-who', dir: 'auto', text: e.name || e.addr || '—' }),
          e.mark ? el('span', { class: 'chip td-thr-chip', text: t('td_thr_marked') }) : null,
          el('button', { type: 'button', class: 'btn tiny quiet td-thr-mark', disabled: !!tdBusy || !e.at, 'aria-pressed': String(!!e.mark), text: t(e.mark ? 'td_thr_unmark' : 'td_thr_mark'), onclick: () => mark(k) })),
        el('p', { class: `td-thr-gist${gist ? '' : ' hint'}`, dir: 'auto', text: gist || t('td_thr_notext') }),
        e.text && e.text !== gist ? el('details', { class: 'td-thr-more' }, el('summary', { text: t('td_thr_full') }), el('p', { class: 'td-thr-text', dir: 'auto', text: e.text })) : null); })) : null,
    thread.length ? el('div', { class: 'td-thr-sum' }, tdThreadLines(item).map((line) => el('p', { text: line })), el('p', { class: 'hint', text: t('td_thr_wd_hint') })) : null,
    el('div', { class: 'row td-thr-actions' },
      thread.length ? el('button', { type: 'button', class: 'btn tiny td-thr-copy', text: `📋 ${t('td_thr_copy')}`, onclick: () => copyText(tdThreadText(item), t('td_thr_copied')) }) : null,
      mails ? el('button', { type: 'button', class: 'btn tiny quiet td-thr-rebuild', disabled: !!tdBusy, text: `↻ ${t('td_thr_rebuild')}`, onclick: () => tdRebuildThread(item.id) }) : null),
    tdEmailPicker(item.id));
}
// the summary of every tender shown on the page whose mails were read — one row each, the same facts as its own window
function tdThreadSummary(rows) {
  const L = rows.filter((i) => (i.thread || []).length).map((i) => [i, tenderThreadFacts(i)]);
  if (!L.length) { toast(t('td_sum_none')); return; }
  const short = ([, F]) => F.workDays != null && F.workDays < 5, handed = ([, F]) => !!F.handover;
  crModal({ title: t('td_sum_h'), lead: t('td_sum_lead'), file: 'AFAQY-tender-correspondence', wrap: true, frame: 'md',
    tiles: [[t('td_sum_t_n'), L.length], [t('td_sum_t_msgs'), L.reduce((n, [, F]) => n + F.n, 0)], [t('td_sum_t_short'), L.filter(short).length, t('td_sum_t_short_sub'), (k) => short(L[k])], [t('td_sum_t_hand'), L.filter(handed).length, '', (k) => handed(L[k])]],
    head: [t('td_col_subject'), t('td_sum_c_first'), t('td_sum_c_due'), t('td_sum_c_msgs'), t('td_sum_c_hand')],   // five columns, as every list window (a sixth pushes the table past the window)
    rows: L.map(([i, F]) => [i.subject, F.first ? tdWhenShort(F.first.at) : null,
      F.dueAt ? `${tdWhenShort(F.dueAt)}${F.workDays == null ? '' : ` · ${t('td_sum_wd', { w: F.workDays })}`}` : null,
      `${F.n}${F.last ? ` · ${tdWhenShort(F.last.at)}` : ''}`,
      F.handover ? `${tdWhenShort(F.handover.at)}${F.leadMin == null ? '' : ` · ${t(F.leadMin < 0 ? 'td_sum_after' : 'td_sum_before', { s: tdSpan(F.leadMin) })}`}` : null]) });
}
// ---------- v9.58 (ADR-0131): the tender's card — where it stands and what it needs, on one screen ----------
const tdTitle = (s) => String(s || '').replace(/^\s*(((re|fw|fwd|aw|wg)\s*:|رد\s*:|إعادة توجيه\s*:|اعادة توجيه\s*:|تحويل\s*:)\s*)+/i, '').trim() || String(s || '');
const tdNowWall = () => mailWall(new Date().toISOString());
const tdAt = (day, time) => (day ? day + (time ? `T${time}` : '') : '');
// a deadline as a badge: what is left (red under two days, amber under a week) or how long ago it passed
function tdCountdown(at, now) {
  const min = minutesUntil(at, now); if (min == null) return null;
  return min < 0 ? ['red', t('td_b_past', { s: tdSpan(-min) })] : [min <= 2880 ? 'red' : min <= 10080 ? 'amber' : 'ok', t('td_b_left', { s: tdSpan(min) })];
}
const tdBadge = (b) => (b ? el('i', { class: `td-badge td-b-${b[0]}`, text: b[1] }) : null);
const tdDayShort = (at) => (at ? new Date(`${at.slice(0, 10)}T12:00:00Z`).toLocaleDateString(lang === 'ur' ? 'ur-PK' : lang === 'ar' ? 'ar-SA' : 'en-GB', { timeZone: 'UTC', calendar: 'gregory', numberingSystem: 'latn', weekday: 'short', day: 'numeric', month: 'short' }) : '');
const tdSummaryLines = (text) => String(text || '').split(/\r?\n/).map((l) => l.replace(/^\s*(?:[-•*·▪◦]|\d+[.)-])\s*/, '').trim()).filter(Boolean);
function tdStepper(i) {
  const FLOW = ['received', 'screen', 'decide', 'prep', 'ready', 'submitted'], st = i.stage || 'received', closed = TENDER_CLOSED.includes(st);
  // how far a closed tender got before it closed: lost and won went all the way; a missed one as far as its offer got
  const reach = ['won', 'lost'].includes(st) ? 6 : st === 'missed' ? (i.readyOn ? 5 : 4) : st === 'declined' ? 3 : st === 'cancelled' ? 0 : FLOW.indexOf(st);
  return el('ol', { class: 'td-steps', 'aria-label': t('td_col_stage') }, FLOW.flatMap((f, k) => [k ? el('li', { class: `td-step-ln${k <= reach ? ' on' : ''}`, 'aria-hidden': 'true' }) : null,
    el('li', { class: `td-step${k < reach || (closed && k < reach) ? ' done' : ''}${!closed && k === reach ? ' now' : ''}`, ...(!closed && k === reach ? { 'aria-current': 'step' } : {}) },
      el('span', { class: 'td-step-dot', text: k < reach ? '✓' : String(k + 1), 'aria-hidden': 'true' }), el('span', { text: t(`td_st_${f}`) }))]),
    closed ? el('li', { class: `td-step-end td-end-${st}` }, t(`td_st_${st}`)) : null);
}
function tdTimeline(i, now) {
  const hand = tenderHandoverDue(i), handed = tenderHandedAt(i), closed = TENDER_CLOSED.includes(i.stage), dueAt = tdAt(i.due, i.dueTime);
  const key = (at) => (at.length > 10 ? at : `${at}T23:59`);
  const inner = tenderMilestones(i).filter((x) => ['askUp', 'bondCost'].includes(x.key)).map((x) => [x.key, x.day]);   // v9.73: the dates worked out from the platform's
  const pts = [['date', i.date], ...inner, ['handover', hand], ['askDue', tdAt(i.askDue, i.askDueTime)], ['visit', i.visit], ['due', dueAt], ['openAt', i.openAt], ['readyOn', i.readyOn], ['submittedOn', i.submittedOn]]
    .filter(([, at]) => at).sort((a, b) => (key(a[1]) < key(b[1]) ? -1 : key(a[1]) > key(b[1]) ? 1 : 0));
  if (pts.length < 2) return null;
  const late = (k, at) => !closed && key(at) < now && ((k === 'handover' && !handed) || (k === 'due' && !i.submittedOn) || k === 'bondCost' || (k === 'askUp' && tdAt(i.askDue, i.askDueTime) && key(tdAt(i.askDue, i.askDueTime)) >= now));
  const nextAt = pts.findIndex(([, at]) => key(at) >= now);
  const items = pts.map(([k, at], n) => el('li', { class: `td-tl-pt ${late(k, at) ? 'late' : ['readyOn', 'submittedOn'].includes(k) ? 'done' : key(at) < now ? 'past' : n === nextAt ? 'next' : ''}` },
    el('b', { text: tdDayShort(at) }), el('span', { text: t(`td_col_${k}`) }), at.length > 10 ? el('small', { text: at.slice(11) }) : null));
  items.splice(nextAt < 0 ? items.length : nextAt, 0, el('li', { class: 'td-tl-now', 'aria-label': t('td_tl_now') }, el('span', { text: t('td_tl_now') })));
  return el('section', { class: 'td-box td-tl-box' }, el('h3', { text: t('td_card_dates') }), el('ol', { class: 'td-tl' }, items));
}
/** v9.74 (ADR-0144): who the tender is for and how to find it — in the card window's pinned header, beside its stage. */
function tdCardChips(i) {
  const chips = [i.entity, i.etimadNo ? `${t('td_card_etimad')} ${i.etimadNo}` : '', i.owner ? `${t('td_col_owner')}: ${i.owner}` : '', i.site].filter(Boolean);
  return chips.length || i.link ? el('div', { class: 'td-chips td-card-chips' }, chips.map((c) => el('span', { class: 'chip', dir: 'auto', text: c })),
    i.link ? el('a', { class: 'chip et-chip-link', href: i.link, target: '_blank', rel: 'noopener noreferrer', text: `${t('et_page')} ↗` }) : null) : null;
}
function tdCard(i, { field, needsFields, today }) {
  const now = tdNowWall(), st = i.stage || 'received', closed = TENDER_CLOSED.includes(st), dueAt = tdAt(i.due, i.dueTime);
  const hand = tenderHandoverDue(i), handed = tenderHandedAt(i), onTime = tenderHandoverOnTime(i), lead = tenderLead(i), needs = tenderNeeds(i);
  const grey = (text) => ['grey', text], stageNow = grey(t(`td_st_${st}`));
  const tile = (cls, label, big, badge, sub = null) => el('div', { class: `td-tile td-tile-${cls}${badge ? ` td-t-${badge[0]}` : ''}` }, el('small', { text: label }), el('b', { dir: 'auto', text: big }), tdBadge(badge), sub ? el('span', { class: 'hint', text: sub }) : null);
  const money = (v) => `${Number(v).toLocaleString('en')} ${t('td_sar')}`;
  const tiles = el('div', { class: 'td-tiles4' },
    tile('due', t('td_tile_due'), dueAt ? tdWhen(dueAt) : t('td_none_rec'),
      i.submittedOn ? ['ok', t('td_b_submitted', { d: tdWhen(i.submittedOn) })] : closed ? stageNow : dueAt ? tdCountdown(dueAt, now) : grey(t('td_b_fill')),
      i.due ? t('et_due_src', { s: t(`et_src_${i.dateSources?.due || 'none'}`) }) : null),   // v9.60: where the deadline came from — the platform, the booklet, a mail or a hand
    tile('hand', t('td_tile_hand', { n: TENDER_HANDOVER_DAYS }), hand ? tdWhen(hand) : t('td_none_rec'),
      handed ? [onTime === false ? 'red' : 'ok', t(onTime === false ? 'td_b_handed_late' : 'td_b_handed', { d: tdWhen(handed) })] : closed ? stageNow : hand ? tdCountdown(hand, now) : grey(t('td_b_needs_due'))),
    tile('lead', t('td_tile_lead'), lead.workDays == null ? '—' : t('td_wd_n', { n: lead.workDays }),
      lead.workDays == null ? grey(t('td_b_needs_due')) : lead.handoverBeforeArrival ? ['red', t('td_b_before_arrival')] : lead.short ? ['amber', t('td_b_short')] : ['ok', t('td_b_enough')]),
    tile('value', t('td_col_value'), i.value != null && i.value !== '' ? money(i.value) : t('td_none_rec'), null,
      [i.fees != null && i.fees !== '' ? `${t('td_col_fees')}: ${money(i.fees)}` : '', i.bond ? `${t('td_col_bond')}: ${i.bond}` : ''].filter(Boolean).join(' · ') || null));
  // v9.60 (ADR-0132): what Etimad changed on this tender, and — before it is linked — the Etimad tender it may be
  const srcName = (x) => (x ? t(`et_src_${x}`) : t('et_src_none'));
  // v9.62 (ADR-0135): what the latest pull says about this tender — a note, never applied: where it differs, and what the register lacks
  const etX0 = etRadar ? radarFind(i, etRadar.tenders, tdKey) : null, etA = etX0 ? applyEtimad(i, etX0) : null;
  const etDiff = etA ? [...etA.differs, ...etA.filled.filter((f) => ['due', 'askDue', 'openAt', 'fees'].includes(f)).map((f) => ({ field: f, have: '', src: '',
    etimad: f === 'fees' ? String(etX0.fees) : etX0[f] + ((f === 'due' || f === 'askDue') && etX0[`${f}Time`] ? ` ${etX0[`${f}Time`]}` : '') }))] : [];
  const etSug = !String(i.etimadNo || '').trim() && etRadar && !closed ? radarSuggest(i, etRadar.tenders.filter((x) => x.status === 'active'), 2) : [];
  // v9.61 (ADR-0133): Etimad's result for this tender, and the outcome it points to — confirmed by the manager, never set by itself
  const etX = etRadar && String(i.etimadNo || '').trim() ? radarFind(i, etRadar.tenders, tdKey) : null, etRes = etX ? radarResult(etX.ref, etRadar) : null, etOut = tenderOutcome(i, etRes);
  const etResLine = etRes && etRes.winner ? el('p', { class: 'et-res-line' }, el('span', { text: t('et_res_winner', { w: bidi(etRes.winner.name), v: etRes.winner.value != null ? tdMoney(etRes.winner.value) : t('et_novalue'), n: etRes.n }) }),
    etRes.us ? el('span', { text: ' ' + (etRes.us.tech === 'fail' ? t('et_res_us_fail', { p: etRes.us.price != null ? tdMoney(etRes.us.price) : '—' }) : t('et_res_us', { p: etRes.us.price != null ? tdMoney(etRes.us.price) : '—', r: etRes.usRank || '—', n: etRes.usOf })) }) : null) : null;
  const etOutBtn = etOut ? el('p', { class: 'et-out' }, el('b', { text: t(etOut.stage === 'won' ? 'et_out_won' : 'et_out_lost') }), ' ',
    el('button', { type: 'button', class: 'btn tiny primary et-out-btn', disabled: !!tdBusy, text: t(etOut.stage === 'won' ? 'et_out_won_btn' : 'et_out_lost_btn'), onclick: async () => {
      const reason = etOut.stage === 'lost' ? (etOut.usTech === 'fail' ? t('et_lost_tech', { w: etOut.winner, v: etOut.value != null ? tdMoney(etOut.value) : t('et_novalue') }) : t('et_lost_reason', { w: etOut.winner, v: etOut.value != null ? tdMoney(etOut.value) : t('et_novalue'), p: etOut.usPrice != null ? tdMoney(etOut.usPrice) : '—', r: etOut.rank || '—', n: etOut.of })) : '';
      const patch = { stage: etOut.stage, stageAt: tdToday(), ...(reason ? { reason: reason.slice(0, 300) } : {}), ...(etOut.stage === 'won' && (i.value == null || i.value === '') && etOut.value != null ? { value: etOut.value } : {}) };
      if (await tdUpdate(i.id, patch, tdActivity('stage', t('et_out_act', { s: t(`td_st_${etOut.stage}`) })))) { toast(t('et_out_done')); renderTenders(); } } })) : null;
  // v9.62 (ADR-0134): a won tender is executed in «My projects»; the work start comes from Etimad when it publishes one
  const etExec = st === 'won' ? el('p', { class: 'et-exec' }, el('span', { text: i.workStart ? t('et_exec_set', { d: tdWhen(i.workStart) }) : etX0 && etX0.workStart ? t('et_exec', { d: tdWhen(etX0.workStart) }) : t('et_exec_nodate') }), ' ',
    el('button', { type: 'button', class: 'btn tiny et-exec-open', text: `🗂 ${t('et_exec_open')}`, onclick: () => tdToProjects(i) })) : null;
  const etBox = etDiff.length || etSug.length || etResLine || etExec ? el('section', { class: 'td-box et-card' }, etExec, etResLine, etOutBtn,
    etDiff.length ? el('p', { class: 'et-was', text: t('et_note', { at: etRadar.pulledAt ? tdWhen(etRadar.pulledAt) : '—', list: etDiff.map((d) => (d.have ? t('et_note_item', { f: t(`td_col_${d.field}`), v: bidi(d.etimad), h: bidi(d.have), src: srcName(d.src) }) : t('et_note_empty', { f: t(`td_col_${d.field}`), v: bidi(d.etimad) }))).join(lang === 'en' ? '; ' : '؛ ') }) }) : null,
    etSug.map((x) => el('p', { class: 'et-sug' }, el('span', { text: t('et_card_sug', { e: bidi(x.title.slice(0, 100)), r: x.ref, d: x.due ? tdDateText(x.due, x.dueTime) : '—' }) }), ' ',
      el('button', { type: 'button', class: 'btn tiny et-link', disabled: !!tdBusy, text: t('et_link'), onclick: () => etLink(i.id, x.ref) })))) : null;
  const lines = tdSummaryLines(i.studySummary), thread = i.thread || [];
  const last = [...thread.filter((e) => e.at), ...thread.filter((e) => !e.at)].slice(-3).reverse();
  const sumBox = el('section', { class: 'td-box td-sum-box' }, el('h3', { text: t('td_card_sum') }),
    i.studyDecision ? el('p', { class: `td-study-dec td-dec-${i.studyDecision}`, text: t('td_study_dec', { d: t(`td_dec_${i.studyDecision.replace('-', '')}`), why: bidi(i.studyWhy || '—'), at: String(i.studyAt || '').slice(0, 10) }) }) : null,
    closed && i.reason ? el('p', { class: 'td-card-reason', text: t('td_card_reason', { r: bidi(i.reason) }) }) : null,
    lines.length ? el('ul', { class: 'td-sum-list' }, lines.slice(0, 6).map((l) => el('li', { dir: 'auto', text: l }))) : el('p', { class: 'hint', text: t('td_card_nosum') }),
    lines.length > 6 ? el('button', { type: 'button', class: 'btn tiny quiet', text: t('td_card_more_sum', { n: lines.length - 6 }), onclick: () => tdOpenFold('data') }) : null);
  const msgBox = el('section', { class: 'td-box td-msg-box' }, el('h3', { text: t('td_card_msgs') }),
    last.length ? last.map((e) => el('div', { class: 'td-card-msg' }, el('div', {}, el('b', { text: tdWhen(e.at) }), ' ', el('span', { class: 'td-thr-who', dir: 'auto', text: e.name || e.addr || '—' })),
      el('p', { dir: 'auto', title: mailGist(e.text, 400), text: mailGist(e.text, 140) || t('td_thr_notext') }))) : el('p', { class: 'hint', text: t('td_thr_none') }),
    thread.length ? el('button', { type: 'button', class: 'btn tiny quiet td-card-all', text: t('td_card_all_msgs', { n: thread.length }), onclick: () => tdOpenFold('thread') }) : null);   // a mail is linked by dropping it anywhere on the window, or from the correspondence fold
  const reviews = TENDER_DATE_FIELDS.filter((k) => !i[k]);
  const needBox = el('section', { class: 'td-box td-need-box' }, el('h3', { text: t('td_card_needs_h') }),
    el('p', { class: `td-needs ${needs.length ? 'some' : 'none'}`, text: needs.length ? t('td_needs_line', { n: needs.length, list: needs.map((k) => t(`td_col_${k}`)).join(lang === 'en' ? ', ' : '، ') }) : t('td_needs_none') }),
    needsFields.length ? el('div', { class: 'td-grid td-need-grid' }, needsFields.map((k) => field(i, k))) : null, tdDateReview(i, reviews));
  const files = (i.files || []).filter((f) => f.kind !== 'original'), label = (k) => t(tdFileKind[k] || `td_file_${k}`);
  const fileChips = [...['booklet', 'boq', 'study', 'offer', 'technical', 'financial', 'sheet', 'proof', 'other'].map((k) => { const n = files.filter((f) => f.kind === k && !tdIsMailPicture(f)).length; return n ? el('span', { class: 'chip td-fchip', text: n > 1 ? `${label(k)} (${n})` : label(k) }) : null; }),
    files.some(tdIsMailPicture) ? el('span', { class: 'chip td-fchip quiet', text: t('td_card_imgs', { n: files.filter(tdIsMailPicture).length }) }) : null,
    ['prep', 'ready', 'missed'].includes(st) && !tenderCanAdvance(i, 'ready') ? el('span', { class: 'chip td-fchip td-fmiss', text: t('td_card_no_offer') }) : null].filter(Boolean);
  const fileBox = el('section', { class: 'td-box td-file-box' }, el('h3', { text: t('td_file_title', { n: (i.files || []).length }) }),
    fileChips.length ? el('div', { class: 'td-chips' }, fileChips) : el('p', { class: 'hint', text: t('proj_f_none') }), tdFileAdd(i),
    (i.files || []).length ? el('button', { type: 'button', class: 'btn tiny quiet td-card-files', text: t('td_card_all_files'), onclick: () => tdOpenFold('files') }) : null);
  const dataFields = tenderShownFields(i).filter((k) => !needsFields.includes(k));
  const study = tdStudyInput(i.id);
  // v9.74 (ADR-0144): what can be done with the tender comes first; what is missing and the files before the summary and the mails
  const acts = el('div', { class: 'row td-card-acts' },
      anStartBtn(i),
      el('button', { type: 'button', class: 'btn tiny td-copy-sum', text: `📋 ${t('td_copy_sum')}`, onclick: () => copyText(tdTenderText(i), t('td_copied_sum')) }),
      el('button', { type: 'button', class: 'btn tiny td-team-msg', text: `📋 ${t('td_team_copy')}`, onclick: () => copyText(tdTeamText(i), t('td_team_copied')) }),
      el('a', { class: 'btn tiny td-team-mail', href: `mailto:${TD_FROM}?subject=${encodeURIComponent(t('td_fd_subject', { s: tdTitle(i.subject) }))}&body=${encodeURIComponent(tdTeamText(i))}`, text: `✉ ${t('td_team_mail')}` }),
      el('button', { type: 'button', class: 'btn tiny td-ics', disabled: !(i.askDue || i.visit || i.due || i.openAt), text: `📅 ${t('td_ics')}`, onclick: () => { const b = new Blob([tdIcs(i)], { type: 'text/calendar' }), u = URL.createObjectURL(b); const x = el('a', { href: u, download: `tender-${(i.etimadNo || i.date).replace(/[^\w-]/g, '')}.ics` }); document.body.append(x); x.click(); x.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); } }),
      el('button', { type: 'button', class: 'btn tiny quiet', text: `📊 ${t('td_study_import_one')}`, onclick: () => study.click() }), study,
      el('span', { class: 'hint td-card-from', dir: 'auto', text: i.from }),
      el('button', { type: 'button', class: 'btn tiny quiet', disabled: !!tdBusy, text: `✕ ${t('td_del')}`, onclick: async () => { if (!confirm(t('td_del_confirm', { s: i.subject }))) return; try { await tdCommit({ ...tenders, items: tenders.items.filter((x) => x.id !== i.id) }); renderTenders(); } catch { toast(t('td_store_failed')); } } }));
  return el('div', { class: 'td-detail td-card' }, acts,
    tdStepper(i), tiles, etBox, tdTimeline(i, now),
    el('div', { class: 'td-cols' }, needBox, fileBox),
    el('div', { class: 'td-cols' }, sumBox, msgBox),
    el('div', { class: 'td-folds' },
      tdFold('data', t('td_fold_data', { n: dataFields.length }), el('div', { class: 'td-grid' }, dataFields.map((k) => field(i, k))),
        tdDateReview(i, TENDER_DATE_FIELDS.filter((k) => i[k])),
        el('label', { class: 'td-lab td-study-lab' }, el('span', { text: t('td_study_summary') }), el('textarea', { class: 'td-study-text', rows: 4, maxlength: 4000, dir: 'auto', disabled: !!tdBusy,
          placeholder: t('td_study_placeholder'), onchange: async (event) => { if (await tdUpdate(i.id, { studySummary: event.target.value.trim() }, tdActivity('study', ''))) renderTenders(); } }, i.studySummary || ''))),
      etRadar ? tdMarketFold(i, etX, etRes) : null, tdThreadPanel(i), tdFold('files', t('td_fold_files', { n: (i.files || []).length }), tdInsightsPanel(i), ...tdFilesList(i)), anBox(i), tdInquiries(i), tdHistory(i)));
}
// the questions raised to the entity: the branch cannot see them on the platform, so they are written down here with their answers
const tdInqDrafts = new Map();
function tdInquiries(item) {
  const list = item.inquiries || [], waiting = list.filter((q) => !q.answer && !q.answeredOn).length;
  const save = async (next, act = null) => { const cur = tenders.items.find((r) => r.id === item.id); if (!cur || tdBusy) return; if (await tdUpdate(item.id, { inquiries: next }, act)) renderTenders(); };
  const edit = (q, patch) => save((tenders.items.find((r) => r.id === item.id).inquiries || []).map((x) => (x.id === q.id ? { ...x, ...patch } : x)));
  // what is being typed survives the window redrawing itself (a file finishing its reading, a field saved elsewhere)
  const box = el('textarea', { class: 'td-inq-new', rows: 2, maxlength: 600, dir: 'auto', 'aria-label': t('td_inq_new'), placeholder: t('td_inq_ph'), oninput: (e) => tdInqDrafts.set(item.id, e.target.value) }, tdInqDrafts.get(item.id) || '');
  return tdFold('inq', t('td_inq_h', { n: list.length, o: waiting }), el('p', { class: 'hint', text: t('td_inq_lead') }),
    list.map((q, k) => el('div', { class: `td-inq${q.answer || q.answeredOn ? ' td-inq-done' : ''}` },
      el('p', { class: 'td-inq-q', dir: 'auto' }, el('b', { text: `${k + 1}. ` }), q.text),
      el('div', { class: 'row td-inq-row' },
        el('label', { class: 'td-lab' }, el('span', { text: t('td_inq_asked') }), el('input', { type: 'date', class: 'td-inq-asked', value: q.askedOn, disabled: !!tdBusy, onchange: (e) => edit(q, { askedOn: e.target.value }) })),
        el('label', { class: 'td-lab' }, el('span', { text: t('td_inq_answered') }), el('input', { type: 'date', class: 'td-inq-answered', value: q.answeredOn, disabled: !!tdBusy, onchange: (e) => edit(q, { answeredOn: e.target.value }) })),
        el('button', { type: 'button', class: 'icon-btn td-inq-del', text: '✕', title: t('proj_delete'), 'aria-label': `${t('proj_delete')} ${k + 1}`, disabled: !!tdBusy, onclick: () => { if (confirm(t('td_inq_del_q'))) save(list.filter((x) => x.id !== q.id)); } })),
      el('label', { class: 'td-lab' }, el('span', { text: t('td_inq_answer') }), el('textarea', { class: 'td-inq-ans', rows: 2, maxlength: 1500, dir: 'auto', disabled: !!tdBusy,
        onchange: (e) => { const v = e.target.value.trim(); edit(q, { answer: v, answeredOn: q.answeredOn || (v ? tdToday() : '') }); } }, q.answer || '')))),
    el('div', { class: 'td-inq-add' }, box, el('button', { type: 'button', class: 'btn tiny td-inq-add-btn', disabled: !!tdBusy, text: `＋ ${t('td_inq_add')}`,
      onclick: () => { const v = box.value.trim(); if (!v) { box.focus(); return; } tdInqDrafts.delete(item.id); save([...list, { id: crypto.randomUUID(), text: v.slice(0, 600), askedOn: '', answeredOn: '', answer: '' }], tdActivity('inq', v.slice(0, 120))); } })));
}
// the tender in a few lines, to paste anywhere — the same facts the card shows
function tdTenderText(i) {
  const hand = tenderHandoverDue(i), handed = tenderHandedAt(i), lead = tenderLead(i), dueAt = tdAt(i.due, i.dueTime), th = i.thread || [];
  const lines = [tdTitle(i.subject), [i.entity, i.etimadNo ? `${t('td_card_etimad')} ${i.etimadNo}` : '', `${t('td_col_stage')}: ${t(`td_st_${i.stage}`)}`, i.owner ? `${t('td_col_owner')}: ${i.owner}` : ''].filter(Boolean).join(' · '), '',
    `${t('td_col_date')}: ${tdWhen(i.date)}`, `${t('td_tile_due')}: ${dueAt ? tdWhen(dueAt) : t('td_none_rec')}`,
    `${t('td_tile_hand', { n: TENDER_HANDOVER_DAYS })}: ${hand ? tdWhen(hand) : t('td_none_rec')}${handed ? ` — ${t(tenderHandoverOnTime(i) === false ? 'td_b_handed_late' : 'td_b_handed', { d: tdWhen(handed) })}` : ''}`,
    `${t('td_tile_lead')}: ${lead.workDays == null ? '—' : lead.workDays}${lead.short ? ` (${t('td_b_short')})` : ''}`];
  if (i.value != null && i.value !== '') lines.push(`${t('td_col_value')}: ${Number(i.value).toLocaleString('en')} ${t('td_sar')}`);
  if (i.reason) lines.push(`${t('td_col_reason')}: ${i.reason}`);
  const sum = tdSummaryLines(i.studySummary); if (i.studyDecision || sum.length) lines.push('', t('td_card_sum'), ...(i.studyDecision ? [`${t('td_col_studyDecision')}: ${t(`td_dec_${i.studyDecision.replace('-', '')}`)}${i.studyWhy ? ` — ${i.studyWhy}` : ''}`] : []), ...sum.map((l) => `- ${l}`));
  const last = th.filter((e) => e.at).slice(-3); if (last.length) lines.push('', t('td_card_msgs'), ...last.map((e) => `- ${tdWhen(e.at)} — ${e.name || e.addr || '—'}: ${mailGist(e.text, 200) || t('td_thr_notext')}`));
  const needs = tenderNeeds(i); if (needs.length) lines.push('', `${t('td_card_needs_h')}: ${needs.map((k) => t(`td_col_${k}`)).join(lang === 'en' ? ', ' : '، ')}`);
  return lines.join('\n');
}
// the message to the tenders team: the dates, the time the tender gives, what to raise to the entity and what we are missing
function tdTeamText(i) {
  const hand = tenderHandoverDue(i), lead = tenderLead(i), dueAt = tdAt(i.due, i.dueTime), q = i.inquiries || [], needs = tenderNeeds(i);
  const toAsk = q.filter((x) => !x.askedOn && !x.answer), waiting = q.filter((x) => x.askedOn && !x.answer && !x.answeredOn);
  const out = [t('td_fd_hello'), '', t('td_fd_arrived', { s: tdTitle(i.subject), no: i.etimadNo ? t('td_fd_no', { n: i.etimadNo }) : '', d: tdWhen(i.date) })];
  if (dueAt) out.push(`- ${t('td_fd_due', { d: tdWhen(dueAt) })}`);
  if (hand) out.push(`- ${t('td_fd_hand', { d: tdWhen(hand), n: TENDER_HANDOVER_DAYS })}`);
  if (lead.workDays != null) out.push(`- ${t('td_fd_days', { n: lead.workDays })}`);
  if (i.visit) out.push(`- ${t('td_fd_visit', { d: tdWhen(i.visit) })}`);
  if (lead.short) out.push('', t('td_fd_short'));
  if (toAsk.length) out.push('', t('td_fd_ask_h'), ...toAsk.map((x, k) => `${k + 1}. ${x.text}`));
  if (waiting.length) out.push('', t('td_fd_wait_h'), ...waiting.map((x, k) => `${k + 1}. ${x.text} (${t('td_inq_asked')}: ${tdWhen(x.askedOn)})`));
  if (needs.length) out.push('', `${t('td_fd_need_h')} ${needs.map((k) => t(`td_col_${k}`)).join(lang === 'en' ? ', ' : '، ')}`);
  out.push('', t('td_fd_end'));
  return out.join('\n');
}
// ---------- v9.58 (ADR-0131): the year's report — what arrived, what we did with it and why, on one page to print or send ----------
const tdEsc = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tdMoney = (v) => `${Math.round(Number(v) || 0).toLocaleString('en')} ${t('td_sar')}`;
function tdYearRows(R) {
  return R.rows.map((i) => { const lead = tenderLead(i), on = tenderHandoverOnTime(i);
    return [tdTitle(i.subject), i.entity || '—', i.date, i.due ? tdAt(i.due, i.dueTime).replace('T', ' ') : '—', lead.workDays == null ? '—' : String(lead.workDays),
      on == null ? '—' : t(on ? 'td_yr_ontime' : 'td_yr_late'), t(`td_st_${i.stage}`), i.value != null && i.value !== '' ? Number(i.value).toLocaleString('en') : '—', i.reason || '']; });
}
const tdYearHead = () => [t('td_col_subject'), t('td_col_entity'), t('td_col_date'), t('td_tile_due'), t('td_tile_lead'), t('td_yr_hand_col'), t('td_col_stage'), t('td_col_value'), t('td_col_reason')];
function tdYearSections(R) {
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
  return {
    tiles: [[t('td_yr_in'), R.n], [t('td_yr_joined'), R.joined, pct(R.joined, R.n)], [t('td_yr_sub'), R.submitted], [t('td_st_won'), R.won, R.winRate == null ? t('td_k_norate') : t('td_yr_rate', { r: R.winRate })], [t('td_st_missed'), R.missed], [t('td_st_declined'), R.declined]],
    lines: [t('td_yr_value', { a: tdMoney(R.value.all), s: tdMoney(R.value.submitted), w: tdMoney(R.value.won), k: R.value.known, n: R.n }),
      R.lead.known ? t('td_yr_lead', { d: R.lead.avgWorkDays, s: R.lead.short, n: R.lead.known }) : t('td_yr_lead_none'),
      R.handover.known ? t('td_yr_hand', { o: R.handover.onTime, k: R.handover.known, n: TENDER_HANDOVER_DAYS }) : t('td_yr_hand_none', { n: TENDER_HANDOVER_DAYS }),
      t('td_yr_open', { n: R.open, l: R.lost, c: R.cancelled })],
    reasons: ['missed', 'lost', 'declined', 'cancelled'].filter((k) => R.reasons[k].length).map((k) => [t(`td_st_${k}`), R.reasons[k].map((x) => [tdTitle(x.subject), x.reason || t('td_yr_noreason')])]),
    months: [[t('td_col_month'), t('td_yr_in'), t('td_yr_joined'), t('td_yr_sub'), t('td_st_won'), t('td_st_missed')], ...R.months.map((m) => [periodLabel(m.month), m.n, m.joined, m.submitted, m.won, m.missed])],
    entities: [[t('td_col_entity'), t('td_yr_in'), t('td_yr_sub'), t('td_st_won')], ...R.entities.map((e) => [e.entity || t('td_none_rec'), e.n, e.submitted, e.won])],
    funnel: R.funnel ? [[t('et_fun_pub'), R.funnel.publishedWest, t('et_fun_pub_sub', { k: R.funnel.published })], [t('et_fun_reached'), R.funnel.reached, pct(R.funnel.reached, R.funnel.publishedWest)],
      [t('et_fun_decided'), R.funnel.decided, pct(R.funnel.decided, R.funnel.reached)], [t('et_fun_sub'), R.funnel.submitted, pct(R.funnel.submitted, R.funnel.decided)], [t('et_fun_won'), R.funnel.won, pct(R.funnel.won, R.funnel.submitted)]] : null,
    funnelNote: R.funnel ? t('et_fun_note', { n: R.funnel.covered.length, l: R.funnel.linked }) + (R.funnel.partial ? ` ${t('et_partial')}` : '') : '',
  };
}
function tdYearHtml(R) {
  const S = tdYearSections(R), dir = lang === 'en' ? 'ltr' : 'rtl';
  const table = (rows) => `<table><thead><tr>${rows[0].map((h) => `<th>${tdEsc(h)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map((r) => `<tr>${r.map((c) => `<td dir="auto">${tdEsc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><title>${tdEsc(t('td_yr_h', { y: R.year }))}</title><style>
body{font-family:-apple-system,"Segoe UI",Tahoma,"Noto Sans Arabic",Arial,sans-serif;color:#0F2231;margin:28px;line-height:1.6}h1{font-size:22px;margin:0}h2{font-size:15px;color:#0E7C86;margin:22px 0 8px;border-bottom:1px solid #DBE2E8;padding-bottom:4px}
.sub{color:#5A6B78;font-size:13px;margin:2px 0 16px}.tiles{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.tile{border:1px solid #DBE2E8;border-radius:8px;padding:8px 10px}.tile b{display:block;font-size:22px}.tile span{font-size:12px;color:#5A6B78}
ul{margin:4px 0;padding-inline-start:20px}table{border-collapse:collapse;width:100%;font-size:12.5px;margin-top:6px}th,td{border:1px solid #DBE2E8;padding:5px 7px;text-align:start;vertical-align:top}th{background:#EEF1F4}
@media print{body{margin:12mm}h2{break-after:avoid}tr{break-inside:avoid}}</style></head><body>
<h1>${tdEsc(t('td_yr_h', { y: R.year }))}</h1><p class="sub">${tdEsc(t('td_yr_made', { d: tdWhen(tdNowWall()) }))}</p>
<div class="tiles">${S.tiles.map(([l, v, x]) => `<div class="tile"><b>${tdEsc(v)}</b><span>${tdEsc(l)}${x ? ` · ${tdEsc(x)}` : ''}</span></div>`).join('')}</div>
${S.funnel ? `<h2>${tdEsc(t('et_fun_h'))}</h2><div class="tiles">${S.funnel.map(([l, v, x]) => `<div class="tile"><b>${tdEsc(v)}</b><span>${tdEsc(l)}${x ? ` · ${tdEsc(x)}` : ''}</span></div>`).join('')}</div><p class="sub">${tdEsc(S.funnelNote)}</p>` : ''}
<h2>${tdEsc(t('td_yr_glance'))}</h2><ul>${S.lines.map((l) => `<li>${tdEsc(l)}</li>`).join('')}</ul>
${S.reasons.length ? `<h2>${tdEsc(t('td_yr_why'))}</h2>${S.reasons.map(([h, L]) => `<p><b>${tdEsc(h)} (${L.length})</b></p><ul>${L.map(([s, r]) => `<li dir="auto">${tdEsc(s)} — ${tdEsc(r)}</li>`).join('')}</ul>`).join('')}` : ''}
<h2>${tdEsc(t('td_yr_months'))}</h2>${table(S.months)}<h2>${tdEsc(t('td_yr_entities'))}</h2>${table(S.entities)}
<h2>${tdEsc(t('td_yr_all', { n: R.n }))}</h2>${table([tdYearHead(), ...tdYearRows(R)])}</body></html>`;
}
async function tdYearExcel(R) {
  const X = await loadXlsx(), S = tdYearSections(R), wb = X.utils.book_new(), add = (rows, name, cols) => { const ws = X.utils.aoa_to_sheet(rows); ws['!views'] = [{ RTL: lang !== 'en' }]; if (cols) ws['!cols'] = cols.map((w) => ({ wch: w })); X.utils.book_append_sheet(wb, ws, name.slice(0, 30)); };
  add([[t('td_yr_h', { y: R.year })], [], ...(S.funnel ? [[t('et_fun_h')], ...S.funnel.map(([l, v, x]) => [l, v, x || '']), [S.funnelNote], []] : []), ...S.tiles.map(([l, v, x]) => [l, v, x || '']), [], ...S.lines.map((l) => [l])], t('td_yr_sheet_sum'), [40, 12, 24]);
  add([tdYearHead(), ...tdYearRows(R)], t('td_sheet'), [60, 26, 12, 16, 10, 16, 16, 14, 40]);
  add(S.months, t('td_yr_months'), [18, 10, 10, 10, 10, 10]); add(S.entities, t('td_yr_entities'), [40, 10, 10, 10]);
  add([[t('td_col_stage'), t('td_col_subject'), t('td_col_reason')], ...S.reasons.flatMap(([h, L]) => L.map(([sub, r]) => [h, sub, r]))], t('td_yr_why'), [18, 60, 50]);
  X.writeFile(wb, `AFAQY-tenders-${R.year}-report.xlsx`);
}
function tdYearReport(year = null) {
  const items = tenders ? tenders.items : [], years = [...new Set(items.map((i) => i.date.slice(0, 4)))].sort().reverse();
  if (!years.length) { toast(t('td_empty')); return; }
  const y = years.includes(year) ? year : years.includes(tdToday().slice(0, 4)) ? tdToday().slice(0, 4) : years[0], R = tenderYearReport(items, y);
  R.funnel = etRadar ? tenderFunnel(items, etRadar, y, tdKey) : null; const S = tdYearSections(R);   // v9.62: the year from what Etimad published
  const tableEl = (rows, cls) => el('div', { class: `table-wrap td-yr-table ${cls}`, tabindex: '0', role: 'group', 'aria-label': rows[0][0] }, el('table', {}, el('thead', {}, el('tr', {}, rows[0].map((h) => el('th', { text: h })))),
    el('tbody', {}, rows.slice(1).map((r) => el('tr', {}, r.map((c, k) => el('td', { class: k && typeof c === 'number' ? 'num' : '', dir: 'auto', text: String(c) })))))));
  const dl = () => { const u = URL.createObjectURL(new Blob([tdYearHtml(R)], { type: 'text/html' })); const a = el('a', { href: u, download: `AFAQY-tenders-${R.year}-report.html` }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); };
  const dlg = el('dialog', { class: 'cr-modal td-yr-dlg tw tw-md', 'aria-labelledby': 'td-yr-h' },
    twHead(el('h2', { id: 'td-yr-h', text: t('td_yr_h', { y }) }), { cls: 'crm-head', tools: el('div', { class: 'row td-yr-tools' }, el('select', { class: 'td-yr-pick', 'aria-label': t('td_year'), onchange: (e) => { dlg.close(); tdYearReport(e.target.value); } }, years.map((v) => el('option', { value: v, text: v, ...(v === y ? { selected: '' } : {}) }))),
        el('button', { type: 'button', class: 'btn tiny td-yr-html', text: `⬇ ${t('td_yr_dl')}`, onclick: dl }), el('button', { type: 'button', class: 'btn tiny td-yr-xl', text: `⬇ ${t('td_excel')}`, onclick: () => tdYearExcel(R) })) }),
    el('p', { class: 'hint', text: t('td_yr_lead_text') }),
    S.funnel ? el('section', { class: 'td-yr-funnel' }, el('h3', { class: 'td-yr-h3', text: t('et_fun_h') }),
      el('ol', { class: 'et-funnel' }, S.funnel.map(([l, v, x]) => el('li', {}, el('b', { text: String(v) }), el('span', { text: l }), x ? el('small', { class: 'hint', text: x }) : null))),
      el('p', { class: 'hint', text: S.funnelNote })) : null,
    el('div', { class: 'crm-tiles td-yr-tiles' }, S.tiles.map(([l, v, x]) => el('div', { class: 'km-tile' }, el('b', { text: String(v) }), el('span', { text: l }), x ? el('small', { class: 'hint', text: x }) : null))),
    el('h3', { class: 'td-yr-h3', text: t('td_yr_glance') }), el('ul', { class: 'td-yr-lines' }, S.lines.map((l) => el('li', { text: l }))),
    S.reasons.length ? [el('h3', { class: 'td-yr-h3', text: t('td_yr_why') }), ...S.reasons.map(([h, L]) => el('details', { class: 'td-subpanel td-yr-why' }, el('summary', { text: `${h} (${L.length})` }),
      el('ul', {}, L.map(([sub, r]) => el('li', { dir: 'auto', text: `${sub} — ${r}` })))))] : null,
    el('h3', { class: 'td-yr-h3', text: t('td_yr_months') }), tableEl(S.months, 'td-yr-months'),
    el('h3', { class: 'td-yr-h3', text: t('td_yr_entities') }), tableEl(S.entities, 'td-yr-entities'),
    el('h3', { class: 'td-yr-h3', text: t('td_yr_all', { n: R.n }) }), tableEl([tdYearHead(), ...tdYearRows(R)], 'td-yr-all'));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
function tdDownload(file) {
  const url = URL.createObjectURL(file.blob);
  const link = el('a', { href: url, download: file.name }); document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
const tdLocator = (file, locator) => locator ? t(file.analysis?.format === 'pdf' ? 'td_doc_page' : file.analysis?.format === 'sheet' ? 'td_doc_sheet' : 'td_doc_section', {value:locator}) : file.name;
function tdDocumentView(file) {
  const analysis = file.analysis;
  const dlg = el('dialog', {class:'proj-edit td-doc-dialog tw tw-lg'}, twHead(el('h2',{text:file.name,dir:'auto'})),
    el('p',{class:'hint',text:t('td_doc_evidence')}),
    el('p',{class:'hint',text:t(`td_doc_${analysis?.state || 'pending'}`)}),
    ...(analysis?.highlights || []).map(fact => el('div',{class:'td-subpanel'},
      el('b',{text:t(`td_fact_${fact.topic}`)}), el('p',{class:'td-fact-text',dir:'auto',text:fact.text}),
      el('small',{class:'hint',text:tdLocator(file,fact.locator)}))),
    ...(analysis?.tables || []).map(table => el('section',{},el('h3',{dir:'auto',text:table.name || t('td_doc_table')}),
      el('p',{class:'hint',text:t('td_doc_table_limit')}),
      el('div',{class:'table-wrap'},el('table',{class:'td-table'},el('tbody',{},table.rows.map((row,index) => el('tr',{},row.map(cell => el(index ? 'td' : 'th',{text:cell,dir:'auto'}))))))))),
    el('div',{class:'row'},el('button',{type:'button',class:'btn',text:t('proj_f_dl'),onclick:()=>tdDownload(file)}),
      el('button',{type:'button',class:'btn quiet',text:t('close'),onclick:()=>dlg.close()})));
  dlg.addEventListener('close',()=>dlg.remove()); document.body.append(dlg); dlg.showModal();
}
function tdInsightsPanel(item) {
  const files = (item.files || []).filter(file => file.kind !== 'original');
  if (!files.length) return null;
  return el('details',{class:'td-subpanel',open:''},el('summary',{text:t('td_doc_title')}),
    el('p',{class:'hint',text:t('td_doc_evidence')}),
    el('button',{type:'button',class:'btn tiny',disabled:!!tdBusy,text:t('td_doc_read_all'),onclick:()=>tdAnalyzeFiles(item.id,files.map(file=>file.id))}),
    ...files.filter(file => !file.analysis || file.analysis.state !== 'read').map(file => el('p',{class:'hint',dir:'auto',text:file.name+' · '+t(`td_doc_${file.analysis?.state || 'pending'}`)})),
    ...files.flatMap(file => (file.analysis?.highlights || []).slice(0,5).map(fact => el('div',{class:'td-fact'},
      el('b',{text:t(`td_fact_${fact.topic}`)}),el('p',{class:'td-fact-text',text:fact.text,dir:'auto'}),
      el('button',{type:'button',class:'btn tiny quiet',text:fact.locator ? file.name+' · '+tdLocator(file,fact.locator) : file.name,onclick:()=>tdDocumentView(file)})))));
}
// v9.58: the files of a tender in two places with two jobs — adding one sits on the card, the full list in its fold
function tdFileAdd(item) {
  const kinds = TENDER_FILE_KINDS.filter((kind) => kind !== 'original');
  const label = (kind) => t(tdFileKind[kind] || ('td_file_' + kind));
  const pick = el('input', { type: 'file', multiple: '', hidden: true, onchange: async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    const current = tenders.items.find((row) => row.id === item.id);
    if (!files.length || !current || tdBusy) return;
    const selected = kind.value;
    // v9.55: the same file means the same thing wherever it is added. The analyzer's study fills the tender, and a file added
    // as «final offer» makes it ready — until now only a drop did that, and a phone cannot drop.
    if (selected === 'offer') { await tdAddFilesAs(item.id, files, 'offer'); return; }
    const studies = [], plain = [];
    if (selected === 'auto' || selected === 'study') for (const f of files) (await tdIsStudyFile(f) ? studies : plain).push(f); else plain.push(...files);
    if (studies.length) await tdImportStudies(studies, item.id);
    const now = tenders.items.find((row) => row.id === item.id);
    if (!plain.length || !now) return;
    const upload = plain.map((file) => ({...tdNewFile(file, selected === 'auto' ? 'other' : selected),kindManual:selected !== 'auto'}));
    if (await tdUpdate(item.id, { files: [...(now.files || []), ...upload] }, tdActivity('add', plain.map((file) => file.name).join(', ')))) {
      renderTenders(); await tdAnalyzeFiles(item.id,upload.map(file => file.id));
    }
  } });
  const kind = el('select', { class: 'td-pick', 'aria-label': t('td_file_type'),disabled:!!tdBusy },
    el('option',{value:'auto',text:t('td_file_auto')}), kinds.map((k) => el('option', { value: k, text: label(k) })));
  return el('div', { class: 'row td-file-controls' }, kind, el('button', { type: 'button', class: 'btn tiny', disabled: !!tdBusy, text: t('td_file_add'), onclick: () => pick.click() }), pick,
    ['technical', 'financial'].map((key) => el('button', { type: 'button', class: 'btn tiny quiet', disabled: !!tdBusy,
      text: '＋ ' + label(key), onclick: () => { kind.value = key; pick.click(); } })));
}
const tdIsMailPicture = (file) => !!file.mailKey && file.kind === 'other' && /\.(?:png|jpe?g|gif|bmp|webp)$/i.test(file.name);   // signatures and logos the mail carried
function tdFilesList(item) {
  const kinds = TENDER_FILE_KINDS.filter((kind) => kind !== 'original');
  const label = (kind) => t(tdFileKind[kind] || ('td_file_' + kind));
  const showFile = (file) => {
    const original = file.kind === 'original';
    return el('div', { class: 'pf-item td-file' },
      el('span', { class: 'pf-ico', text: original ? '✉' : '📎', 'aria-hidden': 'true' }),
      el('div', { class: 'pf-meta' }, el('b', { text: file.name, dir: 'auto', title: file.name }),
        original ? el('small', { class: 'hint', text: label(file.kind) }) : el('select',{class:'td-file-kind','aria-label':t('td_file_type')+' '+file.name,disabled:!!tdBusy,onchange:async event=>{
          const current = tenders.items.find(row=>row.id===item.id); if (!current || tdBusy) return;
          const files = current.files.map(entry=>entry.id===file.id ? {...entry,kind:event.target.value,kindManual:true,kindAt:new Date().toISOString()} : entry);
          if (!await tdUpdate(item.id,{files},tdActivity('category',file.name))) { renderTenders(); return; }
          // v9.55: naming a file «final offer» is the same act as adding one
          if (event.target.value === 'offer') { const res = tdStudyResult && tdStudyResult.moves ? tdStudyResult : tdNewResult(); await tdAutoMove(item.id, { type: 'offer' }, res); if (res.moves.length) tdStudyResult = res; }
          renderTenders();
        }},kinds.map(k=>el('option',{value:k,text:label(k),selected:k===file.kind}))),
        !original ? el('small',{class:'hint',text:t(`td_doc_${file.analysis?.state || 'pending'}`)}) : null),
      original ? null : el('button',{type:'button',class:'btn tiny td-file-view',text:t('td_doc_view'),onclick:()=>tdDocumentView(file)}),
      el('button', { type: 'button', class: 'icon-btn', text: '⬇', title: t('proj_f_dl'), 'aria-label': t('proj_f_dl') + ' ' + file.name, onclick: () => tdDownload(file) }),
      original ? null : el('button', { type: 'button', class: 'icon-btn', text: '✕', title: t('proj_delete'), 'aria-label': t('proj_delete') + ' ' + file.name, onclick: async () => {
        const current = tenders.items.find((row) => row.id === item.id);
        if (!current || tdBusy || !confirm(t('proj_f_del_q', { n: file.name }))) return;
        const files = (current.files || []).filter((entry) => entry.id !== file.id);
        const dated = applyTenderEmailDates({...current,files});
        if (await tdUpdate(item.id, { files, removedFiles: [...(current.removedFiles || []), file.id], ...tenderDatePatch(dated) }, tdActivity('remove', file.name))) renderTenders();
      } }));
  };
  const files = item.files || [];
  const filter = tdFileFilters.get(item.id) || {kind:'all',query:'',limit:40};
  // the pictures a mail carried (signatures, logos) come last, folded together: they are kept, not read
  const ordered = [...TENDER_FILE_KINDS.flatMap((kind) => files.filter((file) => file.kind === kind && !tdIsMailPicture(file))), ...files.filter(tdIsMailPicture)]
    .filter(file=>(filter.kind==='all'||file.kind===filter.kind)&&tdNorm(file.name).includes(tdNorm(filter.query)));
  const search = el('input',{type:'search',value:filter.query,placeholder:t('td_file_search'),'aria-label':t('td_file_search')});
  const fileFilters = el('form',{class:'row td-file-controls',onsubmit:event=>{event.preventDefault();tdFileFilters.set(item.id,{...filter,query:search.value,limit:40});renderTenders();}},
    el('select',{'aria-label':t('td_file_filter'),onchange:event=>{tdFileFilters.set(item.id,{...filter,kind:event.target.value,limit:40});renderTenders();}},
      ['all',...TENDER_FILE_KINDS].map(k=>el('option',{value:k,text:k==='all'?t('td_file_all'):label(k),selected:k===filter.kind}))),search,
    el('button',{type:'submit',class:'btn tiny',text:t('td_file_search')}),el('span',{class:'hint',text:t('td_file_count',{n:ordered.length,all:files.length})}));
  const shown = ordered.slice(0, filter.limit), pics = shown.filter(tdIsMailPicture);
  return [fileFilters,
    shown.length ? el('div', { class: 'pf-list' }, shown.filter((f) => !tdIsMailPicture(f)).map(showFile),
      pics.length ? el('details', { class: 'td-pics' }, el('summary', { text: t('td_card_imgs', { n: pics.length }) }), pics.map(showFile)) : null) : el('p', { class: 'hint', text: t('proj_f_none') }),
    ordered.length > filter.limit ? el('button',{type:'button',class:'btn tiny',text:t('td_file_more'),onclick:()=>{tdFileFilters.set(item.id,{...filter,limit:filter.limit+40});renderTenders();}}) : null,
    (item.messages || []).map((mail) => el('div', {}, el('p', { class: 'hint', dir: 'auto', text: [mail.subject, mail.sender, mail.date].filter(Boolean).join(' · ') }), mail.warnings ? el('p', { class: 'hint', text: t('td_mail_warnings') }) : null))];
}
function tdDateReview(item, which = TENDER_DATE_FIELDS) {   // v9.58: the card asks only about empty dates; a date already chosen can be changed in «All data»
  return TENDER_DATE_FIELDS.filter((field) => which.includes(field)).map((field) => {
    const dates = tenderDeadlineCandidates(item, field);
    if (!dates.length) return null;
    return el('div', { class: 'td-subpanel' }, el('strong', { text: t('td_date_review', { date: t(`td_col_${field}`) }) }),
      el('div', { class: 'row td-file-controls' }, dates.map((candidate) => el('div',{},el('button', { type: 'button', class: 'btn tiny', disabled: !!tdBusy,
        text: t('td_date_pick', { date: tdDateText(candidate.date, candidate.time) }), onclick: async () => {
          const current = tenders.items.find((row) => row.id === item.id);
          if (tdBusy || !current) return;
          if (await tdUpdate(item.id, { [field]: candidate.date, [field+'Time']: candidate.time, dateSources: {...current.dateSources, [field]: 'manual'} },
            tdActivity('date', tdDateText(candidate.date, candidate.time)))) renderTenders();
        } }),el('small',{class:'td-date-source hint',dir:'auto',text:candidate.sources.map(source=>source.label+(source.locator?' · '+source.locator:'')).join(' / ')})))));
  });
}
// a Saudi wall time «YYYY-MM-DDTHH:MM» (or a day) as the manager reads it: the Gregorian day, then the time
const tdWallText = (at) => { const s = String(at || ''); if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return ''; const [y, m, d] = s.slice(0, 10).split('-'); return `${d}/${m}/${y}${s.length > 10 ? ` · ${s.slice(11, 16)}` : ''}`; };
function tdHistory(item) {
  return tdFold('history', t('td_history'),
    el('p', { class: 'hint', text: t('td_history_first', { date: item.date }) }),
    // v9.86 (ADR-0153): oldest first, each line at the time it happened — a mail at the mail's own time, with who wrote it
    tenderHistory(item).map((entry) => el('div', { class: `td-history-entry td-h-${entry.action}`, title: entry.logged && entry.logged !== entry.at ? t('td_history_logged', { at: tdWallText(entry.logged) }) : null },
      el('small', { class: 'td-h-at', dir: 'ltr', text: tdWallText(entry.at) }),
      el('span', { dir: 'auto', text: entry.action === 'email' && entry.who ? t('td_history_mail', { who: entry.who, value: entry.label })
        : t(`td_history_${entry.action}`, { value: entry.action === 'stage' ? t(`td_st_${entry.label}`) : entry.label }) }))));
}
// v9.58: the folds under a tender's card stay as the manager left them while he works on it; a new window starts with them closed
const tdFoldSet = new Set(); let tdFoldsFor = null;
function tdFold(id, title, ...content) {
  return el('details', { class: `td-subpanel td-fold td-fold-${id}`, ...(tdFoldSet.has(id) ? { open: '' } : {}), ontoggle: (e) => { if (e.target.open) tdFoldSet.add(id); else tdFoldSet.delete(id); } },
    el('summary', { text: title }), ...content);
}
function tdOpenFold(id) {
  tdFoldSet.add(id); renderTenders();
  const f = tdDlg && tdDlg.querySelector(`.td-fold-${id}`); if (f) { f.open = true; pagerReveal(tdDlg, f); f.querySelector('summary')?.focus({ preventScroll: true }); }   // v9.74: on its page when the card is in pages
}

// v9.74 (ADR-0144): «More» behaves as a menu — a click outside it or Escape closes it (a window opened from it keeps it as it is)
document.addEventListener('click', (e) => { const d = document.querySelector('#tenders-body details.td-how[open]:not(.td-how-inline)');
  if (d && !d.contains(e.target) && !(e.target.closest && e.target.closest('dialog'))) d.open = false; });
document.addEventListener('keydown', (e) => { if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
  const d = document.querySelector('#tenders-body details.td-how[open]:not(.td-how-inline)'); if (d) { d.open = false; const sm = d.querySelector('summary'); if (sm) sm.focus(); } });
function renderTenders() {
  const body = $('tenders-body'); if (!body || isTeamPortal) return; const today = saudiDay(new Date().toISOString());
  const up = el('input', { type: 'file', class: 'td-up-in', accept: '.json,.txt,application/json,text/plain', hidden: true, onchange: async (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; await tdTake(await f.text()); } });
  const pst = el('input', { type: 'file', accept: '.pst,.ost', hidden: true, onchange: (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; if (f.size > MF_BROWSER_MAX) { toast(t('td_pst_big', { gb: (f.size / 1073741824).toFixed(1) })); return; } tdFromPst(f); } });   // ADR-0096: a file the browser cannot hold is not tried
  const dIn2 = (cls, val, on) => el('input', { type: 'date', class: cls, 'aria-label': t(cls === 'td-from' ? 'td_from' : 'td_to'), value: val, max: today, onchange: (e) => on(e.target.value) });
  const empty = !tenders || !tenders.items.length;
  // ADR-0085: one compact bar — the period and the five actions; how each way works is folded, open only while the register is empty
  // v9.74 (ADR-0144): one command card — register a tender (drop or choose its mail, or any file), the radar and the market,
  // and «More» for what is used now and then; what the last action said sits under it.
  const howReports = el('div', { class: 'td-how-reports' });   // the period's reports and messages, filled once its rows are known
  const pull = el('section', { class: `dt-quick td-pull td-cmd${empty ? ' td-cmd-empty' : ''}` },
    el('div', { class: 'td-cmd-intake' }, el('div', { class: 'td-pull-head' }, el('h2', { text: t('td_pull_h') }), tenders && tenders.pulledAt ? el('span', { class: 'hint', text: t('td_last', { to: tenders.to || '—', n: tenders.items.length }) }) : null),
      tdEmailPicker(), mdBox = el('div', { class: 'td-dir' }, mdRow())),   // v9.75 (ADR-0145): the mail folder Power Automate fills
    (() => { const any = el('input', { type: 'file', multiple: '', hidden: true, onchange: (e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) void tdRouteDrop(fs, null); } });
      return el('p', { class: 'hint td-drop-any' }, el('span', { text: `⤓ ${t('td_drop_any')}` }), ' ', el('button', { type: 'button', class: 'btn tiny td-any-btn', disabled: !!tdBusy, text: t('td_any_pick'), onclick: () => any.click() }), any,
        empty ? null : el('button', { type: 'button', class: 'btn tiny td-rr-btn', disabled: !!tdBusy, title: t('td_rr_reading'), text: `📑 ${t('td_rr')}`, onclick: () => { void tdReread(); } })); })(),   // v9.77
    el('div', { class: 'td-cmd-tools' }, (() => { const R = etRadar, act = R ? R.tenders.filter((x) => etOpenNow(x) && x.scope && !etIgnored().has(x.ref)).length : 0;   // v9.60 (ADR-0132)
      return el('p', { class: 'td-radar-line' }, el('button', { type: 'button', class: 'btn td-radar-btn', disabled: !!tdBusy, text: `📡 ${t('et_title')}${R ? ` · ${t('et_btn_n', { n: act })}` : ''}`, onclick: etOpen }), ' ',
        R ? el('button', { type: 'button', class: 'btn td-market-btn', disabled: !!tdBusy, text: `📊 ${t('mk_btn')}`, onclick: mkOpen }) : null, ' ',
        el('span', { class: 'hint', text: R ? t('et_btn_at', { at: R.pulledAt ? tdWhen(R.pulledAt) : '—' }) : t('et_btn_none') })); })(),
      // v9.55: the page is built around the least-touch flow — drop (or choose) the mail, the study, the final offer. Every other
      // way in, the one setting and the period's reports sit in «More»: open in the card while the register is empty, a menu
      // once it holds tenders — closed when the page opens, kept open while the page redraws (ADR-0144).
      el('details', { class: `td-how${empty ? ' td-how-inline' : ''}`, ...(empty || tdMoreOpen ? { open: '' } : {}), ontoggle: (e) => { if (!empty) tdMoreOpen = e.target.open; } },
        el('summary', { class: 'td-how-btn', title: t('td_more'), text: empty ? t('td_more') : `⋯ ${t('td_more_btn')}` }),
        el('div', { class: 'td-how-panel' }, empty ? null : el('h3', { class: 'td-how-h', text: t('td_more') }), howReports,
          el('label', { class: 'td-owner-def' }, el('span', { class: 'hint', text: t('td_owner_def') }), el('input', { type: 'text', class: 'td-owner-in', value: pref('tdowner') || '', placeholder: t('td_owner_ph'), onchange: async (e) => { pref('tdowner', e.target.value.trim().slice(0, 80)); if (tenders) { await tdCommit(tenders); renderTenders(); } } })),
          el('div', { class: 'td-actions' },
        el('button', { type: 'button', class: 'btn td-add-btn', disabled: !!tdBusy, text: `＋ ${t('td_add')}`, onclick: tdAddManual }),
        (() => { const inp = tdStudyInput(); return el('span', {}, el('button', { type: 'button', class: 'btn td-study-btn', disabled: !!tdBusy, text: `📊 ${t('td_study_import')}`, onclick: () => inp.click() }), inp); })()),
          el('div', { class: 'td-way' }, el('h3', { text: t('td_way_claude') }), el('p', { class: 'hint', text: t('td_pull_lead', { from: tdFrom || tdDefaultFrom() }) }),
        el('div', { class: 'row td-period' }, el('span', { text: t('td_from') }), dIn2('td-from', tdFrom || tdDefaultFrom(), (v) => { tdFrom = v; }), el('span', { text: t('td_to') }), dIn2('td-to', tdTo || today, (v) => { tdTo = v; })),
        el('div', { class: 'td-actions' },
          el('button', { type: 'button', class: 'btn primary td-copy', text: `📋 ${t('td_copy')}`, onclick: () => copyText(tdPrompt(), t('td_copied')) }),
          el('a', { class: 'btn td-bm', href: tdBookmarklet(), title: t('td_bm_hint'), onclick: (e) => { e.preventDefault(); toast(t('td_bm_hint')); }, text: `📌 ${t('td_bm')}` }),
          el('button', { type: 'button', class: 'btn', disabled: !!tdBusy, text: `⬆ ${t('td_upload')}`, onclick: () => up.click() }), up,
          el('button', { type: 'button', class: 'btn td-paste-btn', disabled: !!tdBusy, text: `📥 ${t('td_paste')}`, onclick: tdPasteDialog })),
        el('p', { class: 'hint', text: t('td_bm_hint') }),
        el('a', { class: 'btn tiny', href: 'https://outlook.office.com/mail/', target: '_blank', rel: 'noopener', text: t('proj_open_outlook') })),
          el('div', { class: 'td-way' }, el('h3', { text: t('td_way_pst') }), el('p', { class: 'hint', text: t('td_pst_lead') }),
        el('button', { type: 'button', class: 'btn td-pst-btn', disabled: !!tdBusy, text: `📂 ${t('td_pst_pick')}`, onclick: () => pst.click() }), pst),
          el('div', { class: 'td-way' }, el('h3', { text: t('td_way_manual') }), el('p', { class: 'hint', text: t('td_manual_lead') }))))),
    el('div', { class: 'td-cmd-status' }, etResult ? el('div', { role: 'status', class: 'td-study-res et-res' },
      el('button', { type: 'button', class: 'icon-btn td-study-close', text: '✕', title: t('td_res_close'), 'aria-label': t('td_res_close'), onclick: () => { etResult = null; renderTenders(); } }),
      el('p', { class: 'hint', text: etResult.read ? t('et_done', { k: etResult.kept, n: etResult.total, c: etResult.found }) : t('et_bad', { list: etResult.bad.join(' · ') }) }),
      etResult.read ? el('p', { class: 'hint et-merged', text: t('et_merged', { a: etResult.added, u: etResult.updated, t: etResult.all }) }) : null,
      etResult.partial ? el('p', { class: 'note', text: t('et_partial') }) : null,
      etResult.bad.length && etResult.read ? el('p', { class: 'note', text: t('et_bad', { list: etResult.bad.join(' · ') }) }) : null,
      el('button', { type: 'button', class: 'btn tiny', text: t('et_open_radar'), onclick: etOpen })) : null,
      tdStudyResult ? el('div', { role: 'status', class: 'td-study-res' },
      el('button', { type: 'button', class: 'icon-btn td-study-close', text: '✕', title: t('td_res_close'), 'aria-label': t('td_res_close'), onclick: () => { tdStudyResult = null; renderTenders(); } }),
      el('p', { class: 'hint', text: t('td_study_done', { n: tdStudyResult.fields, m: tdStudyResult.tenders, d: tdStudyResult.differs.length, u: tdStudyResult.unmatched.length }) }),
      // v9.55: a tender's Arabic name inside an English sentence took the whole line's direction with it («dir: auto» reads the
      // first strong letter) — the sentence came out back to front. The line keeps the page's direction; the name is isolated.
      (tdStudyResult.fixed || []).map((x) => el('p', { class: 'note td-study-fix', text: t('td_study_hijri', { s: bidi(x.subject.slice(0, 80)), f: t(`td_col_${x.field}`), w: bidi(x.was), h: bidi(x.hijri), v: bidi(x.now) }) })),   // v9.60
      (tdStudyResult.skipped || []).map((x) => el('p', { class: 'note td-study-skip', text: t('td_study_skip', { s: bidi(x.subject.slice(0, 80)), list: x.fields.map((k) => t(`td_col_${k}`)).join(' · ') }) })),
      tdStudyResult.differs.length ? el('ul', { class: 'td-study-diff' }, tdStudyResult.differs.slice(0, 30).map((d) => el('li', { text: t('td_study_diff', { s: bidi(d.subject), f: t(`td_col_${d.field}`), h: bidi(d.have), v: bidi(d.study) }) }))) : null,
      tdStudyResult.unmatched.length ? el('p', { class: 'note', text: t('td_study_unmatched', { list: tdStudyResult.unmatched.slice(0, 10).map(bidi).join(' · ') }) }) : null,
      tdStudyResult.bad.length ? el('p', { class: 'note', text: t('td_study_bad', { list: tdStudyResult.bad.map(bidi).join(' · ') }) }) : null,
      (tdStudyResult.nosheet || []).length ? el('p', { class: 'note', text: t('td_study_nosheet', { list: tdStudyResult.nosheet.map(bidi).join(' · ') }) }) : null,
      (tdStudyResult.moves || []).map((m) => el('p', { class: 'td-move' }, el('span', { text: t('td_moved', { s: bidi(m.subject.slice(0, 80)), to: t(`td_st_${m.to}`) }) }), ' ',
        el('button', { type: 'button', class: 'btn tiny quiet td-undo', text: t('td_undo'), onclick: async () => { if (await tdUpdate(m.id, m.back, tdActivity('stage', t('td_undone')))) { tdStudyResult.moves = tdStudyResult.moves.filter((x) => x !== m); renderTenders(); } } })))) : null,
      tdMailResult ? el('div', { role: 'status' },
      el('p', { class: 'hint', text: t('td_mail_result', tdMailResult) }),
      tdMailResult.failures.map(({ name, key }) => el('p', { class: 'hint', dir: 'auto', text: [name, t(key)].filter(Boolean).join(' · ') }))) : null,
      (() => { const st = backupState(); if (!st.due || empty) return null;
      return el('p', { class: 'note td-backup' }, el('span', { text: st.days == null ? t('bk_never') : t('bk_old', { n: st.days }) }), ' ', el('button', { type: 'button', class: 'btn tiny td-backup-btn', text: `⬇ ${t('bk_now')}`, onclick: () => $('export-btn').click() })); })(),
      tdBusy ? el('p', { class: 'note td-busy', role: 'status', text: tdBusy }) : null));
  if (!tenders || !tenders.items.length) { set(body, mailSrc('tenders'), pull, el('p', { class: 'note', text: t('td_empty') })); return; }
  const periods = [...new Set(tenders.items.map((i) => tdPeriodOf(i.date, tdKind)))].sort().reverse();
  if (tdKind === 'all') tdPick = 'all'; else if (!periods.includes(tdPick)) tdPick = periods.includes(tdPeriodOf(today, tdKind)) ? tdPeriodOf(today, tdKind) : periods[0];
  const rowsAll = tenders.items.filter((i) => tdKind === 'all' || tdPeriodOf(i.date, tdKind) === tdPick), K = tdKpis(rowsAll, today);
  if (tdStageF && !rowsAll.some((i) => i.stage === tdStageF)) tdStageF = null;
  const CARD = { waiting: (i) => ['received', 'screen', 'decide'].includes(i.stage), soon: (i) => TD_OPEN.includes(i.stage) && tdNextDate(i, today) && tdDaysBetween(today, tdNextDate(i, today)[1]) <= 7, decided: (i) => ['won', 'lost'].includes(i.stage) };
  const stageRows = tdStageF ? rowsAll.filter((i) => i.stage === tdStageF) : tdCardF ? rowsAll.filter(CARD[tdCardF]) : rowsAll;
  const query = tdNorm(tenderDigits(tdQuery));
  const rows = query ? stageRows.filter((i) => [i.subject, i.etimadNo, i.from, i.owner, ...(i.files || []).map((file) => file.name)].some((value) => tdNorm(tenderDigits(value)).includes(query))) : stageRows;
  // ADR-0086: the pipeline — each stage with its count; the lines between run while tenders move through; a stage pulses when something waits there over 3 days
  const stale = (s) => ['received', 'screen', 'decide'].includes(s) && rowsAll.some((i) => i.stage === s && tdDaysBetween(i.stageAt, today) > 3);
  const cnt = (s) => rowsAll.filter((i) => i.stage === s).length, flow = ['received', 'screen', 'decide', 'prep', 'ready', 'submitted'];
  const node = (s, cls = '') => el('button', { type: 'button', class: `td-pipe-node${cls}${tdStageF === s ? ' sel' : ''}${stale(s) ? ' hot' : ''}${cnt(s) ? '' : ' zero'}`, 'data-stage': s, 'aria-pressed': tdStageF === s ? 'true' : 'false',
    title: t('td_pipe_hint'), onclick: () => { tdStageF = tdStageF === s ? null : s; tdCardF = null; renderTenders(); } }, el('b', { text: String(cnt(s)) }), el('span', { text: t(`td_st_${s}`) }));
  const pipe = el('div', { class: 'td-pipe', role: 'group', 'aria-label': t('td_pipe') },
    flow.flatMap((s, k) => [k ? el('span', { class: `td-pipe-line${flow.slice(k).some((x) => cnt(x)) && flow.slice(0, k).some((x) => cnt(x)) ? ' on' : ''}`, 'aria-hidden': 'true' }) : null, node(s)]),
    el('span', { class: 'td-pipe-sep', 'aria-hidden': 'true' }), ['won', 'lost', 'missed', 'declined', 'cancelled'].map((s) => node(s, ` td-pipe-end td-end-${s}`)));
  const kinds = el('div', { class: 'pills' }, [['month', 'td_month'], ['quarter', 'td_quarter'], ['year', 'td_year'], ['all', 'td_all']].map(([k, l]) =>
    el('button', { type: 'button', class: `pill-btn${tdKind === k ? ' on' : ''}`, text: t(l), onclick: () => { tdKind = k; pref('tdkind', k); tdPick = ''; renderTenders(); } })));
  const pick = tdKind === 'all' ? null : el('select', { class: 'td-pick', 'aria-label': t('td_period'), onchange: (e) => { tdPick = e.target.value; renderTenders(); } }, periods.map((k) => el('option', { value: k, text: tdLabel(k), ...(k === tdPick ? { selected: '' } : {}) })));
  const tile = (cls, n, l, sub, f) => el('button', { type: 'button', class: `km-tile crm-tile-f ${cls}${(f === 'all' ? !tdCardF && !tdStageF : tdCardF === f) ? ' on' : ''}`, 'aria-pressed': String(f === 'all' ? !tdCardF && !tdStageF : tdCardF === f), 'data-card': f,
    title: t(f === 'all' ? 'crm_show_all' : tdCardF === f ? 'crm_f_off' : 'crm_f_on'), onclick: () => { if (f === 'all') { tdCardF = null; tdStageF = null; } else { tdCardF = tdCardF === f ? null : f; tdStageF = null; } renderTenders(); } },
    el('b', { text: String(n) }), el('span', { text: t(l) }), sub ? el('small', { class: 'hint', text: sub }) : null);

  const cd = (i) => { const nx = tdNextDate(i, today); if (!nx || !TD_OPEN.includes(i.stage)) return el('span', { class: 'hint', text: '—' }); const d = tdDaysBetween(today, nx[1]);
    return el('span', { class: `chip td-cd ${d <= 3 ? 'td-red' : d <= 7 ? 'td-amber' : 'td-green'}`, title: tdDateText(nx[1], i[nx[0]+'Time']), text: `${t(`td_col_${nx[0]}`)}: ${t('td_in_days', { n: d })}` }); };
  const fld = (i, k, type = 'text', extra = {}) => el('input', { type, class: `td-f td-${k}${tenderNeeds(i).includes(k) ? ' td-need' : ''}`, value: i[k] == null ? '' : String(i[k]), dir: 'auto', 'aria-label': t(`td_col_${k}`), ...extra,
    disabled: !!tdBusy, onchange: async (e) => {
      const v = e.target.value;
      if (k === 'date' && !v) { e.target.value = i.date; return; }
      const patch = { [k]: type === 'number' ? (v === '' ? null : Number(v)) : v.trim() };
      if (i.fieldSources && i.fieldSources[k]) { const fs = { ...i.fieldSources }; delete fs[k]; patch.fieldSources = fs; }   // typed by hand: no longer the analyzer's
      const field = TENDER_DATE_FIELDS.find((field) => k === field || k === field+'Time');
      if (field) {
        if (k === field && !v) patch[field+'Time'] = '';
        patch.dateSources = { ...i.dateSources, [field]: 'manual' };
      }
      if (k === 'date') { patch.dateSource = 'manual'; tdPick = tdPeriodOf(v, tdKind); }
      await tdUpdate(i.id, patch, field || k === 'date' ? tdActivity('date', v) : null);
      renderTenders();
    } });
  // v9.47: a field the stage still needs is marked «to fill»; a date the portal read itself says where it came from
  const lab = (k, node, i = null) => { const need = i && tenderNeeds(i).includes(k), src = i && i[k] && i.dateSources ? i.dateSources[k] : '';
    return el('label', { class: `td-lab${need ? ' td-lab-need' : ''}` }, el('span', {}, t(`td_col_${k}`), need ? el('b', { class: 'td-need-tag', text: t('td_need_tag') }) : null,
      ['mail', 'document'].includes(src) ? el('i', { class: 'td-auto-tag', text: t(src === 'mail' ? 'td_auto_mail' : 'td_auto_doc') }) : null,
      i && i[k] != null && i[k] !== '' && (src === 'etimad' || (i.fieldSources && i.fieldSources[k] === 'etimad')) ? el('i', { class: 'td-auto-tag td-auto-et', title: i.etimadAt ? t('et_tag_at', { at: tdWhen(i.etimadAt) }) : '', text: t('et_tag') }) : null,   // v9.60
      i && i[k] != null && i[k] !== '' && (src === 'analyzer' || (i.fieldSources && i.fieldSources[k] === 'analyzer')) ? el('i', { class: 'td-auto-tag td-auto-an', title: (() => { const e = i.evidence && i.evidence[k]; return e ? `${e.file}${e.page ? ` · ${t('td_page', { p: e.page })}` : ''}${e.quote ? ` — «${e.quote}»` : ''}` : ''; })(), text: t('td_auto_an') }) : null,
      (() => { const c = i && dateCheckTag(i, k); if (!c) return null;   // v9.84 (ADR-0151): the second model's reading of this date
        const by = t(`an_by_${c.by}`), d = `\u2066${c.other}\u2069`;   // isolated, so right-to-left text never turns the date around
        return el('i', { class: `td-auto-tag td-chk td-chk-${c.kind}`, title: c.kind === 'agree' ? t('td_chk_agree_t', { by }) : t('td_chk_bad_t', { by, d }),
          text: c.kind === 'agree' ? t('td_chk_agree') : t(c.kind === 'differ' ? 'td_chk_differ' : 'td_chk_missing', { d }) }); })()), node); };
  const stageSel = (i) => el('select', { class: 'td-stage', disabled: !!tdBusy, 'aria-label': t('td_col_stage'), onchange: async (e) => { const st = e.target.value, patch = { stage: st, stageAt: today };
      // ADR-0128: nothing the manager fills by hand blocks a stage — offer files and the reason are optional
      if (TD_NEED_REASON.includes(st)) { const r = window.prompt(t(st === 'lost' ? 'td_why_lost' : st === 'missed' ? 'td_why_missed' : 'td_why_declined'), i.reason || ''); if (r == null) { e.target.value = i.stage; return; } if (r.trim()) patch.reason = r.trim().slice(0, 300); }
      if (['prep', 'ready', 'submitted', 'declined', 'missed'].includes(st) && !i.decidedOn) patch.decidedOn = today;
      if (st === 'ready' && !i.readyOn) patch.readyOn = today; if (st === 'submitted' && !i.submittedOn) patch.submittedOn = today;
      patch.status = st === 'ready' ? 'ready' : i.status; await tdUpdate(i.id, patch, tdActivity('stage', st)); renderTenders(); } },
    TD_STAGES.map((s) => el('option', { value: s, text: t(`td_st_${s}`), ...(i.stage === s ? { selected: '' } : {}) })));
  // v9.58 (ADR-0131): a tender's window is one card — where it stands and what it needs on one screen; the rest folds below it.
  const FT = { date: 'date', askDue: 'date', visit: 'date', due: 'date', openAt: 'date', submittedOn: 'date', decidedOn: 'date', readyOn: 'date', workStart: 'date', askDueTime: 'time', dueTime: 'time', value: 'number', fees: 'number' };
  const field = (i, k) => lab(k, fld(i, k, FT[k] || 'text', k === 'date' ? { required: '' } : FT[k] === 'time' ? { disabled: !!tdBusy || !i[k.replace('Time', '')] } : FT[k] === 'number' ? { min: 0, step: 1 } : {}), i);
  // the deadline's hour stays on the card until it is typed: the hand-over date and every margin to the deadline need it
  const detail = (i) => tdCard(i, { field, needsFields: (() => { const n = tenderNeeds(i); return [...n, ...(n.includes('due') || (i.due && !i.dueTime && !TENDER_CLOSED.includes(i.stage)) ? ['dueTime'] : [])]; })(), today });
  const table = el('div', { class: 'table-wrap' }, el('table', { class: 'td-table' },
    el('thead', {}, el('tr', {}, ['td_col_subject', 'td_col_date', 'td_col_stage', 'td_col_days', 'td_col_next', ''].map((k) => el('th', { text: k ? t(k) : '' })))),
    el('tbody', {}, rows.flatMap((i) => { const open = tdOpenId === i.id, days = tdDaysBetween(i.stageAt, today);
      return [el('tr', { 'data-id': i.id, 'data-stage': i.stage, class: `td-row${open ? ' on' : ''}${TD_OPEN.includes(i.stage) ? '' : ' td-closed'}`, tabindex: '0', onkeydown: (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) { tdOpenId = i.id; renderTenders(); } }, onclick: (e) => { if (e.target.closest('select, input, button, a')) return; tdOpenId = i.id; renderTenders(); } },
        el('td', {}, el('div', { class: 'td-subj', text: i.subject, dir: 'auto' }), i.entity ? el('div', { class: 'hint td-row-ent', dir: 'auto', text: i.entity }) : null, el('div', {}, i.messages?.length ? el('span', { class: 'chip', text: t('td_why_email') }) : null, i.byFrom ? el('span', { class: 'chip', text: t('td_why_from') }) : null, i.byKr ? el('span', { class: 'chip', text: t('td_why_kr') }) : null, i.manual ? el('span', { class: 'chip td-manual', text: t('td_why_manual') }) : null, TD_OPEN.includes(i.stage) && tenderLead(i).short ? el('span', { class: 'chip td-short-chip', text: t('td_short_chip', { n: tenderLead(i).workDays }) }) : null, i.etimadNo ? el('span', { class: 'chip', text: i.etimadNo }) : null, tenderNeeds(i).length ? el('span', { class: 'chip td-need-chip', text: t('td_need_n', { n: tenderNeeds(i).length }) }) : null)),
        el('td', { class: 'num' }, i.date, i.dateSource === 'sent' ? el('div', { class: 'hint', text: t('td_sent_date') }) : i.dateSource === 'thread' ? el('div', { class: 'hint', text: t('td_thread_date') }) : null), el('td', {}, stageSel(i)),
        el('td', { class: `num${TD_OPEN.includes(i.stage) && ['received', 'screen', 'decide'].includes(i.stage) && days > 3 ? ' td-wait' : ''}`, text: TD_OPEN.includes(i.stage) ? String(days) : '—', title: t('td_col_days') }),
        el('td', {}, cd(i)), el('td', { class: 'num td-tog', text: '↗', title: t('td_open_win') }))]; }))));
  const search = el('input', { name: 'q', type: 'search', class: 'td-f td-search', value: tdQuery, placeholder: t('td_search'), 'aria-label': t('td_search') });
  const searchForm = el('form', { class: 'row td-file-controls', onsubmit: (event) => {
    event.preventDefault(); tdQuery = search.value; renderTenders();
  } }, search, el('button', { type: 'submit', class: 'btn tiny', text: t('td_search_go') }));
  tdNotify();
  set(body, pull, tdAgenda(today),
    el('section', { class: 'td-overview', 'aria-label': t('td_overview') }, el('div', { class: 'km-tiles td-tiles' },
      tile('km-total', K.n, 'td_k_in_all', t('td_k_in_all_sub'), 'all'), tile(K.waiting ? 'km-other td-hot' : 'km-other', K.waiting, 'td_k_waiting', K.waiting ? t('td_k_waitmax', { d: K.waitMax }) : '', 'waiting'),
      tile('km-email', K.soon, 'td_k_soon', K.late ? t('td_k_late', { n: K.late }) : '', 'soon'), tile('km-points', K.winRate == null ? '—' : `${K.winRate}%`, 'td_k_winrate', K.winRate == null ? t('td_k_norate') : t('td_k_won_of', { w: K.won, n: K.closed }), 'decided')),
      pipe, el('p', { class: 'hint td-kpis', text: t('td_kpi_line', { j: K.joined, n: K.n, d: K.avgDecision == null ? '—' : K.avgDecision, o: K.onTime == null ? '—' : `${K.onTime}%`, v: K.value ? K.value.toLocaleString('en') : '0' }) }),
      // v9.86: the mails written today, by each mail's own day
      (() => { const d = mailsOnDay(tenders?.items, today); return el('p', { class: 'hint td-today-mails', text: d.mails ? t('td_today_mails', { n: d.mails, m: d.tenders }) : t('td_today_none') }); })(),
      // v9.87 (ADR-0154): what in the register is not a tender, or is one tender twice — said here, tidied by the manager
      (() => { const c = tenderCleanup(tenders?.items, tdIsAI); return c.notTenders.length || c.duplicates.length ? el('p', { class: 'td-cl-line' }, el('span', { text: t('td_cl_line', { x: c.notTenders.length, m: c.duplicates.length }) }), ' ',
        el('button', { type: 'button', class: 'btn tiny td-cl-btn', disabled: !!tdBusy, text: t('td_cl_btn'), onclick: () => tdCleanup() })) : null; })()),
    el('div', { class: 'td-listbar' }, el('div', { class: 'row td-filter' }, kinds, pick, searchForm),
      el('div', { class: 'td-list-acts' }, el('button', { type: 'button', class: 'btn tiny td-year-btn', text: `📈 ${t('td_yr_btn')}`, onclick: () => tdYearReport() }),
        el('button', { type: 'button', class: 'btn tiny td-arch-btn', text: `🗄 ${t('td_arch_btn')}`, onclick: () => tdArchiveOpen() }),
        el('button', { type: 'button', class: 'btn tiny', text: `⬇ ${t('td_excel')}`, onclick: () => tdExcel(rows) }),
        el('button', { type: 'button', class: 'btn tiny td-xf-btn', text: `⬇ ${t('td_xf_btn')}`, onclick: () => tdExcelFrom() }))),
    tdStageF ? el('div', { class: 'row td-filtered' }, el('span', { class: 'chip', text: t('td_pipe_on', { s: t(`td_st_${tdStageF}`), n: rows.length }) }), el('button', { type: 'button', class: 'btn tiny quiet', text: `✕ ${t('td_pipe_clear')}`, onclick: () => { tdStageF = null; renderTenders(); } })) : null,
    !tdStageF && tdCardF ? el('div', { class: 'row td-filtered' }, el('span', { class: 'chip', text: t('crm_filtered', { f: t({ waiting: 'td_k_waiting', soon: 'td_k_soon', decided: 'td_k_decided' }[tdCardF]), n: rows.length, all: rowsAll.length }) }), el('button', { type: 'button', class: 'btn tiny quiet', text: t('crm_show_all'), onclick: () => { tdCardF = null; renderTenders(); } })) : null,
    rows.length ? table : el('p', { class: 'note', text: t('td_none_period') }),
    mailSrc('tenders', false));
  set(howReports, el('h4', { text: t('td_how_reports') }), el('div', { class: 'td-how-row' }, el('button', { type: 'button', class: 'btn tiny td-wm', text: `🗓 ${t('td_wm')}`, onclick: () => copyText(tdWeekMessage(), t('td_wm_copied')) }),
    el('a', { class: 'btn tiny td-wm-mail', href: '#', text: `✉ ${t('fl_mail')}`, onclick: (e) => { e.preventDefault(); location.href = `mailto:?subject=${encodeURIComponent(t('td_wm_subject', { a: saudiDay(new Date(Date.now() - 6 * 864e5).toISOString()), b: saudiDay(new Date().toISOString()) }))}&body=${encodeURIComponent(tdWeekMessage())}`; } }),
    el('button', { type: 'button', class: 'btn tiny td-sum-btn', text: `✉ ${t('td_sum_btn')}`, onclick: () => tdThreadSummary(rows) })));
  // v9.47 (ADR-0122): a tender's details open in a window over the list, not as a long panel inside it. The window stays open
  // while a field saves and the list behind redraws; focus returns to the field the manager moved to.
  if (!body.dataset.tdDrop) { body.dataset.tdDrop = '1'; tdDropBind(body, null); }
  const cur = tdOpenId ? (tenders ? tenders.items : []).find((x) => x.id === tdOpenId) : null;
  if (!cur) { if (tdDlg && tdDlg.open) { const d = tdDlg; tdOpenId = null; d.close(); } return; }
  if (!tdDlg) { tdDlg = el('dialog', { class: 'td-dlg tw tw-lg', 'aria-labelledby': 'td-dlg-h' }, twHead(null, { cls: 'td-dlg-head' }), el('div', { class: 'td-dlg-body' }));
    tdDropBind(tdDlg, () => tdOpenId);
    tdDlg.addEventListener('close', () => { if (tdOpenId) { tdOpenId = null; renderTenders(); } }); document.body.append(tdDlg); }
  const box = tdDlg.querySelector('.td-dlg-body'), act = document.activeElement, was = act && tdDlg.contains(act) ? [...act.classList].find((c) => /^td-(?!f$|need$)/.test(c)) : '';
  if (tdFoldsFor !== cur.id || !tdDlg.open) { tdFoldSet.clear(); tdFoldsFor = cur.id; }   // another tender, or the window reopened: its folds start closed
  set(tdDlg.querySelector('.td-dlg-head .tw-titles'), el('h2', { id: 'td-dlg-h', class: 'td-dlg-h', dir: 'auto', title: cur.subject, text: tdTitle(cur.subject) }),
    el('div', { class: 'row td-dlg-top' }, stageSel(cur), el('span', { class: 'hint td-dlg-first', text: `${t('td_col_date')}: ${tdWhen(cur.date)}` }), tdCardChips(cur)),
    // v9.76: while mails or files are being read the card's fields are locked; it says so, and opens again by itself when it ends
    tdBusy ? el('p', { class: 'note td-dlg-busy', role: 'status', text: `⏳ ${t('td_busy_card')}` }) : null);
  set(box, detail(cur));
  if (!tdDlg.open) tdDlg.showModal();
  else if (was) { const again = tdDlg.querySelector(`.${was}`); if (again && !again.disabled) again.focus(); }
}

// ---------- ADR-0090: authorship — who designed and built the portal (not a claim of ownership: built for AFAQY's work) ----------
const AUTHOR = { ar: 'محمد صفوت', en: 'Mohamed Safwat', ur: 'محمد صفوت' };
const HISTORY_SINCE = { ver: 'v5.0', date: '2026-10-29' };   // the first entry of this repository's version history
async function openAbout() {
  const dlg = el('dialog', { class: 'about-dlg', 'aria-labelledby': 'about-h' }, el('h2', { id: 'about-h', text: t('about_h') }),
    el('p', { class: 'about-by' }, el('span', { class: 'about-eyebrow', text: t('about_by') }), el('b', { text: AUTHOR[lang] || AUTHOR.en }), el('span', { class: 'hint', text: t('about_role') })),
    el('dl', { class: 'fl-ctx about-facts' }, el('dt', { text: t('about_ver') }), el('dd', { text: `v${PORTAL_VERSION}` }), el('dt', { text: t('about_started') }), el('dd', { text: t('about_started_v') }), el('dt', { text: t('about_since') }), el('dd', { text: `${HISTORY_SINCE.ver} — ${HISTORY_SINCE.date}` }),
      el('dt', { text: t('about_versions') }), el('dd', { class: 'about-nv', text: '…' }), el('dt', { text: t('about_adrs') }), el('dd', { class: 'about-na', text: '…' })),
    el('p', { class: 'hint', text: t('about_note') }),
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn', text: t('about_news'), onclick: () => { dlg.close(); openNews(); } })));   // the dialog's own top bar closes it
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
  const cnt = async (req, re) => { try { const r = await req; if (!r.ok) return null; const s = await r.text(); return new Set(s.match(re) || []).size; } catch { return null; } };   // the site's own files, read only; distinct entries
  // ADR-0107: the counts come with version.json (written when the site is built) — the changelog and the decisions are not public
  const vc = await fetch('./version.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const nv = vc && vc.counts ? vc.counts.versions : null, na = vc && vc.counts ? vc.counts.decisions : null;
  const q = (c, v) => { const x = dlg.querySelector(c); if (x) x.textContent = v == null ? '—' : String(v); }; q('.about-nv', nv); q('.about-na', na);
}
// ---------- ADR-0090: a control-room number opens its detail — tiles, a bar per engineer, the list, Excel ----------
/** A number's window: tiles, bars, the list, Excel. ADR-0102: a tile with a filter (its 4th item, (k) => bool on row k) or a person's bar
 *  narrows the list, the bars, the count and Excel to its rows; a second click clears it. bar: (k) => [name, weight] for row k. */
function crModal({ title, lead, tiles = [], bars = [], bar = null, head = [], rows = [], hot = () => false, file, wrap = false, frame = '' }) {   // frame (v9.74): a tender register list takes its windows' frame   // wrap (v9.57): cells that hold a sentence wrap instead of pushing the columns after them out of sight
  const st = { tile: -1, who: '', q: '' };
  // v9.68 (ADR-0140): every list window is searched as you type, by any word or number in a row; the search joins what a tile or a bar narrowed
  let hay = null, qTm = 0;
  const words = () => { const q = txFold(st.q).trim(); if (q && !hay) hay = rows.map((r) => txFold(r.map((c) => (c == null ? '' : String(c))).join(' '))); return q; };
  const keep = () => { const q = words(); return rows.map((r, k) => k).filter((k) => (st.tile < 0 || !tiles[st.tile][3] || tiles[st.tile][3](k)) && (!st.who || (bar && bar(k)[0] === st.who)) && (!q || hay[k].includes(q))); };
  const label = () => [st.tile >= 0 ? tiles[st.tile][0] : '', st.who, st.q.trim() ? `«${st.q.trim()}»` : ''].filter(Boolean).join(' · ');
  const search = rows.length > 1 ? el('input', { type: 'search', class: 'crm-q', placeholder: t('crm_q'), 'aria-label': t('crm_q'), oninput: (e) => { st.q = e.target.value; clearTimeout(qTm); qTm = setTimeout(() => draw(), 200); } }) : null;
  const xl = async () => { const ks = keep(), X = await loadXlsx(), ws = X.utils.aoa_to_sheet([head, ...ks.map((k) => rows[k])]); ws['!views'] = [{ RTL: lang !== 'en' }]; ws['!cols'] = head.map((h, k) => ({ wch: k === 0 ? 50 : 16 })); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, title.slice(0, 30)); X.writeFile(wb, `${file}${label() ? '-filtered' : ''}-${saudiDay(new Date().toISOString())}.xlsx`); };
  const tilesBox = tiles.length ? el('div', { class: 'crm-tiles' }) : null, barsBox = el('div', { class: 'crm-bars', role: 'group', 'aria-label': t('crm_bars') }), info = el('div', { class: 'crm-filter', hidden: true }), listBox = el('div');
  const draw = () => {
    const ks = keep(), on = st.tile >= 0 || st.who || !!st.q.trim();
    if (tilesBox) set(tilesBox, tiles.map(([l, v, s, f], ti) => f ? el('button', { type: 'button', class: `km-tile crm-tile-f${st.tile === ti ? ' on' : ''}`, 'aria-pressed': String(st.tile === ti), title: t(st.tile === ti ? 'crm_f_off' : 'crm_f_on'), onclick: () => { st.tile = st.tile === ti ? -1 : ti; draw(); } },
      el('b', { text: String(v) }), el('span', { text: l }), s ? el('small', { class: 'hint', text: s }) : null)
      : el('div', { class: 'km-tile' }, el('b', { text: String(v) }), el('span', { text: l }), s ? el('small', { class: 'hint', text: s }) : null)));
    const B = bar ? [...ks.reduce((m, k) => { const [n, w] = bar(k); m.set(n, (m.get(n) || 0) + (+w || 0)); return m; }, new Map())].map(([n, v]) => [n, Math.round(v * 10) / 10]).sort((p, q) => q[1] - p[1]) : bars, max = Math.max(1, ...B.map((b) => b[1]));
    barsBox.hidden = !B.length; set(barsBox, B.slice(0, 15).map(([n, v], k) => el(bar ? 'button' : 'div', { type: bar ? 'button' : null, class: `crm-bar${bar ? ' crm-bar-f' : ''}${st.who === n ? ' on' : ''}`, 'aria-pressed': bar ? String(st.who === n) : null, title: bar ? t(st.who === n ? 'crm_f_off' : 'crm_f_who') : null, onclick: bar ? () => { st.who = st.who === n ? '' : n; draw(); } : null },
      el('span', { class: 'crm-n', text: n }), el('span', { class: 'crm-track' }, el('i', { style: `--w:${(v / max) * 100}%;animation-delay:${k * 40}ms` })), el('b', { text: String(v) }))));
    info.hidden = !on; if (on) set(info, el('span', { text: t('crm_filtered', { f: label(), n: ks.length, all: rows.length }) }), el('button', { type: 'button', class: 'btn tiny quiet', text: t('crm_show_all'), onclick: () => { st.tile = -1; st.who = ''; st.q = ''; if (search) search.value = ''; draw(); } })); else set(info);   // «Show all» exists only while something is filtered
    const shown = ks.slice(0, 300);
    set(listBox, el('div', { class: `table-wrap crm-list${wrap ? ' crm-wrap' : ''}`, tabindex: wrap ? '0' : null, role: wrap ? 'group' : null, 'aria-label': wrap ? title : null }, el('table', {}, el('thead', {}, el('tr', {}, head.map((h) => el('th', { text: h })))),
      el('tbody', {}, shown.map((k) => el('tr', { class: hot(rows[k], k) ? 'crm-hot' : '' }, rows[k].map((c, ci) => el('td', { class: ci ? 'num' : '', dir: 'auto', text: c == null ? '—' : String(c) }))))))),
      ks.length > shown.length ? el('p', { class: 'hint', text: t('crm_more', { n: ks.length - shown.length }) }) : null, !ks.length ? el('p', { class: 'empty', text: t('crm_none') }) : null);
  };
  const xlBtn = el('button', { type: 'button', class: 'btn tiny crm-xl', text: `⬇ ${t('td_excel')}`, onclick: xl }), head2 = el('h2', { id: 'crm-h', text: title });
  const dlg = el('dialog', { class: `cr-modal${frame ? ` tw tw-${frame}` : ''}`, 'aria-labelledby': 'crm-h' },
    frame ? twHead(head2, { cls: 'crm-head', tools: xlBtn }) : el('div', { class: 'crm-head' }, head2, xlBtn),
    lead ? el('p', { class: 'hint', text: lead }) : null, tilesBox, (tiles.some((x) => x[3]) || bar) ? el('p', { class: 'hint crm-how', text: t('crm_how') }) : null, barsBox, search ? el('div', { class: 'row crm-find' }, search) : null, info, listBox);
  draw(); dlg.addEventListener('close', () => { clearTimeout(qTm); dlg.remove(); }); document.body.append(dlg); dlg.showModal();
}

// ---------- ADR-0093: three mail pulls, each said plainly where it lives — what it answers, where it goes in, where it shows ----------
const MAIL_SRC = {
  pst: { ic: '📨', go: () => { location.hash = '#mailfile'; } },
  projects: { ic: '🗂', go: () => { location.hash = '#me'; setTimeout(() => { projView = 'mail'; projOpen(); }, 300); } },
  tenders: { ic: '📑', go: () => { location.hash = '#tenders'; } } };
// v9.55: once the page holds data the explanation is one line that opens — it used to fill the whole first screen of a phone,
// above the work, on every visit. With nothing on the page yet it is open: that is when it is needed.
function mailSrc(kind, open = true) {
  const other = Object.keys(MAIL_SRC).filter((k) => k !== kind);
  return el('details', { class: `mail-src mail-src-${kind}`, 'aria-label': t('msrc_aria'), ...(open ? { open: '' } : {}) },
    el('summary', { class: 'msrc-head' }, el('span', { class: 'msrc-ic', 'aria-hidden': 'true', text: MAIL_SRC[kind].ic }), el('b', { text: t(`msrc_${kind}_name`) }), el('span', { class: 'chip msrc-n', text: t('msrc_one_of') })),
    el('dl', { class: 'msrc-dl' }, el('dt', { text: t('msrc_answers') }), el('dd', { text: t(`msrc_${kind}_q`) }), el('dt', { text: t('msrc_in') }), el('dd', { text: t(`msrc_${kind}_in`) }),
      el('dt', { text: t('msrc_shows') }), el('dd', { text: t(`msrc_${kind}_out`) }), el('dt', { text: t('msrc_not') }), el('dd', {}, other.map((k, n) => [n ? ' · ' : '', el('button', { type: 'button', class: 'linkish', text: `${MAIL_SRC[k].ic} ${t(`msrc_${k}_name`)}`, onclick: MAIL_SRC[k].go })]))));
}

// ---------- ADR-0094: «نبض الفريق» — the month's closes, day by day, drawn like a live trace ----------
function teamPulse(doneM, doneP, onDay, hasPrev) {   // hasPrev: last month pulled whole — otherwise no comparison (ADR-0087)
  const today = saudiDay(new Date().toISOString()), y = +today.slice(0, 4), m = +today.slice(5, 7), d = +today.slice(8, 10);
  const len = new Date(Date.UTC(y, m, 0)).getUTCDate(), plen = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
  const per = (list, n) => { const c = Array(n + 1).fill(0); for (const x of list) { const k = +saudiDay(x.completedAt).slice(8, 10); if (k >= 1 && k <= n) c[k]++; } return c; };
  const cur = per(doneM, len), prev = per(doneP, plen), top = Math.max(4, ...cur.slice(1, d + 1), ...(hasPrev ? prev.slice(1) : []));
  const narrow = innerWidth < 640, W = narrow ? 420 : 1000, H = narrow ? 210 : 170, P = 14, axFs = Math.ceil(13.5 * W / Math.max(300, Math.min(innerWidth - 40, 1180)));   // phone: taller; day numbers never under 12px
  const _u = 0, X = (k) => P + ((k - 1) / (len - 1)) * (W - 2 * P), Y = (v) => H - 22 - (v / top) * (H - 46);
  const pts = (arr, upTo) => Array.from({ length: upTo }, (_, i) => [X(i + 1), Y(arr[i + 1] || 0)]);
  const smooth = (p) => p.length < 2 ? '' : p.reduce((s, [x, yy], i) => { if (!i) return `M${x},${yy}`; const [x0, y0] = p[i - 1], cx = (x0 + x) / 2; return `${s} C${cx},${y0} ${cx},${yy} ${x},${yy}`; }, '');
  const cp = pts(cur, d), pp = pts(prev, Math.min(plen, len)), line = smooth(cp), area = cp.length ? `${line} L${cp[cp.length - 1][0]},${H - 22} L${cp[0][0]},${H - 22} Z` : '';
  const NS = 'http://www.w3.org/2000/svg', S = (tag, at = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); return e; };
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'tp-svg', role: 'img', 'aria-label': t('tp_aria', { n: cur.slice(1, d + 1).reduce((s, v) => s + v, 0) }) });
  const defs = S('defs'), g = S('linearGradient', { id: 'tp-fill', x1: 0, y1: 0, x2: 0, y2: 1 });
  g.append(S('stop', { offset: '0%', 'stop-color': 'var(--live-bright)', 'stop-opacity': '.32' }), S('stop', { offset: '100%', 'stop-color': 'var(--live-bright)', 'stop-opacity': '0' })); defs.append(g); svg.append(defs);
  for (let k = 1; k <= len; k++) { const wd = new Date(Date.UTC(y, m - 1, k)).getUTCDay(); if (wd === 5 || wd === 6) svg.append(S('rect', { class: 'tp-weekend', x: X(k) - (W - 2 * P) / (len - 1) / 2, y: 8, width: (W - 2 * P) / (len - 1), height: H - 30 })); }
  for (let v = 0; v <= 1; v += 0.5) svg.append(S('line', { class: 'tp-grid', x1: P, x2: W - P, y1: Y(top * v), y2: Y(top * v) }));
  if (hasPrev && pp.length > 1) svg.append(S('path', { class: 'tp-prev', d: smooth(pp) }));
  if (area) svg.append(S('path', { class: 'tp-area', d: area, fill: 'url(#tp-fill)' }));
  if (line) svg.append(S('path', { class: 'tp-line', d: line, pathLength: '1' }));
  const guide = S('line', { class: 'tp-guide', y1: 8, y2: H - 22, x1: -10, x2: -10 }); svg.append(guide);
  if (cp.length) { const [lx, ly] = cp[cp.length - 1]; svg.append(S('circle', { class: 'tp-ring', cx: lx, cy: ly, r: 6 }), S('circle', { class: 'tp-ring tp-ring2', cx: lx, cy: ly, r: 6 }), S('circle', { class: 'tp-dot', cx: lx, cy: ly, r: 5 })); }
  for (let k = 1; k <= len; k += (len > 28 ? 7 : 7)) { const tx = S('text', { class: 'tp-ax', x: X(k), y: H - 6, 'text-anchor': 'middle', 'font-size': axFs }); tx.textContent = String(k); svg.append(tx); }
  const show = (k) => { if (k < 1 || k > len) return; guide.setAttribute('x1', X(k)); guide.setAttribute('x2', X(k)); const future = k > d;
    const r = svg.getBoundingClientRect(), px = r.left + (X(k) / W) * r.width, py = r.top + (Y(cur[k] || 0) / H) * r.height;   // ADR-0101: the one tooltip, beside the day's point
    showTip(tipPoint(px, py, 10), future ? t('tp_tip_future', { d: k }) : t('tp_tip', { d: k, n: cur[k], p: hasPrev && k <= plen ? prev[k] : '—' }), svg); };
  const dayAt = (e) => { const r = svg.getBoundingClientRect(), fx = ((e.clientX - r.left) / r.width) * W; return Math.max(1, Math.min(len, Math.round(((fx - P) / (W - 2 * P)) * (len - 1)) + 1)); };
  svg.addEventListener('pointermove', (e) => show(dayAt(e))); svg.addEventListener('pointerleave', () => { hideTip(svg); guide.setAttribute('x1', -10); guide.setAttribute('x2', -10); });
  svg.addEventListener('click', (e) => { const k = dayAt(e); if (k <= d) onDay(`${today.slice(0, 8)}${String(k).padStart(2, '0')}`); });
  const tot = cur.slice(1, d + 1).reduce((s, v) => s + v, 0), work = Array.from({ length: d }, (_, i) => i + 1).filter((k) => { const wd = new Date(Date.UTC(y, m - 1, k)).getUTCDay(); return wd !== 5 && wd !== 6; });
  const avg = work.length ? Math.round((work.reduce((s, k) => s + cur[k], 0) / work.length) * 10) / 10 : 0, peakK = cur.slice(1, d + 1).indexOf(Math.max(0, ...cur.slice(1, d + 1))) + 1;
  return el('section', { class: 'tp' },
    el('div', { class: 'tp-head' }, el('span', { class: 'tp-live', 'aria-hidden': 'true' }), el('h2', { text: t('tp_h') }),
      el('span', { class: 'tp-sum', text: t('tp_sum', { today: cur[d], avg, peak: cur[peakK] || 0, pd: peakK }) })),
    el('div', { class: 'tp-wrap' }, svg),
    el('p', { class: 'hint tp-legend' }, el('span', { class: 'tp-k tp-k-cur' }), t('tp_leg_cur'), el('span', { class: 'tp-k tp-k-prev' }), hasPrev ? t('tp_leg_prev') : t('tp_leg_noprev'), el('span', { class: 'tp-k tp-k-we' }), t('tp_leg_we'), ` · ${t('tp_click')}`));
}

// ---------- ADR-0095: «Email Activity — Manager Inbox» from the extractor's file ----------
let mailAct = { imports: [], recs: [] }, mailIds = { map: {}, ignored: [] };
const MA_RELEASES = './assets/extractor/AFAQY-Mail-Extractor-win64.zip';   // ADR-0107: on the site itself — the private repository's releases page answers 404 to anyone not signed in
const maSave = async () => { await store.kvPut('mailact', mailAct); await store.kvPut('mailids', mailIds); };
const maClassify = (s) => mfCategory(s, mfRules());
const maCats = () => [...mfRules().map((r) => r.k), 'other'];
const maCatName = (k) => (k === 'other' ? t('mf_cat_other') : ((mfRules().find((r) => r.k === k) || {}).name || k));
const maPeople = () => [...peopleOf(datasets), ...(me ? me.people : [])].filter((p, i, arr) => p && arr.findIndex((q) => q.id === p.id) === i);
const maMonths = () => [...new Set(mailAct.recs.map((r) => (maDay(r) || '').slice(0, 7)).filter(Boolean))].sort().reverse();
let maMonth = '';
async function maReadFile(f) {
  const head = new Uint8Array(await f.slice(0, 2).arrayBuffer()), gz = head[0] === 0x1f && head[1] === 0x8b;
  return gz ? await new Response(f.stream().pipeThrough(new DecompressionStream('gzip'))).text() : await f.text();
}
async function maImport(f) {
  if (/\.part$|\.checkpoint\.json$/i.test(f.name)) { toast(t('ma_is_part', { name: f.name })); return; }   // ADR-0099: name the cause
  let text = ''; try { text = await maReadFile(f); } catch { toast(t('ma_bad_file')); return; }
  if (!text.trim()) { toast(t('ma_is_empty', { name: f.name })); return; }
  const p = maParse(text);
  if (p.error) { toast(t('ma_bad_schema_x', { name: f.name, start: text.trim().slice(0, 40) })); return; }
  const r = maMerge(mailAct, p.head, p.recs, saudiDay(new Date().toISOString())); mailAct = r.state; maLink(r.links); await maSave();
  toast(t(r.again ? 'ma_loaded_again' : 'ma_loaded', { a: r.added, r: r.replaced, b: p.bad })); renderMailFile();
}
function maSection() {
  const up = el('input', { type: 'file', accept: '.jsonl.gz,.gz,.jsonl,.json,application/gzip', hidden: true, onchange: async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) await maImport(f); } });
  const head = el('div', {}, el('h2', { text: t('ma_h') }), el('p', { class: 'hint', text: t('ma_lead') }),
    el('div', { class: 'row' }, el('a', { class: 'btn', href: MA_RELEASES, download: 'AFAQY-Mail-Extractor-win64.zip', text: `⬇ ${t('ma_get')}` }), el('button', { type: 'button', class: 'btn primary ma-import', text: `📥 ${t('ma_import')}`, onclick: () => up.click() }), up));
  if (!mailAct.recs.length) return el('section', { class: 'ma-sec' }, head, el('p', { class: 'note', text: t('ma_none') }));
  // the imports, for audit
  const imps = el('details', { class: 'tucked ma-imps' }, el('summary', { text: t('ma_imports', { n: mailAct.imports.length, m: mailAct.recs.length }) }),
    el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, ['ma_c_src', 'ma_c_period', 'ma_c_kept', 'ma_c_dup', 'ma_c_fb', 'ma_c_err', 'ma_c_at', ''].map((k) => el('th', { text: k ? t(k) : '' })))),
      el('tbody', {}, mailAct.imports.map((x) => el('tr', {}, el('td', { dir: 'auto', text: x.source }), el('td', { text: `${x.from || '…'} → ${x.to || '…'}` }), el('td', { class: 'num', text: String(x.n) }), el('td', { class: 'num', text: String((x.counts || {}).dup || 0) }), el('td', { class: 'num', text: String((x.counts || {}).fallback || 0) }), el('td', { class: 'num', text: String((x.counts || {}).errors || 0) }), el('td', { text: x.importedAt || '' }),
        el('td', {}, el('button', { type: 'button', class: 'btn tiny quiet', text: t('ma_remove'), onclick: async () => { if (!confirm(t('ma_remove_confirm', { s: x.source }))) return; mailAct = { imports: mailAct.imports.filter((y) => y.id !== x.id), recs: mailAct.recs.filter((r) => r.i !== x.id) }; await maSave(); renderMailFile(); } }))))))));
  // identity: an address counts only once the manager confirms whose it is
  const senders = new Map(); for (const r of mailAct.recs) { if (!r.fe) continue; const s = senders.get(r.fe) || { addr: r.fe, name: r.fn, n: 0 }; s.n++; senders.set(r.fe, s); }
  const ppl = maPeople(), pname = (id) => { const p = ppl.find((q) => String(q.id) === String(id)); return p ? `${nameOf(p, lang) || p.id}${p.branchCode ? ` · ${t('ma_branch')} ${p.branchCode}` : ''}` : id; };
  const todo = [...senders.values()].filter((s) => !mailIds.map[s.addr] && !mailIds.ignored.includes(s.addr)).sort((p, q) => q.n - p.n).slice(0, 60);
  const done = Object.entries(mailIds.map);
  const pick = (s) => { const sg = maSuggest(s.addr, s.name, ppl); const sel = el('select', { 'aria-label': s.addr }, el('option', { value: '', text: '—' }), ppl.map((p) => ({ p, n: pname(p.id) })).sort((x, y) => x.n.localeCompare(y.n, lang)).map(({ p, n }) => el('option', { value: p.id, text: n })));
    return el('tr', {}, el('td', { class: 'ltr', text: s.addr }), el('td', { dir: 'auto', text: s.name || '' }), el('td', { class: 'num', text: String(s.n) }),
      el('td', {}, sel, sg.length ? el('button', { type: 'button', class: 'linkish ma-sug', text: `${t('ma_suggest')}: ${pname(sg[0].id)}`, onclick: () => { sel.value = sg[0].id; } }) : null),
      el('td', {}, el('button', { type: 'button', class: 'btn tiny ma-ok', text: t('ma_confirm'), onclick: async () => { if (!sel.value) { toast(t('ma_pick_first')); return; } mailIds.map[s.addr] = String(sel.value); await maSave(); renderMailFile(); } }),
        el('button', { type: 'button', class: 'btn tiny quiet', text: t('ma_ignore'), onclick: async () => { mailIds.ignored.push(s.addr); await maSave(); renderMailFile(); } }))); };
  const ident = el('details', { class: 'tucked ma-ident', open: todo.length > 0 },   // stays open while addresses wait el('summary', { text: t('ma_ident', { a: done.length, b: todo.length }) }), el('p', { class: 'hint', text: t('ma_ident_lead') }),
    todo.length ? el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, ['ma_c_addr', 'ma_c_name', 'ma_c_n', 'ma_c_who', ''].map((k) => el('th', { text: k ? t(k) : '' })))), el('tbody', {}, todo.map(pick)))) : el('p', { class: 'hint', text: t('ma_ident_none') }),
    done.length ? el('details', {}, el('summary', { text: t('ma_ident_done', { n: done.length }) }), el('ul', { class: 'defs' }, done.map(([addr, id]) => el('li', {}, el('span', { class: 'ltr', text: addr }), ' → ', pname(id), ' ', el('button', { type: 'button', class: 'linkish', text: t('ma_unlink'), onclick: async () => { delete mailIds.map[addr]; await maSave(); renderMailFile(); } }))))) : null);
  // the month's counts per engineer, with the evidence behind each
  const months = maMonths(); if (!months.includes(maMonth)) maMonth = months[0] || '';
  const rg = maMonth ? monthRangeOf(maMonth) : null, S = rg ? maStats(mailAct.recs, mailIds.map, maClassify, rg.from, rg.to) : null, cats = maCats();
  const covered = rg && maCovers(mailAct.imports, rg.from, rg.to);
  const rows = S ? [...S.per.values()].sort((p, q) => q.total - p.total) : [];
  const xl = async () => { const X = await loadXlsx(), head2 = [t('col_person'), t('ma_c_total'), ...cats.map(maCatName)], ws = X.utils.aoa_to_sheet([head2, ...rows.map((p) => [pname(p.id), p.total, ...cats.map((c) => p.cats[c] || 0)])]);
    const ev = X.utils.aoa_to_sheet([[t('col_person'), t('ma_c_day'), t('ma_c_subject'), t('ma_c_cat'), t('ma_c_folder')], ...rows.flatMap((p) => p.recs.map((r) => [pname(p.id), maDay(r), r.s, maCatName(maCategory(r, maClassify)), r.f]))]);
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, t('ma_x_sum').slice(0, 30)); X.utils.book_append_sheet(wb, ev, t('ma_x_ev').slice(0, 30)); X.writeFile(wb, `email-activity-manager-inbox-${maMonth}.xlsx`); };
  const res = el('section', { class: 'ma-res' }, el('h3', { text: t('ma_res_h') }),
    el('div', { class: 'row' }, el('label', {}, el('span', { text: t('km_month') }), el('select', { class: 'ma-month', onchange: (e) => { maMonth = e.target.value; renderMailFile(); } }, months.map((m) => el('option', { value: m, selected: m === maMonth, text: periodLabel(m) })))),
      rows.length ? el('button', { type: 'button', class: 'btn tiny', text: `⬇ ${t('td_excel')}`, onclick: xl }) : null),
    covered ? null : el('p', { class: 'note', text: t('ma_partial', { m: periodLabel(maMonth) }) }),
    S && S.unmatched.length ? el('p', { class: 'hint', text: t('ma_unmatched', { n: S.unmatched.reduce((s, u) => s + u.n, 0), a: S.unmatched.length }) }) : null,
    rows.length ? el('div', { class: 'table-wrap' }, el('table', { class: 'ma-table' }, el('thead', {}, el('tr', {}, [t('col_person'), t('ma_c_total'), ...cats.map(maCatName)].map((h) => el('th', { text: h })))),
      el('tbody', {}, rows.map((p) => el('tr', { class: 'ma-row', title: t('ma_evidence'), onclick: () => crModal({ title: `${pname(p.id)} — ${periodLabel(maMonth)}`, file: `email-${p.id}-${maMonth}`, tiles: [[t('ma_c_total'), p.total], ...cats.map((c) => [maCatName(c), p.cats[c] || 0, '', (k) => maCategory(p.recs[k], maClassify) === c])],
        head: [t('ma_c_subject'), t('ma_c_day'), t('ma_c_cat'), t('ma_c_folder')], rows: p.recs.map((r) => [r.s, maDay(r), maCatName(maCategory(r, maClassify)), r.f]) }) },
        el('td', { text: pname(p.id) }), el('td', { class: 'num', text: String(p.total) }), ...cats.map((c) => el('td', { class: 'num', text: String(p.cats[c] || 0) }))))))) : el('p', { class: 'hint', text: t('ma_no_rows') }),
    el('p', { class: 'hint', text: t('ma_res_note') }));
  return el('section', { class: 'ma-sec' }, head, imps, ident, res);
}
/** The separate indicator on «Team KPIs»: counts from the manager's Inbox, never mixed with tasks or points. */
function maKpiSection(range, prange, team) {
  const h = el('h2', { text: t('ma_kpi_h') });
  if (!mailAct.recs.length) return el('section', { class: 'ma-kpi' }, h, el('p', { class: 'hint' }, t('ma_kpi_none'), ' ', el('a', { class: 'linkish', href: '#mailfile', text: t('nav_mailfile') })));
  if (!maCovers(mailAct.imports, range.from, range.to)) return el('section', { class: 'ma-kpi' }, h, el('p', { class: 'note', text: t('ma_kpi_uncovered', { a: range.from, b: range.to }) }));
  const S = maStats(mailAct.recs, mailIds.map, maClassify, range.from, range.to), P = maCovers(mailAct.imports, prange.from, prange.to) ? maStats(mailAct.recs, mailIds.map, maClassify, prange.from, prange.to) : null, cats = maCats();
  const ids = [...new Set([...(team || []), ...S.per.keys()])].filter((id) => S.per.has(id) || (team || []).includes(id));
  const ppl = maPeople(), pname = (id) => { const p = ppl.find((q) => String(q.id) === String(id)); return p ? nameOf(p, lang) || p.id : id; };
  const rows = ids.map((id) => ({ id, s: S.per.get(id) || { total: 0, cats: {} }, p: P ? P.per.get(id) || { total: 0, cats: {} } : null })).sort((x, y) => y.s.total - x.s.total);
  const src = mailAct.imports.filter((x) => x.from <= range.to && x.to >= range.from).map((x) => `${x.source} (${x.from} → ${x.to}, ${t('ma_c_at')} ${x.importedAt})`).join(' · ');
  return el('section', { class: 'ma-kpi' }, h, el('p', { class: 'hint', text: t('ma_kpi_note') }),
    el('div', { class: 'table-wrap' }, el('table', { class: 'ma-table' }, el('thead', {}, el('tr', {}, [t('col_person'), t('ma_c_total'), ...cats.map(maCatName), P ? t('ma_c_prev') : null].filter(Boolean).map((x) => el('th', { text: x })))),
      el('tbody', {}, rows.map((r) => el('tr', {}, el('td', { text: pname(r.id) }), el('td', { class: 'num' }, el('b', { text: String(r.s.total) })), ...cats.map((c) => el('td', { class: 'num', text: String(r.s.cats[c] || 0) })), P ? el('td', { class: 'num' }, `${r.p.total} `, kmDelta(r.s.total, r.p.total, 'h', t('ma_c_prev'))) : null))))),
    el('p', { class: 'hint ma-src', text: `${t('ma_src')}: ${src}${S.unmatched.length ? ` · ${t('ma_unmatched', { n: S.unmatched.reduce((s, u) => s + u.n, 0), a: S.unmatched.length })}` : ''}` }));
}
/** One line in an engineer's detail. */
function maPersonLine(id, ym) {
  if (!mailAct.recs.length || !ym) return null; const rg = periodRangeOf(ym); if (!maCovers(mailAct.imports, rg.from, rg.to)) return null;
  const S = maStats(mailAct.recs, mailIds.map, maClassify, rg.from, rg.to), p = S.per.get(String(id)) || S.per.get(id); if (!p) return null;
  return el('p', { class: 'hint ma-line', text: `${t('ma_kpi_h')}: ${p.total} — ${maCats().filter((c) => p.cats[c]).map((c) => `${maCatName(c)} ${p.cats[c]}`).join(' · ')}` });
}
/** Weights for this indicator: prepared, locked until the manager approves the scoring rules. */
function maWeightsLocked() {
  return el('details', { class: 'tucked ma-w-fold' }, el('summary', { text: `🔒 ${t('ma_w_h')}` }),   // closed: locked until approved
    el('fieldset', { class: 'ma-w', disabled: true }, el('legend', { text: t('ma_w_h') }), el('p', { class: 'hint', text: t('ma_w_locked') }),
      el('div', { class: 'row' }, maCats().map((c) => el('label', {}, el('span', { text: maCatName(c) }), el('input', { type: 'number', value: '0', min: '0', step: '0.5', 'aria-label': maCatName(c) }))))));
}

// ---------- ADR-0097: a PST up to 5 GB read in the background, straight from the disk ----------
function pstRead(f, opts, onProgress) {
  return new Promise((res, rej) => {
    let w; try { w = new Worker('./assets/pst-worker.js'); } catch (e) { rej(e); return; }
    w.onmessage = (e) => { const d = e.data; if (d.type === 'progress') { if (onProgress) onProgress(d); return; } w.terminate(); if (d.type === 'done') { d.recs.stats = d.stats; res(d.recs); } else { const er = new Error(d.message); er.name = d.name || 'Error'; rej(er); } };
    w.onerror = (e) => { w.terminate(); rej(new Error(e.message || 'worker')); };
    w.postMessage({ file: f, attFrom: (opts && opts.attFrom) || null, attTo: (opts && opts.attTo) || null });
  });
}
/** The same result as before (ADR-0075): one row per e-mail, copies in other folders counted, not repeated. */
function mfParseRecs(recs) {
  const out = []; const seen = new Set(), seenMail = new Set(); let copies = 0;
  for (const m of recs) { const key = m.d != null ? m.d : `${m.folder}:${out.length}`, mk = mailKey(m);
    if (!seen.has(key) && seenMail.has(mk)) copies++;
    if (!seen.has(key) && !seenMail.has(mk)) { seen.add(key); seenMail.add(mk); const d = m.clientSubmitTime || m.messageDeliveryTime;
      out.push({ id: key, folder: m.folder || '/', subject: m.subject, sender: String(m.senderName || m.senderEmailAddress || '').trim().slice(0, 120), email: String(m.senderEmailAddress || '').slice(0, 160), to: m.displayTo, date: d || '', own: maOwnText(m.body) }); } }
  out.copies = copies; return out;
}

// ---------- ADR-0098: say why a PST could not be read — a lock by Outlook is named, anything else shows its detail ----------
function mfFailBox(err) {
  const locked = err && (err.name === 'NotReadableError' || /NotReadable|could not be read|permission/i.test(String(err.message || '')));
  if (locked) return el('div', { class: 'ma-big mf-locked' }, el('p', {}, el('b', { text: t('mf_locked_h') })), el('ol', { class: 'ma-steps' }, ['mf_locked_1', 'mf_locked_2', 'mf_locked_3'].map((k) => el('li', { text: t(k) }))));
  return el('div', { class: 'note' }, el('p', { text: t('mf_fail') }), el('a', { class: 'linkish', href: MA_RELEASES, download: 'AFAQY-Mail-Extractor-win64.zip', text: t('ma_get') }),
    err ? el('details', { class: 'mf-detail' }, el('summary', { text: t('mf_detail') }), el('code', { dir: 'ltr', text: `${err.name || 'Error'}: ${String(err.message || err).slice(0, 600)}` })) : null);
}

// ---------- ADR-0099: who sent it (an internal sender's alias), short folder names ----------
/** An address to show and to match: SMTP as is; an internal Exchange address (/o=…/cn=…-alias) becomes ex:alias. */
function mfAddr(a) {
  const s = String(a || '').trim().replace(/^<|>$/g, '').toLowerCase(); if (!s) return '';
  if (s.startsWith('/o=') || s.startsWith('/cn=')) { const m = s.match(/\/cn=(?:[^/]*-)?([^/-][^/]*)$/); return m ? `ex:${m[1]}` : ''; }
  return s.includes('@') ? s : '';
}
const mfFolder = (f) => String(f || '').replace(/^\/?(top of (outlook data file|personal folders)|أعلى ملف بيانات outlook|بداية ملف بيانات outlook)\/?/i, '') || '/';

// ---------- ADR-0099: a PST read in the browser is kept — the same records and keys as the extractor's file ----------
const maSha1 = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)))].map((x) => x.toString(16).padStart(2, '0')).join('');
const maNormSubject = (s) => String(s || '').replace(/^\s*(((re|fw|fwd|رد|إعادة توجيه|تحويل)\s*:\s*)+)/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
async function maSaveBrowser(recs, f) {
  const out = []; let fb = 0; const seen = new Set(); let dup = 0;
  for (const m of recs) {
    const fe = mfAddr(m.senderEmailAddress), sent = m.clientSubmitTime || null, mid = String(m.internetMessageId || '').trim().toLowerCase();
    const k = mid ? (await maSha1(mid)).slice(0, 20) : `fb${(await maSha1(`${fe || String(m.senderName || '').toLowerCase()}|${sent ? sent.slice(0, 19) + 'Z' : ''}|${maNormSubject(m.subject)}`)).slice(0, 18)}`;
    if (seen.has(k)) { dup++; continue; } seen.add(k); if (!mid) fb++;
    const iso = (x) => (x ? `${x.slice(0, 19)}Z` : null);
    out.push({ k, fb: !mid, fe, fn: String(m.senderName || ''), s: String(m.subject || ''), st: iso(m.clientSubmitTime), rt: iso(m.messageDeliveryTime), f: m.folder || '/', to: String(m.displayTo || '').split(';').filter((x) => x.trim()).length, cc: 0, rd: [], b: maOwnText(m.body) });
  }
  const days = out.map((r) => maDay(r)).filter(Boolean).sort();
  const head = { schema: 'afaqy-mail-activity/v1', helper: `browser v${PORTAL_VERSION}`, source: f.name, source_bytes: f.size, from: days[0] || null, to: days[days.length - 1] || null, scope: 'browser', extracted_at: new Date().toISOString().slice(0, 19) + 'Z', counts: { read: recs.length, kept: out.length, dup, fallback: fb, errors: 0 } };
  const r = maMerge(mailAct, head, out, saudiDay(new Date().toISOString())); mailAct = r.state; maLink(r.links); await maSave();
  return { n: out.length, added: r.added, replaced: r.replaced };
}
/** One sender, two addresses (the same message came with both): a confirmed one confirms the other. */
function maLink(links) { for (const [x, y] of links || []) { if (mailIds.map[x] && !mailIds.map[y]) mailIds.map[y] = mailIds.map[x]; else if (mailIds.map[y] && !mailIds.map[x]) mailIds.map[x] = mailIds.map[y]; } }

// ---------- ADR-0103: sync between my devices — one encrypted file, sent through the phone's own share sheet, merged on arrival ----------
function syncTenders(local, inc) {
  if (!local || !local.items || !local.items.length) return inc;
  const rank = (x) => TD_STAGES.indexOf(x.stage), filled = (x) => Object.values(x).filter((v) => v !== '' && v != null).length, by = new Map(local.items.map((x) => [x.id, x]));
  for (const x of inc.items) { const y = by.get(x.id); if (!y) { by.set(x.id, x); continue; }
    const [base, other] = rank(x) > rank(y) || (rank(x) === rank(y) && filled(x) > filled(y)) ? [x, y] : [y, x];   // the further stage wins, then the fuller copy
    const m = { ...base }; for (const [k, v] of Object.entries(other)) if ((m[k] === '' || m[k] == null) && v !== '' && v != null) m[k] = v;
    const dateSources = { ...other.dateSources, ...base.dateSources };
    for (const field of TENDER_DATE_FIELDS) {
      const manual = [base, other].find((row) => row.dateSources?.[field] === 'manual');
      if (manual) { m[field] = manual[field]; m[field+'Time'] = manual[field+'Time']; dateSources[field] = 'manual'; }
      else { const et = [base, other].filter((row) => row.dateSources?.[field] === 'etimad').sort((p, q) => String(q.etimadAt || '').localeCompare(String(p.etimadAt || '')))[0];   // v9.60: no hand-typed date — the platform's wins
        if (et) { m[field] = et[field]; if (field === 'due' || field === 'askDue') m[field+'Time'] = et[field+'Time']; dateSources[field] = 'etimad'; } }
    }
    by.set(x.id, applyTenderEmailDates({ ...m, ...mergeTenderDetails(base, other), dateSources })); }
  return { ...local, items: [...by.values()].sort((p, q) => (p.date < q.date ? 1 : -1)), to: [local.to, inc.to].filter(Boolean).sort().pop() || null, radarIgnore: [...new Set([...(local.radarIgnore || []), ...(inc.radarIgnore || [])])] };
}
function syncMailAct(local, inc) {
  const L = local && local.recs ? local : { imports: [], recs: [] }, by = new Map(L.recs.map((r) => [r.k, r]));
  for (const r of inc.recs || []) { const o = by.get(r.k); by.set(r.k, o ? { ...r, ...o, b: o.b || r.b || '' } : r); }
  const ik = (x) => x.id || `${x.source}|${x.extracted_at}`, imp = new Map((L.imports || []).map((x) => [ik(x), x])); for (const x of inc.imports || []) if (!imp.has(ik(x))) imp.set(ik(x), x);
  return { imports: [...imp.values()], recs: [...by.values()] };
}
function syncProjects(local, p) {
  if (!local) return p; const have = new Map(local.projects.map((x) => [projKey(x.project), x]));
  for (const x of p.projects) { const k = projKey(x.project), o = have.get(k);
    if (!o) { local.projects.push(x); have.set(k, x); continue; }
    o.first = [o.first, x.first].filter(Boolean).sort()[0] || ''; o.last = [o.last, x.last].filter(Boolean).sort().pop() || ''; for (const f2 of ['messages', 'me', 'akram', 'shaarawi']) o[f2] = Math.max(o[f2] || 0, x[f2] || 0); o.worked = o.worked || x.worked; o.aibrahim = o.aibrahim || x.aibrahim; o.kraasa = o.kraasa || x.kraasa; }
  const sk = new Set(local.skipped.map((x) => x.subject)); for (const x of p.skipped || []) if (!sk.has(x.subject)) local.skipped.push(x);
  local.to = [local.to, p.to].filter(Boolean).sort().pop(); return local;
}
const SYNC_MAGIC = [0x41, 0x46, 0x51, 0x53, 1];   // «AFQS» + version
async function syncKey(pass, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function syncPack(obj, pass) {
  const gz = new Uint8Array(await new Response(new Blob([JSON.stringify(obj)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await syncKey(pass, salt), gz));
  return new Blob([new Uint8Array(SYNC_MAGIC), salt, iv, ct], { type: 'application/octet-stream' });
}
async function syncUnpack(buf, pass) {
  const b = new Uint8Array(buf); if (b.length < 40 || SYNC_MAGIC.some((v, i) => b[i] !== v)) throw new Error('sync_not_file');
  const salt = b.slice(5, 21), iv = b.slice(21, 33), ct = b.slice(33);
  let gz; try { gz = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await syncKey(pass, salt), ct); } catch { throw new Error('sync_bad_pass'); }
  return JSON.parse(await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
}
const syncCount = (j) => ({ tasks: (j.datasets || []).reduce((s, d) => s + (d.tasks || []).length, 0), tenders: j.tenders && j.tenders.items ? j.tenders.items.length : 0, mail: j.mailact && j.mailact.recs ? j.mailact.recs.length : 0 });
// ---------- v9.79 (ADR-0149): the backup and the sync file as a ZIP of files — never one giant string ----------
async function blobCrc(blob) { let c = 0; const r = blob.stream().getReader(); for (;;) { const { done, value } = await r.read(); if (done) return c; c = crc32(value, c); } }
// A ZIP built from parts: each header's few bytes, then the file itself as the Blob it already is — the browser joins them without
// copying the files into this page's memory as text. `deflate` squeezes the JSON; PDFs and pictures are kept as they are.
async function zipBuild(list) {
  const parts = [], dir = []; let off = 0;
  for (const f of list) {
    const crc = await blobCrc(f.blob), data = f.deflate ? await new Response(f.blob.stream().pipeThrough(new CompressionStream('deflate-raw'))).blob() : f.blob;
    const e = { name: f.name, crc, size: f.blob.size, csize: data.size, method: f.deflate ? 8 : 0, offset: off, at: f.at ? new Date(f.at) : new Date() };
    const head = zipLocalHeader(e); parts.push(head, data); dir.push(e); off += head.length + data.size;
  }
  parts.push(zipDirectory(dir, off));
  return new Blob(parts, { type: 'application/zip' });
}
// Opened by slices: the end record, the directory, then each entry only when it is asked for (a stored file is a slice of the file).
async function zipOpen(blob) {
  const tailLen = Math.min(blob.size, 65557), end = zipFindEnd(new Uint8Array(await blob.slice(blob.size - tailLen).arrayBuffer()), blob.size);
  if (!end) throw new Error('bk_not_file');
  const entries = zipEntries(new Uint8Array(await blob.slice(end.offset, end.offset + end.size).arrayBuffer()), end.count), by = new Map(entries.map((e) => [e.name, e]));
  const get = async (name, type = '') => { const e = by.get(name); if (!e) return null;
    const start = e.offset + zipDataStart(new Uint8Array(await blob.slice(e.offset, e.offset + 30).arrayBuffer())), raw = blob.slice(start, start + e.csize, type);
    return e.method === 8 ? new Blob([await new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()], { type }) : raw; };
  return { entries, get };
}
// The full backup as a ZIP: `backup.json` (afaqy-portal/v3 — what the JSON backup held, each attachment named by its place in the
// ZIP instead of written into it) and the attachments under files/. Returns the manifest too, for the counts the page shows.
async function backupZip() {
  const refs = [], manifest = await buildBackup(refs);
  const blob = await zipBuild([{ name: 'backup.json', blob: new Blob([JSON.stringify(manifest)], { type: 'application/json' }), deflate: true }, ...refs.map((r) => ({ name: r.path, blob: r.blob, at: r.at }))]);
  return { manifest, blob };
}
// A backup file of any age: the ZIP (v3) — its attachments put back as files — or the JSON of before (v1, v2) as it always was read.
async function readBackupFile(f) {
  const sig = new Uint8Array(await f.slice(0, 4).arrayBuffer());
  if (!(sig[0] === 0x50 && sig[1] === 0x4b && sig[2] === 3 && sig[3] === 4)) return JSON.parse(await f.text());
  const z = await zipOpen(f), mj = await z.get('backup.json', 'application/json'); if (!mj) throw new Error('bk_not_file');
  const j = JSON.parse(await mj.text());
  const back = async (file) => { if (!file || !file.zip) return file; const blob = await z.get(file.zip, file.type || ''); const { zip, ...rest } = file; return blob ? { ...rest, blob } : null; };
  if (j.tenders && Array.isArray(j.tenders.items)) j.tenders.items = await Promise.all(j.tenders.items.map(async (it) => ({ ...it, files: (await Promise.all((it.files || []).map(back))).filter(Boolean) })));
  if (j.projfiles && typeof j.projfiles === 'object') for (const id of Object.keys(j.projfiles)) j.projfiles[id] = (await Promise.all((j.projfiles[id] || []).map(back))).filter(Boolean);
  return j;
}
const SYNC_MAGIC2 = [0x41, 0x46, 0x51, 0x53, 2];
async function syncPack2(zip, pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), nonce = crypto.getRandomValues(new Uint8Array(8)), key = await syncKey(pass, salt);
  const head = new Uint8Array(33); head.set(SYNC_MAGIC2); head.set(salt, 5); head.set(nonce, 21); new DataView(head.buffer).setUint32(29, SYNC_PIECE, true);
  const parts = [head], n = Math.max(1, Math.ceil(zip.size / SYNC_PIECE));
  for (let i = 0; i < n; i++) {
    const { iv, aad } = syncPieceIv(nonce, i, i === n - 1);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, key, await zip.slice(i * SYNC_PIECE, (i + 1) * SYNC_PIECE).arrayBuffer()));
    const len = new Uint8Array(4); new DataView(len.buffer).setUint32(0, ct.length, true); parts.push(len, new Blob([ct]));
  }
  return new Blob(parts, { type: 'application/octet-stream' });
}
async function syncUnpack2(f, pass) {
  const head = new Uint8Array(await f.slice(0, 33).arrayBuffer()); if (head.length < 33) throw new Error('sync_not_file');
  const salt = head.slice(5, 21), nonce = head.slice(21, 29), key = await syncKey(pass, salt), out = [];
  let pos = 33, i = 0;
  for (;;) {
    if (pos + 4 > f.size) throw new Error('sync_not_file');
    const len = new DataView(await f.slice(pos, pos + 4).arrayBuffer()).getUint32(0, true), end = pos + 4 + len, last = end === f.size;
    if (end > f.size) throw new Error('sync_not_file');
    const { iv, aad } = syncPieceIv(nonce, i, last);
    let pt; try { pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aad }, key, await f.slice(pos + 4, end).arrayBuffer()); }
    catch { throw new Error(i === 0 ? 'sync_bad_pass' : 'sync_not_file'); }
    out.push(new Blob([pt])); pos = end; i++; if (last) break;
  }
  return new Blob(out, { type: 'application/zip' });
}
// a file the page made, saved: the link stays alive long enough for a large file to start downloading
function saveBlob(name, blob) { const u = URL.createObjectURL(blob), a = el('a', { href: u, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 120000); }
// what went wrong, in words the manager can act on — and never «could not save» when nothing was being saved
const bkWhy = (e) => (e && /^(bk_|sync_|zip_)/.test(e.message || '') ? t(e.message) : e && e.name === 'QuotaExceededError' ? t('bk_space') : `${(e && e.name) || 'Error'}${e && e.message ? `: ${String(e.message).slice(0, 80)}` : ''}`);
async function syncSend(pass) {
  if (String(pass || '').length < 6) { toast(t('sync_pass_short')); return; }
  let all, blob;
  try { const z = await backupZip(); all = z.manifest; blob = await syncPack2(z.blob, pass); } catch (e) { console.error(e); toast(t('bk_failed', { why: bkWhy(e) })); return; }   // v9.79: nothing here saves anything
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const file = new File([blob], `afaqy-sync-${stamp}.afqs`, { type: 'application/octet-stream' }), c = syncCount(all);
  const last = { sentAt: new Date().toISOString(), ...c, kb: Math.round(blob.size / 1024) }; await store.kvPut('syncsent', last);
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: t('sync_share_title') }); toast(t('sync_sent', { kb: last.kb })); renderSync(); return; } catch (e) { if (e && e.name === 'AbortError') { renderSync(); return; } } }
  const url = URL.createObjectURL(file), link = el('a', { href: url, download: file.name }); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast(t('sync_saved', { kb: last.kb })); renderSync();
}
async function syncReceive(f, pass) {
  if (String(pass || '').length < 6) { toast(t('sync_pass_short')); return false; }
  let j; try { const h = new Uint8Array(await f.slice(0, 5).arrayBuffer());   // v9.79: version 2 is the sealed ZIP; version 1 (before) still opens
    j = h.length === 5 && SYNC_MAGIC2.every((v, i) => h[i] === v) ? await readBackupFile(await syncUnpack2(f, pass)) : await syncUnpack(await f.arrayBuffer(), pass); }
  catch (e) { toast(t(e && /^(sync_|bk_)/.test(e.message) ? e.message : 'sync_not_file')); return false; }
  const before = syncCount({ datasets, tenders, mailact: mailAct });
  try { await applyBackup(j); } catch { toast(t('td_store_failed')); return false; }
  const after = syncCount({ datasets, tenders, mailact: mailAct });
  const got = { receivedAt: new Date().toISOString(), from: j.exportedAt || '', tasks: after.tasks - before.tasks, tenders: after.tenders - before.tenders, mail: after.mail - before.mail };
  await store.kvPut('syncgot', got); toast(t('sync_got', { t: got.tasks, d: got.tenders, m: got.mail })); renderSync(); return true;
}
async function renderSync() {
  const box = $('sync-card'); if (!box) return;
  const sent = await store.kvGet('syncsent'), got = await store.kvGet('syncgot'), when = (iso) => (iso ? `${saudiDay(iso)} ${new Date(iso).toLocaleTimeString(lang === 'en' ? 'en-GB' : 'ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}` : '');
  const pass = el('input', { type: 'password', class: 'sync-pass', autocomplete: 'new-password', minlength: '6', placeholder: t('sync_pass_ph'), 'aria-label': t('sync_pass_ph') });
  const up = el('input', { type: 'file', class: 'sync-recv-in', hidden: true, onchange: async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) await syncReceive(f, pass.value); } });   // no «accept»: iOS greys out an extension it does not know — the file is checked by its own header and the passphrase
  set(box, el('h2', {}, `🔄 ${t('sync_h')}`), el('p', { class: 'hint', text: t('sync_lead') }),
    el('ol', { class: 'sync-steps' }, ['sync_s1', 'sync_s2', 'sync_s3'].map((k) => el('li', { text: t(k) }))),
    el('div', { class: 'row sync-row' }, pass,
      el('button', { type: 'button', class: 'btn primary sync-send', text: `📤 ${t('sync_send')}`, onclick: () => syncSend(pass.value) }),
      el('button', { type: 'button', class: 'btn sync-get', text: `📥 ${t('sync_get')}`, onclick: () => up.click() }), up),
    el('p', { class: 'hint sync-last', text: [sent ? t('sync_last_sent', { w: when(sent.sentAt), n: sent.tasks, kb: sent.kb }) : '', got ? t('sync_last_got', { w: when(got.receivedAt), f: when(got.from) }) : ''].filter(Boolean).join(' · ') || t('sync_never') }),
    el('p', { class: 'hint sync-safe', text: t('sync_safe') }));
}

// ---------- ADR-0096: a PST the browser cannot hold goes straight to the extractor, never to an error ----------
const MF_BROWSER_MAX = 5 * 1073741824;   // ADR-0097: read from the disk in the background up to 5 GB; beyond that the extractor is faster
function maTooBig(f) {
  return el('div', { class: 'ma-big' }, el('p', {}, el('b', { text: t('ma_big_h', { gb: (f.size / 1073741824).toFixed(1) }) })), el('ol', { class: 'ma-steps' }, ['ma_step1', 'ma_step2', 'ma_step3', 'ma_step4'].map((k) => el('li', { text: t(k) }))),
    el('div', { class: 'row' }, el('a', { class: 'btn primary', href: MA_RELEASES, download: 'AFAQY-Mail-Extractor-win64.zip', text: `⬇ ${t('ma_get')}` })));
}

// ---------- ADR-0100: a person's KPIs as an interactive dashboard — real numbers, KPI terms, definitions on hover ----------
const NS_SVG = 'http://www.w3.org/2000/svg';
const svgEl = (tag, at = {}) => { const e = document.createElementNS(NS_SVG, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); return e; };
function pmSpark(vals, cls = '') {
  const v = vals.map((x) => (x == null ? null : +x)), ok = v.filter((x) => x != null); if (ok.length < 2) return null;
  const W = 120, H = 34, lo = Math.min(...ok), hi = Math.max(...ok), span = hi - lo || 1;
  const pts = v.map((x, i) => (x == null ? null : [4 + (i / (v.length - 1)) * (W - 8), H - 4 - ((x - lo) / span) * (H - 10)])).filter(Boolean);
  const s = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: `pm-spark ${cls}`, 'aria-hidden': 'true' });
  s.append(svgEl('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none' }));
  const [lx, ly] = pts[pts.length - 1]; s.append(svgEl('circle', { cx: lx, cy: ly, r: 3 })); return s;
}
function pmDonut(parts) {
  const total = parts.reduce((s, p) => s + p.v, 0); const s = svgEl('svg', { viewBox: '0 0 120 120', class: 'pm-donut', role: 'img', 'aria-label': parts.map((p) => `${p.l} ${p.v}`).join(', ') });
  s.append(svgEl('circle', { cx: 60, cy: 60, r: 44, class: 'pm-donut-track' }));
  if (total) { let acc = 0; const C = 2 * Math.PI * 44;
    for (const p of parts) { if (!p.v) continue; const len = (p.v / total) * C; const c = svgEl('circle', { cx: 60, cy: 60, r: 44, class: `pm-seg ${p.c}`, 'stroke-dasharray': `${len} ${C - len}`, 'stroke-dashoffset': `${-acc}`, transform: 'rotate(-90 60 60)' }); c.append(svgEl('title')); c.lastChild.textContent = `${p.l}: ${p.v} (${Math.round((p.v / total) * 100)}%)`; s.append(c); acc += len; } }
  const tx = svgEl('text', { x: 60, y: 64, 'text-anchor': 'middle', class: 'pm-donut-n' }); tx.textContent = String(total); s.append(tx); return s;
}
function pmCalendar(tasks, id, ym, asOfDay) {
  if (!/^\d{4}-\d{2}$/.test(ym)) return null;
  const by = new Map();
  for (const x of tasks) { if (x.assigneeId !== id || x.state !== 'done' || !x.completedAt) continue; const d = saudiDay(x.completedAt); if (d.slice(0, 7) !== ym) continue; if (!by.has(d)) by.set(d, []); by.get(d).push(x); }
  const nDays = +monthLast(ym).slice(8), first = new Date(`${ym}-01T12:00:00Z`).getUTCDay(), max = Math.max(1, ...[...by.values()].map((v) => v.length));
  const wd = (i) => new Intl.DateTimeFormat(lang === 'ur' ? 'ur' : lang, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 10, 1 + i)));   // 1 Nov 2026 is a Sunday
  const longDay = (day) => new Intl.DateTimeFormat(lang === 'ur' ? 'ur' : lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
  const detail = el('div', { class: 'pm-cal-detail', 'aria-live': 'polite' }, el('p', { class: 'hint', text: t('d_cal_pick') }));
  let work = 0, act = 0; const cells = [];
  for (let i = 0; i < first; i++) cells.push(el('span', { class: 'pm-cal-pad', 'aria-hidden': 'true' }));
  for (let dn = 1; dn <= nDays; dn++) {
    const day = `${ym}-${String(dn).padStart(2, '0')}`, list = by.get(day) || [], dow = new Date(`${day}T12:00:00Z`).getUTCDay(), off = dow === 5 || dow === 6, future = !!asOfDay && day > asOfDay;
    if (!off && !future) { work++; if (list.length) act++; }
    const lvl = !list.length ? 0 : list.length / max > 0.75 ? 3 : list.length / max > 0.45 ? 2 : 1;
    const b = el('button', { type: 'button', class: `pm-cal-day l${lvl}${off ? ' off' : ''}${future ? ' future' : ''}`, style: `--i:${dn}`, 'data-day': day, 'data-n': String(list.length), 'aria-pressed': 'false', 'aria-label': t('d_cal_day', { d: longDay(day), n: list.length }) },
      el('b', { text: list.length ? String(list.length) : '·' }), el('small', { text: String(dn) }));
    if (future) b.disabled = true;
    b.onclick = () => { for (const o of b.parentElement.querySelectorAll('.pm-cal-day')) o.setAttribute('aria-pressed', String(o === b));
      const rows = [...list].sort((x, y) => String(x.completedAt).localeCompare(String(y.completedAt)));
      set(detail, el('p', { class: 'pm-cal-dh' }, el('b', { text: longDay(day) }), el('span', { class: 'hint', text: ` · ${t('d_cal_n', { n: list.length })}` })),
        rows.length ? el('ul', { class: 'pf-open' }, rows.slice(0, 20).map((x) => el('li', {}, el('span', { text: x.title || typeLabel(x.type || '', lang) || '—' }), el('small', { class: 'hint', text: new Date(Date.parse(x.completedAt) + 3 * 3600e3).toISOString().slice(11, 16) }))))
          : el('p', { class: 'hint', text: t(off ? 'd_cal_off' : 'd_cal_none') }),
        rows.length > 20 ? el('p', { class: 'hint', text: t('me_open_more', { n: rows.length - 20 }) }) : null); };
    cells.push(b);
  }
  return el('div', { class: 'pm-card pm-cal' }, el('h4', { text: t('d_cal_h') }), el('p', { class: 'hint', text: t('d_cal_sum', { a: act, w: work, m: by.size ? max : 0 }) }),
    el('div', { class: 'pm-cal-grid', role: 'group', 'aria-label': t('d_cal_h') }, [0, 1, 2, 3, 4, 5, 6].map((i) => el('span', { class: 'pm-cal-wd', 'aria-hidden': 'true', text: wd(i) })), cells), detail);
}
function pmTrend(hist) {   // hist: newest first → drawn oldest to newest. ADR-0102: tasks and hours never share an axis
  const H = [...hist].reverse(); if (H.length < 2) return null;
  const W = 520, P = 26, bw = (W - 2 * P) / H.length, TOP = 20, BH = 120, GAP = 26, LH = 54, Ht = TOP + BH + 18 + GAP + LH + 10;
  const maxN = Math.max(1, ...H.map((h) => h.x.total)), av = H.map((h) => h.x.avg).filter((v) => v != null), lo = av.length ? Math.min(...av) : 0, hi = av.length ? Math.max(...av) : 1, span = hi - lo || 1;
  const s = svgEl('svg', { viewBox: `0 0 ${W} ${Ht}`, class: 'pm-trend', role: 'img', 'aria-label': t('pm_trend_h') });
  const base = TOP + BH, ly0 = base + 18 + GAP, yA = (v) => ly0 + LH - 8 - ((v - lo) / span) * (LH - 18);
  const sep = svgEl('line', { x1: P, x2: W - P, y1: base + 18 + GAP / 2, y2: base + 18 + GAP / 2, class: 'pm-sep' }); s.append(sep);
  const cap = svgEl('text', { x: W / 2, y: ly0 - 4, 'text-anchor': 'middle', class: 'pm-cap' }); cap.textContent = t('pm_mttr_strip'); s.append(cap);
  H.forEach((h, i) => { const x = P + i * bw, tot = h.x.total, cl = h.x.closed, yT = base - (tot / maxN) * BH, yC = base - (cl / maxN) * BH;
    const g = svgEl('g', { class: 'pm-bar-g', 'data-tip-hold': '' });
    g.append(svgEl('rect', { x: x + bw * 0.16, y: yT, width: bw * 0.68, height: base - yT, class: 'pm-bar-total', rx: 4 }), svgEl('rect', { x: x + bw * 0.3, y: yC, width: bw * 0.4, height: base - yC, class: 'pm-bar-closed', rx: 3 }));
    const val = svgEl('text', { x: x + bw / 2, y: Math.max(12, yT - 5), 'text-anchor': 'middle', class: 'pm-val' }); val.textContent = `${cl}/${tot}`; g.append(val);
    const lab = svgEl('text', { x: x + bw / 2, y: base + 14, 'text-anchor': 'middle', class: 'pm-ax' }); lab.textContent = periodLabel(h.m.ym).split(' ')[0].slice(0, 3); g.append(lab);
    g.append(svgEl('rect', { x, y: 0, width: bw, height: Ht, class: 'pm-hit' }));   // the whole month column answers the pointer
    g.addEventListener('pointerenter', () => { showTip(g, t('pm_trend_tip', { m: periodLabel(h.m.ym), t: tot, c: cl, a: hmOf(h.x.avg), p: h.x.points })); g.classList.add('on'); });
    g.addEventListener('pointerleave', () => { hideTip(g); g.classList.remove('on'); }); s.append(g); });
  const pts = H.map((h, i) => (h.x.avg == null ? null : [P + i * bw + bw / 2, yA(h.x.avg), h.x.avg])).filter(Boolean);
  if (pts.length > 1) s.append(svgEl('polyline', { points: pts.map((q) => `${q[0]},${q[1]}`).join(' '), class: 'pm-line-avg', fill: 'none' }));
  for (const [cx, cy, v] of pts) { s.append(svgEl('circle', { cx, cy, r: 3.5, class: 'pm-dot-avg' })); const tx = svgEl('text', { x: cx, y: cy - 7, 'text-anchor': 'middle', class: 'pm-val pm-val-avg' }); tx.textContent = hmOf(v); s.append(tx); }
  return el('div', { class: 'pm-trend-wrap' }, s);
}
function pmDash({ n, p, hist, open, share, ml, pml, rdOn = false, flag = null, item = null, med = null, own = false, cal = null, asOf = '' }) {
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : null), rate = pct(n.closed, n.total), prate = p ? pct(p.closed, p.total) : null;
  const oldest = open.length ? Math.max(...open.map((x) => x.ageHours || 0)) : 0;
  const H = [...hist].reverse(), sp = (f) => H.map((h) => f(h.x));
  // v9.33: the team's median beside the person's own number (his team = those under the same team lead; never a colleague's own number)
  const medLine = (key, cur, m, show, better) => { if (!med || m == null || cur == null) return null; const eq = Math.abs(cur - m) < 1e-9, up = cur > m;
    const k = better === 0 ? 'pm_med' : eq ? 'pm_med_eq' : better < 0 ? (up ? 'pm_med_slow' : 'pm_med_fast') : (up ? 'pm_med_up' : 'pm_med_down');
    const good = better === 0 || eq ? '' : (better < 0 ? !up : up) ? ' good' : ' bad';
    return el('small', { class: `pm-med${good}`, 'data-med': key, text: t(k, { v: show(m) }) }); };
  const MEDS = med ? { thru: medLine('thru', n.closed, med.closed, (v) => String(v), 1), load: medLine('load', n.total, med.total, (v) => String(v), 0), rate: medLine('rate', n.total ? Math.round((n.closed / n.total) * 100) : null, med.rate, (v) => `${v}%`, 1),
    mttr: medLine('mttr', n.avg, med.avg, (v) => hmOf(v), -1), pts: medLine('pts', n.points, med.points, (v) => String(v), 1) } : {};
  // a bar under the number: the person's own value, with a tick where the team's median sits
  const bar = (cur, m) => { if (!med || m == null || cur == null) return null; const top = Math.max(cur, m, 1e-9) * 1.12;
    return el('span', { class: 'pm-bar', 'aria-hidden': 'true' }, el('i', { style: `--w:${Math.min(100, (cur / top) * 100).toFixed(1)}%` }), el('u', { style: `--m:${Math.min(100, (m / top) * 100).toFixed(1)}%` })); };
  const BARS = med ? { thru: bar(n.closed, med.closed), rate: bar(n.total ? Math.round((n.closed / n.total) * 100) : null, med.rate), mttr: bar(n.avg, med.avg), pts: bar(n.points, med.points) } : {};
  const tile = (key, val, sub, delta, spark, fl) => el('div', { class: 'km-tile pm-tile', tabindex: '0', 'data-kpi': key },
    el('span', { class: 'pm-k' }, el('b', { text: t(`pm_${key}`) }), t(`pm_${key}_term`).toLowerCase().includes(t(`pm_${key}`).toLowerCase()) ? null : el('i', { class: 'pm-term', text: t(`pm_${key}_term`) })),
    el('strong', { class: 'pm-v', text: val }), sub ? el('small', { class: 'hint', text: sub }) : null, BARS[key] || null, MEDS[key] || null, delta, spark, fl ? el('span', { class: 'pm-flag' }, fl) : null);
  const d = (cur, prev, kind) => (p && prev != null && cur != null ? kmDelta(cur, prev, kind, pml) : null);
  const withTip = (node, key) => { attachTip(node, t(`pm_${key}_def`), false); node.setAttribute('aria-description', t(`pm_${key}_def`)); return node; };   // ADR-0101: the one tooltip
  const F = (lab, k) => (flag ? flag(lab, k) : null);
  const tiles = el('div', { class: `pm-tiles${rdOn ? ' seven' : ''}` },
    withTip(tile('thru', String(n.closed), t('pm_of', { n: n.total }), d(n.closed, p && p.closed, 'h'), pmSpark(sp((x) => x.closed)), F('km_closed', 'closed')), 'thru'),
    own ? null : withTip(tile('load', String(n.total), '', d(n.total, p && p.total, 'n'), pmSpark(sp((x) => x.total)), F('km_total', 'total')), 'load'),
    withTip(tile('rate', rate == null ? '—' : `${rate}%`, '', d(rate, prate, 'h'), pmSpark(sp((x) => pct(x.closed, x.total))), null), 'rate'),
    withTip(tile('mttr', hmOf(n.avg), t('pm_hm'), d(n.avg, p && p.avg, 'l'), pmSpark(sp((x) => x.avg), 'pm-spark-low'), F('km_avg', 'avg')), 'mttr'),
    withTip(tile('pts', String(n.points), share != null ? t('pm_share', { p: share }) : '', d(n.points, p && p.points, 'h'), pmSpark(sp((x) => x.points)), F('col_points', 'points')), 'pts'),
    rdOn ? withTip(tile('rd', String(n.rd || 0), '', d(n.rd || 0, p && (p.rd || 0), 'h'), pmSpark(sp((x) => x.rd || 0)), F('km_rd', 'rd')), 'rd') : null,
    withTip(tile('backlog', String(open.length), open.length ? t('pm_oldest', { a: oldest < 48 ? t('hours', { n: Math.round(oldest) }) : t('days', { n: Math.round(oldest / 24) }) }) : t('pf_none'), null, null, null), 'backlog'));
  const mix = [{ k: 'email', l: t('src_email'), v: n.email, c: 'c-email', lab: 'src_email' }, { k: 'self', l: t('src_self'), v: n.self, c: 'c-self', lab: 'src_self' }, { k: 'other', l: t('src_other'), v: n.other, c: 'c-other', lab: 'src_other' }];
  const mixBox = el('div', { class: 'pm-card' }, el('h4', {}, t('pm_mix_h'), el('i', { class: 'pm-term', text: 'Work intake mix' })), el('div', { class: 'pm-mix' }, pmDonut(mix),
    el('ul', { class: 'pm-legend' }, mix.map((m) => el('li', { class: m.c, 'data-src': m.k }, el('span', { class: 'pm-sw' }), el('span', { class: 'pm-lg-l', text: m.l }), el('b', { text: String(m.v) }),
      el('small', { class: 'hint', text: n.total ? `${Math.round((m.v / n.total) * 100)}%` : '' }), d(m.v, p && p[m.k], 'n'), F(m.lab, m.k))))),
    el('p', { class: 'hint', text: t(isTeamPortal && !viewAs ? 'pm_self_rate_me' : 'pm_self_rate', { p: n.total ? Math.round((n.self / n.total) * 100) : 0 }) }));
  const B = [[0, 24, 'pm_age_1'], [24, 72, 'pm_age_2'], [72, 168, 'pm_age_3'], [168, Infinity, 'pm_age_4']].map(([lo, hi, k]) => ({ k, v: open.filter((x) => (x.ageHours || 0) >= lo && (x.ageHours || 0) < hi).length }));
  const bmax = Math.max(1, ...B.map((b) => b.v));
  const ageBox = el('div', { class: 'pm-card pm-open-card' }, el('h4', { class: 'pm-open-h' }, `${t('pf_open')} — ${open.length}`, el('i', { class: 'pm-term', text: 'Backlog aging' })),
    el('div', { class: 'pm-age' }, B.map((b, i) => el('div', { class: `pm-age-row a${i}` }, el('span', { text: t(b.k) }), el('span', { class: 'pm-age-track' }, el('i', { style: `--w:${(b.v / bmax) * 100}%` })), el('b', { text: String(b.v) })))),
    open.length && item ? [el('ul', { class: 'pf-open' }, open.slice(0, 6).map(item)), open.length > 6 ? el('details', { class: 'more-work' }, el('summary', { text: t('me_open_more', { n: open.length - 6 }) }), el('ul', { class: 'pf-open' }, open.slice(6).map(item))) : null] : null);
  const tr = pmTrend(hist);
  const trendBox = tr ? el('div', { class: 'pm-card pm-wide' }, el('h4', {}, t('pm_trend_h'), el('i', { class: 'pm-term', text: 'Throughput · MTTR trend' })), tr,
    el('p', { class: 'hint pm-keys' }, el('span', { class: 'pm-key k-total' }), t('km_total'), el('span', { class: 'pm-key k-closed' }), t('km_closed'), el('span', { class: 'pm-key k-avg' }), t('km_avg'))) : null;
  if (own) {   // ADR-0114, direction D: what needs him now → his month against the team's median → his next step → his rhythm
    for (const tl of [...tiles.children]) if (tl.dataset.kpi === 'backlog') tl.remove();
    const late = open.filter((x) => (x.ageHours || 0) > 168).length;
    const nowBox = el('div', { class: 'pm-card pm-now' }, el('h4', { text: t('d_now_h') }),
      el('p', { class: 'pm-now-top' }, el('strong', { class: 'pm-now-n pm-count', text: String(open.length) }), el('span', { text: !open.length ? t('d_now_none') : late ? t('d_now_late', { n: late }) : t('d_now_ok') })),
      open.length && item ? el('ul', { class: 'pf-open' }, [...open].sort((x, y) => (y.ageHours || 0) - (x.ageHours || 0)).slice(0, 6).map(item)) : null,
      open.length > 6 ? el('p', { class: 'hint', text: t('me_open_more', { n: open.length - 6 }) }) : null,
      asOf ? el('p', { class: 'hint pm-asof', text: t('d_now_asof', { d: asOf }) }) : null);
    const nextBox = el('div', { class: 'pm-card pm-next' }, el('h4', { text: t('d_next_h') }), el('div', { class: 'pm-next-slot' }));
    return el('section', { class: 'pm-dash pm-d' }, el('div', { class: 'pm-d-top' }, nowBox, nextBox),
      el('h4', { class: 'pm-d-h', text: t(med ? 'd_month_h' : 'd_month_h0') }), el('p', { class: 'hint pm-period', text: `${p ? `${t('pm_cmp', { m: ml, p: pml })} ` : ''}${t(window.matchMedia && window.matchMedia('(hover: none)').matches ? 'pm_tip_tap' : 'pm_tip_hover')}` }), tiles,
      med ? el('p', { class: 'hint pm-med-note', text: t('pm_med_note', { n: med.n }) }) : null, cal,
      el('div', { class: `pm-cards${trendBox ? '' : ' no-trend'}` }, trendBox, mixBox));
  }
  return el('section', { class: 'pm-dash' }, el('p', { class: 'hint pm-period', text: `${p ? `${t('pm_cmp', { m: ml, p: pml })} ` : ''}${t(window.matchMedia && window.matchMedia('(hover: none)').matches ? 'pm_tip_tap' : 'pm_tip_hover')}` }), tiles,
    med ? el('p', { class: 'hint pm-med-note', text: t('pm_med_note', { n: med.n }) }) : null,
    el('div', { class: `pm-cards${trendBox ? '' : ' no-trend'}` }, trendBox, mixBox, ageBox));
}

// ---------- ADR-0079: the bento's small visuals — drawn from the same numbers as the tiles, never decoration ----------
/** The total's sources as one bar: from e-mail, opened himself, assigned by others — their real shares. */
function splitBar(T) {
  const parts = [['email', 'src_email', 'var(--sea)'], ['self', 'src_self', 'var(--live)'], ['other', 'src_other', 'var(--sig)']].map(([k, l, c]) => ({ v: Number(T[k]) || 0, l: t(l), c }));
  const sum = parts.reduce((s, p) => s + p.v, 0); if (!sum) return null; const pc = (v) => Math.round((v / sum) * 100);
  return el('div', { class: 'bt-split' },
    el('div', { class: 'bt-bar', role: 'img', 'aria-label': parts.map((p) => `${p.l} ${pc(p.v)}%`).join(' · ') }, parts.map((p) => el('i', { style: `width:${(p.v / sum) * 100}%;background:${p.c}`, title: `${p.l}: ${p.v}` }))),
    null);   // ADR-0102: each source's share is on its own tile — the bar draws the split, the words are not repeated
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
/** ADR-0087: a range counts as pulled only if the pulls cover every day of it (up to today). */
function rangePulled(r) {
  const today = saudiDay(new Date().toISOString()), to = r.to < today ? r.to : today, rs = datasets.map((d) => d.range).filter((x) => x && x.from && x.to).sort((x, y) => (x.from < y.from ? -1 : 1));
  let reach = r.from; for (const x of rs) { if (x.from > reach) break; if (x.to >= reach) { const n = new Date(`${x.to}T00:00:00Z`); n.setUTCDate(n.getUTCDate() + 1); reach = n.toISOString().slice(0, 10); } if (reach > to) return true; }
  return reach > to;
}
function personSnap(id, ym, week) {
  const pm = prevMonthOf(ym), pmOk = pulledPeriods('month').some((m) => m.ym === pm && m.whole), pw = prevWeekRange(week);
  return { ...rankFor(id, ym), v: 2, m: { n: numsFor(id, monthRangeOf(ym)), p: pmOk ? numsFor(id, monthRangeOf(pm)) : null }, w: { f: week.from, t: week.to, n: numsFor(id, week), p: rangePulled(pw) ? numsFor(id, pw) : null } };
}
function copyWeekMessage(id, ym, nm, week) {
  const s = personSnap(id, ym, week), [e, sf, o, tot, cl, avg, pts] = s.w.n, P = s.w.p || [null, null, null, '—', null, null, '—'];
  copyText(t('wk_msg', { name: (nm(id) || '').split(' ')[0], a: s.w.f, b: s.w.t, total: tot, email: e, self: sf, other: o, closed: cl, avg: avg < 0 ? '—' : hmOf(avg / 60), points: pts, ptotal: P[3], ppoints: P[6], link: rankLink(s) }), t('wk_copied', { name: nm(id) }));
}
/** On a phone with no pull of his own: his numbers as his manager sent them. */
function snapView(s) {
  const fv = (k, v) => (k === 'avg' ? (v < 0 ? '—' : hmOf(v / 60)) : String(v)), hv = (k, v) => (k === 'avg' ? (v < 0 ? null : v / 60) : v);
  const tbl = (label, plabel, n, p) => el('table', { class: 'km-snap' }, el('thead', {}, el('tr', {}, el('th', {}), el('th', { class: 'num', text: label }), el('th', { class: 'num', text: plabel }), el('th', { class: 'num', text: t('km_change') }), el('th', {}))),
    el('tbody', {}, SNAP_KEYS.map((k, i) => el('tr', {}, el('td', { text: t(SNAP_LABEL[k]) }), el('td', { class: 'num' }, el('b', { text: fv(k, n[i]) })), el('td', { class: 'num', text: p ? fv(k, p[i]) : '—' }),
      el('td', { class: 'num' }, p ? kmDelta(hv(k, n[i]), hv(k, p[i]), SNAP_KIND[k], plabel) : '—'), el('td', {}, flagBtn({ who: t('ms_me'), period: label, label: t(SNAP_LABEL[k]), value: fv(k, n[i]), prev: p ? fv(k, p[i]) : '—', def: t(SNAP_DEF[k]), asOf: s.at }))))));
  return el('section', { class: 'me-snap' }, el('h2', { text: t('ms_h') }), el('p', { class: 'hint', text: t('ms_lead', { at: s.at || '—' }) }),
    el('h3', { text: t('ms_month', { m: monthLabel(s.ym) }) }), s.m.p ? null : el('p', { class: 'hint', text: t('km_no_prev', { m: monthLabel(prevMonthOf(s.ym)) }) }), el('div', { class: 'table-wrap' }, tbl(monthLabel(s.ym), monthLabel(prevMonthOf(s.ym)), s.m.n, s.m.p)),
    s.w ? [el('h3', { text: t('ms_week', { a: s.w.f, b: s.w.t }) }), s.w.p ? null : el('p', { class: 'hint', text: t('ms_week_noprev') }), el('div', { class: 'table-wrap' }, tbl(t('ms_this_week'), t('ms_prev_week'), s.w.n, s.w.p))] : null,
    el('p', { class: 'me-teams', text: t('pg_rank', { r: s.r, n: s.n }) }));
}
const rankLink = (snap) => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}?portal=team#rank=${b64u.enc(snap)}`;
function parseRankSnap(o) {   // only his own numbers; anything else is refused
  if (!o || ![1, 2].includes(o.v) || typeof o.id !== 'string' || !/^[0-9A-Za-z_-]{1,20}$/.test(o.id) || !/^\d{4}-\d{2}$/.test(o.ym) || !Number.isInteger(o.r) || !Number.isInteger(o.n) || o.r < 1 || o.n < 1 || o.r > o.n || o.n > 200) return null;
  const num = (v) => (v == null ? null : Number.isFinite(Number(v)) ? Math.round(Number(v) * 10) / 10 : null);
  const lv = o.lv && Number.isInteger(o.lv.l) && o.lv.l >= 1 && o.lv.l <= LEVELS.length && Number.isFinite(Number(o.lv.s))
    ? { l: o.lv.l, s: Math.max(0, Math.min(100, Math.round(Number(o.lv.s)))), ax: Object.fromEntries(Object.entries(o.lv.ax && typeof o.lv.ax === 'object' ? o.lv.ax : {}).filter(([k, v]) => /^[a-zA-Z]{1,16}$/.test(k) && Number.isFinite(Number(v))).slice(0, 8).map(([k, v]) => [k, Math.max(0, Math.min(100, Math.round(Number(v))))])) } : null;
  const arr = (x) => (Array.isArray(x) && x.length === 7 && x.every((y) => Number.isFinite(Number(y)) && Number(y) >= -1 && Number(y) < 1e7) ? x.map(Number) : null), day = (x) => /^\d{4}-\d{2}-\d{2}$/.test(String(x || ''));
  const m = o.m && arr(o.m.n) && (o.m.p == null || arr(o.m.p)) ? { n: arr(o.m.n), p: o.m.p == null ? null : arr(o.m.p) } : null, w = o.w && day(o.w.f) && day(o.w.t) && arr(o.w.n) && (o.w.p == null || arr(o.w.p)) ? { f: o.w.f, t: o.w.t, n: arr(o.w.n), p: o.w.p == null ? null : arr(o.w.p) } : null;   // ADR-0087: no «before» when it was not pulled
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
    (() => { const n = numsFor(id, wk), pr = prevWeekRange(wk), p = rangePulled(pr) ? numsFor(id, pr) : null; return el('td', { class: 'wk-cell' }, t('wk_cell', { n: n[3], p: n[6] }), ' ', p ? kmDelta(n[6], p[6], 'h', t('ms_prev_week')) : null); })(),
    el('td', {}, el('button', { type: 'button', class: 'btn tiny rk-copy', text: `📋 ${t('rk_copy')}`, onclick: () => copyRankMessage(id, ym, nm, wk) }), ' ', el('button', { type: 'button', class: 'btn tiny wk-copy', text: `🗓 ${t('wk_copy')}`, onclick: () => copyWeekMessage(id, ym, nm, wk) })))));
  const sel = el('select', { class: 'rk-month', 'aria-label': t('rk_month'), onchange: (e) => { ym = e.target.value; draw(); } }, [[cur, t('rk_cur', { m: monthLabel(cur) })], [ymPrev(cur), monthLabel(ymPrev(cur))]].map(([v, l]) => el('option', { value: v, selected: v === ym ? '' : null, text: l })));
  draw();
  return el('section', { class: 'rk-sec', id: 'k-ranks' }, el('h2', { text: t('rk_h') }), el('p', { class: 'hint', text: t('rk_lead') }), el('div', { class: 'row' }, el('span', { text: t('rk_month') }), sel, el('span', { text: t('wk_week') }), el('select', { class: 'wk-week', 'aria-label': t('wk_week'), onchange: (e) => { wk = weekRange(Number(e.target.value)); draw(); } }, [[1, t('wk_last')], [0, t('wk_this')]].map(([v, l]) => el('option', { value: String(v), text: l })))),
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
      period: s(x.period, 20), kind: KD.includes(x.kind) ? x.kind : 'commercial', cat: ['tender', 'upsell'].includes(x.cat) ? x.cat : '', match: arr(x.match).map((m) => m.toLowerCase()), not: arr(x.not), note: s(x.note, 300), source: s(x.source, 120), manual: !!x.manual, ok: !!x.ok, files: Math.max(0, Math.round(Number(x.files) || 0)), date: /^\d{4}-\d{2}-\d{2}$/.test(String(x.date || '')) ? x.date : '' })).filter((x) => x.name),
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
    rows.push({ id: `i:${it.id}`, item: it, cat: it.cat || '', ok: it.ok, files: it.files || 0, name: it.name, client: it.client, line: it.line, status: it.status, kind: it.kind, value: it.value, period: it.period || (it.date || '').slice(0, 4), date: it.date, note: it.note, source: it.source, manual: it.manual, threads: th.map((x) => x.p), deck: true });
  }
  for (const x of live) if (!taken.has(x.k)) { const p = x.p, e2 = ed[x.k] || {}; rows.push({ id: `m:${x.k}`, key: x.k, ok: !!e2.ok, files: 0, name: e2.name || p.project, client: '', status: e2.status || (p.kraasa ? 'studied' : p.worked ? 'worked' : 'seen'), kind: p.kraasa ? 'tender' : '', value: 0, period: '', threads: [p], deck: false, tender: p.tender }); }
  for (const r of rows) { const t2 = r.threads; r.first = t2.map((p) => p.first).filter(Boolean).sort()[0] || r.date || ''; r.last = t2.map((p) => p.last).filter(Boolean).sort().pop() || r.date || '';
    r.messages = t2.reduce((x, p) => x + p.messages, 0); r.me = t2.reduce((x, p) => x + p.me, 0); r.akram = t2.reduce((x, p) => x + p.akram, 0); r.shaarawi = t2.reduce((x, p) => x + p.shaarawi, 0);
    r.worked = t2.some((p) => p.worked) || (r.manual && r.status !== 'seen'); r.aibrahim = t2.some((p) => p.aibrahim); r.kraasa = t2.some((p) => p.kraasa); r.rules = [...new Set(t2.flatMap((p) => (p.rules || '').split(',')).filter(Boolean))].sort().join(','); }
  // ADR-0092: the tender register feeds «My projects» — a tender submitted, won or lost counts here, once.
  if (tenders && tenders.items) {
    const ST = { submitted: 'submitted', won: 'won', lost: 'lost' }, nn = (x) => tdNorm(x).replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
    for (const i of tenders.items) { const st = ST[i.stage]; if (!st) continue; const key = nn(i.subject);
      // the closest row wins: the same name or the Etimad number first; one name inside the other only when they are nearly the same length
      // (so «Elaf Al-Arabia», a delivered H1 project, is not taken for «Elaf Al-Arabia — AVL + CAN + Gates», a new offer)
      const score = (r) => { const n = nn(r.name); if (!n) return 0; if (n === key) return 3; if (i.etimadNo && nn(i.etimadNo).length >= 4 && n.includes(nn(i.etimadNo))) return 3;
        const [sh, lo] = n.length < key.length ? [n, key] : [key, n]; return sh.length >= 10 && lo.includes(sh) && sh.length / lo.length >= 0.8 ? 2 : 0; };
      const hit = rows.map((r) => [r, score(r)]).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]).map(([r]) => r)[0];
      if (hit) { if ((PROJ_RANK[st] || 0) > (PROJ_RANK[hit.status] || 0)) hit.status = st; hit.tender = i.id; if (!hit.value && i.value) hit.value = i.value; if (st === 'lost' && i.reason) hit.reason = i.reason; continue; }
      rows.push({ id: `t:${i.id}`, tender: i.id, fromTender: true, ok: true, files: 0, name: i.subject, client: i.from || '', line: '', status: st, kind: 'tender', value: i.value || 0,
        period: (i.submittedOn || i.date).slice(0, 4), date: i.submittedOn || i.date, threads: [], first: i.date, last: i.stageAt || i.date, messages: 0, me: 0, akram: 0, shaarawi: 0,
        worked: true, manual: true, aibrahim: !!i.byFrom, kraasa: !!i.byKr, rules: [], reason: i.reason || '' }); }
  }
  return isTeamPortal ? rows : projectReport(rows,projectWork).rows;
}
const PROJ_RANK = { delivered: 7, ongoing: 6, won: 5, lost: 4, submitted: 3, studied: 2, worked: 1, seen: 0 };
const WONISH = ['won', 'ongoing', 'delivered'], BIDISH = ['submitted', 'won', 'ongoing', 'delivered', 'lost'];
const regEnsure = () => { if (!myRegister) myRegister = { schema: 'afaqy-projects-register/v1', asOf: new Date().toISOString().slice(0, 10), sources: [], h1: {}, items: [], board: [], mail: {} }; if (!myRegister.mail) myRegister.mail = {}; return myRegister; };
const projSave = async () => { await store.putRegister(myRegister); projRefresh(); };
// ADR-0118: one report snapshot, separate execution state, explicit local history.
let projectWork = cleanProjectWork(null), pwFilters = {q:'',client:'',owner:'',status:''};
async function pwCommit(next,expected=projectWork.revision) {
  if(isTeamPortal) throw Error('manager view required');
  const saved={...cleanProjectWork(next),revision:crypto.randomUUID()};
  await store.putProjectWork(saved,expected); projectWork=saved;
}
function pwModel(rows) {
  return rows.map(r=>{const td=tenders?.items.find(x=>x.id===r.tender);return {...r,tenderActivity:td?.activity||[],tenderFiles:td?.files||[]};});
}
function pwYearRows() {
  const year=((myProjects?.to)||(myRegister?.asOf)||saudiDay(new Date().toISOString())).slice(0,4);
  const lineOk=r=>{if(!projLineF)return true;const l=projectLine(r).line;return projLineF==='none'?!l:l===projLineF;};
  return projectsModel().filter(r=>(projAll || (r.deck ? String(r.period||'').includes(year) || String(r.date||'').slice(0,4)===year : String(r.last||r.date||'').slice(0,4)===year)) && lineOk(r));
}
function pwScreenRows() {
  let rows=pwYearRows();
  const q=r=>!projQuery || `${r.name} ${r.client||''} ${r.tender||''} ${r.threads.map(p=>p.project).join(' ')}`.toLowerCase().includes(projQuery.toLowerCase());
  if(projView==='followup') return projectReport(pwModel(rows),projectWork,pwFilters).rows;
  if(projView==='bids') rows=rows.filter(r=>BIDISH.includes(r.status) && (!projStatus||r.status===projStatus) && q(r));
  if(projView==='mail') rows=rows.map(r=>({...r,threads:r.threads.filter(p=>(!projOnlyMine||p.worked)&&(!projQuery||`${r.name} ${p.project}`.toLowerCase().includes(projQuery.toLowerCase())))})).filter(r=>r.threads.length);
  if(projView==='clients') rows=rows.filter(r=>!projQuery||String(r.client||'').toLowerCase().includes(projQuery.toLowerCase()));
  return rows;
}
const pwMoneyText=v=>v==null?'—':`${Number(v).toLocaleString('en-US',{maximumFractionDigits:2})} ${t('sar')}`;
const pwFieldLabel=k=>t(`pw_${k}`);
function pwFieldValue(k,v) {
  if(k==='milestones') return (v||[]).map(m=>`${m.done?'✓':'○'} ${m.title} (${m.weight})`).join(' · ');
  if(k==='execution') return t(`pw_exec_${v}`);
  if(k==='award'||k==='collected') return pwMoneyText(v);
  return String(v??'')||'—';
}
function pwEventText(e) {
  if(e.source==='tender') return `${t('pw_tender_history')} · ${e.action==='stage'?t(`td_st_${e.note}`):e.action||''} · ${e.action==='stage'?'':e.note||''}`;
  return [e.note,...Object.entries(e.changes||{}).map(([k,v])=>`${pwFieldLabel(k)}: ${pwFieldValue(k,v.before)} → ${pwFieldValue(k,v.after)}`)].filter(Boolean).join(' | ');
}
function pwTable(head,rows) {
  return el('div',{class:'table-wrap'},el('table',{class:'proj-tbl'},el('thead',{},el('tr',{},head.map(h=>el('th',{text:h})))),el('tbody',{},rows.length?rows.map(cells=>el('tr',{},cells.map(v=>el('td',{},v??'—')))):el('tr',{},el('td',{colspan:head.length,text:t('pw_empty')})))));
}
function pwDialog(title,cls='proj-edit') {
  const dlg=el('dialog',{class:cls},el('h2',{text:title}));
  dlg.addEventListener('close',()=>dlg.remove());document.body.append(dlg);return dlg;
}
function pwFollowupPage(scope) {
  const report=projectReport(pwModel(scope),projectWork,pwFilters), rows=report.rows;
  const choose=(key,options)=>el('label',{},el('span',{text:pwFieldLabel(key)}),el('select',{'aria-label':pwFieldLabel(key),onchange:e=>{pwFilters[key]=e.target.value;projRefresh();}},el('option',{value:'',text:t('proj_st_all')}),options.map(([v,l])=>el('option',{value:v,selected:pwFilters[key]===v,text:l}))));
  const form=el('form',{class:'form-grid',onsubmit:e=>{e.preventDefault();pwFilters.q=form.querySelector('input').value;projRefresh();}},
    el('label',{},el('span',{text:t('proj_find')}),el('input',{type:'search',value:pwFilters.q,'aria-label':t('proj_find')})),
    choose('client',[...new Set(scope.map(r=>r.client).filter(Boolean))].sort().map(v=>[v,v])),
    choose('owner',[...new Set(scope.map(r=>projectWorkFind(projectWork,r)?.owner).filter(Boolean))].sort().map(v=>[v,v])),
    choose('status',['seen','worked','studied','submitted','won','ongoing','delivered','lost'].map(v=>[v,t(`proj_f_${v}`)])),
    el('button',{type:'submit',class:'btn',text:t('pw_apply')}),el('button',{type:'button',class:'btn quiet',text:t('pw_reset'),onclick:()=>{pwFilters={q:'',client:'',owner:'',status:''};projRefresh();}}));
  return el('div',{class:'pw-followup'},el('p',{class:'hint',text:t('pw_intro')}),form,
    el('div',{class:'sm-row'},[['pw_projects',rows.length],['pw_overdue',report.totals.overdue],['pw_collected',pwMoneyText(report.totals.collected)]].map(([key,value])=>el('div',{class:'sm-card'},el('span',{text:t(key)}),el('b',{text:String(value)})))),
    pwTable([t('proj_c_name'),t('pw_owner'),t('pw_execution'),t('pw_progress'),t('pw_action'),t('pw_actionOwner'),t('pw_actionDue'),t('pw_risk'),t('pw_followup')],rows.map(r=>[el('div',{},el('b',{text:r.name}),el('div',{class:'hint',text:`${r.client||'—'} · ${t(`proj_f_${r.bidStatus}`)}`})),r.followup.owner||'—',t(`pw_exec_${r.followup.execution}`),r.progress==null?'—':`${r.progress}%`,r.followup.action||'—',r.followup.actionOwner||r.followup.owner||'—',el('span',{text:r.followup.actionDue||'—',class:r.followup.actionDue && r.followup.action && r.followup.actionDue<report.today?'st-pill st-lost':''}),r.followup.risk||'—',el('button',{type:'button',class:'btn tiny',text:t('pw_open'),onclick:()=>pwEdit(r)})])));
}
function pwEdit(row) {
  if(isTeamPortal)return;
  const fresh=projectsModel().find(r=>r.id===row.id)||row, report=projectReport(pwModel([fresh]),projectWork), r=report.rows[0], initial=projectWork.revision;
  const draft=JSON.parse(JSON.stringify(r.followup)), dlg=pwDialog(r.name), body=el('form',{'data-pw-form':'',onsubmit:e=>{e.preventDefault();save();}});
  const field=(key,type='text')=>el('label',{},el('span',{text:pwFieldLabel(key)}),el('input',{type,value:draft[key]??'','data-pw':key,...(type==='number'?{min:'0',step:'0.01'}:{}),maxlength:type==='text'?'500':null,oninput:e=>{draft[key]=e.target.value;}}));
  const eligible=WONISH.includes(r.bidStatus), exec=el('select',{'data-pw':'execution',onchange:e=>{draft.execution=e.target.value;}},['not_started','ongoing','on_hold','delivered'].map(v=>el('option',{value:v,selected:draft.execution===v,disabled:v!=='not_started'&&!eligible,text:t(`pw_exec_${v}`)})));
  const milestones=el('div',{'data-pw-milestones':''}), paint=()=>set(milestones,draft.milestones.map((m,i)=>el('div',{class:'row',style:'gap:8px;flex-wrap:wrap'},el('input',{type:'checkbox',checked:m.done,'aria-label':`${t('pw_complete')} ${i+1}`,onchange:e=>{m.done=e.target.checked;}}),el('input',{value:m.title,required:true,maxlength:'160','aria-label':`${t('pw_milestone')} ${i+1}`,oninput:e=>{m.title=e.target.value;}}),el('input',{type:'number',min:'1',step:'1',required:true,value:m.weight,style:'width:90px','aria-label':`${t('pw_weight')} ${i+1}`,oninput:e=>{m.weight=Number(e.target.value);}}),el('button',{type:'button',class:'btn quiet tiny',text:t('pw_remove'),onclick:()=>{draft.milestones.splice(i,1);paint();}}))));paint();
  const note=el('textarea',{rows:'2',maxlength:'1000','data-pw':'note'}), error=el('p',{role:'alert',class:'hint'}), saveButton=el('button',{type:'submit',class:'btn primary',text:t('save')});
  const save=async()=>{
    if(!body.reportValidity())return;
    saveButton.disabled=true;error.textContent='';
    try {
      const next=projectWorkUpdate(projectWork,fresh,draft,{at:new Date().toISOString(),id:crypto.randomUUID(),note:note.value});
      await pwCommit(next,initial);dlg.close();projRefresh();toast(t('proj_saved'));
    } catch(e) {error.textContent=t(e.message.includes('revision')?'pw_stale':e.message.includes('award')?'pw_award_required':e.message.includes('milestones')?'pw_milestone_error':e.message.includes('date')?'pw_date_error':e.message.includes('money')?'pw_money_error':'pw_save_error');} finally{saveButton.disabled=false;}
  };
  set(body,el('p',{class:'hint',text:t('pw_separate')}),el('div',{class:'form-grid'},field('owner'),field('action'),field('actionOwner'),field('actionDue','date'),field('risk'),el('label',{},el('span',{text:t('pw_execution')}),exec),field('award','number'),field('collected','number')),
    eligible && draft.execution==='not_started'?el('button',{type:'button',class:'btn',text:t('pw_start'),onclick:()=>{draft.execution='ongoing';exec.value='ongoing';}}):null,
    draft.action?el('button',{type:'button',class:'btn quiet',text:t('pw_action_done'),onclick:()=>{note.value=[note.value,`${t('pw_action_done')}: ${draft.action}`].filter(Boolean).join('\n');for(const k of ['action','actionOwner','actionDue']) {draft[k]='';body.querySelector(`[data-pw="${k}"]`).value='';}}}):null,
    el('h3',{text:t('pw_milestones')}),el('p',{class:'hint',text:t('pw_weights_hint')}),milestones,el('button',{type:'button',class:'btn tiny',text:t('pw_add_milestone'),onclick:()=>{draft.milestones.push({id:crypto.randomUUID(),title:'',weight:1,done:false});paint();}}),
    el('label',{},el('span',{text:t('pw_note')}),note),error,el('div',{class:'row'},saveButton,el('button',{type:'button',class:'btn quiet',text:t('cancel'),onclick:()=>dlg.close()})),
    el('h3',{text:t('pw_history')}),el('p',{class:'hint',text:t('pw_history_hint')}),pwTable([t('pw_time'),t('pw_change')],report.events.map(e=>[e.at,pwEventText(e)])));
  dlg.append(body);dlg.showModal();
}
async function pwFileIndex(rows) {
  const files=[];
  for(const r of rows) {
    const list=[...(r.tenderFiles||[]),...(r.item ? await store.getProjectFiles(r.item.id):[])];
    for(const f of list) files.push({projectId:r.id,project:r.name,name:f.name||'',kind:f.kind||'other',size:f.blob?.size ?? f.size ?? '',at:f.at||'',available:!!f.blob});
  }
  return files;
}
function pwReports(preferred='html') {
  if(isTeamPortal)return;
  const scopeLabel=[t(`pw_scope_${projView}`),projAll?t('proj_all'):t('proj_year',{y:((myProjects?.to)||(myRegister?.asOf)||saudiDay(new Date().toISOString())).slice(0,4)}),projView==='followup'?Object.values(pwFilters).filter(Boolean).join(' · '):projView==='summary'?'':[projStatus,projQuery].filter(Boolean).join(' · ')].filter(Boolean).join(' · ');
  const rows=pwModel(pwScreenRows()), selected=new Set(rows.map(r=>r.id)), snapshot=structuredClone(projectWork), generatedAt=new Date().toISOString(), day=saudiDay(generatedAt), from=new Date(`${day}T12:00:00Z`);from.setUTCDate(from.getUTCDate()-6);
  const filters={from:from.toISOString().slice(0,10),to:day,client:'',owner:'',status:'',q:''};
  const dlg=pwDialog(t('pw_reports'),'proj-layer pw-report-dialog'), body=el('div',{class:'pl-body'}), controls=el('form',{class:'form-grid'}), preview=el('div',{'data-pw-preview':''}), error=el('p',{role:'alert'});let result;
  const paint=()=>{try{const candidates=projectReport(rows,snapshot,filters,day);result=projectReport(rows.filter(r=>selected.has(r.id)),snapshot,filters,day);set(preview,el('p',{text:t('pw_report_count',{n:result.rows.length,e:result.events.length,a:result.actions.length})}),pwTable([t('pw_select'),t('proj_c_name'),t('pw_owner'),t('proj_c_status'),t('pw_award'),t('pw_collected')],candidates.rows.map(r=>[el('input',{type:'checkbox',checked:selected.has(r.id),'aria-label':`${t('pw_select')} ${r.name}`,onchange:e=>{if(e.target.checked)selected.add(r.id);else selected.delete(r.id);paint();}}),r.name,r.followup.owner||'—',t(`proj_f_${r.status}`),pwMoneyText(r.followup.award),pwMoneyText(r.followup.collected)])));error.textContent='';}catch{result=null;error.textContent=t('pw_date_error');}};
  for(const k of ['from','to']) controls.append(el('label',{},el('span',{text:t(`pw_${k}`)}),el('input',{type:'date',value:filters[k],onchange:e=>{filters[k]=e.target.value;paint();}})));
  for(const [k,options] of [['client',[...new Set(rows.map(r=>r.client).filter(Boolean))]],['owner',[...new Set(rows.map(r=>projectWorkFind(snapshot,r)?.owner).filter(Boolean))]],['status',[...new Set(rows.map(r=>r.status))]]]) controls.append(el('label',{},el('span',{text:pwFieldLabel(k)}),el('select',{onchange:e=>{filters[k]=e.target.value;paint();}},el('option',{value:'',text:t('proj_st_all')}),options.sort().map(v=>el('option',{value:v,text:k==='status'?t(`proj_f_${v}`):v})))));
  controls.append(el('label',{},el('span',{text:t('proj_find')}),el('input',{type:'search',oninput:e=>{filters.q=e.target.value;paint();}})));controls.addEventListener('submit',e=>e.preventDefault());
  const choices=el('div',{class:'row',style:'flex-wrap:wrap'});
  for(const [mode,label] of [['xlsx','proj_excel'],['pdf','proj_pdf'],['html','pw_html']]) choices.append(el('button',{type:'button',class:`btn ${preferred===mode?'primary':''}`,text:t(label),onclick:async e=>{
    if(!result)return;const button=e.currentTarget, printWindow=mode==='pdf'?window.open('','_blank'):null;if(mode==='pdf'&&!printWindow){error.textContent=t('rep_popup');return;}button.disabled=true;
    try{const exportData={...structuredClone(result),generatedAt,scope:scopeLabel,files:await pwFileIndex(result.rows)};if(mode==='xlsx')await pwXlsx(exportData);else{const html=pwHtml(exportData,mode==='html');if(mode==='pdf')openReport(html,'pdf','AFAQY-project-report',printWindow);else openReport(html,'html',`AFAQY-project-dashboard-${day}`);}toast(t('pw_exported'));}
    catch(e){printWindow?.close();console.error(e);error.textContent=t('pw_export_error');}finally{button.disabled=false;}
  }}));
  body.append(el('p',{class:'hint',text:t('pw_report_hint')}),el('p',{class:'hint',text:`${t('pw_generated')}: ${generatedAt} · ${scopeLabel}`}),controls,choices,error,preview);dlg.append(body);paint();dlg.showModal();
}
function pwReportTables(r) {
  return [
    {name:t('proj_p_summary'),headers:[t('proj_c_item'),t('pw_value')],rows:[['pw_projects',r.totals.count],['pw_offer',r.totals.offer],['pw_award',r.totals.award],['pw_collected',r.totals.collected],['pw_award_missing',r.totals.awardMissing],['pw_overdue',r.totals.overdue],['pw_from',r.filters.from||'—'],['pw_to',r.filters.to||'—'],['pw_generated',r.generatedAt],['pw_scope',r.scope||''],['pw_client',r.filters.client||t('proj_st_all')],['pw_owner',r.filters.owner||t('proj_st_all')],['pw_status',r.filters.status?t(`proj_f_${r.filters.status}`):t('proj_st_all')]].map(([k,v])=>[t(k),v])},
    {name:t('pw_projects'),headers:['ID',t('proj_c_name'),t('proj_c_client'),t('proj_c_status'),t('pw_execution'),t('pw_owner'),t('pw_offer'),t('pw_award'),t('pw_collected'),t('pw_progress'),t('pw_risk')],rows:r.rows.map(x=>[x.id,x.name,x.client||'',t(`proj_f_${x.status}`),t(`pw_exec_${x.followup.execution}`),x.followup.owner,x.value,x.followup.award,x.followup.collected,x.progress==null?'':x.progress/100,x.followup.risk])},
    {projectIds:r.events.map(e=>e.projectId),name:t('pw_history'),headers:[t('pw_time'),t('proj_c_name'),t('pw_change')],rows:r.events.map(e=>[e.at,e.project,pwEventText(e)])},
    {projectIds:r.actions.map(e=>e.projectId),name:t('pw_actions'),headers:[t('proj_c_name'),t('pw_action'),t('pw_actionOwner'),t('pw_actionDue'),t('pw_overdue')],rows:r.actions.map(a=>[a.project,a.action,a.owner,a.due,a.overdue?'✓':''])},
    {projectIds:r.rows.flatMap(x=>x.followup.milestones.map(()=>x.id)),name:t('pw_milestones'),headers:[t('proj_c_name'),t('pw_milestone'),t('pw_weight'),t('pw_complete')],rows:r.rows.flatMap(x=>x.followup.milestones.map(m=>[x.name,m.title,m.weight,m.done?'✓':'']))},
    {projectIds:(r.files||[]).map(f=>f.projectId),name:t('pw_file_index'),headers:[t('proj_c_name'),t('pw_filename'),t('pw_file_kind'),t('pw_bytes'),t('pw_time')],rows:(r.files||[]).map(f=>[f.project,f.name,t(tdFileKind[f.kind] || (f.kind==='photo'?'proj_fk_photo':`td_file_${f.kind}`)),f.size,f.at])}
  ];
}
async function pwXlsx(report) {
  const X=await loadXlsx(), wb=X.utils.book_new();wb.Workbook={Views:[{RTL:lang!=='en'}]};
  for(const [i,table] of pwReportTables(report).entries()) {
    const ws=X.utils.aoa_to_sheet([table.headers,...table.rows]);ws['!autofilter']={ref:ws['!ref']};ws['!cols']=table.headers.map((h,n)=>({wch:n===0?25:Math.min(55,Math.max(16,h.length))}));
    if(i===1) for(let n=2;n<table.rows.length+2;n++) if(ws[`J${n}`]?.t==='n')ws[`J${n}`].z='0%';
    X.utils.book_append_sheet(wb,ws,table.name.replace(/[\\/?*\[\]:]/g,' ').slice(0,31));
  }
  X.writeFile(wb,`AFAQY-project-report-${report.today}.xlsx`);
}
function pwHtml(report,interactive) {
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tables=pwReportTables(report), labels={search:t('proj_find'),all:t('proj_st_all'),empty:t('pw_empty'),count:t('pw_projects'),offer:t('pw_offer'),award:t('pw_award'),collected:t('pw_collected')};
  const renderTable=table=>`<div class="scroll"><table><thead><tr>${table.headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${table.rows.length?table.rows.map((row,i)=>`<tr${table.projectIds?.[i]?' data-project-id="'+esc(table.projectIds[i])+'"':''}>${row.map((c,n)=>`<td>${esc(table===tables[1]&&n===9&&typeof c==='number'?Math.round(c*100)+'%':c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${table.headers.length}">${esc(t('pw_empty'))}</td></tr>`}</tbody></table></div>`;
  const projectRows=report.rows.map(r=>({id:r.id,name:r.name,client:r.client||'',owner:r.followup.owner,status:t(`proj_f_${r.status}`),execution:t(`pw_exec_${r.followup.execution}`),offer:r.value||0,award:r.followup.award,collected:r.followup.collected,progress:r.progress,action:r.followup.action,due:r.followup.actionDue,risk:r.followup.risk,awardMissing:WONISH.includes(r.status)&&r.followup.award==null}));
  // JSON is inert data; '<' is escaped so filenames and notes cannot terminate its script element.
  const data=JSON.stringify({rows:projectRows,labels}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const script=interactive?`<script type="application/json" id="report-data">${data}</script><script>
  const data=JSON.parse(document.getElementById('report-data').textContent), q=document.getElementById('search'), status=document.getElementById('status'), client=document.getElementById('client'), owner=document.getElementById('owner');
  for(const [control,key] of [[status,'status'],[client,'client'],[owner,'owner']])for(const value of [...new Set(data.rows.map(r=>r[key]).filter(Boolean))].sort()){const option=document.createElement('option');option.value=value;option.textContent=value;control.append(option);}
  function paint(){const rows=data.rows.filter(r=>(!q.value||[r.name,r.client,r.owner,r.action].join(' ').toLowerCase().includes(q.value.toLowerCase()))&&(!status.value||r.status===status.value)&&(!client.value||r.client===client.value)&&(!owner.value||r.owner===owner.value));const ids=new Set(rows.map(r=>r.id));for(const tr of document.querySelectorAll('[data-project-id]'))tr.hidden=!ids.has(tr.dataset.projectId);document.getElementById('award-missing').textContent=rows.filter(r=>r.awardMissing).length;const body=document.getElementById('projects-body');body.replaceChildren();for(const r of rows){const tr=document.createElement('tr');for(const value of [r.name,r.client,r.owner,r.status,r.execution,r.offer,r.award??'—',r.collected??'—',r.progress==null?'—':r.progress+'%',r.action,r.due,r.risk]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);}for(const key of ['count','offer','award','collected'])document.getElementById('kpi-'+key).textContent=(key==='count'?rows.length:rows.reduce((n,r)=>n+(r[key]||0),0)).toLocaleString();}
  for(const c of [q,status,client,owner])c.addEventListener('input',paint);paint();
  </script>`:'';
  const kpis=[['count',report.totals.count],['offer',report.totals.offer],['award',report.totals.award],['collected',report.totals.collected]];
  const interactiveTable=`<div class="filters"><input id="search" type="search" placeholder="${esc(labels.search)}" aria-label="${esc(labels.search)}">${[['status','pw_status'],['client','pw_client'],['owner','pw_owner']].map(([id,k])=>`<label>${esc(t(k))}<select id="${id}"><option value="">${esc(labels.all)}</option></select></label>`).join('')}</div><div class="scroll"><table><thead><tr>${['proj_c_name','pw_client','pw_owner','pw_status','pw_execution','pw_offer','pw_award','pw_collected','pw_progress','pw_action','pw_actionDue','pw_risk'].map(k=>`<th>${esc(t(k))}</th>`).join('')}</tr></thead><tbody id="projects-body"></tbody></table></div>`;
  return `<!doctype html><html lang="${lang}" dir="${dirOf(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t('pw_reports'))}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#F2F4F7;color:#18232E;font-family:'Segoe UI',Tahoma,sans-serif;line-height:1.7}main{max-width:1500px;margin:auto;padding:24px}header{border-bottom:4px solid #2A7130;display:flex;gap:22px;align-items:center;padding-bottom:18px}header img{width:130px}h1{margin:0;font-size:26px}h2{font-size:20px}p{color:#5C6B78}section{background:#FFFFFF;border:1px solid #E3EAF0;border-radius:16px;padding:20px;margin:18px 0}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.cards>div{padding:18px;background:#FFFFFF;border:1px solid #E3EAF0;border-top:4px solid #0E7C86;border-radius:12px}.cards b{display:block;font-size:28px}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th{text-align:start;background:#1C1E3D;color:#FFFFFF;padding:10px}td{padding:10px;border-bottom:1px solid #E3EAF0;vertical-align:top;overflow-wrap:anywhere;max-width:380px}.filters{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}input,select{font:inherit;border:1px solid #8797A3;border-radius:8px;padding:8px;background:#FFFFFF;max-width:100%}label{display:flex;gap:8px;align-items:center}footer{font-size:12px;color:#5C6B78}@media(max-width:700px){main{padding:12px}.cards{grid-template-columns:repeat(2,minmax(0,1fr))}header{align-items:flex-start}header img{width:80px}}@media print{body{background:#FFFFFF}main{padding:0}.filters{display:none}section{break-inside:auto;border:0;padding:0}thead{display:table-header-group}tr{break-inside:avoid}.scroll{overflow:visible}table{font-size:10px}.cards b{font-size:20px}@page{size:A4 landscape;margin:10mm}}
  </style></head><body><main><header><img src="${logoDataUrl()}" alt="AFAQY"><div><h1>${esc(t('pw_reports'))}</h1><div>${esc(t('pw_generated'))}: ${esc(report.generatedAt)}</div><div>${esc(report.scope)}</div></div></header><p>${esc(t('pw_snapshot'))}</p><div class="cards">${kpis.map(([key,v])=>`<div>${esc(labels[key])}<b id="kpi-${key}">${Number(v).toLocaleString('en-US')}</b></div>`).join('')}</div><p>${esc(t('pw_currency'))} · ${esc(t('pw_award_missing'))}: <span id="award-missing">${report.totals.awardMissing}</span></p><p>${esc(t('pw_report_hint'))} ${esc(report.filters.from||'—')} → ${esc(report.filters.to||'—')}</p><section><h2>${esc(t('pw_projects'))}</h2>${interactive?interactiveTable:renderTable(tables[1])}</section>${tables.slice(2).map(table=>`<section><h2>${esc(table.name)}</h2>${renderTable(table)}</section>`).join('')}<footer>${esc(t('pw_export_footer'))} · AFAQY Jeddah · v${PORTAL_VERSION}</footer></main>${script}</body></html>`;
}

function projWorkspaceBody() {
  const up = el('input', { type: 'file', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; e.target.value = ''; await projTakeFile(f, up.dataset.kind || ''); } });   // ADR-0101: one picker, the chosen kind
  const pick = (kind, accept) => { up.dataset.kind = kind; up.accept = accept; up.click(); };
  const opt = (icon, key, onclick) => el('button', { type: 'button', class: 'proj-imp-opt', onclick: (e) => { e.currentTarget.closest('details').open = false; onclick(); } },
    el('b', { text: `${icon} ${t(`proj_imp_${key}`)}` }), el('small', { class: 'hint', text: t(`proj_imp_${key}_d`) }));
  const impMenu = el('details', { class: 'proj-imp' }, el('summary', { class: 'btn quiet tiny', text: `⇧ ${t('proj_imp')} ▾` }),
    el('div', { class: 'proj-imp-menu', role: 'menu' },
      opt('📒', 'reg', () => pick('register', '.json,application/json')),
      opt('📨', 'mail', () => pick('mail', '.json,application/json')),
      opt('📋', 'paste', projPasteDialog),
      opt('📊', 'xlsx', () => pick('xlsx', '.xlsx'))));
  const head = el('div', { class: 'row', style: 'justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px' }, el('h2', { style: 'margin:0' }, t('proj_h'), helpQ('help_proj')),
    el('div', { class: 'row proj-actions' }, el('button', { type: 'button', class: 'btn primary tiny', text: `＋ ${t('proj_add')}`, onclick: () => projEdit(null) }),
      el('button', { type: 'button', class: 'btn tiny', text: `⇩ ${t('proj_pull')}`, onclick: projPrompt }), el('button', { type: 'button', class: 'btn tiny', text: `⬇ ${t('proj_excel')}`, onclick: projXlsx }),
      el('button', { type: 'button', class: 'btn tiny', text: `🖨 ${t('proj_pdf')}`, onclick: projReport }), el('button',{type:'button',class:'btn tiny',text:t('pw_reports'),onclick:()=>pwReports()}), impMenu, up));
  // ADR-0092/0093: the tender register alone is enough to open the workspace; the empty state still says where the data goes in
  if (!myProjects && !myRegister && !(tenders && tenders.items.length)) return el('section', { class: 'proj' }, head, mailSrc('projects'), el('div', { class: 'empty', text: t('proj_none') }));
  const year = ((myProjects && myProjects.to) || (myRegister && myRegister.asOf) || '2026').slice(0, 4), y0 = `${year}-01-01`;
  const all = projectsModel(), scope = pwYearRows();
  const sar = (v) => `${Math.round(v).toLocaleString('en-US')} ${t('sar')}`, sumV = (l) => l.reduce((x, r) => x + r.value, 0);
  const tabs = el('div', { class: 'pills proj-pages' }, [['followup', 'pw_followup'], ['mail', 'proj_p_mail'], ['bids', 'proj_p_bids'], ['summary', 'proj_p_summary'], ['clients', 'proj_v_clients']].map(([k, l]) =>
    el('button', { type: 'button', class: `pill-btn${projView === k ? ' on' : ''}`, text: t(l), onclick: () => { projView = k; projRefresh(); } })));
  const lineAll = (() => { const keep = projLineF; projLineF = ''; const l = pwYearRows(); projLineF = keep; return l; })();
  const lineN = (k) => lineAll.filter((r) => { const l = projectLine(r).line; return k === '' ? true : k === 'none' ? !l : l === k; }).length;
  const lines = el('div', { class: 'pills proj-lines', role: 'group', 'aria-label': t('proj_c_line2') }, [['', 'proj_line_all'], ['tender', 'proj_line_tender'], ['upsell', 'proj_line_upsell'], ['none', 'proj_line_none']].map(([k, l]) =>
    el('button', { type: 'button', class: `pill-btn${projLineF === k ? ' on' : ''}`, 'data-line': k || 'all', 'aria-pressed': String(projLineF === k), text: `${t(l)} (${lineN(k)})`, onclick: () => { projLineF = k; projRefresh(); } })));
  const delAll = ['mail', 'bids', 'followup'].includes(projView) ? el('button', { type: 'button', class: 'btn tiny quiet proj-del-all', text: `🗑 ${t('proj_del_all')}`, onclick: () => projDeleteAll(pwScreenRows()) }) : null;
  const period = el('div', { class: 'pills' }, el('button', { type: 'button', class: `pill-btn${projAll ? '' : ' on'}`, text: t('proj_year', { y: year }), onclick: () => { projAll = false; projRefresh(); } }),
    el('button', { type: 'button', class: `pill-btn${projAll ? ' on' : ''}`, text: t('proj_all'), onclick: () => { projAll = true; projRefresh(); } }));
  const search = (ph) => el('input', { type: 'search', class: 'proj-q', placeholder: ph, value: projQuery, oninput: (e) => { projQuery = e.target.value; clearTimeout(projWorkspaceBody.t); projWorkspaceBody.t = setTimeout(projRefresh, 300); } });
  const q = (r) => !projQuery || `${r.name} ${r.client} ${r.tender || ''} ${r.threads.map((p) => p.project).join(' ')}`.toLowerCase().includes(projQuery.toLowerCase());
  const pill = (st) => el('span', { class: `st-pill st-${st}`, text: t(`proj_f_${st}`) });
  const lineChip = (r) => { const { line, auto } = projectLine(r); return el('span', { class: `chip proj-line proj-line-${line || 'none'}`, title: auto ? t('proj_line_auto_t') : '', text: `${line ? t(`proj_line_${line}`) : t('proj_line_none')}${auto && line ? ' ·' : ''}` }); };
  const acts = (r, { attach = false } = {}) => el('td', { class: 'row-acts' },
    el('button',{type:'button',class:'icon-btn',title:t('pw_followup'),text:'↗',onclick:()=>pwEdit(r)}),
    el('button', { type: 'button', class: `icon-btn${r.ok ? ' on' : ''}`, title: t('proj_ok'), text: '✓', onclick: () => projToggleOk(r) }),
    el('button', { type: 'button', class: 'icon-btn', title: t('proj_edit'), text: '✎', onclick: () => projEdit(r) }),
    el('button', { type: 'button', class: 'icon-btn', title: t('proj_files'), text: r.files ? `📎${r.files}` : '📎', onclick: () => projFiles(r) }),
    attach ? el('button', { type: 'button', class: 'icon-btn', title: t('proj_attach'), text: '🔗', onclick: () => projAttach(r) }) : null,
    el('button', { type: 'button', class: 'icon-btn', title: t('proj_delete'), text: '✕', onclick: () => projDelete(r) }));
  const ordered = (rows, key) => { const ids = sortByOrder(rows.map((r) => r.id), key); const pos = new Map(ids.map((id, n) => [id, n])); return [...rows].sort((x, y) => pos.get(x.id) - pos.get(y.id)); };
  let page;
  if (projView === 'followup') { page=pwFollowupPage(scope);
  } else if (projView === 'mail') {
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
          el('td', { text: r.deck ? r.name : '—' }), el('td', {}, pill(r.status), lineChip(r)), el('td', { class: 'ltr', text: p.last || '—' }), el('td', { class: 'num', text: String(p.messages) }),
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
          el('td', { text: r.client && r.client !== r.name ? r.client : '—' }), el('td', {}, pill(r.status), lineChip(r)), el('td', { class: 'num', text: r.value ? r.value.toLocaleString('en-US') : '—' }),
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
  return el('section', { class: 'proj' }, head, projView === 'mail' ? mailSrc('projects', false) : null, src, el('div', { class: 'row proj-tools' }, tabs, period), el('div', { class: 'row proj-tools' }, lines, delAll), page);
}
async function projFilesExport(refs = null) {
  const out = {}; for (const it of (myRegister ? myRegister.items : [])) { if (!it.files) continue; const files = (await store.kvGet(`pf:${it.id}`)) || [];
    if (refs) { out[it.id] = files.filter((f) => f.blob instanceof Blob).map((f) => { const path = `files/${String(refs.length + 1).padStart(4, '0')}_${zipSafeName(f.name)}`; refs.push({ path, blob: f.blob }); return { name: f.name, type: f.type, size: f.size, kind: f.kind, at: f.at, zip: path }; }); continue; }   // v9.79
    out[it.id] = await Promise.all(files.map((f) => new Promise((res) => { const fr = new FileReader(); fr.onload = () => res({ name: f.name, type: f.type, size: f.size, kind: f.kind, at: f.at, data: fr.result }); fr.onerror = () => res(null); fr.readAsDataURL(f.blob); }))).then((l) => l.filter(Boolean)); }
  return out;
}
async function projFilesImport(map) {
  for (const [id, list] of Object.entries(map)) { if (!Array.isArray(list) || (await store.kvGet(`pf:${id}`))) continue;
    const files = []; for (const f of list.slice(0, 50)) { try { if (f.blob instanceof Blob) { files.push({ name: String(f.name).slice(0, 160), type: String(f.type || f.blob.type), size: f.blob.size, kind: ['technical', 'financial', 'photo', 'other'].includes(f.kind) ? f.kind : 'other', at: String(f.at || '').slice(0, 10), blob: f.blob }); continue; }   // v9.79: from the ZIP
      const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(String(f.data)); if (!m) continue; const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]); const u8 = new Uint8Array(bin.length); for (let q = 0; q < bin.length; q++) u8[q] = bin.charCodeAt(q); const blob = new Blob([u8], { type: m[1] || 'application/octet-stream' }); files.push({ name: String(f.name).slice(0, 160), type: String(f.type || blob.type), size: blob.size, kind: ['technical', 'financial', 'photo', 'other'].includes(f.kind) ? f.kind : 'other', at: String(f.at || '').slice(0, 10), blob }); } catch { /* skip a broken file */ } }
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
  // ADR-0106: SheetJS 0.20.3, served by the portal itself — no outside CDN (0.18.5 carried CVE-2023-30533 and CVE-2024-22363)
  if (!window.XLSX) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = './assets/vendor/xlsx.full.min.js'; s.onload = res; s.onerror = rej; document.head.append(s); });
  const X = window.XLSX;
  if (!X.__byAuthor) {   // ADR-0090: every workbook the portal writes names its author in the file's properties
    const w = X.writeFile.bind(X); X.writeFile = (wb, name, o) => { wb.Props = { ...(wb.Props || {}), Title: name, Author: AUTHOR.en, Company: 'AFAQY — Jeddah', Comments: `${t('brand')} — ${t('portal')} v${PORTAL_VERSION} · ${t('by_line')}` }; return w(wb, name, o); };
    X.__byAuthor = true; }
  return X;
}
async function projXlsx() { pwReports('xlsx'); }
// ---------- ADR-0101: «My projects» imports — four kinds said plainly; a file of another place is sent there ----------
async function projTakeFile(f, kind) {
  const nm = f.name.toLowerCase();
  if (/\.(pst|ost)$/.test(nm)) { projWrongPlace('proj_wrong_pst'); return; }
  if (/\.jsonl\.gz$|\.jsonl$|\.part$/.test(nm)) { projWrongPlace('proj_wrong_ext'); return; }
  if (/\.xlsx$/.test(nm)) { await projXlsxImport(f); return; }
  let j; try { j = JSON.parse(await f.text()); } catch { toast(t('err_json')); return; }
  await projTakeJson(j, kind);
}
async function projTakeJson(j, kind) {
  if (j && j.backup === 'afaqy-projects-backup/v1') {   // ADR-0125: a backup saved before «delete all» puts the projects back as they were
    const reg = j.register ? cleanRegister(j.register) : null, pr = j.projects ? cleanProjects(j.projects) : null;
    if (!reg && !pr) { toast(t('proj_bad')); return false; }
    if (!confirm(t('proj_restore_q', { d: String(j.exportedAt || '').slice(0, 10) }))) return false;
    if (reg) { myRegister = reg; await store.putRegister(myRegister); } if (pr) { myProjects = pr; await store.putProjects(myProjects); }
    toast(t('proj_restored')); projRefresh(); return true; }
  if (j && j.schema === 'afaqy-tenders-from-mail/v1') { projWrongPlace('proj_wrong_td'); return false; }
  if (j && j.schema === 'afaqy-projects-register/v1') { const r = cleanRegister(j); if (!r) { toast(t('proj_bad')); return false; }
    if (myRegister) { const have = new Set(myRegister.items.map((x) => x.id)); for (const x of r.items) if (!have.has(x.id)) myRegister.items.push(x); myRegister.board = r.board; myRegister.h1 = r.h1; myRegister.sources = r.sources; myRegister.asOf = r.asOf; }
    else myRegister = r;
    await store.putRegister(myRegister); toast(`${kind === 'mail' ? `${t('proj_was_reg')} ` : ''}${t('proj_reg_loaded', { n: myRegister.items.length, b: myRegister.board.length })}`); projRefresh(); return true; }
  const p = cleanProjects(j); if (!p) { toast(t('proj_bad')); return false; }
  if (myProjects) { const have = new Map(myProjects.projects.map((x) => [projKey(x.project), x])); let added = 0;
    for (const x of p.projects) { const k = projKey(x.project), o = have.get(k);
      if (!o) { myProjects.projects.push(x); have.set(k, x); added++; }
      else { o.first = [o.first, x.first].filter(Boolean).sort()[0] || ''; o.last = [o.last, x.last].filter(Boolean).sort().pop() || ''; for (const f2 of ['messages', 'me', 'akram', 'shaarawi']) o[f2] = Math.max(o[f2], x[f2]); o.worked = o.worked || x.worked; o.aibrahim = o.aibrahim || x.aibrahim; o.kraasa = o.kraasa || x.kraasa; } }
    const sk = new Set(myProjects.skipped.map((x) => x.subject)); for (const x of p.skipped) if (!sk.has(x.subject)) myProjects.skipped.push(x);
    myProjects.to = [myProjects.to, p.to].sort().pop(); myProjects.importedAt = p.importedAt; toast(`${kind === 'register' ? `${t('proj_was_mail')} ` : ''}${t('proj_merged', { n: added })}`); }
  else { myProjects = p; toast(`${kind === 'register' ? `${t('proj_was_mail')} ` : ''}${t('proj_loaded', { n: p.projects.length })}`); }
  await store.putProjects(myProjects); projRefresh(); return true;
}
function projWrongPlace(key) {
  const where = { proj_wrong_pst: [['#mailfile', 'nav_mailfile'], ['#tenders', 'nav_tenders']], proj_wrong_ext: [['#mailfile', 'nav_mailfile']], proj_wrong_td: [['#tenders', 'nav_tenders']] }[key] || [];
  const dlg = el('dialog', { class: 'proj-edit proj-wrong' }, el('h2', { text: t('proj_wrong_h') }), el('p', { text: t(key) }),
    el('div', { class: 'row' }, where.map(([h, k]) => el('a', { class: 'btn primary', href: h, onclick: () => { dlg.close(); closeProjDialogs(); } , text: `→ ${t(k)}` })), el('button', { type: 'button', class: 'btn quiet', text: t('close'), onclick: () => dlg.close() })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
const closeProjDialogs = () => { for (const d of document.querySelectorAll('dialog[open]')) if (!d.classList.contains('proj-wrong')) try { d.close(); } catch { /* already closed */ } };
function projPasteDialog() {
  const ta = el('textarea', { rows: 10, class: 'td-paste-ta', dir: 'ltr', placeholder: '{ "schema": "afaqy-projects-from-mail/v1", … }' });
  const dlg = el('dialog', { class: 'proj-edit proj-paste' }, el('h2', { text: t('proj_imp_paste') }), el('p', { class: 'hint', text: t('proj_paste_lead') }), ta,
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary proj-paste-go', text: t('td_paste_go'), onclick: async () => { const j = tdParse(ta.value); if (!j) { toast(t('proj_bad')); return; } if (await projTakeJson(j, 'mail')) dlg.close(); } })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal(); ta.focus();
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
  const rows = (myProjects || myRegister || (tenders && tenders.items.length)) ? projectsModel() : [], won = rows.filter((r) => WONISH.includes(r.status));
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
    const shown = open.call(this); pagerAttach(this); return shown;
  }; }

// ADR-0119: a window with a long scroll turns into pages. One rule for every window, in every page: when what is inside is more
// than one and a half screens of the window, the scroll is replaced by pages — «Previous · 2 of 7 · Next» pinned at the bottom.
// Nothing inside is moved or copied: the same content is shown one screen at a time, cut only between rows, cards and paragraphs,
// never through one. A window with a short scroll is left exactly as it was. The pages follow the content: «show more», a filter,
// a different view or a resized browser are counted again by themselves.
const PAGERS = new WeakMap();
const PG_LONG = 1.5;                                             // more than this many screens of the window = «a long scroll»
const pgNatural = (st) => { const sc = st.sc; if (!sc) return;   // back to the window's own scroll, as if the pager was never there
  if (st.bar) st.bar.remove(); if (st.pad) st.pad.remove(); st.bar = st.pad = null;
  for (const tb of sc.querySelectorAll('table.dp-sticky')) tb.classList.remove('dp-sticky');
  for (const [c, v] of st.lifted || []) c.style.top = v; st.lifted = [];
  for (const [n, mh, hh, oy] of st.freed || []) { n.style.maxHeight = mh; n.style.height = hh; n.style.overflowY = oy; } st.freed = []; sc.style.removeProperty('--dp-pad');
  sc.style.overflowY = st.was || ''; sc.style.maxHeight = st.wasMax || ''; sc.removeAttribute('data-paged'); sc.style.removeProperty('--dp-top'); sc.style.removeProperty('--dp-bg'); st.paged = false; };
const pgScroller = (dlg) => { let best = null;                   // the part of the window that scrolls: the window itself or its body — the one that runs over most, and never a small frame inside
  const can = (n) => /auto|scroll/.test(getComputedStyle(n).overflowY);
  const walk = (node, depth) => { if (/^(TABLE|TEXTAREA|PRE|SELECT|UL|OL|SVG)$/i.test(node.tagName)) return;
    if (node.scrollHeight - node.clientHeight > 8 && can(node) && (!best || node.scrollHeight - node.clientHeight > best.scrollHeight - best.clientHeight)) best = node;
    if (depth < 4) for (const c of node.children) walk(c, depth + 1); };
  walk(dlg, 0);
  // only a small frame runs over: its pages belong to the window around it, which takes the frame's rows once the frame is opened
  if (best && best.clientHeight < dlg.clientHeight * 0.5) for (let n = best.parentElement; n; n = n.parentElement) { if (can(n) && n.clientHeight >= dlg.clientHeight * 0.5) { best = n; break; } if (n === dlg) break; }
  // v9.47: a frame inside a window that itself runs far over (tiles and bars above a list) would put its pager below the fold —
  // the frame cannot give up that much height, so the window around it takes the pages
  if (best && best !== dlg) for (let n = best.parentElement; n; n = n.parentElement) { if (can(n)) { const over = n.scrollHeight - n.clientHeight; if (over > 8 && best.clientHeight - over <= 240) best = n; } if (n === dlg) break; }
  return best; };
const pgBack = (node) => { for (let n = node; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c && !/rgba\(.*,\s*0\)|transparent/.test(c)) return c; } return ''; };
function pagerRefresh(dlg) {
  const st = PAGERS.get(dlg); if (!st || !dlg.open) return;
  if (st.press) { st.pending = true; return; }   // v9.56: never rebuild the buttons under a press — every path that recounts comes through here
  const keepTop = st.paged && st.starts[st.page] ? st.starts[st.page].y : null, hadFirst = st.first;
  const reveal = st.reveal && st.reveal.isConnected ? st.reveal : null; st.reveal = null;   // v9.74: what a button asked to show (pagerReveal)
  const a = document.activeElement, keepFocus = st.bar && a && st.bar.contains(a) ? (a.classList.contains('dp-prev') ? '.dp-prev' : a.classList.contains('dp-next') ? '.dp-next' : '.dp-next') : null;
  pgNatural(st);
  const sc = pgScroller(dlg); st.sc = sc; st.starts = [{ y: 0, top: 0 }]; st.paged = false; st.freed = [];
  if (sc) for (const n of sc.querySelectorAll('*')) { if (/^(TEXTAREA|PRE|SELECT)$/.test(n.tagName) || n.closest('[role=listbox]') || n.scrollHeight - n.clientHeight <= 8) continue;
    const k = getComputedStyle(n); if (!/auto|scroll/.test(k.overflowY)) continue; st.freed.push([n, n.style.maxHeight, n.style.height, n.style.overflowY]); n.style.maxHeight = 'none'; n.style.height = 'auto'; n.style.overflowY = 'visible'; n.scrollTop = 0; }
  const done = () => { st.sig = pgSig(st); st.mo.takeRecords(); st.ro.disconnect(); if (st.sc) { st.ro.observe(st.sc); for (const c of st.sc.children) if (c !== st.bar && c !== st.pad) st.ro.observe(c); } };
  if (!sc || sc.scrollHeight <= sc.clientHeight * PG_LONG) { st.page = 0; st.first = null; done(); return; }
  // what stays pinned at the top of the window (its ✕ bar): pages start under it
  st.was = sc.style.overflowY; st.wasMax = sc.style.maxHeight; const bg = pgBack(sc);
  sc.style.overflowY = 'hidden'; sc.setAttribute('data-paged', '');          // first: with the scrollbar gone the content is wider and its lines wrap differently
  // a body that scrolls inside a window that itself runs a little over: the body gives up that much, so the pager is never below the fold
  if (sc !== dlg) { const over = dlg.scrollHeight - dlg.clientHeight; if (over > 0 && sc.clientHeight - over > 240) sc.style.maxHeight = `${sc.clientHeight - over}px`; }
  const view = sc.clientHeight, cs = getComputedStyle(sc);
  let scTop = 0; const at = (r) => r - scTop - sc.clientTop + sc.scrollTop;   // measured against where the window is now: adding the pager can move a centred window
  const padTop = parseFloat(cs.paddingTop) || 0; st.lifted = [];
  let inset = 0; for (const c of sc.children) { const k = getComputedStyle(c); if (k.position === 'sticky' && parseFloat(k.top) === 0) { inset += c.offsetHeight; if (padTop) { st.lifted.push([c, c.style.top]); c.style.top = `-${padTop}px`; } } }
  sc.style.setProperty('--dp-pad', `${padTop}px`);
  const prev = el('button', { type: 'button', class: 'btn tiny dp-prev', text: t('dlgp_prev'), onclick: () => pagerGo(dlg, st.page - 1) });
  const next = el('button', { type: 'button', class: 'btn tiny dp-next', text: t('dlgp_next'), onclick: () => pagerGo(dlg, st.page + 1) });
  const status = el('span', { class: 'dp-status', role: 'status', 'aria-live': 'polite' }), nums = el('span', { class: 'dp-nums' });
  st.bar = el('nav', { class: 'dlg-pager no-print', 'aria-label': t('dlgp_nav') }, el('div', { class: 'dp-row' }, prev, nums, status, next));
  st.pad = el('div', { class: 'dlg-pad', 'aria-hidden': 'true' });
  st.bar.style.marginInline = `-${parseFloat(cs.paddingInlineStart) || 0}px -${parseFloat(cs.paddingInlineEnd) || 0}px`; if (bg) st.bar.style.backgroundColor = bg;
  st.bar.style.bottom = `-${parseFloat(cs.paddingBottom) || 0}px`;      // «bottom: 0» stops above the window's own padding; the pager sits on the very edge so nothing shows under it
  sc.append(st.pad, st.bar);
  const fill = (n) => { const [, nums, status] = st.bar.firstChild.children; status.textContent = t('dlgp_status', { n, m: n });
    set(nums, n <= 9 ? Array.from({ length: n }, (_, i) => el('button', { type: 'button', class: 'pill-btn dp-n', text: String(i + 1) })) : []); return st.bar.offsetHeight; };
  let barH = fill(2), room = view - barH - inset;
  if (room < 120) { pgNatural(st); st.page = 0; done(); return; }       // a window too small to hold a page keeps its scroll
  // everything that must not be cut: rows, cards, paragraphs, fields. Large containers are opened up and their parts taken instead.
  const boxes = [], whole = /^(P|H[1-6]|LI|TR|BUTTON|INPUT|SELECT|TEXTAREA|SVG|CANVAS|IMG|LABEL|SUMMARY|FIGURE|PRE|THEAD|DT|DD)$/i;
  const take = (node, depth, lead) => { for (const c of node.children) {
    if (c === st.bar || c === st.pad || c.offsetParent === null && c.tagName !== 'TR' && c.tagName !== 'THEAD') continue;
    const r = c.getBoundingClientRect(); if (r.height < 1) continue;
    const top = at(r.top), bottom = at(r.bottom), big = r.height > room * 0.5 && c.children.length && depth < 9 && !whole.test(c.tagName);
    if (c.tagName === 'TABLE' && big) {                             // a long table: its rows are the units, and its heading row stays in view
      let pinned = true; for (let n = c.parentElement; n && n !== sc; n = n.parentElement) if (getComputedStyle(n).overflowY !== 'visible' || getComputedStyle(n).overflowX !== 'visible') { pinned = false; break; }
      const head = c.tHead, headH = head && pinned ? Math.ceil(Math.max(head.getBoundingClientRect().height, ...[...head.querySelectorAll('th, td')].map((x) => x.getBoundingClientRect().height))) : 0; if (headH) c.classList.add('dp-sticky');
      for (const row of c.rows) { const rr = row.getBoundingClientRect(); if (rr.height >= 1) boxes.push({ top: at(rr.top), bottom: at(rr.bottom), lead: row.parentElement === head ? 0 : headH, head: false }); }
      continue; }
    if (big) { take(c, depth + 1, lead); continue; }
    boxes.push({ top, bottom, lead, head: /^H[1-6]$/.test(c.tagName) }); } };
  scTop = sc.getBoundingClientRect().top; take(sc, 0, 0);
  if (!boxes.length) { pgNatural(st); st.page = 0; done(); return; }
  const layout = () => pageStarts(boxes, { view, barH, inset });            // where each page begins: core.js, tested on its own
  let { starts, end } = layout();
  for (let k = 0; k < 3; k += 1) { const h2 = fill(starts.length); if (h2 === barH) break; barH = h2; room = view - barH - inset; if (room < 120) break; ({ starts, end } = layout()); }
  if (room < 120) { pgNatural(st); st.page = 0; done(); return; }
  if (starts.length < 2) { pgNatural(st); st.page = 0; done(); return; }
  st.starts = starts; st.view = view; st.barH = barH; st.end = end; st.paged = true;
  st.pad.style.height = `${Math.max(0, starts[starts.length - 1].top + view - barH - end)}px`;
  sc.style.setProperty('--dp-top', `${inset}px`); if (bg) sc.style.setProperty('--dp-bg', bg);
  const first = [...sc.children].find((c) => c !== st.bar && c !== st.pad) || null; st.first = first;
  let page = 0; if (keepTop != null && first === hadFirst) for (let i = 0; i < starts.length; i += 1) if (starts[i].y <= keepTop + 2) page = i;
  if (reveal && sc.contains(reveal)) { const y = at(reveal.getBoundingClientRect().top); page = 0; for (let i = 0; i < starts.length; i += 1) if (starts[i].y <= y + 2) page = i; }
  st.page = -1; pagerGo(dlg, page, true);
  // something inside is still moving into place (a list sliding in as the window opens): count the pages again once it has settled
  if (!st.waiting) { const moving = (sc.getAnimations ? sc.getAnimations({ subtree: true }) : []).filter((x) => x.playState === 'running' && Number.isFinite(x.effect && x.effect.getComputedTiming().endTime));
    if (moving.length) { st.waiting = true; Promise.race([Promise.all(moving.map((x) => x.finished.catch(() => null))), new Promise((r) => setTimeout(r, 2500))]).then(() => { st.waiting = false; if (dlg.open) pagerRefresh(dlg); }); } }
  if (keepFocus) { const f = st.bar.querySelector(keepFocus); if (f && !f.disabled) f.focus({ preventScroll: true }); else st.bar.querySelector('.dp-prev:not(:disabled), .dp-next:not(:disabled)')?.focus({ preventScroll: true }); }
  done();
}
const pgSig = (st) => (st.sc ? `${st.sc.clientWidth}x${st.sc.clientHeight}:${st.paged && st.pad ? Math.round(st.pad.offsetTop) : st.sc.scrollHeight}` : '');
// v9.74 (ADR-0144): bring a part of a window into view — in a window of pages, the page that holds it (now, and again when the
// window has finished redrawing: a fold that opens can be what turns the window into pages); otherwise a scroll that stops
// under the window's pinned head. Before this, «All messages» opened its fold on page 2 and left the window on page 1.
function pagerReveal(dlg, node) {
  const st = PAGERS.get(dlg); if (!node) return;
  if (st) st.reveal = node;
  if (st && st.paged && st.sc && st.sc.contains(node)) { const r = st.sc.getBoundingClientRect(), y = node.getBoundingClientRect().top - r.top - st.sc.clientTop + st.sc.scrollTop;
    let p = 0; for (let i = 0; i < st.starts.length; i += 1) if (st.starts[i].y <= y + 2) p = i; pagerGo(dlg, p, true); }
  else node.scrollIntoView?.({ block: 'start' });   // an old browser without scrollIntoView still opens the fold
}
function pagerGo(dlg, page, quiet) {
  const st = PAGERS.get(dlg); if (!st || !st.paged) return;
  const n = st.starts.length, p = Math.max(0, Math.min(n - 1, page)), s = st.starts[p], nextY = p + 1 < n ? st.starts[p + 1].y : null;
  st.page = p;
  // whatever is left under the last whole row of this page is covered, so no half row shows above the pager
  st.bar.style.paddingTop = `${nextY == null ? 0 : Math.max(0, s.top + st.view - st.barH - nextY)}px`;
  st.sc.scrollTop = s.top; st.expect = s.top;
  const row = st.bar.firstChild, [prev, nums, status, next] = row.children;
  prev.disabled = p === 0; next.disabled = p === n - 1; status.textContent = t('dlgp_status', { n: p + 1, m: n });
  set(nums, n <= 9 ? st.starts.map((x, i) => el('button', { type: 'button', class: `pill-btn dp-n${i === p ? ' on' : ''}`, 'aria-label': t('dlgp_go', { n: i + 1 }), 'aria-current': i === p ? 'page' : null, text: String(i + 1), onclick: () => { pagerGo(dlg, i); st.bar.querySelector(`.dp-n:nth-child(${i + 1})`)?.focus({ preventScroll: true }); } })) : []);
  st.mo.takeRecords();
  if (!quiet && st.sc.contains(document.activeElement) && document.activeElement !== prev && document.activeElement !== next && !st.bar.contains(document.activeElement)) { /* focus stays where the person put it */ }
}
function pagerAttach(dlg) {
  if (dlg.hasAttribute('data-own-scroll')) return;          // v9.68 (ADR-0140): a working window — its choices stay in view and its list scrolls inside it
  if (typeof ResizeObserver !== 'function' || typeof MutationObserver !== 'function' || typeof requestAnimationFrame !== 'function') return;   // an old browser keeps the plain scroll
  let st = PAGERS.get(dlg);
  if (!st) {
    st = { sc: null, bar: null, pad: null, page: 0, starts: [{ y: 0, top: 0 }], paged: false, timer: 0, lock: 0, sig: '', first: null };
    PAGERS.set(dlg, st);
    // and whatever else changes in the window (an extension in a text box, a file being read) waits while a pager button is held
    // down: the recount rebuilds the buttons, and a press must end on the button it began on
    const later = () => { clearTimeout(st.timer); if (st.press) { st.pending = true; return; } st.timer = setTimeout(() => { if (st.press) st.pending = true; else pagerRefresh(dlg); }, 80); };
    dlg.addEventListener('pointerdown', (e) => { if (st.bar && st.bar.contains(e.target)) st.press = true; }, true);
    const release = () => { if (!st.press) return; st.press = false; if (st.pending) { st.pending = false; setTimeout(later, 0); } };
    document.addEventListener('pointerup', release, true); document.addEventListener('pointercancel', release, true);
    // v9.56: a change that cannot move a page break is not a reason to count the pages again. Counting again rebuilds the
    // pager's own buttons, and the press effect (`bt-tap`, added on pointer-down) is a class change: so pressing «Next» rebuilt
    // «Next» under the finger, the release landed on a button that was no longer there, and the click never happened. A person
    // holds a click for about a tenth of a second; the tests clicked in an instant, which is why they passed.
    const EFFECT = /^bt-/;
    const layoutChange = (r) => {
      if (st.bar && (r.target === st.bar || st.bar.contains(r.target))) return false;
      if (st.pad && (r.target === st.pad || st.pad.contains(r.target))) return false;
      if (r.type === 'childList' && [...r.addedNodes, ...r.removedNodes].every((n) => n === st.bar || n === st.pad)) return false;
      if (r.type === 'attributes' && r.attributeName === 'class') {
        const was = new Set(String(r.oldValue || '').split(/\s+/).filter((c) => c && !EFFECT.test(c)));
        const now = new Set([...r.target.classList].filter((c) => !EFFECT.test(c)));
        if (was.size === now.size && [...now].every((c) => was.has(c))) return false;
      }
      return true;
    };
    st.mo = new MutationObserver((records) => { if (records.some(layoutChange)) later(); });
    st.ro = new ResizeObserver(() => { if (pgSig(st) !== st.sig) later(); });
    const inside = (e) => st.paged && st.sc && (e.target === st.sc || st.sc.contains(e.target));
    // the mouse wheel, a swipe and Page Up / Page Down turn the page; one page for one gesture
    dlg.addEventListener('wheel', (e) => { if (!inside(e) || Math.abs(e.deltaY) < 8 || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const own = e.target.closest && e.target.closest('textarea, select, pre'); if (own && own.scrollHeight > own.clientHeight + 2) return;
      e.preventDefault(); const now = Date.now(); if (now < st.lock) { st.lock = Math.max(st.lock, now + 180); return; } st.lock = now + 320; pagerGo(dlg, st.page + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
    let touch = null;
    dlg.addEventListener('touchstart', (e) => { touch = inside(e) && e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
    dlg.addEventListener('touchend', (e) => { if (!touch || !st.paged) return; const c = e.changedTouches[0], dy = touch.y - c.clientY, dx = touch.x - c.clientX; touch = null;
      if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.5) pagerGo(dlg, st.page + (dy > 0 ? 1 : -1)); }, { passive: true });
    if (!PAGERS.keys) { PAGERS.keys = true; document.addEventListener('keydown', (e) => { if (e.target !== document.body) return; const top = [...document.querySelectorAll('dialog[open]')].pop(); if (top && PAGERS.get(top) && PAGERS.get(top).paged) PAGERS.get(top).key(e); }); }
    st.key = (e) => { if (!st.paged || e.altKey || e.ctrlKey || e.metaKey) return;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      const to = e.key === 'PageDown' ? st.page + 1 : e.key === 'PageUp' ? st.page - 1 : typing ? null : e.key === 'Home' ? 0 : e.key === 'End' ? st.starts.length - 1 : null;
      if (to == null) return; e.preventDefault(); pagerGo(dlg, to); };
    dlg.addEventListener('keydown', st.key);
    // the browser moved the content by itself (Tab into a field on another page, a search in the page): go to the page that holds it
    dlg.addEventListener('scroll', (e) => { if (!st.paged || e.target !== st.sc || Math.abs(st.sc.scrollTop - st.expect) < 2) return;
      const f = document.activeElement, r = st.sc.getBoundingClientRect();
      const y = f && f !== st.sc && st.sc.contains(f) && !st.bar.contains(f) ? f.getBoundingClientRect().top - r.top - st.sc.clientTop + st.sc.scrollTop : st.sc.scrollTop + (st.starts[1] ? st.starts[1].y - st.starts[1].top : 0);
      let p = 0; for (let i = 0; i < st.starts.length; i += 1) if (st.starts[i].y <= y + 2) p = i; pagerGo(dlg, p, true); }, true);
    dlg.addEventListener('close', () => { clearTimeout(st.timer); st.mo.disconnect(); st.ro.disconnect(); pgNatural(st); st.page = 0; st.first = null; st.on = false; });
  }
  if (!st.on) { st.on = true; st.mo.observe(dlg, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['open', 'hidden', 'class'] }); }
  pagerRefresh(dlg);
  // a window settles in its first frames (its fonts, its opening): count once more when it has, keeping the page the person is on
  requestAnimationFrame(() => requestAnimationFrame(() => pagerRefresh(dlg))); setTimeout(() => pagerRefresh(dlg), 450);
}

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
      el('span', { class: `st-pill st-${r.status}`, text: t(`proj_f_${r.status}`) }), el('b', { text: r.name }), r.tender ? el('a', { class: 'chip proj-td', href: '#tenders', text: t('proj_from_td') }) : null, r.status === 'lost' && r.reason ? el('span', { class: 'hint', text: `${t('td_col_reason')}: ${r.reason}` }) : null, r.client && r.client !== r.name ? el('span', { class: 'hint', text: r.client }) : null,
      r.value ? el('strong', { text: `${r.value.toLocaleString('en-US')} ${t('sar')}` }) : null,
      el('small', { class: 'hint', text: [r.last && `${t('proj_c_last')} ${r.last}`, r.messages && t('proj_msgs_n', { n: r.messages }), projWhy(r)].filter(Boolean).join(' · ') })))));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
// add or edit: a mail thread that gets edited becomes a project of its own, linked to that thread
function projEdit(r) {
  if(r?.fromTender) { pwEdit(r); return; }
  const it = r && r.item ? r.item : null;
  const f = { name: r ? r.name : '', client: r ? r.client || '' : '', line: it ? it.line : '', kind: r ? r.kind || 'commercial' : 'commercial', status: r ? (r.status === 'seen' ? 'worked' : r.status) : 'worked',
    cat: it && it.cat ? it.cat : '', value: r ? r.value || '' : '', date: it ? it.date || r.last || '' : r ? r.last || '' : new Date().toISOString().slice(0, 10), period: it ? it.period : '', note: it ? it.note : '', match: it ? it.match.join(', ') : '' };
  const inp = (k, type = 'text', extra = {}) => el('input', { type, value: f[k], ...extra, oninput: (e) => { f[k] = e.target.value; } });
  const sel = (k, opts) => el('select', { onchange: (e) => { f[k] = e.target.value; } }, opts.map(([v, l]) => el('option', { value: v, selected: f[k] === v ? '' : null, text: l })));
  const dlg = el('dialog', { class: 'proj-edit' });
  const save = async () => {
    if (!f.name.trim()) { toast(t('proj_need_name')); return; }
    const R = regEnsure(); const rec = { name: f.name.trim().slice(0, 160), client: f.client.trim().slice(0, 120), line: f.line.trim().slice(0, 60), kind: f.kind, status: f.status, value: Math.max(0, Math.round(Number(f.value) || 0)),
      date: /^\d{4}-\d{2}-\d{2}$/.test(f.date) ? f.date : '', period: f.period.trim().slice(0, 20) || (f.date || '').slice(0, 4), note: f.note.trim().slice(0, 300), cat: ['tender', 'upsell'].includes(f.cat) ? f.cat : '', match: f.match.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 12) };
    if (it) Object.assign(it, rec);
    else if (r && r.key && ['worked', 'studied'].includes(rec.status) && !rec.value && !rec.client && !rec.cat) { R.mail[r.key] = { ...(R.mail[r.key] || {}), name: rec.name, status: rec.status }; }
    else { const id = `U${Date.now().toString(36)}`; R.items.push({ id, ...rec, not: [], source: t('proj_why_manual'), manual: true }); if (r && r.key) R.mail[r.key] = { item: id }; }
    dlg.close(); toast(t('proj_saved')); await projSave(); };
  set(dlg,el('h2', { text: r ? t('proj_edit_h') : t('proj_add_h') }),
    r && r.threads && r.threads.length ? el('p', { class: 'hint', text: t('proj_edit_threads', { n: r.threads.length, s: r.threads.slice(0, 2).map((p) => p.project).join(' | ') }) }) : null,
    el('div', { class: 'form-grid' },
      el('label', {}, el('span', { text: t('proj_c_name') }), inp('name')), el('label', {}, el('span', { text: t('proj_c_client') }), inp('client')),
      el('label', {}, el('span', { text: t('proj_c_status') }), sel('status', ['worked', 'studied', 'submitted', 'won', 'ongoing', 'delivered', 'lost'].map((s) => [s, t(`proj_f_${s}`)]))),
      el('label', {}, el('span', { text: t('proj_c_kind') }), sel('kind', ['project', 'commercial', 'tender'].map((s) => [s, t(`proj_k_${s}`)]))),
      el('label', {}, el('span', { text: t('proj_c_line2') }), sel('cat', [['', t('proj_line_auto', { l: (() => { const l = projectLine({ ...(r || {}), cat: '' }).line; return l ? t(`proj_line_${l}`) : t('proj_line_none'); })() })], ['tender', t('proj_line_tender')], ['upsell', t('proj_line_upsell')]])),
      el('label', {}, el('span', { text: t('proj_c_value') }), inp('value', 'number', { min: '0', step: '1' })), el('label', {}, el('span', { text: t('proj_c_date') }), inp('date', 'date')),
      el('label', {}, el('span', { text: t('proj_c_line') }), inp('line')), el('label', {}, el('span', { text: t('proj_c_period') }), inp('period', 'text', { placeholder: 'H2 2026' })),
      el('label', { class: 'wide' }, el('span', { text: t('proj_c_note') }), el('textarea', { rows: '2', oninput: (e) => { f.note = e.target.value; } }, f.note)),
      el('label', { class: 'wide' }, el('span', { text: t('proj_c_match') }), inp('match', 'text', { placeholder: t('proj_match_ph') }))),
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary', text: t('save'), onclick: save }), el('button', { type: 'button', class: 'btn quiet', text: t('cancel'), onclick: () => dlg.close() })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
// ADR-0125: delete everything the page shows, after a backup file of the projects is saved on the device
const projBackupFile = () => ({ backup: 'afaqy-projects-backup/v1', exportedAt: new Date().toISOString(), register: myRegister || null, projects: myProjects || null });
async function projDeleteAll(rows) {
  const plan = projectDeletePlan(rows), n = plan.items.length + plan.keys.length;
  if (!n) { toast(plan.kept.length ? t('proj_del_all_only_td', { k: plan.kept.length }) : t('proj_del_all_none')); return; }
  if (!confirm(t('proj_del_all_q', { n, k: plan.kept.length }))) return;
  download(`afaqy-projects-backup-${ymd(new Date())}.json`, JSON.stringify(projBackupFile(), null, 1));
  const R = regEnsure(), gone = new Set(plan.items);
  R.items = R.items.filter((x) => !gone.has(x.id));
  for (const [k, v] of Object.entries(R.mail)) if (v.item && gone.has(v.item)) delete R.mail[k];
  for (const k of plan.keys) R.mail[k] = { hide: true };
  toast(t('proj_del_all_done', { n, k: plan.kept.length })); await projSave();
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
  const inReg = (tenders && tenders.items ? tenders.items : []).map((x) => x.subject).slice(0, 80);   // ADR-0101: the same names as the tender register
  const text = `Open Outlook on the web (https://outlook.office.com) — I am signed in with my AFAQY account.
Goal: find NEW project conversations received or sent ON OR AFTER ${from} (up to today). Read only — do not send, reply, move, flag, delete or change read status.

A conversation is a PROJECT if ANY is true:
  R1. a message in it is from, to or cc a.ibrahim@afaqy.com
  R2. the subject contains: project, projects, tender, tenders, مشروع, المشروع, مشاريع, مناقصة, المناقصة, منافسة, المنافسة
  R3. a message in it has an attachment whose file name contains «كراسة الشروط» (also «كراسه الشروط», «كراسة_الشروط», «كراسة شروط», «كراسة الشروط والمواصفات») — FROM ANYONE, and EVEN IF that message is a reply or a forward (RE:, FW:, Fwd:, رد:, إعادة توجيه:)
One conversation = one project: group by the subject without RE:/FW:/Fwd:/رد:/إعادة توجيه:, and keep its earliest date.
worked_on = true if a message in it was sent by me, by Akram (AFAQY, display name Akram / أكرم) or by Mohamed Shaarawi (AFAQY, Shaarawi / شعراوي).

Search all folders (Sent Items and Archive included), scroll every result list to the end:
  participants:a.ibrahim@afaqy.com received>=${from}
  subject:<each keyword above> received>=${from}
  attachmentnames:"كراسة الشروط" received>=${from}
  attachmentnames:"كراسه الشروط" received>=${from}
  attachmentnames:"كراسة شروط" received>=${from}
  attachmentnames:"كراسة_الشروط" received>=${from}

ALREADY COLLECTED — skip any conversation whose subject (without RE:/FW:/رد:/إعادة توجيه:) is one of these:
${known.map((k) => `- ${k}`).join('\n') || '- (none)'}
Already set aside before — skip too:
${skipped.map((k) => `- ${k}`).join('\n') || '- (none)'}

${inReg.length ? `ALREADY IN MY TENDER REGISTER — still list them if they match, but write "project" EXACTLY as here so they are counted once:\n${inReg.map((k) => `- ${k}`).join('\n')}\n` : ''}
Skip automated mail (no-reply, notifications, newsletters, calendar-only invites); list them under "skipped" with the reason.
Keep ONLY: subject, dates, counts — no body text, customer contacts, phone numbers, prices or attachments.

Save one JSON file named afaqy-projects-from-mail-<today YYYY-MM-DD>.json:
{ "schema": "afaqy-projects-from-mail/v1", "mailbox": "<my address>", "from": "${from}", "to": "<today>",
  "projects": [ { "project": "<subject without RE/FW>", "tender_no": "", "first_date": "YYYY-MM-DD", "last_date": "YYYY-MM-DD", "messages": 0,
                  "sent_by_me": 0, "sent_by_akram": 0, "sent_by_shaarawi": 0, "with_a_ibrahim": false, "has_kraasa": false, "matched_rules": "R1,R2", "worked_on": true } ],
  "skipped": [ { "subject": "...", "reason": "..." } ] }
If you cannot save a file, print the same JSON in ONE code block in the chat instead — I will paste it into the portal.
If a search or folder failed, say exactly which one.`;
  const dlg = el('dialog', { class: 'proj-edit' }); const ta = el('textarea', { class: 'ltr', rows: '14', readonly: '' }); ta.value = text;
  dlg.append(el('h2', { text: t('proj_pull_h') }), el('p', { class: 'hint', text: t('proj_pull_hint', { from, n: known.length }) }), ta,
    el('div', { class: 'row', style: 'margin-top:10px' }, el('button', { type: 'button', class: 'btn primary', text: t('proj_copy'), onclick: async () => { try { await navigator.clipboard.writeText(text); toast(t('proj_copied')); } catch { ta.select(); } } }),
      el('a', { class: 'btn', href: 'https://outlook.office.com/mail/', target: '_blank', rel: 'noopener', text: t('proj_open_outlook') }), el('button', { type: 'button', class: 'btn quiet', text: t('close'), onclick: () => dlg.close() })));
  dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
}
// my projects report: AFAQY pages, each project in its place by status
function projReport() { pwReports('pdf'); }
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
    datasets = mergeDataset(datasets, result.dataset); setOwnerFrom(result.dataset);
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
// ADR-0110: the readable name of a MyAFAQY list the pull may skip
const listName = (p) => { const k = { 'Security/GetAllHierarchyUsersDropDown': 'pl_users', 'Teams/GetAllTeams': 'pl_teams', 'Teams/GetTeamById': 'pl_teams', 'EmployeeIC/GetAllEmployeesGrid': 'pl_employees', 'TechnicianReport/GetTechnicianReportStatic': 'pl_tech', 'ActivityLog/GetTicketsGrid': 'pl_tickets', 'AfterSales/GetAllAfterSalesEngineers': 'pl_as', 'AfterSales/GetAfterSalesRequestGrid': 'pl_as', 'AfterSalesBoardReport/GetAfterSalesAgentsGrid': 'pl_as', 'Task/GetTask': 'pl_start', 'TechniqueSystem/GetGridServerIPs': 'pl_servers', 'CustomerServerAccount/GetAllCustomerAccounts': 'pl_servers' }[p]; return k ? t(k) : p; };
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
  msg.textContent = t('loaded', { n: out.dataset.tasks.length, range: `${out.dataset.range.from} → ${out.dataset.range.to}` }) + (out.skipped ? ` ${t('warn_rows', { n: out.skipped })}` : '')
    ;   // ADR-0110: lists a pull skipped are shown on the data's own row (renderDatasets), where they stay
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
  storageNote(); backupNote();
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
      d.pulledBy ? el('div', { class: 'hint ds-by' }, el('span', { text: t('ds_pulled_by', { name: nameOf(peopleOf(datasets).find((p) => p.id === d.pulledBy.id) || {}, lang) || d.pulledBy.name || d.pulledBy.id }) }),
        // an uploaded or synced file never changes whose device this is: the person says so himself, once (ADR-0115)
        !isTeamPortal && d.pulledBy.id !== ownerId() ? el('button', { type: 'button', class: 'btn tiny ds-mine', text: t('ds_mine'), onclick: () => { setOwner(d.pulledBy.id); toast(t('ds_mine_done')); renderDatasets(); renderKpi(); renderMe(); } }) : null) : null,
      (d.skippedLists || []).length ? el('div', { class: 'msg warn ds-skip', role: 'status', text: t('pull_skipped_lists', { lists: d.skippedLists.map(listName).join(t('list_sep')) }) }) : null,   // ADR-0110: stays with the data
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
/** ADR-0116: for a device whose owner is not the manager named in the team file, «the team» is the people under the owner —
 *  everyone below him in MyAFAQY's employees list when the pull carries it and names him, otherwise in the team file.
 *  null = the owner is that manager (or nobody is named yet): the team file's scope applies, as before. */
let ownerTeamMemo = null;
const ownerTeam = () => {
  if (isTeamPortal) return null;
  const o = ownerId(), m = managerIdOf(); if (!o || o === m) return null;
  const od = orgData(), ro = roster().people || {}, sig = `${o}|${od ? `${od.at}:${od.n}` : ''}|${datasets.length}|${Object.keys(ro).length}`;
  if (ownerTeamMemo && ownerTeamMemo.sig === sig) return ownerTeamMemo.v;
  let ids = [], from = 'none', unmatched = [];
  if (od && od.org.hasRow(o)) { const u = od.org.under(o); if (u.length) { ids = u.map((n) => n.pid).filter((x) => x != null).map(String); unmatched = od.org.unmatchedUnder(o); from = 'myafaqy'; } }
  if (from === 'none') { const q = [o], seen = new Set(q); while (q.length) { const k = q.shift(); for (const [id, r] of Object.entries(ro)) if (r && r.leaderId === k && !seen.has(id)) { seen.add(id); ids.push(id); q.push(id); } } if (ids.length) from = 'file'; }
  ownerTeamMemo = { sig, v: { owner: o, ids: new Set(ids), from, unmatched, at: od ? od.at : '' } };
  return ownerTeamMemo.v;
};
const scoped = (people) => { const ot = ownerTeam(); if (ot) return people.filter((p) => ot.ids.has(p.id) || (!ot.ids.size && p.id === ot.owner)); return scopeOn(people) ? people.filter((p) => inScope(roster(), p.id)) : people; };
/** The line on the board that says whose team this is and where the list came from. */
const ownerTeamNote = () => { const ot = ownerTeam(); if (!ot) return null;
  const who = nameOf(peopleOf(datasets).find((p) => p.id === ot.owner) || {}, lang) || ot.owner;
  return el('div', { class: 'note info km-own-team', role: 'status', 'data-from': ot.from, 'data-n': String(ot.ids.size) },
    el('span', { text: t(`own_team_${ot.from}`, { n: ot.ids.size, name: who, d: ot.at }) }),
    ot.unmatched.length ? el('span', { class: 'hint', text: ` ${t('own_team_unmatched', { n: ot.unmatched.length, list: ot.unmatched.slice(0, 8).join(t('list_sep')) })}` }) : null); };
// ---------- MyAFAQY's own hierarchy (ADR-0060): who reports to whom, from the employee list in the pull ----------
let orgMemo = null;
const orgData = () => {
  const ds = [...datasets].filter((d) => d.employees && d.employees.length).sort((x, y) => String(y.extractedAt || '').localeCompare(String(x.extractedAt || '')))[0];
  if (!ds) return null; const sig = `${datasets.length}|${ds.extractedAt}|${ds.employees.length}`;
  if (!orgMemo || orgMemo.sig !== sig) orgMemo = { sig, v: { at: String(ds.extractedAt || '').slice(0, 10), n: ds.employees.length, org: buildOrg(ds.employees, peopleOf(datasets)) } };
  return orgMemo.v;
};
const orgRootId = (od) => { const saved = pref('orgRoot'); if (saved && od.org.under(saved).length) return saved; const mid = ownerId(); if (mid && od.org.under(mid).length) return mid; const m = od.org.managers()[0]; return m ? m.pid : null; };
// ADR-0061: the branch a pull filters teams by — the chosen manager's own row in MyAFAQY, Jeddah until a list exists
const pullBranch = () => { const od = orgData(); const r = od && orgRootId(od), b = r && od.org.branchOf(r); return b ? { ...b, from: 'myafaqy' } : { code: JEDDAH_BRANCH, name: '', from: 'default' }; };
const orgEngineerSet = () => { const od = orgData(); if (!od) return null; const r = orgRootId(od); return r ? new Set(od.org.engineersOf(r)) : null; };
let kpiMoreCols = false, teamEdit = false, diDays = 14;   // diDays: days shown in «tasks per day» (ADR-0121)   // ADR-0059: the board shows five columns until asked for more
function currentTeam(people, tasks, force) {   // force: 'org' or 'file' computes that default and ignores a saved manual choice (the preview uses it)
  const allowed = new Set(scoped(people).map((p) => p.id));
  if (!force) try { const saved = JSON.parse(pref('team') || 'null'); if (Array.isArray(saved)) { const kept = saved.filter((id) => allowed.has(id)); if (kept.length) return kept; } } catch { /* fall through */ }
  if (!force && ownerTeam()) return [...allowed];   // ADR-0116: everyone under the owner, leads included — the list is MyAFAQY's, not a comparison of engineers
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
function openReport(html, mode, fileBase, existingWindow) {
  if (mode === 'html') { const a = el('a', { href: URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })), download: `${fileBase}.html` }); document.body.append(a); a.click(); a.remove(); toast(t('rep_saved_html')); return; }
  const w = existingWindow || window.open('', '_blank'); if (!w) { toast(t('rep_popup')); return; }
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
    try { const body = $('weights-body'), wt = weights(), uid = (me && me.user ? me.user.id : null) || (!isTeamPortal ? ownerId() : null); if (body && wt) { const top = (wAdvNode && wAdvNode.querySelector('.w-adv-top')) || body.querySelector('.w-adv-top') || body; top.prepend(pointsRulesBox(wt, isWeightsAdmin(wt, uid))); if (!isTeamPortal) top.querySelector('.pr-box').after(typesBox(wt)); }
      // each cell carries its column's name, so on a phone a row reads as a card: the type on top, every field named under it (ADR-0049)
      if (body) [body, wAdvNode].filter(Boolean).flatMap((root) => [...root.querySelectorAll('table')]).forEach((tb) => { const hs = [...tb.querySelectorAll('thead th')].map((th) => th.textContent.trim()); tb.classList.add('w-cards');
        tb.querySelectorAll('tbody tr').forEach((tr) => [...tr.children].forEach((td, i) => { if (hs[i]) td.dataset.label = hs[i]; })); }); } catch (e) { console.error(e); }
    return out; };
  renderWeights = withRules(renderWeights); }
// ---------- what each tool does: a popup on hover, an ⓘ to tap on a phone (ADR-0051) ----------
const tipEl = () => document.getElementById('tool-tip') || document.body.appendChild(el('div', { id: 'tool-tip', role: 'tooltip', hidden: '' }));
/** ADR-0101 — the tooltip policy: ONE tooltip for the whole portal (#tool-tip). Opaque and clearly apart from the page, above
 *  everything, beside what it explains (below if there is room, else above, else the roomier side) — never over it and never off
 *  the screen; one at a time; on hover, keyboard focus or tap. It may cover what is under it; it never mixes with it.
 *  target: an element, or a rectangle {left, top, right, bottom} (a point on a chart). Guarded by harness/tips.py. */
function showTip(target, text, owner = target, keepTime = false) {
  const tp = tipEl(); tp.textContent = text; tp.hidden = false; tp.__owner = owner; tp.__target = target; if (!keepTime) tp.__at = performance.now();   // ADR-0101: whose tooltip it is tp.style.maxWidth = `${Math.min(320, innerWidth - 16)}px`; tp.style.left = '0px'; tp.style.top = '0px';
  const r = target.getBoundingClientRect ? target.getBoundingClientRect() : target, tr = tp.getBoundingClientRect(), gap = 8, M = 8;
  const below = innerHeight - r.bottom - gap - M, above = r.top - gap - M;
  const top = tr.height <= below ? r.bottom + gap : tr.height <= above ? r.top - gap - tr.height : (below >= above ? Math.min(r.bottom + gap, innerHeight - M - tr.height) : Math.max(M, r.top - gap - tr.height));
  const cx = (r.left + r.right) / 2, left = Math.max(M, Math.min(innerWidth - tr.width - M, cx - tr.width / 2));
  tp.style.left = `${Math.round(left)}px`; tp.style.top = `${Math.round(Math.max(M, top))}px`;
}
const tipPoint = (x, y, pad = 6) => ({ left: x - pad, right: x + pad, top: y - pad, bottom: y + pad });
/** hideTip(owner): leaving something closes only its own tooltip — the next element may already own it (pointer events come before
 *  mouse events); hideTip() with no owner (scroll, a tap elsewhere) closes it whoever owns it. */
const hideTip = (owner) => { const tp = document.getElementById('tool-tip'); if (!tp || (owner && tp.__owner !== owner)) return; tp.hidden = true; tp.dataset.for = ''; tp.__owner = null; };
document.addEventListener('click', (e) => {   // ADR-0101: a tap on something that explains itself shows (or hides) its tooltip; a tap elsewhere closes it
  if (e.target.closest('.tip-i, [data-tip-hold]')) return;
  const host = e.target.closest('[data-tip]');
  if (host && !host.closest('a, button, summary') && host.tagName !== 'A') { const tp = tipEl(); if (!tp.hidden && tp.__owner === host && performance.now() - tp.__at > 350) hideTip(); else if (tp.hidden || tp.__owner !== host) showTip(host, host.dataset.tip); return; }
  hideTip();
}); window.addEventListener('scroll', () => {   // ADR-0101: the tooltip follows its element while the page moves; it goes when the element leaves the screen
  const tp = document.getElementById('tool-tip'); if (!tp || tp.hidden) return;
  const tg = tp.__target; if (!tg || !tg.getBoundingClientRect || !tg.isConnected) { hideTip(); return; }
  const r = tg.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) { hideTip(); return; }
  showTip(tg, tp.textContent, tp.__owner, true);
}, { passive: true });
function attachTip(a, text, withButton = true) {
  if (!a || !text || a.dataset.tip) return; a.dataset.tip = text;
  a.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) showTip(a, text); });
  a.addEventListener('mouseleave', () => { if (matchMedia('(hover: hover)').matches) hideTip(a); });   // ADR-0106: on a touch screen «mouse left» is synthetic (it fires when the page shifts under the finger) — a tapped tooltip stays until a second tap or a tap elsewhere
  a.addEventListener('focus', () => showTip(a, text)); a.addEventListener('blur', () => hideTip(a));
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

/** ADR-0084: the tenders that need him, shown on the control room even before any task pull. */
function tdStartAlerts() {
  if (!tenders || !tenders.items.length) return null; const today = saudiDay(new Date().toISOString()), K = tdKpis(tenders.items, today), go = (prep) => () => { tdKind = 'all'; location.hash = '#tenders'; };
  // v9.58: the hand-over to the tenders team is a deadline of its own, and a tender with less than a working week needs a decision today
  const nowW = tdNowWall(), handNow = tenders.items.filter((i) => ['received', 'screen', 'decide', 'prep'].includes(i.stage) && !tenderHandedAt(i) && tenderHandoverDue(i) && minutesUntil(tenderHandoverDue(i), nowW) <= 1440).length;
  const shortNow = tenders.items.filter((i) => ['received', 'screen', 'decide'].includes(i.stage) && tenderLead(i).short).length;
  const items = [handNow && { k: 'red', title: t('cr_att_td_hand', { n: handNow }), detail: t('td_tile_hand', { n: TENDER_HANDOVER_DAYS }) }, shortNow && { k: 'pending', title: t('cr_att_td_short', { n: shortNow }) }, K.late && { k: 'red', title: t('cr_att_td_late', { n: K.late }) }, K.waiting && { k: K.waitMax > 3 ? 'red' : 'pending', title: t('cr_att_td_wait', { n: K.waiting }), detail: t('td_k_waitmax', { d: K.waitMax }) }, K.soon && { k: 'old', title: t('cr_att_td_soon', { n: K.soon }) }].filter(Boolean);
  if (!items.length) return null;
  return el('div', {}, el('h2', { class: 'cr-h', text: t('cr_att_h') }), el('div', { class: 'cr-att' }, items.map((x) => el('button', { type: 'button', class: `cr-item k-${x.k}`, onclick: go() }, el('div', {}, el('b', { text: x.title }), x.detail ? el('span', { text: x.detail }) : null), el('span', { class: 'cr-go', text: `${t('cr_go')} ↗` })))));
}
/** ADR-0090: the authorship line at the foot of every page. */
function pageBy() { document.querySelectorAll('section[id^="view-"]').forEach((sec) => { if (sec.querySelector(':scope > .page-by')) return; sec.append(el('p', { class: 'page-by' }, el('button', { type: 'button', onclick: openAbout }, el('span', { 'data-t': 'page_by', text: t('page_by') }), ` · v${PORTAL_VERSION}`))); }); }   // data-t: the language system fills and refreshes it (the hand-built text showed the raw key)
// ADR-0121: tasks per day — what arrived, what was closed, what nobody has started, and what passed the manager's start limit.
function dailySection(tasks, team, nm, latest) {
  const asOf = latest.extractedAt || `${latest.range.to}T21:00:00Z`, to = latest.range.to;
  const from = new Date(Date.parse(`${to}T00:00:00Z`) - (diDays - 1) * 864e5).toISOString().slice(0, 10);
  const ranges = datasets.map((d) => d.range).filter(Boolean);
  const r = dailyIntake(tasks, { from, to, asOf, team, complete: (d) => coveredFrom(ranges, d, to) });
  const byId = new Map(tasks.map((x) => [x.id, x]));
  const sT = (iso) => (iso ? new Date(Date.parse(iso) + 3 * 36e5).toISOString().slice(0, 16).replace('T', ' ') : '');
  const loc = lang === 'en' ? 'en-GB' : lang === 'ur' ? 'ur-PK' : 'ar-EG';
  const wd = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(loc, { weekday: 'short', timeZone: 'UTC' });
  const stOf = (x) => (x.state === 'done' ? t('di_st_done') : x.state === 'cancelled' ? t('di_st_cancel') : x.bucket === 'toDo' ? t('di_st_todo') : t('di_st_open'));
  const isLate = (x) => x.state === 'open' && x.bucket === 'toDo' && startDue(x.createdAt) && Date.parse(startDue(x.createdAt)) < Date.parse(asOf);
  const startedLate = (x) => !!x.startedAt && !!startDue(x.createdAt) && Date.parse(x.startedAt) > Date.parse(startDue(x.createdAt));   // ADR-0124
  const listModal = (title, file, L) => { L = [...L].sort((p, q) => (p.createdAt < q.createdAt ? -1 : 1));
    crModal({ title, file, lead: t('di_asof', { t: sT(asOf) }),
      tiles: [[t('di_arrived'), L.length], [t('di_notstarted'), L.filter((x) => x.state === 'open' && x.bucket === 'toDo').length, '', (k) => L[k].state === 'open' && L[k].bucket === 'toDo'],
        [t('di_late'), L.filter(isLate).length, '', (k) => isLate(L[k])], ...(L.some((x) => x.startedAt) ? [[t('di_started_late'), L.filter(startedLate).length, t('di_of_known', { n: L.filter((x) => x.startedAt).length }), (k) => startedLate(L[k])]] : []), [t('di_sameday'), L.filter((x) => x.state === 'done' && saudiDay(x.completedAt) === saudiDay(x.createdAt)).length, '', (k) => L[k].state === 'done' && saudiDay(L[k].completedAt) === saudiDay(L[k].createdAt)]],
      bar: (k) => [nm(L[k].assigneeId), 1], head: [t('crm_task'), t('col_person'), t('di_c_in'), t('di_c_due'), t('di_c_state')], hot: (row, k) => isLate(L[k]) || startedLate(L[k]),   // five columns: a sixth pushed the table past the window and the page bar out of sight
      rows: L.map((x) => [x.title || x.id, nm(x.assigneeId), sT(x.createdAt), x.startedAt ? `${sT(startDue(x.createdAt))} · ${t('di_started_at', { t: sT(x.startedAt).slice(11) || sT(x.startedAt) })}` : sT(startDue(x.createdAt)), x.completedAt ? `${stOf(x)} ${sT(x.completedAt)}` : stOf(x)]) }); };
  const dayModal = (d) => listModal(t('di_day_h', { d: `${wd(d.day)} ${d.day}` }), `arrived-${d.day}`, d.ids.map((id) => byId.get(id)).filter(Boolean));
  const lateL = r.lateNow.map((x) => byId.get(x.id)).filter(Boolean);
  const cell = (v, cls) => el('td', { class: `num${cls && v ? ` ${cls}` : ''}`, text: String(v) });
  const anyPart = r.days.some((d) => !d.complete);
  const known = r.days.some((d) => d.startKnown > 0), sl = (d) => (d.startKnown ? `${d.startedLate} / ${d.startKnown}` : '—');
  return el('section', { class: 'di-box' },
    el('h2', { class: 'cr-h' }, t('di_h'), helpQ('help_di')),
    el('button', { type: 'button', class: `di-now${r.lateNow.length ? ' late' : ''}`, onclick: () => (lateL.length ? listModal(t('di_late_h'), 'not-started-late', lateL) : null) },
      el('b', { text: t('di_now', { n: r.waiting, l: r.lateNow.length }) }), el('span', { text: t('di_asof', { t: sT(asOf) }) })),
    r.days.length ? el('div', { class: 'table-wrap' }, el('table', { class: 'di-table' },
      el('thead', {}, el('tr', {}, ['di_c_day', 'di_arrived', 'di_sameday', 'di_later', 'di_notstarted', 'di_late', ...(known ? ['di_started_late'] : []), 'di_open', 'di_cancel'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
      el('tbody', {}, r.days.map((d) => el('tr', { class: 'di-row', tabindex: '0', title: t('cr_num_open'), onclick: () => dayModal(d), onkeydown: (e) => { if (e.key === 'Enter') dayModal(d); } },
        el('td', { text: `${wd(d.day)} ${d.day}${d.complete ? '' : ' *'}` }), cell(d.arrived), cell(d.sameDay), cell(d.later), cell(d.notStarted), cell(d.late, 'di-bad'), ...(known ? [el('td', { class: `num${d.startedLate ? ' di-bad' : ''}`, title: d.waitMedianH == null ? '' : t('di_wait_med', { h: d.waitMedianH }), text: sl(d) })] : []), cell(d.open), cell(d.cancelled)))),
      el('tfoot', {}, el('tr', { class: 'total' }, el('td', { text: t('team') }), ...['arrived', 'sameDay', 'later', 'notStarted', 'late'].map((k) => cell(r.total[k])), ...(known ? [el('td', { class: 'num', text: `${r.total.startedLate} / ${r.total.startKnown}` })] : []), ...['open', 'cancelled'].map((k) => cell(r.total[k])))))) : el('div', { class: 'empty', text: t('di_none') }),
    anyPart ? el('p', { class: 'hint', text: t('di_partial') }) : null,
    el('p', { class: 'hint', text: known ? t('di_known_note') : t('di_unknown_note') }),
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn quiet tiny', text: diDays === 14 ? t('di_more') : t('di_less'), onclick: () => { diDays = diDays === 14 ? 31 : 14; renderHome(); } })));
}
function renderHome() {
  const body = $('home-body'); if (!body) return;
  if (!datasets.length) { set(body, tdStartAlerts(), el('div', { class: 'cr-start' }, el('h2', { text: t('cr_start_h') }), el('p', { text: t('cr_start_b') }), el('a', { class: 'btn primary', href: '#data', text: `${t('cr_pull')} ↗` }))); return; }
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
  const TK = tenders && tenders.items.length ? tdKpis(tenders.items, saudiDay(new Date().toISOString())) : null;   // ADR-0084: the tenders that need him
  const tdSoonList = () => { const td = saudiDay(new Date().toISOString()); return tenders.items.filter((i) => TD_OPEN.includes(i.stage) && tdNextDate(i, td) && tdDaysBetween(td, tdNextDate(i, td)[1]) <= 7).map((i) => `${i.subject.slice(0, 40)} (${tdNextDate(i, td)[1]})`).slice(0, 3).join('، '); };
  const att = [
    TK && TK.late && { k: 'red', title: t('cr_att_td_late', { n: TK.late }), detail: tenders.items.filter((i) => TD_OPEN.includes(i.stage) && i.due && i.due < saudiDay(new Date().toISOString()) && !i.submittedOn).map((i) => i.subject.slice(0, 40)).slice(0, 3).join('، '), href: '#tenders', prep: () => { tdKind = 'all'; } },
    TK && TK.waiting && { k: TK.waitMax > 3 ? 'red' : 'pending', title: t('cr_att_td_wait', { n: TK.waiting }), detail: t('td_k_waitmax', { d: TK.waitMax }), href: '#tenders', prep: () => { tdKind = 'all'; } },
    TK && TK.soon && { k: 'old', title: t('cr_att_td_soon', { n: TK.soon }), detail: tdSoonList(), href: '#tenders', prep: () => { tdKind = 'all'; } },
    red.length && { k: 'red', title: t('cr_att_red', { n: red.length }), detail: names(red), href: '#dev' },
    noPlan.length && { k: 'plan', title: t('cr_att_plan', { n: noPlan.length, m: active.length, q: qNext.label }), detail: names(noPlan), href: '#dev', prep: () => { devQ = 'next'; pref('devq', 'next'); } },
    old.length && { k: 'old', title: t('cr_att_old', { n: old.length }), detail: oldBy.slice(0, 3).map(([id, n]) => `${nm(id)} ${n}`).join('، '), href: '#kpi', prep: () => { secWant = 'kpi:week'; } },
    pending && { k: 'pending', title: t('cr_att_pending', { n: pending }), detail: '', href: '#team' },
    (() => { const f = newTypes(wt); return f.length ? { k: 'types', title: t('cr_att_types', { n: f.length }), detail: f.slice(0, 4).join('، '), href: '#weights' } : null; })(),
    (() => { const od = orgData(); if (!od) return null; const r = orgRootId(od); if (!r) return null; const fa = Object.keys(roster().people || {}).some((id) => od.org.hasRow(id)), c = fa ? compareOrg(od.org, roster(), r) : { leader: [], missingInFile: [], notInOrg: [], inactive: [], unmatched: od.org.unmatchedUnder(r) }, n = c.leader.length + c.missingInFile.length + c.notInOrg.length + c.inactive.length + c.unmatched.length; return n ? { k: 'org', title: t('cr_att_org', { n }), detail: '', href: '#team' } : null; })(),
  ].filter(Boolean);
  // ADR-0090: every number opens its detail — tiles, a bar per engineer, the list, Excel
  const byPerson = (list, f = () => 1) => { const m = new Map(); for (const x of list) m.set(x.assigneeId, (m.get(x.assigneeId) || 0) + f(x)); return [...m.entries()].map(([id, v]) => [nm(id), Math.round(v * 10) / 10]).sort((p, q) => q[1] - p[1]); };
  const ageD = (x) => (x.createdAt ? Math.max(0, Math.round((Date.now() - Date.parse(x.createdAt)) / 864e5)) : null);
  const ptsM = Math.round(doneM.reduce((s, x) => s + taskPoints(wt, x), 0));
  const MODAL = {
    done: () => { const L = [...doneM].sort((p, q) => (p.completedAt < q.completedAt ? 1 : -1)), wk = saudiDay(new Date(Date.now() - 6 * 864e5).toISOString());
      return crModal({ title: t('cr_nums_done'), file: 'done-this-month', tiles: [[t('cr_nums_done'), doneM.length, hasPrev ? t('cr_nums_last', { n: doneP.length }) : ''], [t('crm_last7'), L.filter((x) => saudiDay(x.completedAt) >= wk).length, '', (k) => saudiDay(L[k].completedAt) >= wk], [t('crm_people'), new Set(doneM.map((x) => x.assigneeId)).size]],
        bar: (k) => [nm(L[k].assigneeId), 1], head: [t('crm_task'), t('col_person'), t('crm_closed'), t('col_points'), t('crm_type')],
        rows: L.map((x) => [x.title || x.id, nm(x.assigneeId), saudiDay(x.completedAt), Math.round(taskPoints(wt, x) * 10) / 10, x.type || '']) }); },
    points: () => { const per = byPerson(doneM, (x) => taskPoints(wt, x)), cnt = new Map(byPerson(doneM));
      const avg = team.length ? Math.round(ptsM / team.length) : 0;
      return crModal({ title: t('cr_nums_points'), file: 'points-this-month', tiles: [[t('cr_nums_points'), ptsM], [t('crm_avg_eng'), avg, t('crm_at_above'), (k) => per[k][1] >= avg], [t('crm_top'), per.length ? per[0][0] : '—', per.length ? `${per[0][1]}` : '', (k) => k === 0]],
        bar: (k) => [per[k][0], per[k][1]], head: [t('col_person'), t('crm_closed_n'), t('col_points'), t('crm_share')], rows: per.map(([n, v]) => [n, cnt.get(n) || 0, v, ptsM ? `${Math.round((v / ptsM) * 100)}%` : '—']) }); },
    open: () => { const L = [...openNow].sort((p, q) => (p.createdAt > q.createdAt ? 1 : -1)), isOld = new Set(old);   // the tile's own list decides which rows are red
      const oldestD = openNow.length ? Math.max(...openNow.map((x) => ageD(x) || 0)) : 0;
      return crModal({ title: t('cr_nums_open'), file: 'open-now', tiles: [[t('cr_nums_open'), openNow.length], [t('crm_old'), old.length, '', (k) => isOld.has(L[k])], [t('crm_oldest'), openNow.length ? `${oldestD} ${t('crm_days')}` : '—', '', (k) => (ageD(L[k]) || 0) === oldestD]],
        bar: (k) => [nm(L[k].assigneeId), 1], head: [t('crm_task'), t('col_person'), t('crm_opened'), t('crm_age'), t('crm_type')], hot: (r, k) => isOld.has(L[k]),
        rows: L.map((x) => [x.title || x.id, nm(x.assigneeId), x.createdAt ? saudiDay(x.createdAt) : '', ageD(x), x.type || '']) }); },
    team: () => { const R = team.map((id) => ({ id, r: [nm(id), doneM.filter((x) => x.assigneeId === id).length, Math.round(doneM.filter((x) => x.assigneeId === id).reduce((s, x) => s + taskPoints(wt, x), 0) * 10) / 10, openNow.filter((x) => x.assigneeId === id).length] })).sort((p, q) => q.r[2] - p.r[2]);
      return crModal({ title: t('cr_nums_team'), file: 'team', tiles: [[t('cr_nums_team'), team.length], [t('crm_with_done'), R.filter((x) => x.r[1] > 0).length, '', (k) => R[k].r[1] > 0], [t('crm_on_leave'), R.filter((x) => ro[x.id] && ro[x.id].onLeave).length, '', (k) => !!(ro[R[k].id] && ro[R[k].id].onLeave)]],
        head: [t('col_person'), t('crm_closed_n'), t('col_points'), t('crm_open_n')], rows: R.map((x) => x.r) }); } };
  const num = (k, v, sub, kind) => el('button', { type: 'button', class: 'cr-num cr-num-go', title: t('cr_num_open'), 'data-kind': kind, onclick: () => MODAL[kind]() },
  el('span', { text: t(k) }), el('b', { text: String(v) }), sub ? el('small', { text: sub }) : null, el('span', { class: 'cr-num-arrow', 'aria-hidden': 'true', text: '↗' }));
  const job = (label, hash, prep) => el('button', { type: 'button', class: 'cr-job', onclick: go(hash, prep) }, el('b', { text: label }), el('span', { text: '↗' }));
  set(body,
    el('div', { class: `cr-fresh ${fresh ? 'ok' : 'old'}` },
      el('div', {}, el('span', { class: 'cr-k', text: t('cr_fresh_h') }), el('b', { text: fresh ? t('cr_fresh_ok', { to: latest.range.to }) : t('cr_fresh_old', { to: latest.range.to, n: ageDays }) }),
        el('small', { text: t('cr_fresh_meta', { n: tasks.length.toLocaleString('en-US'), d: (latest.extractedAt || '').slice(0, 10) }) })),
      el('a', { class: `btn${fresh ? '' : ' primary'}`, href: '#data', text: `${t('cr_pull_again')} ↗` })),
    el('div', { class: 'cr-nums' }, num('cr_nums_done', doneM.length, hasPrev ? t('cr_nums_last', { n: doneP.length }) : t('cr_nums_nolast'), 'done'), num('cr_nums_points', Math.round(doneM.reduce((s, x) => s + taskPoints(wt, x), 0)), hasPrev ? t('cr_nums_last', { n: Math.round(doneP.reduce((s, x) => s + taskPoints(wt, x), 0)) }) : t('cr_nums_nolast'), 'points'),
      num('cr_nums_open', openNow.length, openNow.length ? t('cr_nums_oldest_sub', { d: Math.max(...openNow.map((x) => ageD(x) || 0)) }) : '', 'open'), num('cr_nums_team', team.length, '', 'team')),
    teamPulse(doneM, doneP, (day) => { const L = doneM.filter((x) => saudiDay(x.completedAt) === day); crModal({ title: t('tp_day_h', { d: day }), file: `closed-${day}`, tiles: [[t('cr_nums_done'), L.length], [t('cr_nums_points'), Math.round(L.reduce((s, x) => s + taskPoints(wt, x), 0))], [t('crm_people'), new Set(L.map((x) => x.assigneeId)).size]], bar: (k) => [nm(L[k].assigneeId), 1], head: [t('crm_task'), t('col_person'), t('col_points'), t('crm_type')], rows: L.map((x) => [x.title || x.id, nm(x.assigneeId), Math.round(taskPoints(wt, x) * 10) / 10, x.type || '']) }); }, hasPrev),
    dailySection(tasks, team, nm, latest),
    el('h2', { class: 'cr-h', text: t('cr_att_h') }),
    att.length ? el('div', { class: 'cr-att' }, att.map((x) => el('button', { type: 'button', class: `cr-item k-${x.k}`, onclick: go(x.href, x.prep) },
      el('div', {}, el('b', { text: x.title }), x.detail ? el('span', { text: x.detail }) : null), el('span', { class: 'cr-go', text: `${t('cr_go')} ↗` }))))
      : el('div', { class: 'cr-calm', text: t('cr_att_none') }),
    el('h2', { class: 'cr-h', text: t('cr_jobs_h') }),
    el('div', { class: 'cr-jobs' }, job(t('kpi_board'), '#kpi'), job(t('nav_dev'), '#dev'), job(t('nav_team'), '#team'),
      job(t('cr_job_reports'), '#kpi', () => { secWant = 'kpi:report'; }), job(t('cr_job_viewas'), '#kpi')));
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
        el('select', { class: 'btn tiny', 'aria-label': t('dev_add_goal'), onchange: (e) => { if (e.target.value) addGoal(e.target.value); e.target.value = ''; } }, [el('option', { value: '', text: `＋ ${t('dev_add_goal')}` }), ...GOAL_METRICS.map((m) => el('option', { value: m, text: t(`dev_m_${m}`) }))]))),
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
// ADR-0120: the After-Sales Accounts board — MyAFAQY's whole Jeddah list on the day of the manager pull, not only the scope's people.
function accountsBoardSection(rep, nm) {
  const b = accountsBoard(rep); if (!b.total.accounts) return null;
  const N = (v) => Number(v || 0).toLocaleString('en-US'), eng = rep.accEng || {};
  const who = (id) => (eng[id] ? ((lang === 'en' ? eng[id].en : eng[id].ar) || eng[id].en || eng[id].ar) : nm(id));
  const maxE = Math.max(1, ...b.engineers.map((r) => r.accounts)), sysName = (n) => (n === '?' ? t('ab_unknown_sys') : n);
  const tile = (v, k) => el('div', {}, el('b', { text: N(v) }), el('span', { text: t(k) }));
  const sysPart = b.hasSystems ? [
    el('p', { class: 'hint', text: t('ab_with_server', { n: N(b.total.withServer), w: N(b.total.withWorking), z: N(b.total.noServer) }) }),
    ...b.families.map((f) => el('p', { class: 'hint ab-family', text: t('ab_family', { fam: `\u2068${f.id.toUpperCase()}\u2069`, members: `\u2068${f.members.join(' + ')}\u2069`, n: N(f.customers), w: N(f.working) }) })),
    el('div', { class: 'table-wrap' }, el('table', { class: 'ab-sys' },
      el('thead', {}, el('tr', {}, ['ab_col_system', 'ab_col_customers', 'ab_col_working', 'ab_col_servers', 'ab_col_devices'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
      el('tbody', {}, b.systems.map((r) => el('tr', {}, el('td', { class: 'ltr', text: sysName(r.name) }), el('td', { class: 'num', text: N(r.customers) }), el('td', { class: 'num', text: N(r.working) }),
        el('td', { class: 'num', text: N(r.servers) }), el('td', { class: 'num', text: N(r.devices) }))))))]
    : [el('p', { class: 'note', text: b.systemsRead && b.systemsRead.total ? t('ab_sys_partial', { read: N(b.systemsRead.read), total: N(b.systemsRead.total) }) : b.systemsRead ? t('ab_sys_refused') : t('ab_sys_none') })];
  return [el('h2', {}, t('ab_title'), helpQ('help_ab')),
    el('p', { class: 'hint', text: t('ab_sub', { date: saudiDay(rep.extractedAt) || '—' }) }),
    el('div', { class: 'strip' }, tile(b.total.accounts, 'ab_accounts'), tile(b.total.devices, 'ab_devices'), tile(b.total.zero, 'ab_zero'), tile(b.total.unassigned, 'ab_unassigned')),
    el('h3', { text: t('ab_sys_h') }), ...sysPart,
    el('h3', { text: t('ab_seg_h') }),
    el('div', { class: 'donuts' }, donut(t('ab_seg_h'), b.segments.map((g) => ({ label: g.name || t('ab_seg_blank'), value: g.accounts })), { fmt: N })),
    el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, ['ab_seg_col', 'ab_col_accounts', 'ab_col_devices'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
      el('tbody', {}, b.segments.map((g) => el('tr', {}, el('td', { text: g.name || t('ab_seg_blank') }), el('td', { class: 'num', text: N(g.accounts) }), el('td', { class: 'num', text: N(g.devices) })))))),
    el('h3', { text: t('ab_eng_h') }),
    el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, ['col_person', 'ab_col_accounts', 'ab_col_devices', 'f5_solo'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
      el('tbody', {}, b.engineers.map((r) => el('tr', {}, el('td', { text: who(r.id) }),
        el('td', { class: 'num' }, el('div', { class: 'bar-cell' }, el('b', { text: N(r.accounts) }), el('i', {}, el('span', { style: `width:${Math.round((r.accounts / maxE) * 100)}%` })))),
        el('td', { class: 'num', text: N(r.devices) }), el('td', { class: 'num', text: N(r.solo) })))))),
    el('p', { class: 'hint', text: t('ab_refresh') })];
}
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
let kpiMonth = pref('kpimonth') || null, kpiOpen = null, kpiMSort = 'points', kpiTileF = null;   // ADR-0102: a tile's filter
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
  let med = null;
  if ((isTeamPortal || viewAs) && me && me.user && String(me.user.id) === String(id)) {
    const ro = roster().people || {}, lead = ro[id] && ro[id].leaderId;
    const peers = lead ? Object.keys(ro).filter((k) => k === String(id) || (ro[k].leaderId === lead && !ro[k].onLeave)).filter((k) => k === String(id) || tasks.some((x) => x.assigneeId === k)) : [];
    const rg = periodRangeOf(ym), xs = peers.map((k) => monthNumbers(factor1(tasks, { range: rg, team: [k] }), weightedPoints(tasks, acts, wt, { range: rg, team: [k] }), k)).filter((x) => x && x.total > 0);
    const mdn = (v) => { const s = v.filter((q) => q != null).sort((x, y) => x - y); if (!s.length) return null; const h = Math.floor(s.length / 2); return Math.round((s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2) * 10) / 10; };
    if (xs.length >= 3) med = { n: xs.length, closed: mdn(xs.map((x) => x.closed)), total: mdn(xs.map((x) => x.total)), rate: mdn(xs.map((x) => Math.round((x.closed / x.total) * 100))), avg: mdn(xs.map((x) => x.avg)), points: mdn(xs.map((x) => x.points)) };   // fewer than three would show one colleague's own number
  }
  const rdOn = rdKnownFor(periodRangeOf(ym));
  const rows = [['src_email', 'email', 'n'], ['src_self', 'self', 'n'], ['src_other', 'other', 'n'], ['km_total', 'total', 'n'], ['km_closed', 'closed', 'h'], ['km_avg', 'avg', 'l'], ...(rdOn ? [['km_rd', 'rd', 'n']] : []), ['col_points', 'points', 'h']];
  const fmt = (k, v) => (k === 'avg' ? hmOf(v) : String(v ?? '—'));
  const hist = months.slice(0, 6).map((m) => ({ m, x: one(m.ym) }));
  // every open task, newest first — six shown, the rest one fold away (as «My KPIs» always listed them)
  const ownPage = (isTeamPortal || !!viewAs) && !!me && !!me.user && String(me.user.id) === String(id);
  const ownPull = ownPage && !viewAs && !meDerived && me.extractedAt;
  const asOfMs = Math.min(Date.now(), ownPull ? Date.parse(me.extractedAt) : datasets.length ? Math.max(...datasets.filter((d) => d.range).map((d) => Date.parse(`${d.range.to}T23:59:59+03:00`))) : Date.now());
  const asOfDay = saudiDay(new Date(asOfMs).toISOString());
  // an open task's age is counted to the data's last update: counted to today it grew every day the data was not refreshed
  const open = openTasks(tasks, id).map((x) => ({ ...x, ageHours: x.createdAt ? Math.max(0, (asOfMs - Date.parse(x.createdAt)) / 3600000) : null })).sort((x, y) => String(y.createdAt || '').localeCompare(String(x.createdAt || '')));
  const item = (x) => el('li', {}, el('span', { text: x.title || typeLabel(x.type || '', lang) || '—' }),
    el('small', { class: 'hint', text: x.ageHours == null ? '' : t(x.ageHours < 48 ? 'hours' : 'days', { n: Math.round(x.ageHours < 48 ? x.ageHours : x.ageHours / 24) }) }));
  const who = nameOf(peopleOf(datasets).find((x) => x.id === id) || {}, lang) || (me && me.user && String(me.user.id) === String(id) ? me.user.name : id);
  const flag = (lab, k) => flagBtn({ who, period: ml, label: t(lab), value: fmt(k, n[k]), prev: p ? fmt(k, p[k]) : '—', def: t(SNAP_DEF[k] || 'km_total'), asOf: dataAsOf() });
  // ADR-0102: one place for each number — the tiles (with ⚑), the ring and the chart; the same numbers as a table for screen readers only
  return el('div', { class: 'km-detail' }, head ? el('p', { class: 'hint km-head', text: head }) : null, maPersonLine(id, ym),
    pmDash({ n, p, hist, open, share, ml, pml, rdOn, flag, item, med, own: ownPage, cal: ownPage ? pmCalendar(tasks, String(id), ym, asOfDay) : null, asOf: asOfDay }),
    el('div', { class: 'km-cmp sr-only' }, el('table', {}, el('caption', { text: t('pm_sr_caption', { m: ml, p: pml }) }),
      el('thead', {}, el('tr', {}, el('th', {}), el('th', { class: 'num', text: ml }), el('th', { class: 'num', text: pml }), el('th', { class: 'num', text: t('km_change') }))),
      el('tbody', {}, rows.map(([lab, k, kind]) => el('tr', {}, el('td', { text: t(lab) }), el('td', { class: 'num' }, el('b', { text: fmt(k, n[k]) })),
        el('td', { class: 'num', text: p ? fmt(k, p[k]) : '—' }), el('td', { class: 'num' }, p ? kmDelta(n[k], p[k], kind, pml) : '—')))))),
    actions ? el('div', { class: 'row km-acts' }, actions) : null);
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
      el('span', { class: 'hint', text: hasPrev ? t('km_vs', { m: periodLabel(pm) }) : t(isTeamPortal || viewAs ? 'km_no_prev_me' : 'km_no_prev', { m: periodLabel(pm) }) })),
    !cov.whole ? el('p', { class: 'note', text: t(isTeamPortal || viewAs ? 'km_partial_me' : 'km_partial', { got: cov.got, need: cov.need }) }) : null,
    personMonthView({ id: uid, tasks, acts: fromPulls ? allActivities() : [], months, ym: meMonth })];
}
// ADR-0123: section cards. Each card shows its section's headline and opens the section in one shared window. The section's nodes
// are built with the page, as before; when the page redraws while the window is open, the window takes the fresh nodes of the same
// section, so sorting or toggling inside it keeps working. `secWant` (page:id) opens a card on arrival from another page.
let secDlg = null, secOpen = '', secWant = '', wAdvNode = null;   // wAdvNode: the Weights page's advanced part, which lives in the window
function secCards(page, secs) {
  const show = (x) => { if (!secDlg) { secDlg = el('dialog', { class: 'sec-dlg', 'aria-label': '' }, el('div', { class: 'sec-dlg-body' }));
      secDlg.addEventListener('close', () => { secOpen = ''; }); document.body.append(secDlg); }
    secOpen = `${page}:${x.id}`; secDlg.setAttribute('aria-label', x.title); set(secDlg.querySelector('.sec-dlg-body'), x.node); if (!secDlg.open) secDlg.showModal(); };
  const open = secOpen.startsWith(`${page}:`) && secDlg && secDlg.open ? secs.find((x) => `${page}:${x.id}` === secOpen) : null;
  if (open) set(secDlg.querySelector('.sec-dlg-body'), open.node);
  const want = secWant.startsWith(`${page}:`) ? secs.find((x) => `${page}:${x.id}` === secWant) : null;
  if (want) { secWant = ''; requestAnimationFrame(() => show(want)); }
  return el('section', { class: 'sec-cards-box' }, el('h2', { class: 'cr-h', text: t('sc_more_h') }),
    el('div', { class: 'sec-cards' }, secs.map((x) => el('button', { type: 'button', class: 'sec-card', 'data-sec': x.id, title: t('cr_num_open'), onclick: () => show(x) },
      el('span', { class: 'sec-t', text: x.title }), x.v ? el('b', { text: x.v }) : null, x.sub ? el('small', { text: x.sub }) : null, el('span', { class: 'cr-num-arrow', 'aria-hidden': 'true', text: '↗' })))));
}
function renderKpi() {
  applyNameFixes();
  applyPending().then((changed) => { if (changed) { renderTeam(); renderKpi(); renderMe(); } });
  const body = $('kpi-body');
  const months = datasets.length ? pulledPeriods(kmKind) : [];
  if (!months.length) { set(body, el('div', { class: 'empty', text: t('no_data') })); return; }
  { const ot = ownerTeam(); if (ot && ot.from === 'none') { set(body, ownerTeamNote(), el('p', {}, el('a', { class: 'btn primary', href: '#me', text: t('own_team_go') }))); return; } }   // ADR-0116: nobody under the owner — say so, draw no empty tables
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
  const selfId = String((((viewAs ? realMe : me) || {}).user || {}).id || (!isTeamPortal ? ownerId() || '' : ''));
  const team = currentTeam(people, tasks).filter((x) => String(x) !== selfId);
  const f = factor1(tasks, { range, team }), wp = weightedPoints(tasks, acts, wt, { range, team });
  const fp = pcov ? factor1(tasks, { range: prange, team }) : null, wpp = pcov ? weightedPoints(tasks, acts, wt, { range: prange, team }) : null;
  const nm = (id) => (id === GROUP ? t('group_bucket') : (nameOf(peopleById.get(id), lang) || id));
  const now = (id) => monthNumbers(f, wp, id), was = (id) => (fp ? monthNumbers(fp, wpp, id) : null);
  const ml = periodLabel(ym), pml = periodLabel(pm);
  // a change beside a number: neutral for what arrived, green or red for what was done and how fast
  const delta = (x, y, kind) => kmDelta(x, y, kind, pml);
  const T = now('team'), P = was('team');
  const tile = (k, label, v, pv, kind, sub) => el('button', { type: 'button', class: `km-tile crm-tile-f km-${k}${kpiTileF === k ? ' on' : ''}`, 'aria-pressed': String(kpiTileF === k), 'data-tile': k, title: t(kpiTileF === k ? 'crm_f_off' : 'km_tile_f'), onclick: () => { kpiTileF = kpiTileF === k ? null : k; renderKpi(); } }, el('b', { text: k === 'avg' ? hmOf(v) : String(v ?? '—') }),
    el('span', { text: label }), P ? el('small', { class: 'km-was' }, `${t('km_vs', { m: pml })}: ${k === 'avg' ? hmOf(pv) : (pv ?? '—')} `, delta(v, pv, kind)) : null, sub ? el('small', { class: 'hint', text: sub }) : null);
  const sorter = { points: (id) => (now(id) || {}).points || 0, total: (id) => (now(id) || {}).total || 0, avg: (id) => -(((now(id) || {}).avg) ?? 1e9) }[kpiMSort];
  const TF = { total: (n) => n.total, email: (n) => n.email, self: (n) => n.self, other: (n) => n.other, avg: (n) => n.closed, rd: (n) => n.rd || 0, points: (n) => n.points }[kpiTileF];
  const tsort = kpiTileF === 'avg' ? (id) => -(((now(id) || {}).avg) ?? 1e9) : TF ? (id) => TF(now(id) || {}) : null;
  const idsAll = f.people.map((r) => r.id);
  const ids = idsAll.filter((id) => !TF || TF(now(id) || {}) > 0).sort((a, b) => (tsort || sorter)(b) - (tsort || sorter)(a) || nm(a).localeCompare(nm(b), lang));
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
    const tr = el('tr', { class: `km-row${on ? ' on' : ''}`, 'data-id': id, title: t('km_click'),   // ADR-0106: the name is the button that opens and closes (a table row cannot carry «expanded»)
      onclick: () => { kpiOpen = on ? null : id; renderKpi(); } },
      el('td', {}, el('div', { class: 'km-name' }, el('button', { type: 'button', class: 'km-name-b', 'aria-expanded': String(on) }, el('span', { text: nm(id) }))), pos ? el('div', { class: 'hint', text: pos }) : null),
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
  // ADR-0123: what is not «who did what in the month» is one card each; a card opens its section in a window, nothing unfolds down the page
  const wkD = (() => { try { return weeklyDigest(allTasks(), weights(), team, new Date(), { ...CARD_DEFAULTS, ...(weights().card || {}) }); } catch { return null; } })();
  const tm0 = teamMonths[0];
  const secs = [
    { id: 'months', title: t('km_team_months'), v: tm0 ? String(tm0.x.total) : '—', sub: tm0 ? t('sc_months_sub', { m: periodLabel(tm0.m.ym), c: tm0.x.closed }) : '',
      node: [el('h2', { text: t('km_team_months') }), el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, el('th', { text: t('km_month') }), ['src_email', 'src_self', 'src_other', 'km_total', 'km_closed', 'km_avg', 'col_points'].map((k) => el('th', { class: 'num', text: t(k) })))),
        el('tbody', {}, teamMonths.map(({ m, x }) => el('tr', { class: m.ym === ym ? 'total' : null }, el('td', { text: `${periodLabel(m.ym)}${m.whole ? '' : ' *'}` }),
          [x.email, x.self, x.other, x.total, x.closed].map((v) => el('td', { class: 'num', text: String(v) })), el('td', { class: 'num', text: hmOf(x.avg) }), el('td', { class: 'num', text: String(x.points) }))))))] },
    { id: 'week', title: t('week_h'), v: wkD ? String(wkD.total) : '—', sub: wkD ? t('week_total', { p: wkD.total, q: wkD.prevTotal }) : '', node: kpiWeekSection(team, peopleById) },
    { id: 'load', title: t('load_h'), v: '', sub: t('sc_load_sub'), node: kpiLoadSection(team, peopleById) },
    { id: 'report', title: t('rep_h', { from: range.from, to: range.to }), v: '', sub: t('sc_report_sub'), node: kpiReportSection({ key: `m:${ym}`, range, tasks, activities: acts }, team, peopleById) },
    rep ? { id: 'tickets', title: t('sc_tickets_h'), v: '', sub: t('km_tickets_from', { a: rep.range.from, b: rep.range.to }), node: renderReports(rep.key, team) } : null,
    { id: 'ranks', title: t('rk_h'), v: '', sub: t('sc_ranks_sub'), node: rankLinksSection() },
    { id: 'defs', title: t('definitions'), v: String(KM_DEFS.length), sub: t('sc_defs_sub'), node: [el('h2', { text: t('definitions') }), el('ul', { class: 'defs' }, KM_DEFS.map((k) => el('li', { text: t(k) })))] },
  ].filter((x) => x && x.node && (!Array.isArray(x.node) || x.node.some(Boolean)));
  const more = secCards('kpi', secs);
  set(body,
    el('div', { class: 'bar km-bar' }, kindPills(renderKpi),
      el('label', {}, el('span', { text: t(kmKind === 'quarter' ? 'km_kind_quarter' : 'km_month') }), el('select', { id: 'kpi-month', onchange: (e) => { kpiMonth = e.target.value; if (!isQ(kpiMonth)) pref('kpimonth', kpiMonth); kpiOpen = kpiOpen; renderKpi(); } },
        months.map((m) => el('option', { value: m.ym, selected: m.ym === ym, text: `${periodLabel(m.ym)}${m.whole ? '' : ' *'}` })))),
      el('span', { class: 'hint', text: P ? t('km_vs', { m: pml }) : t('km_no_prev', { m: pml }) }),
      // anyone's page as he sees it — leads and managers too, who have no row in the counted team
      el('label', { class: 'km-va' }, el('span', { text: `👁 ${t('km_viewas_pick')}` }), el('select', { id: 'kpi-viewas', onchange: (e) => { const v = e.target.value; e.target.value = ''; if (v) startViewAs(v); } },
        el('option', { value: '', text: '—' }), peopleOf(datasets).filter((x) => !/\bsystem\b|مستخدم النظام/i.test(`${x.nameEn || ''} ${x.nameAr || ''}`)).map((x) => ({ x, n: nameOf(x, lang) || x.id }))
          .sort((a, b) => a.n.localeCompare(b.n, lang)).map(({ x, n }) => el('option', { value: x.id, text: n }))))),
    ownerTeamNote(),
    renderTeamPicker(people, team),
    datasets.some((d) => d.sample) ? el('p', { class: 'note sample', text: t('sample_note') }) : null,
    !cov.whole ? el('p', { class: 'note', text: t('km_partial', { got: cov.got, need: cov.need }) }) : null,
    el('div', { class: 'km-tiles' },
      (() => { const x = tile('total', t('km_total'), T.total, P && P.total, 'n'), s = splitBar(T); if (s) x.append(s); return x; })(),
      tile('email', t('src_email'), T.email, P && P.email, 'n', T.total ? t('km_share_of', { p: Math.round((T.email / T.total) * 100) }) : null),
      tile('self', t('src_self'), T.self, P && P.self, 'n', T.total ? t('km_share_of', { p: Math.round((T.self / T.total) * 100) }) : null),
      tile('other', t('src_other'), T.other, P && P.other, 'n', T.total ? t('km_share_of', { p: Math.round((T.other / T.total) * 100) }) : null),
      (() => { const x = tile('avg', t('km_avg'), T.avg, P && P.avg, 'l', t('km_closed_n', { n: T.closed })), g = closedRing(T.closed, T.total); if (g) x.append(g); return x; })(),
      tile('rd', t('km_rd'), rdOn ? T.rd : '—', rdOn && P && rdKnownFor(prange) ? P.rd : null, 'n', rdOn ? null : t('km_rd_unknown')),
      tile('points', t('col_points'), T.points, P && P.points, 'h')),
    kpiTileF ? el('div', { class: 'crm-filter km-tile-on' }, el('span', { text: t('km_tile_on', { f: t({ total: 'km_total', email: 'src_email', self: 'src_self', other: 'src_other', avg: 'km_avg', rd: 'km_rd', points: 'col_points' }[kpiTileF]), n: ids.length, all: idsAll.length }) }), el('button', { type: 'button', class: 'btn tiny quiet', text: t('crm_show_all'), onclick: () => { kpiTileF = null; renderKpi(); } })) : null,
    el('div', { class: 'row', style: 'justify-content:space-between;align-items:center;margin:4px 0 8px' },
      el('div', { class: 'pills' }, el('span', { class: 'hint', text: `${t('cnt_sort')}:` }), [['points', 'col_points'], ['total', 'km_total'], ['avg', 'km_avg']].map(([k, label]) =>
        el('button', { type: 'button', class: `pill-btn${kpiMSort === k ? ' on' : ''}`, text: t(label), onclick: () => { kpiMSort = k; renderKpi(); } }))),
      el('button', { type: 'button', class: 'btn tiny quiet', text: t('km_csv'), onclick: csv })),
    el('p', { class: 'hint', text: t('km_click') }),
    table,
    more);
  body.append(maKpiSection(range, prange, team));   // ADR-0095: a separate indicator — never added to tasks or points
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
  const uid = (me && me.user ? me.user.id : null) || (!isTeamPortal ? ownerId() : null);   // with no bookmark profile: the account that pulled here, else the manager in the team file (ADR-0115)
  const admin = isWeightsAdmin(wt, uid);
  const mayEdit = (k) => canEditWeight(wt, uid, k);
  // the groups: linked types as myafaqy lists them per team (from the latest file), else the weights file's own tags
  const ttLive = liveTeamTypes(), tt = (ttLive && ttLive.teamTypes) || {};   // the newest list: from «أنواع الفرق» or from the latest pull
  const findTeam = (re) => Object.entries(tt).find(([n]) => re.test(n));
  const asTeam = findTeam(/jeddah.*after\s*-?\s*sales/i), rdTeam = findTeam(/jeddah.*r\s*&\s*d/i);
  const fromFile = (team) => Object.entries(wt.tasks).filter(([, x]) => x.team === team || (team === 'aftersales' && x.team === 'both') || (team === 'rd' && x.team === 'both')).map(([k]) => k);
  const linked = (teamEntry, team) => (teamEntry ? teamEntry[1].map((x) => ({ key: typeKey(x.nameEn || x.nameAr), name: typeNameOf(x.nameEn, x.nameAr) })) : fromFile(team).map((k) => ({ key: k, name: (seen.get(k) || {}).name || k })));
  const groups = [
    { id: 'aftersales', title: t('wteam_aftersales'), live: !!asTeam, rows: linked(asTeam, 'aftersales') },
    { id: 'rd', title: t('wteam_rd'), live: !!rdTeam, rows: linked(rdTeam, 'rd') },
    { id: 'general', title: t('wteam_general'), live: false, rows: fromFile('general').map((k) => ({ key: k, name: (seen.get(k) || {}).name || k })) },
  ];
  const save = async (patch) => { weightsDevice = { ...(weightsDevice || {}), tasks: { ...((weightsDevice || {}).tasks || {}), ...(patch.tasks || {}) }, activities: { ...((weightsDevice || {}).activities || {}), ...(patch.activities || {}) }, editors: { ...((weightsDevice || {}).editors || {}) , ...(patch.editors || {}) } }; await store.putWeights(weightsDevice); renderWeights(); renderKpi(); renderMe(); };
  const stepSel = (cur, on, enabled) => el('select', { class: 'w-sel', 'aria-label': t('a11y_type_points'), ...(enabled ? {} : { disabled: '' }), onchange: (e) => on(Number(e.target.value)) }, WEIGHT_STEPS.map((w) => el('option', { value: String(w), selected: w === cur, text: String(w) })));
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
      el('td', {}, el('select', { class: 'w-sel', 'aria-label': t('w_col_mode'), ...(can ? {} : { disabled: '' }), onchange: (e) => put({ mode: e.target.value }) }, [...POINT_MODES.map((m) => [m, t(`mode_${m}`)]), ...RR.methods.map((m) => [m.id, m.name]), ...(isCustomMode(x.mode) && !RR.methods.some((m) => m.id === x.mode) ? [[x.mode, t('mode_gone')]] : [])].map(([m, label]) => el('option', { value: m, selected: m === (x.mode || 'done'), text: label }))), el('div', { class: 'hint', text: modeDesc(x.mode || 'done') })),
      el('td', { class: 'num' }, (x.mode || 'done') === 'done' ? [el('span', { class: 'hint', text: '—' }), medHint(r.key)] : [
        el('input', { type: 'number', min: '0.25', max: '400', step: '0.25', class: 'std-in', 'aria-label': t('w_col_std'), value: String(x.std || ''), ...(can ? {} : { disabled: '' }), onchange: (e) => { const v = Number(e.target.value); if (v > 0 && v <= 400) put({ std: v }); } }),
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
          el('td', {}, el('div', { text: r.name ? typeLabel(r.name, lang) : pretty(r.key) }), r.x ? null : el('div', { class: 'hint warn-text', text: t('w_new_type') })),
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
            el('td', {}, el('div', { text: r.name ? typeLabel(r.name, lang) : pretty(r.key) }), r.x ? null : el('div', { class: 'hint warn-text', text: t('w_new_type') })),
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
    // ADR-0150: each team's types, and the activities, fold under their title — one open at a time, and it stays open while you edit
    groups.map((g) => { const part = simpleTable(g); return part ? fold('weights', g.id, part[0], part[1]) : null; }),
    fold('weights', 'acts', el('h2', {}, t('weights_acts_h')), [helpQ('help_weights_acts'),
      el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, ['w_col_category', 'w_col_weight'].map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
        el('tbody', {}, Object.entries(wt.activities).map(([k, w]) => el('tr', {}, el('td', { text: pretty(k) }), el('td', { class: 'num' }, stepSel(w, (nw) => save({ activities: { [k]: nw } }), admin || mayEdit(k))))))))]),
    el('div', { class: 'row', style: 'margin:12px 0' },
      admin ? el('button', { type: 'button', class: 'btn primary', text: `⇪ ${t('weights_publish_team')}`, onclick: () => { localStorage.setItem('afaqy.weights.publish', approvedJson()); window.open('./manage-systems.html#weights', '_blank', 'noopener'); toast(t('weights_publish_opened')); } }) : null,
      el('button', { type: 'button', class: 'btn', text: t('weights_download'), onclick: download }),
      admin ? el('button', { type: 'button', class: 'btn', text: t('weights_upload'), onclick: () => upload.click() }) : null, upload,
      weightsDevice ? el('button', { type: 'button', class: 'btn quiet', text: t('weights_reset'), onclick: async () => { weightsDevice = null; await store.putWeights(null); renderWeights(); renderKpi(); renderMe(); } }) : null,
      el('span', { class: 'hint', text: wt.reviewed ? t('weights_reviewed', { d: wt.reviewed }) : '' })),
    // ADR-0123: the advanced settings are a card that opens in a window; the rules and types boxes are added into it after the page is drawn
    secCards('weights', [{ id: 'adv', title: t('w_adv'), v: '', sub: t('w_adv_lead'), node: (wAdvNode = el('div', { class: 'w-adv' }, el('div', { class: 'w-adv-top' }),
      el('div', { class: 'tiers' }, TIERS.map((tr) => el('div', { class: 'tier' }, el('b', { text: String((weightsRepo && weightsRepo.tiers && weightsRepo.tiers[tr]) || { admin: 1, customer: 2, integration: 3, multistage: 5 }[tr]) }), el('div', {}, el('strong', { text: t(`tier_${tr}`) }), el('p', { text: t(`tier_${tr}_why`) }))))),
      groups.map(table),
      el('p', { class: 'hint', text: t('weights_seen_note', { range: ds ? `${ds.range.from} → ${ds.range.to}` : '—' }) }), maWeightsLocked())) }]));
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
  const cmp = fileApplies ? compareOrg(od.org, roster(), root) : { leader: [], missingInFile: [], notInOrg: [], inactive: [], onLeave: [], unmatched: od.org.unmatchedUnder(root) };
  const lines = [...cmp.leader.map((x) => t('org_diff_leader', { name: nm(x.id), org: x.orgPid ? nm(x.orgPid) : (x.orgName || t('org_no_mgr')), file: nm(x.file) })),
    ...cmp.missingInFile.map((id) => t('org_diff_missing', { name: nm(id), root: nm(root) })), ...cmp.inactive.map((id) => t('org_diff_inactive', { name: nm(id), status: od.org.statusOf(id) })), ...(cmp.onLeave || []).map((id) => t('org_diff_leave', { name: nm(id) })), ...cmp.notInOrg.map((id) => t('org_diff_notin', { name: nm(id) })),
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
const EXT_NEEDED = '1.0.6';   // ADR-0104: the extension that says why it waits; 1.0.5 reads the server lists (ADR-0120), 1.0.6 the start times (ADR-0124)
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
    datasets = mergeDataset(datasets, r.dataset); setOwnerFrom(r.dataset);
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
  if (!on || !got) { set(box, el('p', { class: 'ext-line', text: on ? t('ext_almost') : t('ext_off') }), el('p', { class: 'note ext-phone', text: t('ext_phone') }), el('div', { class: 'ext-desk' }, list, how)); return; }
  const s = st, when = s.lastAt ? new Date(s.lastAt + 3 * 3600e3).toISOString().replace('T', ' ').slice(0, 16) : null;
  const mins = s.runningAt ? Math.max(1, Math.round((Date.now() - s.runningAt) / 60e3)) : 0;
  const msg = { pulling: t('ext_pulling'), failed: t('ext_failed', { e: s.error || '' }), 'needs-portal': t('ext_month'), 'needs-signin': t('ext_signin'), 'signin-timeout': t('ext_signin_late'), busy: t('ext_busy', { m: mins, r: Math.max(1, 10 - mins) }), 'bad-recipe': t('ext_bad_recipe') }[s.status] || (when ? t('ext_last', { d: when }) : t('ext_never'));   // ADR-0104: every state said
  const old = String(document.documentElement.dataset.afaqyExt || '') < EXT_NEEDED;
  set(box, el('p', { class: `ext-line on${['failed', 'needs-signin', 'signin-timeout', 'busy', 'bad-recipe'].includes(s.status) ? ' warn' : ''}`, text: `${t('ext_on')} ${msg}` }),
    old ? el('p', { class: 'note warn ext-old' }, `${t('ext_old', { v: document.documentElement.dataset.afaqyExt || '?', n: EXT_NEEDED })} `, el('a', { class: 'btn tiny', href: './assets/afaqy-sync-extension.zip', download: 'afaqy-sync-extension.zip', text: `⬇ ${t('ext_dl')}` })) : null,
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
  const orgNode = orgCheckBox();
  const assignNode =     el('section', { class: 'assign-box' },
      el('h2', {}, t('assign_h'), helpQ('help_assign')),
      el('ol', { class: 'assign-steps' }, ['assign_s1', 'assign_s2', 'assign_s3', 'assign_s4'].map((k) => el('li', { text: t(k) }))),
      el('div', { class: 'row' },
        el('a', { class: 'btn primary bm', href: ab, draggable: 'true', text: `⚙ ${t('assign_bm')}`, onclick: (e) => { e.preventDefault(); toast(t('me_drag')); } }),
        el('button', { type: 'button', class: 'btn', text: t('me_copy'), onclick: async () => { try { await navigator.clipboard.writeText(decodeURIComponent(ab)); toast(t('me_copied')); } catch { toast(t('me_copy_fail')); } } })),
      el('p', { class: 'note', text: t('assign_warn') }));
    // ADR-0120: the accounts board sits under the panel that changes it — the newest manager pull that carries the accounts list
  const accRep = [...reports].filter((r) => (r.accounts || []).length).sort((x, y) => String(y.extractedAt || '').localeCompare(String(x.extractedAt || '')))[0];
  const accNode = (() => { const rep = [...reports].filter((r) => (r.accounts || []).length).sort((x, y) => String(y.extractedAt || '').localeCompare(String(x.extractedAt || '')))[0];
      const sec = rep ? accountsBoardSection(rep, (id) => nameOf(known.get(id) || {}, lang) || id) : null;
      return el('section', { class: 'ab-box', id: 'accounts-board' }, sec || [el('h2', {}, t('ab_title'), helpQ('help_ab')), el('p', { class: 'empty', text: t('ab_none') })]); })();
  const signNode = renderSignatures();
  const rosterBox = el('div', { class: 'roster-box' },
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
  // ADR-0123: the assignment panel stays on the page; everything else is a card that opens in a window
  const accB = accRep ? accountsBoard(accRep) : null;
  set(body, assignNode, secCards('team', [
    { id: 'roster', title: t('team_roster_h'), v: String(people.length), sub: t('sc_roster_sub'), node: rosterBox },
    { id: 'accounts', title: t('ab_title'), v: accB ? accB.total.accounts.toLocaleString('en-US') : '—', sub: accB ? t('sc_acc_sub', { d: accB.total.devices.toLocaleString('en-US'), e: accB.engineers.length }) : t('ab_none'), node: accNode },
    orgNode ? { id: 'org', title: t('sc_org_h'), v: '', sub: t('sc_org_sub'), node: orgNode } : null,
    signNode && teamEdit ? { id: 'signs', title: t('sc_signs_h'), v: '', sub: t('sc_signs_sub'), node: signNode } : null,   // signatures are edited with the team, as before
  ].filter(Boolean)));
  // ADR-0059: the list reads as text until «Edit team»; editing shows the fields, the ✎ buttons and the file buttons
  if (!teamEdit) { const tb = rosterBox.querySelector('.team-table');
    if (tb) { for (const c of tb.querySelectorAll('input, select')) c.replaceWith(el('span', { class: 'ro-val', text: c.tagName === 'SELECT' ? (c.selectedOptions[0] && c.value ? c.selectedOptions[0].text : '—') : (c.value || '—') }));
      for (const b of tb.querySelectorAll('button')) b.remove(); }
    for (const n of rosterBox.querySelectorAll('.team-add')) n.hidden = true;
    for (const b of rosterBox.querySelectorAll('button')) if (b.textContent.trim() === t('pending_upload')) b.hidden = true;
    for (const b of rosterBox.querySelectorAll('.team-edit-btn ~ .btn, .team-edit-btn ~ input[type=file]')) b.hidden = true; }
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
    // ADR-0150: the titles only — one part opens at a time, so the guide is a page and not twenty screens
    GUIDE.map(([h, b]) => fold('guide', h, el('h3', { text: t(h) }), el('p', { text: t(b) }), 'g-part')),
    fold('guide', 'definitions', el('h3', { text: t('definitions') }), el('ul', { class: 'defs' }, DEFINITIONS.map((k) => el('li', { text: t(k) }))), 'g-part'));
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
  try { const recs = await pstRead(f, null, (p) => say(t('mf_progress', { n: p.n.toLocaleString('en'), mb: p.mb, size: Math.round(p.size / 1048576), sec: p.sec })));   // ADR-0097: from the disk, in the background
    mfState.msgs = mfParseRecs(recs); mfState.file = f.name; mfState.copies = mfState.msgs.copies || 0; mfState.readStats = recs.stats;
    try { mfState.saved = await maSaveBrowser(recs, f); } catch (e) { console.error(e); mfState.saved = null; }   // ADR-0099: kept, so it is never read again
    const counts = new Map(); for (const m of mfState.msgs) counts.set(m.sender, (counts.get(m.sender) || 0) + 1);
    mfState.picked = new Set([...counts.entries()].sort((p, q) => q[1] - p[1]).slice(0, 5).map(([k]) => k)); toast(t('mf_done', { n: mfState.msgs.length })); return true; }
  catch (err) { console.error(err); mfState.lastErr = err; say(t('mf_fail')); return false; }
}
function renderMailFile() {
  const body = $('mailfile-body'); if (!body || isTeamPortal) return;
  const rulesOpen = !!(body.querySelector('.mf-rules') && body.querySelector('.mf-rules').open);   // the rules box stays open while its words are edited
  const st = mfState, rules = mfRules(), catName = (k) => { const r = rules.find((x) => x.k === k); return (r && r.name) || (['normal', 'advanced', 'upsell', 'other'].includes(k) ? t(`mf_cat_${k}`) : k); };
  const CATS = [...rules.map((r) => r.k), 'other'];   // ADR-0077: the results follow the manager's categories
  const status = el('p', { class: 'msg', role: 'status', 'aria-live': 'polite', text: st.msgs ? `${st.saved ? `${t('mf_saved', { n: st.saved.n.toLocaleString('en'), a: st.saved.added.toLocaleString('en') })} ` : ''}${t(st.copies ? 'mf_file_copies' : 'mf_file', { name: st.file, n: st.msgs.length, c: st.copies })}${st.readStats ? ` ${t('mf_read_stats', { mb: Math.max(1, Math.round(st.readStats.bytesRead / 1048576)), size: Math.round(st.readStats.size / 1048576).toLocaleString('en'), sec: Math.round(st.readStats.sec) })}` : ''}` : '' });   // ADR-0097: how much of the file was actually read
  const fileIn = el('input', { type: 'file', accept: '.pst,.ost', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return;
    if (f.size > MF_BROWSER_MAX) { e.target.value = ''; set(status, maTooBig(f)); const box = document.querySelector('.ma-sec'); if (box) { box.scrollIntoView({ behavior: 'smooth', block: 'center' }); box.classList.add('ma-flash'); setTimeout(() => box.classList.remove('ma-flash'), 2400); } return; }   // ADR-0096
    if (await mfLoadFile(f, (s) => { status.textContent = s; })) renderMailFile(); else set(status, mfFailBox(mfState.lastErr)); e.target.value = ''; } });
  const top = el('section', { class: 'dt-quick' },
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn primary', text: `📂 ${t('mf_pick_file')}`, onclick: () => fileIn.click() }), fileIn, el('span', { class: 'hint', text: t('mf_privacy') })), status,
    el('details', { class: 'me-phones' }, el('summary', { text: t('mf_how_h') }), el('p', { class: 'hint', text: t('mf_how') })));
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
  if (!st.msgs) { set(body, mailSrc('pst'), maSection(), top, rulesBox, howBox); return; }
  const inRange = (m) => (!st.from || (m.date || '').slice(0, 10) >= st.from) && (!st.to || (m.date || '').slice(0, 10) <= st.to);
  const ranged = st.msgs.filter(inRange), counts = new Map(), emails = new Map();
  for (const m of ranged) { counts.set(m.sender, (counts.get(m.sender) || 0) + 1); if (!emails.has(m.sender) && m.email) { const ad = mfAddr(m.email); if (ad) emails.set(m.sender, ad); } }   // ADR-0099: an internal sender shows his Exchange alias
  const senders = [...counts.entries()].sort((p, q) => q[1] - p[1]);
  const qq = String(st.q || '').trim().toLowerCase(), found = qq ? senders.filter(([s]) => `${s} ${emails.get(s) || ''}`.toLowerCase().includes(qq)) : senders;   // ADR-0099: find by name or e-mail
  const dateRow = el('div', { class: 'row mgr-dates' }, el('label', {}, el('span', { text: t('mf_from') }), el('input', { type: 'date', value: st.from, onchange: (e) => { st.from = e.target.value; renderMailFile(); } })),
    el('label', {}, el('span', { text: t('mf_to') }), el('input', { type: 'date', value: st.to, onchange: (e) => { st.to = e.target.value; renderMailFile(); } })));
  const sendersBox = el('section', {}, el('h2', { text: t('mf_senders_h') }), el('p', { class: 'hint', text: t('mf_senders_lead') }),
    el('div', { class: 'row mf-find' }, el('input', { type: 'search', class: 'mf-q', placeholder: t('mf_find_ph'), value: st.q || '', 'aria-label': t('mf_find_ph'), oninput: (e) => { st.q = e.target.value; const keep = e.target.selectionStart; renderMailFile(); const q2 = document.querySelector('#mailfile-body .mf-q'); if (q2) { q2.focus(); q2.setSelectionRange(keep, keep); } } }),
      el('button', { type: 'button', class: 'btn tiny', text: t('mf_pick_matches'), onclick: () => { for (const [k] of found) st.picked.add(k); renderMailFile(); } }),
      el('button', { type: 'button', class: 'btn tiny', text: t('mf_all'), onclick: () => { st.picked = new Set(senders.map(([k]) => k)); renderMailFile(); } }),
      el('button', { type: 'button', class: 'btn tiny', text: t('mf_none'), onclick: () => { st.picked = new Set(); renderMailFile(); } }),
      el('span', { class: 'hint', text: t('mf_found', { n: found.length, p: st.picked.size }) })),
    el('div', { class: 'table-wrap mf-senders' }, el('table', {}, el('thead', {}, el('tr', {}, ['', 'mf_col_sender', 'mf_col_email', 'mf_col_n'].map((k, i) => el('th', { class: i === 3 ? 'num' : null, text: k ? t(k) : '' })))),
      el('tbody', {}, found.slice(0, 300).map(([s, n]) => el('tr', { class: st.picked.has(s) ? 'on' : null },
        el('td', {}, el('input', { type: 'checkbox', 'aria-label': s, ...(st.picked.has(s) ? { checked: '' } : {}), onchange: (e) => { if (e.target.checked) st.picked.add(s); else st.picked.delete(s); renderMailFile(); } })),
        el('td', { text: s || '—' }), el('td', { class: 'ltr hint', text: emails.get(s) || '' }), el('td', { class: 'num', text: String(n) })))))));
  const picked = ranged.filter((m) => st.picked.has(m.sender)).map((m) => ({ ...m, cat: maCategory({ s: m.subject, b: m.own }, (x) => mfCategory(x, rules)) }));   // ADR-0099: the sender's own words
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
  const { tbody, more } = pagedBody([...shown], (m) => el('tr', {}, el('td', { class: 'ltr', text: (m.date || '').slice(0, 10) }), el('td', { text: m.sender }), el('td', { text: m.subject || '—' }), el('td', {}, el('span', { class: `mf-pill ${m.cat}`, text: catName(m.cat) })), el('td', { class: 'hint', text: mfFolder(m.folder) })));
  const listBox = el('section', { id: 'mf-list' }, el('h2', { text: t('mf_list_h') }),
    el('div', { class: 'row' }, el('div', { class: 'pills' }, [['all', t('mf_all')], ...CATS.map((c) => [c, `${catName(c)} (${tot[c]})`])].map(([k, l]) => el('button', { type: 'button', class: `pill-btn${st.cat === k ? ' on' : ''}`, text: l, onclick: () => { st.cat = k; renderMailFile(); } }))),
      el('button', { type: 'button', class: 'btn tiny', text: `⬇ ${t('mf_export')}`, onclick: csv })),
    shown.length ? [el('div', { class: 'table-wrap mf-msgs' }, el('table', {}, el('thead', {}, el('tr', {}, [t('mf_col_date'), t('mf_col_sender'), t('mf_col_subject'), t('mf_col_cat'), t('mf_col_folder')].map((h) => el('th', { text: h })))), tbody)), more] : el('div', { class: 'empty', text: t('mf_empty') }));
  set(body, mailSrc('pst', false), maSection(), top, dateRow, sendersBox, rulesBox, results, howBox, listBox);
}
// ---------- monthly readings — the measurement basis of the Jeddah proposal (ADR-0111) ----------
const rdState = { month: null, names: false };
function rdModel() {
  const tasks = allTasks(), ppl = peopleOf(datasets);
  const ids = new Set(ppl.filter((p) => (p.teams || []).some((x) => READINGS_TEAM.test(x))).map((p) => p.id));
  // only months a pull covers from their first day: a pull of October also carries older tasks that are still open, and those are not «September»
  const covered = (m) => datasets.some((d) => d.range && d.range.from <= `${m}-01` && d.range.to >= `${m}-01`);
  const months = [...new Set(tasks.filter((x) => ids.has(x.assigneeId) && x.createdAt).map((x) => saudiDay(x.createdAt).slice(0, 7)))].filter(covered).sort().reverse().slice(0, 24);
  // the last day the pulls cover in a month: working days and «open at the end» are counted to it
  const lastDay = (m) => { const ds = datasets.filter((d) => d.range && d.range.from.slice(0, 7) <= m && d.range.to.slice(0, 7) >= m).map((d) => (d.range.to.slice(0, 7) > m ? monthLast(m) : d.range.to)).sort(); return ds.length ? ds[ds.length - 1] : monthLast(m); };
  const W = weights(), cache = new Map();
  const of = (m) => { if (!cache.has(m)) cache.set(m, monthReadings(tasks, ppl, W, { month: m, to: lastDay(m) })); return cache.get(m); };
  return { tasks, ppl, ids, months, of };
}
const rdFmt = { n: (v) => (v == null ? '—' : Math.round(v).toLocaleString('en-US')), p: (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`), d: (v) => (v == null ? '—' : v.toFixed(1)), h: (v) => (v == null ? '—' : `${v.toFixed(2)} ${t('rd_unit_h')}`), x: (v) => (v == null ? '—' : `${v.toFixed(1)}×`) };
const rdMonthName = (m) => new Intl.DateTimeFormat(lang === 'ur' ? 'ur' : lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${m}-15T12:00:00Z`));
function renderReadings() {
  const body = $('readings-body'); if (!body || isTeamPortal) return;
  const M = rdModel();
  if (!M.tasks.length) { set(body, el('p', { class: 'note', text: t('ot_nodata') })); return; }
  if (!M.ids.size || !M.months.length) { set(body, el('p', { class: 'note', text: t('rd_noteam') })); return; }
  if (!rdState.month || !M.months.includes(rdState.month)) rdState.month = M.months[0];
  const r = M.of(rdState.month), prevM = M.months[M.months.indexOf(rdState.month) + 1] || null, p = prevM ? M.of(prevM) : null;
  const F = rdFmt, nm = (id) => nameOf(M.ppl.find((x) => x.id === id) || {}, lang) || id;
  const who = (m) => (rdState.names ? nm(m.id) : t('rd_member_n', { n: m.no }));
  // a table that scrolls sideways must be reachable by keyboard and carry a name (WCAG 2.1.1)
  const wrap = (label, table) => el('div', { class: 'table-wrap', tabIndex: 0, role: 'region', 'aria-label': t(label) }, table);
  const th = (key, tip) => { const c = el('th', { scope: 'col', text: t(key) }); if (tip) attachTip(c, t(tip), false); return c; };
  // ----- controls
  const sel = el('select', { class: 'w-sel', id: 'rd-month', 'aria-label': t('rd_month'), onchange: (e) => { rdState.month = e.target.value; renderReadings(); } }, ...M.months.map((m) => el('option', { value: m, text: rdMonthName(m), ...(m === rdState.month ? { selected: '' } : {}) })));
  const names = el('button', { type: 'button', class: `pill-btn${rdState.names ? ' on' : ''}`, id: 'rd-names', 'aria-pressed': String(rdState.names), text: t('rd_names'), onclick: () => { rdState.names = !rdState.names; renderReadings(); } });
  const xl = el('button', { type: 'button', class: 'btn', id: 'rd-xlsx', text: `⬇ ${t('rd_export')}`, onclick: () => rdXlsx(r, who) });
  const bar = el('div', { class: 'rd-controls' }, el('label', { class: 'hint', for: 'rd-month', text: t('rd_month') }), sel, names, xl);
  const scope = el('p', { class: 'hint rd-scope', text: t('rd_scope', { n: r.accounts, from: r.from, to: r.to, days: r.workingDays }) });
  // ----- six headline tiles (each number lives here only)
  const tile = (key, value, sub, prev) => { const c = el('div', { class: 'rd-tile', tabIndex: 0 }, el('span', { class: 'rd-tl', text: t(`rd_t_${key}`) }), el('b', { class: 'rd-tv', text: value }), el('span', { class: 'rd-ts', text: sub }), ['generic', 'self5', 'mail8'].includes(key) ? el('span', { class: 'rd-say', text: t(`rd_say_${key}`) }) : null, prev != null ? el('span', { class: 'rd-tp', text: t('rd_prev', { m: rdMonthName(prevM), v: prev }) }) : null); c.dataset.rd = key; attachTip(c, t(`rd_t_${key}_d`), false); return c; };
  const tiles = el('div', { class: 'rd-tiles' },
    tile('arrived', F.n(r.arrived), t('rd_t_arrived_s', { p: F.p(r.closureRate) }), p ? F.n(p.arrived) : null),
    tile('generic', F.p(r.genericShare), t('rd_of', { n: F.n(r.generic), m: F.n(r.arrived) }), p ? F.p(p.genericShare) : null),
    tile('self5', F.p(r.selfLe5mShare), t('rd_of', { n: F.n(r.selfLe5m), m: F.n(r.selfClosed) }), p ? F.p(p.selfLe5mShare) : null),
    tile('mail8', F.p(r.emailLe8hShare), t('rd_of', { n: F.n(r.emailLe8h), m: F.n(r.emailClosed) }), p ? F.p(p.emailLe8hShare) : null),
    tile('dmed', F.d(r.dammamMedianPerDay), t('rd_t_dmed_s', { t: r.target, h: F.d(r.dammamMaxPerDay) }), p ? F.d(p.dammamMedianPerDay) : null),
    tile('open', F.n(r.open), t('rd_t_open_s', { n: F.n(r.openOver7) }), p ? F.n(p.open) : null));
  // ----- the rest of the readings
  const more = [['accounts', F.n(r.accounts), 'count'], ['days', F.n(r.workingDays), 'cal'], ['types', F.n(r.typeCount), 'count'], ['email', F.n(r.email), 'count'], ['self', F.n(r.self), 'count'], ['others', F.n(r.others), 'count'],
    ['med_all', F.h(r.medianAll), 'clock'], ['med_email', F.h(r.medianEmail), 'clock'], ['med_self', F.h(r.medianSelf), 'clock'], ['mail24', F.p(r.emailLe24hShare), 'clock'], ['mail7d', F.p(r.emailGt7dShare), 'clock'],
    ['sys8', F.p(r.sysLe8hShare), 'sys'], ['dmax', F.d(r.dammamMaxPerDay), 'dammam'], ['attarget', `${F.n(r.atTarget)} / ${F.n(r.accounts)}`, 'dammam'], ['spread', F.x(r.spread), 'count'], ['points', F.n(r.points), 'tier']];
  const moreBox = el('section', { class: 'card rd-card' }, el('h2', { text: t('rd_more_h') }), wrap('rd_more_h', el('table', { class: 'rd-table', id: 'rd-more' }, el('thead', {}, el('tr', {}, th('rd_c_reading'), th('rd_c_value'), th('rd_c_how'))),
    el('tbody', {}, ...more.map(([k, v, how]) => el('tr', { 'data-rd': k }, el('th', { scope: 'row', text: t(`rd_r_${k}`) }), el('td', { class: 'num', text: v }), el('td', { class: 'hint', text: t(`rd_h_${how}`) })))))));
  // ----- by task type
  const peakT = Math.max(...r.types.map((x) => x.arrived), 1);
  const unweighted = r.types.filter((x) => !x.weighted).map((x) => x.label);
  const typesBox = el('section', { class: 'card rd-card' }, el('h2', { text: t('rd_types_h') }), wrap('rd_types_h', el('table', { class: 'rd-table', id: 'rd-types' },
    el('thead', {}, el('tr', {}, th('rd_c_type'), th('rd_c_arrived'), th('rd_c_share'), th('rd_c_closed'), th('rd_c_median', 'rd_h_clock'), th('rd_c_le8', 'rd_h_clock'), th('rd_c_tier', 'rd_h_tier'), th('rd_c_pts'), th('rd_c_ditem', 'rd_h_dammam'), th('rd_c_dpts'))),
    el('tbody', {}, ...r.types.map((x) => el('tr', { 'data-type': x.key, class: x.key === 'email customer activity' || x.key === 'manual task' ? 'rd-generic' : '' }, el('th', { scope: 'row', text: x.label }), el('td', { class: 'num', text: F.n(x.arrived) }),
      el('td', {}, el('span', { class: 'rd-bar', role: 'img', 'aria-label': F.p(x.share) }, el('i', { style: `width:${Math.max(1, x.arrived / peakT * 100).toFixed(1)}%` })), el('span', { class: 'rd-barv', text: F.p(x.share) })),
      el('td', { class: 'num', text: F.n(x.closed) }), el('td', { class: 'num', text: x.median == null ? '—' : x.median.toFixed(2) }), el('td', { class: 'num', text: F.p(x.le8hShare) }),
      (() => { const c = el('td', { class: 'num rd-tier', tabIndex: 0, text: String(x.tierNo) }); attachTip(c, t(`tier_${x.tier}`), false); return c; })(), el('td', { class: 'num', text: F.n(x.points) }), el('td', { text: x.dammamItem || '—' }), el('td', { class: 'num', text: x.dammamItem ? F.n(x.dammamPoints) : '—' })))))),
    unweighted.length ? el('p', { class: 'hint', text: t('rd_unweighted', { list: unweighted.join(t('list_sep')) }) }) : null);
  // ----- by member
  const peakD = Math.max(r.target, r.dammamMaxPerDay || 0) * 1.1;
  const membersBox = el('section', { class: 'card rd-card' }, el('h2', { text: t('rd_members_h') }), wrap('rd_members_h', el('table', { class: 'rd-table', id: 'rd-members' },
    el('thead', {}, el('tr', {}, th('rd_c_member'), th('rd_c_arrived'), th('rd_c_closed'), th('rd_c_email'), th('rd_c_self'), th('rd_c_others'), th('rd_c_tierpts', 'rd_h_tier'), th('rd_c_dday', 'rd_t_dmed_d'), th('rd_c_sys8', 'rd_h_sys'), th('rd_c_open', 'rd_t_open_d'), th('rd_c_over7', 'rd_c_over7_d'), el('th', { scope: 'col', text: t('rd_c_auto', { n: r.autoPoints }) }))),
    el('tbody', {}, ...r.members.map((m) => el('tr', { 'data-no': m.no }, el('th', { scope: 'row', text: who(m) }), el('td', { class: 'num', text: F.n(m.arrived) }), el('td', { class: 'num', text: F.n(m.closed) }), el('td', { class: 'num', text: F.n(m.email) }), el('td', { class: 'num', text: F.n(m.self) }), el('td', { class: 'num', text: F.n(m.others) }), el('td', { class: 'num', text: F.n(m.points) }),
      el('td', {}, el('span', { class: 'rd-bar rd-bar-t', role: 'img', 'aria-label': `${F.d(m.dammamPerDay)} / ${r.target}` }, el('i', { style: `width:${Math.max(1, (m.dammamPerDay || 0) / peakD * 100).toFixed(1)}%` }), el('u', { style: `inset-inline-start:${(r.target / peakD * 100).toFixed(1)}%` })), el('span', { class: 'rd-barv', text: F.d(m.dammamPerDay) })),
      el('td', { class: 'num', text: F.p(m.sysLe8hShare) }), el('td', { class: 'num', text: F.n(m.open) }), el('td', { class: `num${m.openOver7 ? ' rd-late' : ''}`, text: F.n(m.openOver7) }), el('td', { class: 'num', text: m.score.auto.toFixed(1) })))),
    el('tfoot', {}, el('tr', {}, el('th', { scope: 'row', text: t('rd_team') }), el('td', { class: 'num', text: F.n(r.arrived) }), el('td', { class: 'num', text: F.n(r.closed) }), el('td', { class: 'num', text: F.n(r.email) }), el('td', { class: 'num', text: F.n(r.self) }), el('td', { class: 'num', text: F.n(r.others) }), el('td', { class: 'num', text: F.n(r.points) }), el('td', {}), el('td', { class: 'num', text: F.p(r.sysLe8hShare) }), el('td', { class: 'num', text: F.n(r.open) }), el('td', { class: `num${r.openOver7 ? ' rd-late' : ''}`, text: F.n(r.openOver7) }), el('td', {}))))),
    el('p', { class: 'hint', text: t('rd_members_note', { t: r.target, b: F.n(r.baseTarget) }) }));
  // ----- month by month (the same definitions for every pulled month)
  const monthsBox = M.months.length > 1 ? el('section', { class: 'card rd-card' }, el('h2', { text: t('rd_months_h') }), wrap('rd_months_h', el('table', { class: 'rd-table', id: 'rd-months' },
    el('thead', {}, el('tr', {}, th('rd_month'), th('rd_t_arrived'), th('rd_c_closedp'), th('rd_t_generic', 'rd_t_generic_d'), th('rd_t_self5', 'rd_t_self5_d'), th('rd_t_mail8', 'rd_t_mail8_d'), th('rd_t_dmed', 'rd_t_dmed_d'), th('rd_t_open', 'rd_t_open_d'))),
    el('tbody', {}, ...M.months.map((m) => { const x = M.of(m); return el('tr', { class: m === rdState.month ? 'on' : '', 'data-month': m }, el('th', { scope: 'row' }, el('button', { type: 'button', class: 'linkish', text: rdMonthName(m), onclick: () => { rdState.month = m; renderReadings(); } })),
      el('td', { class: 'num', text: F.n(x.arrived) }), el('td', { class: 'num', text: F.p(x.closureRate) }), el('td', { class: 'num', text: F.p(x.genericShare) }), el('td', { class: 'num', text: F.p(x.selfLe5mShare) }), el('td', { class: 'num', text: F.p(x.emailLe8hShare) }), el('td', { class: 'num', text: F.d(x.dammamMedianPerDay) }), el('td', { class: 'num', text: F.n(x.open) })); }))))) : null;
  set(body, bar, scope, tiles, typesBox, membersBox, moreBox, monthsBox);
}
async function rdXlsx(r, who) {
  let X; try { X = await loadXlsx(); } catch { toast(t('proj_x_fail')); return; }
  const wb = X.utils.book_new(), pct = (v) => (v == null ? '' : +(v * 100).toFixed(1)), h2 = (v) => (v == null ? '' : +v.toFixed(2));
  const readings = [[t('rd_c_reading'), t('rd_c_value')], [t('rd_month'), r.month], [t('rd_xl_period'), `${r.from} → ${r.to}`], [t('rd_r_accounts'), r.accounts], [t('rd_r_days'), r.workingDays], [t('rd_t_arrived'), r.arrived], [t('rd_c_closed'), r.closed], [t('rd_c_closedp'), pct(r.closureRate)],
    [`${t('rd_t_generic')} (%)`, pct(r.genericShare)], [t('rd_r_types'), r.typeCount], [t('rd_r_email'), r.email], [t('rd_r_self'), r.self], [t('rd_r_others'), r.others], [t('rd_r_med_all'), h2(r.medianAll)], [t('rd_r_med_email'), h2(r.medianEmail)], [t('rd_r_med_self'), h2(r.medianSelf)],
    [`${t('rd_t_self5')} (%)`, pct(r.selfLe5mShare)], [`${t('rd_t_mail8')} (%)`, pct(r.emailLe8hShare)], [`${t('rd_r_mail24')} (%)`, pct(r.emailLe24hShare)], [`${t('rd_r_mail7d')} (%)`, pct(r.emailGt7dShare)], [`${t('rd_r_sys8')} (%)`, pct(r.sysLe8hShare)],
    [t('rd_t_dmed'), h2(r.dammamMedianPerDay)], [t('rd_r_dmax'), h2(r.dammamMaxPerDay)], [t('rd_r_attarget'), r.atTarget], [t('rd_r_spread'), h2(r.spread)], [t('rd_t_open'), r.open], [t('rd_r_points'), r.points]];
  const types = [[t('rd_c_type'), t('rd_c_arrived'), `${t('rd_c_share')} (%)`, t('rd_c_closed'), t('rd_c_median'), `${t('rd_c_le8')} (%)`, t('rd_c_tier'), t('rd_c_pts'), t('rd_c_ditem'), t('rd_c_dpts')],
    ...r.types.map((x) => [x.label, x.arrived, pct(x.share), x.closed, h2(x.median), pct(x.le8hShare), x.tierNo, x.points, x.dammamItem || '', x.dammamItem ? x.dammamPoints : ''])];
  const members = [[t('rd_c_member'), t('rd_c_arrived'), t('rd_c_closed'), t('rd_c_email'), t('rd_c_self'), t('rd_c_others'), t('rd_c_tierpts'), t('rd_c_dday'), `${t('rd_c_sys8')} (%)`, t('rd_t_open'), t('rd_xl_over7'), t('rd_c_auto', { n: r.autoPoints })],
    ...r.members.map((m) => [who(m), m.arrived, m.closed, m.email, m.self, m.others, m.points, h2(m.dammamPerDay), pct(m.sysLe8hShare), m.open, m.openOver7, +m.score.auto.toFixed(1)])];
  for (const [name, rows, widths] of [[t('rd_xl_readings'), readings, [54, 22]], [t('rd_xl_types'), types, [32, 10, 10, 10, 12, 12, 8, 8, 24, 14]], [t('rd_xl_members'), members, [26, 10, 10, 10, 10, 10, 12, 18, 14, 10, 12, 16]]]) { const ws = X.utils.aoa_to_sheet(rows); ws['!cols'] = widths.map((w) => ({ wch: w })); X.utils.book_append_sheet(wb, ws, name.slice(0, 31)); }
  X.writeFile(wb, `afaqy-readings-${r.month}.xlsx`);
}
function route() {
  if (location.hash.startsWith('#rank=')) { takeRankLink(true).then(route); return; }   // a rank link can arrive while the portal is already open (only the hash changes)
  const views = ['home', 'tools', 'me', 'pro', 'data', 'kpi', 'team', 'weights', 'dev', 'guide', 'mailfile', 'overtime', 'planner', 'tenders', 'readings'];
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
  else { document.title = `${t('brand')} — ${t('portal')} — ${t(isTeamPortal ? 'title_team' : 'title_admin')}`; $('page-title').textContent = t({ tools: 'portal', me: 'nav_me', pro: 'nav_pro', data: 'nav_data', kpi: 'kpi_board', team: 'nav_team', weights: 'nav_weights', dev: 'nav_dev', home: 'cr_title', guide: 'nav_guide' , overtime: 'nav_overtime', readings: 'nav_readings', planner: 'nav_planner', mailfile: 'nav_mailfile', tenders: 'nav_tenders' }[v]); currentModule = null; }
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
  if (v === 'data') renderSync();   // ADR-0103 (route() also runs on the first load, so a bookmark to «Data» draws it)
  if (v === 'overtime') renderOvertime();
  if (v === 'readings') renderReadings();
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
/** ADR-0103: everything this device holds — the backup file and the sync file carry the same thing. */
async function tdBackupData(state, refs = null) {
  if (!state) return null;
  // v9.79 (ADR-0149): for the ZIP each file stays a file — named here by its place in the ZIP, handed over in `refs`
  if (refs) return { ...state, items: state.items.map((item) => ({ ...item, files: (item.files || []).filter((f) => f.blob instanceof Blob).map(({ blob, ...file }) => {
    const path = `files/${String(refs.length + 1).padStart(4, '0')}_${zipSafeName(file.name)}`; refs.push({ path, blob }); return { ...file, type: blob.type || '', zip: path }; }) })) };
  const items = await Promise.all(state.items.map(async (item) => {
    const files = await Promise.all((item.files || []).map(({ blob, ...file }) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ ...file, data: reader.result });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    })));
    return { ...item, files };
  }));
  return { ...state, items };
}
function tdRestoreData(state) {
  if (!state || !Array.isArray(state.items)) return null;
  return cleanTenders({ ...state, items: state.items.map((item) => {
    if (!item || !Array.isArray(item.files)) return item;
    const files = item.files.filter((file) => file && typeof file === 'object').flatMap(({ data, ...file }) => {
      if (file.blob instanceof Blob) return [file];   // v9.79: read back from the ZIP as the file it is
      const match = /^data:([^;,]*);base64,([\w+/=]*)$/.exec(data || '');
      if (!match) return [];
      try { return [{ ...file, blob: new Blob([Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0))], { type: match[1] }) }]; }
      catch { return []; }
    });
    return { ...item, files };
  }) });
}
async function buildBackup(refs = null) {   // refs (v9.79): the files go into the ZIP by reference — afaqy-portal/v3
  if (plannerFile === undefined) plannerFile = (await store.getPlanner()) || null;   // ADR-0071: the planner travels with the backup
  const all = { backup: refs ? 'afaqy-portal/v3' : 'afaqy-portal/v2', exportedAt: new Date().toISOString(), version: PORTAL_VERSION, planner: plannerFile || null, tenders: isTeamPortal ? null : await tdBackupData(tenders || await store.kvGet('tenders'), refs), mailrules: mfState.rules || (await store.kvGet('mailrules')) || null, mailact: mailAct, mailids: mailIds,
    datasets, reports, cards: monthCards, oneonone: meet, repairs, privlinks: privLinks, mailrows: mailRows, weights: weightsDevice || null, roster: rosterDevice || null, me: (viewAs ? (meDerived ? null : realMe) : (meDerived ? null : me)) || null, names: nameFixes(), pending: pendingList(), projects: myProjects, register: myRegister, projectwork:isTeamPortal?null:projectWork, projfiles: await projFilesExport(refs), devplans: devPlans };
  return all;
}
// v9.55: the backup is the only other copy of what the manager typed and attached — the device remembers when it was last saved
$('export-btn').addEventListener('click', async () => {   // v9.79 (ADR-0149): a ZIP — backup.json and every attachment as a file
  const btn = $('export-btn'); if (btn.disabled) return; btn.disabled = true; toast(t('bk_building'));
  try { const { blob } = await backupZip(); saveBlob(`afaqy-portal-backup-${ymd(new Date())}.zip`, blob); pref('bkat', new Date().toISOString()); backupNote(); if (location.hash === '#tenders') renderTenders(); }
  catch (error) { console.error(error); toast(t('bk_failed', { why: bkWhy(error) })); } finally { btn.disabled = false; } });
const backupState = () => backupDue(pref('bkat') || '', new Date().toISOString(), { items: ((tenders && tenders.items.length) || 0) + ((myRegister && myRegister.items && myRegister.items.length) || 0) });
let bkMb = 0;
function backupNote() {
  const n = $('bk-last'); if (!n) return; const at = pref('bkat'), st = backupState();
  n.textContent = (at ? t('bk_last', { d: saudiDay(at), n: st.days == null ? 0 : st.days }) : t('bk_never_short')) + (bkMb ? ` · ${t('bk_usage', { mb: bkMb.toLocaleString('en') })}` : ''); n.className = `hint${st.due ? ' bk-due' : ''}`;
  // v9.79: how much the portal keeps on this device — near the size a backup or a sync file will be; drawn again when it changes
  if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then((e) => { const mb = Math.round(((e && e.usage) || 0) / 1048576); if (mb >= 1 && mb !== bkMb) { bkMb = mb; backupNote(); } }).catch(() => {});
}

/** Restore or sync: merge, never overwrite. Settings (weights, team file, profile, rules, planner) stay as this device has them. */
async function applyBackup(j) {
  if (!['afaqy-portal/v1', 'afaqy-portal/v2', 'afaqy-portal/v3'].includes(j.backup) || !Array.isArray(j.datasets)) throw new Error('format');
    for (const d of j.datasets) datasets = mergeDataset(datasets, d);
    await store.put(datasets);
    if (j.backup === 'afaqy-portal/v2' || j.backup === 'afaqy-portal/v3') {
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
      if (!isTeamPortal && j.projectwork) await pwCommit(mergeProjectWork(projectWork,j.projectwork));
      if (j.register) { const r = cleanRegister(j.register); if (r) { if (!myRegister) myRegister = r; else { const have = new Set(myRegister.items.map((x) => x.id)); for (const x of r.items) if (!have.has(x.id)) myRegister.items.push(x); } await store.putRegister(myRegister); } }   // ADR-0103: merged
      // ADR-0077: the mail rules come back with the backup when this device has none of its own
      { const mr = cleanMailRules(j.mailrules); if (mr && !(await store.kvGet('mailrules'))) { mfState.rules = mr; await store.kvPut('mailrules', mr); } }
      if (j.mailact && Array.isArray(j.mailact.recs)) { mailAct = syncMailAct(mailAct, j.mailact); await store.kvPut('mailact', mailAct); }   // ADR-0095 · ADR-0103: merged by message key
      if (j.mailids && j.mailids.map) { mailIds = { map: { ...j.mailids.map, ...mailIds.map }, ignored: [...new Set([...(mailIds.ignored || []), ...(j.mailids.ignored || [])])] }; await store.kvPut('mailids', mailIds); }   // ADR-0103: this device's choice wins a clash
      if (plannerFile === undefined) plannerFile = (await store.getPlanner()) || null;
      if (j.planner && typeof j.planner.html === 'string' && !plannerFile && isHtml(j.planner.html)) { plannerFile = { name: String(j.planner.name || 'planner.html'), at: String(j.planner.at || new Date().toISOString()), html: j.planner.html }; await store.putPlanner(plannerFile); }
      { const td = isTeamPortal ? null : tdRestoreData(j.tenders); if (td) await tdCommit({ ...syncTenders(tenders, td), revision: tenders?.revision || '' }); }   // ADR-0081 · ADR-0103: merged tender by tender
      if (j.projects) { const p = cleanProjects(j.projects); if (p) { myProjects = syncProjects(myProjects, p); await store.putProjects(myProjects); } }   // ADR-0103: merged
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
  if (location.hash === '#tenders') renderTenders();
}
$('import-in').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const j = await readBackupFile(f); await applyBackup(j);
    toast(t(j.backup === 'afaqy-portal/v2' || j.backup === 'afaqy-portal/v3' ? 'backup_restored_all' : 'loaded', { n: datasets.reduce((s, d) => s + d.tasks.length, 0), range: '' }));
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
$('by-line').addEventListener('click', openAbout);   // ADR-0090
$('news-close').addEventListener('click', () => $('news-dialog').close());
$('update-btn').addEventListener('click', () => location.reload());

(async () => {
  $('version').textContent = `v${PORTAL_VERSION}`;
  document.querySelectorAll('.page-by').forEach((p) => p.remove()); pageBy();
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
  myProjects = await store.getProjects(); tenders = isTeamPortal ? null : cleanTenders(await store.kvGet('tenders')); etRadar = isTeamPortal ? null : await store.kvGet('radar');
  if (tenders && tenders.items.some((x) => (x.etimadWas || []).length)) {   // v9.62 (ADR-0135): what 9.60–9.61 replaced with Etimad's value goes back to the mail's or the study's
    const items = tenders.items.map((x) => { const u = tenderUndoEtimad(x); return u ? { ...x, ...u.patch, activity: u.fields.length ? [tdActivity('etimad', t('et_undo_act', { list: u.fields.map((f) => t(`td_col_${f}`)).join(' · ') })), ...(x.activity || [])] : x.activity } : x; });
    try { await tdCommit({ ...tenders, items }); } catch { /* tried again on the next load */ } }
  if (tenders) {   // v9.85 (ADR-0152): a hand-over mail registered before as a tender of its own goes into its tender
    const r = tenderHandoverRelink(tenders.items, tdIsAI), was = new Map(tenders.items.map((x) => [x.id, x.subject]));
    // the history keeps the moved card's subject, not a sentence: the sentence is written in the language shown at the time it is read
    const acts = (id) => r.moved.filter((m) => m.to === id).map((m) => tdActivity('relinked', String(was.get(m.from) || '').slice(0, 300)));
    if (r.moved.length) try { await tdCommit({ ...tenders, items: r.items.map((x) => (acts(x.id).length ? { ...x, activity: [...acts(x.id), ...(x.activity || [])] } : x)) }); } catch { /* tried again on the next load */ } }
  if (tenders && tenders.items.some((x) => !x.etimadNo && tenderRefOf(x))) {   // v9.87 (ADR-0154): the reference a tender's own mails and files name is written on it
    try { await tdCommit({ ...tenders, items: tenders.items.map((x) => (!x.etimadNo && tenderRefOf(x) ? { ...x, etimadNo: tenderRefOf(x) } : x)) }); } catch { /* tried again on the next load */ } }
  mailAct = (await store.kvGet('mailact')) || { imports: [], recs: [] }; mailIds = (await store.kvGet('mailids')) || { map: {}, ignored: [] };   // ADR-0095
  myRegister = await store.getRegister();
  projectWork=isTeamPortal?cleanProjectWork(null):cleanProjectWork(await store.kvGet('projectwork'));
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
  if (!isTeamPortal) void mdLoad();   // v9.75 (ADR-0145): the tender mail folder, read while the page is open
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
  loadRelease(); announceUpdate(); showInstall();
  setInterval(loadRelease, 15 * 60 * 1000);
  setInterval(() => { try { tdNotify(); } catch (e) { console.error(e); } }, 30 * 60 * 1000);   // v9.73: a date that comes due while the portal stays open
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
// v9.55 (the audit): two things every page gets without each page asking. (1) A box that scrolls — a wide table on a phone, the
// tender pipeline — can be reached and scrolled from the keyboard; without this a keyboard user cannot see the columns off screen.
// (2) An input whose only name is the grey hint inside it reads that hint to a screen reader; a hint alone is not a name.
(() => {
  const SCROLLERS = '.table-wrap, .td-pipe, .crm-list';
  const named = (n) => n.hasAttribute('aria-labelledby') || n.title || (n.id && document.querySelector(`label[for="${window.CSS && CSS.escape ? CSS.escape(n.id) : n.id}"]`)) || n.closest('label');
  const scan = () => {
    document.querySelectorAll(SCROLLERS).forEach((n) => {
      const over = n.scrollWidth > n.clientWidth + 2 || n.scrollHeight > n.clientHeight + 2;
      if (over && !n.hasAttribute('tabindex')) { n.tabIndex = 0; n.dataset.scrollKb = '1'; if (!n.hasAttribute('role')) { n.setAttribute('role', 'region'); if (!n.hasAttribute('aria-label')) n.setAttribute('aria-label', t('scroll_region')); } }
      else if (!over && n.dataset.scrollKb) { n.removeAttribute('tabindex'); delete n.dataset.scrollKb; if (n.getAttribute('aria-label') === t('scroll_region')) { n.removeAttribute('aria-label'); n.removeAttribute('role'); } }
    });
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((n) => {
      if (n.dataset.phName) { if (n.getAttribute('aria-label') !== n.placeholder) n.setAttribute('aria-label', n.placeholder); return; }
      if (n.type === 'hidden' || n.hasAttribute('aria-label') || named(n) || !n.placeholder.trim()) return;
      n.dataset.phName = '1'; n.setAttribute('aria-label', n.placeholder);
    });
  };
  const raf = window.requestAnimationFrame ? (f) => requestAnimationFrame(f) : (f) => setTimeout(f, 16);
  let due = 0; const later = () => { if (due) return; due = raf(() => { due = 0; scan(); }); };
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['placeholder', 'open'] });
  addEventListener('resize', later); scan();
})();
// sections come into view once as you scroll; the light that follows the pointer on the tiles
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches; if (still || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('bt-seen'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .08 });
  const SEL = '.table-wrap, details.km-more, .cr-alerts > *, .me-card, .proj-card, section.share, .km-detail';
  const scan = () => document.querySelectorAll(SEL).forEach((n) => { if (n.dataset.btRv) return; n.dataset.btRv = '1'; if (n.closest('dialog')) return;   // inside a window everything is shown at once (v9.48)
    const r = n.getBoundingClientRect(); if (r.top < innerHeight * .94) return;   // what is already on screen is simply there
    n.classList.add('bt-rv'); io.observe(n); });
  new MutationObserver(() => requestAnimationFrame(scan)).observe(document.body, { childList: true, subtree: true }); scan();
  document.addEventListener('pointermove', (e) => { const t = e.target.closest && e.target.closest('.km-tile, .cr-num, .cr-item, .td-pipe-node, .cr-job');
    document.querySelectorAll('.bt-lit').forEach((n) => { if (n !== t) { n.classList.remove('bt-lit'); n.style.setProperty('--o', 0); } });
    if (!t) return; const r = t.getBoundingClientRect(); t.classList.add('bt-lit'); t.style.setProperty('--mx', `${e.clientX - r.left}px`); t.style.setProperty('--my', `${e.clientY - r.top}px`); t.style.setProperty('--o', 1); });
})();

// ---------- ADR-0086: a light sweeps across the top on every page change ----------
(() => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; const s = document.createElement('div'); s.id = 'bt-sweep'; s.setAttribute('aria-hidden', 'true'); document.body.append(s);
  addEventListener('hashchange', () => { s.classList.remove('go'); void s.offsetWidth; s.classList.add('go'); }); })();

// ---------- ADR-0091 / ADR-0098: everything you can press lights — under the mouse AND under a finger, always ----------
// A design rule of the portal (the technical manager: «never forget it again»): no device and no setting switches it off.
// Mouse and pen: a soft light follows the pointer. Touch, click, pen tap: a glow blooms from the spot pressed.
// Reduced motion keeps the light and drops only the movement (no bloom animation, a steady glow).
const GLOW_SEL = 'button, a[href], summary, select, input:not([type=hidden]), textarea, label, [role="button"], [onclick], .btn, .pill-btn, .nav a, .nav-group-toggle, .tool, .sm-card, .sm-tile, .proj-card, .pg-card, .me-card, .dev-card, .card, .km-tile, .td-row, .km-row, .ma-row, .cr-item, .cr-job, .cr-num-go, .td-pipe-node, .tip-card, .chip, .linkish, .ver-tag, .by-line, tr.on, .tp-svg';
(() => {
  let cur = null;
  const at = (el, e) => { const r = el.getBoundingClientRect(); el.style.setProperty('--hx', `${e.clientX - r.left}px`); el.style.setProperty('--hy', `${e.clientY - r.top}px`); };
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;   // a finger does not hover; it gets the tap glow below
    const el = e.target.closest && e.target.closest(GLOW_SEL);
    if (cur && cur !== el) { cur.classList.remove('bt-hot'); cur = null; }
    if (!el) return; at(el, e); if (cur !== el) { el.classList.add('bt-hot'); cur = el; } }, { passive: true });
  document.addEventListener('pointerleave', () => { if (cur) { cur.classList.remove('bt-hot'); cur = null; } });
  document.addEventListener('pointerdown', (e) => {   // every press — finger, mouse or pen
    const el = e.target.closest && e.target.closest(GLOW_SEL); if (!el) return;
    at(el, e); el.classList.remove('bt-tap'); void el.offsetWidth; el.classList.add('bt-tap');
    clearTimeout(el._tapT); el._tapT = setTimeout(() => el.classList.remove('bt-tap'), 700); }, { passive: true });
  document.addEventListener('focusin', (e) => { const el = e.target.closest && e.target.closest(GLOW_SEL); if (el && el.matches(':focus-visible')) el.classList.add('bt-focus'); });
  document.addEventListener('focusout', (e) => { const el = e.target.closest && e.target.closest(GLOW_SEL); if (el) el.classList.remove('bt-focus'); });
})();
