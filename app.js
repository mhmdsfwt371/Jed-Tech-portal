// app.js — everything on the page. Data stays in this browser (IndexedDB); nothing is sent anywhere.
import { PRIMARY, SYSTEMS, MORE, PORTAL_VERSION, MODULE_ALLOW } from './config.js';
import {
  t as tr, L, LANGS, dirOf, periodBlocks, buildPrompt, parseDataset, mergeDataset, completeness, factor1,
  formatHours, formatRate, sampleDataset, GROUP, GUIDE, DEFINITIONS, peopleOf, defaultTeam, nameOf,
  buildBookmarklet, parseMe, myProfile,
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
  let mem = []; let memMe = null;
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
    async getMe() { try { return (await run('readonly', (s) => s.get('me'))) || null; } catch { return memMe; } },
    async putMe(v) { try { await run('readwrite', (s) => (v ? s.put(v, 'me') : s.delete('me'))); } catch { memMe = v; } },
  };
})();
let datasets = [];

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
  const cur = qs[0] && qs[0].row;
  const openNow = me.tasks.filter((x) => x.state === 'open').length;
  const fmtDate = (iso) => (iso ? `\u2066${iso.slice(0, 10)}\u2069` : '');
  set(body,
    el('p', { class: 'me-who', text: t('me_who', { name: me.user.name || me.user.id, date: fmtDate(me.extractedAt) }) }),
    el('div', { class: 'strip' },
      el('div', {}, el('b', { text: String(cur ? cur.assigned : 0) }), el('span', { text: `${t('col_assigned')} — ${qs[0] ? qs[0].label : ''}` })),
      el('div', {}, el('b', { text: String(cur ? cur.done : 0) }), el('span', { text: t('col_done') })),
      el('div', {}, el('b', { text: cur ? formatRate(cur.rate) : '—' }), el('span', { text: t('col_rate') })),
      el('div', {}, el('b', { text: String(openNow) }), el('span', { text: t('col_open') }))),
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
  )));
}
async function copyPrompt(b) {
  const text = buildPrompt({ from: b.from, to: b.to });
  try { await navigator.clipboard.writeText(text); toast(t('copied')); }
  catch {
    // clipboard blocked: show the text so it can be copied by hand
    $('paste').value = text; $('paste').select(); toast(t('copied'));
  }
}

