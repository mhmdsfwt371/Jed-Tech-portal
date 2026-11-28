// ADR-0156 — the tender register Safwoot publishes for anyone with the link, and the one way to open it.
// Pure: no page, no network. Safwoot seals with sealView(); the portal's page opens with openView(). The format is
// docs/tenders-view-format.md (`afaqy-tenders-view/v1`); a file that breaks it is refused whole, never shown in part.

export const VIEW_SCHEMA = 'afaqy-tenders-view/v1';
export const VIEW_FILE = 'tenders.afqv';
export const VIEW_REPO = 'jed-tenders';          // the folder (a sibling repository on this site's address) when the link names none
export const VIEW_MAX = 8 * 1024 * 1024;
export const VIEW_DATES = ['inquiries', 'submit', 'opening', 'examination', 'award'];
export const VIEW_STAGES = ['new', 'working', 'submitted', 'declined', 'awarded', 'cancelled', 'other'];
const MAGIC = [65, 70, 81, 86], VERSION = 1, HEAD = 5, NONCE = 12, TAG = 16;
const VERDICTS = ['go', 'no-go', 'pending'], SOURCES = ['workbook', 'pull', 'page'], KINDS = ['mail', 'note', 'decision', 'study', 'register'];
const REPO = /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,100}$/;

// ---------- base64url, and the key ----------
export function b64urlEncode(bytes) {
  let s = ''; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function b64urlDecode(text) {
  if (typeof text !== 'string' || !/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return null;
  try { const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4)); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); }
  catch { return null; }
}
/** A new key: 32 random bytes, written for a link (43 characters). Made by Safwoot once, and again on «New link». */
export function newViewKey() { return b64urlEncode(crypto.getRandomValues(new Uint8Array(32))); }

// ---------- the link ----------
/** `#k=<key>&r=<folder>` → { key, repo }, or { error: 'no-key' | 'bad-key' | 'bad-repo' }. The part after # never reaches a server. */
export function parseViewLink(hash) {
  const q = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const k = q.get('k'), r = q.has('r') ? q.get('r') : VIEW_REPO;
  if (!k) return { error: 'no-key' };
  const key = b64urlDecode(k);
  if (!key || key.length !== 32) return { error: 'bad-key' };
  if (!REPO.test(r || '')) return { error: 'bad-repo' };
  return { key, repo: r };
}
/** Where the page reads the sealed file: always on its own address, one folder up — never a full address. */
export function viewFileUrl(repo) {
  if (!REPO.test(repo || '')) throw new Error('bad folder');
  return `../${repo}/${VIEW_FILE}`;
}
/** The link the manager sends: the page's address, then the key and the folder after #. */
export function viewLink(base, key, repo = VIEW_REPO) {
  if (!REPO.test(repo || '') || !/^[A-Za-z0-9_-]{43}$/.test(key || '')) throw new Error('bad link parts');
  return `${String(base).replace(/[^/]*$/, '')}tenders-view.html#k=${key}&r=${repo}`;
}

// ---------- the format ----------
const DATE = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/;
function realDate(s) {
  const m = DATE.exec(s); if (!m) return false;
  const [y, mo, d, h = '0', mi = '0'] = m.slice(1).map((x) => (x === undefined ? undefined : x));
  const days = new Date(Date.UTC(+y, +mo, 0)).getUTCDate();
  return +mo >= 1 && +mo <= 12 && +d >= 1 && +d <= days && +h <= 23 && +mi <= 59;
}
class Bad extends Error {}
const no = () => { throw new Bad(); };
const str = (v, max, need = false) => { if (v === undefined || v === null) return need ? no() : ''; if (typeof v !== 'string' || v.length > max || (need && !v.trim())) no(); return v; };
const when = (v, need = false) => { const s = str(v, 16, need); if (s && !realDate(s)) no(); return s; };
const list = (v, max, each) => { if (v === undefined || v === null) return []; if (!Array.isArray(v) || v.length > max) no(); return v.map((x) => { if (!x || typeof x !== 'object' || Array.isArray(x)) no(); return each(x); }); };
const one = (v, allowed, fallback) => { if (v === undefined || v === null || v === '') { if (fallback === undefined) no(); return fallback; } if (!allowed.includes(v)) no(); return v; };

