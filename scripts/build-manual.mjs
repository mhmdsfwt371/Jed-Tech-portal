// scripts/build-manual.mjs — the user manual of the current version, generated from the same strings the Guide tab shows.
// One file per version in docs/manual/, never overwritten once released, plus an index of every version.
//   node scripts/build-manual.mjs           writes docs/manual/user-manual-v<version>.md and docs/manual/README.md
//   import { manualText } from it           used by the guard to prove the file matches the strings
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const LANG_TITLES = { ar: 'العربية', en: 'English', ur: 'اردو' };
const MANUAL_TITLE = { ar: 'دليل المستخدم — بوابة الفريق التقني بجدة', en: 'User manual — Jeddah technical team portal', ur: 'استعمال کی رہنمائی — جدہ کی تکنیکی ٹیم کا پورٹل' };
const NEWS_TITLE = { ar: 'ما الجديد في هذه النسخة', en: 'What is new in this version', ur: 'اس ورژن میں نیا کیا ہے' };

export async function manualText() {
  const { STRINGS, LANGS, GUIDE, DEFINITIONS } = await import(new URL('core.js', root));
  const release = JSON.parse(readFileSync(new URL('version.json', root), 'utf8'));
  const tr = (lang, key, vars = {}) => String(STRINGS[lang][key]).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  const out = [`# ${MANUAL_TITLE.ar} | ${MANUAL_TITLE.en} | ${MANUAL_TITLE.ur}`, '',
    `**v${release.version} — ${release.date}**`, '',
    // each language is a whole, separate section — never mixed within a section
    ...LANGS.map((l) => `- [${LANG_TITLES[l]}](#${l})`), ''];
  for (const lang of LANGS) {
    const dir = lang === 'en' ? 'ltr' : 'rtl';
    out.push(`<a id="${lang}"></a>`, '', `<div dir="${dir}">`, '', `## ${LANG_TITLES[lang]} — ${MANUAL_TITLE[lang]}`, '',
      tr(lang, 'g_version', { v: release.version, date: release.date }), '',
      `### ${NEWS_TITLE[lang]}`, '', ...(release.notes[lang] || []).map((n) => `- ${n}`), '');
    for (const [h, b] of GUIDE) out.push(`### ${tr(lang, h)}`, '', tr(lang, b), '');
    out.push(`### ${tr(lang, 'definitions')}`, '', ...DEFINITIONS.map((k) => `- ${tr(lang, k)}`), '', '</div>', '');
  }
  return { version: release.version, text: out.join('\n') };
}

export const manualPath = (v) => `docs/manual/user-manual-v${v}.md`;

function indexText() {
  const files = readdirSync(new URL('docs/manual/', root)).filter((f) => /^user-manual-v[\d.]+\.md$/.test(f))
    .sort((a, b) => {
      const va = a.match(/v([\d.]+)\.md/)[1].split('.').map(Number), vb = b.match(/v([\d.]+)\.md/)[1].split('.').map(Number);
      return vb[0] - va[0] || vb[1] - va[1];
    });
  return ['# أدلة المستخدم لكل نسخة | User manuals by version', '',
    'كل نسخة لها دليلها، يُولَّد من نصوص تبويب «الدليل» نفسها عند ختم النسخة، ولا يُعدَّل بعد صدوره.',
    'Every version has its own manual, generated from the Guide tab strings when the version is stamped, and never edited after release.', '',
    ...files.map((f, i) => `- [${f.replace('user-manual-', '').replace('.md', '')}](${f})${i === 0 ? ' — الحالية · current' : ''}`), ''].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(new URL('docs/manual/', root), { recursive: true });
  const { version, text } = await manualText();
  writeFileSync(new URL(manualPath(version), root), text);
  writeFileSync(new URL('docs/manual/README.md', root), indexText());
  console.log(`✓ ${manualPath(version)} and docs/manual/README.md written`);
}
export { indexText };