// ---------- data: upload ----------
async function ingest(text) {
  const out = parseDataset(text);
  const msg = $('read-msg');
  if (out.error) { msg.className = 'msg err'; msg.textContent = t(out.error, out.vars); return false; }
  datasets = mergeDataset(datasets, out.dataset);
  await store.put(datasets);
  msg.className = 'msg';
  msg.textContent = t('loaded', { n: out.dataset.tasks.length, range: `${out.dataset.range.from} → ${out.dataset.range.to}` }) + (out.skipped ? ` ${t('warn_rows', { n: out.skipped })}` : '');
  renderDatasets(); renderBlocks();
  return true;
}
function renderDatasets() {
  if (!datasets.length) { set($('datasets'), el('div', { class: 'empty', text: t('none_yet') })); return; }
  set($('datasets'), datasets.map((d) => {
    const c = completeness(d);
    return el('div', { class: 'ds' },
      el('span', { class: 'k ltr', text: `${d.range.from} → ${d.range.to}` }),
      el('span', { class: 'meta' }, t('tasks_n', { n: d.tasks.length }), d.parts && d.parts.length ? ` (${d.parts.join(', ')})` : ''),
      d.sample ? el('span', { class: 'pill', text: t('sample_note') }) : null,
      c.known ? el('span', { class: `pill ${c.complete ? 'ok' : 'warn'}`, text: c.complete ? t('complete') : t('incomplete', { got: c.got, want: c.want }) }) : null,
      el('button', { type: 'button', class: 'btn quiet', text: t('remove'), onclick: async () => { datasets = datasets.filter((x) => x.key !== d.key); await store.put(datasets); renderDatasets(); renderBlocks(); } }),
    );
  }));
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
  const cols = ['col_person', 'col_assigned', 'col_done', 'col_rate', 'col_avg', 'col_median', 'col_open', 'col_cancelled', 'col_email', 'col_self', 'col_created'];
  const line = (r, cls) => el('tr', { class: cls },
    el('td', { text: cls === 'total' ? t('team') : name(r) }),
    el('td', { class: 'num', text: r.assigned }), el('td', { class: 'num', text: r.done }),
    el('td', { class: 'num' }, rateCell(r.rate)),
    el('td', { class: 'num', text: formatHours(r.avgHours, lang) }), el('td', { class: 'num', text: formatHours(r.medianHours, lang) }),
    el('td', { class: 'num', text: r.open }), el('td', { class: 'num', text: r.cancelled }),
    el('td', { class: 'num', text: r.fromEmail }), el('td', { class: 'num', text: r.selfLogged }), el('td', { class: 'num', text: r.created }));
  const table = el('div', { class: 'table-wrap' }, el('table', {},
    el('thead', {}, el('tr', {}, cols.map((k, i) => el('th', { class: i ? 'num' : null, text: t(k) })))),
    el('tbody', {}, f.people.map((r) => line(r)), f.group ? line({ ...f.group, id: GROUP }, 'group') : null, line(f.team, 'total'))));

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
    el('div', { class: 'strip' },
      el('div', {}, el('b', { text: f.team.assigned }), el('span', { text: t('col_assigned') })),
      el('div', {}, el('b', { text: f.team.done }), el('span', { text: t('col_done') })),
      el('div', {}, el('b', { text: formatRate(f.team.rate) }), el('span', { text: t('col_rate') })),
      el('div', {}, el('b', { text: formatHours(f.team.medianHours, lang) }), el('span', { text: t('col_median') }))),
    table,
    datasets.length > 1 ? [el('h2', { text: t('trend') }), trendTable] : null,
    el('h2', { text: t('definitions') }),
    el('ul', { class: 'defs' }, DEFINITIONS.map((k) => el('li', { text: t(k) }))));
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
  renderSide(); renderTools(); renderBlocks(); renderDatasets(); renderKpi(); renderGuide(); renderMe(); renderPro();
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
  const views = ['tools', 'me', 'pro', 'data', 'kpi', 'guide'];
  let hash = location.hash.slice(1);
  if (hash.startsWith('me-')) {
    if (hash === 'me-wait') { hash = 'me'; setTimeout(() => renderMe(true)); }
    else { const payload = hash.slice(3); hash = 'me'; receiveMe(payload); }
  }
  const mod = hash.startsWith('m-') ? hash.slice(2) : null;
  const v = mod ? 'module' : views.includes(hash) ? hash : 'tools';
  for (const id of [...views, 'module']) $(`view-${id}`).hidden = id !== v;
  document.body.classList.toggle('in-module', v === 'module');
  if (mod) openModule(mod);
  else { document.title = `${t('brand')} — ${t('portal')}`; $('page-title').textContent = t({ tools: 'portal', me: 'nav_me', pro: 'nav_pro', data: 'nav_data', kpi: 'kpi_board', guide: 'nav_guide' }[v]); currentModule = null; }
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
}

// ---------- wiring ----------
$('menu-btn').addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
$('scrim').addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
$('lang-select').addEventListener('change', (e) => { if (LANGS.includes(e.target.value)) { lang = e.target.value; pref('lang', lang); applyLang(); } });
$('theme-btn').addEventListener('click', () => {
  pref('theme', isDark() ? 'light' : 'dark'); applyTheme();
});
['block-size', 'block-count'].forEach((id) => $(id).addEventListener('input', renderBlocks));
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
  me = await store.getMe();
  applyLang();   // renders everything and routes
  loadRelease();
})();
