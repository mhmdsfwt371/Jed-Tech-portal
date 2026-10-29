// scripts/check-links.mjs — every tool the portal opens must answer, and must still be the tool we think it is.
// Needs the network, so it runs on GitHub (verify.yml) and on demand (npm run links), not in the offline pre-push gate.
const { PRIMARY, SYSTEMS, MORE } = await import(new URL('../config.js', import.meta.url));
// the page title each of our own tools carries — a wrong title means the link now opens something else
const EXPECT = { sensor: 'Sensor Displacement', apihelper: 'مساعد الإنتجريشن', canval: 'canval', nusuk: 'قارئات أفاقي' };
const links = [...PRIMARY, ...MORE.filter((x) => x.status === 'live'), ...SYSTEMS];
const problems = [];
for (const x of links) {
  try {
    // myafaqy and Afaqy PRO sit behind Cloudflare, which refuses a script's default identity with 403
    // while letting a browser through (checked 29 Oct 2026) — so the check asks the way a browser does
    const res = await fetch(x.url, { redirect: 'follow', signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', Accept: 'text/html' } });
    const html = await res.text();
    const title = (html.match(/<title>([^<]*)/) || [])[1] || '';
    // a company system behind Cloudflare that refuses scripts (403 with Cloudflare's own headers) is up; an outage
    // shows as 5xx or Cloudflare's 52x. Our own tools must answer 200 and carry their title.
    const behindCloudflare = res.status === 403 && /cloudflare/i.test(res.headers.get('server') || '') && res.headers.get('cf-ray');
    if (behindCloudflare && SYSTEMS.includes(x)) { console.log(`✓ ${x.id.padEnd(10)} up — behind Cloudflare, which refuses scripts`); continue; }
    if (!res.ok) problems.push(`${x.id}: ${x.url} answered ${res.status}`);
    else if (EXPECT[x.id] && !title.includes(EXPECT[x.id])) problems.push(`${x.id}: ${x.url} opens "${title}", expected "${EXPECT[x.id]}"`);
    else if (x.module && (/^(deny|sameorigin)$/i.test(res.headers.get('x-frame-options') || '') || /frame-ancestors/i.test(res.headers.get('content-security-policy') || '')))
      problems.push(`${x.id}: now refuses to be shown inside another page — it can no longer open as a module`);
    else console.log(`✓ ${x.id.padEnd(10)} ${res.status}  ${title.slice(0, 50)}${x.module ? '  · module' : ''}`);
  } catch (e) { problems.push(`${x.id}: ${x.url} did not answer (${e.name})`); }
}
if (problems.length) { console.error(`check-links: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`); process.exit(1); }
console.log('check-links: every tool answers');
