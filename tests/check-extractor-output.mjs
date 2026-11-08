// Reads an extractor file with the portal's own reader (core.js maParse) — the Windows build runs it on the .exe's output,
// so a file the portal would refuse never ships.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { maParse } from '../core.js';
const f = process.argv[2]; const raw = readFileSync(f);
const gz = raw[0] === 0x1f && raw[1] === 0x8b; const text = (gz ? gunzipSync(raw) : raw).toString('utf8');
const first = text.split(/\r?\n/)[0];
console.log(`bytes ${raw.length} · gzip ${gz} · first line ${JSON.stringify(first.slice(0, 160))}`);
const p = maParse(text);
if (p.error) { console.error(`REFUSED by the portal: ${p.error}`); process.exit(1); }
console.log(`accepted by the portal: ${p.recs.length} records, ${p.bad} bad lines, schema ${p.head.schema}, helper ${p.head.helper}`);
if (!p.recs.length) process.exit(1);
