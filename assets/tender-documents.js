// Text extraction only. Originals are retained even when a document cannot be read.
import { tenderDocumentInsights, cleanTenderAnalysis } from '../core.js';
const MAX_BYTES = 25 * 1024 * 1024, MAX_TEXT = 180000, MAX_PAGES = 120;
let pdfLibrary, zipLibrary;
const unzip = async () => zipLibrary ||= import('./vendor/fflate.mjs');

export async function readTenderDocument(file, { loadXlsx, DOMParser: XmlParser = globalThis.DOMParser } = {}) {
  const ext = String(file.name || '').split('.').pop().toLowerCase();
  const format = ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : /^(xlsx|xls|xlsm|csv|tsv)$/.test(ext) ? 'sheet' : ext === 'txt' ? 'text' : '';
  const base = { format, readAt: new Date().toISOString() };
  if (!format) return { analysis: cleanTenderAnalysis({ ...base, state: 'unsupported' }) };
  if (file.size > MAX_BYTES) return { analysis: cleanTenderAnalysis({ ...base, state: 'large' }) };
  const segments = [], tables = []; let chars = 0, partial = false;
  const add = (text, locator = '') => {
    const remaining = MAX_TEXT - chars;
    if (text.length > remaining) partial = true;
    const clipped = text.slice(0, remaining); chars += clipped.length;
    if (clipped.trim()) segments.push({ text: clipped, locator });
  };
  try {
    if (format === 'pdf') {
      const pdf = await (pdfLibrary ||= import('./vendor/pdf.min.mjs').catch(error => { pdfLibrary = null; throw error; }));
      pdf.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
      const task = pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false,
        useSystemFonts: false, useWorkerFetch: false, cMapPacked: true,
        cMapUrl: new URL('./vendor/cmaps/', import.meta.url).href,
        standardFontDataUrl: new URL('./vendor/standard_fonts/', import.meta.url).href,
        wasmUrl: new URL('./vendor/wasm/', import.meta.url).href });
      // A password prompt cannot be answered during batch import; keep the file and flag it for review.
      let passwordNeeded = false;
      task.onPassword = () => { passwordNeeded = true; void task.destroy(); };
      let timeout;
      try {
        const document = await Promise.race([task.promise, new Promise((_, reject) => {
          timeout = setTimeout(() => { void task.destroy(); reject(new Error('read-timeout')); }, 45000);
        })]);
        partial = document.numPages > MAX_PAGES;
        for (let pageNo = 1; pageNo <= Math.min(document.numPages, MAX_PAGES) && chars < MAX_TEXT; pageNo++) {
          const page = await document.getPage(pageNo), content = await page.getTextContent();
          const lines = []; let line = '', previousY = null;
          for (const item of content.items) {
            if (typeof item.str !== 'string') continue;
            const y = item.transform?.[5];
            if (line && previousY != null && Math.abs(y - previousY) > 3) { lines.push(line); line = ''; }
            line += (line ? ' ' : '') + item.str; previousY = y;
            if (item.hasEOL) { lines.push(line); line = ''; previousY = null; }
          }
          if (line) lines.push(line);
          const pageText = lines.join('\n');
          if (!pageText.trim()) partial = true;
          add(pageText, String(pageNo)); page.cleanup();
          if (chars >= MAX_TEXT && pageNo < document.numPages) partial = true;
        }
      } catch (error) {
        if (passwordNeeded) return {analysis:cleanTenderAnalysis({...base,state:'locked'})};
        throw error;
      } finally { clearTimeout(timeout); await task.destroy(); }
    } else if (format === 'docx') {
      const { unzipSync, strFromU8 } = await unzip(); let oversize = false;
      const zip = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter(entry) {
        if (entry.name !== 'word/document.xml') return false;
        if (entry.originalSize > 8 * 1024 * 1024) { oversize = true; return false; }
        return true;
      } });
      if (oversize) return { analysis: cleanTenderAnalysis({ ...base, state: 'large' }) };
      if (!zip['word/document.xml']) throw new Error('invalid-docx');
      const doc = new XmlParser().parseFromString(strFromU8(zip['word/document.xml']), 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error('invalid-xml');
      const paragraphs = [...doc.getElementsByTagNameNS('*','p')];
      const text = paragraphs.map(p => [...p.getElementsByTagNameNS('*','t')].map(t => t.textContent).join('')).join('\n');
      add(text);
      for (const table of [...doc.getElementsByTagNameNS('*','tbl')].slice(0,5)) {
        const rows = [...table.getElementsByTagNameNS('*','tr')].slice(0,31).map(row => [...row.getElementsByTagNameNS('*','tc')].slice(0,16).map(cell => cell.textContent.slice(0,300)));
        tables.push({ name: '', rows });
      }
    } else if (format === 'sheet') {
      const bytes = new Uint8Array(await file.arrayBuffer());
      // Reject oversized expanded OOXML before the spreadsheet parser allocates its XML strings.
      if (/^xls[xm]$/.test(ext)) {
        const { unzipSync } = await unzip(); let expanded = 0;
        unzipSync(bytes, { filter(entry) {
          if (/\.(xml|rels)$/i.test(entry.name)) expanded += entry.originalSize;
          if (expanded > 25 * 1024 * 1024) throw new Error('expanded-too-large');
          return false;
        } });
      }
      const X = await loadXlsx();
      const workbook = X.read(bytes, { type: 'array', sheetRows: 401, cellHTML: false, cellFormula: false, cellDates: false });
      partial = workbook.SheetNames.length > 20;
      for (const name of workbook.SheetNames.slice(0,20)) {
        const sheet = workbook.Sheets[name];
        const rows = X.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '', blankrows: false });
        if (sheet['!fullref'] || rows.length > 400 || rows.some(row => row.length > 32)) partial = true;
        add(rows.slice(0,400).map(row => row.slice(0,32).join(' | ')).join('\n'), name);
        if (tables.length < 5) tables.push({name,rows:rows.slice(0,31).map(row => row.slice(0,16).map(cell => String(cell).slice(0,300)))});
      }
    } else add(await file.text());
    const findings = tenderDocumentInsights(segments);
    return { kind: findings.kind, analysis: cleanTenderAnalysis({ ...base, ...findings, tables, state: !chars ? 'empty' : partial ? 'partial' : 'read' }) };
  } catch (error) {
    if (segments.length) return {analysis:cleanTenderAnalysis({...base,...tenderDocumentInsights(segments),tables,state:'partial'})};
    const state = error?.message === 'expanded-too-large' ? 'large' : error?.name === 'PasswordException' ? 'locked' : 'error';
    return { analysis: cleanTenderAnalysis({ ...base, state }) };
  }
}
