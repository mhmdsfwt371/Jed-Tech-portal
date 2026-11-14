// One command for every browser suite (ADR-0129). Until now each suite was run by hand, by name, and two of them could share a
// port — so "all suites pass" depended on remembering sixteen names. A suite added to tests/browser/ is picked up without touching this file.
//   node scripts/browser-suites.mjs            every suite, four at a time
//   node scripts/browser-suites.mjs smoke me   only the named ones
// Each suite gets its own port. Exit code 1 when any suite fails; the failing lines are printed, the passing ones are counted.
// A suite that needs the real pull and did not find it is reported as skipped — never as passed.
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'tests', 'browser');
const all = readdirSync(dir).filter((f) => f.endsWith('.py')).map((f) => f.slice(0, -3)).sort();
const want = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const unknown = want.filter((w) => !all.includes(w));
if (unknown.length) { console.error('No such suite: ' + unknown.join(', ') + '\nSuites: ' + all.join(' ')); process.exit(2); }
const suites = want.length ? want : all;
const WIDTH = Math.max(1, Number(process.env.SUITES_AT_ONCE) || 4);
const BASE = Number(process.env.PORT_BASE) || 9400;

function run(name, port) {
  return new Promise((done) => {
    const t0 = Date.now(); let out = '';
    const p = spawn('python3', [join(dir, name + '.py')], { cwd: root, env: { ...process.env, PORT: String(port) } });
    p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { out += d; });
    p.on('close', (code) => {
      const lines = out.split('\n');
      const pass = lines.filter((l) => l.startsWith('PASS')).length;
      const fail = lines.filter((l) => l.startsWith('**FAIL**'));
      const notes = lines.filter((l) => l.startsWith('NOTE'));
      const skipped = code === 0 && !pass && lines.some((l) => l.startsWith('SKIP'));
      // A suite that died before its last line (a Python error) has no FAIL lines: its tail is the evidence.
      const crashed = code !== 0 && !fail.length;
      done({ name, code, pass, fail, notes, skipped, crashed, tail: crashed ? lines.slice(-12).join('\n') : '', secs: Math.round((Date.now() - t0) / 1000) });
    });
  });
}

// A suite that measures time (the pager counts frames and waits for the window to settle) fails under load on any version —
// four of them at once failed one check in two runs on 9.54 too. Such a suite says «# suite: alone» and runs after the others,
// with the machine to itself.
const alone = new Set(suites.filter((n) => /^# suite: alone/m.test(readFileSync(join(dir, n + '.py'), 'utf8'))));
const queue = suites.filter((n) => !alone.has(n)).map((name, i) => ({ name, port: BASE + i }));
const later = suites.filter((n) => alone.has(n)).map((name, i) => ({ name, port: BASE + 100 + i }));
const results = [];
async function worker() {
  for (;;) {
    const job = queue.shift(); if (!job) return;
    const r = await run(job.name, job.port); results.push(r);
    console.log(r.skipped ? `skip  ${r.name.padEnd(14)} needs the real pull (OCT_PULL)` : `${r.code === 0 ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(14)} ${String(r.pass).padStart(3)} passed${r.fail.length ? ', ' + r.fail.length + ' failed' : ''}  (${r.secs}s)`);
    for (const l of r.fail) console.log('      ' + l);
    for (const l of r.notes) console.log('      ' + l);
    if (r.crashed) console.log(r.tail.split('\n').map((l) => '      ' + l).join('\n'));
  }
}
await Promise.all(Array.from({ length: Math.min(WIDTH, queue.length) }, worker));
queue.push(...later); await worker();
const bad = results.filter((r) => r.code !== 0);
const checks = results.reduce((n, r) => n + r.pass, 0);
const skipped = results.filter((r) => r.skipped);
// a skipped suite proved nothing: it is counted apart, never as green
console.log(`\n${results.length - skipped.length} suites ran, ${checks} checks passed` + (skipped.length ? `, ${skipped.length} skipped (no real pull): ${skipped.map((r) => r.name).join(', ')}` : '') + (bad.length ? ` — ${bad.length} FAILED: ${bad.map((r) => r.name).join(', ')}` : ' — nothing failed'));
process.exit(bad.length ? 1 : 0);
