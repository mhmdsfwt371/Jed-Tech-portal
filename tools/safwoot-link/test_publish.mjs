// The publisher Safwoot runs (ADR-0156), against a stand-in for GitHub's contents API. Run: node tools/safwoot-link/test_publish.mjs
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dir = mkdtempSync(join(tmpdir(), 'pub-'));
// laid out as in Safwoot's window: publish.js beside its copy of the core
copyFileSync(new URL('../../tenders-view-core.js', import.meta.url), join(dir, 'tenders-view-core.js'));
copyFileSync(new URL('./publish.js', import.meta.url), join(dir, 'publish.js'));
const { publishView, shareLink, pagesFileUrl } = await import(join(dir, 'publish.js'));
const { openView, newViewKey, b64urlDecode, VIEW_SCHEMA } = await import(join(dir, 'tenders-view-core.js'));

const view = { schema: VIEW_SCHEMA, app: 'Safwoot', publishedAt: '2026-11-28 09:30', tenders: [{ ref: '261100000101', title: 'مشروع تجريبي', stage: 'working', dates: { submit: '2026-12-22 10:00' } }] };
function github({ file = null, repo = true, auth = true, conflictOnce = false } = {}) {
  const log = []; let stored = file, conflicted = false;
  const res = (status, body) => ({ status, json: async () => body });
  const fetchImpl = async (url, init = {}) => {
    log.push([init.method || 'GET', url, init.headers && init.headers.Authorization, init.body ? JSON.parse(init.body) : null]);
    if (!auth) return res(401, { message: 'Bad credentials' });
    if (/\/repos\/[^/]+\/[^/]+$/.test(url)) return res(repo ? 200 : 404, {});
    if (!repo) return res(404, {});
    if ((init.method || 'GET') === 'GET') return stored ? res(200, { sha: stored.sha }) : res(404, {});
    const body = JSON.parse(init.body);
    if (conflictOnce && !conflicted) { conflicted = true; stored = { sha: 'other', content: '' }; return res(409, {}); }
    if ((stored && body.sha !== stored.sha) || (!stored && body.sha)) return res(409, {});
    stored = { sha: 'sha-' + log.length, content: body.content }; return res(stored ? 200 : 201, { commit: { sha: 'c' + log.length } });
  };
  return { fetchImpl, log, get file() { return stored; } };
}
const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const key = newViewKey();
let failed = 0; const t = async (name, fn) => { try { await fn(); console.log('ok   ' + name); } catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + e.message); } };

await t('first publish: the folder has no file yet; the file written opens with the key, and the token went to GitHub only', async () => {
  const gh = github();
  const r = await publishView({ view, key, owner: 'mhmdsfwt371', repo: 'jed-tenders', token: 'TEST', fetchImpl: gh.fetchImpl });
  assert.equal(r.ok, true, JSON.stringify(r));
  const put = gh.log.find((x) => x[0] === 'PUT'); assert.equal(put[3].sha, undefined); assert.equal(put[3].branch, 'main');
  const opened = await openView(bytes(gh.file.content), b64urlDecode(key)); assert.equal(opened.ok, true); assert.equal(opened.view.tenders[0].ref, '261100000101');
  assert.ok(gh.log.every((x) => x[1].startsWith('https://api.github.com/repos/mhmdsfwt371/jed-tenders') && x[2] === 'Bearer TEST'));
  assert.ok(!JSON.stringify(gh.log).includes(key), 'the key is never sent');
});
await t('a later publish replaces the file with its sha', async () => {
  const gh = github({ file: { sha: 'abc', content: '' } });
  const r = await publishView({ view, key, owner: 'mhmdsfwt371', repo: 'jed-tenders', token: 'TEST', fetchImpl: gh.fetchImpl });
  assert.equal(r.ok, true); assert.equal(gh.log.find((x) => x[0] === 'PUT')[3].sha, 'abc');
});
await t('a file changed in between is read again once, then written', async () => {
  const gh = github({ file: { sha: 'abc', content: '' }, conflictOnce: true });
  const r = await publishView({ view, key, owner: 'mhmdsfwt371', repo: 'jed-tenders', token: 'TEST', fetchImpl: gh.fetchImpl });
  assert.equal(r.ok, true, JSON.stringify(r)); assert.equal(gh.log.filter((x) => x[0] === 'PUT').length, 2);
});
await t('each failure says what it is: wrong token, no repository, no network', async () => {
  assert.equal((await publishView({ view, key, owner: 'o', repo: 'r', token: 'BAD', fetchImpl: github({ auth: false }).fetchImpl })).reason, 'auth');
  assert.equal((await publishView({ view, key, owner: 'o', repo: 'r', token: 'T', fetchImpl: github({ repo: false }).fetchImpl })).reason, 'repo');
  assert.equal((await publishView({ view, key, owner: 'o', repo: 'r', token: 'T', fetchImpl: async () => { throw new Error('offline'); } })).reason, 'network');
});
await t('a wrong key or a broken register sends nothing at all', async () => {
  const gh = github();
  assert.equal((await publishView({ view, key: 'short', owner: 'o', repo: 'r', token: 'T', fetchImpl: gh.fetchImpl })).reason, 'key');
  assert.equal((await publishView({ view: { ...view, publishedAt: 'yesterday' }, key, owner: 'o', repo: 'r', token: 'T', fetchImpl: gh.fetchImpl })).reason, 'invalid');
  assert.equal(gh.log.length, 0);
});
await t('the link to send and the published address', async () => {
  assert.equal(shareLink('mhmdsfwt371', key, 'jed-tenders'), `https://mhmdsfwt371.github.io/Jed-Tech-portal/tenders-view.html#k=${key}&r=jed-tenders`);
  assert.equal(pagesFileUrl('mhmdsfwt371', 'jed-tenders'), 'https://mhmdsfwt371.github.io/jed-tenders/tenders.afqv');
});
console.log(failed ? `${failed} failed` : 'test_publish.mjs: all passed'); if (failed) process.exit(1);
