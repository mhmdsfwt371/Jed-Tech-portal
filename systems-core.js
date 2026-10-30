// Shared links are untrusted input: reject malformed entries and non-web protocols before rendering.
export function validateSystems(data) {
  if (!data || data.schema !== 'afaqy-links/v1' || !Array.isArray(data.categories) || !Array.isArray(data.systems)) return null;
  if (data.categories.length > 100 || data.systems.length > 1000) return null;
  const ids = new Set(), entries = new Set();
  const validName = (name) => name && ['ar', 'en', 'ur'].every((l) => typeof name[l] === 'string' && name[l].trim().length > 0 && name[l].length <= 150);
  for (const c of data.categories) {
    if (!c || typeof c.id !== 'string' || !/^[a-z0-9_-]{1,64}$/.test(c.id) || ids.has(c.id) || !validName(c.name)) return null;
    ids.add(c.id);
  }
  for (const x of data.systems) {
    if (!x || typeof x.id !== 'string' || !/^[a-z0-9_-]{1,64}$/.test(x.id) || entries.has(x.id) || !ids.has(x.category) || !validName(x.name) || typeof x.url !== 'string' || x.url.length > 2048) return null;
    try { const u = new URL(x.url); if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return null; } catch { return null; }
    entries.add(x.id);
  }
  return data;
}
