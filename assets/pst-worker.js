// ADR-0097 — reads an Outlook PST in the background, straight from the disk, a piece at a time.
// The library asks «N bytes at position X»; we answer from file.slice() through FileReaderSync (allowed in workers),
// with a small block cache. The file is never loaded whole, so memory does not grow with its size.
self.window = self;
importScripts('./vendor/pst-extractor.min.js');
const BS = 256 * 1024, MAX_BLOCKS = 96;   // 256 KB pieces, at most 24 MB cached
let file = null, frs = null, cache = new Map(), bytesRead = 0, reads = 0;
function block(i) {
  let b = cache.get(i);
  if (b) { cache.delete(i); cache.set(i, b); return b; }
  const from = i * BS, to = Math.min(file.size, from + BS);
  b = new Uint8Array(frs.readAsArrayBuffer(file.slice(from, to))); bytesRead += b.length; reads++;
  cache.set(i, b); if (cache.size > MAX_BLOCKS) cache.delete(cache.keys().next().value);
  return b;
}
self.__pstFs = {
  openSync() { return 3; }, closeSync() {}, existsSync() { return true; }, fstatSync() { return { size: file.size }; },
  readSync(fd, buf, off, len, pos) {
    let done = 0;
    while (done < len && pos + done < file.size) {
      const p = pos + done, bi = Math.floor(p / BS), b = block(bi), o = p - bi * BS, n = Math.min(len - done, b.length - o);
      buf.set(b.subarray(o, o + n), off + done); done += n;
    }
    return done;
  },
};
const iso = (d) => { try { return d ? new Date(d).toISOString() : ''; } catch { return ''; } };
self.onmessage = (e) => {
  const { file: f, attFrom, attTo } = e.data; file = f; frs = new FileReaderSync(); cache = new Map(); bytesRead = 0; reads = 0;
  const t0 = Date.now(), out = []; let n = 0;
  try {
    const pst = new self.PSTFile('file.pst');
    const walk = (fo, path) => {
      if (fo.hasSubfolders) for (const c of fo.getSubFolders()) walk(c, path ? `${path}/${c.displayName}` : String(c.displayName || ''));
      if (fo.contentCount > 0) { let m = fo.getNextChild(), g = 0;
        while (m && g++ < 2000000) {
          const sent = iso(m.clientSubmitTime), recv = iso(m.messageDeliveryTime), day = (sent || recv).slice(0, 10);
          const r = { d: m.descriptorNodeId, folder: path || '/', subject: String(m.subject || '').slice(0, 300), senderName: String(m.senderName || '').slice(0, 120),
            senderEmailAddress: String(m.senderEmailAddress || '').slice(0, 200), displayTo: String(m.displayTo || '').slice(0, 300), internetMessageId: String(m.internetMessageId || '').slice(0, 300),
            clientSubmitTime: sent, messageDeliveryTime: recv };
          if (attFrom && m.hasAttachments && day && day >= attFrom && day <= attTo) {   // attachment names only, only when asked, only in the period
            r.att = []; for (let i = 0; i < Math.min(30, m.numberOfAttachments || 0); i++) { try { const x = m.getAttachment(i); r.att.push(String(x.longFilename || x.filename || '')); } catch { /* a name missing */ } }
          }
          out.push(r); n++;
          if (n % 2000 === 0) self.postMessage({ type: 'progress', n, mb: Math.round(bytesRead / 1048576), size: file.size, sec: Math.round((Date.now() - t0) / 1000) });
          m = fo.getNextChild(); } } };
    walk(pst.getRootFolder(), '');
    self.postMessage({ type: 'done', recs: out, stats: { n, bytesRead, reads, size: file.size, sec: (Date.now() - t0) / 1000, cacheMb: Math.round(MAX_BLOCKS * BS / 1048576) } });
  } catch (err) { self.postMessage({ type: 'error', name: String(err && err.name || ''), message: String(err && err.message || err) }); }   // NotReadableError: the file is locked (open in Outlook)
};
