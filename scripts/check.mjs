// scripts/check.mjs — the guard. Runs before every push (.githooks/pre-push) and on GitHub (.github/workflows/verify.yml).
// Each rule below exists because breaking it would break something the team relies on.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const problems = [];
const note = (m) => problems.push(m);
const read = (f) => readFileSync(new URL(f, root), 'utf8');
const exists = (f) => existsSync(new URL(f, root));

// 1. Syntax of every script that ships.
for (const f of ['core.js', 'app.js', 'config.js', 'sw.js', 'scripts/bump.mjs', 'scripts/check-commit-title.mjs', 'scripts/check-links.mjs']) {
  try { execFileSync(process.execPath, ['--check', new URL(f, root).pathname], { stdio: 'pipe' }); }
  catch (e) { note(`${f}: syntax error\n${e.stderr}`); }
}

// 2. The files every repository of ours carries.
for (const f of ['README.md', 'CHANGELOG.md', 'AGENTS.md', 'CLAUDE.md', 'SECURITY.md', 'version.json', 'team.json', 'weights.json', 'sw.js', 'manifest.webmanifest',
  '.nojekyll', 'docs/START-HERE.md', 'docs/data-format.md', 'docs/kpi-factors.md', 'docs/decisions/0000-template.md', 'release/next.json',
  'scripts/build-manual.mjs', 'docs/manual/README.md', 'docs/crm-api.md', 'scripts/check-links.mjs']) {
  if (!exists(f)) note(`missing ${f}`);
}

const html = read('index.html'), app = read('app.js'), core = read('core.js'), cfg = read('config.js'), sw = read('sw.js');

