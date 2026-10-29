// scripts/bump.mjs — one command stamps a new version everywhere it appears, so they can never disagree.
//   1. write the release notes in release/next.json  ({ "ar": [...], "en": [...], "ur": [...] }, each written in its own
//      language from the meaning — not translated word for word — in plain words a manager understands)
//   2. node scripts/bump.mjs 5.1
// It stamps config.js, sw.js and version.json, adds the section on top of CHANGELOG.md, writes this version's user
// manual into docs/manual/ (from the Guide strings), and empties next.json.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { manualText, manualPath, indexText } from './build-manual.mjs';
const root = new URL('../', import.meta.url);
const read = (f) => readFileSync(new URL(f, root), 'utf8');
const write = (f, s) => writeFileSync(new URL(f, root), s);

const next = process.argv[2];
if (!/^\d+\.\d+$/.test(next || '')) { console.error('usage: node scripts/bump.mjs <major.minor>   e.g. 5.1'); process.exit(1); }
const current = JSON.parse(read('version.json')).version;
const [cm, cn] = current.split('.').map(Number), [nm, nn] = next.split('.').map(Number);
if (nm < cm || (nm === cm && nn <= cn)) { console.error(`✗ ${next} is not above the current ${current}`); process.exit(1); }

const notes = JSON.parse(read('release/next.json'));
if (!['ar', 'en', 'ur'].every((l) => Array.isArray(notes[l]) && notes[l].length && notes[l].length === notes.ar.length)) {
  console.error('✗ release/next.json needs the same number of notes in "ar", "en" and "ur" — a version without notes is an incomplete version');
  process.exit(1);
}
// Saudi date, whatever the machine's time zone
const date = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);

const swap = (file, re, value) => {
  const s = read(file);
  if (!re.test(s)) { console.error(`✗ ${file}: version stamp not found`); process.exit(1); }
  write(file, s.replace(re, value));
};
swap('config.js', /export const PORTAL_VERSION = '[\d.]+';/, `export const PORTAL_VERSION = '${next}';`);
swap('sw.js', /const VERSION = '[\d.]+';/, `const VERSION = '${next}';`);
write('version.json', JSON.stringify({ version: next, date, notes: { ar: notes.ar, en: notes.en, ur: notes.ur } }, null, 2) + '\n');

const log = read('CHANGELOG.md');
const marker = '<!-- releases -->';
if (!log.includes(marker)) { console.error('✗ CHANGELOG.md: the releases marker is missing'); process.exit(1); }
const section = `## v${next} — ${date}\n\n${notes.ar.map((n) => `- ${n}`).join('\n')}\n\n<details><summary>English</summary>\n\n${notes.en.map((n) => `- ${n}`).join('\n')}\n\n</details>\n\n<details><summary>اردو</summary>\n\n<div dir="rtl">\n\n${notes.ur.map((n) => `- ${n}`).join('\n')}\n\n</div>\n</details>\n`;
write('CHANGELOG.md', log.replace(marker, `${marker}\n\n${section}`));
write('release/next.json', JSON.stringify({ ar: [], en: [], ur: [] }, null, 2) + '\n');
// the manual of this version, from the same strings the Guide tab shows
mkdirSync(new URL('docs/manual/', root), { recursive: true });
const manual = await manualText();
write(manualPath(manual.version), manual.text);
write('docs/manual/README.md', indexText());
console.log(`✓ v${current} → v${next} stamped in config.js, sw.js, version.json and CHANGELOG.md; manual ${manualPath(next)} written`);
console.log('  before you push: did a feature change? then the Guide strings (g_* in core.js, three languages) must say so —');
console.log('  edit them and run node scripts/build-manual.mjs. Also review docs/START-HERE.md, docs/data-format.md and docs/kpi-factors.md.');
console.log('  Urdu: have a native speaker on the team read the new strings before the team relies on them.');
