// ADR-0107 — builds the public website (_site/) from the app's own files only. Documentation, tests, scripts, tools, release
// notes and the Markdown files stay in the private repository. Fails if any file the app needs is missing from the site.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname, out = join(root, '_site');
const PRIVATE = new Set(['docs', 'tests', 'scripts', 'tools', 'release', 'extension', 'dist', 'node_modules', '_site', '.git', '.github', 'package.json', 'package-lock.json']);
const isPrivate = (name) => PRIVATE.has(name) || name.endsWith('.md') || name.startsWith('.') && name !== '.nojekyll';
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
for (const name of readdirSync(root)) if (!isPrivate(name)) cpSync(join(root, name), join(out, name), { recursive: true, filter: (src) => !src.endsWith('.md') });
// the About window's two counts, written here so it never has to read a private file
const versions = new Set(readFileSync(join(root, 'CHANGELOG.md'), 'utf8').match(/^## v\d+\.\d+/gm) || []).size;
const decisions = new Set(readFileSync(join(root, 'docs/START-HERE.md'), 'utf8').match(/docs\/decisions\/(?!0000)0\d{3}(?=-)/g) || []).size;
const vj = JSON.parse(readFileSync(join(out, 'version.json'), 'utf8')); vj.counts = { versions, decisions };   // recomputed here too, so a publish without a version bump stays right
writeFileSync(join(out, 'version.json'), JSON.stringify(vj, null, 2) + '\n');
// every file the app needs must be in the site: the offline shell (sw.js), local imports, and local src/href references
const need = new Set();
const sw = readFileSync(join(root, 'sw.js'), 'utf8'); for (const m of sw.match(/'\.\/[^']*'/g) || []) need.add(m.slice(3, -1));
for (const f of ['index.html', 'app.js', 'core.js', 'config.js', 'manage-systems.html', 'manage-systems.js', 'tender-analyzer.html', 'tenders-view.html', 'tenders-view.js']) {
  const s = readFileSync(join(root, f), 'utf8');
  for (const m of s.matchAll(/(?:import[^'"]*from\s*|src\s*[:=]\s*|href\s*[:=]\s*|fetch\(\s*|new URL\(\s*)['"`]\.\/([A-Za-z0-9_\-./]+?\.(?:js|json|html|png|svg|woff2|pdf|zip|webmanifest))['"`]/g)) need.add(m[1]);
}
need.delete(''); const missing = [...need].filter((p) => p && !p.endsWith('/') && !existsSync(join(out, p)));
const leaked = ['docs', 'tests', 'scripts', 'tools', 'release', 'CHANGELOG.md', 'AGENTS.md', 'CLAUDE.md', 'README.md'].filter((p) => existsSync(join(out, p)));
const size = (d) => readdirSync(d).reduce((s, n) => { const p = join(d, n), st = statSync(p); return s + (st.isDirectory() ? size(p) : st.size); }, 0);
if (missing.length || leaked.length) { console.error(`✗ site: missing ${JSON.stringify(missing)} · private files present ${JSON.stringify(leaked)}`); process.exit(1); }
console.log(`✓ _site built: ${need.size} needed files present, nothing private, ${Math.round(size(out) / 1024)} KB · counts ${versions} versions, ${decisions} decisions`);