// 3. One version, stamped everywhere. scripts/bump.mjs writes them together; a hand edit shows up here.
const version = JSON.parse(read('version.json')).version;
const stamps = {
  'config.js': (cfg.match(/PORTAL_VERSION = '([\d.]+)'/) || [])[1],
  'sw.js': (sw.match(/const VERSION = '([\d.]+)'/) || [])[1],
  'CHANGELOG.md (top release)': (read('CHANGELOG.md').match(/^## v([\d.]+) — /m) || [])[1],
};
if (!/^\d+\.\d+$/.test(version || '')) note(`version.json: "${version}" is not in the vX.Y form`);
for (const [where, v] of Object.entries(stamps)) if (v !== version) note(`version mismatch: version.json says ${version}, ${where} says ${v ?? 'nothing'} — run scripts/bump.mjs`);
const vj = JSON.parse(read('version.json'));
if (!vj.notes || !['ar', 'en', 'ur'].every((l) => Array.isArray(vj.notes[l]) && vj.notes[l].length && vj.notes[l].length === vj.notes.ar.length)) {
  note('version.json: every version carries release notes, the same number in Arabic, English and Urdu');
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(vj.date || '')) note('version.json: date must be YYYY-MM-DD');

// 4. No Firebase, and no network except this site's own version.json. CRM data only ever arrives as an uploaded file.
// The Claude prompt and the my-KPIs bookmark both run on myafaqy's page, not in the portal; they have their own rules (9, 17).
// The Afaqy PRO page is the one exception in the portal itself (ADR-0011) — it has its own rule (18); everything else holds.
const appWithoutPro = app.replace(/\/\/ ---------- AFAQY PRO inside the portal[\s\S]*?\/\/ ---------- the side menu ----------/, '');
const coreWithoutPrompt = core.replace(/export function buildPrompt[\s\S]*?\n}\n/, '').replace(/export function buildBookmarklet[\s\S]*?\n}\n/, '').replace(/export function buildReportsPrompt[\s\S]*?\n}\n/, '').replace(/export function buildManagerBookmarklet[\s\S]*?\n}\n/, '').replace(/export function buildAssignBookmarklet[\s\S]*?\n}\n/, '');
for (const [name, src] of [['index.html', html], ['app.js', appWithoutPro], ['core.js', coreWithoutPrompt], ['config.js', cfg]]) {
  if (/firebase/i.test(src)) note(`${name}: Firebase is referenced — the portal runs without it`);
  if (/afaqy\.sa|afaqy\.pro\/|crmbackend/.test(src.replace(/https:\/\/afaqy\.pro\/'/g, ''))) note(`${name}: an Afaqy API address appeared — the portal never calls an Afaqy API`);
  const calls = [...src.matchAll(/fetch\(\s*([^,)]+)/g)].map((m) => m[1].trim());
  for (const c of calls) if (!["'./version.json'", "'./team.json'", "'./weights.json'"].includes(c)) note(`${name}: network call to ${c} — the only allowed reads are the site's own version.json, team.json and weights.json`);
}

// 5. The service worker stays inside this folder, so the other tools on the same domain are never taken over.
if (!/register\('\.\/sw\.js', \{ scope: '\.\/' \}\)/.test(app)) note("app.js: the service worker must be registered as register('./sw.js', { scope: './' })");
if (!/startsWith\('afaqy-portal-'\)/.test(sw)) note('sw.js: old caches must be cleared by the afaqy-portal- prefix only');
for (const [, f] of sw.matchAll(/'\.\/((?:assets\/)[^']+)'/g)) if (!exists(f)) note(`sw.js caches ${f}, which does not exist`);
const manifest = JSON.parse(read('manifest.webmanifest'));
if (manifest.scope !== './' || manifest.start_url !== './') note('manifest.webmanifest: scope and start_url must be "./"');
for (const i of manifest.icons || []) if (!exists(i.src)) note(`manifest icon missing: ${i.src}`);

// 5b. Offline: every local asset the page references is in the service worker's precache list.
{
  const pre = new Set([...sw.matchAll(/'(\.\/[^']+)'/g)].map((m) => m[1].replace(/^\.\//, '')));
  const refs = [...html.matchAll(/(?:src|href)="((?!https?:)(?!#)(?!javascript:)[^"]+\.(?:png|svg|ico|woff2?|webmanifest|css|js))"/g)].map((m) => m[1].replace(/^\.\//, ''));
  for (const r of new Set(refs)) if (!pre.has(r)) note(`sw.js: ${r} is used by the page but not precached — it would be missing offline`);
}

// 6. Wiring: every id the script asks for exists; every string key exists in all three languages.
// …or that the script itself creates (el('…', { id: 'x' }))
const madeByScript = new Set([...app.matchAll(/\bid: '([\w-]+)'/g)].map((m) => m[1]));
for (const [, id] of app.matchAll(/\$\('([\w-]+)'\)/g)) if (!html.includes(`id="${id}"`) && !madeByScript.has(id)) note(`app.js asks for #${id}, missing in index.html and never created`);
const { STRINGS, LANGS } = await import(new URL('core.js', root));
for (const [, k] of [...html.matchAll(/data-tp?="(\w+)"/g), ...app.matchAll(/\bt\('(\w+)'/g)]) if (!(k in STRINGS.ar)) note(`string "${k}" is not defined`);
for (const lang of LANGS) for (const k of Object.keys(STRINGS.ar)) if (!(k in STRINGS[lang])) note(`${lang}: missing string ${k}`);
// a key written twice in one language block silently overrides the first — refuse it
for (const lang of LANGS) {
  const block = core.slice(core.indexOf(`  ${lang}: {`), core.indexOf('\n  },', core.indexOf(`  ${lang}: {`)));
  const seen = new Map();
  for (const [, k] of block.matchAll(/^\s{4}(\w+): '/gm)) seen.set(k, (seen.get(k) || 0) + 1);
  for (const [k, n] of seen) if (n > 1) note(`${lang}: string "${k}" is defined ${n} times — the last silently wins`);
}
for (const [, f] of html.matchAll(/(?:src|href)="(assets\/[^"]+|manifest\.webmanifest)"/g)) if (!exists(f)) note(`missing ${f}`);

// 7. The guide covers every page. A feature that is not in the guide does not exist for the team.
const views = [...html.matchAll(/<section id="view-(\w+)"/g)].map((m) => m[1]).filter((v) => v !== 'guide');
const guideKeys = (core.match(/export const GUIDE = (\[[\s\S]*?\]);/) || [])[1] || '';
// the module view is where a tool opens from the Tools page; the Tools section explains it
const covers = { tools: 'g_tools_h', module: 'g_tools_h', me: 'g_me_h', pro: 'g_pro_h', data: 'g_data_h', kpi: 'g_kpi_h', team: 'g_team_h', weights: 'g_weights_h' };  // g_mgr_* lives on the data page
for (const v of views) if (!covers[v] || !guideKeys.includes(covers[v])) note(`the guide has no section for the "${v}" page — add one before releasing it`);

// 8. The three core tools stay first and point somewhere real.
const { PRIMARY } = await import(new URL('config.js', root));
const ids = PRIMARY.map((x) => x.id).sort().join(',');
if (ids !== 'apihelper,canval,sensor') note(`config.js: the core tools must be the sensor tool, the API helper and canval (found ${ids})`);
for (const x of PRIMARY) if (!/^https:\/\//.test(x.url)) note(`config.js: ${x.id} has no https link`);

// 9. The Claude in Chrome prompt keeps its safety rules.
const { buildPrompt } = await import(new URL('core.js', root));
const p = buildPrompt({ from: '2026-01-01', to: '2026-03-31' });
for (const rule of ['READ-ONLY', 'NEVER GUESS AN API PATH', 'Never put tokens']) if (!p.includes(rule)) note(`prompt lost its rule: ${rule}`);
// …and the pitfalls the capture of 28 Oct 2026 proved, so a later edit cannot quietly reintroduce them
for (const pit of ['"dateOfCompletion" (always null)', '"isAutomaticTask"', 'Do NOT open tasks one by one', 'carry no time zone and are UTC',
                   'ABSOLUTE RULE — NOTHING MAY CHANGE IN MYAFAQY', 'Security/GetAllHierarchyUsersDropDown · Teams/GetAllTeams · Teams/GetTeamById · Task/GetMyTasksGrid', 'STOP and ask me']) if (!p.includes(pit)) note(`prompt lost a verified pitfall: ${pit}`);

// 10. Nothing secret in a public repository.
for (const f of ['index.html', 'app.js', 'core.js', 'config.js', 'sw.js', 'README.md', 'AGENTS.md']) {
  if (!exists(f)) continue;   // already reported as missing above
  const s = read(f);
  if (/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./.test(s)) note(`${f}: a token (JWT) is committed`);
  if (/sk-ant-[A-Za-z0-9-]{10,}|ghp_[A-Za-z0-9]{20,}|github_pat_/.test(s)) note(`${f}: an API key is committed`);
  if (/password\s*[:=]\s*['"][^'"]{3,}['"]/i.test(s)) note(`${f}: a literal password is committed`);
}

// 11. Every language says everything. A sentence (20+ characters in Arabic) that is far shorter in English or Urdu has
//     lost meaning — the v5.0 Urdu had a third of its strings cut down like that. Single words are exempt.
for (const lang of ['en', 'ur']) {
  for (const [k, ar] of Object.entries(STRINGS.ar)) {
    const other = STRINGS[lang][k];
    if (typeof other === 'string' && ar.length >= 20 && other.length < ar.length * 0.6) note(`${lang}: "${k}" says much less than the Arabic (${other.length} vs ${ar.length} characters) — translate the meaning in full`);
  }
}
const tools = await import(new URL('config.js', root));
for (const x of [...tools.PRIMARY, ...tools.SYSTEMS, ...tools.MORE]) {
  for (const field of ['name', 'desc']) {
    const v = x[field]; if (!v) continue;
    for (const lang of LANGS) if (!v[lang]) note(`config.js: ${x.id}.${field} has no ${lang}`);
    if (v.ar && v.ar.length >= 20) for (const lang of ['en', 'ur']) if (v[lang] && v[lang].length < v.ar.length * 0.6) note(`config.js: ${x.id}.${field} in ${lang} says much less than the Arabic`);
  }
}

// 12. The manual of this version exists and says exactly what the Guide tab says.
const { manualText, manualPath } = await import(new URL('scripts/build-manual.mjs', root));
const manual = await manualText();
if (!exists(manualPath(version))) note(`missing ${manualPath(version)} — run scripts/bump.mjs (or node scripts/build-manual.mjs after editing the Guide)`);
else if (read(manualPath(version)) !== manual.text) note(`${manualPath(version)} no longer matches the Guide strings — run node scripts/build-manual.mjs`);
if (exists('docs/manual/README.md') && !read('docs/manual/README.md').includes(`user-manual-v${version}.md`)) note('docs/manual/README.md does not list this version');

// 13. The repository is public. The CRM capture carries real employee and customer names, so it stays outside;
//     the docs keep endpoints, fields and pitfalls only.
// Names seen in the CRM capture of 28 Oct 2026 must appear nowhere in this public repository. The guard carries only
// fingerprints of them (the first 16 hex of SHA-256 of each lowercased word), never the names — the list itself is public.
const CAPTURED = new Set(["8dde8eb09b4f8ade","8f7dfb13f1d1e5d1","4322323b706af66d","8ad9672dfc2ee48a","6ea5f03f8197a4c6","8a4bd12b0ef7909a","87d57964ebda55a8","46de21c135a6c283","8afec982b4ea3c9d","a91e1695e9ab35c8","b189867634e3b00b","639e0252e8f41839","0be1e8491d132360","81bdbb4f05b08f4a","93ab256d195b2c84"]);
const fingerprint = (w) => createHash('sha256').update(w).digest('hex').slice(0, 16);
// the Jeddah team itself (29 Oct 2026) — fingerprints only, as above
for (const f of ["0be1e8491d132360", "0eee3231330958bc", "10f75987b734bd50", "15192f4a24c77aa8", "1d3a99e2f4f2bba3", "25ae3bf574575f62", "27715c6a5a183018", "2923b4f60d35fbce", "322e49b795fda0df", "3551ac5dc0815434", "39c27c48136dbf68", "402a947784d58cb8", "45185f3bc39e55da", "469a9455918ed408", "4c74d2323d34b34e", "4d3dd758e3262a8d", "5db688aff74ef50b", "5ed1fd4daa460667", "60409199a6cca757", "639e0252e8f41839", "694c271dc2318c00", "6df95ad0a252c668", "6ea5f03f8197a4c6", "6f64a360bca18d0a", "705301a7ca4c57fd", "7b0f0922a3700a15", "7d256b20141fb0fc", "8ad9672dfc2ee48a", "8afec982b4ea3c9d", "8c4e0bb679d74ee4", "8f7dfb13f1d1e5d1", "9108f01cc21bbb71", "9314a107617edf4c", "93ab256d195b2c84", "973d74ebb73735b9", "9bd9270a3dc6b3bf", "a7c73022b1cd9ace", "b42c3b92efe01065", "c3fb34ee2a7d9cd7", "d0892c3743fbdeef", "d7c12ba5fca0106f", "de13dbdcec62c9ec", "e01b5c571b8dce68", "e10f81efc499efd6", "ea3b62f4435c1e77", "f01e98bd4e393b0f", "f6274038b0611ac7", "fb41e979ac815b4e"]) CAPTURED.add(f);
const walkMd = (dir) => { const out = []; for (const e of readdirSync(new URL(dir, root), { withFileTypes: true })) { const p = `${dir}${e.name}`; if (e.isDirectory()) out.push(...walkMd(`${p}/`)); else if (/\.(md|json)$/.test(e.name)) out.push(p); } return out; };
for (const f of ['index.html', 'app.js', 'core.js', 'config.js', 'tests/core.test.mjs', 'README.md', 'AGENTS.md', 'CHANGELOG.md', 'CLAUDE.md', 'SECURITY.md',
  'version.json', 'team.json', 'release/next.json', ...walkMd('docs/')]) {
  if (!exists(f)) continue;
  const words = read(f).toLowerCase().match(/[a-z]{4,}|[\u0600-\u06ff]{3,}/g) || [];
  if (words.some((w) => CAPTURED.has(fingerprint(w)))) note(`${f}: contains a name from the CRM capture — the repository is public`);
}
for (const f of ['docs/crm-api.md', 'docs/data-format.md', 'docs/kpi-factors.md', 'README.md', 'AGENTS.md']) {
  if (!exists(f)) continue;
  const s = read(f);
  if (/"assignee"\s*:\s*"[A-Za-z][^"]+"|"(?:nameEn|customerTag|customerNameEn)"\s*:\s*"[A-Z][a-z]+ [A-Z]/.test(s)) note(`${f}: looks like a real name from the CRM — the repository is public`);
  if (/myafaqy-kpi-api-documentation/.test(s) && /\(myafaqy-kpi-api-documentation/.test(s)) note(`${f}: links the raw capture — keep it outside the repository`);
}

// 14. Modules. A tool opened inside the portal must live on the portal's own address (a frame from anywhere else
//     would be refused or would not share sign-in and storage), must carry what it needs, and the company systems
//     — which forbid being framed — must never be marked as modules.
{
  const cfg = await import(new URL('config.js', root));
  for (const x of [...cfg.PRIMARY, ...cfg.MORE].filter((m) => m.module)) {
    if (!String(x.url).startsWith(cfg.MODULE_ORIGIN + '/')) note(`config.js: module ${x.id} is not on ${cfg.MODULE_ORIGIN} — it cannot open inside the portal`);
  }
  for (const id of ['sensor', 'apihelper', 'canval']) if (!cfg.PRIMARY.find((m) => m.id === id && m.module)) note(`config.js: core tool ${id} must be a module`);
  if (cfg.SYSTEMS.some((m) => m.module)) note('config.js: a company system is marked as a module — myafaqy and PRO forbid being framed');
  for (const need of ['geolocation', 'camera', 'clipboard-write']) if (!String(cfg.MODULE_ALLOW).includes(need)) note(`config.js: MODULE_ALLOW lost "${need}" — the survey tool needs it`);
  if (!/allow: MODULE_ALLOW/.test(app)) note('app.js: the module frame no longer passes MODULE_ALLOW');
}

// 15. Identity colours only. Every colour in the page is the AFAQY template palette or a tint/shade of it.
{
  // the Service Management / R&D Portal colours (light) and the dark set derived from them — docs/design.md
  const PALETTE = new Set(["#0369A1", "#08131C", "#0A5F67", "#0B1824", "#0E3438", "#0E7C86", "#0F2231", "#10283A", "#11222F", "#12301F", "#14293A", "#15803D", "#1B3547", "#223A4D", "#24394A", "#27455B", "#2CA6B0", "#2F4A5E", "#3A2A10", "#3B1714", "#4CB782", "#5A6B78", "#5AB0E0", "#6CC7CF", "#8797A3", "#8FA0AC", "#B42318", "#B45309", "#C3CED7", "#CFDAE2", "#DBE2E8", "#DCE6EC", "#E0A32E", "#E2F0F9", "#E3EAF0", "#E4F2F3", "#E6F4EA", "#EEF1F4", "#F07167", "#F1F5F8", "#FDECEB", "#FDF1E1", "#FFFFFF"]);
  for (const f of ['index.html', 'app.js']) {
    for (const c of read(f).match(/#[0-9A-Fa-f]{6}\b/g) || []) if (!PALETTE.has(c.toUpperCase())) note(`${f}: colour ${c} is not in the Service Management palette (docs/design.md)`);
  }
}

// 16. The side menu (ADR-0009): the reference app's folding menu on the start side, mirrored by direction on phones.
if (!/<aside class="sidebar"/.test(html) || !/data-nav-group-toggle/.test(html)) note('index.html: the side menu with folding groups is gone');
if (!/html\[dir="rtl"\] \.sidebar \{ transform: translateX\(100%\); \}/.test(html)) note('index.html: the phone menu no longer slides from the start side in Arabic and Urdu');
if (!/function setGroup\(/.test(app)) note('app.js: the menu groups no longer fold one at a time');

// 17. The my-KPIs bookmark (ADR-0010, widened by ADR-0014). It runs on myafaqy with the person's own sign-in. It may read
//     «My Tasks» and «All Tasks» (myafaqy itself decides what each person sees) plus names and teams — nothing else —
//     only on myafaqy, hand over only by message to the portal's own address, and never carry the sign-in token.
{
  const { buildBookmarklet } = await import(new URL('core.js', root));
  const code = decodeURIComponent(buildBookmarklet('https://example.org/portal/').replace(/^javascript:/, ''));
  const hosts = [...code.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]).filter((h) => !['example.org', 'crmbackend.afaqy.sa'].includes(h));
  if (hosts.length) note(`bookmark: talks to ${[...new Set(hosts)].join(', ')} — only crmbackend.afaqy.sa`);
  const paths = [...code.matchAll(/'(Security|Teams|Task)\/[A-Za-z/]*'/g)].map((m) => m[0]);
  const okMe = new Set(["'Task/GetMyTasksGrid'", "'Security/GetAllHierarchyUsersDropDown'", "'Teams/GetAllTeams'", "'Teams/GetTeamById/'"]);
  for (const x of paths) if (!okMe.has(x)) note(`bookmark: calls ${x} — only the four read endpoints are allowed`);
  if (/\/(add|edit|delete|remove|save|assign|close|complete|approve|update|create|sync|send)\b/i.test(code) || /method:'(PUT|DELETE|PATCH)'/.test(code)) note('bookmark: a write-like request appeared');
  const groups = [...code.matchAll(/taskGroupId:(\d+)/g)].map((m) => m[1]);
  if (groups.length || !/for\(const g of\[100000,100001\]\)/.test(code)) note('bookmark: must read exactly «My Tasks» (100000) and «All Tasks» (100001) — what myafaqy itself shows the person');
  if (!/location\.hostname!=='myafaqy\.com'/.test(code)) note('bookmark: must refuse to run anywhere but myafaqy.com');
  const pay = (code.match(/const pay=\{[\s\S]*?tasks:\[\.\.\.rows\.values\(\)\]\}/) || [''])[0];
  if (!pay || /tk|token|Authorization|refresh/i.test(pay)) note('bookmark: the hand-over must not carry the sign-in token');
  if (!/w\.postMessage\(\{type:'afaqy-me',payload:pay\},PO\)/.test(code) || !/PO=new URL\(P\)\.origin/.test(code) || /postMessage\([^)]*'\*'\)/.test(code))
    note('bookmark: must hand over by message addressed to the portal’s own origin — never "*"');
  if (!/if\(e\.origin !== MYAFAQY_ORIGIN\) return;/.test(app.replace(/\s+/g, ' ').replace(/e\.origin !== MYAFAQY_ORIGIN\) return;/, 'e.origin !== MYAFAQY_ORIGIN) return;')) && !/if \(e\.origin !== MYAFAQY_ORIGIN\) return;/.test(app))
    note('portal: the message listener must ignore anything not sent from https://myafaqy.com');
  if (!/const MYAFAQY_ORIGIN = 'https:\/\/myafaqy\.com';/.test(app)) note('portal: MYAFAQY_ORIGIN must be exactly https://myafaqy.com');
  // exactly these keys, and "o" may only be a yes/no comparison — never anyone's id
  // the manager bookmark: same six read endpoints as the two prompts, read-only, token never handed out, saves files locally
  const { buildManagerBookmarklet } = await import(new URL('core.js', root));
  const mg = decodeURIComponent(buildManagerBookmarklet('2026-10-01', '2026-10-29').replace(/^javascript:/, ''));
  const mgHosts = [...mg.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]).filter((h) => h !== 'crmbackend.afaqy.sa');
  if (mgHosts.length) note(`manager bookmark: talks to ${[...new Set(mgHosts)].join(', ')} — only crmbackend.afaqy.sa`);
  const mgPaths = [...mg.matchAll(/'(Security|Teams|Task|TechnicianReport|AfterSalesBoardReport|ActivityLog|AfterSales)[A-Za-z/]*'/g)].map((m) => m[1] === 'Teams' ? m[0].replace(/\/$/, "'") : m[0]);
  const okPaths = new Set(["'Security/GetAllHierarchyUsersDropDown'", "'Teams/GetAllTeams'", "'Teams/GetTeamById/'", "'Task/GetMyTasksGrid'", "'TechnicianReport/GetTechnicianReportStatic'", "'AfterSalesBoardReport/GetAfterSalesAgentsGrid'", "'ActivityLog/GetTicketsGrid'", "'AfterSales/GetAllAfterSalesEngineers'", "'AfterSales/GetAfterSalesRequestGrid'"]);
  for (const x of mgPaths) if (!okPaths.has(x)) note(`manager bookmark: calls ${x} — only the nine read endpoints are allowed`);
  if (/AssignAfterSales/.test(mg)) note('manager bookmark: must never carry the assignment write');
  if (/customerName|salesMan|afterSalesMan[^I]/.test((mg.match(/accts\.push\(\{[^}]*\}/) || [''])[0])) note('manager bookmark: account rows carry ids, devices and segment only — no names');
  if (/description|customerName|salesMan/.test((mg.match(/acts\.push\(\{[^}]*\}/) || [''])[0])) note('manager bookmark: the activity log must not carry descriptions, customer names or sales fields');
  // the three task reads the prompt has always had — done in the period, open NOW, R&D open — must all be in the bookmark
  if (!mg.includes("walk(100001,[],false,['open','toDo'])")) note('manager bookmark: must read the tasks OPEN NOW (completedOn [] on the open and toDo buckets) — without it every rate reads 100% and open reads 0');
  if (!mg.includes("walk(12,[],true,['open','toDo'])")) note('manager bookmark: must read the open R&D tasks too');
  {
    const { buildManagerBookmarklet: mb } = await import(new URL('core.js', root));
    const past = decodeURIComponent(mb('2026-01-01', '2026-01-31').replace(/^javascript:/, ''));
    if (!/c>='[^']+'&&c<'[^']+'\)tasks\.push/.test(past)) note('manager bookmark: tasks done after the period are kept only if created inside it');
  }
  if (/\/(add|edit|delete|remove|save|assign|close|complete|approve|update|create|sync|send)\b/i.test(mg)) note('manager bookmark: a write-like path appeared');
  if (/location\.href=[^;]*(tk|token)|\.href='[^']*'\+tk/.test(mg) || /dl\([^)]*tk\b/.test(mg)) note('manager bookmark: the sign-in token must never leave the page');
  if (!/location\.hostname!=='myafaqy\.com'/.test(mg)) note('manager bookmark: must refuse to run anywhere but myafaqy.com');
  // both bookmarks strip newlines before running; a // comment would then swallow the rest of the code
  for (const [nm, b] of [['manager bookmark', mg], ['my-KPIs bookmark', code]]) {
    try { new Function(b); } catch (e) { note(`${nm}: does not compile once newlines are stripped (${e.message}) — a // line comment is the usual cause`); }
  }

  const row = (code.match(/rows\.set\(id,\{([\s\S]*?)\}\)/) || ['', ''])[1];
  const keys = [...row.matchAll(/(?:^|,)([a-z]+)(?=[:,]|$)/g)].map((m) => m[1]);
  if (keys.join(',') !== 'i,c,d,s,m,o,b,a,t') note(`bookmark: hands over fields ${keys.join(',')} — only i,c,d,s,m,o,b,a,t are allowed`);
  if (!/t:a===me&&b!=='done'\?/.test(row)) note('bookmark: a task title (t) may be carried only for the person’s own open tasks');
  if (!/o:String\(x\.createUserId\)===a/.test(row)) note('bookmark: "o" must be the yes/no "the assignee opened it" — never an id');
}

// 19. The reports prompt (ADR-0012): two named read endpoints only, and no pay, phone or evaluation field ever carried.
{
  const { buildReportsPrompt, TECH_FIELDS } = await import(new URL('core.js', root));
  const rp = buildReportsPrompt({ from: '2026-10-01', to: '2026-12-31' });
  if (!rp.includes('TechnicianReport/GetTechnicianReportStatic · AfterSalesBoardReport/GetAfterSalesAgentsGrid · ActivityLog/GetTicketsGrid') || !rp.includes('ABSOLUTE RULE — NOTHING MAY CHANGE IN MYAFAQY') || !rp.includes('STOP and ask me'))
    note('reports prompt: lost its allowlist of the two read endpoints');
  const urls = [...rp.matchAll(/https:\/\/crmbackend\.afaqy\.sa\/([A-Za-z/]+)/g)].map((m) => m[1]);
  if (urls.some((u) => !['TechnicianReport/GetTechnicianReportStatic', 'AfterSalesBoardReport/GetAfterSalesAgentsGrid', 'ActivityLog/GetTicketsGrid'].includes(u))) note(`reports prompt: calls ${[...new Set(urls)].join(', ')} — only the three reads are allowed`);
  if (!/Do NOT keep customerNameAr, customerNameEn, createdBy, description, salesMan or isVIP/.test(rp)) note('reports prompt: the activity log must drop customer names, the logger’s name, descriptions and sales fields');
  const banned = ['bonusValue', 'fridayWorkDaysBonus', 'saturdayWorkDaysPoints', 'phoneNumber', 'evaluation', 'leadEvaluation', 'branchPercentage'];
  if (TECH_FIELDS.some((f) => banned.includes(f))) note('reports: a pay, phone or evaluation field is kept — never carry those');
  if (!banned.every((f) => rp.includes(f))) note('reports prompt: must tell Claude in Chrome not to keep pay, phone and evaluation fields');
}

// 20. team.json (ADR-0015): ids, positions and leaders only — never a name field, never a phone.
{
  const tj = JSON.parse(read('team.json'));
  if (!tj || typeof tj.people !== 'object') note('team.json: must be {"v":1,"people":{…}}');
  else for (const [id, p] of Object.entries(tj.people)) {
    if (!/^\d+$/.test(id)) note(`team.json: key ${id} is not a myafaqy id`);
    for (const k of Object.keys(p || {})) if (!['position', 'positionEn', 'leaderId', 'onLeave'].includes(k)) note(`team.json: field "${k}" on ${id} is not allowed — only position, positionEn, leaderId, onLeave`);
  }
}

// 21. The assignment panel (ADR-0018) — the ONE write in the whole portal, fenced on every side.
{
  const { buildAssignBookmarklet } = await import(new URL('core.js', root));
  const ab = decodeURIComponent(buildAssignBookmarklet('ar').replace(/^javascript:/, ''));
  try { new Function(ab); } catch (e) { note(`assignment panel: does not compile (${e.message})`); }
  const hosts = [...ab.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]).filter((h) => h !== 'crmbackend.afaqy.sa');
  if (hosts.length) note(`assignment panel: talks to ${[...new Set(hosts)].join(', ')} — only crmbackend.afaqy.sa`);
  const paths = [...ab.matchAll(/post\('([A-Za-z/]+)'/g)].map((m) => m[1]);
  const okA = ['AfterSales/GetAllAfterSalesEngineers', 'AfterSales/GetAfterSalesRequestGrid', 'Teams/GetAllTeams', 'AfterSales/AssignAfterSales'];
  const gets = [...ab.matchAll(/get\('([A-Za-z/]+)'/g)].map((m) => m[1]);
  for (const x of new Set(gets)) if (x !== 'Teams/GetTeamById/') note(`assignment panel: reads ${x} — only Teams/GetTeamById besides the allowed posts`);
  for (const x of new Set(paths)) if (!okA.includes(x)) note(`assignment panel: calls ${x} — only two reads and the one write are allowed`);
  const writes = paths.filter((x) => !/\/Get/.test(x) && x !== 'Teams/GetAllTeams');
  if (writes.length !== 1 || writes[0] !== 'AfterSales/AssignAfterSales') note('assignment panel: exactly one write endpoint, AfterSales/AssignAfterSales');
  if (!/const union=r=>\[\.\.\.new Set\(\[\.\.\.r\.have,\.\.\.chosen\]\)\]\.filter\(x=>!removing\.has\(x\)\);/.test(ab)) note('assignment panel: the posted list must be (existing ∪ chosen) minus only the explicitly ticked removals');
  if (!/removing=new Set\(\)/.test(ab) || /removing=new Set\([^)]/.test(ab) || /localStorage\.setItem\('afaqy-assign-remove'/.test(ab)) note('assignment panel: the removal set must start empty on every open and never be remembered — removal is always a fresh, explicit tick');
  if ((ab.match(/removing\.add\(/g) || []).length !== 1 || !/onchange:ev=>\{if\(ev\.target\.checked\)\{removing\.add\(id\)/.test(ab)) note('assignment panel: someone may be added to the removal set only by ticking their box');
  if (!/if\(!next\.length\)\{logRows\.push/.test(ab)) note('assignment panel: an account must never be left with nobody');
  if (!/afterSalesIds:next\.map\(Number\)/.test(ab) || !/const next=union\(r\)/.test(ab)) note('assignment panel: the write must post exactly the union');
  if (!/String\(r\.branchCode\)==='2'/.test(ab)) note('assignment panel: must keep only branchCode "2" rows — Jeddah');
  if (!/location\.hostname!=='myafaqy\.com'/.test(ab)) note('assignment panel: must refuse to run anywhere but myafaqy.com');
  if (!/btn\(M\.pilot,async\(\)=>/.test(ab) || !/btn\(M\.rest,async\(\)=>/.test(ab)) note('assignment panel: writes only happen behind the pilot and apply buttons');
  if (/location\.href=[^;]*tk|dl\([^)]*tk/.test(ab)) note('assignment panel: the token must never leave the page');
}

// 22. weights.json (ADR-0019): numbers 0–20 by task-type key and activity category; no names; every tier known.
{
  const wj = JSON.parse(read('weights.json'));
  if (wj.schema !== 'afaqy-weights/v1') note('weights.json: schema must be afaqy-weights/v1');
  for (const [k, x] of Object.entries(wj.tasks || {})) {
    if (!(x && typeof x.w === 'number' && x.w >= 0 && x.w <= 20)) note(`weights.json: task "${k}" needs a weight 0–20`);
    if (x && x.tier && !['admin', 'customer', 'integration', 'multistage'].includes(x.tier)) note(`weights.json: task "${k}" has an unknown tier`);
    for (const f of Object.keys(x || {})) if (!['w', 'tier', 'team'].includes(f)) note(`weights.json: task "${k}" has field "${f}" — only w, tier, team`);
  }
  for (const [k, w] of Object.entries(wj.activities || {})) if (!(typeof w === 'number' && w >= 0 && w <= 20)) note(`weights.json: activity "${k}" needs a weight 0–20`);
  for (const [uid, list] of Object.entries(wj.editors || {})) { if (!/^\d+$/.test(uid)) note(`weights.json: editor "${uid}" is not a myafaqy id`); if (!Array.isArray(list) || !list.every((x) => typeof x === 'string')) note(`weights.json: editor ${uid} needs a list of type keys or "*"`); }
  if (!Object.values(wj.editors || {}).some((l) => Array.isArray(l) && l.includes('*'))) note('weights.json: at least one admin ("*") must be able to edit');
  if (Object.values(wj.tasks || {}).some((x) => x && !['aftersales', 'rd', 'both', 'general'].includes(x.team))) note('weights.json: every task type carries its team — aftersales, rd, both or general');
}
// 23. Every "?" opens a defined explanation, and every page title carries one.
{
  const html = read('index.html'), app = read('app.js');
  const keys = [...html.matchAll(/data-help="([a-z0-9_]+)"/g), ...app.matchAll(/helpQ\('([a-z0-9_]+)'/g)].map((m) => m[1]);
  for (const k of new Set(keys)) for (const lang of LANGS) if (!STRINGS[lang][k]) note(`help "?": ${lang} has no text for ${k}`);
  const heads = (html.match(/<div class="page-head">[\s\S]*?<\/div>/g) || []).filter((h) => !/g_title/.test(h));
  for (const h of heads) if (!/class="help-q"/.test(h)) note(`help "?": a page title has no "?" — ${(h.match(/data-t="([a-z_]+)"[^>]*>[^<]*<\/h1>/) || [])[1] || 'unknown'}`);
}

// 18. The Afaqy PRO page (ADR-0011): one address, two read requests, and the password never kept.
{
  const pro = (app.match(/\/\/ ---------- AFAQY PRO inside the portal[\s\S]*?\/\/ ---------- the side menu ----------/) || [''])[0];
  if (!pro) note('app.js: the Afaqy PRO section is missing or renamed');
  else {
    if (!/const PRO_API = 'https:\/\/api\.afaqy\.sa';/.test(pro)) note('PRO page: the only address allowed is https://api.afaqy.sa');
    const hosts = [...pro.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]).filter((h) => !['api.afaqy.sa', 'afaqy.pro', 'www.google.com'].includes(h));
    if (hosts.length) note(`PRO page: talks to ${hosts.join(', ')} — only api.afaqy.sa is allowed`);
    const paths = [...pro.matchAll(/proPost\('([^']+)'/g)].map((m) => m[1]);
    if (paths.some((x) => !['/auth/login', '/units/lists'].includes(x))) note(`PRO page: calls ${paths.join(', ')} — only /auth/login and /units/lists (read) are allowed`);
    if ((pro.match(/fetch\(/g) || []).length !== 1) note('PRO page: all requests must go through proPost');
    if (/localStorage|indexedDB|store\.|pref\(/.test(pro)) note('PRO page: nothing from Afaqy PRO may be stored beyond the tab session');
    // the repair check (ADR-0022) keeps only what the person typed — device ref, engineer, time — never a PRO field
    const rp = app.slice(app.indexOf('function renderRepairs()'), app.indexOf('\n}\n', app.indexOf('function renderRepairs()')));
    const sA = rp.indexOf('repairs = [...repairs, ...lines.map((x) => ({'), sB = sA < 0 ? -1 : rp.indexOf('}))]', sA);
    const saved = sA < 0 || sB < 0 ? '' : rp.slice(sA, sB);
    if (!saved) note('repair check: the saved list must be built only from the typed lines');
    else if (/\blast\b|unit|imei|\bname\b|lat|lng|dtt/i.test(saved.replace(/lines|repairs/g, ''))) note('repair check: nothing read from PRO may be saved — only ref, engineer and time');
    if (/sessionStorage\.setItem\([^)]*(pass|pw|user)/i.test(pro) || /PRO_KEY,\s*(pass|pw|user)/i.test(pro)) note('PRO page: the password or username must never be stored');
    if (!/p\.value = ''/.test(pro)) note('PRO page: the password box must be cleared as soon as it is read');
  }
}

if (problems.length) { console.error(`check.mjs: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`); process.exit(1); }
console.log(`check.mjs: all checks passed (v${version})`);
