// AFAQY Jeddah portal — sync (ADR-0062). Runs on the portal: tells it the extension is here, keeps the recipe it sends (data only),
// and hands it the last pull kept in this browser.
(() => {
  document.documentElement.dataset.afaqyExt = chrome.runtime.getManifest().version;
  const S = chrome.storage.local, send = (m) => window.postMessage(m, location.origin);
  const state = async () => {
    const st = await S.get(['lastAt', 'status', 'error', 'recipe', 'packet', 'packetAt']);
    send({ type: 'afaqy-ext-state', lastAt: st.lastAt || null, status: st.status || '', error: st.error || '', recipeTo: st.recipe ? st.recipe.TO : null });
    if (st.packet) send({ type: 'afaqy-ext-packet', packet: st.packet, at: st.packetAt || null });
  };
  window.addEventListener('message', async (e) => {
    if (e.source !== window || e.origin !== location.origin || !e.data) return;
    const d = e.data;
    if (d.type === 'afaqy-ext-hello') state();
    if (d.type === 'afaqy-ext-recipe' && d.recipe && d.recipe.DEL === 'ext') { await S.set(d.now ? { recipe: d.recipe, want: 'close', status: '' } : { recipe: d.recipe }); state(); }
    if (d.type === 'afaqy-ext-got') await S.remove(['packet']);
  });
  chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && (ch.packet || ch.status || ch.lastAt)) state(); });
})();
