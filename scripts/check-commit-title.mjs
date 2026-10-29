// scripts/check-commit-title.mjs — a commit title has to say what changed. A release commit starts with its version.
import { readFileSync } from 'node:fs';
const title = readFileSync(process.argv[2], 'utf8').split('\n').find((l) => l.trim() && !l.startsWith('#')) || '';
const t = title.trim();
const vague = /^(update|updates|fix|fixes|wip|changes|misc|tmp|test|تعديل|تعديلات|تحديث|اصلاح|إصلاح)\.?$/i;
if (t.length < 8 || vague.test(t)) {
  console.error(`✗ عنوان الالتزام لازم يقول إيه اللي اتغير — «${t}» مش كفاية.\n  مثال: v5.1 — أمر كلود كروم بيقرا تاريخ الإكمال من السجل`);
  process.exit(1);
}
const versionJson = JSON.parse(readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
if (/^v\d+\.\d+/.test(t) && !t.startsWith(`v${versionJson.version} `)) {
  console.error(`✗ العنوان بيقول ${t.split(' ')[0]} والنسخة المختومة v${versionJson.version} — شغّل scripts/bump.mjs الأول`);
  process.exit(1);
}
