// ADR-0156 — Safwoot's side: seal the tender register and put it in the sibling repository on GitHub, where the portal's
// read-only page opens it with the key in the link. Runs in Safwoot's own window (Edge), next to a copy of
// tenders-view-core.js — the same function seals here and opens on the page. The token and the key live in Safwoot's
// settings on the manager's laptop; they never enter a repository, a chat or a published file.
import { sealView, b64urlDecode, viewLink, VIEW_FILE } from './tenders-view-core.js';

const API = 'https://api.github.com';

function toBase64(bytes) {
  let s = ''; const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) s += String.fromCharCode(...bytes.subarray(i, i + step));
  return btoa(s);
}

/** Where the sealed file is served once GitHub Pages publishes it (same address as the portal). */
export const pagesFileUrl = (owner, repo) => `https://${owner}.github.io/${repo}/${VIEW_FILE}`;
/** The link the manager sends: the portal's read-only page with the key and the folder after #. */
export const shareLink = (owner, key, repo) => viewLink(`https://${owner}.github.io/Jed-Tech-portal/`, key, repo);

/**
 * Seal `view` with `key` (base64url, 32 bytes) and write it to `<owner>/<repo>` as tenders.afqv on `branch`.
 * → { ok: true, bytes, commit } or { ok: false, reason: 'key' | 'invalid' | 'auth' | 'repo' | 'conflict' | 'network' | 'github', status }
 * Nothing is sent when the key or the register is wrong. A file changed on GitHub in between is read again once.
 */
export async function publishView({ view, key, owner, repo, token, branch = 'main', message, fetchImpl = globalThis.fetch }) {
  const k = b64urlDecode(key || '');
  if (!k || k.length !== 32) return { ok: false, reason: 'key' };
  let sealed;
  try { sealed = await sealView(view, k); } catch { return { ok: false, reason: 'invalid' }; }
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' };
  const fileUrl = `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${VIEW_FILE}`;
  const call = async (url, init) => { try { return await fetchImpl(url, { cache: 'no-store', ...init, headers: { ...headers, ...(init && init.headers) } }); } catch { return null; } };
  const readSha = async () => {
    const r = await call(`${fileUrl}?ref=${encodeURIComponent(branch)}`);
    if (!r) return { reason: 'network' };
    if (r.status === 200) { const j = await r.json(); return { sha: j.sha }; }
    if (r.status === 401 || r.status === 403) return { reason: 'auth', status: r.status };
    if (r.status === 404) {   // no file yet, or no repository (or a token that cannot see it)
      const repoRes = await call(`${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
      if (!repoRes) return { reason: 'network' };
      return repoRes.status === 200 ? { sha: null } : { reason: 'repo', status: repoRes.status };
    }
    return { reason: 'github', status: r.status };
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const s = await readSha(); if (s.reason) return { ok: false, ...s };
    const body = { message: message || `Tender register ${view.publishedAt}`, content: toBase64(sealed), branch, ...(s.sha ? { sha: s.sha } : {}) };
    const r = await call(fileUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r) return { ok: false, reason: 'network' };
    if (r.status === 200 || r.status === 201) { const j = await r.json(); return { ok: true, bytes: sealed.length, commit: j.commit && j.commit.sha }; }
    if (r.status === 401 || r.status === 403) return { ok: false, reason: 'auth', status: r.status };
    if (r.status === 404) return { ok: false, reason: 'repo', status: r.status };
    if ((r.status === 409 || r.status === 422) && attempt === 0) continue;   // changed in between: read its sha again, once
    return { ok: false, reason: r.status === 409 || r.status === 422 ? 'conflict' : 'github', status: r.status };
  }
  return { ok: false, reason: 'conflict' };
}
