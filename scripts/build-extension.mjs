// Writes extension/pull.js from core.js (ADR-0062). The guard fails a release when the file and core.js disagree.
import { writeFileSync } from 'node:fs';
import { extensionPullScript } from '../core.js';
writeFileSync(new URL('../extension/pull.js', import.meta.url), extensionPullScript());
console.log('extension/pull.js written');