function tender(t) {
  if (!t || typeof t !== 'object' || Array.isArray(t)) no();
  const d = t.dates == null ? {} : t.dates; if (typeof d !== 'object' || Array.isArray(d)) no();
  const dec = t.decision == null ? null : t.decision, et = t.etimad == null ? null : t.etimad;
  if (dec !== null && (typeof dec !== 'object' || Array.isArray(dec))) no();
  if (et !== null && (typeof et !== 'object' || Array.isArray(et))) no();
  return {
    ref: str(t.ref, 60, true), title: str(t.title, 600), entity: str(t.entity, 300), status: str(t.status, 300),
    stage: one(t.stage, VIEW_STAGES, 'other'),
    dates: Object.fromEntries(VIEW_DATES.map((k) => [k, when(d[k])])),
    decision: dec && { verdict: one(dec.verdict, VERDICTS), reason: str(dec.reason, 20000), at: when(dec.at) },
    summary: str(t.summary, 20000),
    etimad: et && { checkedAt: when(et.checkedAt, true), source: one(et.source, SOURCES),
      diffs: list(et.diffs, 20, (x) => ({ field: one(x.field, VIEW_DATES), ours: str(x.ours, 40), etimad: str(x.etimad, 40) })) },
    files: list(t.files, 200, (x) => ({ name: str(x.name, 300, true), at: when(x.at) })),
    timeline: list(t.timeline, 500, (x) => ({ at: when(x.at, true), who: str(x.who, 200), mine: x.mine === true, kind: one(x.kind, KINDS, 'mail'), text: str(x.text, 20000) })),
    changes: list(t.changes, 500, (x) => ({ at: when(x.at, true), field: str(x.field, 60), old: str(x.old, 2000), new: str(x.new, 2000), source: str(x.source, 60) })),
    updatedAt: when(t.updatedAt),
  };
}
/** The register as the page may show it, or null. Unknown fields are left out; a wrong one refuses the whole file. */
export function validateView(v) {
  try {
    if (!v || typeof v !== 'object' || v.schema !== VIEW_SCHEMA) return null;
    const out = { schema: VIEW_SCHEMA, app: str(v.app, 60), publishedAt: when(v.publishedAt, true), title: str(v.title, 200),
      tenders: list(v.tenders, 2000, tender) };
    if (new Set(out.tenders.map((t) => t.ref)).size !== out.tenders.length) return null;
    return out;
  } catch (e) { if (e instanceof Bad) return null; throw e; }
}

// ---------- sealing ----------
async function squeeze(bytes, mode) {
  const s = new Blob([bytes]).stream().pipeThrough(mode === 'in' ? new CompressionStream('gzip') : new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}
const aesKey = (key, use) => crypto.subtle.importKey('raw', key, 'AES-GCM', false, [use]);
/** Safwoot's side: the register → the sealed file. Refuses a register that breaks the format, so nothing broken is published. */
export async function sealView(view, key) {
  if (!validateView(view)) throw new Error('invalid view: not published');
  if (!(key instanceof Uint8Array) || key.length !== 32) throw new Error('the key is 32 bytes');
  const head = new Uint8Array([...MAGIC, VERSION]), iv = crypto.getRandomValues(new Uint8Array(NONCE));
  const body = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: head }, await aesKey(key, 'encrypt'),
    await squeeze(new TextEncoder().encode(JSON.stringify(view)), 'in')));
  const out = new Uint8Array(HEAD + NONCE + body.length); out.set(head); out.set(iv, HEAD); out.set(body, HEAD + NONCE);
  return out;
}
/** The page's side: { ok: true, view } or { ok: false, reason: 'too-big' | 'not-ours' | 'version' | 'key' | 'broken' | 'invalid' }. */
export async function openView(bytes, key) {
  if (!(bytes instanceof Uint8Array)) return { ok: false, reason: 'not-ours' };
  if (bytes.length > VIEW_MAX) return { ok: false, reason: 'too-big' };
  if (bytes.length < HEAD + NONCE + TAG || MAGIC.some((b, i) => bytes[i] !== b)) return { ok: false, reason: 'not-ours' };
  if (bytes[4] !== VERSION) return { ok: false, reason: 'version' };
  let plain;
  try { plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(HEAD, HEAD + NONCE), additionalData: bytes.slice(0, HEAD) }, await aesKey(key, 'decrypt'), bytes.slice(HEAD + NONCE))); }
  catch { return { ok: false, reason: 'key' }; }
  let data;
  try { data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await squeeze(plain, 'out'))); }
  catch { return { ok: false, reason: 'broken' }; }
  const view = validateView(data);
  return view ? { ok: true, view } : { ok: false, reason: 'invalid' };
}

// ---------- the page's lists ----------
const dayNo = (ymd) => Math.round(Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) / 86400000);
/** The tender's next date from `now` (Saudi wall clock): { field, at, days } — or null when no date lies ahead. */
export function tenderNext(t, now) {
  const today = String(now).slice(0, 10); let best = null;
  for (const field of VIEW_DATES) {
    const at = (t.dates || {})[field]; if (!at || at.slice(0, 10) < today) continue;
    if (!best || at < best.at) best = { field, at };
  }
  return best && { ...best, days: dayNo(best.at) - dayNo(today) };
}
const ARCHIVE = new Set(['declined', 'awarded', 'cancelled']);
/** Three lists: still running (nearest date first; one whose dates have all passed comes last, so it is noticed), offers sent
 *  (waiting for opening and award), and the archive (declined, awarded, cancelled; newest first). */
export function viewGroups(view, now) {
  const byNext = (a, b) => { const x = tenderNext(a, now), y = tenderNext(b, now); if (x && y) return x.at < y.at ? -1 : x.at > y.at ? 1 : 0; if (x || y) return x ? -1 : 1; return (b.updatedAt || '').localeCompare(a.updatedAt || ''); };
  const all = (view && view.tenders) || [];
  return {
    running: all.filter((t) => t.stage !== 'submitted' && !ARCHIVE.has(t.stage)).sort(byNext),
    submitted: all.filter((t) => t.stage === 'submitted').sort(byNext),
    archive: all.filter((t) => ARCHIVE.has(t.stage)).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
  };
}
